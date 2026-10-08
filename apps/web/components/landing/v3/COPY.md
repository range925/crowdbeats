# Crowdbeats Landing v3 — Final Copy Deck

Owner: Narrative/UX agent. Source of truth for all visible strings in `components/landing/v3/*`.
CTA labels/destinations follow FOUNDATION §4 exactly. Facts never exceed FOUNDATION §5 (see Honesty audit at the end).
Typography: use real curly quotes/apostrophes (’ “ ”) and an em dash (—) where shown.

---

## Header (`#cb-header`)

| Element | Copy |
|---|---|
| Logo link aria-label | `Crowdbeats home` |
| Nav: Discover | `Discover` |
| Nav: For Fans | `For Fans` |
| Nav: For Musicians (label + toggle) | `For Musicians` · toggle aria-label: `Show musician options` |
| Dropdown item 1 | **Solo musicians** — `Your profile, QR tips, payouts` |
| Dropdown item 2 | **Bands** — `One identity for your band` |
| Nav: How It Works | `How It Works` |
| Sign In | `Sign In` |
| Primary | `Join Crowdbeats` |
| Mobile menu button | open: `Open menu` · close: `Close menu` |
| Mobile drawer heading (visually hidden) | `Site navigation` |
| Skip link | `Skip to main content` |

---

## Role chooser dialog (`RoleChooser`)

| Element | Copy |
|---|---|
| Title (default) | `How do you want to join?` |
| Title (`filter="musician"`) | `How do you perform?` |
| Subtitle (default) | `Joining is free. You’ll confirm your role on the next step.` |
| Subtitle (musician) | `Joining is free. Choose the profile that fits how you play.` |
| Card — Fan | **Fan** — `Discover live music nearby, follow performers, and tip the moments you love.` |
| Card — Solo musician | **Solo musician** — `Create your artist profile, share your QR at shows, and receive tips.` |
| Card — Band | **Band** — `Give your band one shared profile, with tools for members and splits.` |
| Secondary line (default only) | `Joining as a sponsor or venue?` → links `Sponsor` (`signupHref('sponsor')`) · `Venue` (`signupHref('venue')`) |
| Close button aria-label | `Close` |
| Card aria hint (sr-only) | `Continues to sign up` |

---

## Hero (`#top`)

- **Eyebrow:** `Live music near you`
- **Headline (h1):** `Discover live music near you.`
- **Supporting:** `Find solo musicians and bands nearby—or explore music around the world.`
- **Primary CTA:** `Discover live music` → `#discover`
- **Secondary CTA:** `Join as a musician` → RoleChooser (musician)
- **Reassurance (meta):** `Browse freely without an account. Discover performers on the map, or scan a performer’s QR code to tip directly.`

---

## 1 · Discover (`#discover`)

- **Eyebrow:** `Discover nearby`
- **Headline (h2):** `Your next great live moment could be around the corner.`
- **Supporting:** `See which solo musicians and bands are live near you right now, check where they’re playing, and choose who to support. No account needed to look.`
- **Privacy line (meta, under controls):** `We only ask for your location when you tap “Use my location.” You can search by city instead.`

### Controls
| Element | Copy |
|---|---|
| City input label | `City or area` |
| City placeholder | `e.g. Austin, TX` |
| Submit (primary CTA) | `Explore nearby music` |
| Geolocation button | `Use my location` |
| Loading | `Looking for live performers near you…` |
| Locating (after GPS tap) | `Getting your location…` |
| Results heading | `Live near {place}` (fallback: `Live near you`) |
| Results count (sr-only/meta) | `{n} performer(s) live now` — only real count from query |
| Result card CTA | `View profile` (→ `/artist/{slug}` or `/band/{slug}`) |
| Result card badge | `Live now` (only for `isLive==true` docs) |
| Band/solo tag | `Band` / `Solo` |

### Empty & error states
| State | Copy |
|---|---|
| Idle (before search) | `Enter a city or use your location to see who’s playing live.` |
| No results | **No one’s live here right now.** `Performers appear when they check in. Try a nearby city, or join as a fan to follow artists and catch their next set.` + link `Join as a fan` (`signupHref('fan')`) |
| Location denied | **Location is turned off.** `No problem — type a city above to search instead.` |
| Location unavailable / timeout | **We couldn’t get your location.** `Try again, or search by city.` |
| Geocode failed | **We couldn’t find that place.** `Check the spelling or try a nearby larger city.` |
| Data unavailable | **Live results aren’t loading right now.** `Please try again in a moment.` + button `Try again` |

### Illustrative preview (if shown before a search)
- **Tag (visible on every illustrative card/map):** `Preview`
- **Caption (meta):** `Example layout. Live results appear after you search.`
- Illustrative cards must not show real names, distances or audience counts (use “Solo artist” / “Band” / “Venue name”).

---

## 2 · For Fans (`#for-fans`)

