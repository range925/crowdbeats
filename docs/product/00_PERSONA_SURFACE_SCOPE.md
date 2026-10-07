# 00 — Persona and Surface Scope
**Phase:** 0 — Read-Only Clean-Room Contract
**Date:** 2026-08-25
**Status:** DRAFT — Pending David's approval of open decisions OD-07 and OD-08

---

## Purpose

This document defines the canonical persona list, their primary surfaces, and their
workflow scope for Crowdbeats V2. It is derived from all six reference documents
and resolves conflicts per the authority order in the Clean-Room Architecture Contract.

The persona-surface matrix is requirements evidence only. No application code exists yet.

---

## 1. Canonical Persona List

| Persona Key | Display Name | Relationship to Platform | Primary Entry |
|---|---|---|---|
| `FAN` | Fan | Consumer; discovers and tips live musicians | Native mobile (iOS/Android) primary; limited web account |
| `SOLO_MUSICIAN` | Solo Musician / Solo Artist | Creator; performs live, manages career | Native mobile (on-stage companion); Web (creator studio) |
| `BAND_OWNER` | Band Owner | Creator; governs band organization | Native mobile (live companion); Web (full studio + governance) |
| `BAND_MANAGER` | Band Manager | Creator admin; manages bookings and invites | Native mobile (alerts); Web (management) |
| `BAND_MEMBER` | Band Member | Creator; performs in a band | Native mobile (live companion); Web (limited studio) |
| `SPONSOR_REP` / `SPONSOR_ADMIN` | Sponsor Representative / Admin | B2B; funds artists and match pools | Web-first; phone browser secondary (OD-08 pending) |
| `VENUE_STAFF` / `VENUE_MANAGER` | Venue Staff / Venue Manager | Operations; manages venue and stages | Web-first; mobile operations via web browser |
| Enterprise staff (16 roles, OD-07 pending) | Platform Staff | Internal; operations, finance, moderation | Web desktop-first; emergency responsive views |

### Identity Rule
One human equals one Firebase Auth UID. A person may hold multiple persona memberships
(e.g., a Fan who is also a Band Member and Sponsor Rep). Persona switching changes
authorized context — it does not create a second account.

---

## 2. Fan

### 2.1 Platform
**Primary:** Flutter native iOS and Android
**Secondary:** Responsive web (limited account management only)

### 2.2 Mobile Native Tab Structure
| Tab | Route (indicative) | Purpose |
|---|---|---|
| Home | /fan/home | Pulse feed, Live Now carousel, featured artists, one primary CTA |
| Nearby | /fan/nearby | Permission-aware map/list; distance-sorted verified live stages |
| Tip | /fan/tip | QR scan, nearby selection, search; 3-tap verified tip flow |
| Activity | /fan/activity | Monthly support summary, digital receipts, loyalty/VIP progress |
| Profile | /fan/profile | Payment methods (safe metadata only), preferences, privacy, security, account deletion |

### 2.3 Three-Tap Primary Path
Identify performer → Select/confirm amount → Confirm payment (with saved tokenized default method)

This path begins after the performer is known and a valid default payment method exists.
Final consent screen is not removable to achieve the metric.

### 2.4 Supporting Web (Fan)
- Account settings and security
- Payment method management (Stripe-hosted/tokenized; no raw card input)
- Receipts and activity history
- Followed artists list
- Privacy, export, and account deletion

### 2.5 Fan Functional Scope (V2 Phase 6)
- Home feed with live context and one clear next action
- Nearby map/list with location permission education and denial recovery
- QR scanner, nearby selection, and search
- Verified artist/stage identity confirmation before payment
- Preset and custom tip amounts
- Apple Pay and Google Pay where supported by Stripe mobile flow
- Clear recipient, amount, applicable fees, and final consent before payment
- Success, receipt, failure, cancellation, retry, and duplicate-tap prevention
- Loyalty and VIP tier only after rules/rewards policy is documented and approved
- Campaign discovery and contribution
- Deep links/universal links for performer, stage, tip, and campaign

### 2.6 Deferred (Not V2 Phase 6)
- Camera-based performer recognition (OD-12)
- BLE beacon geofencing (OD-12)
- Crowdbeats Cash wallet (OD-11)

---

## 3. Solo Musician

### 3.1 Platform
**Primary on-stage:** Flutter native iOS and Android
**Primary creator studio:** Responsive web (Next.js)

