"use client";

import CheckIcon from "@mui/icons-material/Check";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import FlowDiagram from "@/components/trust/flow-diagram";
import PolicyLinks from "@/components/trust/policy-links";
import PageShell from "../components/page-shell";

interface Tier {
    name: string;
    price: string;
    unit: string;
    rate: string;
    blurb: string;
    features: string[];
    cta: string;
    href: string;
    popular?: boolean;
}

const TIERS: Tier[] = [
    {
        name: "Starter",
        price: "Free",
        unit: "to start",
        rate: "2.0% + ₹3",
        blurb: "Launch your first paid product.",
        features: [
            "Hosted checkout page",
            "Instant access via signed webhooks",
            "1 app connection",
            "Razorpay (INR) payments",
            "Dashboard & reporting",
            "Community Slack support",
        ],
        cta: "Start Free",
        href: "/login",
    },
    {
        name: "Growth",
        price: "₹1,999",
        unit: "/mo + usage",
        rate: "1.5% + ₹3",
        blurb: "Scale revenue across products.",
        features: [
            "Everything in Starter",
            "Creator payouts (RazorpayX)",
            "Unlimited applications",
            "Bring-your-own gateway credentials",
            "Stripe & Razorpay adapters",
            "Priority developer support",
        ],
        cta: "Choose Growth",
        href: "/login",
        popular: true,
    },
    {
        name: "Scale",
        price: "Custom",
        unit: "volume pricing",
        rate: "from 0.9%",
        blurb: "High volume & merchant-of-record.",
        features: [
            "Negotiated volume discounts",
            "Merchant-of-record operations",
            "Local sales tax compliance",
            "Custom payout schedules",
            "Dedicated integration manager",
            "SLA support agreements",
        ],
        cta: "Contact Sales",
        href: "mailto:hello@elixpo.com",
    },
];

const FEES: { label: string; value: string }[] = [
    { label: "Per successful charge", value: "1.5–2.0% + ₹3 (by plan)" },
    { label: "Payouts to creators / sellers", value: "0.25% + ₹5 per payout" },
    { label: "Refunds & chargeback disputes", value: "No Elixpo platform fee" },
    {
        label: "Cross-currency conversion",
        value: "+1% on the converted amount",
    },
];