- **Eyebrow:** `For fans`
- **Headline:** `Be more than someone in the crowd.`
- **Supporting:** `Follow the artists who move you, show your support, and keep discovering what they do next.`

| Benefit | Body |
|---|---|
| **Find your favorites** | `Follow the performers you love so they’re easy to find again — at the next show or on their profile.` |
| **Make your support personal** | `Send a tip from $1 and add a short note of up to 200 characters. You review the amount before you confirm.` |
| **Stay connected** | `Keep up with updates and campaigns from the artists you follow, and help fund what they’re working on next.` |

- **CTA:** `Join as a fan` → `signupHref('fan')`
- **Meta:** `Browsing is open to everyone. Following and tipping need a free account.`
- **Product preview tag (if mini UI):** `Preview`

---

## 3 · How it works (`#how-it-works`)

- **Eyebrow:** `How it works`
- **Headline:** `A few simple steps. A real connection.`
- **Supporting:** `Whether you’re in the crowd or on stage, here’s how support gets from one to the other.`
- **Group labels / tab labels:** `Fans` · `Solo musicians & bands` (tablist aria-label: `Show steps for`)

### Fans
1. **Discover on the map** — `Browse nearby solo musicians and bands or explore cities worldwide.`
2. **Choose a performer to tip** — `Select a performer from the map or scan their personal QR code.`
3. **Confirm and send support** — `Sign in when ready to confirm your tip directly to the performer.`

### Solo musicians and bands
1. **Create your profile & payout setup** — `Set up your Solo Musician or Band profile and connect payouts through Stripe.`
2. **Go live & share your QR** — `Go live, share your performance location, and help nearby fans discover you. Share your QR code so fans can open your tipping page directly.`
3. **Receive tips and cash out** — `Follow tips as they arrive from nearby map discovery and QR scans, and cash out once eligible.`

- **CTAs:** `Start discovering` → `#discover` · `Create an artist profile` → RoleChooser (musician)
- **Meta:** `Artist verification is required before receiving tips and isn’t instant. Cash-out timing depends on your account and Stripe payout status.`

---

## 4 · For Musicians (`#for-musicians`)

- **Eyebrow:** `For musicians`
- **Headline:** `Bring your music. Build what comes next.`
- **Supporting:** `Crowdbeats puts solo musicians and bands on the map for nearby fans to discover, with direct QR tipping shortcuts that turn live moments into lasting support.`

**Why join (3 short points):**
| Title | Body |
|---|---|
| **Live map discovery** | `Go live at your performance location so nearby fans discover your set in real time.` |
| **Direct QR tipping** | `Display your personal or band QR code on stage as an instant shortcut for fans to open your tipping page.` |
| **Lasting connection** | `Turn live listeners into long-term followers across every city and venue you play.` |

### Solo musicians (`#solo-musicians`)
- **Eyebrow:** `For solo performers`
- **Heading (h3):** `Solo musicians`
- **Body:** `A dedicated artist profile that travels with you—from busking on the street to headlining the main stage.`
- Bullets:
  - **Live map discovery** — `Appear in real time on the live geolocation map when you perform`
  - **Direct QR tipping** — `Personal QR code for an instant, direct tipping shortcut`
  - **Searchable profile** — `Public performer profile fans can discover, follow, and support worldwide`
  - **Earnings visibility** — `Transparent, real-time visibility into all incoming tips`
  - **Stripe payouts** — `Direct payouts to your bank account via Stripe once eligible`
- **CTA:** `Join as a solo musician` → `signupHref('solo')`

### Bands (`#bands`)
- **Eyebrow:** `For groups & ensembles`
- **Heading (h3):** `Bands`
- **Body:** `Show up as one united act. Pin your band on the map, coordinate members, and split support transparently.`
- Bullets:
  - **Live map discovery** — `Band discovery on the live map whenever you perform together`
  - **Direct QR tipping** — `Shared band QR code for direct on-stage tipping from the crowd`
  - **Unified band identity** — `Single verified band identity with member roster coordination`
  - **Tip splitting** — `Built-in tip splitting tools configured across your entire lineup`
  - **Stripe payouts** — `Connected Stripe payouts with clear group earnings accounting`
- **CTA:** `Create your band profile` → `signupHref('band')`

- **Meta (section foot):** `Joining is free. Verification and payout setup are required before you can receive tips, and support from fans varies from performance to performance.`

---

## 5 · Build your next chapter (`#build-your-next-chapter`)

- **Eyebrow:** `Beyond one show`
- **Headline:** `One performance can be the start of something bigger.`
- **Supporting:** `Crowdbeats keeps the connection going after the encore, with tools that help fans and artists build something together.`

| Panel | Title | Body |
|---|---|---|
| Main (image) | **Campaigns** | `Set a specific creative goal — a recording, a tour, new gear — and let fans help fund it.` |
| Small 1 | **Following and updates** | `Post updates so the people who follow you know what’s next.` |
| Small 2 | **QR support** | `A simple path from a live moment to your profile and a tip.` |

