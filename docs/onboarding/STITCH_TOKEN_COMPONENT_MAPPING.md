# Crowdbeats V2 — Stitch Token & Component Mapping

**Authoritative Stitch Reference:** https://stitch.withgoogle.com/projects/5326179813018056505  

---

## 1. Color Tokens

| Semantic Role | CSS Variable | Flutter `CbColors` | Hex Code | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Surface Base** | `var(--surface-base)` | `CbColors.bgApp` | `#0A0B10` | Dark background canvas |
| **Surface Card** | `var(--surface-card)` | `CbColors.surface1` | `#12141D` | Choice cards, form containers |
| **Surface Raised** | `var(--surface-raised)` | `CbColors.surface2` | `#1A1D2A` | Input fields, active chips |
| **Accent Primary** | `var(--accent-primary)` | `CbColors.purpleMain` | `#7C3AED` | Primary CTAs, active selections |
| **Accent Glow** | `var(--accent-secondary)` | `CbColors.purpleLight` | `#A78BFA` | Radio buttons, step indicators |
| **Text Primary** | `var(--text-primary)` | `CbColors.textPrimary` | `#FFFFFF` | High-contrast headings |
| **Text Secondary** | `var(--text-secondary)` | `CbColors.textSecondary` | `#94A3B8` | Supporting text & descriptions |
| **Border Subtle** | `var(--border-subtle)` | `CbColors.borderSubtle` | `#2B2D44` | Card borders & input outlines |

---

## 2. Component Hierarchy

1. **`UniversalOnboardingWizard`**: Root adaptive container with responsive max-width (`680px`), linear progress bar, and Step X of Y header.
2. **`_buildConsentCard`**: Standardized accessible checkbox component with clear title, description, and optional tags.
3. **`_buildProviderButton`**: High-contrast OAuth button with native Apple/Google iconography.
4. **`_buildReviewRow`**: Compact two-column data review widget with inline Edit actions.
