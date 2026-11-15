export const runtime = "edge";

import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

function clearSession(res: NextResponse) {
    res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
}

/** POST /api/auth/logout — used by the dashboard (fetch); returns JSON. */
export async function POST() {
    return clearSession(NextResponse.json({ ok: true }));
}

/** GET /api/auth/logout — plain link fallback; lands on the home page. */
export async function GET(request: NextRequest) {
    return clearSession(NextResponse.redirect(`${request.nextUrl.origin}/`));
}
