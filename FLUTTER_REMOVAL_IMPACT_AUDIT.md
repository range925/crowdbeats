# CROWDBEATS — FLUTTER DECOMMISSIONING & UNIFIED NEXT.JS ARCHITECTURE AUDIT

**Document:** `docs/architecture/FLUTTER_REMOVAL_IMPACT_AUDIT.md`  
**Date:** August 25, 2026  
**Status:** COMPLETED AUDIT (Awaiting Approval)  
**Author:** Principal Architect  

---

## 1. Executive Summary

This audit assesses the impact of removing the Flutter mobile application (`apps/mobile_flutter`) and consolidating the Crowdbeats product suite under a unified, mobile-first responsive Next.js application.

The analysis confirms that the existing Next.js application (**`apps/admin_web`**) is not only the single, canonical web platform in this repository, but it already contains highly detailed, interactive, and mobile-responsive layouts for all major user roles (Fan, Solo Musician, Band, Sponsor, and Enterprise Admin). Consolidation of the codebase into a single Next.js application will simplify the CI/CD pipeline, eliminate redundant code, reduce development overhead, and provide a unified, responsive client interface.

---

## 2. Forensic Inventory of Flutter/Dart Artifacts

Below is the classification of all Flutter-related files, directories, configurations, and documentation within the monorepo.

| File / Directory Path | Current Purpose / Role | Classification | Action / Justification |
| :--- | :--- | :--- | :--- |
| **`apps/mobile_flutter/`** | The entire Flutter mobile client codebase (iOS, Android, Web, Windows). | **REMOVE** | Safely delete the entire directory once approved. No production/backend business logic is coupled here; all backend functionality is isolated to `apps/functions` and `packages/shared`. |
| **`docs/FLUTTER_MOBILE_ARCHITECTURE.md`** | Architectural documentation for the Flutter client. | **REMOVE** | Obsolete once Flutter is removed. |
| **`docs/design/FLUTTER_VISIBLE_THEME_IMPLEMENTATION_REPORT.md`** | Report detailing the implementation of the Google Stitch design in the Flutter application. | **REMOVE** | Obsolete once Flutter is removed. |
| **`docs/ai/CROWDBEATS_AAS_SKILL_SELECTION.md`** | The curated Agentic Awesome Skills (AAS) list. | **REVIEW MANUALLY** | Remove all 15+ Flutter/Dart specific skills from the required/optional list. Keep the React, Next.js, and Firebase skills. |
| **`docs/ai/CROWDBEATS_SKILL_REQUIREMENTS.md`** | Technical requirements for AI assistant skills. | **REVIEW MANUALLY** | Remove all Flutter/Dart references from the requirements specification. |
| **`docs/CROSS_PLATFORM_CURRENT_STATE_AUDIT.md`** | Audits the initial state of both Web and Flutter applications. | **REVIEW MANUALLY** | Retain for historical reference, but append a deprecation note at the top indicating that the mobile client has been consolidated into the Next.js app. |
| **`docs/CROSS_PLATFORM_TARGET_ARCHITECTURE.md`** | Architecture diagram showing separate Flutter and Web clients. | **REVIEW MANUALLY** | Update the diagram to depict a single unified Next.js App Client communicating with the Firebase backend. |
| **`docs/CROWDBEATS_CORE_ARCHITECTURE_INVARIANTS.md`** | Set of invariants, some of which refer to the separate Flutter client. | **REVIEW MANUALLY** | Remove references to `apps/mobile_flutter/` and the mobile-specific UI constraints, replacing them with Next.js responsive design constraints. |
| **`docs/DELIVERY_PLAN.md`** | Delivery milestones which originally included separate Flutter phases. | **REVIEW MANUALLY** | Streamline the phases to focus solely on Next.js responsive features and deployments. |
| **`scripts/check-env.js`** | Verification script for local development tools. | **MODIFY** | Remove checks for the `Flutter SDK` and `Dart SDK` from the verification list (lines 3 and 16). |
| **`.github/workflows/ci.yml`** | The GitHub Actions CI configuration. | **MODIFY** | Remove the `flutter-mobile-tests` job entirely. Remove it from the `needs` list of the `e2e-scenario-suite` job. |
| **`package.json` (Root)** | Monorepo package descriptor. | **MODIFY** | Remove `"apps/mobile_flutter"` from the `workspaces` array. |
| **`firebase.json` (Root)** | Firebase deployment configuration. | **KEEP** | No modifications needed. The current targets cover `web_public`, `web_app`, and `web_admin` which map to static assets/web builds and do not require Flutter. |
| **`packages/shared/`** | Shared business logic, types, and validators. | **KEEP** | This is the core shared contract library used by Next.js and Firebase Cloud Functions. It must remain untouched. |
| **`apps/functions/`** | Firebase Cloud Functions. | **KEEP** | The server-authoritative API, webhooks, and background triggers must remain untouched. |

