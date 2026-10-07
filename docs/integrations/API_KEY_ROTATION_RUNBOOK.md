# Crowdbeats V2 — API Key Rotation & Rollback Runbook

**Document Status:** Permanent Operations Runbook  
**Audience:** Security Administrators & Platform Engineers  

---

## 1. 5-Step Key Rotation Workflow

1. **Step 1: Staging Provisioning:**
   - Ingest the new credential version into Google Cloud Secret Manager (e.g., `projects/crowdbeats/secrets/STRIPE_RESTRICTED_KEY/versions/2`).
2. **Step 2: Automated Connectivity Verification:**
   - Execute redacted connection probe using `testIntegrationConnection` to verify signature validity and permissions.
3. **Step 3: Staged Activation:**
   - Switch active traffic to Version 2 in Secret Manager.
4. **Step 4: Dual-Approval Verification (Production Only):**
   - Requires primary submitter + secondary Security Administrator approval before committing production changes.
5. **Step 5: Deprecation & Destruction:**
   - Disable Version 1 after 24 hours of zero errors. Destroy Version 1 after 7 days.
