"use client";

import { useMemo, useState } from "react";

type Cur = "INR" | "USD";

declare global {
    interface Window {
        Razorpay?: any;
    }
}

const SYMBOL: Record<Cur, string> = { INR: "₹", USD: "$" };
const fmt = (minor: number, cur: Cur) =>
    `${SYMBOL[cur]}${(minor / 100).toLocaleString(cur === "INR" ? "en-IN" : "en-US", { maximumFractionDigits: 2 })}`;

function loadRazorpay(): Promise<boolean> {
    return new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
    });
}

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;
// Common domain typos → suggestion ("did you mean …?").
const DOMAIN_FIXES: Record<string, string> = {
    "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmal.com": "gmail.com", "gamil.com": "gmail.com",
    "gnail.com": "gmail.com", "gmail.co": "gmail.com", "gmail.con": "gmail.com", "gmail.cm": "gmail.com",
    "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com", "yahoo.co": "yahoo.com",
    "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com", "outlok.com": "outlook.com", "outllook.com": "outlook.com",
    "iclod.com": "icloud.com", "icloud.co": "icloud.com",
};

function emailProblem(raw: string): { error?: string; suggest?: string } {
    const v = raw.trim();
    if (!v) return { error: "Enter your email so we can send your receipt." };
    if (!EMAIL_RE.test(v)) return { error: "That doesn't look like a complete email address (name@example.com)." };
    const [user, domain] = v.split("@");
    const fix = DOMAIN_FIXES[domain.toLowerCase()];
    return fix ? { suggest: `${user}@${fix}` } : {};
}

