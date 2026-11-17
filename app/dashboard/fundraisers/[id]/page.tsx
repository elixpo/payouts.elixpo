"use client";

export const runtime = "edge";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import LaunchIcon from "@mui/icons-material/Launch";
import { Alert, Box, Button, CircularProgress, Grid, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import { fmtDate, formatMoney, GlassCard, StatCard, StatusChip } from "@/components/dashboard-ui";
import FundraiserEditor, { type FundraiserDraft, toDraft, toPayload } from "@/components/fundraiser-editor";
import FundraiserQr from "@/components/fundraiser-qr";

const ink = {
    textTransform: "none",
    fontWeight: 700,
    borderRadius: "999px",
    px: 2.2,
    color: "var(--app-on-ink)",
    background: "var(--app-ink)",
    "&:hover": { background: "var(--app-ink)", opacity: 0.86 },
    "&.Mui-disabled": { color: "var(--app-on-ink)", opacity: 0.45 },
};
const ghost = {
    textTransform: "none",
    fontWeight: 700,
    borderRadius: "999px",
    px: 2,
    color: "var(--app-fg)",
    border: "1px solid var(--app-border)",
    "&:hover": { borderColor: "var(--app-fg)" },
};

export default function FundraiserDetail() {
    const id = String(useParams().id);
    const [f, setF] = useState<any>(null);
    const [missing, setMissing] = useState(false);
    const [rows, setRows] = useState<any[]>([]);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [confirmClose, setConfirmClose] = useState(false);
    const [editorKey, setEditorKey] = useState(0);
    const [origin, setOrigin] = useState("https://payouts.elixpo.com");

    const load = useCallback(async () => {
        const [a, b] = await Promise.all([
            fetch(`/api/dashboard/fundraisers/${id}`, { credentials: "include" }),
            fetch(`/api/dashboard/fundraisers/${id}/contributions`, { credentials: "include" }),
        ]);
        if (a.status === 404) return setMissing(true);
        if (a.ok) setF(((await a.json()) as any).fundraiser);
        if (b.ok) setRows(((await b.json()) as any).contributions ?? []);
    }, [id]);

    useEffect(() => {
        setOrigin(window.location.origin);
        load();
        // Contributions land live — refresh while the page is open.
        const t = setInterval(load, 15000);
        return () => clearInterval(t);
    }, [load]);

    const patch = async (body: Record<string, unknown>, ok: string) => {
        setBusy(true);
        setMsg(null);
        const r = await fetch(`/api/dashboard/fundraisers/${id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const j: any = await r.json().catch(() => ({}));
        setBusy(false);
        if (!r.ok) return setMsg({ ok: false, text: j.error_description || "Something went wrong." });
        setF(j.fundraiser);
        setEditorKey((k) => k + 1);
        setMsg({ ok: true, text: ok });
    };

    if (missing) {
        return (
            <GlassCard sx={{ textAlign: "center", py: 6 }}>
                <Typography sx={{ fontWeight: 700 }}>Fundraiser not found</Typography>
                <Button component={Link} href="/dashboard/fundraisers" sx={{ ...ghost, mt: 2 }}>
                    Back to fundraisers
                </Button>
            </GlassCard>
        );
    }
    if (!f) {
        return (
            <Box sx={{ py: 8, textAlign: "center" }}>
                <CircularProgress size={26} />
            </Box>
        );
    }

    const url = `${origin}/f/${f.slug}`;
    const pct = f.goal_amount ? Math.min(100, Math.round((f.raised / f.goal_amount) * 100)) : 0;
    const canPublish = (f.status === "draft" || f.status === "closed") && f.payout_ready && !f.ended;

    return (
        <Box>
            <Button component={Link} href="/dashboard/fundraisers" startIcon={<ArrowBackIcon />} sx={{ ...ghost, border: 0, px: 0, mb: 1.5 }}>
                Fundraisers
            </Button>

            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2.5 }}>
                <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography sx={{ fontWeight: 800, fontSize: "1.7rem", letterSpacing: "-0.02em", overflowWrap: "anywhere" }}>
                            {f.title}
                        </Typography>
                        <StatusChip status={f.status === "live" ? "active" : f.status === "held" ? "failed" : f.status === "closed" ? "expired" : "open"} />
                    </Stack>
                    <Typography sx={{ color: "var(--app-fg-muted)", fontSize: "0.88rem" }}>
                        {f.status === "live" ? "Live — accepting contributions." : f.status === "draft" ? "Draft — only you can see it." : f.status === "closed" ? "Closed — the page stays up as a record." : "Held by Elixpo moderation."}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button component="a" href={`/f/${f.slug}`} target="_blank" startIcon={<LaunchIcon />} sx={ghost}>
                        {f.status === "draft" ? "Preview" : "View page"}
                    </Button>
                    {f.status === "live" ? (
                        <Button onClick={() => setConfirmClose(true)} disabled={busy} sx={ghost}>
                            Close fundraiser
                        </Button>
                    ) : f.status !== "held" ? (
                        <Button onClick={() => patch({ action: "publish" }, "Published — your page is live.")} disabled={busy || !canPublish} sx={ink}>
                            {f.status === "closed" ? "Re-open" : "Publish"}
                        </Button>
                    ) : null}
                </Stack>
            </Stack>

            {f.status === "held" && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {f.moderation_note || "This page is held for review."} Contact hello@elixpo.com to restore it.
                </Alert>
            )}
            {f.status === "draft" && f.moderation_note && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {f.moderation_note}
                </Alert>
            )}
            {!f.payout_ready && f.status !== "held" && (
                <Alert severity="info" sx={{ mb: 2 }} action={<Button component={Link} href="/dashboard/payouts" sx={{ textTransform: "none", fontWeight: 700 }}>Connect payouts</Button>}>
                    {f.payout_reason} A fundraiser can go public only once contributions can reach you.
                </Alert>
            )}
            {f.ended && f.status !== "held" && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    The end date has passed, so the page no longer accepts contributions. Move the date forward to re-open it.
                </Alert>
            )}
            {msg && (
                <Alert severity={msg.ok ? "success" : "error"} sx={{ mb: 2 }} onClose={() => setMsg(null)}>
                    {msg.text}
                </Alert>
            )}

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard label="Raised" value={formatMoney(f.raised, f.goal_currency)} sub={`of ${formatMoney(f.goal_amount, f.goal_currency)} goal`} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard label="Progress" value={`${pct}%`} sub={f.ends_at ? `Ends ${fmtDate(f.ends_at)}` : "No end date"} accent="var(--app-success)" />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard label="Contributors" value={String(f.contributors)} sub={f.verified ? "Shown as Verified" : "Not verified yet"} accent="var(--app-orange)" />
                </Grid>
            </Grid>

            <GlassCard sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", mb: 0.5 }}>Share</Typography>
                <Typography sx={{ color: "var(--app-fg-muted)", fontSize: "0.85rem", mb: 2 }}>
                    Print the QR code on the badge box, a poster or a slide — it opens the page straight on a phone.
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5, p: 1.2, borderRadius: "12px", background: "var(--app-surface-2)", minWidth: 0 }}>
                    <Box sx={{ flexGrow: 1, fontFamily: "var(--font-geist-mono)", fontSize: "0.85rem", overflowX: "auto", whiteSpace: "nowrap" }}>{url}</Box>
                    <Button onClick={() => navigator.clipboard?.writeText(url).then(() => setMsg({ ok: true, text: "Link copied." }))} startIcon={<ContentCopyIcon />} sx={{ ...ghost, flexShrink: 0 }}>
                        Copy
                    </Button>
                </Stack>
                <FundraiserQr url={url} title={f.title} slug={f.slug} />
            </GlassCard>

            <GlassCard sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>Contributions</Typography>
                    <Button component="a" href={`/api/dashboard/fundraisers/${id}/contributions?format=csv`} startIcon={<DownloadIcon />} disabled={!rows.length} sx={ghost}>
                        Export CSV
                    </Button>
                </Stack>
                {rows.length === 0 ? (
                    <Typography sx={{ color: "var(--app-fg-muted)", fontSize: "0.9rem", py: 2 }}>
                        No contributions yet. They appear here within seconds of each payment.
                    </Typography>
                ) : (
                    <Box sx={{ borderTop: "1px solid var(--app-border)" }}>
                        {rows.map((c) => (
                            <Stack key={c.id} direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.3, sm: 2 }} sx={{ py: 1.3, borderBottom: "1px solid var(--app-border)" }}>
                                <Box sx={{ width: { sm: 130 }, flexShrink: 0, fontWeight: 700 }}>{formatMoney(c.amount, c.currency)}</Box>
                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: "0.92rem" }}>
                                        {c.name}
                                        {!c.public && c.name !== "Anonymous" && (
                                            <Box component="span" sx={{ ml: 1, color: "var(--app-fg-faint)", fontSize: "0.75rem", fontWeight: 400 }}>
                                                (hidden on the page)
                                            </Box>
                                        )}
                                    </Typography>
                                    {c.message && <Typography sx={{ color: "var(--app-fg-muted)", fontSize: "0.86rem", overflowWrap: "anywhere" }}>“{c.message}”</Typography>}
                                </Box>
                                <Box sx={{ color: "var(--app-fg-muted)", fontSize: "0.82rem", flexShrink: 0 }}>{fmtDate(c.paid_at)}</Box>
                            </Stack>
                        ))}
                    </Box>
                )}
            </GlassCard>

            <GlassCard>
                <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", mb: 2 }}>Edit</Typography>
                <FundraiserEditor
                    key={editorKey}
                    initial={toDraft(f)}
                    submitLabel="Save changes"
                    busy={busy}
                    slugLocked={!!f.published_at}
                    onSubmit={(d: FundraiserDraft) => {
                        const p: Record<string, unknown> = toPayload(d);
                        if (f.published_at) delete p.slug;
                        patch(p, "Saved.");
                    }}
                />
            </GlassCard>

            <ConfirmDialog
                open={confirmClose}
                title="Close this fundraiser?"
                message="It stops accepting contributions now. The page stays up as a record with the final total, and you can re-open it later."
                confirmLabel="Close fundraiser"
                busy={busy}
                onConfirm={async () => {
                    await patch({ action: "close" }, "Closed. The page stays up as a record.");
                    setConfirmClose(false);
                }}
                onClose={() => setConfirmClose(false)}
            />
        </Box>
    );
}
