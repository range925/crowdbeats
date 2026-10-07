# Crowdbeats V2 — Centralized Menu & Capability Registry

**Document Status:** Permanent Contract (Zero Dead Menu Guarantee)  
**Code Source:** `packages/contracts/src/registry/menuCapabilityRegistry.ts`  

---

## 1. Zero Dead Menu Contract Principles

A visible menu row, button, or link may be displayed ONLY when:
1. **Route Exists:** Its target URI is registered in GoRouter (Mobile) or Next.js App Router (Web).
2. **Component Exists:** A non-placeholder component with complete visual hierarchy is mounted.
3. **Backend Service Implemented:** Supported by authenticated Cloud Function or Firestore query.
4. **Deny-by-Default Authorization:** Authenticated caller holds the required permission claim.
5. **State Handling:** Fully handles Loading, Empty, Success, Error, and Unavailable states.
6. **Audit Event:** Mutating administrative actions write an immutable record to `auditEvents`.

---

## 2. Master Capability Matrix

| Menu ID | Platform | User-Facing Label | Target Route | Required Permission | Backend Operation | Loading State | Empty State |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `mob-account-hub` | Mobile | Account Settings | `/account` | `user:read_own` | `firestore.get(users/{uid})` | Shimmer / Progress | Default persona view |
| `mob-account-personal-info` | Mobile | Personal Information | `/account/personal-info` | `user:update_own` | `firebaseAuth.updateProfile` | Button Spinner | Blank text fields |
| `mob-account-payment-methods`| Mobile | Payment Methods | `/account/payment-methods` | `user:read_own` | `functions.listPaymentMethods` | Shimmer cards | "No cards saved" CTA |
| `mob-account-tipping-prefs` | Mobile | Tipping Preferences | `/account/tipping-preferences` | `user:update_own` | `firestore.set(settings/tipping)` | Reactive toggle | Default [$2, $5, $10, $20]|
| `mob-account-notifications` | Mobile | Notifications | `/account/notifications` | `user:update_own` | `firestore.set(settings/notifications)`| Reactive switch | Default all enabled |
| `mob-account-privacy` | Mobile | Privacy & Location | `/account/privacy` | `user:update_own` | `firestore.set(settings/privacy)` | Reactive switch | GPS precise with consent |
| `mob-account-security` | Mobile | Sign-In & Security | `/account/security` | `user:update_own` | `firebaseAuth.sendPasswordReset` | Spinner | Current session only |
| `mob-account-delete` | Mobile | Delete Account | `/account/delete` | `user:delete_own` | `functions.requestAccountDeletion` | Full overlay | Disabled until confirmed |
| `web-admin-command-center` | Web | Command Center | `/admin/command-center` | `user:read_any` | `firestore.get(systemMetrics)` | Shimmer metrics | "All systems normal" |
| `web-admin-crm` | Web | CRM & Users | `/admin/crm` | `user:read_any` | `firestore.collection(users)` | Table skeleton | "No users found" |
| `web-admin-artists` | Web | Artists & Verification | `/admin/artists` | `user:read_any` | `firestore.collection(artistProfiles)` | Queue skeleton | "Queue is clear" |
| `web-admin-finance` | Web | Finance & Ledger | `/admin/finance` | `finance:view_transactions` | `functions.runDailyReconciliation`| Ledger skeleton | "Zero discrepancies" |
| `web-admin-content` | Web | Content & DMCA | `/admin/content` | `moderation:review_content` | `firestore.collection(reports)` | Queue skeleton | "No pending reports" |
| `web-admin-compliance` | Web | Compliance Center | `/admin/compliance` | `compliance:view_register` | `firestore.collection(complianceObligations)`| Card skeleton | "No matching items" |