### 3.2 Mobile Native Tab Structure
| Tab | Route (indicative) | Purpose |
|---|---|---|
| Home | /creator/home | Today's tips, active gig banner, payout/KYC status, next action |
| Live | /creator/live | Check In / Go Live; 300s rotating QR; real-time tip stream |
| Campaigns | /creator/campaigns | Mobile campaign overview and update composer |
| Fans | /creator/fans | Patron summary and top superfans |
| Profile | /creator/profile | EPK preview, audio stems, notifications, payout status |

### 3.3 Web Creator Studio Routes (indicative)
/creator/dashboard, /creator/profile, /creator/performances, /creator/campaigns,
/creator/campaigns/new, /creator/campaigns/[id], /creator/donations, /creator/fans,
/creator/messages, /creator/payouts, /creator/analytics, /creator/marketing,
/creator/media, /creator/rewards, /creator/sponsorships, /creator/security,
/creator/privacy, /creator/settings

### 3.4 Key Functional Requirements
- Server-signed rotating HMAC QR token, 300s TTL, anti-replay, wake-lock guidance
- Real-time tip stream with listener cleanup
- Campaign wizard: type, story, goal/rewards, details, media, review, launch
- Post-launch workspace: overview, contributions, updates, messages, fans, payouts,
  analytics, marketing, rewards, settings
- Stripe Connect Express onboarding via server-created account links
- No living-person style imitation in writing tools (C-09 — EXCLUDED)

---

## 4. Band

### 4.1 Platform
**Primary on-stage:** Flutter native iOS and Android (one UID per member)
**Primary studio:** Responsive web (Next.js)

### 4.2 Mobile Native Tab Structure
| Tab | Route (indicative) | Purpose |
|---|---|---|
| Home | /band/home | Collective revenue summary, active gig, member alerts |
| Live | /band/live | Group live-stage view with permission-aware individual take-home estimates |
| Campaigns | /band/campaigns | Band album/tour crowdfunding tracker |
| Members | /band/members | Roster list, role badges, governance entry points |
| Profile | /band/profile | Band EPK, stage riders, member credits |

### 4.3 Band Roles (from REF-06 Phase 4)
| Band Role | Scope |
|---|---|
| BAND_OWNER | Full authority; exclusive transfer/split-signing |
| BAND_MANAGER | Booking, invites, campaign publishing |
| BAND_MEMBER | Live HUD, personal payout ledger view |
| FINANCE_ROLE | Financial record viewing and treasury read |
| CAMPAIGN_ROLE | Campaign management scope |
| MEDIA_ROLE | Media and marketing scope |

Note: Band roles are organization-scoped memberships, not Firebase custom claims.

### 4.4 Key Functional Requirements
- No shared band login; every member uses their own Firebase UID
- Band split must total exactly 100% using exact arithmetic (server-validated)
- Odd-cent remainder policy must be defined before implementation (OD-09)
- Ownership transfer requires step-up authentication, typed confirmation, and audit log
- Members without completed Stripe Connect accounts handled gracefully

---

## 5. Sponsor

### 5.1 Platform
**Primary:** Responsive web (Next.js); phone-browser-friendly layouts
**Native mobile companion:** Deferred — requires ADR and David's decision

### 5.2 Sponsor Organization Roles (OD-08 — NEEDS DAVID DECISION)
**Option A — 2-role model (aligned with SKILL_REQUIREMENTS REF-04):**
- SPONSOR_REP (discovery, shortlist, messages, view reporting)
- SPONSOR_ADMIN (full treasury, contracts, team seats, invoices)

**Option B — 4-role model (aligned with ROADMAP REF-06):**
- BRAND_ADMIN (treasury, contract signing, team management)
- CAMPAIGN_MANAGER (talent discovery, proof approvals)
- LEGAL_COUNSEL (contract review and digital signature)
- FINANCE_OFFICER (invoices, escrow deposits)

V2 implementation is blocked on OD-08 for the Firestore role schema.

### 5.3 Functional Scope
- Dashboard: spend, active sponsorships, reach, deliverables, ROI with clear definitions
- Talent discovery and up-to-4-way comparison
- Sponsorship deal workspace
- Applications, shortlist, messages, and opportunity/RFP publisher
- Contracts/documents and payment/invoice management
- Organization profile, team seats, invitations, permissions, security
- Match pools and milestone releases (subject to finance/legal ADR — OD-11 adjacent)
- Deliverable proof submission, review, and milestone release
- Organization-isolated analytics

---

## 6. Venue

### 6.1 Platform
**Primary:** Responsive web (Next.js); phone-browser secondary

### 6.2 Functional Scope
- Venue profile, stages, and verification configuration
- Events and performances
- Artist relationships and live sessions
- Staff memberships and permissions
- Analytics and settings
- BLE beacon and advanced geofence: deferred pending ADR (OD-12)

---

