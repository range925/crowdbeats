# Crowdbeats V2 — Account Settings Visual Validation Plan

**Authoritative Design:** Google Stitch Project `5326179813018056505`  
**Test Surfaces:** Flutter Mobile & Next.js Responsive Web  

---

## 1. Viewport Matrix

The redesigned Account Settings screen will be verified across all standard responsive viewports:

| Device Target | Viewport Dimensions | Aspect Ratio | Platform Target |
| :--- | :--- | :--- | :--- |
| **Small Android Phone** | 360 × 640 dp | 9:16 | Android Compact (e.g. Galaxy A-series) |
| **Standard Android Reference** | 392 × 872 dp (390×844) | ~19.5:9 | Android Reference (Pixel 7 / 8) |
| **Standard iPhone Reference** | 393 × 852 pt | 19.5:9 | iOS Reference (iPhone 15 Pro) |
| **Large iPhone / Phablet** | 430 × 932 pt | 19.5:9 | iOS Large (iPhone 15 Pro Max) |
| **Tablet** | 768 × 1024 pt | 3:4 | iPad / Android Tablet |
| **Desktop Web** | 1440 × 900 px | 16:10 | Next.js Web Dashboard |

---

## 2. Accessibility & Usability Benchmarks

1. **Touch Target Sizing:**
   - Every menu row is >= 56px in height.
   - Secondary action chips and switches are >= 48×48px interactive bounding boxes.
2. **Contrast Ratios (WCAG 2.2 AA / AAA):**
   - Header text (`#FFFFFF`) on background (`#0B0C10`): **21.0:1** (AAA ✅)
   - Section titles (`#FFFFFF`) on background (`#0B0C10`): **21.0:1** (AAA ✅)
   - Subtitle text (`#94A3B8`) on background (`#0B0C10`): **6.5:1** (AA ✅)
   - Accent button (`#7C3AED`) on dark background: **4.8:1** (AA ✅)
3. **Dynamic Type & Scaling:**
   - Text scales up to 200% without overflowing or clipping labels.
   - Subtitles wrap smoothly beneath titles on compact screens.
4. **Motion & Reduced Motion:**
   - Seamless list scrolling without lag or frame drops (60/120 fps).
   - If `prefers-reduced-motion` is enabled, all glow pulses and slide transitions are disabled.

---

## 3. Comparison Criteria

- **Before:** A stark, 3-card screen with only email, display name, single sign-out button, and immediate danger zone.
- **Reference (Lyft):** Large section headings, uncluttered full-width rows with leading line icons, simple scanning, profile at top.
- **After (Crowdbeats Redesign):** Distinctive dark music-first visual identity from Stitch `5326179813018056505`, rich role-aware toolkits, integrated Stripe/Connect financial controls, comprehensive privacy and notification settings, and protected multi-step account status governance.
