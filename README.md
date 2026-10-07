# Crowdbeats V2

A clean-room rebuild of the Crowdbeats live music platform — native iOS/Android (Flutter) + responsive web (Next.js) + Firebase backend.

> **Phase 1 — Repository Skeleton.** No Firebase, Stripe, or live data connected.

---

## Prerequisites

Install the following before cloning locally:

| Tool | Version Required | Install Guide |
|---|---|---|
| Flutter (stable) | 3.47.x or later | [flutter.dev/docs/get-started](https://flutter.dev/docs/get-started) |
| Dart | 3.13.x (bundled with Flutter) | Included with Flutter SDK |
| Node.js | 20.x or later | [nodejs.org](https://nodejs.org/) |
| npm | 10.x or later | Bundled with Node.js |
| Git | 2.40 or later | [git-scm.com](https://git-scm.com/) |
| Firebase CLI | Install with `npx -y firebase-tools@latest --version` | [firebase.google.com/docs/cli](https://firebase.google.com/docs/cli) |

**Optional (for emulator-based development — Phase 2+):**
- Java JDK 17+ (required for Android Emulator and Firebase Emulators)
- Android Studio (Android SDK, Emulator)
- Xcode 16+ with iOS Simulator (macOS only)

---

## Repository Structure

```
crowdbeats-v2/
├── apps/
│   ├── mobile/        # Flutter (iOS + Android) — Fan, Musician, Band
│   ├── web/           # Next.js App Router — All personas, web-first
│   └── functions/     # Firebase Cloud Functions Gen 2 (TypeScript, Node 20)
├── packages/
│   ├── contracts/     # Platform-neutral contracts (JSON Schema / TypeScript)
│   ├── design-tokens/ # Canonical token source → Flutter + web outputs
│   ├── web-sdk/       # Generated TypeScript client helpers
│   └── config/        # Shared lint/format/test config
├── firebase/
│   ├── firestore.rules         # Default-deny security rules
│   ├── firestore.indexes.json  # Composite index definitions
│   └── storage.rules           # File security rules
├── docs/              # Architecture, decisions, product, security, payments, testing
├── scripts/           # Repository management scripts
└── .github/
    ├── CODEOWNERS
    └── workflows/     # CI skeleton (local-only in Phase 1)
```

> **Note:** Flutter (`apps/mobile`) is NOT in the npm workspace. JavaScript workspaces
> cover `apps/web`, `apps/functions`, and `packages/*`. Root npm scripts call `flutter`
> commands explicitly.

---

## Safe Local Commands

### JavaScript / TypeScript

```bash
# Install all JS/TS workspace dependencies
npm install

# Start Next.js dev server
npm run web

# Type-check all TypeScript (web + functions + contracts)
npm run typecheck

# Format check
npm run format:check

# Format write
npm run format:write

# Build Next.js
npm run web:build

# Build Functions
npm run functions:build
```

### Flutter (iOS/Android only)

```bash
# Fetch Flutter dependencies
cd apps/mobile && flutter pub get

# Run static analysis
npm run mobile:analyze
# or: cd apps/mobile && flutter analyze

# Run widget tests
npm run mobile:test
# or: cd apps/mobile && flutter test

# Build Android APK (requires Android SDK — Phase 2+)
npm run mobile:build:android

# Build iOS (macOS only, requires Xcode — Phase 2+)
npm run mobile:build:ios
```

---

## Prohibited Commands

**Never run these** without David's explicit approval:

```bash
# DO NOT deploy anywhere
firebase deploy

# DO NOT connect to real Firebase projects
firebase use <any-project>
firebase login  # until Phase 2 approved

# DO NOT use Stripe live mode
# (No Stripe commands exist in Phase 1)

# DO NOT run against production data
# (No production Firebase project exists in Phase 1)
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values locally:

```bash
cp .env.example .env
```

**NEVER commit `.env` or any file containing real secret values.**

Production secrets (Stripe keys, webhook secrets, HMAC signing keys) must be stored
in Google Cloud Secret Manager only. See `docs/architecture/00_V2_TARGET_ARCHITECTURE.md`.

---

## Open Decisions

Phase 1 requires David's input on 14 open decisions documented in
`docs/antigravity/00_OPEN_DECISIONS.md`. Critical before next phases:

- **OD-13** (urgent): Confirm Crowdbeats V2.pdf status
- **OD-03/OD-04**: Android application ID and Apple bundle ID (needed before Phase 2)
- **OD-05**: Firebase project IDs for dev/staging/prod (needed before Phase 2)
- **OD-07/OD-08**: Enterprise and Sponsor role models (needed before Phase 3)

---

## Documentation

| Document | Purpose |
|---|---|
| `docs/clean-room/CLEAN_ROOM_ARCHITECTURE_CONTRACT.md` | Binding clean-room rules for all phases |
| `docs/architecture/00_V2_TARGET_ARCHITECTURE.md` | Technology choices and architecture invariants |
| `docs/product/00_PERSONA_SURFACE_SCOPE.md` | Persona list, platform surfaces, and scope |
| `docs/decisions/00_CONFLICT_RESOLUTION_LOG.md` | How reference conflicts were resolved |
| `docs/antigravity/00_OPEN_DECISIONS.md` | Unresolved decisions requiring David's input |
| `docs/antigravity/00_REFERENCE_COVERAGE_MATRIX.md` | Reference document map |
| `docs/antigravity/00_SKILL_EXECUTION_PLAN.md` | Skill selection by phase |
| `docs/antigravity/01_REPOSITORY_BOOTSTRAP_REPORT.md` | Phase 1 outcome report |

---

*Crowdbeats V2 — Clean-room build. No former Crowdbeats code reused.*
