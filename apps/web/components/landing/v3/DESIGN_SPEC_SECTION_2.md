# Crowdbeats V2 — UX & Visual Design Specification: Discover Nearby (Section 2)

**Document:** `apps/web/components/landing/v3/DESIGN_SPEC_SECTION_2.md`  
**Status:** Approved Design Specification (Updated: Centered Alignment & Full-Width Map)  
**Design Movement:** Stitch "Sonic Precision" (Cupertino Minimalism, Atmospheric Layering, Controlled Monochrome Restraint, Electric Violet Accents)  
**Target Component:** `apps/web/components/landing/v3/DiscoverSection.tsx` & `discover.module.css`  
**Owner:** UX and Visual Design Agent  

---

## 1. Executive Summary & Design Rationale

### 1.1 Critique of Previous Interface
- **Cramped 50/50 Split:** The original layout squeezed search and cards into a narrow 50% column beside a small 1:1 map, causing visual imbalance and severe empty-state collapse.
- **Off-Center Hierarchy:** Left-aligned titles and sub-headlines created asymmetric tension when viewed above expansive wide elements.
- **75% Map Constraint:** Restricting the interactive map to 75% width created an awkward stepped margin against full-width content widgets below it.

### 1.2 The Refined Centered & Full-Width Architecture
1. **Fully Centered Section Header:** Eyebrow, primary headline (`#discover-title`), and sub-headline lead text are center-aligned (`text-align: center; margin: 0 auto; align-items: center;`) with `text-wrap: balance`.
2. **Prominent Full-Width Interactive Map Canvas:** Expanded from 75% to **100% width** (`width: 100%; max-width: 100%;`) with height `clamp(440px, 50vh, 540px)` on desktop and `clamp(320px, 44vh, 420px)` on mobile, commanding the hero discovery area and matching full-width downstream widgets.
3. **Full-Width Notice Banner:** Matches the 100% map width (`width: 100%; max-width: 100%;`).
4. **Centered Tab Group Headers:** For each tab (Nearest 5, Popular, Campaigns), the `.groupHeader`, `.groupTitle`, status badges, `.groupSubtitle`, and "View all" links are centered (`text-align: center; align-items: center; justify-content: center;`).
5. **Horizontally Centered Card Grids:**
   - **Tab 1 (Top 5 Nearest):** 5-card grid centered horizontally across full width (`margin: 0 auto; justify-content: center;`).
   - **Tab 2 (Popular Musicians):** 3-card grid centered horizontally with optimal reading width (`max-width: 1100px; margin: 0 auto; justify-content: center;`).
   - **Tab 3 (Top Campaigns):** 3-card grid centered horizontally with optimal reading width (`max-width: 1100px; margin: 0 auto; justify-content: center;`).

---

## 2. Layout Structure & Visual Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        • DISCOVER NEARBY (Centered)                    │
│                 Find your next live music moment. (Centered)           │
│     Discover solo musicians and bands nearby—or explore... (Centered)  │
├────────────────────────────────────────────────────────────────────────┤
│         [ 🔍 Search city or neighborhood        [Use my location] ]    │
├────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │                                                                    │ │
│ │                FULL-WIDTH HERO INTERACTIVE MAP (100%)              │ │
│ │          (Desktop: clamp(440px, 50vh, 540px), Mobile: 320-420px)   │ │
│ │               (Radius: 24px, Quiet desaturated palette)            │ │
│ │                                                                    │ │
│ └────────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ [!] No live sets in this radius right now (Full Width Notice: 100%)│ │
│ └────────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│             [ Top 5 Nearest (5) ]  [ Popular (6) ]  [ Campaigns (3) ]  │
├────────────────────────────────────────────────────────────────────────┤
│                     Top 5 nearest musicians (Centered)                 │
│               [ Nearest to San Diego · Within 25 mi ] (Centered)       │
│               Numbered 1–5 matching map pins. (Centered)               │
│                                                                        │
│ ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐         │
│ │ Card 1 │   │ Card 2 │   │ Card 3 │   │ Card 4 │   │ Card 5 │ (5 col) │
│ └────────┘   └────────┘   └────────┘   └────────┘   └────────┘         │
│                       (margin: 0 auto; centered)                       │
├────────────────────────────────────────────────────────────────────────┤
│                       Popular musicians (Centered)                     │
│    Top verified solo artists & bands with active followings (Centered) │
│                          View all → (Centered)                         │
│                                                                        │
│     ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │
│     │ Popular Card 1 │  │ Popular Card 2 │  │ Popular Card 3 │ (3 col) │
│     └────────────────┘  └────────────────┘  └────────────────┘         │
│                 (max-width: 1100px; margin: 0 auto; centered)          │
├────────────────────────────────────────────────────────────────────────┤
│                         Top campaigns (Centered)                       │
│        Support active projects funded by local fans (Centered)         │
│                          View all → (Centered)                         │
│                                                                        │
│     ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │
│     │ CampaignCard 1 │  │ CampaignCard 2 │  │ CampaignCard 3 │ (3 col) │
│     └────────────────┘  └────────────────┘  └────────────────┘         │
│                 (max-width: 1100px; margin: 0 auto; centered)          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Element Specifications & CSS Rules

