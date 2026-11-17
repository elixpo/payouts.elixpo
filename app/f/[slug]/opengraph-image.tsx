import { ImageResponse } from "next/og";
import { getDatabase } from "@/lib/d1-client";
import { appUrl } from "@/lib/env";
import { coverList, getFundraiserBySlug, getTotals, publicName } from "@/lib/fundraisers";

export const runtime = "edge";
export const alt = "Fundraiser on Elixpo Pay";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The default OG font may not carry "₹", so amounts read "INR 8,000".
const amount = (minor: number) => `INR ${Math.round(minor / 100).toLocaleString("en-IN")}`;

/** Fetch an image as a data URL (≤ 4 MB), or null — a bad image never breaks the card. */
async function asDataUrl(url: string): Promise<string | null> {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        const type = res.headers.get("content-type") || "";
        if (!res.ok || !type.startsWith("image/")) return null;
        const buf = new Uint8Array(await res.arrayBuffer());
        if (buf.byteLength > 4 * 1024 * 1024) return null;
        let bin = "";
        for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        return `data:${type};base64,${btoa(bin)}`;
    } catch {
        return null;
    }
}

/**
 * Link-preview card for /f/<slug> (WhatsApp, X, LinkedIn, Slack…): title,
 * creator, a progress bar and the totals, over the cover photo when there is
 * one. Unpublished pages get a neutral Elixpo Pay card.
 */
export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const db = await getDatabase();
    const row = await getFundraiserBySlug(db, slug.toLowerCase());
    const base = await appUrl();
    const panda = await asDataUrl(`${base}/icon.png`);
    const visible = row && (row.status === "live" || row.status === "closed");

    if (!row || !visible) {
        return new ImageResponse(
            (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fbfbf8", color: "#142018", fontSize: 64, fontWeight: 700 }}>
                    {panda && <img src={panda} width={96} height={96} style={{ marginRight: 28 }} alt="" />}
                    Elixpo Pay
                </div>
            ),
            size,
        );
    }

    const { raised, count } = await getTotals(db, row.id);
    const pct = row.goal_amount ? Math.min(100, Math.round((raised / row.goal_amount) * 100)) : 0;
    const cover = coverList(row)[0];
    const coverData = cover ? await asDataUrl(cover) : null;
    const dark = !!coverData;
    const ink = dark ? "#ffffff" : "#142018";
    const muted = dark ? "rgba(255,255,255,0.82)" : "#5f6962";
    const title = row.title.length > 70 ? `${row.title.slice(0, 68)}…` : row.title;

    return new ImageResponse(
        (
            <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#fbfbf8", color: ink }}>
                {coverData ? (
                    <img src={coverData} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, width: 1200, height: 630, objectFit: "cover" }} />
                ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", background: "radial-gradient(circle at 12% 10%, rgba(240,80,138,0.18), transparent 55%), radial-gradient(circle at 95% 85%, rgba(255,166,120,0.22), transparent 55%)" }} />
                )}
                {dark && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(180deg, rgba(14,21,17,0.35) 0%, rgba(14,21,17,0.86) 70%)" }} />
                )}
                <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", padding: "56px 64px" }}>
                    <div style={{ display: "flex", alignItems: "center", fontSize: 22, letterSpacing: 4, fontWeight: 700, color: dark ? "#ffd1e1" : "#d6336c" }}>
                        FUNDRAISER{row.status === "closed" ? " · CLOSED" : ""}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", fontSize: title.length > 40 ? 64 : 76, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2 }}>{title}</div>
                        <div style={{ display: "flex", marginTop: 18, fontSize: 30, color: muted }}>by {publicName(row)}</div>
                        <div style={{ display: "flex", marginTop: 34, width: "100%", height: 22, borderRadius: 999, background: dark ? "rgba(255,255,255,0.22)" : "#eff1ed", overflow: "hidden" }}>
                            <div style={{ display: "flex", width: `${Math.max(pct, raised > 0 ? 3 : 0)}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #f0508a, #d6336c)" }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontSize: 30 }}>
                            <div style={{ display: "flex" }}>
                                <span style={{ fontWeight: 800 }}>{amount(raised)}</span>
                                <span style={{ marginLeft: 12, color: muted }}>raised of {amount(row.goal_amount)}</span>
                            </div>
                            <div style={{ display: "flex", color: muted }}>
                                {pct}% · {count} {count === 1 ? "supporter" : "supporters"}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 26 }}>
                        <div style={{ display: "flex", alignItems: "center", fontWeight: 700 }}>
                            {panda && <img src={panda} width={48} height={48} style={{ marginRight: 14 }} alt="" />}
                            Elixpo Pay
                        </div>
                        <div style={{ display: "flex", color: muted }}>{`${base.replace(/^https?:\/\//, "")}/f/${row.slug}`}</div>
                    </div>
                </div>
            </div>
        ),
        size,
    );
}
