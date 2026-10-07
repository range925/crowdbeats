# Crowdbeats V2 — Secret Management & Zero Exposure Architecture

**Document Status:** Permanent Architecture Specification  
**Technology:** Google Cloud Secret Manager  

---

## 1. Storage Rules & Isolation Boundaries

- **Google Cloud Secret Manager:** The single authoritative storage location for server-side API keys, webhook signing secrets, and OAuth client secrets.
- **Prohibited Storage Locations:**
  - Zero secrets in Firestore or Realtime Database.
  - Zero secrets in Firebase Remote Config.
  - Zero secrets in client-side Next.js or Flutter app bundles.
  - Zero secrets in git repositories, markdown files, logs, or crash reports.
- **Write-Only Admin Portal Contract:**
  - Permitted administrators can enter or rotate credentials via password-masked input fields.
  - The UI does NOT support "Reveal Secret", "Copy Secret", "Export Secrets", or "Download Secret".
  - Existing secret values are NEVER returned in API responses.
