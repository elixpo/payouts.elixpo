"use client";

import MailOutlineIcon from "@mui/icons-material/MailOutline";
import SendIcon from "@mui/icons-material/Send";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { fmtDate, GlassCard } from "@/components/dashboard-ui";

interface MailEventInfo {
    type: string;
    label: string;
    description: string;
}

interface MailSettings {
    events: MailEventInfo[];
    variables: Record<string, string>;
    secret_preview: string | null;
    hooks: Record<string, { url: string; status: string }>;
    deliveries: {
        id: string;
        event: string;
        to_email: string | null;
        status: string;
        response_status: number | null;
        response_body: string | null;
        created_at: string;
    }[];
}

const MAILS_URL = "https://mails.elixpo.com";

const STATUS_COLOR: Record<string, string> = {
    sent: "#4ade80",
    queued: "#fbbf24",
    suppressed: "var(--app-fg-muted)",
    skipped: "var(--app-fg-muted)",
    failed: "#f87171",
};

/**
 * Buyer emails via Elixpo Mails — one trigger URL per payment event plus the
 * Mails product signing secret. Self-contained: owns its own fetches.
 */
export default function MailNotificationsCard({ productId }: { productId: string }) {
    const api = `/api/dashboard/products/${encodeURIComponent(productId)}/mail`;
    const [data, setData] = useState<MailSettings | null>(null);
    const [urls, setUrls] = useState<Record<string, string>>({});
    const [secret, setSecret] = useState("");
    const [busy, setBusy] = useState(false);
    const [testing, setTesting] = useState<string | null>(null);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

    const load = useCallback(async () => {
        const r = await fetch(api, { credentials: "include" });
        if (!r.ok) return;
        const d = (await r.json()) as MailSettings;
        setData(d);
        setUrls(Object.fromEntries(d.events.map((e) => [e.type, d.hooks[e.type]?.url ?? ""])));
    }, [api]);

    useEffect(() => {
        load();
    }, [load]);

    const save = async () => {
        setBusy(true);
        setMsg(null);
        try {
            const r = await fetch(api, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hooks: urls,
                    ...(secret.trim() ? { signing_secret: secret.trim() } : {}),
                }),
            });
            const d: any = await r.json().catch(() => ({}));
            if (!r.ok) {
                setMsg({ ok: false, text: d.error_description || d.error || "Save failed" });
                return;
            }
            setSecret("");
            setMsg({ ok: true, text: "Saved. Buyers will get these emails from now on." });
            await load();
        } finally {
            setBusy(false);
        }
    };

    const sendTest = async (event: string) => {
        setTesting(event);
        setMsg(null);
        try {
            const r = await fetch(api, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event }),
            });
            const d: any = await r.json().catch(() => ({}));
            setMsg(
                r.ok
                    ? { ok: true, text: `Test email sent to ${d.to}.` }
                    : {
                          ok: false,
                          text: `Elixpo Mails rejected the test: ${
                              d.mails?.message || d.mails?.error || d.error_description || d.error || r.status
                          }`,
                      },
            );
            await load();
        } finally {
            setTesting(null);
        }
    };

    if (!data) {
        return (
            <GlassCard sx={{ mb: 2, display: "grid", placeItems: "center", py: 4 }}>
                <CircularProgress size={22} sx={{ color: "#9b7bf7" }} />
            </GlassCard>
        );
    }

    const configured = Object.keys(data.hooks).length > 0;
    const dirty =
        secret.trim() !== "" ||
        data.events.some((e) => (urls[e.type] ?? "") !== (data.hooks[e.type]?.url ?? ""));

    return (
        <GlassCard sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 0.5 }}>
                <MailOutlineIcon sx={{ color: "#c4b5fd" }} />
                <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                    Buyer emails · Elixpo Mails
                </Typography>
                {configured && (
                    <Chip size="small" label="Connected" sx={{ color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", background: "transparent" }} />
                )}
            </Stack>
            <Typography sx={{ color: "var(--app-fg-muted)", fontSize: "0.82rem", mb: 2 }}>
                Send receipts and subscription emails from your own mailbox, designed in{" "}
                <a href={MAILS_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#c4b5fd" }}>
                    Elixpo Mails
                </a>
                . In Mails, create a template per event and add a webhook; paste each webhook's
                trigger URL below with your Mails product's signing secret.
            </Typography>

            <Typography sx={label}>Mails signing secret</Typography>
            <TextField
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder={
                    data.secret_preview
                        ? `Saved (${data.secret_preview}) — paste a new one to replace`
                        : "Paste your Elixpo Mails product secret"
                }
                type="password"
                autoComplete="off"
                size="small"
                fullWidth
                sx={{ ...field, mb: 2 }}
            />

            <Stack spacing={1.6}>
                {data.events.map((e) => (
                    <Box key={e.type}>
                        <Typography sx={label}>
                            {e.label} <code style={{ textTransform: "none" }}>{e.type}</code>
                        </Typography>
                        <Typography sx={{ color: "var(--app-fg-muted)", fontSize: "0.76rem", mb: 0.6 }}>
                            {e.description}
                        </Typography>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            <TextField
                                value={urls[e.type] ?? ""}
                                onChange={(ev) => setUrls((u) => ({ ...u, [e.type]: ev.target.value }))}
                                placeholder={`${MAILS_URL}/v1/hooks/…  (leave empty to not send)`}
                                size="small"
                                fullWidth
                                sx={field}
                            />
                            <Button
                                onClick={() => sendTest(e.type)}
                                disabled={!data.hooks[e.type] || testing !== null || dirty}
                                title={dirty ? "Save first" : "Send a sample to your own email"}
                                startIcon={
                                    testing === e.type ? (
                                        <CircularProgress size={14} />
                                    ) : (
                                        <SendIcon sx={{ fontSize: "0.95rem !important" }} />
                                    )
                                }
                                sx={{ ...outlineBtn, whiteSpace: "nowrap", flexShrink: 0 }}
                            >
                                Send test
                            </Button>
                        </Stack>
                    </Box>
                ))}
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
                <Button
                    onClick={save}
                    disabled={busy || !dirty}
                    sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        color: "#fff",
                        px: 2.4,
                        background: "#7c5cff",
                        borderRadius: "10px",
                        "&:hover": { background: "#8a6dff" },
                        "&.Mui-disabled": { opacity: 0.5, color: "#fff" },
                    }}
                >
                    {busy ? "Saving…" : "Save"}
                </Button>
                {msg && (
                    <Typography role="status" sx={{ fontSize: "0.82rem", color: msg.ok ? "#4ade80" : "#f87171" }}>
                        {msg.text}
                    </Typography>
                )}
            </Stack>

            <Box component="details" sx={{ mt: 2.5 }}>
                <Box component="summary" sx={{ cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
                    Template variables
                </Box>
                <Typography sx={{ color: "var(--app-fg-muted)", fontSize: "0.78rem", my: 1 }}>
                    Use these as <code>{"{{name}}"}</code> in your Mails templates. Buyer email comes
                    from <code>customer.email</code> on the checkout session.
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 0.5, fontSize: "0.78rem" }}>
                    {Object.entries(data.variables).map(([k, v]) => (
                        <Box key={k} sx={{ display: "contents" }}>
                            <code>{`{{${k}}}`}</code>
                            <Box sx={{ color: "var(--app-fg-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</Box>
                        </Box>
                    ))}
                </Box>
            </Box>

            {data.deliveries.length > 0 && (
                <Box component="details" sx={{ mt: 1.5 }}>
                    <Box component="summary" sx={{ cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
                        Recent buyer emails ({data.deliveries.length})
                    </Box>
                    <Stack spacing={0.6} sx={{ mt: 1 }}>
                        {data.deliveries.map((d) => (
                            <Stack
                                key={d.id}
                                direction="row"
                                spacing={1}
                                sx={{ fontSize: "0.78rem", minWidth: 0 }}
                                title={d.response_body ?? ""}
                            >
                                <Box sx={{ color: STATUS_COLOR[d.status] ?? "inherit", fontWeight: 600, width: 78, flexShrink: 0 }}>
                                    {d.status}
                                </Box>
                                <Box sx={{ width: 150, flexShrink: 0 }}><code>{d.event}</code></Box>
                                <Box sx={{ flexGrow: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {d.to_email ?? "—"}
                                </Box>
                                <Box sx={{ color: "var(--app-fg-muted)", flexShrink: 0 }}>{fmtDate(d.created_at)}</Box>
                            </Stack>
                        ))}
                    </Stack>
                </Box>
            )}
        </GlassCard>
    );
}

const label = {
    fontSize: "0.7rem",
    color: "var(--app-fg-faint)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    mb: 0.5,
};

const field = {
    "& .MuiOutlinedInput-root": {
        color: "var(--app-fg)",
        background: "var(--app-overlay)",
        "& fieldset": { borderColor: "var(--app-border)" },
        "&:hover fieldset": { borderColor: "rgba(155,123,247,0.4)" },
        "&.Mui-focused fieldset": { borderColor: "#9b7bf7" },
    },
};

const outlineBtn = {
    textTransform: "none",
    fontWeight: 600,
    color: "#c4b5fd",
    border: "1px solid rgba(155,123,247,0.3)",
    borderRadius: "10px",
    px: 2,
    "&:hover": { borderColor: "rgba(155,123,247,0.6)", background: "rgba(155,123,247,0.06)" },
    "&.Mui-disabled": { opacity: 0.45 },
};
