/**
 * Centralized env access. On Cloudflare Pages, secrets live on the request
 * context's `env`; in local dev they're on process.env. We try the binding
 * first, then fall back to process.env so the same getter works in both.
 */

async function fromContext(name: string): Promise<string | undefined> {
    try {
        const { getRequestContext } = await import(
            /* webpackIgnore: true */ "@cloudflare/next-on-pages"
        );
        const env = (getRequestContext() as any).env;
        if (env?.[name] != null) return String(env[name]);
    } catch {
        // not on Cloudflare runtime
    }
    return process.env[name];
}

export async function getEnv(name: string): Promise<string | undefined> {
    return fromContext(name);
}

export async function requireEnv(name: string): Promise<string> {
    const v = await fromContext(name);
    if (!v) throw new Error(`Missing required env var: ${name}`);
    return v;
}

/** Public app origin, e.g. https://payouts.elixpo.com (no trailing slash). */
export async function appUrl(): Promise<string> {
    const v = (await getEnv("NEXT_PUBLIC_APP_URL")) || "http://localhost:3000";
    return v.replace(/\/$/, "");
}

/**
 * Whether simulated payments (/api/checkout/test-complete, dashboard test-send)
 * may run. Allow-list, not deny-list: preview shares the production D1, and a
 * missing/misspelled ENVIRONMENT must never open a free-grant endpoint.
 */
export async function testPaymentsAllowed(): Promise<boolean> {
    const env = (await getEnv("ENVIRONMENT"))?.trim().toLowerCase();
    if (env === "development" || env === "local" || env === "test") return true;
    if (env) return false; // production, preview, anything else
    return process.env.NODE_ENV === "development";
}
