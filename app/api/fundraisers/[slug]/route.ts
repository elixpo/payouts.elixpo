export const runtime = "edge";

import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/d1-client";
import { getFundraiserBySlug, publicView } from "@/lib/fundraisers";

/**
 * GET /api/fundraisers/:slug — public page data + live progress. Cached at the
 * edge for a few seconds so a busy page (QR at an event) stays cheap.
 * Drafts 404; held pages return only their status.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const db = await getDatabase();
    const row = await getFundraiserBySlug(db, slug.toLowerCase());
    if (!row || row.status === "draft") {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (row.status === "held") {
        return NextResponse.json({ slug: row.slug, status: "held" }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(await publicView(db, row), {
        headers: { "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=30" },
    });
}
