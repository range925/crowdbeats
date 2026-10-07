# Authoritative Stitch Design Source — Crowdbeats V2

**Document Version:** 1.0  
**Classification:** Frontend Design System Authority  
**Authoritative Project ID:** `5326179813018056505`  
**Stitch URL:** https://stitch.withgoogle.com/projects/5326179813018056505  
**Creation Engine:** Gemini 3.1 Pro & Nano Banana Pro  
**Design Authority Status:** `EXCLUSIVE AUTHORITATIVE SOURCE`

---

## 1. Design Authority Statement

This document formally establishes **Google Stitch Project `5326179813018056505`** as the **sole and exclusive design authority** for Crowdbeats V2. All previous design references, legacy Stitch projects, deprecated UI mockups, and generic boilerplate themes are superseded.

### 1.1 Excluded & Deprecated References
The following projects and design sources are **permanently removed from consideration**:
- ❌ https://stitch.withgoogle.com/projects/17577289857014198932
- ❌ https://stitch.withgoogle.com/projects/8989675108188081910
- ❌ Abandoned / legacy Crowdbeats V1 Figma and prototype files
- ❌ Generic Material / Bootstrap / Tailwind stock templates

---

## 2. Stitch Project Access & Metadata Verification

The Stitch project was directly queried and validated via the connected Google Stitch MCP integration:

```json
{
  "name": "projects/5326179813018056505",
  "title": "Enhanced Nearby Live Music Map",
  "visibility": "PRIVATE",
  "projectType": "TEXT_TO_UI_PRO",
  "origin": "STITCH",
  "deviceType": "MOBILE",
  "screenCount": 12,
  "lastUpdated": "2026-08-27T22:56:45Z"
}
```

---

## 3. Discovered Screen Roster

The authoritative Stitch project contains **12 high-fidelity screens** representing the core fan, discovery, tipping, onboarding, and notification experiences:

| # | Screen Resource ID | Title / Label in Stitch | Viewport Dimensions | Primary Role & Experience |
| :-: | :--- | :--- | :-: | :--- |
| **01** | `12401386157321115245` | `3a3e19a2-4393-4cb3-9b1e-6a7706cebcc2.png` | 853 × 1844 | Direct Musician Tipping Flow |
| **02** | `12401386157321114035` | `4b02ba29-d128-4f8b-9657-410af130af5e.png` | 853 × 1844 | Fan Onboarding — Step 1: Basic Profile |
| **03** | `12401386157321116177` | `b6e7604f-fcca-4b21-9b11-86d08a82a260.png` | 863 × 1823 | AR Camera Performer Detection & Instant Tip |
| **04** | `12401386157321114501` | `23694320-8bb0-440b-a4f3-93034bab2d01.png` | 853 × 1844 | Fan Onboarding — Step 3: Profile Details |
| **05** | `12401386157321115711` | `070d877d-8834-47a3-9cf6-25fd93a814f6.png` | 853 × 1844 | Fan Onboarding — Step 4: Completion & Welcome |
| **06** | `12401386157321116921` | `24c95d38-6445-4c2f-b38a-a7b3fb7cbb5e.png` | 853 × 1844 | Fan Onboarding — Step 4: Profile Review |
| **07** | `12401386157321113757` | `dba47163-540d-4838-80b4-68577b57ee9c.png` | 853 × 1844 | Fan Onboarding — Step 2: Music Preferences |
| **08** | `12401386157321114967` | `b089be93-3624-46fb-a74e-b1221edcf092.png` | 853 × 1844 | Nearby Live Music Map (Standard Mode) |
| **09** | `12401386157321117387` | `23771603-9e11-41f5-b323-56ffb9b97239.png` | 853 × 1844 | Activity Feed & Notifications |
| **10** | `12401386157321116643` | `fan homepage after signin.png` | 853 × 1844 | Fan Home Dashboard ("Good evening, Jordan") |
| **11** | `3f6d3e115ef64259805a85991dfc6380` | `Enhanced Nearby Live Music Map` | 768 × 1376 | Enhanced Nearby Map (Pulsing Radar Variant) |
| **12** | `7165d1c6fe314d62bb4a99e1e463e212` | `Enhanced AR Tipping Interface` | 768 × 1376 | Enhanced AR Tipping (Glassmorphic Variant) |

---

## 4. Architectural Protection Guarantees

As mandated, this redesign is strictly a **frontend visual and interaction overhaul**. Under no circumstances will any of the following backend mechanisms be modified, broken, or replaced:
- Firebase Authentication, token minting, custom claims, and verification
- Firestore data schemas, document contracts (`@crowdbeats/contracts`), and subcollections
- Cloud Functions v2 callables and webhook handlers
- Stripe Connect Custom onboarding, charges, payouts, and dispute evidence pipelines
- Firestore and Storage zero-trust security rules
- Server-authoritative `assertCreatorMayMonetize()` eligibility gates
- Immutable double-entry financial ledger (`/paymentLedger`) and `/auditLogs`
