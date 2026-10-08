# Crowdbeats Mobile UI/UX Design System — Audit, Reference Map & Task Board

**Date:** October 4, 2026  
**Branch:** `feat/mobile-design-system-fan-vision`  
**Lead Architect & Orchestrator:** Antigravity Lead Agent  
**Primary Reference:** `fan vision board.jpg` (`media_1791177115439.jpg`)  
**Target Environments:** Flutter Mobile (`apps/mobile`), Google Stitch Projects, Shared Tokens (`packages/contracts`)  

---

## 1. Vision Board Audit & Reference Screen Mapping

The attached `fan vision board.jpg` contains 10 distinct, production-fidelity screens that define the visual and interaction benchmark for Crowdbeats V2. Every panel has been cataloged and mapped to existing high-resolution assets in `docs/design/stitch_assets/`:

| Panel # | Vision Board Label | Screen Type / Journey | Stitch Asset Equivalent | Key Functional Elements |
|:---:|:---|:---|:---|:---|
| **01** | Create Profile | Fan Onboarding (Step 1 of 4) | `screen_02_map.png` | Progress indicator (1/4), hero crowd photo, avatar uploader, First/Last name, username with real-time `✓ Available`, email with `✓`, optional phone, music genres chips, social connects. |
| **02** | Tell us more about you | Fan Onboarding (Step 2 of 4 - Preferences) | `screen_07_venue_dashboard.png` | Progress (2/4), favorite genres (Rock, Pop, Indie...), discovery channels (Live events, Friends, Social...), top 5 artist search chips, social auth toggles, notification push preferences. |
| **03** | Profile Details | Fan Onboarding (Step 3 of 4) | `screen_04_live_stage.png` | Progress (3/4), short bio, city selector, birth date, occupation, pronouns, multi-select interests (Concerts, Festivals, Photography...), live show frequency, profile visibility selector. |
| **04** | Review your profile | Fan Onboarding (Step 4 of 4) | `screen_06_artist_profile.png` | Progress (4/4), structured summary card with inline edit buttons for About You, Preferences, Music Experience, Connected Accounts, Notification Preferences; `Create My Profile →` CTA. |
| **05** | Your Profile is created | Celebration / Onboarding Complete | `screen_05_tipping_overlay.png` | Purple concert stage with celebratory confetti, "Welcome to Crowdbeats, Jordan!", "What's next?" roadmap, invite friends card, `Explore Crowdbeats →` CTA. |
| **06** | Fan Dashboard | Authenticated Fan Home | `screen_10_fan_home.png` | Contextual greeting ("Good evening, Jordan 👋"), quick action cards (Nearby Live, Tip a Musician, Following), Live Near You carousel, Upcoming Shows with "Remind Me", Recent Tips with live receipt status. |
| **07** | Discover | Nearby Live Discovery | `screen_08_sponsor_hub.png` / `screen_11_enhanced_map.png` | City selector, Map/List/Venues segmented control, interactive map with glowing live markers, bottom drawer with nearby performers (distance, venue, genre, direct `Tip` button). |
| **08** | Tip | Direct Performer Tipping Checkout | `screen_01_onboarding.png` | Artist hero spotlight (Alex Martin, verified, The Blue Note), $5, $10, $20, Custom presets, impact caption, Apple Pay / Google Pay / Card selector, cheer message, `Tip Now — $X` CTA. |
| **09** | Tip (Camera / Vision) | In-App Camera / AR Tipping | `screen_03_discovery.png` | Camera viewfinder with green bounding reticle (`PERFORMER DETECTED`), detected artist card (Jake Rios, 0.3 mi away), instant amount buttons ($5, $10, $20, $50, Other), Apple Pay checkout. |
| **10** | Activity | Social Activity & Tipping Feed | `screen_09_crowdfunding.png` | Filter tabs (All, Tips, Follows, Campaigns, System), chronologically grouped feed (Today, Yesterday, This Week) with performer avatars, net tip receipts, follow-back actions, and system notices. |

---

## 2. Google Stitch & Model Capabilities Discovery

### 2.1 Stitch Project Identification
Stitch MCP tools were queried via `call_mcp_tool`. Available Stitch projects:
- `projects/13418068361858244560`: **Crowdbeats Fan Mobile Experience** (Target mobile project for Fan flows)
- `projects/14511063740330293106`: **Crowdbeats Solo Musician Mobile Experience** (Target mobile project for Solo creator flows)
- `projects/4991587405639772867`: **Crowdbeats Band Mobile Experience** (Target mobile project for Band flows)
- `projects/9498163092474697594`: **Crowdbeats Sponsor Portal** (Existing desktop portal; mobile extension designed in Phase C)
- `projects/14673587965252723053`: Crowdbeats Landing Page Redesign (Desktop landing reference)
- Historical reference project `5326179813018056505` was referenced in token definitions; its design tokens are codified in `STITCH_DESIGN_TOKENS.md` and `apps/mobile/lib/ui/theme/cb_colors.dart`.

