# Crowdbeats V2 — Universal Accessible Tooltip Catalog

**Document Status:** Permanent Accessibility & UX Specification  
**Component Reference:** `apps/web/components/ui/CbTooltip.tsx`  

---

## 1. Universal Tooltip Specifications

Every tooltip implements:
- **Hover & Keyboard Focus:** Displays instantly on hover or tab navigation.
- **Tap & Touch Devices:** Accessible toggle via tap.
- **Screen Reader Support:** Bound via `aria-describedby` with semantic `role="tooltip"`.
- **Zero Secret Leakage:** Prohibits displaying raw credentials or sensitive user data.

---

## 2. Core Admin Tooltip Definitions

| Tooltip ID | UI Target | Title | Explanation Summary | Permission Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `legaldocs-info` | Legal Documents Header | Legal Document System | Enforces versioning, diff comparisons, and dual approval for publication. | `COMPLIANCE_ADMIN` |
| `stripe-comp-tt` | Stripe Compliance Header | Stripe Regulatory Matrix | Audits all 15 operational boundaries required by Stripe SSA & Connect Agreement. | `COMPLIANCE_ADMIN` |
| `mor-matrix-tt` | Merchant of Record Table | Merchant of Record Role | Identifies the legal seller responsible for the underlying transaction offering. | `FINANCE_ADMIN` |
| `platform-fee-tt`| Platform Fee Card | 5% Platform Fee Calculation | Standard technology take-rate deducted synchronously upon PaymentIntent authorization. | `FINANCE_ADMIN` |
| `sec-manager-tt` | Secret Manager Banner | Secret Manager Storage | Cloud Secret Manager backed write-only credential storage. | `SECURITY_ADMIN` |
