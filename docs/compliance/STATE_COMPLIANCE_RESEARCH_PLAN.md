# Crowdbeats V2 — State Compliance Research Plan (50 States)

**Document Status:** Comprehensive Multi-State Research & Risk Assessment  
**Scope:** State Consumer Privacy Acts, Biometric Privacy, Money Transmission, and Breach Notification.  

---

## 1. State Comprehensive Privacy Acts

| State | Statute Citation | Effective Date | Key Requirements | Crowdbeats Implementation |
| :--- | :--- | :--- | :--- | :--- |
| **California (CPRA)** | Cal. Civ. Code § 1798.100 | Jan 1, 2023 | Access, Deletion, Opt-Out of Sale/Share, Sensitive Data Limit, GPC Signal | In-app DSAR export, soft-delete, GPC recognition on web, precise location toggle. |
| **Virginia (VCDPA)** | Va. Code § 59.1-571 | Jan 1, 2023 | Sensitive Data Opt-In (Geolocation), DSAR Response (45 Days) | Runtime affirmative geolocation consent, zero dark patterns. |
| **Colorado (CPA)** | Colo. Rev. Stat. § 6-1-1301 | July 1, 2023 | Universal Opt-Out Mechanism (UOOM), Data Protection Assessment | Automated GPC HTTP header listener on all web API requests. |
| **Connecticut (CTDPA)**| Conn. Gen. Stat. § 42-515 | July 1, 2023 | Geolocation opt-in, revocation within 15 days | Instant toggle off in Settings with immediate coordinate purge. |
| **Texas (TDPSA)** | Tex. Bus. & Com. Code § 541 | July 1, 2024 | Small business exemption check, sensitive data consent | Runtime location consent dialog with coarse city fallback. |
| **Florida (FDBR)** | Fla. Stat. § 501.701 | July 1, 2024 | Surveillance tech limitations, data minimization | Zero passive listening or background location recording. |

---

## 2. State Biometric Privacy Statutes

### COMP-28: Illinois BIPA & Texas CUBI
- **Citations:** 740 ILCS 14/1 et seq.; Tex. Bus. & Com. Code § 503.001
- **Crowdbeats Control:** Crowdbeats **does not collect, scan, process, or store** biometric identifiers (retina scans, fingerprints, voiceprints, or facial geometry).
- **On-Device Biometric Lock:** The optional Face ID / Fingerprint app lock in Account Settings communicates strictly with local device OS hardware (LocalAuthentication API on iOS/Android). Cryptographic templates never leave the user device and are never transmitted to Crowdbeats backend servers.
