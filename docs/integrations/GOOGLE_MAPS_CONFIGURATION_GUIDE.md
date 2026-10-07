# Crowdbeats V2 — Google Maps Platform Configuration Guide

**Document Status:** Permanent Configuration Guide  
**Dashboard Route:** `/admin/integrations/google-maps`  

---

## 1. Multi-Platform Key Restrictions Architecture

| Key Type | Target Boundary | Restriction Enforced | Enabled APIs |
| :--- | :--- | :--- | :--- |
| **Web Maps Key** | Next.js Browser Client | HTTP Referrers: `https://crowdbeats.ai/*`, `https://*.crowdbeats.ai/*`, `http://localhost:3000/*` | Maps JavaScript API, Places API |
| **Android Maps Key** | Flutter Android Native | Package: `com.crowdbeats.app` + SHA-1 Signing Certificate Fingerprint | Maps SDK for Android, Places SDK |
| **iOS Maps Key** | Flutter iOS Native | Bundle ID: `com.crowdbeats.app` | Maps SDK for iOS, Places SDK |
| **Server-Side Maps Key**| Cloud Functions v2 | Secret Manager + Server Outbound IP / VPC Restriction | Geocoding API, Routes API |

---

## 2. Unrestricted Key Policy
- If any key is detected without explicit application and API restrictions, the system immediately flags: `SECURITY ACTION REQUIRED`.
- Key restrictions must be audited quarterly.