## 7. Enterprise Admin and Staff

### 7.1 Platform
**Primary:** Desktop-first responsive web (Next.js)
**Native mobile:** NOT included in V2; emergency responsive web actions only
(with same server-side authorization)

### 7.2 Enterprise Role List (NEEDS DAVID DECISION — OD-07)

The following 16 roles are proposed. EXECUTIVE appears in REF-04 but is omitted from one
REF-06 list. V2 will not hard-code this list until David approves.

| Role | Department | Proposed Scope |
|---|---|---|
| EXECUTIVE | Leadership | Read-only: executive KPIs, GMV, take-rate, compliance exports |
| SUPER_ADMIN | Platform Core | Full authority; custom claims; step-up auth; platform settings |
| FINANCE_ADMIN | Finance | Payout releases, dispute reserves, ledger oversight |
| FINANCE_ANALYST | Finance | Transaction monitoring, Stripe fee reconciliation, auditing |
| ARTIST_OPS_ADMIN | Operations | KYC, stage badge approvals, EPK reviews |
| CAMPAIGN_OPS_ADMIN | Operations | Crowdfunding approval, milestone validation, escrow releases |
| TRUST_SAFETY_ADMIN | Trust & Safety | User suspensions, content moderation, DMCA |
| FRAUD_INVESTIGATOR | Trust & Safety | Velocity checks, risk scoring, account freezing |
| SUPPORT_MANAGER | Support | Ticket escalations, emergency tip reversal authorization |
| SUPPORT_AGENT | Support | Fan/creator inquiry handling, receipt lookup, basic account |
| MARKETING_ADMIN | Growth | Featured artists, banner placements, push notification broadcasts |
| PARTNERSHIP_ADMIN | Growth | Sponsor onboarding, match pool contract governance |
| COMPLIANCE_ADMIN | Legal | GDPR/CCPA PII deletion orchestration, compliance archives |
| DATA_ANALYST | BI & Analytics | Custom analytics, cohort retention, usage trends |
| TECH_OPS | Engineering | Feature flags, system health, WAF, emergency IP blocking |
| AUDITOR | Independent | Read-only append-only immutable audit trail verification |

**Decision required (OD-07):** Confirm 16-role list including EXECUTIVE before Phase 3.

### 7.3 Enterprise Functional Modules
Command Center, CRM (people and organizations), Artists/Bands ops,
Campaign review and milestone ops, Live stage/session ops,
Finance (transactions, ledger, payouts, refunds, disputes, reserves, reconciliation),
Sponsorships, Venues/Events, Community/reports/moderation,
Trust & Safety / fraud, Support inbox/tickets/SLA, Marketing/announcements,
Content/Media, Analytics/reporting, Platform health/webhooks/integrations/feature flags,
Administration (staff, roles, permissions matrix, settings, audit, policy)

---

## 8. Surface Summary Matrix

| Persona | Flutter iOS/Android | Responsive Web (Next.js) | Notes |
|---|---|---|---|
| Fan | PRIMARY (full native app) | SECONDARY (account dashboard only) | |
| Solo Musician | PRIMARY (on-stage companion) | PRIMARY (full creator studio) | Dual primary |
| Band Owner / Manager / Member | PRIMARY (on-stage companion) | PRIMARY (full band studio) | Dual primary |
| Sponsor Rep / Admin | NOT INCLUDED in V2 | PRIMARY (B2B portal) | OD-08 pending |
| Venue Staff / Manager | NOT INCLUDED in V2 | PRIMARY (web-first ops) | BLE deferred |
| Enterprise Admin (16 roles) | NOT INCLUDED in V2 | PRIMARY (desktop-first CRM) | OD-07 pending |

---

## 9. What Is Explicitly Out of Scope for V2

| Item | Reason |
|---|---|
| Sponsor Flutter app | Requires ADR and David's approval |
| Enterprise Admin Flutter app | Not in scope; responsive emergency web actions only |
| Crowdbeats Cash wallet | OD-11 — legal/regulatory deferred |
| Camera performer recognition | OD-12 — privacy/consent/App Store deferred |
| BLE beacon proximity features | OD-12 — operational/privacy review deferred |
| Living-person AI style imitation | C-09 — EXCLUDED permanently |
| BigQuery / Spark / Dataflow pipelines | Not needed; Firestore operational model |
| PostgreSQL / Prisma runtime | Not in scope; Firestore only |
| Second database or GraphQL layer | Not in scope |
| Python backend | Not in scope; TypeScript/Dart only |
| Chrome extension | Not in scope |

---
*Phase 0 documentation only. No application code, Firebase resource, Stripe resource,
or deployment was created or modified.*
