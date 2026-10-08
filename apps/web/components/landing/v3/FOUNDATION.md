# Crowdbeats Landing v3 — Frozen Foundation (Phase B)

Owner: Lead. **Do not change frozen items without the lead.** Agents edit only the files they own.

## 1. Stack & boundaries (verified in code)
- Next.js 16.3.3 App Router + React 19, static export (`apps/web/dist`) — **no Next API routes in production**; use client SDKs only.
- Route `/` → `app/page.tsx` → `components/landing/LandingOrchestrator.tsx` → (new default) `components/landing/v3/LandingV3.tsx`.
- **Footer = `<CbFooter />` from `components/ui/CbFooter.tsx`** — protected, never edited. Self-themes via `useTheme().resolvedTheme`.
- Footer must stay inside the exact legacy wrapper: `<div className="cb-landing-root" style={{ backgroundColor:'#FCF8FB', color:'#1B1B1D', fontFamily:'var(--font-inter, Inter, sans-serif)', minHeight:'100vh', overflowX:'hidden' }}>` (inherited properties identical to before). LandingV3 owns this.
- **No global CSS / tokens.css / globals.css / shared `components/ui/*` edits.** All new styles live in CSS Modules under `components/landing/v3/` (class names are hashed → cannot reach the footer).
- Theme: `<html data-theme="light|dark">` set by ThemeProvider (System resolves to one). In CSS Modules use `:global(html[data-theme='dark']) .x { … }`.

## 2. Section IDs (frozen, in order)
| # | id | Component file | Owner |
|---|----|----------------|-------|
| header | `cb-header` | `v3/LandingHeader.tsx` + `v3/RoleChooser.tsx` | Nav agent |
| hero | `top` | `v3/HeroSection.tsx` | Frontend A |
| 1 | `discover` | `v3/DiscoverSection.tsx` | Frontend A |
| 2 | `for-fans` | `v3/ForFansSection.tsx` | Frontend B |
| 3 | `how-it-works` | `v3/HowItWorksSection.tsx` | Frontend B |
| 4 | `for-musicians` (contains `solo-musicians`, `bands`) | `v3/MusiciansSection.tsx` | Frontend C |
| 5 | `build-your-next-chapter` | `v3/NextChapterSection.tsx` | Frontend C |
| 6 | `join` (contains trust/pricing row) | `v3/JoinSection.tsx` | Frontend C |
| footer | — | `CbFooter` (untouched) | nobody |

Every section root: `<section id="…" className={styles.section} aria-labelledby="…-title">`. Anchor offset: `scroll-margin-top: var(--l-header-h)` (72px) is set on `.section` in `landing.module.css`.

## 3. Shared visual system (`v3/landing.module.css` — lead-owned; import tokens via the `.root` wrapper)
CSS custom properties declared on `.root` (wraps header + 7 sections, NOT the footer):

| Token | Light | Dark |
|---|---|---|
| `--l-canvas` | `#FFFFFF` | `#0A0A0B` |
| `--l-canvas-alt` | `#F5F5F7` | `#141416` |
| `--l-ink` | `#0A0A0B` | `#F5F5F7` |
| `--l-ink-2` (body) | `#3A3A3F` | `#C7C7CC` |
| `--l-ink-3` (meta) | `#6E6E73` | `#8E8E93` |
| `--l-line` | `rgba(0,0,0,0.10)` | `rgba(255,255,255,0.12)` |
| `--l-card` | `#FFFFFF` | `#18181B` |
| `--l-violet` (accent only) | `#6D28D9` | `#A78BFA` |
| `--l-violet-soft` | `rgba(109,40,217,0.08)` | `rgba(167,139,250,0.14)` |
| `--l-btn-bg` / `--l-btn-fg` (primary CTA, monochrome) | `#0A0A0B` / `#FFFFFF` | `#FFFFFF` / `#0A0A0B` |
| `--l-btn2-bg` / `--l-btn2-fg` / `--l-btn2-line` (secondary) | `#FFFFFF` / `#0A0A0B` / `#0A0A0B` | `#0A0A0B` / `#FFFFFF` / `#FFFFFF` |

Always-dark surfaces (hero, `#for-musicians`): use class `.dark` from landing.module.css which re-declares the dark values locally, so buttons invert to white-on-black automatically.

**Type** (one family: system SF/Helvetica stack already used by the app):
- Display: `var(--font-apple-display)`; Body: `var(--font-apple-text)`.
- `.eyebrow` 13px/600, letter-spacing .08em, uppercase, `--l-ink-3` (violet only allowed as a 6px dot before it).
- `.h1` clamp(40px, 6.2vw, 84px)/1.02, weight 700, tracking -0.035em.
- `.h2` clamp(32px, 4.4vw, 56px)/1.06, weight 700, tracking -0.03em.
- `.h3` 22px/1.25 weight 600.  `.lead` clamp(17px,1.5vw,21px)/1.5 `--l-ink-2`. Body min 16px. Meta min 13px.
- Numbers: `font-variant-numeric: tabular-nums`.

**Spacing**: section padding `clamp(80px, 10vw, 140px)` vertical, container `max-width: 1240px; padding-inline: clamp(20px, 4vw, 40px)`. Grid gap 24/32/48. Radius: cards 20px, buttons 999px (pill), inputs 12px, images 24px.

**Buttons** (`.btn`, `.btnSecondary`, `.btnLink` in landing.module.css): height 48 (52 on hero), padding 0 24px, weight 600, 16px. Hover: primary → slight lift + `opacity:.88`; secondary → inverts to primary colors. Focus: `outline: 2px solid var(--l-ink); outline-offset: 3px`. **Never violet.**

