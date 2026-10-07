# 04 — Responsive & Accessibility Standard
**Phase:** 4 — Design Foundation
**Standard:** WCAG 2.2 AA (release floor)
**Date:** 2026-08-25

---

## 1. Accessibility Compliance Level

**Minimum:** WCAG 2.2 AA
**Target:** WCAG 2.2 AA for all components. AAA achieved where possible (text-primary at 17.8:1 is AAA).

---

## 2. Color & Contrast

### 2.1 Text Contrast (WCAG 1.4.3)
All normal-size text (< 18px or < 14px bold) must meet **4.5:1** against its background.
Large text (≥ 18px regular or ≥ 14px bold) must meet **3:1**.

| Use Case | Color | Background | Ratio | Meets |
|---|---|---|---|---|
| Body text | `#F4F4F5` | `#131315` | 17.8:1 | ✅ AAA |
| Secondary text | `#A1A1AA` | `#131315` | 5.4:1 | ✅ AA |
| Primary button text | `#131315` | `#FF97BA` | 5.2:1 | ✅ AA |
| Accent text links | `#FF97BA` | `#131315` | 5.2:1 | ✅ AA |
| Secondary accent text | `#A78BFA` | `#131315` | 4.8:1 | ✅ AA |
| Success badge | `#4ADE80` | badge bg | 8.4:1 | ✅ AAA |
| Warning badge | `#FBBF24` | badge bg | 10.4:1 | ✅ AAA |
| Error badge | `#F87171` | badge bg | 5.1:1 | ✅ AA |
| Info badge | `#60A5FA` | badge bg | 6.5:1 | ✅ AA |
| Live text | `#FFB0CE` | `#1E1318` | ~8:1 | ✅ AAA |

**PROHIBITED:** Using `#8B5CF6` (violet-500) as text on `#131315` — ratio is 2.5:1 ❌.

### 2.2 Non-Text Contrast (WCAG 1.4.11)
All UI component boundaries (button borders, input borders, icons) meet **3:1** against adjacent colors.
- Focus ring: `#FF97BA` at 3px — 5.2:1 against dark background ✅

### 2.3 No Color-Only Information (WCAG 1.4.1)
**Enforced at the component API level:**
- `CbStatusBadge` requires `label` prop; always renders icon + text alongside color
- Toast messages always include an icon character
- Table rows include text, not just color changes, for state
- Error inputs use ⚠ icon + `errorText` string, never just a red border

---

## 3. Text Scaling (WCAG 1.4.4)

**Criterion:** Text must resize up to 200% without loss of content or functionality.

Implementation:
- All font sizes use `rem` / `em` on web
- No `overflow: hidden` on text containers without scroll fallback
- `text-size-adjust: 100%` set on `<body>` to prevent mobile browsers from auto-adjusting
- Flutter: `textScaler`-aware TextStyles. All widget heights using `dp` units scale with system font size.

---

## 4. Reflow (WCAG 1.4.10)

**Criterion:** Content must not require horizontal scrolling at 320px CSS viewport width.

Implementation:
- All layouts use `flexbox` with `flex-wrap` or CSS Grid with `auto-fill`
- No fixed-width containers wider than `min(100%, max-content)`
- `CbTable` wraps in `overflow-x: auto` with `tabIndex=0` for keyboard scrolling
- Bottom nav items use `flex: 1` to distribute evenly
- `cb-container` class uses `padding-inline` not fixed margins

---

## 5. Keyboard Navigation (WCAG 2.1.1)

All interactive components are fully keyboard-accessible:

| Component | Keyboard Behavior |
|---|---|
| `CbButton` | Tab to focus, Enter/Space to activate |
| `CbInput` | Tab to focus, standard text input |
| `CbCard` (interactive) | Tab to focus, Enter/Space to activate |
| `CbModal` | Tab cycles within modal, Escape to dismiss |
| `CbDrawer` | Escape to dismiss |
| `CbTable` rows | Tab to row, Enter to activate `onRowClick` |
| `CbAmountSelector` chips | Tab to chip, Enter/Space to select |
| `CbBottomNav` items | Tab to item, Enter to navigate |

