# CROWDBEATS V2 — CONTENT MODERATION ARCHITECTURE

**Document Type:** Technical Architecture (Phase 7 & 8)  
**System Role:** Multi-Tier Automated & Human Content Safety Pipeline  
**Last Updated:** 2026-08-30  

---

## 1. Pipeline Overview

```mermaid
flowchart TD
    UGC["User-Generated Content / Tip Message / Profile"] --> Scan["Automated Scanner (screenTextContent)"]
    Scan --> RiskEval{Risk Tier}
    RiskEval -->|LOW Risk (0.0)| Allow["ALLOW (Approved & Monetizable)"]
    RiskEval -->|MEDIUM Risk (0.4 - 0.7)| Flag["REVIEW (Enqueued to /moderationQueue)"]
    RiskEval -->|HIGH Risk (0.75 - 0.95)| Demon["DEMONETIZE (Tipping disabled + Flagged)"]
    RiskEval -->|CRITICAL Risk (1.0)| Block["BLOCK_UPLOAD / AUTO_QUARANTINE"]

    Flag --> HumanQueue["Admin Moderation Queue (/admin/trust-safety)"]
    Demon --> HumanQueue
    Block --> HumanQueue

    HumanQueue --> ModDecision{Trust & Safety Action}
    ModDecision -->|APPROVE| Restored["Approved Content"]
    ModDecision -->|DEMONETIZE| DemCreator["Creator Monetization Suspended"]
    ModDecision -->|SUSPEND| SuspAccount["Account Suspended + Live Revoked"]
    ModDecision -->|TERMINATE| TermAccount["Permanent Ban + Stripe Deauth"]
```
