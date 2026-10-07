# Crowdbeats V2 — Gemini & Vertex AI Services Configuration Guide

**Document Status:** Permanent Configuration Guide  
**Dashboard Route:** `/admin/integrations/ai-services`  

---

## 1. Approved Models & Boundaries
- **Gemini 2.5 Flash (`gemini-2.5-flash`):** Primary model for low-latency artist profile summaries, genre tagging, and fan discovery highlights.
- **Gemini 2.5 Pro (`gemini-2.5-pro`):** Used for in-depth moderation audit scans and customer support suggested response generation.
- **Safety Filters:** Configured to `BLOCK_MEDIUM_AND_ABOVE` across harassment, hate speech, dangerous content, and sexually explicit categories.

---

## 2. Prohibited AI Operations
- Autonomous banning or suspension of users.
- Autonomous denial of creator payouts or campaign escrow.
- Generation of legally binding statements or certifications.
- Facial recognition or biometric template matching.
