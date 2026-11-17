"use client";

import { Box } from "@mui/material";
import { Code, DocH2, DocLead, DocList, DocP, DocTitle } from "@/components/docs-prose";

export default function FundraisersDocs() {
    return (
        <Box>
            <DocTitle>Fundraisers</DocTitle>
            <DocLead>
                A public page with a reason and a goal where anyone can contribute what they like in a couple of taps — by
                link or QR code, no account needed. Contributors get a thank-you page and a receipt email; you see every
                contribution live in the dashboard.
            </DocLead>

            <DocH2>Start a fundraiser</DocH2>
            <DocList
                items={[
                    <>
                        Sign in with your Elixpo account and open <strong>Dashboard → Fundraisers → New fundraiser</strong>.
                    </>,
                    <>
                        Add a title, the reason (markdown), a goal in rupees, preset amounts in ₹ and $, an optional cover
                        image, end date, GitHub/website link and thank-you message. It's saved as a <strong>draft</strong>{" "}
                        you can preview at <Code>/f/&lt;link&gt;</Code>.
                    </>,
                    <>
                        <strong>Connect payouts</strong> (Dashboard → Payouts). A fundraiser can only go public once
                        contributions can reach your bank account through Razorpay Route — that same KYC is what puts the{" "}
                        <strong>Verified</strong> mark on your page.
                    </>,
                    <>
                        Press <strong>Publish</strong>. Then share the link, or download the branded <strong>QR code</strong>{" "}
                        (PNG for print, SVG for design tools). The link can't change after publishing, so printed codes keep
                        working.
                    </>,
                ]}
            />

            <DocH2>What contributors see</DocH2>
            <DocP>
                Your name and avatar, the title, cover and reason, a progress bar (amount raised against the goal and the
                number of contributors) and recent supporters who chose to show their name. On the right: preset amounts, a
                custom amount, name (optional, with "show my name"), email for the receipt, an optional message and one Pay
                button. It works on a 360 px phone — most people arrive by scanning the QR.
            </DocP>
            <DocP>
                Payments go through Razorpay Checkout (UPI, cards, netbanking). Visitors in India see rupees; everyone else
                sees dollars with a switch. Until an international route is live, dollar amounts are{" "}
                <strong>charged in INR</strong> at a fixed rate, shown on the page before paying.
            </DocP>

            <DocH2>Managing it</DocH2>
            <DocList
                items={[
                    <>The dashboard shows the total, progress and each contribution (amount, name or "Anonymous", message, date), refreshing every few seconds. Export it as CSV.</>,
                    <>You get an email for every contribution. Contributor emails are used only for their receipt and are never shown to you.</>,
                    <><strong>Close</strong> stops new payments and keeps the page up as a record; you can re-open it. You can edit everything except the link at any time.</>,
                ]}
            />

            <DocH2>Rules and trust</DocH2>
            <DocList
                items={[
                    <>A fundraiser is a donation, not a purchase: you can't promise goods in return. To sell something (for example a pre-order), use a product checkout.</>,
                    <>Every page states who receives the money, that contributions are not tax-deductible, and links the refund policy.</>,
                    <>Anyone can <strong>report</strong> a page. Elixpo admins review reports and can unpublish a page or hold it (it shows "under review" and accepts no payments).</>,
                ]}
            />
        </Box>
    );
}
