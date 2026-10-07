# Crowdbeats V2 — Transaction-Type & Merchant of Record Matrix

**Document Status:** Permanent Financial & Legal Specification  
**Architecture:** Stripe Connect Custom / Express Destination Charges  

---

## 1. Multi-Party Transaction Flow & Liability Matrix

| Transaction Name | Payer | Recipient | Stripe Charge Model | Merchant of Record | Statement Descriptor | Platform Fee (Take-Rate) | Stripe Fee Payer | Refund Owner | Dispute Owner | Negative Balance Owner | Receipt Issuer | Tax Reporting (1099-K) | Support Owner | Governing Legal Document |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Live Stage Fan Tip** | Fan (App User) | Solo Musician or Band Account | `DESTINATION_CHARGE` | **PERFORMER_CREATOR** | `CRWDBTS* ARTIST NAME` | 5.00% (500 bps) | Performer (Deducted from gross) | Crowdbeats (24h fan refund policy) | Performer / Band Account | Performer / Band Account | Crowdbeats on behalf of Artist | Stripe (Issued to Creator) | Crowdbeats Support | Terms of Service § 4 |
| **Band Crowdfunding Contribution** | Fan / Supporter | Band Managed Stripe Account | `DESTINATION_CHARGE` | **CAMPAIGN_OWNER** | `CRWDBTS* CAMPAIGN TITLE` | 5.00% (500 bps) | Campaign Owner | Band Manager / Crowdbeats Review | Band Ownership Entity | Band Ownership Entity | Crowdbeats on behalf of Campaign Owner | Stripe (Issued to Band Owner) | Band Rep + Crowdbeats Support | Terms of Service § 4.3 |
| **Corporate Match Pool Escrow** | Sponsor Enterprise | Dedicated Sponsor Escrow Pool | `DIRECT_CHARGE` | **CROWDBEATS_LLC** | `CRWDBTS* SPONSOR MATCH` | Custom B2B Tier | Sponsor Enterprise | Mutual Enterprise Agreement | Crowdbeats LLC | Crowdbeats LLC | Crowdbeats LLC | Crowdbeats LLC (W-9 / 1099) | Enterprise Support Lead | Sponsor Terms Agreement |