export default function ContributeForm({
    slug,
    title,
    presets,
    limits,
    rate,
    rateAsOf,
    initialCurrency,
    open,
    closedReason,
    mostChosen = {},
    ownerName,
}: {
    slug: string;
    title: string;
    presets: Record<Cur, number[]>;
    limits: Record<Cur, { min: number; max: number }>;
    rate: number;
    rateAsOf: string;
    initialCurrency: Cur;
    open: boolean;
    closedReason: string;
    /** The preset most supporters actually chose (per currency), if any. */
    mostChosen?: Partial<Record<Cur, number>>;
    ownerName: string;
}) {
    const startPick = (c: Cur) => {
        const pop = mostChosen[c];
        return pop !== undefined && presets[c].includes(pop) ? pop : (presets[c][1] ?? presets[c][0] ?? null);
    };
    const [cur, setCur] = useState<Cur>(initialCurrency);
    const [picked, setPicked] = useState<number | null>(startPick(initialCurrency));
    const [emailTouched, setEmailTouched] = useState(false);
    const [showFlow, setShowFlow] = useState(false);
    const [custom, setCustom] = useState("");
    const [name, setName] = useState("");
    const [showName, setShowName] = useState(true);
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const amount = useMemo(() => {
        if (custom.trim()) {
            const v = Math.round(Number(custom.replace(/[, ]/g, "")) * 100);
            return Number.isFinite(v) ? v : Number.NaN;
        }
        return picked ?? Number.NaN;
    }, [custom, picked]);

    const lim = limits[cur];
    const validAmount = Number.isInteger(amount) && amount >= lim.min && amount <= lim.max;
    const inrCharge = cur === "USD" && validAmount ? Math.round((amount / 100) * rate) * 100 : null;
    const belowMin = Number.isFinite(amount) && amount > 0 && amount < lim.min;
    const aboveMax = Number.isFinite(amount) && amount > lim.max;
    const emailCheck = emailProblem(email);
    const emailOk = !emailCheck.error;

    if (!open) {
        return (
            <>
                <h2>Contribute</h2>
                <p className="fr-closed">{closedReason}</p>
            </>
        );
    }

    const switchCurrency = (c: Cur) => {
        setCur(c);
        setCustom("");
        setPicked(startPick(c));
        setError(null);
    };

    const goThanks = (id: string) => {
        window.location.href = `/f/${encodeURIComponent(slug)}/thanks?c=${encodeURIComponent(id)}`;
    };

    const pay = async () => {
        setError(null);
        if (!validAmount) {
            setError(`Choose an amount between ${fmt(lim.min, cur)} and ${fmt(lim.max, cur)}.`);
            return;
        }
        if (!emailOk) {
            setEmailTouched(true);
            setError(emailCheck.error ?? "Enter a valid email.");
            return;
        }
        setBusy(true);
        try {
            const [res, loaded] = await Promise.all([
                fetch(`/api/fundraisers/${encodeURIComponent(slug)}/contribute`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        currency: cur,
                        amount,
                        email: email.trim(),
                        name: name.trim(),
                        show_name: showName && !!name.trim(),
                        message: message.trim(),
                    }),
                }),
                loadRazorpay(),
            ]);
            const d: any = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(d.error_description || "Couldn't start the payment. Please try again.");

            if (d.test_mode) {
                await fetch(`/api/fundraisers/contributions/${d.contribution_id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ test: true }),
                });
                return goThanks(d.contribution_id);
            }
            if (!loaded || !window.Razorpay) throw new Error("Couldn't load the payment window. Check your connection and retry.");

            const rzp = new window.Razorpay({
                key: d.key_id,
                order_id: d.order_id,
                amount: d.amount,
                currency: d.currency,
                name: "Elixpo Pay",
                description: title.slice(0, 250),
                image: `${window.location.origin}/icon.png`,
                prefill: { email: d.prefill?.email, name: d.prefill?.name || undefined },
                notes: { fundraiser: slug },
                theme: { color: "#142018" },
                handler: async (resp: any) => {
                    // Confirm server-side (signature check). If this request
                    // fails, the thank-you page still polls and the Razorpay
                    // webhook finalises the contribution.
                    try {
                        await fetch(`/api/fundraisers/contributions/${d.contribution_id}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(resp),
                        });
                    } catch {
                        /* the webhook is the backstop */
                    }
                    goThanks(d.contribution_id);
                },
                modal: {
                    ondismiss: () => setBusy(false),
                },
            });
            rzp.on?.("payment.failed", (r: any) => {
                setError(r?.error?.description || "The payment didn't go through. You weren't charged — try again.");
                setBusy(false);
            });
            rzp.open();
        } catch (e: any) {
            setError(e?.message || "Something went wrong. Please try again.");
            setBusy(false);
        }
    };

    return (
        <>
            <h2>Contribute</h2>
            <p className="fr-sub">Any amount helps. No account needed.</p>

            <fieldset className="fr-switch" aria-label="Currency">
                {(["INR", "USD"] as Cur[]).map((c) => (
                    <button key={c} type="button" aria-pressed={cur === c} onClick={() => switchCurrency(c)}>
                        {SYMBOL[c]} {c}
                    </button>
                ))}
            </fieldset>

            <fieldset className="fr-presets" aria-label="Choose an amount">
                {presets[cur].map((p) => (
                    <button
                        key={p}
                        type="button"
                        aria-pressed={!custom.trim() && picked === p}
                        onClick={() => {
                            setPicked(p);
                            setCustom("");
                            setError(null);
                        }}
                    >
                        {fmt(p, cur)}
                        {mostChosen[cur] === p && <span className="fr-tag">Most chosen</span>}
                    </button>
                ))}
            </fieldset>

            <div className="fr-field">
                <label htmlFor="fr-custom">Or enter an amount</label>
                <div className="fr-amount">
                    <span aria-hidden>{SYMBOL[cur]}</span>
                    <input
                        id="fr-custom"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder={(lim.min / 100).toString()}
                        value={custom}
                        onChange={(e) => setCustom(e.target.value.replace(/[^\d.,]/g, ""))}
                        aria-invalid={belowMin || aboveMax}
                        aria-describedby="fr-amount-hint"
                    />
                </div>
                <p id="fr-amount-hint" className={`fr-hint${belowMin || aboveMax ? " bad" : ""}`}>
                    {belowMin
                        ? `The minimum is ${fmt(lim.min, cur)}.`
                        : aboveMax
                          ? `The maximum is ${fmt(lim.max, cur)} per contribution.`
                          : `Minimum ${fmt(lim.min, cur)}.`}
                </p>
            </div>

            <div className="fr-field">
                <label htmlFor="fr-email">Email for your receipt</label>
                <input
                    id="fr-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value.replace(/\s/g, ""))}
                    onBlur={() => setEmailTouched(true)}
                    aria-invalid={emailTouched && !emailOk}
                    aria-describedby="fr-email-hint"
                    placeholder="you@example.com"
                />
                {emailTouched && emailCheck.error && (
                    <p id="fr-email-hint" className="fr-hint bad">
                        {emailCheck.error}
                    </p>
                )}
                {emailCheck.suggest && (
                    <p id="fr-email-hint" className="fr-hint">
                        Did you mean{" "}
                        <button type="button" className="fr-linkbtn" onClick={() => setEmail(emailCheck.suggest ?? email)}>
                            {emailCheck.suggest}
                        </button>
                        ?
                    </p>
                )}
            </div>
            <div className="fr-field">
                <label htmlFor="fr-name">Your name (optional)</label>
                <input id="fr-name" autoComplete="name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <label className="fr-check">
                <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} />
                Show my name on the page
            </label>
            <div className="fr-field">
                <label htmlFor="fr-msg">Message (optional)</label>
                <textarea id="fr-msg" maxLength={280} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>

            <button type="button" className="fr-pay" onClick={pay} disabled={busy || !validAmount || (emailTouched && !emailOk)}>
                {busy ? "Opening payment…" : validAmount ? `Pay ${fmt(amount, cur)}` : "Pay"}
            </button>
            {error && (
                <p className="fr-error" role="alert">
                    {error}
                </p>
            )}
            <p className="fr-note">
                {inrCharge != null
                    ? `${fmt(inrCharge, "INR")} will be charged in INR at today's rate (1 USD = ₹${rate.toFixed(2)}${
                          rateAsOf ? `, as of ${new Date(rateAsOf).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}` : ""
                      }). International cards accepted. `
                    : ""}
                UPI, cards and netbanking via Razorpay. Your email is only used for the receipt.
            </p>
            <button type="button" className="fr-flow-toggle" aria-expanded={showFlow} onClick={() => setShowFlow((v) => !v)}>
                🔒 How your money gets to {ownerName} {showFlow ? "▴" : "▾"}
            </button>
            {showFlow && (
                <div className="fr-flow">
                    <ol>
                        <li>
                            <b>You pay</b>
                            <span>UPI, card or netbanking on Razorpay's secure checkout — we never see card details.</span>
                        </li>
                        <li>
                            <b>Razorpay</b>
                            <span>An RBI-licensed payment gateway confirms the payment.</span>
                        </li>
                        <li>
                            <b>Elixpo Pay</b>
                            <span>Records it, updates the total and emails your receipt.</span>
                        </li>
                        <li>
                            <b>{ownerName}</b>
                            <span>Paid to their bank account, verified through Razorpay KYC.</span>
                        </li>
                    </ol>
                    <a href="/docs/fundraisers#money-flow" target="_blank" rel="noopener noreferrer">
                        Read how fundraisers work ↗
                    </a>
                </div>
            )}
        </>
    );
}
