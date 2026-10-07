# Crowdbeats V2 — Stripe Charge Model & Payment Flow Matrix

**Document Status:** Permanent Financial Architecture Specification  
**Technology:** Stripe Connect Custom & Express Accounts  

---

## 1. Comprehensive Transaction Classification Matrix

| Transaction Flow | Payer | Recipient | Stripe Charge Type | Application Fee Mechanism | Transfer Mechanism | Merchant of Record | Statement Descriptor |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Live Performer Tip** | Fan (App User) | Solo Musician Account | `DESTINATION_CHARGE` | `application_fee_amount` in PaymentIntent | Direct destination transfer on settlement | **PERFORMER_CREATOR** | `CRWDBTS* ARTIST NAME` |
| **QR Stage Tip** | Fan (Scanning QR) | Solo Musician / Band | `DESTINATION_CHARGE` | `application_fee_amount` in PaymentIntent | Direct destination transfer on settlement | **PERFORMER_CREATOR** | `CRWDBTS* ARTIST NAME` |
| **Campaign Contribution** | Fan / Backer | Band Managed Account | `DESTINATION_CHARGE` | `application_fee_amount` in PaymentIntent | Direct destination transfer on settlement | **CAMPAIGN_OWNER** | `CRWDBTS* CAMPAIGN TITLE` |
| **Sponsor Match Escrow** | Sponsor Corp | Dedicated Escrow Pool | `DIRECT_CHARGE` | Custom Platform Retainer | Internal ledger allocation | **CROWDBEATS_LLC** | `CRWDBTS* SPONSOR MATCH` |
| **Band Split Disbursement**| Fan | Multi-member Band | `SEPARATE_CHARGE_TRANSFER`| Internal Platform Fee Retention | Multiple `transfer.*` calls via Largest Remainder | **BAND_OWNERSHIP_ENTITY** | `CRWDBTS* BAND NAME` |
| **Fan Tip Refund (24h)** | Creator Account | Original Fan Card | `DESTINATION_CHARGE` Refund | `refund_application_fee=true` | `reverse_transfer=true` | **PERFORMER_CREATOR** | Original charge reversal |
| **Chargeback / Dispute** | Creator Account | Financial Network | Dispute Debit | Reversal from Connected Balance | Automatic offset against future earnings | **PERFORMER_CREATOR** | Network dispute debit |
