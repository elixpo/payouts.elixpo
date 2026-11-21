import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    // MUI v7's prebuilt ESM has a circular-init hazard that surfaces during
    // Next 15's page-data collection. Re-transpiling through Next's webpack
    // pipeline resolves the eval order. (Same fix as accounts.elixpo.)
    transpilePackages: [
        "@mui/material",
        "@mui/system",
        "@mui/icons-material",
        "@mui/utils",
        "@mui/private-theming",
        "@mui/styled-engine",
    ],
    // Rewrite barrel imports to deep paths so we never load the MUI barrel
    // module (the source of the circular init crash above).
    modularizeImports: {
        "@mui/material": {
            transform: "@mui/material/{{member}}",
        },
        "@mui/icons-material": {
            transform: "@mui/icons-material/{{member}}",
        },
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Baseline security headers on every response. The CSP only sets
    // frame-ancestors (anti-clickjacking for the dashboard's money actions);
    // script/style sources aren't restricted because Razorpay Checkout and
    // MUI's runtime styles would need a nonce pipeline first.
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
                    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
                ],
            },
        ];
    },
};

export default nextConfig;