---

## 3. Evaluation of `apps/admin_web` as the Unified Client

### Suitability Assessment
*   **Architecture & Routing:** `apps/admin_web` utilizes the modern **Next.js App Router** structure. Its directories are organized into cleanly separated sub-routes:
    *   `/enterprise`: Admin portal.
    *   `/sponsor`: B2B sponsor portal.
    *   `/fan`: B2C consumer application.
    *   `/musician` / `/band`: B2C creator applications.
*   **Mobile-First Simulator UI:** The `/fan`, `/musician`, and `/band` routes are already built with a dual-rendering mode:
    *   They default to a `MOBILE_FRAME` emulator mode, displaying the application inside an interactive, high-fidelity smartphone mockup on desktop screens.
    *   They render beautifully and responsively on real mobile viewports.
*   **Shared Token Foundation:** The application already utilizes the tailwind and CSS token configuration (`apps/admin_web/src/styles/`) implemented to mirror the Google Stitch design guidelines.

**Conclusion:** `apps/admin_web` is exceptionally well-suited to serve as the single, unified web application for Crowdbeats. It eliminates the need for separate codebases while fully delivering the mobile-first layouts desired for consumers and creators.

---

## 4. Feature Parity & Migration Analysis

Before deleting the Flutter codebase, we verified that all primary features implemented in Flutter are represented in the Next.js client:

1.  **Home Pulse (Feed):**
    *   *Flutter:* `fan_home_screen.dart` featured a "LIVE NOW" carousel and a "NEARBY STAGES" list.
    *   *Next.js:* `/fan` and `/fan/dashboard` implements the "Live Artists" horizontal carousel, "Nearby Stages" list, and quick-tip actions with full fidelity.
2.  **Nearby Radar Map:**
    *   *Flutter:* `nearby_map_screen.dart` contained a simulated map with a draggable bottom sheet.
    *   *Next.js:* `/fan` includes an interactive map view (simulated) with a collapsible bottom tray showing nearby venues, fully aligned with the design spec.
3.  **Tipping Flow:**
    *   *Flutter:* `fan_tipping_modal.dart` was a 3-step wizard (Select Amount -> Add Note / Confirm -> Success).
    *   *Next.js:* `/fan` features a fully interactive 3-step tipping modal overlay that mimics the exact user flow, including simulated success animations and custom amounts.
4.  **Activity Feed:**
    *   *Flutter:* `activity_feed_screen.dart` showed past tips, check-ins, and campaign backings.
    *   *Next.js:* `/fan` and `/fan/profile` includes a rich activity feed showing chronological user interactions.
5.  **Profile & Context Switching:**
    *   *Flutter:* `fan_profile_dashboard_screen.dart` had payment details, default tip settings, and a bottom sheet context switcher.
    *   *Next.js:* The top bar in the Next.js interface features a direct Role Switcher allowing instantaneous navigation between Fan, Musician, Band, Sponsor, and Enterprise views.

No active production logic is exclusive to the Flutter app; the Next.js implementation is actually *more* mature, featuring completed interactive state management.

---

## 5. Next Steps for Safe Decommissioning

Following approval of this audit, we will execute the following steps to prune the codebase safely:

1.  **Remove Workspaces & Environment Checks:**
    *   Remove `"apps/mobile_flutter"` from the root `package.json` workspaces list.
    *   Remove `Flutter SDK` and `Dart SDK` checks from `scripts/check-env.js`.
2.  **Clean up CI/CD Workflow:**
    *   Remove the `flutter-mobile-tests` job from `.github/workflows/ci.yml`.
3.  **Perform the Deletion:**
    *   Delete the `apps/mobile_flutter/` directory.
    *   Delete `docs/FLUTTER_MOBILE_ARCHITECTURE.md` and `docs/design/FLUTTER_VISIBLE_THEME_IMPLEMENTATION_REPORT.md`.
4.  **Update Cross-Reference Documentation:**
    *   Refactor `docs/CROSS_PLATFORM_TARGET_ARCHITECTURE.md`, `docs/CROWDBEATS_CORE_ARCHITECTURE_INVARIANTS.md`, and `docs/ai/CROWDBEATS_AAS_SKILL_SELECTION.md` to reflect a pure Next.js web application architecture.
5.  **Rename/Rebrand Project (Optional/Future step):**
    *   Optionally rename `apps/admin_web` to `apps/web_app` to better reflect its role as the unified application, and update workspaces/scripts accordingly.
