# 03 — RBAC Permission Matrix
**Phase:** 3 — Trust Foundation
**Status:** FINAL — OD-07 (EXECUTIVE included, 16 roles), OD-08 (Option A applied)

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Full access |
| 📖 | Read only |
| ✏️ | Write / limited update |
| 🔒 | Prohibited |
| 🤝 | Via callable only (no direct Firestore) |
| `*` | Own resources only |

---

## Enterprise / Staff Role Matrix

| Permission | SUPER_ADMIN | EXECUTIVE | FINANCE_ANALYST | DATA_ANALYST | CONTENT_MODERATOR | TRUST_SAFETY | COMPLIANCE_OFFICER | CUSTOMER_SUPPORT |
|---|---|---|---|---|---|---|---|---|
| Read user records | ✅ | 🔒 | 🔒 | 🔒 | 📖 | 📖 | 📖 | 📖 |
| Read artist profiles | ✅ | 🔒 | 🔒 | 🔒 | 📖 | 📖 | 📖 | 📖 |
| Suspend user account | 🤝 | 🔒 | 🔒 | 🔒 | 🔒 | 🤝 | 🔒 | 🔒 |
| Read audit events | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | ✅ | 🔒 |
| Export audit events | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🤝 | 🔒 |
| Read payment ledger | 🤝 | 🔒 | 🤝 | 🔒 | 🔒 | 🔒 | 🤝 | 🔒 |
| Read GMV / revenue | 🤝 | 🤝 | 🤝 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| Initiate refund | 🤝 | 🔒 | 🔒 | 🔒 | 🔒 | 🤝 | 🔒 | 🤝 |
| Read tips | 🤝 | 🔒 | 🤝 | 🔒 | 🔒 | 🤝 | 🤝 | 🤝 |
| Read reports queue | ✅ | 🔒 | 🔒 | 🔒 | ✅ | ✅ | 🔒 | 🔒 |
| Take moderation action | 🤝 | 🔒 | 🔒 | 🔒 | 🤝 | 🤝 | 🔒 | 🔒 |
| Read fraud signals | ✅ | 🔒 | 📖 | 🔒 | 🔒 | ✅ | 🔒 | 🔒 |
| Grant staff role | 🤝 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| Verify artist | 🤝 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🤝 |
| Read consent records | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | ✅ | 🔒 |
| GDPR data deletion | 🤝 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🤝 | 🔒 |
| Read behavioral data | 🤝 | 🔒 | 🔒 | 🤝 | 🔒 | 🔒 | 🔒 | 🔒 |
| Access campaign mgmt | ✅ | 📖 | 🔒 | 🔒 | 📖 | 🔒 | 🔒 | 🔒 |
| Review sponsorships | ✅ | 📖 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |

| Permission | GROWTH_MANAGER | PARTNERSHIPS | DEVELOPER | QA_TESTER | LEGAL | MARKETING | ARTIST_RELATIONS | VENUE_RELATIONS |
|---|---|---|---|---|---|---|---|---|
| Read campaigns | ✅ | 📖 | 🔒 | 📖 | 📖 | 📖 | 📖 | 🔒 |
| Manage featured artists | 🤝 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| Review sponsorships | 🔒 | ✅ | 🔒 | 🔒 | 📖 | 🔒 | 🔒 | 🔒 |
| Read ToS/contracts | 🔒 | 📖 | 🔒 | 🔒 | ✅ | 🔒 | 🔒 | 🔒 |
| Manage ToS versions | 🔒 | 🔒 | 🔒 | 🔒 | 🤝 | 🔒 | 🔒 | 🔒 |
| Marketing analytics | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 📖 | 🔒 | 🔒 |
| Deploy functions (non-prod) | 🔒 | 🔒 | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| Emulator-only access | 🔒 | 🔒 | ✅ | ✅ | 🔒 | 🔒 | 🔒 | 🔒 |
| Artist profile assistance | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🤝 | 🔒 |
| Artist payout lookup | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 📖 | 🔒 |
| Venue profile assistance | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🤝 |

---

## Entity Membership Role Matrix

### Band Roles

| Permission | BAND_FOUNDER | BAND_ADMIN | BAND_MEMBER |
|---|---|---|---|
| Read band profile | ✅ | ✅ | ✅ |
| Update band profile | ✅ | ✅ | 🔒 |
| Submit split config update | 🤝 | 🔒 | 🔒 |
| Read split config | ✅ | ✅ | ✅ |
| Add/remove band members | 🤝 | 🤝 | 🔒 |
| Change member roles | 🤝 | 🔒 | 🔒 |
| Create stage session | 🤝 | 🤝 | 🔒 |
| Link bank account | 🤝 | 🔒 | 🔒 |
| Request payout | 🤝 | 🔒 | 🔒 |
| Read band financials | ✅ | ✅ | 📖 |
| Transfer band ownership | 🤝 | 🔒 | 🔒 |
| Disband (soft-delete) | 🤝 | 🔒 | 🔒 |

### Venue Roles

| Permission | VENUE_OWNER | VENUE_MANAGER | VENUE_STAFF |
|---|---|---|---|
| Read venue profile | ✅ | ✅ | ✅ |
| Update venue profile | ✅ | ✅ | 🔒 |
| Create/manage stages | 🤝 | 🤝 | 🔒 |
| Create stage sessions | 🤝 | 🤝 | 🔒 |
| Issue QR tokens | 🤝 | 🤝 | 🤝 |
| Add/remove staff | 🤝 | 🤝 | 🔒 |
| Link bank account | 🤝 | 🔒 | 🔒 |
| View session analytics | ✅ | ✅ | 📖 |

### Sponsor Roles (OD-08: Option A)

| Permission | SPONSOR_ADMIN | SPONSOR_REP |
|---|---|---|
| Read org profile | ✅ | ✅ |
| Update org profile | ✅ | 🔒 |
| Add/remove org members | 🤝 | 🔒 |
| Deposit escrow | 🤝 | 🔒 |
| Create match pools | 🤝 | 🔒 |
| Sign sponsorship contracts | 🤝 | 🔒 |
| Discover/shortlist artists | ✅ | ✅ |
| Message artists | ✅ | ✅ |
| View campaign analytics | ✅ | ✅ |
| View org financials | ✅ | 🔒 |

---

## Permission Enforcement Layers

| Layer | Mechanism | Who |
|---|---|---|
| Firestore Rules | Enforce at database read/write | All clients |
| Cloud Function Auth | `admin.auth().verifyIdToken()` | All callables |
| Cloud Function Claims | Check `platformRole` / membership | Staff + member ops |
| Firestore Membership Read | `get(/bands/{id}/members/{uid})` | Entity-level checks |
| Step-Up Auth | Re-authentication before high-risk ops | Bank linkage, role grants, payouts |

---

## What Is Explicitly Prohibited

| Attempt | Prevention |
|---|---|
| Client writes to paymentLedger | Rules: `allow read, write: if false` |
| Client writes to auditEvents | Rules: `allow read, write: if false` |
| Self-assigning platformRole | Rules: immutableOnUpdate(['platformRole', ...]) |
| Incrementing own totalTipsReceivedCents | Rules: server-only field guard |
| Writing split config directly | Rules: `allow create, update, delete: if false` |
| Changing own UID / email | Rules: immutableOnUpdate(['uid', 'email', ...]) |
| Any single `isAdmin` boolean as auth | Design: no such field exists |
| Reading paymentLedger as SUPER_ADMIN via client | Rules: explicit `if false` (even staff) |
| Cross-band updates via membership of another band | Rules: isBandAdmin(bandId) checks specific bandId |