### 3.1 Section Header Block (Centered)
All header typography in Section 2 is centered:

```css
/* Section 2 Header */
.head {
  max-width: 780px;
  margin: 0 auto clamp(36px, 5vw, 56px);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lead {
  margin-top: 12px;
  text-align: center;
  color: var(--l-ink-2);
  font-size: clamp(17px, 1.5vw, 21px);
  line-height: 1.5;
  text-wrap: pretty;
}
```

- **Eyebrow:**
  - Text: `• DISCOVER NEARBY`
  - Typography: 13px, weight 600, letter-spacing `0.08em`, uppercase, `--l-ink-3`.
  - Violet indicator: 6px circle, `--l-violet`.
  - Alignment: Centered via flex container (`align-items: center; justify-content: center;`).
- **Headline (h2):**
  - Text: `"Find your next live music moment."`
  - Typography: `clamp(32px, 4.4vw, 56px)`, line-height `1.06`, weight 700, letter-spacing `-0.03em`.
  - Alignment: `text-align: center; text-wrap: balance;`.
- **Supporting Lead:**
  - Text: `"Discover solo musicians and bands nearby—or explore somewhere new."`
  - Alignment: `text-align: center; max-width: 720px;`.

---

### 3.2 Full-Width Hero Interactive Map (100% Width)
The map expands to 100% width of the section container to provide full immersion:

```css
/* 100% Full-Width Map Canvas */
.mapPanel34 {
  width: 100%;
  max-width: 100%;
  margin: 0 auto clamp(24px, 3.5vw, 36px);
  height: clamp(440px, 50vh, 540px);
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid var(--l-line);
  background: var(--l-canvas-alt);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  position: relative;
}

@media (max-width: 959px) {
  .mapPanel34 {
    width: 100%;
    max-width: 100%;
    height: clamp(320px, 44vh, 420px);
    border-radius: 20px;
    margin-bottom: 24px;
  }
}

/* Full-Width Notice Banner */
.noticeBannerWrapper {
  width: 100%;
  max-width: 100%;
  margin: 0 auto clamp(20px, 3vw, 28px);
  box-sizing: border-box;
}

@media (max-width: 959px) {
  .noticeBannerWrapper {
    width: 100%;
    max-width: 100%;
    padding: 0;
  }
}
```

---

### 3.3 Centered Tab Group Headers
In each of the 3 tabs, the group title block, badge, subtitle, and link are centered:

```css
/* Group Header (Tabs 1, 2, 3) */
.groupHeader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  margin: 0 auto clamp(16px, 2.5vw, 24px);
  width: 100%;
}

.groupTitleBlock {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 6px;
  width: 100%;
}

.groupTitleRow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  width: 100%;
}

.groupTitle {
  font-size: clamp(18px, 2vw, 22px);
  font-weight: 700;
  color: var(--l-ink);
  margin: 0;
  letter-spacing: -0.015em;
  text-align: center;
}

.groupSubtitle {
  font-size: 14px;
  color: var(--l-ink-3);
  margin: 0;
  line-height: 1.45;
  text-align: center;
  max-width: 600px;
}

.groupBadge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--l-canvas-alt);
  color: var(--l-ink-2);
  font-size: 11px;
  font-weight: 600;
  border: 1px solid var(--l-line);
  white-space: nowrap;
}

.groupLink {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--l-violet);
  text-decoration: none;
  white-space: nowrap;
  margin-top: 2px;
  transition: color 140ms ease, opacity 140ms ease;
}

.groupLink:hover {
  text-decoration: underline;
  opacity: 0.88;
}
```

