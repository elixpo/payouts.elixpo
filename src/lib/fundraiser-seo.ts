/**
 * SEO for public fundraiser pages (/f/<slug>): metadata, structured data and
 * shared copy so search results and link previews describe a fundraiser the
 * same way everywhere.
 */

import type { Metadata } from "next";
import { type FundraiserRow, publicName } from "./fundraisers";

export const SITE = "https://payouts.elixpo.com";

const inr = (minor: number) => `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;

/** Markdown → plain text excerpt for descriptions. */
export function plainExcerpt(md: string, n = 155): string {
    const t = md
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → text
        .replace(/[#*_`>~-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
}

/** "Ayushman is raising ₹8,000 for Build the first Falera badges. <excerpt>" */
export function fundraiserDescription(row: FundraiserRow): string {
    const who = publicName(row);
    const lead = `${who} is raising ${inr(row.goal_amount)} for ${row.title}.`;
    const ex = plainExcerpt(row.body_md, 150 - Math.min(lead.length, 90));
    return ex ? `${lead} ${ex}` : `${lead} Contribute any amount with UPI or a card — no account needed.`;
}

export function fundraiserMetadata(row: FundraiserRow): Metadata {
    const who = publicName(row);
    const url = `/f/${row.slug}`;
    const title = `${row.title} — fundraiser by ${who}`;
    const description = fundraiserDescription(row);
    const ended = row.status === "closed";
    return {
        title,
        description,
        keywords: [row.title, who, "fundraiser", "donate", "crowdfunding", "support", "UPI donation", "Elixpo Pay"],
        authors: [{ name: who }],
        alternates: { canonical: url },
        // Live and closed pages are indexable (closed ones stay up as a record).
        robots: { index: true, follow: true, "max-image-preview": "large" } as Metadata["robots"],
        openGraph: {
            type: "website",
            siteName: "Elixpo Pay",
            locale: "en_IN",
            url,
            title: ended ? `${row.title} (closed)` : row.title,
            description,
            // og:image comes from app/f/[slug]/opengraph-image.tsx (generated card).
        },
        twitter: { card: "summary_large_image", title: row.title, description },
        other: { "og:see_also": SITE },
    };
}

/** JSON-LD: WebPage + DonateAction (recipient, goal) + breadcrumb. */
export function fundraiserJsonLd(row: FundraiserRow, raisedMinor: number, contributors: number): string {
    const who = publicName(row);
    const url = `${SITE}/f/${row.slug}`;
    const data = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                "@id": `${url}#page`,
                url,
                name: row.title,
                description: fundraiserDescription(row),
                inLanguage: "en-IN",
                isPartOf: { "@type": "WebSite", name: "Elixpo Pay", url: SITE },
                primaryImageOfPage: `${url}/opengraph-image`,
                ...(row.published_at ? { datePublished: `${row.published_at.replace(" ", "T")}Z` } : {}),
                dateModified: `${row.updated_at.replace(" ", "T")}Z`,
                breadcrumb: { "@id": `${url}#breadcrumb` },
                potentialAction: {
                    "@type": "DonateAction",
                    name: `Contribute to ${row.title}`,
                    target: url,
                    recipient: {
                        "@type": "Person",
                        name: who,
                        ...(row.link_url ? { url: row.link_url } : {}),
                    },
                    ...(row.status === "live" ? { actionStatus: "https://schema.org/PotentialActionStatus" } : { actionStatus: "https://schema.org/CompletedActionStatus" }),
                },
                about: {
                    "@type": "Thing",
                    name: row.title,
                    description: `Goal ${inr(row.goal_amount)}; ${inr(raisedMinor)} raised from ${contributors} ${contributors === 1 ? "supporter" : "supporters"}.`,
                },
            },
            {
                "@type": "BreadcrumbList",
                "@id": `${url}#breadcrumb`,
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Elixpo Pay", item: SITE },
                    { "@type": "ListItem", position: 2, name: "Fundraisers", item: `${SITE}/docs/fundraisers` },
                    { "@type": "ListItem", position: 3, name: row.title, item: url },
                ],
            },
        ],
    };
    // Safe to inline in <script>: no "</" can close the tag.
    return JSON.stringify(data).replace(/</g, "\\u003c");
}
