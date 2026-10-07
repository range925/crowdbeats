# Crowdbeats V2 — Stitch Mobile Design Gap Report
## Stitch Project `5326179813018056505` Token & Component Gap Analysis

**Status:** Completed  
**Authoritative Source:** Google Stitch Project `projects/5326179813018056505` (*Enhanced Nearby Live Music Map*)  
**Design Theme:** *Vivid Resonance*  
**Date:** 2026-08-30  

---

## 1. Verified Stitch Inspection Evidence

Antigravity has connected to and inspected the exact Google Stitch project:
- **Project Identifier:** `projects/5326179813018056505`
- **Project Title:** `Enhanced Nearby Live Music Map`
- **Device Type:** `MOBILE`
- **Design System Name:** `Vivid Resonance`
- **Inspected Screens:**
  1. `Crowdbeats Home Screen` (`screens/154bdfb8893741cab5a71ed6a95034a3`)
  2. `Tip a Musician` (`screens/e56cf6ab80ff4e978b4a2867ecda4f8d`)
  3. `fan homepage after signin.png` (`screens/12401386157321116643`)
  4. `Crowdbeats Splash Screen` (`screens/926970f5c74f4667994d23c01ef31d5f`)
  5. `Shader` Visualizer Component (`screens/8211479aa8c74d3395ad4737ff50817d`)
  6. 8 Supplemental Mobile UI Screen Instances (`12401386157321115245`, `12401386157321114967`, `12401386157321114501`, `12401386157321114035`, `12401386157321117387`, `12401386157321116177`, `12401386157321113757`, `12401386157321116921`)

---

## 2. Stitch Token to Flutter Design Token Map

| Token Name | Stitch Hex / Value | Flutter (`CbColors` / `CbTheme`) | Status / Action Needed |
| :--- | :--- | :--- | :--- |
| **Surface Base** | `#131313` / `#121212` | `CbColors.surfaceBase` (`0xFF121212`) | ✅ Aligned |
| **Surface Card** | `#1c1b1b` / `#1e1e1e` | `CbColors.surfaceCard` (`0xFF1E1E1E`) | ✅ Aligned |
| **Surface Container** | `#201f1f` / `#2a2a2a` | `CbColors.surfaceRaised` (`0xFF2A2A2A`) | ✅ Aligned |
| **Primary Accent** | `#6200ee` / `#cfbdff` | `CbColors.purpleMain` (`0xFF8B5CF6`) | ⚠️ Harmonize with Stitch `0xFF6200EE` |
| **Secondary Magenta**| `#bb86fc` / `#dab9ff` | `CbColors.purpleLight` (`0xFFC4B5FD`) | ⚠️ Map to Electric Magenta `0xFFBB86FC` |
| **Tertiary Teal Gas**| `#03dac6` / `#17deca` | `CbColors.statusLive` (`0xFF10B981`) | ⚠️ Add `CbColors.tealGas` (`0xFF03DAC6`) |
| **Headline Font** | **Montserrat** (700-800) | `GoogleFonts.inter` | ⚠️ Integrate `GoogleFonts.montserrat` |
| **Body Font** | **Inter** (400-600) | `GoogleFonts.inter` | ✅ Aligned |
| **Corner Radius Card**| `16px` (1rem) | `CbSpacing.radiusLg` (16.0) | ✅ Aligned |
| **Corner Radius Pill**| `9999px` (Full) | `CbSpacing.radiusFull` (9999.0) | ✅ Aligned |

---

## 3. Flutter Reusable Component Gap List (Phase 1 Deliverables)

1. **`CbGlassCard`:** 16px rounded card with 20px backdrop blur, 1px top/left glow border (`rgba(255,255,255,0.08)`).
2. **`CbLiveHeroCard`:** High-prominence check-in & stage status card with pulsing glow.
3. **`CbContextSwitcher`:** Header pill component showing active Solo Musician / Band context with dropdown selection.
4. **`CbMetricSnapshotCard`:** High-information, calm financial card with clear currency, timeframe, and definition tooltip.
5. **`CbSegmentedControl`:** Full-round pill segmented control with smooth indicator animation.
6. **`CbQrPresentationModal`:** High-contrast full-screen QR code presentation with wake-lock toggle.
