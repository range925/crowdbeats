# Crowdbeats V2 — Admin Role & Permissions Matrix (14 Roles)

**Document Status:** Permanent Architecture Specification  
**Code Reference:** `packages/contracts/src/auth/permissions.ts`  

---

## 1. 14 Platform Roles & Hierarchy

```mermaid
graph TD
    SA[13. SUPER_ADMIN] --> FA[10. FINANCE_ADMIN]
    SA --> CA[11. COMPLIANCE_ADMIN]
    SA --> SEC[12. SECURITY_ADMIN]
    SA --> MOD[9. MODERATOR]
    SA --> SUP[8. SUPPORT_AGENT]
    SA --> AUD[14. READ_ONLY_AUDITOR]

    subgraph "Organization & Creator Roles"
        BO[5. BAND_OWNER] --> BM[4. BAND_MANAGER] --> BMB[3. BAND_MEMBER]
        SM[7. SPONSOR_MANAGER] --> SMB[6. SPONSOR_MEMBER]
        SOLO[2. SOLO_MUSICIAN]
        FAN[1. FAN]
    end
```

---

## 2. Granular Permissions Mapping

| Role | User Mgmt | Musician/EPK | Band Gov | Finance/Refund | Mod/DMCA | Compliance/DSAR | Security/Logs | Staff Admin |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FAN** | Own | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **SOLO_MUSICIAN** | Own | Full | ❌ | View/Request | ❌ | ❌ | ❌ | ❌ |
| **BAND_MEMBER** | Own | Perform | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **BAND_MANAGER** | Own | Perform | Roster | ❌ | ❌ | ❌ | ❌ | ❌ |
| **BAND_OWNER** | Own | Full | Full Gov | View/Request | ❌ | ❌ | ❌ | ❌ |
| **SPONSOR_MEMBER** | Own | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **SPONSOR_MANAGER**| Own | ❌ | ❌ | Escrow/Pools | ❌ | ❌ | ❌ | ❌ |
| **SUPPORT_AGENT** | Read Any | ❌ | ❌ | Standard Refund | View Reports | ❌ | View Incidents| ❌ |
| **MODERATOR** | Suspend | ❌ | ❌ | ❌ | Full Takedown| ❌ | ❌ | ❌ |
| **FINANCE_ADMIN** | Read Any | ❌ | ❌ | Large Refund* / Recon | ❌ | ❌ | View Logs | ❌ |
| **COMPLIANCE_ADMIN**| Read Any | ❌ | ❌ | Tax View | ❌ | Full DSAR / Legal Holds | View Logs | ❌ |
| **SECURITY_ADMIN** | Suspend/Reinst| ❌ | ❌ | ❌ | ❌ | ❌ | Full Sec / Sessions | View Staff |
| **SUPER_ADMIN** | Full | Full | Full | Full Dual* | Full | Full | Full | Full |
| **READ_ONLY_AUDITOR**| Read Any | ❌ | ❌ | Read Trans | ❌ | View Reg | View Logs | View Staff |

*\*Note: High-risk operations (large refunds > $100, staff role modifications, compliance payout hold release) strictly require dual-signoff by two distinct administrators.*
