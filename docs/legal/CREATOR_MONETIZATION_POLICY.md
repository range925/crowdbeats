# Crowdbeats Creator Monetization & Fee Agreement

**Effective Date:** August 21, 2026  
**Jurisdiction:** State of California, United States of America  
**Entity:** Crowdbeats LLC ("Company", "we", "us", or "our")  
**Platform Philosophy:** 100% Free for Creators & Fans · 6% Transparent Platform Fee + Stripe Direct Processing · Aligned Growth  
**Canonical URL:** `https://crowdbeats.ai/legal/creator-monetization`  
**Version:** 2026-08-21-v5  

---

### 🌟 Our "Why" on Creator Monetization (Start With Why)

> *"In the infinite game of music, leadership is about setting up the stage so others can shine. Why did we build our monetization model this way? Because for decades, the music industry has forced creators to pay upfront—for memberships, for distribution, for tools—while taking huge percentages behind opaque curtains.*
> 
> *We believe in pure alignment: **Crowdbeats is 100% free to join, build profiles, and broadcast.** We never ask you for monthly subscription dues. We only succeed when you succeed.*
> 
> *When your fans support you—whether it is a \$5 tip on a sidewalk stage or a \$5,000 tour campaign—we take a transparent **6% platform technology fee plus whatever direct processing fees Stripe charges**. That 6% fee directly powers the double-entry financial ledger, real-time audio synchronization, and stage discovery radar that connect you with your audience. Everything else flows straight into your pocket or is mathematically divided across your band members according to your rules. No games. No surprises. Just music."*
> 
> — **The Crowdbeats Founding Team**

---

### 🌟 Plain-English Overview & Fee Summary
- **Free Account & Profile Access:** Solo musicians, bands, venue managers, and fans never pay monthly or annual subscription fees to create profiles, broadcast live sets, or discover concerts.
- **Payment Processing Fee Structure:** Crowdbeats is not a free payment-processing platform. On every voluntary fan tip, song request, and crowdfunding contribution, the fee structure is:
  1. **Crowdbeats Platform Fee:** **6.00%** of the gross transaction amount.
  2. **Stripe Processing & Stripe Connect Fees:** Charged separately in addition to Crowdbeats' 6% platform fee.
  3. **Musician or Band Net Proceeds:** The original transaction amount minus the 6% Crowdbeats platform fee, Stripe's applicable fees, and any legally required taxes, refunds, disputes, chargebacks, or adjustments.
- **Mandatory Fee Disclosure:**  
  > *"Crowdbeats is 100% free to join. When voluntary tips occur, Crowdbeats charges a 6% platform fee. Stripe payment-processing and applicable Stripe Connect fees are additional."*
- **Dynamic Stripe Pricing:** Exact Stripe fees are determined dynamically based on Stripe's live pricing, payment method (card, Apple Pay, Google Pay), connected account configuration, currency, and country of issuance—never permanently hardcoded.

---

## 1. Overview & Scope
This Creator Monetization Policy ("Monetization Policy") governs all financial interactions, payment processing, tips, crowdfunding contributions, platform fees, Stripe Connect disbursements, and revenue splits across Crowdbeats.

Crowdbeats empowers live musicians to earn gratuities and campaign funding directly from their audience. To maintain financial integrity, satisfy card network rules, and comply with state and federal regulations, all monetizing creators and contributing fans are subject to the terms herein.

---

## 2. Platform Fee Structure & Calculation Mechanics

### 2.1 Three-Tier Fee Breakdown
On every applicable transaction processed through Crowdbeats:
1. **Crowdbeats Platform Fee (6% Gross):** Crowdbeats assesses a six percent (6.00%) platform technology fee calculated on the total gross transaction amount. This fee funds platform audio synchronization, map discovery infrastructure, moderation pipelines, trust & safety enforcement, and server operations.
2. **Stripe Processing & Stripe Connect Fees (Additional):** Payment processing costs, card network interchange, cross-border fees, and applicable Stripe Connect merchant fees are assessed separately in addition to Crowdbeats' 6% fee. Crowdbeats' 6% fee does not include and must never be presented as including Stripe's processing fees.
3. **Net Proceeds to Musician or Band:** The musician or band receives the remaining net proceeds:
   $$\text{Net Proceeds} = \text{Gross Amount} - (\text{6\% Platform Fee}) - (\text{Stripe Processing \& Connect Fees}) - (\text{Taxes / Adjustments})$$

