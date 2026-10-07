# Crowdbeats V2 — Live Check-In, QR & Discovery Propagation Report (Phase 4)
## Production Mobile Live Check-In, Rotating QR, and Session Lifecycle Management

**Status:** Completed & Verified  
**Date:** 2026-08-30  
**Target:** Flutter Mobile (`apps/mobile`)

---

## 1. Executive Summary

Phase 4 delivers the complete live performance lifecycle for both **Solo Musicians** and **Bands**. The system incorporates verified venue discovery, GPS freshness verification, anti-tamper rotating QR generation, deep-link sharing, and post-performance split distributions.

---

## 2. Implemented Capabilities & Components

### 2.1 Live Check-In Workflow (`LiveCheckinSheet`)
- **Verified Venue Mode:** Searchable list of official venues with distance calculation and anti-spoofing distance guard.
- **Street / Permit Busking Mode:** Real-time GPS accuracy display, customizable corner description, and municipal permit declaration.
- **Instant Discovery Broadcast:** Seamlessly activates live state and registers performance on the discovery map.

### 2.2 Rotating Tamper-Resistant QR Generator (`RotatingQrModal`)
- **Dynamic 30-Second Rotation:** Rotating token payload and countdown ring preventing photo re-use fraud.
- **Static Signage Backup Mode:** Toggleable mode for laminated stage banners and permanent physical tips signs.
- **Deep Link & Wallet Pass Export:** Direct clipboard copy of `https://crowdbeats.app/tip/{id}` and Apple/Google Wallet pass generator.

### 2.3 Live Session Active Nerve Centre (`LiveSessionActiveView`)
- **Live Stage Monitor:** Shows venue, real-time duration clock, and checked-in audience count.
- **Live Tip Stream Ticker:** Instant receipt notifications with fan messages and gross amounts.
- **Termination Flow & Split Reconciliation (`SessionSummaryModal`):** Automated mathematical distribution according to verified Band Split percentages.

---

## 3. Test Verification Matrix

| Test Case | Scenario | Result |
| :--- | :--- | :---: |
| **Idle Launchpad** | Checklist, launch hero, venue verification triggers | ✅ PASSED |
| **Check-In Sheet** | Verified venue selection + Street mode switch | ✅ PASSED |
| **Rotating QR Engine** | 30s countdown, token rotation, static backup toggle | ✅ PASSED |
| **Band Split Reconciliation** | 40% user split allocation from $200 gross tips ($80.00) | ✅ PASSED |
| **Discovery Propagation** | Live status switches seamlessly with conflict protection | ✅ PASSED |
