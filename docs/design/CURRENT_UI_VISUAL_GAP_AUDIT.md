# Current UI Visual Gap Audit — Crowdbeats V2

**Design Authority:** Google Stitch Project `5326179813018056505`  
**Audited Codebases:** `apps/mobile/lib/` (Flutter) & `apps/web/app/` (Next.js)

---

## 1. Screen-by-Screen Gap Analysis & Classification

| # | Stitch Screen & Function | Existing Flutter Code Status | Existing Next.js Code Status | Gap Classification | Key Visual Differences & Deficiencies |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **01** | **Direct Musician Tipping Flow** | `ui/fan/tip/tip_flow_screen.dart` | `app/(fan)/tip/[creatorSlug]/page.tsx` | `DOES NOT MATCH` | Current UI uses generic flat gray cards and square corners; missing high-contrast purple pill CTA, impact banner, performer spotlight hero with live tags, and Apple Pay/Google Pay radio tiles. |
| **02** | **Fan Onboarding: Step 1 (Basic Info)** | `ui/auth/auth_screen.dart` (generic) | `app/onboarding/page.tsx` (simple role select) | `MISSING FROM CODE` | Current code has a single-step basic role picker; missing the rich 4-step wizard with avatar upload, live username check, music preferences, and social links. |
| **03** | **AR Camera Performer Detection & Tip**| `ui/fan/tip/qr_scanner_screen.dart` | N/A (Mobile exclusive feature) | `PARTIAL MATCH` | Current Flutter implementation is a basic QR scanner without real-time bounding reticle, performer detection badge, or integrated bottom tipping drawer. |
| **04** | **Fan Onboarding: Step 3 (Details)** | None | None | `MISSING FROM CODE` | Detailed bio, show frequency, platform priorities, and interest chips are entirely absent from existing frontend code. |
| **05** | **Fan Onboarding: Step 4 (Welcome)** | `ui/auth/onboarding_complete.dart` | `app/onboarding/complete/page.tsx` | `DOES NOT MATCH` | Existing complete screen is plain text with a single button; missing celebratory confetti, curated discovery actions, and referral card. |
| **06** | **Fan Onboarding: Step 4 (Review)** | None | None | `MISSING FROM CODE` | Comprehensive pre-submission review screen with inline edit triggers does not exist in current code. |
| **07** | **Fan Onboarding: Step 2 (Preferences)**| None | None | `MISSING FROM CODE` | 12-genre interactive grid, artist tag search, and granular notification toggles are missing from the onboarding flow. |
| **08** | **Nearby Live Music Map (Standard)** | `ui/fan/tabs/nearby_tab.dart` | `app/(fan)/nearby/page.tsx` | `PARTIAL MATCH` | Basic Google Maps implementation exists, but markers are default standard pins; missing custom circular artist avatars, colored category rings, and bottom drawer lineup cards with direct "Tip" action. |
| **09** | **Fan Activity & Notifications Feed** | `ui/fan/tabs/activity_tab.dart` | `app/(fan)/activity/page.tsx` | `DOES NOT MATCH` | Current activity feed is a raw text list; missing category filter chips (All, Tips, Follows, Campaigns, System), chronological date headers, green dollar amount badges, and "Follow Back" action. |
| **10** | **Fan Home Dashboard** | `ui/fan/tabs/home_tab.dart` | `app/(fan)/home/page.tsx` | `DOES NOT MATCH` | Current home page lacks personalized header greeting, 3-column quick action cards, horizontal live performer carousel with green LIVE badges, and upcoming show cards. |
| **11** | **Enhanced Map (Radar View)** | None | None | `MISSING FROM CODE` | Pulsing radar beacons and expanded stage cards need to be built as a high-fidelity map view mode. |
| **12** | **Enhanced AR Viewfinder** | None | N/A (Mobile feature) | `MISSING FROM CODE` | Glassmorphic AR overlay with emoji message picker and instant tip bottom sheet must be implemented in Flutter. |

---

## 2. Global Design System Deficiencies in Current Code

1. **Color Palette Inconsistency:**
   - Current code mixes hardcoded purples (`#6200EE`, `#3700B3`, `#8A2BE2`) and flat grays (`#121212`, `#222222`).
   - Must be unified to authoritative tokens: `#0B0C10` (App Background), `#151722` (Card Surface 1), `#1E2032` (Elevated Card), `#7C3AED` (Primary Brand Purple), and `#10B981` (Live Emerald).

2. **Button Shapes & Hierarchy:**
   - Current buttons use rectangular or slightly rounded corners (`radius 4px - 8px`).
   - Authoritative Stitch style mandates **fully rounded pill buttons (`radius 27px / 999px`)** with subtle glowing box shadows (`0 8px 24px -4px rgba(124, 58, 237, 0.45)`).

3. **Bottom Navigation Polish:**
   - Existing Flutter `BottomNavigationBar` is opaque and flat.
   - Authoritative Stitch style requires a **glassmorphic floating bar (`backdrop-filter: blur(20px)`)** with an elevated centered floating "Tip" action pill.

4. **Componentization & Real Elements (Anti-Flattening Guard):**
   - Verified that no screen elements are flattened into static images.
   - All buttons, chips, form inputs, map markers, switches, and badges must be built as accessible native widgets/components.

---

## 3. Visual Assets Required

To achieve the premium visual quality established by Gemini 3.1 Pro and Nano Banana Pro in Stitch:
1. **Concert Stage Hero Photography:** High-resolution live performance images (guitarists, vocalists, bands with purple/amber concert lighting) for performer cards and onboarding headers.
2. **Avatar Assets:** Representative performer and fan avatar photos.
3. **Equalizer / Waveform Logo Asset:** Crowdbeats brand mark with centered audio equalizer bars.
4. **Custom Map Marker Icons:** SVG/Canvas circular avatar pins with colored indicator rings.
