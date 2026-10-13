# Reference Interpretation: Keep / Simplify / Replace

Owner: Coordinator (UX input). Phase 1. Images were inspected directly; nothing was measured with a colour picker or font tool.

## Sources and limits

| # | File (user upload) | SHA-256 prefix | Size | Content |
|---|---|---|---|---|
| 1 | `Fan Guest(1).png` | `9A8C8DB6AB77DE01` | 1024×576 | About 19 Crowdbeats mobile frames: Fan/Guest discovery, tipping, activity, onboarding, home |
| 2 | `Band(1).png` | `355EC1F0596F8F4A` | 1024×576 | About 18 frames: Solo/Band setup (mobile and desktop-width wizards), tip, activity, map, home |
| 3 | `uber example(1).png` | `191D7159D815A49E` | 1024×576 | About 17 Android frames. Visibly **Lyft** UI: profile, settings, payment, privacy, account info, home/map |

- The upload folder holds six files, but they are three duplicate pairs (identical hashes). There are three distinct references.
- **Resolution limit:** each phone frame is roughly 60×180 px in the source. I upscaled 3× with bicubic interpolation; the crops are in the agent scratch folder (`scratch/ref/`).
  - Upscaling adds no information.
  - The crops of reference 3 are **not** committed to the repo because they contain personal information.

### Unreadable details (not guessed)
- **All body copy, labels, chip text, form-field values and stat numbers** on every board are unreadable. I am not reproducing any copy from the boards.
- **Exact colours:** I can only describe them qualitatively — "near-black", "saturated violet/purple", "lime/green", "neutral dark grey", "pink accent" (ref 3). I extracted no hex values.
- **Font families and sizes:** unknown. I make relative judgements only, e.g. "large bold page titles".
- **Icon identities:** only broad shapes are visible (home, map pin, bell, person, chevron, toggle).
- **Amount chip values:** look like a "$5 / $10 / $20 / $50 / Other" pattern, but I can't verify the digits. Implementation will use the **code's** presets ($5/$10/$20 plus custom), not the boards.
- **Payment method labels:** one Fan/Band frame shows a three-row radio list whose first-row badge has Apple Pay-like proportions. It can't be read; regardless, Apple Pay is not supported (commit `f6d40b6`).
- **Navigation labels:** visible as five items with a raised center circle. The labels can't be read.

## Keep / Simplify / Replace

| Area | Keep | Simplify | Replace / adopt (from ref 3 patterns) |
|---|---|---|---|
| Brand identity | Approved Crowdbeats logo (OD-L1), concert photography on discovery/profile/hero only, dark near-black surfaces in dark theme | — | Add a matching **neutral light theme** (the boards are dark-only) |
| Colour | A single purple/violet as the action and selection colour | Lime/green limited to *live/success status* (refs 1-2 use it as CTA colour on desktop band wizards) | Neutral greys for surfaces and dividers (ref 3) |
| Navigation | Labelled bottom tabs | Five tabs with a raised center Tip/QR button become **four** stable labelled tabs with no raised center | QR moves to a secondary action in the Discover app bar |
| Discovery | Map plus list pairing, avatar pins, live badge, distance, a Tip action per card | Map/List/Venues segmented control becomes Map/List toggle and filters. Duplicate Home "Good evening" dashboard is merged into Discover. | Clear page heading, one dominant action per card |
| Performer profile / tip | Hero photo, verified badge, follow state, amount chips plus custom, optional message, full-width purple CTA with the amount in its label | QR scan frame decoration over the hero is removed from the tip screen | **Dedicated confirmation screen** with a fee/total breakdown from the server (refs show none). Payment method shown as a grouped list row (ref 3 payment screen). |
| Activity | Filter chips, day grouping (Today/Yesterday/This week), avatar plus action rows, amount trailing | Fewer chip filters, larger secondary text | Grouped rows with subtle dividers |
| Onboarding / profile creation | 4-step progress indicator, avatar upload, "profile created" completion with next steps | **Remove the repeated hero banner** on every step. Replace 3-4-column icon chip grids with a searchable list or 2-column chips. Split dense forms into shorter steps. Move social-connect and notification toggles to settings. | One heading and one primary CTA per step |
| Band setup | Members, socials and media sections | Desktop left-rail wizard becomes mobile single-column steps | Grouped rows for members (role trailing) and links |
| Account / profile | Avatar, name, verified badge, 2-3 stats | Badges row (ref 3) is not adopted unless backed by data | Grouped settings: section headers (Account, Payments, Privacy & safety, Notifications, Accessibility, Support, Legal), each row with leading icon, title, secondary line and chevron or switch. A **Data management** group (download / delete). |
| Payments (fan) | — | — | Payment screen pattern: default method row, then methods list, then "Add payment method" row. **No wallet balance card** (Crowdbeats has no fan wallet). |
| Privacy | — | — | Explanatory paragraph, toggle, "Learn more" link, and a "What performers see" preview (adapted from "What drivers see"; it must reflect coarse location only) |

## Explicitly not reproduced
- Ride features (rides, autonomous vehicles, saved places such as home/work, calendars, driver visibility, Lyft Pink/Cash).
- Lyft/Uber branding, the pink accent, and the badges gamification.
- **Personal information on ref 3** (names, emails, phone numbers, card last-4 digits, avatar photos).
- Apple Pay, "instant payout" or "direct payout dispatched" claims (they appear in landing Stitch marketing assets, not in the boards).

## Design tokens: starting proposals (to validate, NOT extracted)

| Token | Proposal | Existing code |
|---|---|---|
| Horizontal padding | 16 | `CbSpacing.s16` exists |
| Spacing rhythm | 8 | 4-pt scale exists |
| Body text | 16 | to be measured |
| Page title | 24-28 | to be measured |
| Min target | 48 | `touchMin = 48` |
| Radii | 8 / 12 / 16 | `sm8/md12/lg16` |
| Font | Existing Plus Jakarta Sans + JetBrains Mono (numerals) | DM Sans also mixed in; OD-T1 |
