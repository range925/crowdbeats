# Crowdbeats V2 — California Compliance Matrix (CPRA, AB 5, ARL, Song-Beverly)

**Document Status:** Permanent State Compliance Matrix  
**Jurisdiction:** State of California  

---

## 1. California Consumer Privacy Act (CCPA / CPRA)
- **Citation:** Cal. Civ. Code § 1798.100 et seq.; 11 CCR § 7000 et seq.
- **Enforcement Body:** California Privacy Protection Agency (CPPA) / California Attorney General

### Operational Controls Implemented:
1. **Right to Know / Access (§ 1798.110):**
   - In-app "Download My Data" tool generates machine-readable JSON archive of user profile, tips, and preferences.
2. **Right to Delete (§ 1798.105):**
   - Account deletion screen soft-deletes user profile, removes public discoverability, revokes auth tokens, and preserves ledger rows for 7 years pursuant to AML retention exemptions (§ 1798.145).
3. **Right to Limit Use of Sensitive Personal Information (§ 1798.121):**
   - Precise Geolocation: Runtime consent request with coarse fallback. Toggle in Privacy Settings disables GPS instantly.
4. **Global Privacy Control (GPC) & Opt-Out (§ 1798.135):**
   - Crowdbeats does not sell or share data. Web headers automatically recognize `Sec-GPC: 1` signals.

---

## 2. Independent Contractor Classification (AB 5 / ABC Test)
- **Citation:** Cal. Lab. Code § 2775 et seq.
- **Analysis:**
  - **Prong A (Free from Control):** Musician creators determine their own performance times, repertoire, setlists, and venues. Crowdbeats provides technology infrastructure only.
  - **Prong B (Outside Usual Course of Business):** Crowdbeats is a software technology platform, not a live music production company or booking agency.
  - **Prong C (Customarily Engaged in Independent Trade):** Musicians perform across multiple venues, platforms, and third-party bookings independently.

---

## 3. Automatic Renewal Law (ARL)
- **Citation:** Cal. Bus. & Prof. Code § 17600 et seq.
- **Status:** `not_applicable_with_reason`
- **Rationale:** Crowdbeats V2 charges one-time tips and one-time campaign pledges only. No auto-renewing subscriptions are offered.
