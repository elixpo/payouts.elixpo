import Link from "next/link";

const EMAIL = "hello@elixpo.com";

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
    {
        title: "Product",
        links: [
            { label: "Platform", href: "/about" },
            { label: "Pricing", href: "/pricing" },
            { label: "Merchant dashboard", href: "/dashboard" },
            { label: "GitHub", href: "https://github.com/elixpo/payouts.elixpo", external: true },
        ],
    },
    {
        title: "Developers",
        links: [
            { label: "Documentation", href: "/docs" },
            { label: "Quickstart", href: "/docs/quickstart" },
            { label: "Webhooks", href: "/docs/webhooks" },
            { label: "Status", href: "https://status.elixpo.com", external: true },
        ],
    },
    {
        title: "Company",
        links: [
            { label: "Contact", href: "/contact" },
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
            { label: "Refunds", href: "/refunds" },
        ],
    },
];

/** Editorial footer: brand statement left, link columns right, hairline rule. */
export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="footer-brand">
                {/* biome-ignore lint/performance/noImgElement: static brand mark */}
                <img src="/icon.png" alt="" width={42} height={42} />
                <div>
                    <strong>Elixpo Pay</strong>
                    <p>Payments, subscriptions and payouts for the Elixpo ecosystem — and yours.</p>
                    <a className="footer-mail" href={`mailto:${EMAIL}`}>
                        {EMAIL}
                    </a>
                </div>
            </div>
            <div className="footer-cols">
                {COLUMNS.map((col) => (
                    <nav key={col.title} aria-label={col.title}>
                        <span className="mono-label">{col.title}</span>
                        {col.links.map((l) =>
                            l.external ? (
                                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                                    {l.label} ↗
                                </a>
                            ) : (
                                <Link key={l.href} href={l.href}>
                                    {l.label}
                                </Link>
                            ),
                        )}
                    </nav>
                ))}
            </div>
            <div className="footer-base">
                <span>© {new Date().getFullYear()} Elixpo. Payments processed by Razorpay.</span>
                <span className="mono-label">payouts.elixpo.com</span>
            </div>
        </footer>
    );
}
