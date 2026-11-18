export const runtime = "edge";

import type { NextRequest } from "next/server";
import { getDatabase } from "@/lib/d1-client";
import { getFundraiserBySlug, getTotals } from "@/lib/fundraisers";

function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function renderBadge(label: string, value: string, progressPct?: number): string {
    const labelWidth = Math.max(50, Math.round(label.length * 7.4) + 12);
    const valueWidth = Math.max(60, Math.round(value.length * 7.2) + 14);
    const totalWidth = labelWidth + valueWidth;
    const hasProgress = typeof progressPct === "number" && progressPct >= 0;
    const pct = hasProgress ? Math.min(100, Math.max(0, Math.round(progressPct))) : 0;
    const progressWidth = Math.round((totalWidth * pct) / 100);
    const progressColor = pct >= 100 ? "#10b981" : "#f0508a";

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${escapeXml(label)}: ${escapeXml(value)}">
  <title>${escapeXml(label)}: ${escapeXml(value)}</title>
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="a">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#a)">
    <rect width="${labelWidth}" height="20" fill="#142018"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="#24292e"/>
    ${hasProgress ? `<rect x="0" y="18" width="${totalWidth}" height="2" fill="#374151"/><rect x="0" y="18" width="${progressWidth}" height="2" fill="${progressColor}"/>` : ""}
    <rect width="${totalWidth}" height="20" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="${Math.round(labelWidth / 2)}" y="15" fill="#010101" fill-opacity=".3">${escapeXml(label)}</text>
    <text x="${Math.round(labelWidth / 2)}" y="14">${escapeXml(label)}</text>
    <text aria-hidden="true" x="${Math.round(labelWidth + valueWidth / 2)}" y="15" fill="#010101" fill-opacity=".3">${escapeXml(value)}</text>
    <text x="${Math.round(labelWidth + valueWidth / 2)}" y="14">${escapeXml(value)}</text>
  </g>
</svg>`;
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
    const { slug } = await params;
    const db = await getDatabase();
    const row = await getFundraiserBySlug(db, slug ? slug.toLowerCase() : "");

    // Neutral badge for drafts, held, deleted, and unknown slugs: never leak data from non-public page.
    const isPublic = row && (row.status === "live" || row.status === "closed");
    if (!row || !isPublic) {
        const svg = renderBadge("Support", "Fundraiser");
        return new Response(svg, {
            status: 200,
            headers: {
                "Content-Type": "image/svg+xml; charset=utf-8",
                "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=60",
            },
        });
    }

    const { raised } = await getTotals(db, row.id);
    const raisedInr = Math.round(raised / 100).toLocaleString("en-IN");
    const goalInr = row.goal_amount ? Math.round(row.goal_amount / 100).toLocaleString("en-IN") : null;

    let valueText: string;
    let pct: number | undefined;

    if (row.goal_amount && row.goal_amount > 0) {
        valueText = `₹${raisedInr} of ₹${goalInr}`;
        pct = (raised / row.goal_amount) * 100;
    } else {
        valueText = `₹${raisedInr} raised`;
        pct = 100;
    }

    const svg = renderBadge("Support", valueText, pct);
    return new Response(svg, {
        status: 200,
        headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=60",
        },
    });
}
