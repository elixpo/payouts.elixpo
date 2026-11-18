import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "../components/page-shell";

export const metadata: Metadata = {
    title: "Trust & safety",
    description:
        "How Elixpo Pay handles your money and data: payments through Razorpay, payouts to KYC-verified bank accounts, every payment counted once, signed webhooks, hashed keys, moderation and open-source code.",
    alternates: { canonical: "/trust" },
    openGraph: { url: "/trust", title: "Trust & safety | Elixpo Pay" },
};

const SECTIONS: { tag: string; title: string; body: React.ReactNode }[] = [
    {
        tag: "Payments",
        title: "Your card and UPI details never reach us",
        body: (
            <>
                Every payment happens on the checkout of <strong>Razorpay</strong>, an RBI-regulated payment gateway. Card
                numbers, UPI PINs and bank logins are entered there and handled by Razorpay — Elixpo Pay only learns that a
                payment succeeded, for how much, and its reference.
            </>
        ),
    },
    {
        tag: "Payouts",
        title: "Money goes to a verified bank account",
        body: (
            <>
                When a creator connects payouts, each payment is split by <strong>Razorpay Route</strong> straight to their
                bank account, which Razorpay verifies through KYC; Elixpo Pay keeps a 2% platform fee. A fundraiser can only
                go public once its payouts are connected. Elixpo's own products and fundraisers settle to Elixpo's account.
            </>
        ),
    },
    {
        tag: "Accuracy",
        title: "Every payment is counted exactly once",
        body: (
            <>
                Payment confirmations are signature-checked against Razorpay before anything is recorded, and the same
                payment can never be counted twice — not even when a confirmation is delivered again. Each charge is
                written to a balanced ledger, and every contributor gets an email receipt.
            </>
        ),
    },
    {
        tag: "Security",
        title: "Signed webhooks, hashed keys",
        body: (
            <>
                Apps receive <strong>HMAC-signed</strong> webhooks they can verify, with safe secret rotation. API keys are
                stored only as SHA-256 hashes, so even we can't read them back. Sign-in is through Elixpo Accounts — Elixpo
                Pay never stores passwords.
            </>
        ),
    },
    {
        tag: "Privacy",
        title: "We keep only what a payment needs",
        body: (
            <>
                A contributor's email is used for their receipt and is never shown to the creator. Names appear on a
                fundraiser only when the contributor chooses to show them. See the{" "}
                <Link href="/privacy">privacy policy</Link>.
            </>
        ),
    },
    {
        tag: "Moderation",
        title: "Anyone can report a page",
        body: (
            <>
                Every fundraiser has a <em>Report this page</em> link. Elixpo reviews reports and can hold a page — it
                stops taking payments immediately — or unpublish it. Fundraisers are donations: creators can't promise goods
                in return.
            </>
        ),
    },
    {
        tag: "Open source",
        title: "You can read every line",
        body: (
            <>
                Elixpo Pay is developed in the open on{" "}
                <a href="https://github.com/elixpo/payouts.elixpo" target="_blank" rel="noopener noreferrer">
                    GitHub
                </a>
                . Found a security issue? Report it privately through{" "}
                <a href="https://github.com/elixpo/payouts.elixpo/security/advisories/new" target="_blank" rel="noopener noreferrer">
                    GitHub's security advisory form
                </a>{" "}
                — please don't open a public issue.
            </>
        ),
    },
];

const NOT = [
    "We never see or store card numbers, UPI PINs or bank passwords.",
    "We never sell or share contributor emails.",
    "We never move money anywhere except the creator's verified account (or Elixpo's, for its own pages).",
    "We never ask you to pay outside the Razorpay checkout.",
];

/** Trust & safety: an honest, plain-language account of how Elixpo Pay handles money and data. */
export default function TrustPage() {
    return (
        <PageShell variant="docs">
            <article className="trust">
                <p className="eyebrow">Trust &amp; safety</p>
                <h1 className="display">
                    How we keep your <em>money and data</em> safe.
                </h1>
                <p className="trust-lead">
                    Plain answers to the questions worth asking before you pay, raise money or integrate Elixpo Pay.
                </p>

                <div className="trust-grid">
                    {SECTIONS.map((s) => (
                        <section key={s.tag}>
                            <span className="mono-label">{s.tag}</span>
                            <h2>{s.title}</h2>
                            <p>{s.body}</p>
                        </section>
                    ))}
                </div>

                <section className="trust-not">
                    <h2>What we don't do</h2>
                    <ul>
                        {NOT.map((n) => (
                            <li key={n}>{n}</li>
                        ))}
                    </ul>
                </section>

                <p className="trust-links">
                    Read the <Link href="/terms">terms</Link>, <Link href="/privacy">privacy policy</Link> and{" "}
                    <Link href="/refunds">refund policy</Link>, see{" "}
                    <Link href="/docs/fundraisers#money-flow">how fundraiser money flows</Link>, or{" "}
                    <Link href="/contact">contact us</Link>.
                </p>
            </article>
            <style>{`
                .trust { width: min(calc(100% - 2rem), 1100px); margin: 0 auto; padding: 4rem 0 7rem; }
                .trust h1 { font-size: clamp(2.6rem, 6.5vw, 5.2rem); max-width: 900px; }
                .trust h1 em { font-family: var(--font-serif); font-weight: 400; }
                .trust-lead { max-width: 620px; margin: 1.4rem 0 3rem; color: var(--app-fg-muted); font-size: 1.08rem; line-height: 1.7; }
                .trust-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
                .trust-grid section { padding: 1.6rem; border: 1px solid var(--app-border); border-radius: var(--radius-card); background: var(--app-surface); }
                .trust-grid h2 { margin: 0.6rem 0 0.6rem; font-size: 1.45rem; letter-spacing: -0.035em; line-height: 1.15; }
                .trust-grid p, .trust-links { margin: 0; color: var(--app-fg-muted); line-height: 1.7; }
                .trust a { color: var(--app-link); font-weight: 700; }
                .trust-not { margin-top: 1rem; padding: 1.8rem; border-radius: var(--radius-card); background: var(--app-ink); color: var(--app-on-ink); }
                .trust-not h2 { margin: 0 0 1rem; font-size: 1.6rem; letter-spacing: -0.035em; }
                .trust-not ul { margin: 0; padding-left: 1.2rem; display: grid; gap: 0.6rem; color: var(--app-on-ink-muted); line-height: 1.6; }
                .trust-links { margin-top: 2rem; }
                @media (max-width: 760px) { .trust-grid { grid-template-columns: 1fr; } }
            `}</style>
        </PageShell>
    );
}
