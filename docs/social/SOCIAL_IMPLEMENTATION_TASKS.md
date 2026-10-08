# Crowdbeats V2 — Social & Messaging Implementation Task Board

**Date:** 2026-10-04  
**Lead Engineer:** Antigravity Lead Agent  
**Branch:** `feat/social-relationships-messaging`  

---

## Specialist Subagent Assignments & Boundaries

| Role | Subagent Name | Assignment & Scope | Primary File Ownership (Single Writer) | Status |
|---|---|---|---|---|
| **Social Graph** | `SocialGraphAgent` | Contracts, follow/unfollow callables, follower/following lists, counts, follow back, remove follower | `packages/contracts/src/social/`, `apps/functions/src/social/followCallables.ts` | Scheduled |
| **Messaging Engine**| `MessagingAgent` | Conversation lifecycle, message requests, decline cooldown, chat persistence, unread tracking | `apps/functions/src/social/messagingCallables.ts`, `apps/functions/src/social/conversationService.ts` | Scheduled |
| **Trust & Safety** | `TrustPermissionsAgent`| Block & restrict callables, Firestore security rules, bidirectional isolation, safety checks | `apps/functions/src/social/safetyCallables.ts`, `firebase/firestore.rules`, `firebase/tests/` | Scheduled |
| **UX & Cross-Platform**| `UxComponentsAgent`| Mobile screens/tabs & Riverpod state, Web responsive messaging & inbox pages, theme & a11y | `apps/web/app/(fan)/fan/messages/`, `apps/web/app/(creator)/creator/messages/`, `apps/mobile/lib/ui/social/` | Scheduled |
| **Admin Support** | `AdminSupportAgent` | Report modal integration, message evidence snapshotting, admin moderation queue enhancement | `apps/functions/src/moderation/reportService.ts`, `apps/web/app/(admin)/admin/support/` | Scheduled |
| **Integration QA** | `IntegrationQaAgent` | Multi-role test matrix (9 directed pairs), block/restrict verification, regression suite | `apps/functions/src/__tests__/socialMessagingE2E.test.ts`, `apps/mobile/test/` | Scheduled |

---

## Shared File Single-Writer Protocol
- `firebase/firestore.rules` & `packages/contracts/src/index.ts` are owned and integrated exclusively by the **Lead Engineer**.
- No two agents edit the same file concurrently.
- All implementations follow `docs/social/SOCIAL_FEATURE_SPEC.md`.

---

## Execution Waves

### Wave 1: Contracts, Graph, Messaging & Safety Backends
- Step 1.1: Shared TypeScript Contracts (`packages/contracts/src/social/*`).
- Step 1.2: Cloud Functions for Follows, Messaging, Blocks, Restrictions, and Reports (`apps/functions/src/social/*`).
- Step 1.3: Firestore Security Rules updates for `/conversations`, `/socialBlocks`, `/socialRestrictions`, `/follows`.

### Wave 2: Mobile & Web UI Implementation
- Step 2.1: Web Messaging & Follows (`apps/web/app/(fan)/fan/messages`, `creator/messages`, `band/messages`, profile follow buttons, block/restrict modals).
- Step 2.2: Mobile Messaging & Follows (`apps/mobile/lib/ui/social/*`, Riverpod providers, shells).
- Step 2.3: Admin Support Report Queue & Evidence Inspection (`apps/web/app/(admin)/admin/support`).

### Wave 3: Integration, Parameterized Role-Pair Testing & Verification
- Step 3.1: Automated backend integration tests for all 9 directed role pairs.
- Step 3.2: Verification of block, restrict, report, decline cooldown, guest auth continuation.
- Step 3.3: Full monorepo verification: `npm run type-check`, `npm test`, `flutter test`, `flutter analyze`.