export default function PricingPage() {
    return (
        <PageShell variant="default">
            <Container
                maxWidth="lg"
                sx={{ pb: { xs: 8, md: 14 } }}
            >
                {/* Header */}
                <Stack
                    alignItems="center"
                    textAlign="center"
                    spacing={2}
                    sx={{ mb: { xs: 6, md: 10 } }}
                >
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: "var(--app-accent)" }} />
                        <Typography
                            sx={{
                                fontSize: "14px",
                                fontWeight: 700,
                                letterSpacing: "0.14em", fontFamily: "var(--font-geist-mono)",
                                color: "var(--app-fg-muted)",
                                textTransform: "uppercase",
                            }}
                        >
                            PRICING PLANS
                        </Typography>
                    </Stack>
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 500,
                            fontSize: { xs: "2.7rem", md: "4.6rem" }, lineHeight: 0.96,
                            letterSpacing: "-0.055em",
                            color: "var(--app-fg)",
                            fontFamily: "var(--font-sofia-sans)",
                        }}
                    >
                        Pay only when you get paid
                    </Typography>
                    <Typography
                        sx={{
                            maxWidth: 600,
                            color: "var(--app-fg)",
                            fontSize: "16px",
                            lineHeight: 1.6,
                            fontFamily: "var(--font-sofia-sans)",
                            fontWeight: 450,
                        }}
                    >
                        A simple platform fee on each successful charge, on top of your payment provider's own fee. No setup costs, no monthly minimums.
                    </Typography>
                </Stack>

                {/* Tiers Grid */}
                <Box
                    sx={{
                        display: "grid",
                        gap: 4,
                        gridTemplateColumns: {
                            xs: "1fr",
                            md: "repeat(3, 1fr)",
                        },
                        alignItems: "stretch",
                        mb: 8,
                    }}
                >
                    {TIERS.map((t) => (
                        <Box
                            key={t.name}
                            sx={{
                                position: "relative",
                                display: "flex",
                                flexDirection: "column",
                                p: { xs: 3.5, md: 4 },
                                borderRadius: "var(--radius-card)",
                                background: "var(--app-bg-2)", // Lifted Cream
                                border: t.popular
                                    ? "2px solid var(--app-fg)" // Bolder border for popular
                                    : "1.5px solid var(--app-overlay)",
                                boxShadow: t.popular
                                    ? "color-mix(in srgb, var(--app-fg) 8%, transparent) 0px 24px 48px 0px"
                                    : "color-mix(in srgb, var(--app-fg) 4%, transparent) 0px 4px 24px 0px",
                            }}
                        >
                            {t.popular && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: 16,
                                        right: 16,
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: "999px",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        letterSpacing: "0.14em", fontFamily: "var(--font-geist-mono)",
                                        textTransform: "uppercase",
                                        color: "var(--app-on-ink)",
                                        background: "var(--app-ink)", // Ink Black pill badge
                                    }}
                                >
                                    Popular
                                </Box>
                            )}

                            <Typography
                                sx={{
                                    fontWeight: 500,
                                    fontSize: "22px",
                                    color: "var(--app-fg)",
                                    mb: 1.5,
                                    fontFamily: "var(--font-sofia-sans)",
                                }}
                            >
                                {t.name}
                            </Typography>
                            <Typography
                                sx={{
                                    color: "var(--app-fg-muted)",
                                    fontSize: "14px",
                                    lineHeight: 1.4,
                                    mb: 3,
                                    fontFamily: "var(--font-sofia-sans)",
                                    fontWeight: 450,
                                }}
                            >
                                {t.blurb}
                            </Typography>

                            <Stack
                                direction="row"
                                alignItems="baseline"
                                spacing={1}
                                sx={{ mb: 1 }}
                            >
                                <Typography
                                    sx={{
                                        fontWeight: 500,
                                        fontSize: "36px",
                                        color: "var(--app-fg)",
                                        fontFamily: "var(--font-sofia-sans)",
                                        letterSpacing: "-0.045em",
                                    }}
                                >
                                    {t.price}
                                </Typography>
                                <Typography
                                    sx={{
                                        color: "var(--app-fg-muted)",
                                        fontSize: "14px",
                                        fontFamily: "var(--font-sofia-sans)",
                                    }}
                                >
                                    {t.unit}
                                </Typography>
                            </Stack>

                            <Typography
                                sx={{
                                    color: "var(--app-accent)", // Signal Orange for key pricing metrics
                                    fontSize: "15px",
                                    fontWeight: 600,
                                    mb: 4,
                                    fontFamily: "var(--font-sofia-sans)",
                                }}
                            >
                                {t.rate} per transaction
                            </Typography>

                            {/* Features list */}
                            <Stack spacing={2} sx={{ mb: 5, flexGrow: 1 }}>
                                {t.features.map((f) => (
                                    <Stack
                                        key={f}
                                        direction="row"
                                        spacing={1.5}
                                        alignItems="flex-start"
                                    >
                                        <CheckIcon
                                            sx={{
                                                fontSize: 18,
                                                color: "var(--app-accent)", // Signal Orange check icons
                                                mt: "2px",
                                            }}
                                        />
                                        <Typography
                                            sx={{
                                                color: "var(--app-fg)",
                                                fontSize: "14px",
                                                lineHeight: 1.4,
                                                fontFamily: "var(--font-sofia-sans)",
                                                fontWeight: 450,
                                            }}
                                        >
                                            {f}
                                        </Typography>
                                    </Stack>
                                ))}
                            </Stack>

                            {/* Action CTA Button */}
                            {t.popular ? (
                                /* Primary Ink Pill */
                                <Button
                                    component={Link}
                                    href={t.href}
                                    variant="contained"
                                    disableElevation
                                    sx={{
                                        background: "var(--app-ink)",
                                        color: "var(--app-on-ink)",
                                        border: "1.5px solid var(--app-ink)",
                                        borderRadius: "999px",
                                        py: 1.4,
                                        fontSize: "15px",
                                        fontWeight: 500,
                                        textTransform: "none",
                                        fontFamily: "var(--font-sofia-sans)",
                                        "&:hover": {
                                            background: "var(--app-ink)",
                                            borderColor: "var(--app-ink)",
                                        },
                                    }}
                                >
                                    {t.cta}
                                </Button>
                            ) : (
                                /* Secondary Outlined Pill */
                                <Button
                                    component={t.href.startsWith("mailto:") ? "a" : Link}
                                    href={t.href}
                                    variant="outlined"
                                    disableElevation
                                    sx={{
                                        background: "var(--app-surface)",
                                        color: "var(--app-fg)",
                                        border: "1.5px solid var(--app-fg)",
                                        borderRadius: "999px",
                                        py: 1.4,
                                        fontSize: "15px",
                                        fontWeight: 500,
                                        textTransform: "none",
                                        fontFamily: "var(--font-sofia-sans)",
                                        "&:hover": {
                                            background: "var(--app-overlay)",
                                            borderColor: "var(--app-fg)",
                                        },
                                    }}
                                >
                                    {t.cta}
                                </Button>
                            )}
                        </Box>
                    ))}
                </Box>

                {/* Line Item Fee Breakdown */}
                <Box
                    sx={{
                        p: { xs: 4, md: 5 },
                        borderRadius: "var(--radius-card)",
                        background: "var(--app-bg-2)", // Lifted Cream
                        border: "1.5px solid var(--app-overlay)",
                        boxShadow: "rgba(20, 32, 24, 0.04) 0px 4px 24px 0px",
                        mb: 6,
                    }}
                >
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 500,
                            fontSize: "22px",
                            mb: 3,
                            color: "var(--app-fg)",
                            letterSpacing: "-0.035em",
                            fontFamily: "var(--font-sofia-sans)",
                        }}
                    >
                        Detailed fee breakdown
                    </Typography>

                    <Stack
                        divider={
                            <Box
                                sx={{
                                    borderTop: "1px solid var(--app-overlay)",
                                }}
                            />
                        }
                    >
                        {FEES.map((row) => (
                            <Stack
                                key={row.label}
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ py: 2, gap: 2 }}
                            >
                                <Typography
                                    sx={{
                                        color: "var(--app-fg)",
                                        fontSize: "15px",
                                        fontFamily: "var(--font-sofia-sans)",
                                        fontWeight: 450,
                                    }}
                                >
                                    {row.label}
                                </Typography>
                                <Typography
                                    sx={{
                                        color: "var(--app-fg)",
                                        fontWeight: 500,
                                        fontSize: "15px",
                                        fontFamily: "var(--font-sofia-sans)",
                                    }}
                                >
                                    {row.value}
                                </Typography>
                            </Stack>
                        ))}
                    </Stack>

                    <Typography
                        sx={{
                            color: "var(--app-fg-muted)",
                            fontSize: "13px",
                            mt: 3,
                            lineHeight: 1.6,
                            fontFamily: "var(--font-sofia-sans)",
                        }}
                    >
                        Network provider merchant account fees (charged directly by Stripe or Razorpay) are billed separately. Local goods and services tax (GST) is applied to processing charges in accordance with regional regulations.
                    </Typography>
                </Box>

                {/* How payments work */}
                <Box
                    component="section"
                    aria-labelledby="how-payments-work"
                    sx={{
                        p: { xs: 3, md: 5 },
                        borderRadius: "var(--radius-card)",
                        background: "var(--app-bg-2)",
                        border: "1.5px solid var(--app-overlay)",
                        mb: 6,
                    }}
                >
                    <Typography
                        id="how-payments-work"
                        variant="h3"
                        sx={{
                            fontWeight: 500,
                            fontSize: "22px",
                            mb: 1,
                            color: "var(--app-fg)",
                            letterSpacing: "-0.035em",
                            fontFamily: "var(--font-sofia-sans)",
                        }}
                    >
                        How payments work
                    </Typography>
                    <Typography
                        sx={{
                            color: "var(--app-fg-muted)",
                            fontSize: "14px",
                            lineHeight: 1.6,
                            mb: 4,
                            maxWidth: 640,
                            fontFamily: "var(--font-sofia-sans)",
                        }}
                    >
                        Payments are processed by Razorpay, an RBI-regulated payment gateway. Card and UPI details are entered on Razorpay's checkout and never reach Elixpo or your app.
                    </Typography>
                    <FlowDiagram
                        title="How payments work"
                        steps={[
                            {
                                icon: "app",
                                title: "Your app",
                                body: "Sends the buyer to Elixpo Pay's hosted checkout.",
                            },
                            {
                                icon: "phone",
                                title: "Buyer pays",
                                body: "On Razorpay with UPI, cards or netbanking.",
                            },
                            {
                                icon: "key",
                                title: "Signed webhook",
                                body: "Elixpo Pay records the payment once and notifies your app.",
                            },
                            {
                                icon: "bank",
                                title: "Access and payouts",
                                body: "The buyer's access unlocks; your earnings are paid out to your bank.",
                            },
                        ]}
                    />
                    <PolicyLinks trust="buying"
                        lead="Policies that apply to every payment:"
                        style={{ marginTop: "2rem", fontFamily: "var(--font-sofia-sans)" }}
                    />
                </Box>

                {/* Bottom Assistance Link */}
                <Typography
                    sx={{
                        textAlign: "center",
                        color: "var(--app-fg-muted)",
                        fontSize: "15px",
                        fontFamily: "var(--font-sofia-sans)",
                    }}
                >
                    Questions about enterprise transaction volumes?{" "}
                    <Box
                        component="a"
                        href="mailto:hello@elixpo.com"
                        sx={{ color: "var(--app-accent)", textDecoration: "none", fontWeight: 500, "&:hover": { textDecoration: "underline" } }}
                    >
                        Talk to our payments team →
                    </Box>
                </Typography>
            </Container>
        </PageShell>
    );
}
