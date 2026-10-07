# Stitch to Next.js Implementation Mapping — Crowdbeats V2

**Design Authority:** Google Stitch Project `5326179813018056505`  
**Target Codebase:** `apps/web/` (Next.js 16 App Router & Tailwind CSS)

---

## 1. Web Route Mapping Matrix

| Stitch Screen # | Stitch Screen Title | Target Next.js File Path | Component / Page Name | Action Required |
| :-: | :--- | :--- | :--- | :--- |
| **01** | Direct Tipping Flow | `apps/web/app/(fan)/tip/[creatorSlug]/page.tsx` & `components/tip/TipModal.tsx` | `TipModal` / `TipPage` | `REFACTOR & REDESIGN` |
| **02** | Fan Onboarding Step 1 (Basic Info) | `apps/web/app/onboarding/fan/step-1/page.tsx` | `FanOnboardingStep1Page` | `NEW / REPLACE` |
| **04** | Fan Onboarding Step 3 (Details) | `apps/web/app/onboarding/fan/step-3/page.tsx` | `FanOnboardingStep3Page` | `NEW / REPLACE` |
| **05** | Fan Onboarding Step 4 (Welcome) | `apps/web/app/onboarding/fan/complete/page.tsx`| `FanOnboardingCompletePage` | `NEW / REPLACE` |
| **06** | Fan Onboarding Step 4 (Review) | `apps/web/app/onboarding/fan/review/page.tsx` | `FanOnboardingReviewPage` | `NEW / REPLACE` |
| **07** | Fan Onboarding Step 2 (Preferences) | `apps/web/app/onboarding/fan/step-2/page.tsx` | `FanOnboardingStep2Page` | `NEW / REPLACE` |
| **08** | Nearby Live Music Map (Standard) | `apps/web/app/(fan)/nearby/page.tsx` | `NearbyDiscoveryPage` | `REFACTOR & REDESIGN` |
| **09** | Fan Activity & Notifications | `apps/web/app/(fan)/activity/page.tsx` | `FanActivityPage` | `REFACTOR & REDESIGN` |
| **10** | Fan Home Dashboard | `apps/web/app/(fan)/home/page.tsx` | `FanHomePage` | `REFACTOR & REDESIGN` |
| **11** | Enhanced Map (Radar View) | `apps/web/components/map/EnhancedLiveMap.tsx` | `EnhancedLiveMap` | `NEW` |
| **Shell**| Fan Portal Responsive Layout | `apps/web/app/(fan)/layout.tsx` | `FanPortalLayout` | `REFACTOR & REDESIGN` |

---

## 2. Reusable React Component System (`apps/web/components/ui/`)

1. **`tailwind.config.js` / `globals.css` Extensions:**
   - Define custom CSS variables matching Stitch tokens: `--cb-bg-app`, `--cb-surface-1`, `--cb-surface-2`, `--cb-purple-main`, `--cb-live-green`.
   - Utility classes: `.cb-glass`, `.cb-glow-purple`, `.cb-glow-live`.

2. **`CbPillButton.tsx`:**
   - Polymorphic button supporting icons, loading spinner states, gradient hover transitions, and keyboard accessibility.

3. **`CbTipPresetCard.tsx`:**
   - Accessible amount selection tile with ARIA radio role, keyboard navigation, and glowing active border.

4. **`CbPerformerSpotlightCard.tsx`:**
   - Next.js optimized image card with `priority` loading, responsive aspect ratios, live status pulse, and direct tip modal trigger.

5. **`CbLinearStepIndicator.tsx`:**
   - 4-step progress bar component with accessible step labels and screen reader announcements.

6. **`CbActivityEventTile.tsx`:**
   - Activity feed tile with formatted timestamps, formatted dollar currency badges, and deep links to performer profiles.

---

## 3. Responsive & Accessibility Invariants (WCAG 2.2 AA)

- **Mobile Viewport (< 768px):** Strict 1:1 fidelity with Stitch mobile layout, full-bleed cards, bottom navigation bar.
- **Tablet / Desktop Viewport (>= 768px):** Centered high-polish container (max-w-md for onboarding & tipping, max-w-6xl for discovery dashboards), responsive multi-column layouts, top navigation header with desktop profile dropdown.
- **Color Contrast:** All body text meets minimum 4.5:1 contrast against dark background (#0B0C10). Primary purple buttons meet 3:1 contrast for large elements.
- **Keyboard Navigation:** Full focus rings (`focus-visible:ring-2 focus-visible:ring-purple-500`) on all interactive chips, buttons, and inputs.