### 2.2 Numerical Calculation Example
For a **$100.00 USD** tip or crowdfunding contribution:
- **Gross Contribution:** $100.00
- **Crowdbeats Platform Fee (6%):** $6.00
- **Stripe Fees (Separate & Additional):** Deducted by Stripe in accordance with its active payment method and Connect schedule (e.g. ~$3.20 for standard US credit card).
- **Net Performer Payout:** Remaining balance (e.g. ~$90.80) transferred directly to the creator's verified Stripe Connected account.

### 2.3 Dynamic Stripe Pricing
The exact Stripe fee is calculated or confirmed in real time using Stripe’s current pricing, payment method, connected-account configuration, currency, country, and transaction type. Stripe fees are not permanently hardcoded into client interfaces because Stripe pricing schedules are subject to network updates.

---

## 3. Server-Authoritative Fee Calculation & Recordkeeping

### 3.1 Server-Side Enforcement
The 6% Crowdbeats platform fee and net transfers are computed exclusively by trusted server-side code (Cloud Functions / Firebase backend). Mobile and web clients may display fee estimates and disclosures for transparency, but client applications are strictly prohibited from:
- Determining or overriding the final platform fee.
- Creating unauthorized transfers or altering basis points.
- Marking payment intents or disbursements as settled.

### 3.2 Granular Transaction Recordkeeping
For every financial transaction, Crowdbeats maintains an immutable server ledger record containing:
- **Gross transaction amount** (in integer minor units / cents).
- **Crowdbeats platform fee percentage:** `6%` (600 basis points).
- **Crowdbeats platform fee amount** (in integer minor units / cents).
- **Stripe processing fee** (reported via Stripe BalanceTransaction).
- **Additional Stripe Connect fees** (if applicable).
- **Taxes or legally required adjustments** (if applicable).
- **Refund, dispute, or chargeback amounts** (if applicable).
- **Net proceeds belonging to the musician or band**.
- **Currency** (ISO 4217 code).
- **Stripe PaymentIntent, Charge, Transfer, and Connected-Account IDs**.
- **Payment, transfer, and payout lifecycle statuses**.
- **Creation, update, refund, and settlement timestamps**.

---

## 4. Stripe & Stripe Connect Authority
Stripe and Stripe Connect serve as the exclusive payment processing authority for:
- Securely storing payment methods and tokenizing credentials.
- Processing fan tips and campaign contributions.
- Onboarding eligible musicians and bands (KYC identity and bank account verification).
- Collecting Crowdbeats' 6% platform fee synchronously via `application_fee_amount` on destination charges or separate transfers.
- Transferring net proceeds to the correct connected account.
- Processing authorized refunds and managing dispute chargebacks.
- Sending cryptographically signed webhook events (`stripe.webhooks.constructEvent`) to verify transaction completion.

---

## 5. Security & Data Protection Invariants
In accordance with PCI-DSS Level 1 standards and strict privacy regulations, Crowdbeats and Firebase **NEVER** store:
- Full credit or debit card numbers (PAN).
- Card security codes (CVV / CVC).
- Complete bank account credentials or routing PINs.
- Stripe secret keys or unencrypted private tokens.
- Raw webhook signing secrets.

---

## 6. 100% Band Split Matrix Authorization
1. **Binding Split Agreement:** When a band registers a split matrix (e.g., 40% Member A, 40% Member B, 20% Band Treasury), each member legally authorizes Crowdbeats to execute automated programmatic transfers of net tip proceeds via Stripe Connect.
2. **Zero-Sum Balance Invariant:** All allocated percentages across band members and treasury must equal exactly 100%. No fractional cents or unallocated funds are retained by Crowdbeats LLC beyond the disclosed 6% platform fee.
3. **Dispute Resolution:** In the event of internal band membership disputes, payouts will continue according to the active server-recorded matrix until updated with authorized leader signatures.