---

### 3.4 Centered Card Grids for Each Tab

#### Tab 1: Top 5 Nearest Musicians (`.gridNearest5`)
- Full container width (`100%`), centered items:

```css
.gridNearest5 {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  list-style: none;
  margin: 0 auto;
  padding: 0;
  width: 100%;
  max-width: 100%;
  justify-content: center;
  box-sizing: border-box;
}

@media (max-width: 1200px) {
  .gridNearest5 {
    grid-template-columns: repeat(3, 1fr);
    max-width: 960px;
  }
}

@media (max-width: 768px) {
  .gridNearest5 {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 14px;
    padding-bottom: 12px;
    padding-inline: 4px;
    margin: 0 auto;
    -webkit-overflow-scrolling: touch;
    justify-content: flex-start;
  }
  .gridNearest5 > li {
    flex: 0 0 280px;
    max-width: 320px;
    scroll-snap-align: start;
  }
}
```

#### Tab 2: Popular Musicians (`.gridPopularFull`)
- 3-column grid centered horizontally within `max-width: 1100px`:

```css
.gridPopularFull {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  list-style: none;
  margin: 0 auto;
  padding: 0;
  width: 100%;
  max-width: 1100px;
  justify-content: center;
  box-sizing: border-box;
}

@media (max-width: 960px) {
  .gridPopularFull {
    grid-template-columns: repeat(2, 1fr);
    max-width: 720px;
  }
}

@media (max-width: 640px) {
  .gridPopularFull {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 14px;
    padding-bottom: 12px;
    padding-inline: 4px;
    margin: 0 auto;
    -webkit-overflow-scrolling: touch;
    justify-content: flex-start;
  }
  .gridPopularFull > li {
    flex: 0 0 280px;
    max-width: 320px;
    scroll-snap-align: start;
  }
}
```

#### Tab 3: Top Campaigns (`.gridCampaignsFull`)
- 3-column grid centered horizontally within `max-width: 1100px`:

```css
.gridCampaignsFull {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  list-style: none;
  margin: 0 auto;
  padding: 0;
  width: 100%;
  max-width: 1100px;
  justify-content: center;
  box-sizing: border-box;
}

@media (max-width: 960px) {
  .gridCampaignsFull {
    grid-template-columns: repeat(2, 1fr);
    max-width: 720px;
  }
}

@media (max-width: 640px) {
  .gridCampaignsFull {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 14px;
    padding-bottom: 12px;
    padding-inline: 4px;
    margin: 0 auto;
    -webkit-overflow-scrolling: touch;
    justify-content: flex-start;
  }
  .gridCampaignsFull > li {
    flex: 0 0 280px;
    max-width: 320px;
    scroll-snap-align: start;
  }
}
```

---

## 4. Summary of Changes for Engineering

| Component / Selector | Previous Value | New Value | Rationale |
|---|---|---|---|
| `.head` | Left-aligned, `max-width: 760px` | `text-align: center; margin: 0 auto; display: flex; flex-direction: column; align-items: center; max-width: 780px` | Creates symmetric, balanced Apple-style hero section entrance |
| `#discover-title` & `.lead` | Left-aligned | `text-align: center; text-wrap: balance` | Perfect alignment with centered search bar and hero map |
| `.mapPanel34` | `width: 75%; max-width: 1080px; height: clamp(400px, 48vh, 520px)` | `width: 100%; max-width: 100%; height: clamp(440px, 50vh, 540px)` | Map commands the section prominently and aligns with 100% width tabs |
| `.noticeBannerWrapper` | `width: 75%; max-width: 1080px` | `width: 100%; max-width: 100%` | Eliminates margin step-downs, aligning edge-to-edge with the map |
| `.groupHeader` (all tabs) | `justify-content: space-between; align-items: flex-end` | `flex-direction: column; align-items: center; justify-content: center; text-align: center; margin: 0 auto` | Centers tab titles, subtitles, live badges, and "View all" links |
| `.gridNearest5` | `width: 100%` (uncentered margin) | `width: 100%; max-width: 100%; margin: 0 auto; justify-content: center` | Perfectly centers the 5-card row |
| `.gridPopularFull` & `.gridCampaignsFull` | `width: 100%` (unbounded grid) | `max-width: 1100px; margin: 0 auto; justify-content: center` | Centered 3-column layout with optimal card dimensions and typography legibility |