**Surface rhythm**: header (white/black) → hero (always dark photo) → #discover (canvas) → #for-fans (canvas-alt) → #how-it-works (canvas) → #for-musicians (always dark) → #build-your-next-chapter (canvas-alt) → #join (canvas) → footer.

Motion: only opacity/transform ≤ 200ms; wrap in `@media (prefers-reduced-motion: no-preference)`. No autoplay, no carousels, no scroll hijack.

## 4. CTA / destination matrix (frozen)
| Location | Label | Destination | Notes |
|---|---|---|---|
| Header | Discover | `#discover` | No guest-public discovery route exists (`/fan/*` requires auth per `proxy.ts`). |
| Header | For Fans | `#for-fans` | |
| Header | For Musicians ▾ | `#for-musicians`; dropdown: Solo musicians → `#solo-musicians`, Bands → `#bands` | Button toggles dropdown; label link navigates |
| Header | How It Works | `#how-it-works` | |
| Header | Sign In | `/auth` | |
| Header | Join Crowdbeats | opens RoleChooser (dialog) | Fan → `signupHref('fan')`; Solo → `signupHref('solo')`; Band → `signupHref('band')`; secondary text link "Joining as a sponsor or venue?" → `signupHref('sponsor')` and `signupHref('venue')` |
| Hero | Discover live music | `#discover` | |
| Hero | Join as a musician | opens RoleChooser with `filter="musician"` (Solo / Band only) | |
| #discover | Explore nearby music | runs the city search / geolocation in-section; when results exist each card links to `/artist/{slug}` or `/band/{slug}` | |
| #for-fans | Join as a fan | `signupHref('fan')` | |
| #how-it-works | Start discovering | `#discover` | |
| #how-it-works | Create an artist profile | opens RoleChooser `filter="musician"` | |
| #solo-musicians | Join as a solo musician | `signupHref('solo')` | |
| #bands | Create your band profile | `signupHref('band')` | |
| #build-your-next-chapter | Start your artist profile | opens RoleChooser `filter="musician"` | `/creator/campaigns` is auth-gated → not publicly supported |
| #join | Discover music | `#discover` | |
| #join | Join as a musician | opens RoleChooser `filter="musician"` | |
| #join trust row | How fees work | `/legal/creator-monetization` | |
| #join trust row | Refunds & disputes | `/legal/refunds` | |
| #join trust row | Report a problem | `/legal/report-abuse` | |

`signupHref(role)` = `/auth?mode=register&intent=<role>` and also persists `localStorage['cb_signup_intent']=<role>` on click (helper `v3/signupIntent.ts`, Nav agent). `/onboarding/persona` preselects the matching persona (fan→`fan`, solo→`artist`, band→`band_member`, sponsor→`sponsor_rep`, venue→`venue_manager`). Role restrictions unchanged: user still confirms on the persona page.

## 5. Verified facts for copy (do not exceed)
- Joining is free (auth page header: "100% Free Platform Model for Musicians and Fans").
- Fees (`apps/functions/src/tip/createTipIntent.ts`): `PLATFORM_FEE_BPS = 600`; `netAmount = amount − platformFee` → **the 6% platform fee is deducted from the tip amount**; server disclosure: "Stripe payment-processing and applicable Stripe Connect fees are additional." Do **not** say who bears Stripe fees.
- Payments via Stripe (PaymentIntents + Connect payouts). Tip min $1, max $500. Tip messages up to 200 chars (moderated).
- Creator monetization requires eligibility (`assertCreatorMayMonetize`) → "verification required; not instant".
- Reporting: `/legal/report-abuse`, support `/support`. Refunds policy `/legal/refunds`.
- Bands: members, splits (`/band/splits`), campaigns (`/band/campaigns`) exist as authenticated tools.
- Following exists (`followEntity`), campaigns exist (`/creator/campaigns`, auth-gated).
- Discovery data: Firestore `checkins` where `isLive==true` and `visibility=='public'` (public read rule). Hooks: `subscribeToNearbyPerformers(lat,lng,radiusMiles,cb,onErr)` in `lib/firebase/firestore.ts`; manual city: `geocodeCityQuery(q)` in `lib/maps/googleMapsLoader.ts`; GPS only on click: `requestBrowserGeolocation()`.

## 6. Imagery (frozen paths, produced by Image agent into `apps/web/public/landing/v3/`)
| Use | Files (webp) | Aspect |
|---|---|---|
| Hero desktop | `hero-desktop-1280.webp`, `hero-desktop-1920.webp`, `hero-desktop-2560.webp` (+ master `hero-desktop-master.png`) | 16:9, subject right-of-center, dark open area left |
| Hero mobile | `hero-mobile-750.webp`, `hero-mobile-1080.webp` | 4:5, subject upper area, dark lower third for text |
| Fans | `fans-800.webp`, `fans-1400.webp` | 4:5 |
| Solo | `solo-800.webp`, `solo-1400.webp` | 4:5 |
| Band | `band-800.webp`, `band-1400.webp` | 4:3 |
| Chapter (campaign main panel) | `chapter-1000.webp`, `chapter-1600.webp` | 3:2 |

Until assets land, components must render with a neutral dark/alt background (no broken-image icon): set `background: var(--l-canvas-alt)` on the image frame.

## 7. Honesty rules
No fake live data, distances, counts, testimonials, ratings, press logos, "100% safe", income/exposure promises, instant verification/payout. Illustrative UI → visible "Preview" tag. Location never requested on load.
