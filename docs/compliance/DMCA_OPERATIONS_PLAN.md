# Crowdbeats V2 — DMCA Notice, Takedown & Copyright Operations Plan

**Document Status:** Permanent Operations Specification  
**Statutory Basis:** 17 U.S.C. § 512(c) (Digital Millennium Copyright Act)  

---

## 1. Designated Copyright Agent Information

- **Registered Organization:** Crowdbeats LLC
- **Designated Agent:** Copyright & Compliance Counsel
- **Email:** `dmca@crowdbeats.com`
- **Notice Intake URL:** `https://crowdbeats.com/legal/dmca`
- **Physical Address:** Crowdbeats LLC, Registered Office, USA

---

## 2. Notice & Takedown Workflow (4-Step Timeline)

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Copyright Owner
    participant Admin as Crowdbeats Trust & Safety
    participant Creator as Uploader / Musician

    Owner->>Admin: Submit 512(c) Takedown Notice
    Admin->>Admin: Verify Statutory Completeness
    Admin->>Creator: Disable Infringing Stream & Issue Strike
    Creator->>Admin: Submit Counter-Notice (Perjury Statement)
    Admin->>Owner: Forward Counter-Notice (10-14 Day Clock Starts)
    alt Owner files Federal Court Action
        Owner->>Admin: Submit Court Docket
        Admin->>Creator: Content Permanently Blocked
    else No Court Action within 14 Days
        Admin->>Creator: Restore Content & Rescind Strike
    end
```

---

## 3. Repeat Infringer Policy

Pursuant to 17 U.S.C. § 512(i)(1)(A), Crowdbeats enforces a strict **3-strike policy**:
- **Strike 1:** Content disabled, creator receives formal warning and education modal.
- **Strike 2:** 30-day monetization and live stage broadcast suspension.
- **Strike 3:** Permanent account termination and revocation of Stripe Connect association.
