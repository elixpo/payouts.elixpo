import type { NextConfig } from "next";

// Fundraisers whose slug was renamed: old slug -> new slug. Links already
// shared (posts, emails, press, printed boards) keep working through a
// permanent redirect. 308 keeps the method, so a POST to the old contribute
// endpoint still reaches the fundraiser.
const RENAMED_FUNDRAISERS: Record<string, string> = {
    "oreo-badge": "falera-badge", // OreoOS was renamed FaleraOS, 19 Nov 2026
};

const nextConfig: NextConfig = {
    output: "standalone",
    async redirects() {
        return Object.entries(RENAMED_FUNDRAISERS).flatMap(([from, to]) => [
            { source: `/f/${from}`, destination: `/f/${to}`, permanent: true },
            { source: `/f/${from}/:path*`, destination: `/f/${to}/:path*`, permanent: true },
            { source: `/api/fundraisers/${from}`, destination: `/api/fundraisers/${to}`, permanent: true },
            {
                source: `/api/fundraisers/${from}/:path*`,
                destination: `/api/fundraisers/${to}/:path*`,
                permanent: true,
            },
        ]);
    },
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
};

export default nextConfig;
