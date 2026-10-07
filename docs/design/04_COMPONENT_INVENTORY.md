# 04 — Component Inventory
**Phase:** 4 — Design Foundation
**Date:** 2026-08-25

---

## Component Matrix

| Component | Flutter File | Next.js File | Touch/Click Target | ARIA Semantics | No Color-Only | Keyboard | Reduced Motion |
|---|---|---|---|---|---|---|---|
| **CbButton** | `cb_button.dart` | `Button.tsx` | 48dp / 44px ✅ | `role=button`, `aria-disabled`, `aria-busy` ✅ | ✅ (label always present) | ✅ | ✅ |
| **CbInput** | `cb_components.dart` | `Input.tsx` | 52dp / 52px ✅ | `aria-describedby`, `aria-invalid` ✅ | ✅ (error icon + text) | ✅ | N/A |
| **CbCard** | `cb_components.dart` | `Components.tsx` | 48dp if interactive | `role=button` when interactive ✅ | ✅ | ✅ | ✅ |
| **CbAvatar** | `cb_components.dart` | `Components.tsx` | N/A (display) | `role=img`, `aria-label` ✅ | ✅ | N/A | N/A |
| **CbStatusBadge** | `cb_components.dart` | `Components.tsx` | N/A (display) | `aria-label` with status+text ✅ | ✅ (icon + text always) | N/A | N/A |
| **CbSkeleton** | `cb_components.dart` | `Components.tsx` | N/A | `role=status`, `aria-busy=true`, `aria-label` ✅ | N/A | N/A | ✅ (static when disabled) |
| **CbToast / CbToastProvider** | `CbToast.show()` | `Components.tsx` | Close: 44px ✅ | `aria-live=polite`, `role=status` ✅ | ✅ (icon + text) | ✅ | ✅ |
| **CbBanner** | — (web-only) | `Components.tsx` | 44px action ✅ | `role=alert` ✅ | ✅ (icon + text) | ✅ | N/A |
| **CbModal** | Native dialog | `Components.tsx` | 44px close ✅ | `role=dialog`, `aria-modal`, `aria-labelledby` ✅ | N/A | ✅ (Escape close) | ✅ |
| **CbDrawer** | — (web-only, Flutter uses BottomSheet) | `Components.tsx` | 44px close ✅ | `role=dialog`, `aria-modal`, `aria-hidden` ✅ | N/A | ✅ (Escape close) | ✅ |
| **showCbBottomSheet** | `cb_components.dart` | — | 48dp handle | `isDismissible`, barrier semantic ✅ | N/A | ✅ | ✅ |
| **CbEmptyState** | `cb_components.dart` | `Components.tsx` | 48dp action ✅ | `role=status` ✅ | ✅ | N/A | N/A |
| **CbErrorState** | `cb_components.dart` | `Components.tsx` | 48dp retry ✅ | `role=alert` ✅ | ✅ | N/A | N/A |
| **CbTable** | — (Flutter: custom widget, Phase 5+) | `Components.tsx` | 44px rows ✅ | `caption`, `scope=col`, keyboard row click ✅ | N/A | ✅ | N/A |
| **showCbConfirmationSheet** | `cb_components.dart` | `CbConfirmationModal` | 48dp / 44px ✅ | `role=dialog` ✅ | ✅ (destructive label) | ✅ | ✅ |
| **CbAmountSelector** | `cb_components.dart` | `Components.tsx` | 48dp chips ✅ | `aria-pressed`, `aria-label`, `aria-invalid` ✅ | ✅ | ✅ | N/A |
| **CbProgressBar** | `cb_components.dart` | `Components.tsx` | N/A | `role=progressbar`, `aria-valuenow/min/max` ✅ | ✅ | N/A | ✅ |
| **CbMiniChart** | `cb_components.dart` | `Components.tsx` | N/A | `role=img`, `aria-label` with value descriptions ✅ | ✅ (labels on each bar) | N/A | N/A |
| **CbLiveStageChip** | `cb_components.dart` | `Components.tsx` | 48dp ✅ | `aria-label` with live status ✅ | ✅ (LIVE text + dot) | ✅ | ✅ (pulse stops) |
| **CbBottomNav (web) / NavigationBar (Flutter)** | `NavigationBar` | `Components.tsx` | 56dp ✅ | `role=navigation`, `aria-current=page` ✅ | ✅ (label always) | ✅ | N/A |

---

## Component Variants

### CbButton
| Variant | Primary | Secondary | Ghost | Destructive |
|---|---|---|---|---|
| bg | `accent-primary` (#FF97BA) | transparent | transparent | transparent |
| text | `text-on-primary` (#131315) | `accent-primary` | `accent-secondary` | `status-error` |
| border | none | accent-primary | none | status-error |
| contrast | 5.2:1 ✅ | 5.2:1 ✅ | 4.8:1 ✅ | 5.1:1 ✅ |

Sizes: sm=48dp/36px, md=56dp/44px, lg=64dp/56px

### CbAvatar
Sizes: xs=24, sm=32, md=40, lg=48, xl=64, 2xl=96 (dp/px)
Live ring: pink border + glow

### CbStatusBadge (no color-only)
| Status | Icon | Color | Label required |
|---|---|---|---|
| success | ✓ | green-400 | ✅ |
| warning | ⚠ | amber-400 | ✅ |
| error | ✕ | red-400 | ✅ |
| info | i | blue-400 | ✅ |
| live | ● | pink-400 | ✅ |
| neutral | ○ | gray-400 | ✅ |

---

## Files

| File | Location | Purpose |
|---|---|---|
| `tokens.ts` | `packages/design-tokens/src/` | TypeScript token source |
| `tokens.css` | `packages/design-tokens/src/` | CSS custom properties |
| `Button.tsx` | `apps/web/components/ui/` | Web button |
| `Button.module.css` | `apps/web/components/ui/` | Button CSS module |
| `Input.tsx` | `apps/web/components/ui/` | Web input |
| `Input.module.css` | `apps/web/components/ui/` | Input CSS module |
| `Components.tsx` | `apps/web/components/ui/` | All other web components |
| `components.css` | `apps/web/app/` | Global component styles |
| `tokens.css` | `apps/web/app/` | Design tokens (copy) |
| `gallery/page.tsx` | `apps/web/app/` | Web component gallery |
| `cb_colors.dart` | `apps/mobile/lib/ui/theme/` | Flutter color tokens |
| `cb_spacing.dart` | `apps/mobile/lib/ui/theme/` | Flutter spacing + motion |
| `cb_theme.dart` | `apps/mobile/lib/ui/theme/` | Flutter ThemeData |
| `cb_button.dart` | `apps/mobile/lib/ui/components/` | Flutter button |
| `cb_components.dart` | `apps/mobile/lib/ui/components/` | All Flutter components |
| `gallery_page.dart` | `apps/mobile/lib/ui/gallery/` | Flutter gallery screen |
