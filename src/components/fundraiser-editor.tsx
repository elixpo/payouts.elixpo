"use client";

import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";

export interface FundraiserDraft {
    title: string;
    slug: string;
    body_md: string;
    cover_url: string;
    link_url: string;
    goal_rupees: string;
    presets_inr: string;
    presets_usd: string;
    thank_you_message: string;
    ends_at: string; // yyyy-mm-dd
}

export const EMPTY_DRAFT: FundraiserDraft = {
    title: "",
    slug: "",
    body_md: "",
    cover_url: "",
    link_url: "",
    goal_rupees: "",
    presets_inr: "100, 250, 500, 1000",
    presets_usd: "5, 10, 25, 50",
    thank_you_message: "",
    ends_at: "",
};

/** Owner-view JSON → editable strings. */
export function toDraft(f: any): FundraiserDraft {
    const major = (arr: number[] | undefined) => (arr ?? []).map((v) => String(v / 100)).join(", ");
    return {
        title: f.title ?? "",
        slug: f.slug ?? "",
        body_md: f.body_md ?? "",
        cover_url: f.cover_url ?? "",
        link_url: f.link_url ?? "",
        goal_rupees: f.goal_amount ? String(f.goal_amount / 100) : "",
        presets_inr: major(f.presets?.INR),
        presets_usd: major(f.presets?.USD),
        thank_you_message: f.thank_you_message ?? "",
        ends_at: f.ends_at ? String(f.ends_at).slice(0, 10) : "",
    };
}

/** Editable strings → API body (minor units). */
export function toPayload(d: FundraiserDraft) {
    const minor = (s: string) =>
        s
            .split(/[,\s]+/)
            .map((v) => Math.round(Number(v) * 100))
            .filter((v) => Number.isFinite(v) && v > 0);
    return {
        title: d.title,
        slug: d.slug || undefined,
        body_md: d.body_md,
        cover_url: d.cover_url,
        link_url: d.link_url,
        goal_amount: Math.round(Number(d.goal_rupees.replace(/[, ]/g, "")) * 100),
        presets: { INR: minor(d.presets_inr), USD: minor(d.presets_usd) },
        thank_you_message: d.thank_you_message,
        // End of the chosen day, IST, so "ends on the 30th" includes the 30th.
        ends_at: d.ends_at ? `${d.ends_at}T23:59:59+05:30` : "",
    };
}

const field = {
    "& .MuiOutlinedInput-root": { background: "var(--app-bg)", borderRadius: "12px" },
};

export default function FundraiserEditor({
    initial,
    submitLabel,
    busy,
    onSubmit,
    slugLocked,
}: {
    initial: FundraiserDraft;
    submitLabel: string;
    busy: boolean;
    onSubmit: (d: FundraiserDraft) => void;
    slugLocked?: boolean;
}) {
    const [d, setD] = useState<FundraiserDraft>(initial);
    const set = (k: keyof FundraiserDraft) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setD((p) => ({ ...p, [k]: e.target.value }));

    return (
        <Stack spacing={2}>
            <TextField label="Title" value={d.title} onChange={set("title")} required fullWidth sx={field}
                inputProps={{ maxLength: 100 }} helperText="e.g. Build the first Oreo badge boards" />
            <TextField
                label="Link"
                value={d.slug}
                onChange={set("slug")}
                fullWidth
                sx={field}
                disabled={slugLocked}
                placeholder="oreo-badge"
                InputProps={{ startAdornment: <Box component="span" sx={{ color: "var(--app-fg-muted)", mr: 0.5, whiteSpace: "nowrap" }}>payouts.elixpo.com/f/</Box> }}
                helperText={slugLocked ? "The link can't change after publishing — it may already be on printed QR codes." : "Leave empty to use the title. Lowercase letters, numbers and hyphens."}
            />
            <TextField
                label="Why you're raising money"
                value={d.body_md}
                onChange={set("body_md")}
                fullWidth
                multiline
                minRows={6}
                sx={field}
                inputProps={{ maxLength: 10000 }}
                helperText="Markdown: # heading, **bold**, *italic*, [link](https://…), - lists."
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField label="Goal (₹)" value={d.goal_rupees} onChange={set("goal_rupees")} required fullWidth sx={field}
                    inputProps={{ inputMode: "decimal" }} helperText="Payments are collected in INR." />
                <TextField label="Ends on (optional)" type="date" value={d.ends_at} onChange={set("ends_at")} fullWidth sx={field}
                    InputLabelProps={{ shrink: true }} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField label="Preset amounts (₹)" value={d.presets_inr} onChange={set("presets_inr")} fullWidth sx={field}
                    helperText="Comma-separated, up to 6. Min ₹10." />
                <TextField label="Preset amounts ($)" value={d.presets_usd} onChange={set("presets_usd")} fullWidth sx={field}
                    helperText="Shown to visitors outside India; charged in INR." />
            </Stack>
            <TextField label="Cover image URL (optional)" value={d.cover_url} onChange={set("cover_url")} fullWidth sx={field}
                placeholder="https://…" helperText="16:9 works best. Without one, the page shows an Elixpo pattern." />
            <TextField label="GitHub or website (optional)" value={d.link_url} onChange={set("link_url")} fullWidth sx={field}
                placeholder="https://github.com/elixpo/oreo" />
            <TextField label="Thank-you message" value={d.thank_you_message} onChange={set("thank_you_message")} fullWidth
                multiline minRows={2} sx={field} inputProps={{ maxLength: 500 }}
                helperText="Shown after paying and included in the receipt email." />
            <Box>
                <Button
                    onClick={() => onSubmit(d)}
                    disabled={busy || d.title.trim().length < 3 || !Number(d.goal_rupees.replace(/[, ]/g, ""))}
                    sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        px: 3,
                        py: 1.1,
                        borderRadius: "999px",
                        color: "var(--app-on-ink)",
                        background: "var(--app-ink)",
                        "&:hover": { background: "var(--app-ink)", opacity: 0.86 },
                        "&.Mui-disabled": { color: "var(--app-on-ink)", opacity: 0.45 },
                    }}
                >
                    {busy ? "Saving…" : submitLabel}
                </Button>
            </Box>
            <Typography sx={{ color: "var(--app-fg-faint)", fontSize: "0.78rem" }}>
                A fundraiser is a donation page: you can't promise goods in return. To sell something (like a pre-order),
                use a product checkout instead.
            </Typography>
        </Stack>
    );
}
