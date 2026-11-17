export const runtime = "edge";
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "../../components/page-shell";
import { getDatabase } from "@/lib/d1-client";
import { type DisplayCurrency, type FundraiserRow, getFundraiserBySlug, publicView } from "@/lib/fundraisers";
import { formatMoney } from "@/lib/mail-notify";
import { renderMarkdown } from "@/lib/markdown";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import AnimatedProgress from "./animated-progress";
import CoverCarousel from "./cover-carousel";
import StickyContribute from "./sticky-contribute";
import ContributeForm from "./contribute-form";
import ReportLink from "./report-link";
import "../fundraiser.css";

type Params = { params: Promise<{ slug: string }> };

async function loadForViewer(slug: string) {
    const db = await getDatabase();
    const row = await getFundraiserBySlug(db, slug.toLowerCase());
    if (!row) return { db, row: null, preview: false };
    if (row.status === "draft") {
        // Owners can preview their own draft; everyone else gets a 404.
        const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
        if (session?.merchantId !== row.merchant_id) return { db, row: null, preview: false };
        return { db, row, preview: true };
    }
    return { db, row, preview: false };
}

function plainExcerpt(md: string, n = 160): string {
    const t = md.replace(/[#*_`>[\]()-]/g, " ").replace(/\s+/g, " ").trim();
    return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { slug } = await params;
    const db = await getDatabase();
    const row = await getFundraiserBySlug(db, slug.toLowerCase());
    if (!row || row.status === "draft" || row.status === "held" || row.status === "deleted") {
        return { title: row?.status === "deleted" ? `${row.title} (closed)` : "Fundraiser", robots: { index: false } };
    }
    const description = plainExcerpt(row.body_md) || `Support ${row.title} on Elixpo Pay.`;
    return {
        title: row.title,
        description,
        alternates: { canonical: `/f/${row.slug}` },
        openGraph: { title: row.title, description, url: `/f/${row.slug}`, ...(row.cover_url ? { images: [row.cover_url] } : {}) },
        twitter: { card: row.cover_url ? "summary_large_image" : "summary", title: row.title, description },
    };
}

/** INR for visitors in India (CF-IPCountry, then Accept-Language), USD otherwise. */
async function initialCurrency(): Promise<DisplayCurrency> {
    const h = await headers();
    const country = (h.get("cf-ipcountry") || "").toUpperCase();
    if (country) return country === "IN" ? "INR" : "USD";
    return /-IN\b/i.test(h.get("accept-language") || "") ? "INR" : "USD";
}

export default async function FundraiserPage({ params }: Params) {
    const { slug } = await params;
    const { db, row, preview } = await loadForViewer(slug);
    if (!row) notFound();

    if (row.status === "deleted") {
        return (
            <PageShell variant="docs">
                <div className="fr-thanks fr-ended">
                    {/* biome-ignore lint/performance/noImgElement: static mascot */}
                    <img className="fr-ended-mascot" src="/icon.png" alt="" width={88} height={88} />
                    <p className="eyebrow">Fundraiser closed</p>
                    <h1 className="display">
                        Thank you for <em>showing up.</em>
                    </h1>
                    <p>
                        <strong>{row.title}</strong> is no longer taking contributions, so there's nothing to pay here.
                        Thank you for scanning and for your interest — it genuinely means a lot to the creator.
                    </p>
                    <p className="fr-ended-note">
                        Already contributed? Your payment went through and your receipt email is still valid.
                    </p>
                    <div className="actions">
                        <Link href="/">Explore Elixpo Pay</Link>
                    </div>
                </div>
            </PageShell>
        );
    }

    if (row.status === "held") {
        return (
            <PageShell variant="docs">
                <div className="fr-thanks">
                    <p className="eyebrow">Under review</p>
                    <h1 className="display">This fundraiser is paused.</h1>
                    <p>
                        Elixpo is reviewing this page, and it can't accept contributions right now. If you
                        contributed earlier, your payment is safe and your receipt is still valid.
                    </p>
                    <div className="actions">
                        <Link href="/">Elixpo Pay home</Link>
                    </div>
                </div>
            </PageShell>
        );
    }

    const view = await publicView(db, row as FundraiserRow);
    const currency = await initialCurrency();
    const initials = view.owner.name.trim().charAt(0).toUpperCase() || "E";

    return (
        <PageShell>
            <div className="fr-bg" aria-hidden>
                <BgHeart className="b1" />
                <BgCoin className="b2" />
                <BgSpark className="b3" />
                <BgHeart className="b4" />
                <BgSpark className="b5" />
                <BgCoin className="b6" />
                <BgHeart className="b7" />
                <i className="o1" />
                <i className="o2" />
                <i className="o3" />
            </div>
            <div className="fr-page">
                {preview && (
                    <div className="fr-banner" role="status">
                        <strong>Draft preview.</strong> Only you can see this page.{" "}
                        <Link href={`/dashboard/fundraisers/${row.id}`}>Publish it from the dashboard</Link>.
                    </div>
                )}
                {row.status === "closed" && (
                    <div className="fr-banner" role="status">
                        This fundraiser is closed and no longer accepting contributions. The page stays up as a record.
                    </div>
                )}

                <div className="fr-grid">
                    <section className="fr-hero">
                        <div className="fr-owner">
                            {view.owner.avatar ? (
                                // biome-ignore lint/performance/noImgElement: remote avatar
                                <img src={view.owner.avatar} alt="" referrerPolicy="no-referrer" />
                            ) : (
                                <span className="fr-initial" aria-hidden>
                                    {initials}
                                </span>
                            )}
                            <div>
                                <b>
                                    {view.owner.name}
                                    {view.owner.verified && (
                                        <span className="fr-verified" title="Identity verified through Razorpay KYC">
                                            <Check /> Verified
                                        </span>
                                    )}
                                </b>
                                <small>is raising money on Elixpo Pay</small>
                            </div>
                        </div>
                        <h1 className="display fr-title">{view.title}</h1>

                        <AnimatedProgress
                            raised={view.raised}
                            goal={view.goal.amount}
                            currency={view.goal.currency}
                            contributors={view.contributors}
                            closed={row.status === "closed" || view.ended}
                        />
                    </section>

                    <aside className="fr-col-form" aria-label="Contribute" id="contribute">
                        <div className="fr-card-sticky">
                        <div className="fr-card">
                            <ContributeForm
                                slug={view.slug}
                                title={view.title}
                                presets={view.presets}
                                limits={view.limits}
                                rate={view.usd_inr_rate}
                                rateAsOf={view.usd_inr_as_of}
                                mostChosen={view.most_chosen}
                                ownerName={view.owner.name}
                                initialCurrency={currency}
                                open={view.accepts_payments && !preview}
                                closedReason={
                                    preview
                                        ? "This is a draft preview — publish the fundraiser to accept contributions."
                                        : view.ended
                                          ? "This fundraiser has ended. Thank you to everyone who contributed."
                                          : "This fundraiser isn't accepting contributions right now."
                                }
                            />
                        </div>
                        </div>
                    </aside>

                    <section className="fr-story">
                        {view.covers.length ? (
                            <CoverCarousel images={view.covers} autoplay={view.cover_autoplay} title={view.title} />
                        ) : (
                            <div className="fr-cover-geo geo" aria-hidden>
                                <i className="g-ring" />
                                <i className="g-disc" />
                                <i className="g-pill" />
                                <i className="g-tile" />
                            </div>
                        )}
                        {view.body_md ? (
                            <div
                                className="fr-body"
                                // biome-ignore lint/security/noDangerouslySetInnerHtml: escape-first renderer (src/lib/markdown.ts)
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(view.body_md) }}
                            />
                        ) : null}
                        {view.link_url && (
                            <a className="fr-link" href={view.link_url} target="_blank" rel="noopener noreferrer nofollow">
                                {view.link_url.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
                            </a>
                        )}

                        <p className="eyebrow fr-section-h">Recent supporters</p>
                        {view.supporters.length ? (
                            <div className="fr-supporters">
                                <ul>
                                    {view.supporters.map((s, i) => (
                                        <li key={`${s.paid_at}-${i}`}>
                                            <b>{s.name}</b>
                                            <span>{formatMoney(s.amount, s.currency)}</span>
                                            {s.message && <p>“{s.message}”</p>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="fr-empty">Be the first to support this.</p>
                        )}

                        <div className="fr-trust">
                            <p style={{ margin: 0 }}>
                                <strong>Where the money goes:</strong> contributions are paid to{" "}
                                <strong>{view.owner.name}</strong>
                                {view.owner.verified ? ", whose identity is verified through Razorpay KYC" : ""}. Payments
                                are processed by Razorpay through Elixpo Pay. A fundraiser is a donation, not a purchase:
                                nothing is promised in return, and contributions are <strong>not tax-deductible</strong>.
                            </p>
                            <p style={{ margin: "0.6rem 0 0" }}>
                                See the <Link href="/refunds">refund policy</Link>. Something wrong with this page?{" "}
                                <ReportLink slug={view.slug} />
                            </p>
                        </div>
                    </section>
                </div>

                {/* ── Where the money goes ─────────────────────────────── */}
                <section className="fr-route" id="money-flow" aria-labelledby="fr-route-h">
                    <p className="eyebrow">Where your money goes</p>
                    <h2 id="fr-route-h">
                        Straight to {view.owner.name}, <em>safely.</em>
                    </h2>
                    <p className="fr-route-lead">
                        Every contribution follows the same four steps. Nobody in between can redirect it, and you get a
                        receipt the moment it lands.
                    </p>
                    <ol className="fr-route-steps">
                        <li>
                            <span className="fr-node" aria-hidden>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></svg>
                            </span>
                            <div>
                                <b>You pay</b>
                                <span>UPI, card or netbanking on a secure checkout. Card details never reach Elixpo.</span>
                            </div>
                        </li>
                        <li>
                            <span className="fr-node" aria-hidden>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8.5 7.5 10 4.3-1.5 7.5-5.4 7.5-10v-6Z" /><path d="m8.8 12 2.2 2.2 4.2-4.4" /></svg>
                            </span>
                            <div>
                                <b>Razorpay</b>
                                <span>An RBI-licensed payment gateway confirms the payment.</span>
                            </div>
                        </li>
                        <li>
                            <span className="fr-node" aria-hidden>
                                {/* biome-ignore lint/performance/noImgElement: static mascot */}
                                <img src="/icon.png" alt="" width={40} height={40} />
                            </span>
                            <div>
                                <b>Elixpo Pay</b>
                                <span>Records it exactly once, updates the total and emails your receipt.</span>
                            </div>
                        </li>
                        <li>
                            <span className="fr-node" aria-hidden>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5 12 4l9 5.5" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" /><path d="M3 20.5h18" /></svg>
                            </span>
                            <div>
                                <b>{view.owner.name}</b>
                                <span>
                                    {view.owner.verified
                                        ? "Paid to their bank account, verified through Razorpay KYC."
                                        : "Paid to their bank account through Razorpay."}
                                </span>
                            </div>
                        </li>
                    </ol>
                    <div className="fr-badges">
                        <span><Check /> RBI-licensed gateway</span>
                        {view.owner.verified && <span><Check /> KYC-verified recipient</span>}
                        <span><Check /> Receipt for every payment</span>
                        <span><Check /> Counted exactly once</span>
                        <Link href="/refunds">Refund policy →</Link>
                        <Link href="/docs/fundraisers#money-flow">How fundraisers work →</Link>
                    </div>
                    {view.accepts_payments && !preview && (
                        <div className="actions fr-route-cta">
                            <a href="#contribute">Contribute now ↑</a>
                        </div>
                    )}
                </section>
            </div>
            {view.accepts_payments && !preview && (
                <StickyContribute label={`Contribute to ${view.owner.name.split(" ")[0]} →`} />
            )}
        </PageShell>
    );
}

const HEART = "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3.1 1.7-1.9 3.2-3.1 5.3-3.1 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z";

/** Inline check mark (SVG, never an emoji). */
function Check() {
    return (
        <svg className="fr-check-ico" viewBox="0 0 24 24" width="12" height="12" aria-hidden>
            <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
function BgHeart({ className }: { className: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24">
            <path d={HEART} fill="currentColor" />
        </svg>
    );
}
function BgSpark({ className }: { className: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24">
            <path d="M12 2l2.1 7.2L21 12l-6.9 2.8L12 22l-2.1-7.2L3 12l6.9-2.8z" fill="currentColor" />
        </svg>
    );
}
function BgCoin({ className }: { className: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8.5 8h7M8.5 11h7M9 8c4 0 4 6 0 6l5.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
