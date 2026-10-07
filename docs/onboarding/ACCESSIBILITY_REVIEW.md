# Crowdbeats V2 — Accessibility (a11y) Review & WCAG 2.2 Compliance

---

## 1. Compliance Checklist

- [x] **Touch Target Sizes:** Minimum 48x48 dp on Android / 44x44 pt on iOS for all choice cards, buttons, and chips.
- [x] **Color Contrast:** All text meets or exceeds WCAG AA standard (>= 4.5:1 for body text, >= 3.0:1 for headings).
- [x] **Keyboard Navigation:** Logical tab order across all steps, visible focus rings with `var(--accent-primary)`.
- [x] **Screen Reader Support:** Semantic ARIA roles (`role="radiogroup"`, `role="radio"`, `aria-checked`, `role="progressbar"`).
- [x] **No Auto-Advancing:** User retains full control of step navigation; transitions never occur without explicit user action.
