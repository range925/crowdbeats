# CROWDBEATS CONTENT MODERATION POLICY

> [!CAUTION]
> **LEGAL REVIEW REQUIRED BEFORE PRODUCTION PUBLICATION**  
> This policy is an operational compliance draft designed to satisfy Stripe Content Platform standards. It must be formally reviewed by licensed legal counsel before production publication.

**Effective Date:** 2026-08-30  
**Version:** 2026-08-25  

---

## 1. Automated Content Safety Pipeline
Crowdbeats utilizes a multi-layered automated content safety pipeline (`ModerationProvider`) to evaluate text, profile descriptions, stage session titles, campaign descriptions, images, and links:
- **Risk Tiers:** Content is categorized into `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL` risk tiers.
- **Automated Actions:**
  - `ALLOW`: Low-risk content is approved for public publication and monetization.
  - `REVIEW`: Borderline content is enqueued for expedited human moderator review.
  - `DEMONETIZE`: High-risk or policy-questionable content has financial tipping disabled.
  - `HIDE` / `BLOCK_UPLOAD`: Critical violations (CSAM, explicit adult content, hate extremism) are blocked at the ingestion edge.

---

## 2. Human Moderation & Appeals
- **Moderator Actions:** Authorized Trust & Safety moderators review flagged items, user reports, and rights-holder complaints. Actions include content removal, demonetization, payout holds, warning notices, and account suspension.
- **Audit Trails:** All moderation interventions require standardized reason codes and generate immutable audit logs.
- **Appeals:** Creators may appeal moderation decisions through the in-app or web appeal center. Appeals do not automatically reinstate monetization pending review.