### 2.2 Model & Capabilities Resolution
- **Requested "Gemini Pro Ultra":** Resolved to the active top-tier reasoning and design model (`pro` tier) within the Google Antigravity multiagent architecture.
- **Requested "Banana Pro":** Resolved to the integrated native multimodal image generation capability (`generate_image` tool powered by Google Imagen / Banana architecture), used for performer photography, hero stage visuals, and onboarding celebration artwork.

---

## 3. Shared Design System & Token Contracts

### 3.1 Color Palette
- **Obsidian Scaffold Background:** `#0B0C10` (Dark) / `#F9FAFB` (Light)
- **Layer 1 Surface (Cards, Tiles):** `#151722` (Dark) / `#FFFFFF` (Light)
- **Layer 2 Surface (Elevated, Inputs):** `#1E2032` (Dark) / `#F3F4F6` (Light)
- **Subtle Borders:** `#2B2D44` (Dark) / `#E5E7EB` (Light)
- **Brand Purple Main (Primary CTA):** `#7C3AED`
- **Brand Purple Light (Gradients/Highlights):** `#A855F7`
- **Brand Purple Dim (Chip fills):** `rgba(124, 58, 237, 0.15)`
- **Live Status Green:** `#10B981`
- **Camera Reticle Green:** `#00FF66`
- **Following Heart Orange:** `#FB923C`
- **Verified Creator Blue:** `#38BDF8`

### 3.2 Spacing & Geometry
- **Grid Scale:** 4px harmonic grid (`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `48px`).
- **Corner Radii:**
  - `radius-sm`: `8px` (Badges, tag chips)
  - `radius-md`: `12px` (Inputs, filter chips)
  - `radius-lg`: `16px` (Standard cards, media tiles)
  - `radius-xl`: `20px` (Bottom sheets, spotlight cards)
  - `radius-full`: `9999px` (Pill CTAs, floating action buttons, avatars)
- **Touch Accessibility:** Strict minimum touch target constraint $\ge 48\times 48\text{dp}$ on all interactive controls.

---

## 4. Multiagent Task Board

| Task ID | Component / Area | Description | Assigned Agent | Status | Verification Criteria |
|:---|:---|:---|:---|:---:|:---|
| **DS-01** | Reference & Tokens | Analyze vision board, codify Light/Dark token contracts and Stitch components | Reference & Design Agent | IN_PROGRESS | Token specification document + component inventory |
| **DS-02** | Fan Onboarding & Profile | Implement 4-step profile wizard + celebration screen + draft persistence | Fan Journey Agent | PENDING | Functional wizard with step navigation, validation, and review |
| **DS-03** | Fan Dashboard & Feed | Refine Fan Home Dashboard, Live Near You carousel, and Activity Feed with filters | Fan Journey Agent | PENDING | Working Home & Activity tabs matching vision board |
| **DS-04** | Nearby & Tipping Journey | Ensure smooth Discover Map/List, Performer Tipping ($5 default, fees), Camera tip | Fan Journey Agent | PENDING | Complete tip journey from discovery to Stripe receipt |
| **DS-05** | Creator Mobile (Solo & Band) | Creator Studio, Live HUD, QR rotation, split controls, and earnings cashout | Creator Journey Agent | PENDING | Role-aware creator dashboard and performance controls |
| **DS-06** | Sponsor Mobile Experience | Sponsor Mobile Shell, Talent Discovery, Shortlist, Contracts, and Payment tracking | Sponsor Journey Agent | PENDING | Complete mobile Sponsor experience with working navigation |
| **DS-07** | Social, Trust & Safety | Follow/Unfollow, Direct Messaging, Block/Restrict/Report, and permission gating | Social & Trust Agent | PENDING | Interaction matrix and security-rule enforcement verification |
| **DS-08** | Flutter Core Integration | Integrate routes, update `main.dart`, theme extensions, and shared Stitch widgets | Flutter Integration Agent | PENDING | Clean compilation and working GoRouter routes |
| **DS-09** | Visual Assets Generation | Generate high-resolution concert photography and onboarding artwork via `generate_image` | Design / Lead | PENDING | Real asset files embedded in UI |
| **DS-10** | Independent QA & Validation | Test suite execution, accessibility audit, static analysis, and light/dark verification | Independent QA Agent | PENDING | 0 errors on static analysis, 100% test pass rate |