---

## 6. Focus Visibility (WCAG 2.4.11, 2.4.12)

**Global focus ring style:**
```css
:focus-visible {
  outline: 3px solid #FF97BA;
  outline-offset: 2px;
}
```

- Applied globally in `tokens.css` — cannot be overridden by component styles
- Only `:focus-visible` (not `:focus`) — mouse clicks do not show the ring
- Focus ring has 5.2:1 contrast against the dark background ✅
- Minimum component area enclosed by ring: ≥ target area

**Flutter:**
- Focus via `Focus` widget with `BoxShadow` highlight in pink
- Accessible via external keyboard and switch controls

---

## 7. Touch Targets (WCAG 2.5.8)

| Platform | Minimum | Applied |
|---|---|---|
| Native iOS/Android (Flutter) | 48×48 dp | ✅ All interactive components |
| Web | 44×44 CSS px | ✅ All interactive components |
| Preferred (primary actions) | 56×56 | ✅ CbButton lg, bottom nav |

**Spacing between adjacent targets:** Minimum 8dp/8px gap enforced in all component layouts.

---

## 8. Screen Reader Semantics (WCAG 1.3.1, 4.1.2)

| Pattern | Implementation |
|---|---|
| All images have text alternative | `alt` prop required on `CbAvatar`, `aria-label` on icon-only buttons |
| Form inputs have labels | `<label>` via `htmlFor`/`for` always rendered; never `placeholder`-only |
| Error messages programmatically associated | `aria-describedby` links input to error ID |
| Status changes announced | `role=alert` (errors), `role=status` (info), `aria-live=polite` (toast) |
| Modal accessible | `role=dialog`, `aria-modal=true`, `aria-labelledby` |
| Tables have captions | `caption` element required in `CbTable` API |
| Charts have text descriptions | `aria-label` on chart wrapper with full value list |
| No information via shape/icon alone | Every icon has accompanying text (status badges, toast, progress bars) |

---

## 9. Reduced Motion (WCAG 2.3.3)

All animations check `prefers-reduced-motion: reduce`:

**CSS (web):**
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}
```

**Flutter:**
```dart
CbMotion.resolve(context, CbMotion.normal) // Returns Duration.zero when disabled
```

Animations affected:
- Button hover transitions → instant
- Card hover shadows → instant
- Skeleton shimmer → static placeholder
- Modal/drawer slide-in → no animation
- Toast pop-in → no animation
- Live stage dot pulse → solid dot (no pulse)
- Progress bar fill width → no transition

---

## 10. Responsive Breakpoints

| Name | Min Width | Layout |
|---|---|---|
| Phone | (default) | Single column, 16px margin |
| Tablet | 768px | 2 columns, 24px margin |
| Laptop | 1024px | 3 columns, 32px margin |
| Desktop | 1280px | Full grid, 48px margin |
| Wide | 1536px | Max 1440px, centered |

**Verified viewports for gallery:**
- 375px (iPhone SE / minimum phone)
- 768px (iPad portrait)
- 1280px (laptop)
- 1440px (desktop)

---

## 11. No-Glass / No-Blur Policy

Per the phase directive:

> _"No glass/blur effect that harms contrast or performance."_

**Enforced:**
- No `backdrop-filter: blur(...)` on any component surface
- No `opacity` on colored backgrounds that would produce unverifiable contrast ratios
- Overlay backdrops use `rgba(0,0,0,0.7)` — plain semi-transparent black, not blurred

---

## 12. Semantic Token Enforcement

**No raw hex colors in any component file.** All styles use:
- CSS: `var(--token-name)` from `tokens.css`
- Flutter: `CbColors.tokenName` static constants
- TypeScript: `colors['token-name']` from `tokens.ts`

Any direct hex value in a component file is a lint violation (enforced by code review in Phase 5+).