- **Illustrative campaign UI tag:** `Preview` · caption `Example campaign. Not real funding data.`
- **CTA:** `Start your artist profile` → RoleChooser (musician)
- **Meta:** `Campaign tools are available after you create an artist or band profile.`

---

## 6 · Join (`#join`)

- **Eyebrow:** `Join Crowdbeats`
- **Headline:** `Great music starts with people showing up.`
- **Supporting:** `Find a live moment to love — or bring your own music to the community.`
- **Choice A:** title `For listeners` · body `Explore who’s playing near you.` · CTA `Discover music` → `#discover`
- **Choice B:** title `For performers` · body `Solo or band, set up your free profile.` · CTA `Join as a musician` → RoleChooser (musician)

### Trust / pricing row
| Item | Title | Body |
|---|---|---|
| 1 | **Free to join** | `Fans and musicians create accounts at no cost.` |
| 2 | **Payments by Stripe** | `Tips and payouts are processed through Stripe.` |
| 3 | **Review before you pay** | `See your tip amount before you confirm.` |
| 4 | **Reporting and support** | `Report a problem or contact our support team.` |

- **Fee sentence:** `A 6% platform fee is deducted from each tip. Stripe processing fees also apply.`
- **Links:** `How fees work` → `/legal/creator-monetization` · `Refunds & disputes` → `/legal/refunds` · `Report a problem` → `/legal/report-abuse`

---

## Image alt text

| Slot | Alt |
|---|---|
| Hero desktop | `A singer with an acoustic guitar performs on a small, warmly lit stage while an audience listens close by.` |
| Hero mobile | `A guitarist sings under warm stage lights, with audience members watching in the foreground.` |
| Fans | `Smiling audience members near the stage, one holding up a phone to support the performer.` |
| Solo | `A solo musician plays guitar and sings into a microphone in an intimate venue.` |
| Band | `A four-piece band performs together on stage with guitar, bass, drums and vocals.` |
| Chapter | `A musician in a rehearsal space, recording with headphones on and an instrument in hand.` |

(If the final images differ — instrument, group size, setting — Image agent should adjust nouns only, keeping: adult, no names, no brand/celebrity references. Purely decorative overlays use `alt=""`.)

---

## Honesty audit

| Claim (where used) | Source / verification |
|---|---|
| Joining is free (role chooser, #join, musicians meta) | FOUNDATION §5 — auth page "100% Free Platform Model for Musicians and Fans" |
| 6% platform fee deducted from each tip; Stripe fees also apply (how-it-works meta, #join) | `apps/functions/src/tip/createTipIntent.ts` `PLATFORM_FEE_BPS = 600`, `netAmount = amount − platformFee`; server disclosure. Payer of Stripe fees intentionally unstated |
| Payments/payouts processed by Stripe | FOUNDATION §5 (PaymentIntents + Connect) |
| Tip $1–$500 (fans, how-it-works) | FOUNDATION §5 |
| Note up to 200 characters | `createTipIntent.ts` L32 `TIP_MESSAGE_MAX = 200`; test `rejects message over 200 characters` |
| Review amount before confirming | FOUNDATION brief/§5 trust item ("clear payment review"); confirm step in tip flow — lead to confirm UI shows amount before pay |
| Verification required, not instant | FOUNDATION §5 `assertCreatorMayMonetize` |
| Payout timing depends on account/Stripe status | FOUNDATION §5 + brief §3; `/creator/payouts`, `/band/payouts` routes exist |
| Earnings visibility | `app/(creator)/creator/analytics`, `app/(band)/band/analytics`, `band/splits` reference earnings |
| Live discovery / check-in, "Live now" | FOUNDATION §5 `checkins` `isLive==true && visibility=='public'`; "go live" in `creator/dashboard`, `band/performances` |
| QR codes for performers | "qr" in `app/(creator)/creator/dashboard`, `creator/marketing`, `band/dashboard`, `band/marketing` |
| Follow performers | FOUNDATION §5 `followEntity` (`apps/functions/src/index.ts`) |
| Updates from artists | `app/(creator)/creator/updates/page.tsx` exists |
| Campaigns (fans help fund) | FOUNDATION §5 `/creator/campaigns`, `/band/campaigns` (auth-gated) |
| Band members / splits | `app/(band)/band/members`, `band/splits` |
| Reporting & support | `/legal/report-abuse`, `/support`, `/legal/refunds` (FOUNDATION §5) |
| Location only on tap | FOUNDATION §5 `requestBrowserGeolocation()` on click; §7 |
| No account needed to browse discovery | FOUNDATION §4/§5 — in-section search uses public-read `checkins` |
| Not claimed | stats, testimonials, ratings, press, "100% safe", instant payouts/verification, income/exposure, who pays Stripe fees |
