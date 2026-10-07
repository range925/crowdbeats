# Crowdbeats V2 — Firebase & Google Cloud Infrastructure Guide

**Document Status:** Permanent Configuration Guide  
**Dashboard Route:** `/admin/integrations/firebase-gcp`  

---

## 1. Identity & Credential Strategy
- **Application Default Credentials (ADC):** Cloud Functions v2 and backend runtimes utilize attached Google Cloud service accounts rather than hardcoded service account JSON keys.
- **App Check Enforcement:** Protects backend callable endpoints against abuse using Play Integrity (Android), DeviceCheck (iOS), and reCAPTCHA Enterprise (Web).
- **Zero Raw JSON Keys:** The Admin portal prohibits uploading or downloading raw `service-account.json` keys.
