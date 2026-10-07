# Crowdbeats V2 — Platform Fee Engine Architecture & Governance

**Document Status:** Permanent Architecture Specification  
**Source Code:** `packages/contracts/src/financial/platformFeeTypes.ts` & `apps/functions/src/financial/platformFeeEngine.ts`  

---

## 1. Core Invariants & Fee Rules

1. **Integer Minor Currency Storage:** All fee calculations are executed strictly in integer cents (e.g., $10.00 = 1000). Zero floating-point math is used.
2. **Basis Point Precision:** 100 basis points equals 1.00% (500 bps = 5.00%).
3. **Production 0.00% Default Gate:** The production default fee remains strictly 0 basis points (0.00%) until explicit commercial release authorization is provided by David Naufahu.
4. **Server-Authoritative Calculation:** The client application NEVER calculates, validates, or transmits fee amounts. The server generates signed quotes and recalculates fees upon PaymentIntent creation.
5. **Dual-Approval Governance:** Changing platform fee rules requires Finance Administrator submission followed by secondary executive approval (no self-approval).
