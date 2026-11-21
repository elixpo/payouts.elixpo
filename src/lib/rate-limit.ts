/**
 * Small KV-backed fixed-window rate limiter.
 *
 * Each (bucket, id) pair gets one counter per window, keyed by the window index
 * so it rolls over on its own and expires via TTL. KV is eventually consistent,
 * so this is a coarse abuse guard (a burst across PoPs can slip a few extra
 * requests through), not an exact quota.
 *
 * Fails OPEN: if KV is unavailable or errors, the request is allowed.
 */

import { getKV } from "./kv";

export interface RateLimitResult {
    allowed: boolean;
    count: number;
    limit: number;
}

export async function rateLimit(
    bucket: string,
    id: string,
    limit: number,
    windowSeconds: number,
): Promise<RateLimitResult> {
    try {
        const kv = await getKV();
        const window = Math.floor(Date.now() / 1000 / windowSeconds);
        const key = `rl:${bucket}:${id}:${window}`;
        const current = Number.parseInt((await kv.get(key)) ?? "0", 10) || 0;
        if (current >= limit) return { allowed: false, count: current, limit };
        // KV's minimum TTL is 60 seconds.
        await kv.put(key, String(current + 1), {
            expirationTtl: Math.max(60, windowSeconds),
        });
        return { allowed: true, count: current + 1, limit };
    } catch {
        return { allowed: true, count: 0, limit };
    }
}

/** Best-effort client IP: Cloudflare's header first, then x-forwarded-for. */
export function clientIp(request: Request): string | null {
    const cf = request.headers.get("cf-connecting-ip")?.trim();
    if (cf) return cf;
    const xff = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    return xff || null;
}
