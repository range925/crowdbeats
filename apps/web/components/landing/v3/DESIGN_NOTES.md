# Crowdbeats Landing v3 — Stitch & Design System Notes

## 1. Project Reference & Tooling
- **Stitch Project ID:** `14673587965252723053`
- **Project URL:** https://stitch.withgoogle.com/projects/14673587965252723053
- **Design System Asset:** `assets/64aaae6c9e1b4f97b12ba439ff027d6a` ("Sonic Precision")
  - Movement: *Modern Cupertino Minimalism with Atmospheric Layering*
  - Principles: Controlled restraint, alternating canvas surfaces (`#FFFFFF` / `#0A0A0B`), monochrome navigation and CTAs, electric violet reserved exclusively for brand pulse and selective interactive accents.
- **Model Used:** `GEMINI_3_8_FLASH` via Stitch MCP `generate_screen_from_text`.

---

## 2. Generated Screens

### Desktop Master Screen
- **Screen Resource Name:** `projects/14673587965252723053/screens/d6fa2754f4f1483494c2f5649b310f57`
- **Screen ID:** `d6fa2754f4f1483494c2f5649b310f57`
- **Title:** "Crowdbeats V2 — Desktop Landing Page"
- **Canvas Dimensions:** 2560px × 15,118px
- **HTML Artifact File:** `projects/14673587965252723053/files/75724c6d5d904813b69f7ca3b1ec3db8`
- **Screenshot Artifact File:** `projects/14673587965252723053/files/d929eda323434b1d834cdc1afa2d193b`

### Mobile Generation Attempt
- **Call:** `generate_screen_from_text` (deviceType: `MOBILE`, modelId: `GEMINI_3_8_FLASH`)
- **Result:** Timed out at MCP client deadline (180s); per protocol, mobile layouts were verified and refined directly through responsive CSS and CDP viewports.

---

## 3. Structural Layout Rules Adopted

1. **Header & Navigation (Monochrome):**
   - 72px fixed height (`var(--l-header-h)`) with in-flow spacer.
   - Solid `#FFFFFF` on light theme; solid `#0A0A0B` on dark theme.
   - No photographic blur or opacity beneath navigation labels to maintain WCAG AAA text contrast.
   - Zero violet on hover; subtle opacity change (`0.7`) and underline inversion only.

2. **Hero Section:**
   - Always dark surface (`#0A0A0B`) for cinematic live-music immersion across both light and dark site themes.
   - Desktop: right-aligned musician composition with dark left wall providing calm negative space for the headline.
   - Mobile: 4:5 vertical framing with performer in upper 55% and dark audience silhouettes at the base.
   - Primary button: white background / black text (`#FFFFFF` on `#0A0A0B`).
   - Secondary button: outlined white border.

3. **Section Alternation Rhythm:**
   - Hero: Deep Obsidian (`#0A0A0B`)
   - Section 1 (`#discover`): Pure Canvas (`#FFFFFF` in light, `#0A0A0B` in dark)
   - Section 2 (`#for-fans`): Cool Neutral Surface (`#F5F5F7` in light, `#141416` in dark)
   - Section 3 (`#how-it-works`): Pure Canvas
   - Section 4 (`#for-musicians`): Deep Obsidian (`#0A0A0B`)
   - Section 5 (`#build-your-next-chapter`): Cool Neutral Surface
   - Section 6 (`#join`): Pure Canvas
   - Footer: Preserved untouched CbFooter (`#F5F5F7` in light, `#1D1D1F` in dark)

4. **Honesty & Illustrative Previews:**
   - Any static/example UI component (such as the tip confirmation preview in Section 3 and the campaign progress indicator in Section 5) carries an explicit, visible `.previewTag` badge ("Preview").
   - No fabricated distances, counts, or celebrity endorsements.
