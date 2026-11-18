export const runtime = "edge";

import type { NextRequest } from "next/server";
import { getDatabase } from "@/lib/d1-client";
import { getFundraiserBySlug, publicView } from "@/lib/fundraisers";
import { formatMoney } from "@/lib/mail-notify";

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const db = await getDatabase();
    const row = await getFundraiserBySlug(db, slug.toLowerCase());

    const origin = request.nextUrl.origin || "https://payouts.elixpo.com";
    const themeParam = request.nextUrl.searchParams.get("theme"); // "dark" | "light" | null

    const headers = {
        "content-type": "text/html; charset=utf-8",
        "content-security-policy": "frame-ancestors *",
        "cache-control": "public, max-age=0, s-maxage=60, stale-while-revalidate=30",
    };

    const isAvailable = row && (row.status === "live" || row.status === "closed");

    const themeClass = themeParam === "dark" ? "theme-dark" : themeParam === "light" ? "theme-light" : "";

    const css = `
        :root {
            --bg: #ffffff;
            --fg: #142018;
            --muted: #64748b;
            --border: #e2e8f0;
            --surface: #f8fafc;
            --ink: #0f172a;
            --on-ink: #ffffff;
            --accent: #f0508a;
            --success: #10b981;
            --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
            --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        @media (prefers-color-scheme: dark) {
            :root:not(.theme-light) {
                --bg: #0e1511;
                --fg: #fbfbf8;
                --muted: #94a3b8;
                --border: rgba(255, 255, 255, 0.1);
                --surface: #151e18;
                --ink: #fbfbf8;
                --on-ink: #0e1511;
            }
        }
        .theme-dark {
            --bg: #0e1511;
            --fg: #fbfbf8;
            --muted: #94a3b8;
            --border: rgba(255, 255, 255, 0.1);
            --surface: #151e18;
            --ink: #fbfbf8;
            --on-ink: #0e1511;
        }
        .theme-light {
            --bg: #ffffff;
            --fg: #142018;
            --muted: #64748b;
            --border: #e2e8f0;
            --surface: #f8fafc;
            --ink: #0f172a;
            --on-ink: #ffffff;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
            width: 100%;
            height: 100%;
            background: var(--bg);
            color: var(--fg);
            font-family: var(--font-family);
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .card {
            width: 100%;
            max-width: 360px;
            height: 100%;
            max-height: 220px;
            padding: 16px 18px;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 14px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }
        .owner-group {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
        }
        .avatar {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #e2e8f0;
            color: #0f172a;
            font-weight: 700;
            font-size: 11px;
            display: grid;
            place-items: center;
            flex-shrink: 0;
        }
        .owner-name {
            font-size: 0.78rem;
            color: var(--muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .owner-name b {
            color: var(--fg);
            font-weight: 600;
        }
        .badge {
            font-family: var(--mono);
            font-size: 0.6rem;
            font-weight: 700;
            text-transform: uppercase;
            padding: 2px 6px;
            border-radius: 999px;
            background: color-mix(in srgb, var(--success) 15%, transparent);
            color: var(--success);
            letter-spacing: 0.05em;
            flex-shrink: 0;
        }
        .title {
            font-size: 1.02rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            line-height: 1.25;
            color: var(--fg);
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            margin: 4px 0 6px;
        }
        .progress-box {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .progress-text {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-size: 0.8rem;
        }
        .raised {
            font-weight: 700;
            font-size: 0.95rem;
            color: var(--fg);
        }
        .goal {
            color: var(--muted);
            font-size: 0.76rem;
        }
        .bar-track {
            height: 6px;
            width: 100%;
            border-radius: 999px;
            background: var(--surface);
            border: 1px solid var(--border);
            overflow: hidden;
            position: relative;
        }
        .bar-fill {
            height: 100%;
            background: var(--accent);
            border-radius: inherit;
            transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-top: 4px;
        }
        .meta {
            font-size: 0.72rem;
            color: var(--muted);
            font-family: var(--mono);
        }
        .btn-contribute {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 6px 14px;
            border-radius: 999px;
            background: var(--ink);
            color: var(--on-ink);
            font-size: 0.78rem;
            font-weight: 700;
            text-decoration: none;
            cursor: pointer;
            transition: opacity 0.2s ease;
            white-space: nowrap;
        }
        .btn-contribute:hover {
            opacity: 0.88;
        }
        .unavailable-card {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        .unavailable-title {
            font-weight: 700;
            font-size: 0.92rem;
            color: var(--fg);
        }
        .unavailable-desc {
            font-size: 0.78rem;
            color: var(--muted);
        }
        @media (prefers-reduced-motion: reduce) {
            * {
                transition: none !important;
                animation: none !important;
            }
        }
    `;

    if (!isAvailable) {
        const fallbackHtml = `<!DOCTYPE html>
<html lang="en" class="${themeClass}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fundraiser Unavailable</title>
<style>${css}</style>
</head>
<body>
<div class="card unavailable-card">
    <div class="badge" style="color:var(--muted);background:var(--surface);">ELIXPO PAY</div>
    <div class="unavailable-title">Fundraiser Unavailable</div>
    <p class="unavailable-desc">This fundraiser is not accepting contributions or is no longer available.</p>
    <a href="${origin}" target="_blank" rel="noopener noreferrer" class="btn-contribute" style="margin-top:4px;">Visit Elixpo Pay</a>
</div>
</body>
</html>`;
        return new Response(fallbackHtml, { status: 200, headers });
    }

    const pub = await publicView(db, row);
    const currency = pub.goal.currency || "INR";
    const raisedStr = formatMoney(pub.raised, currency);
    const goalStr = pub.goal.amount > 0 ? formatMoney(pub.goal.amount, currency) : null;
    const pct = pub.goal.amount > 0 ? Math.min(100, Math.round((pub.raised / pub.goal.amount) * 100)) : 0;
    const ownerName = pub.owner.name || "A";
    const ownerInitial = ownerName.charAt(0).toUpperCase();
    const isClosed = row.status === "closed";
    const actionLabel = isClosed ? "View Record" : "Contribute";
    const fullUrl = `${origin}/f/${pub.slug}`;

    const html = `<!DOCTYPE html>
<html lang="en" class="${themeClass}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(pub.title)}</title>
<style>${css}</style>
</head>
<body>
<div class="card">
    <div class="header">
        <div class="owner-group">
            <div class="avatar">${escapeHtml(ownerInitial)}</div>
            <div class="owner-name">by <b>${escapeHtml(ownerName)}</b></div>
            ${pub.owner.verified ? '<span class="badge">Verified</span>' : ""}
        </div>
        <div class="meta" style="font-size:0.64rem;">ELIXPO PAY</div>
    </div>
    <h1 class="title">${escapeHtml(pub.title)}</h1>
    <div class="progress-box">
        <div class="progress-text">
            <span class="raised">${escapeHtml(raisedStr)}</span>
            ${goalStr ? `<span class="goal">of ${escapeHtml(goalStr)} goal</span>` : `<span class="goal">raised</span>`}
        </div>
        <div class="bar-track">
            <div class="bar-fill" style="width: ${Math.max(pct, pub.raised > 0 ? 3 : 0)}%;"></div>
        </div>
    </div>
    <div class="footer">
        <div class="meta">
            ${pub.goal.amount > 0 ? `${pct}% funded` : `${pub.contributors} supporter${pub.contributors === 1 ? "" : "s"}`}
        </div>
        <a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="btn-contribute">
            ${escapeHtml(actionLabel)} &rarr;
        </a>
    </div>
</div>
</body>
</html>`;

    return new Response(html, { status: 200, headers });
}
