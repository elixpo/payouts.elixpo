"use client";

export const runtime = "edge";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import PageShell from "../../../components/page-shell";
import "../../fundraiser.css";

const SYMBOL: Record<string, string> = { INR: "₹", USD: "$" };
const fmt = (minor: number, cur: string) =>
    `${SYMBOL[cur] ?? `${cur} `}${(minor / 100).toLocaleString(cur === "INR" ? "en-IN" : "en-US", { maximumFractionDigits: 2 })}`;

function Thanks() {
    const { slug } = useParams<{ slug: string }>();
    const id = useSearchParams().get("c") || "";
    const [c, setC] = useState<any>(null);
    const [gaveUp, setGaveUp] = useState(false);

    // Poll until the payment is confirmed (client confirm or Razorpay webhook).
    useEffect(() => {
        if (!id) return;
        let tries = 0;
        let stop = false;
        const tick = async () => {
            tries++;
            const r = await fetch(`/api/fundraisers/contributions/${encodeURIComponent(id)}`, { cache: "no-store" }).catch(
                () => null,
            );
            const d: any = r?.ok ? await r.json() : null;
            if (stop) return;
            if (d) setC(d);
            if (d?.status === "paid") return;
            if (tries >= 20) return setGaveUp(true);
            setTimeout(tick, 2000);
        };
        tick();
        return () => {
            stop = true;
        };
    }, [id]);

    const paid = c?.status === "paid";
    const shown =
        c && (c.display_currency && c.display_currency !== c.currency
            ? `${fmt(c.display_amount, c.display_currency)} (${fmt(c.amount, c.currency)})`
            : fmt(c.amount, c.currency));

    return (
        <div className="fr-thanks">
            {paid ? (
                <>
                    <p className="eyebrow">Contribution received</p>
                    <h1 className="display">
                        Thank you{c.name ? `, ${c.name}` : ""}<em>.</em>
                    </h1>
                    <p>
                        Your {shown} contribution to <strong>{c.fundraiser.title}</strong> went through. A receipt is on
                        its way to your inbox.
                    </p>
                    {c.fundraiser.thank_you_message && (
                        <blockquote>
                            {c.fundraiser.thank_you_message}
                            {c.fundraiser.owner_name ? `\n— ${c.fundraiser.owner_name}` : ""}
                        </blockquote>
                    )}
                </>
            ) : gaveUp || !id ? (
                <>
                    <p className="eyebrow">Almost there</p>
                    <h1 className="display">We're still confirming your payment.</h1>
                    <p>
                        This can take a minute. If money left your account, the contribution will be recorded and you'll
                        get a receipt by email — there's no need to pay again.
                    </p>
                </>
            ) : (
                <>
                    <p className="eyebrow">One moment</p>
                    <h1 className="display">Confirming your payment…</h1>
                    <p>Please keep this page open.</p>
                </>
            )}
            <div className="actions">
                <Link href={`/f/${slug}`}>Back to the fundraiser</Link>
                {paid && typeof navigator !== "undefined" && (
                    <button
                        type="button"
                        className="pill-link ghost"
                        onClick={() => {
                            const url = `${window.location.origin}/f/${slug}`;
                            if (navigator.share) navigator.share({ title: c.fundraiser.title, url }).catch(() => {});
                            else navigator.clipboard?.writeText(url);
                        }}
                    >
                        Share this fundraiser
                    </button>
                )}
            </div>
        </div>
    );
}

export default function ThanksPage() {
    return (
        <PageShell>
            <Suspense fallback={<div className="fr-thanks" />}>
                <Thanks />
            </Suspense>
        </PageShell>
    );
}
