"use client";

import DownloadIcon from "@mui/icons-material/Download";
import { Box, Button, Stack } from "@mui/material";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Wrap a title into ≤ 2 lines of ~26 characters for the QR card. */
function wrap(title: string): string[] {
    const words = title.split(/\s+/);
    const lines: string[] = [""];
    for (const w of words) {
        const cur = lines[lines.length - 1];
        if ((cur + " " + w).trim().length <= 26) lines[lines.length - 1] = (cur + " " + w).trim();
        else if (lines.length < 2) lines.push(w);
        else {
            lines[1] = `${lines[1].slice(0, 24)}…`;
            break;
        }
    }
    return lines;
}

/** Branded QR card (SVG): title on top, QR in the middle, the link below. */
async function brandedSvg(url: string, title: string): Promise<string> {
    const qr = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 0, color: { dark: "#142018", light: "#ffffff" } });
    const inner = qr.replace(/<\?xml[^>]*>/, "").replace("<svg ", '<svg x="70" y="170" width="460" height="460" ');
    const lines = wrap(title);
    const titleSvg = lines
        .map((l, i) => `<text x="300" y="${82 + i * 46}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="#142018">${esc(l)}</text>`)
        .join("");
    const shortUrl = url.replace(/^https?:\/\//, "");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="760" viewBox="0 0 600 760">
<rect width="600" height="760" rx="36" fill="#fbfbf8"/>
<rect x="40" y="148" width="520" height="504" rx="24" fill="#ffffff" stroke="#d7dbd6"/>
${titleSvg}
${inner}
<text x="300" y="700" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="20" fill="#5f6962">${esc(shortUrl)}</text>
<text x="300" y="732" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#3a65c7">SCAN TO CONTRIBUTE · ELIXPO PAY</text>
</svg>`;
}

function download(name: string, blob: Blob) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export default function FundraiserQr({ url, title, slug }: { url: string; title: string; slug: string }) {
    const [svg, setSvg] = useState<string>("");

    useEffect(() => {
        brandedSvg(url, title).then(setSvg).catch(() => setSvg(""));
    }, [url, title]);

    const png = async () => {
        if (!svg) return;
        const img = new Image();
        img.src = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = 1200; // 2× for print
        canvas.height = 1520;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(img.src);
        canvas.toBlob((b) => b && download(`${slug}-qr.png`, b), "image/png");
    };

    return (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} alignItems={{ sm: "center" }}>
            <Box
                sx={{ width: 180, flexShrink: 0, borderRadius: "16px", overflow: "hidden", border: "1px solid var(--app-border)", background: "#fbfbf8", "& svg": { display: "block", width: "100%", height: "auto" } }}
                // biome-ignore lint/security/noDangerouslySetInnerHtml: generated locally, title is XML-escaped
                dangerouslySetInnerHTML={{ __html: svg }}
                aria-label={`QR code for ${url}`}
                role="img"
            />
            <Stack spacing={1}>
                <Button onClick={png} disabled={!svg} startIcon={<DownloadIcon />} sx={btn}>
                    Download PNG
                </Button>
                <Button
                    onClick={() => svg && download(`${slug}-qr.svg`, new Blob([svg], { type: "image/svg+xml" }))}
                    disabled={!svg}
                    startIcon={<DownloadIcon />}
                    sx={btn}
                >
                    Download SVG
                </Button>
            </Stack>
        </Stack>
    );
}

const btn = {
    textTransform: "none",
    fontWeight: 700,
    borderRadius: "999px",
    px: 2,
    color: "var(--app-fg)",
    border: "1px solid var(--app-border)",
    "&:hover": { borderColor: "var(--app-fg)" },
};
