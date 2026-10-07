# Authoritative Stitch Screen Inventory — Crowdbeats V2

**Design Authority:** Google Stitch Project `5326179813018056505`  
**Total Authoritative Screens:** 12

---

## Screen 01 — Direct Musician Tipping Flow

- **Stitch ID:** `12401386157321115245`
- **Asset Filename:** `screen_01_onboarding.png`
- **Viewport Dimensions:** 853 × 1844 (Mobile Form Factor)
- **Platforms:** Flutter Mobile (`apps/mobile`), Next.js Modal (`apps/web`)
- **Role:** Fan / Supporter
- **Application Route:** `/tip/[creatorSlug]` (Web) / `TipFlowScreen` (Flutter)
- **User Journey:** Fan selects a musician and initiates an affirmative digital tip with optional note and payment method selection.

### Visual Composition & Layout
1. **Header Bar:**
   - Left chevron back button (`<`)
   - Center title: `Tip`
   - Right circular help icon (`?`)
2. **Performer Spotlight Card:**
   - Background image: Live concert photo with deep purple backlighting
   - Performer Name: `Alex Martin` with verified purple check badge
   - Venue Name: `The Blue Note`
   - Location Pin: `San Diego, CA`
   - Genre Pill Tags: `Rock`, `Acoustic`, `Indie`
   - Status Pill: `💜 Following` (Filled purple heart, pill container)
3. **Tipping Amount Selector:**
   - Heading: "How much would you like to tip?"
   - Subtitle: "Support Alex Martin and keep the music alive."
   - 4-Card Preset Grid:
     - `$5` (Selected: 2px bright purple border `#7C3AED`, purple filled heart icon)
     - `$10` (Unselected: dark `#1E2032` card, hollow heart outline)
     - `$20` (Unselected: dark `#1E2032` card, hollow heart outline)
     - `Custom` (Unselected: dark `#1E2032` card, hollow heart outline)
4. **Community Impact Banner:**
   - Dark container with rounded purple heart icon: "Your tip makes a real difference. Help Alex create more music, tour and reach new fans."
5. **Payment Method Selector:**
   - Header: "Payment Method"
   - Radio List:
     - `Apple Pay` (Brand icon + selected radio indicator)
     - `Google Pay` (Brand icon + unselected radio indicator)
     - `Card` (Credit card icon + unselected radio indicator)
6. **Optional Cheer Message Input:**
   - Input container with speech bubble icon: "Add a quick message (optional)"
7. **Primary Action & Footer:**
   - Vibrant full-width pill button: `💜 Tip Now — $5`
   - Trust/Security caption: `🔒 Secure payment • Powered by Crowdbeats`

---

## Screen 02 — Fan Onboarding: Step 1 (Basic Profile)

- **Stitch ID:** `12401386157321114035`
- **Asset Filename:** `screen_02_map.png`
- **Viewport Dimensions:** 853 × 1844
- **Platforms:** Flutter Mobile & Next.js Web
- **Role:** Fan
- **Application Route:** `/onboarding/fan/step-1`
- **User Journey:** Fan registers their basic profile identity during first sign-in.

### Visual Composition & Layout
1. **Header & Progress:**
   - Back arrow, 4-segment linear progress bar (Step 1 purple, 2-4 gray), step counter label `Step 1 of 4`.
2. **Hero Title & Graphic:**
   - Title: "Create your **Fan** profile" ("Fan" in purple `#8B5CF6`).
   - Subtitle: "Join Crowdbeats and start supporting the music you love."
   - Hero graphic: Concert crowd holding glowing smartphone.
3. **Profile Picture Uploader:**
   - Circular avatar placeholder with camera icon action badge.
   - Text: "Show your love for live music! Add a profile photo..."
   - Action buttons: "Choose Photo" button (image icon) + delete trash icon button.
4. **Basic Information Inputs:**
   - Side-by-side: `First Name` ("Jordan") and `Last Name` ("Taylor").
   - `Username` ("@jordanlovesmusic") with real-time `✓ Available` green validation indicator.
   - `Email Address` ("jordan.taylor@email.com") with `✓` verified green badge.
   - `Phone Number (Optional)` with "Optional" right label.
5. **Quick Music Preferences:**
   - "What kind of music do you love?"
   - Chip selector: `Rock` (selected), `Pop`, `Hip Hop`, `Country`, `EDM`, `R&B`, `Indie`, `Other`.
6. **Social Links:**
   - Tiles for Instagram, TikTok, Facebook, X, YouTube.
7. **Navigation:**
   - Full-width button: `Continue →`
   - Footnote: "You can update your profile anytime in settings."

---

## Screen 03 — AR Camera Live Performer Detection & Instant Tip

- **Stitch ID:** `12401386157321116177`
- **Asset Filename:** `screen_03_discovery.png`
- **Viewport Dimensions:** 863 × 1823
- **Platforms:** Flutter Mobile
- **Role:** Fan / Venue Audience
- **Application Route:** `/tip/vision` / `VisionTipScreen`
- **User Journey:** Fan points camera at stage -> AI/AR camera identifies live artist -> instant tip bottom tray appears without leaving camera feed.

### Visual Composition & Layout
1. **Camera Viewfinder:**
   - Full-screen live video/camera stream.
   - Dynamic bright green reticle/bounding box tracking performer on stage.
   - Reticle Badge: `🟢 PERFORMER DETECTED` in green pill.
2. **Identified Performer Glassmorphic Card:**
   - Circular photo with green verified check.
   - Name: `Jake Rios` with purple check badge.
   - Genre: `Indie • Folk • Acoustic`.
   - Live status: `🟢 LIVE at The Holding Company`.
   - Distance: `📍 0.3 mi away`.
3. **Integrated Bottom Sheet Tipping Tray:**
   - "How much would you like to tip?"
   - Presets: `$5`, `$10` (selected in solid purple with star badge ⭐), `$20`, `$50`, `Other`.
   - Message Input: `💜 Add a message (optional)` / "Keep up the amazing music! 🎶🔥" / char counter `24/100`.
   - Payment Selector: `Apple Pay` dropdown.
   - Primary CTA: `💜 Tip $10` (Right arrow, subtext `Secure • Instant • 100% to Artist`).
4. **Bottom Navigation Bar:**
   - 5 tabs: Home, Nearby, Center Floating Tip Pill (Active), Activity, Profile.

---

## Screen 04 — Fan Onboarding: Step 3 (Profile Details & Preferences)

- **Stitch ID:** `12401386157321114501`
- **Asset Filename:** `screen_04_live_stage.png`
- **Viewport Dimensions:** 853 × 1844
- **Platforms:** Flutter Mobile & Next.js Web
- **Role:** Fan
- **Application Route:** `/onboarding/fan/step-3`
- **User Journey:** Fan configures bio, location, attendance habits, and platform priorities.

### Visual Composition & Layout
1. **Header & Progress:**
   - Step 1 & 2 completed (purple check circles), Step 3 active (number 3), Step 4 gray, label `Step 3 of 4`.
2. **Title:**
   - "Your **profile** details" + heart hands hero graphic.
3. **About You Section:**
   - Short Bio textarea with char counter `112/160`.
   - Dropdown fields: City (`San Diego, CA`), Birth Date (`June 15, 1993`), Occupation (`Marketing Manager`), Pronouns (`She / Her`).
4. **Your Interests:**
   - Multi-select chips: `Concerts ✓`, `Festivals ✓`, `Travel`, `Photography ✓`, `Art`, `Food`, `Gaming`, `Fitness`, `Fashion`, `Reading`, `Other`.
5. **Your Music Experience:**
   - Live show frequency segmented selector: `Never`, `Rarely`, `Sometimes ✓`, `Often`, `All the time`.
   - Platform priority cards (4 selectable tiles):
     - `Discover new artists` (selected purple border & checkmark)
     - `Support my favorites`
     - `Be in the community`
     - `Exclusive experiences`
6. **Profile Visibility:**
   - Dropdown: `🌐 Everyone`
7. **Action:**
   - `Continue →` button.

---

## Screen 05 — Fan Onboarding: Step 4 Completion (Welcome & Next Steps)

- **Stitch ID:** `12401386157321115711`
- **Asset Filename:** `screen_05_tipping_overlay.png`
- **Viewport Dimensions:** 853 × 1844
- **Platforms:** Flutter Mobile & Next.js Web
- **Role:** Fan
- **Application Route:** `/onboarding/fan/complete`
- **User Journey:** Fan completes onboarding, sees celebratory screen with curated discovery entry points.

### Visual Composition & Layout
1. **Header & Progress:**
   - All 4 progress steps checked (Basic Info, Your Preferences, Profile Details, Review).
2. **Hero Celebration:**
   - Purple ambient confetti particles.
   - User avatar with purple checkmark badge.
   - Title: "Your profile is **created!**"
   - Subtitle: "Welcome to Crowdbeats, Jordan! You're all set to discover music..."
3. **Action Cards ("What's next?"):**
   - 🔍 `Discover Artists & Campaigns` →
   - 💜 `Follow Your Favorites` →
   - 🔲 `Tip at Live Shows` (Vision Tip overview) →
   - 🔔 `Stay in the Loop` →
4. **Viral Growth / Invite Card:**
   - "Invite friends. Earn rewards." + `Invite Friends` button.
5. **Primary CTA:**
   - Vibrant button: `✨ Explore Crowdbeats →`
   - Secondary link: `Go to Home`.

---

## Screen 06 — Fan Onboarding: Step 4 Review (Profile & Preferences Summary)

- **Stitch ID:** `12401386157321116921`
- **Asset Filename:** `screen_06_artist_profile.png`
- **Viewport Dimensions:** 853 × 1844
- **Platforms:** Flutter Mobile & Next.js Web
- **Role:** Fan
- **Application Route:** `/onboarding/fan/step-4-review`
- **User Journey:** Final pre-submission review screen allowing fans to inspect and edit any information.

### Visual Composition & Layout
1. **Header & Progress:**
   - Step 1, 2, 3 checked, Step 4 active, label `Step 4 of 4`.
2. **Title:**
   - "Review your **profile** ✓"
3. **Summary Review Cards (Each with "Edit ✏️" button):**
   - **About You:** Avatar, Bio, Name, Username, Email, Phone, Location, Birth Date.
   - **Your Preferences:** Genres, Discovery channels, Interests.
   - **Music Experience & Favorite Artists:** Shows favorite artist avatars (The 1975, Coldplay, Billie Eilish, Imagine Dragons, Rüfüs Du Sol).
   - **Connected Accounts:** Instagram, TikTok, Facebook, X, YouTube with green connected badges.
   - **Notification Preferences:** Toggles summary.
4. **Primary CTA:**
   - `🔒 Create My Profile →`

---

## Screen 07 — Fan Onboarding: Step 2 (Preferences, Artists & Notifications)

- **Stitch ID:** `12401386157321113757`
- **Asset Filename:** `screen_07_venue_dashboard.png`
- **Viewport Dimensions:** 853 × 1844
- **Platforms:** Flutter Mobile & Next.js Web
- **Role:** Fan
- **Application Route:** `/onboarding/fan/step-2`
- **User Journey:** Fan selects music genres, favorite artists, discovery preferences, and notification channels.

### Visual Composition & Layout
1. **Header & Progress:**
   - Step 1 checked, Step 2 active, Step 3, 4 gray, label `Step 2 of 4`.
2. **Title:**
   - "Tell us more **about you**"
3. **Favorite Music Genres:**
   - 12-genre grid: `Rock ✓`, `Pop ✓`, `Hip Hop`, `Country`, `EDM`, `R&B`, `Indie ✓`, `Jazz`, `Alternative ✓`, `Latin`, `Classical`, `Other`.
4. **Discovery Channels:**
   - `Live Events ✓`, `Friends ✓`, `Social Media`, `Streaming Apps`, `Other`.
5. **Favorite Artists/Bands (Add up to 5):**
   - Removable chip tags: `The 1975 ✕`, `Coldplay ✕`, `Billie Eilish ✕`, `Imagine Dragons ✕`, `RÜFÜS DU SOL ✕`.
   - Search bar: `🔍 Search artists or bands...`
6. **Notification Preferences (Purple Switch Toggles):**
   - Live shows near me [ON]
   - New campaigns from artists I follow [ON]
   - Tips & activity [ON]
   - Special offers & giveaways [ON]
7. **Action:**
   - `Continue →`

---

## Screen 08 — Nearby Live Music Map (Standard Discovery Mode)

- **Stitch ID:** `12401386157321114967`
- **Asset Filename:** `screen_08_sponsor_hub.png`
- **Viewport Dimensions:** 853 × 1844
- **Platforms:** Flutter Mobile & Next.js Web
- **Role:** Fan / Discoverer
- **Application Route:** `/nearby` (Web) / `NearbyTab` (Flutter)
- **User Journey:** Fan browses live music happening around their current GPS location on an interactive map.

### Visual Composition & Layout
1. **Header Bar:**
   - Title: `Nearby Live Music`
   - Location Dropdown: `🟢 San Diego, CA ⌵`
   - Right filter sliders button
2. **View Mode Segmented Switcher:**
   - `🗺️ Map` (Active purple), `📋 List`, `🏛️ Venues`.
3. **Interactive Dark Satellite/Vector Map:**
   - Blue pulse dot at user location with radius ring.
   - Floating performer map markers with circular photos and colored indicator borders (Green = Live Now, Purple = Band, Orange = Acoustic).
   - Marker labels with distance: `The Wildways (0.6 mi)`, `Jake Rios (0.3 mi)`, `Midnight Riders (0.4 mi)`, `Luna Causey (1.2 mi)`.
   - Map Legend bar: `🟢 Live Now • 🟣 Band • 🟠 Acoustic • ⚪ Other`
   - Recenter & GPS navigation floating buttons.
4. **Bottom Expandable Drawer ("Live Near You"):**
   - **Performer Card 1 (Jake Rios):** LIVE green badge, 0.3 mi | The Holding Company, Indie • Folk • Acoustic, 👥 128 watching, heart icon, direct purple `Tip` button.
   - **Performer Card 2 (Midnight Riders):** LIVE green badge, 0.4 mi | Rooftop at Flux, Rock • Country • Blues, 👥 94 watching, heart icon, direct purple `Tip` button.
   - **Performer Card 3 (Luna Causey):** LIVE green badge, 1.2 mi | Parlour, R&B • Soul • Acoustic, 👥 73 watching, heart icon, direct purple `Tip` button.
5. **Bottom Navigation Bar:**
   - Nearby tab active in purple.

---

## Screen 09 — Fan Activity & Notifications Feed

- **Stitch ID:** `12401386157321117387`
- **Asset Filename:** `screen_09_crowdfunding.png`
- **Viewport Dimensions:** 853 × 1844
- **Platforms:** Flutter Mobile & Next.js Web
- **Role:** Fan
- **Application Route:** `/activity` (Web) / `ActivityTab` (Flutter)
- **User Journey:** Fan tracks tipping history, artist acknowledgments, campaign milestones, and follower events.

### Visual Composition & Layout
1. **Header Bar:**
   - Title: `Activity`
   - Subtitle: "Stay updated with your tips, follows and more."
   - Right funnel filter button.
2. **Category Filter Chips:**
   - `⚡ All` (Active purple pill), `💚 Tips`, `👥 Follows`, `📢 Campaigns`, `⚙️ System`.
3. **Chronological Event Stream:**
   - **Group: "Today"** (with `Mark all as read` action):
     - Tip Sent: Avatar + "You tipped Alex Martin" + "Thank you! Your support means the world. 🙌" + `2m ago` + green `$10` + chevron.
     - Follow Event: "You followed The Midnight Riders" + `16m ago` + chevron.
     - Campaign Update: "The Wildways updated their campaign" + `1h ago` + chevron.
     - Reciprocal Tip / Reward: "Luna Causey tipped you back" + green `$5` + chevron.
   - **Group: "Yesterday":**
     - Follow Notification: "Jake Rios started following you" + `Follow Back` button.
     - Tip Sent: "You tipped Riverstone" + green `$15`.
     - Event Notice: "Indie in the Park is happening soon!".
   - **Group: "This Week":**
     - Platform Update: "Crowdbeats update — We added Apple Pay and Google Pay...".
4. **Bottom Navigation Bar:**
   - Activity tab active in purple.

---

## Screen 10 — Fan Home Dashboard

- **Stitch ID:** `12401386157321116643`
- **Asset Filename:** `screen_10_fan_home.png`
- **Viewport Dimensions:** 853 × 1844
- **Platforms:** Flutter Mobile & Next.js Web
- **Role:** Fan
- **Application Route:** `/home` (Web) / `HomeTab` (Flutter)
- **User Journey:** Primary fan landing view after sign-in with quick navigation, live stages, and recent activity.

### Visual Composition & Layout
1. **Header Bar:**
   - User profile avatar (top left).
   - Centered Crowdbeats wordmark + audio equalizer logo.
   - Notification bell with unread purple dot (top right).
2. **Personalized Greeting:**
   - "Good evening, Jordan 👋"
   - Subtitle: "Let's support some amazing music."
3. **Quick Action Hub (3 Columns):**
   - `🎯 Nearby Live` ("Find musicians near you" + green arrow).
   - `🔲 Tip a Musician` ("Scan or find to tip instantly" + purple arrow).
   - `🧡 Following` ("Artists you love and support" + orange arrow).
4. **Section: "Live Near You" (with "View all" link):**
   - Horizontal scrolling stage cards with live photo thumbnails, `LIVE` green tags, venue names, distance, and verified badges:
     - Alex Martin (0.2 mi, The Blue Note, Rock • Acoustic)
     - Sophie Taylor (0.4 mi, Central Park, Indie • Folk)
     - The Midnight Riders (0.6 mi, Riverside Bar, Country • Rock)
5. **Section: "Upcoming Shows" (with "View all" link):**
   - The Wildways banner card (May 24 • 8:00 PM, The Underground, Indie Rock, `Remind Me` button).
6. **Section: "Recent Tips" (with "View all" link):**
   - "You tipped Alex Martin" (2 hours ago, green `$10`, verified artist icon).
7. **Floating Bottom Navigation Bar:**
   - Home tab active in purple.

---

## Screen 11 — Enhanced Nearby Map (Pulsing Radar Variant)

- **Stitch ID:** `3f6d3e115ef64259805a85991dfc6380`
- **Asset Filename:** `screen_11_enhanced_map.png`
- **Viewport Dimensions:** 768 × 1376
- **Platforms:** Flutter Mobile & Next.js Web
- **Role:** Fan / Discoverer
- **Application Route:** `/nearby` (Alternate Stage Map View)
- **User Journey:** Immersive visual map with glowing performer beacons and wide stage cards.

### Visual Composition & Layout
1. **Map Header:** `Nearby Live Music` / `San Diego, CA ⌵` / Filter button.
2. **Interactive Map Visuals:**
   - Dark mode road map with glowing purple circular map pins with artist photos.
   - Pulsing concentric sonar/radar rings emanating from active performer pins.
3. **Expanded Card Drawer:**
   - Wide landscape card for Jake Rios with full-width `💜 Tip` button.
   - Wide landscape card for Midnight Riders.
4. **Bottom Bar with Glowing Tip Button.**

---

## Screen 12 — Enhanced AR Tipping Interface (Full Viewfinder Variant)

- **Stitch ID:** `7165d1c6fe314d62bb4a99e1e463e212`
- **Asset Filename:** `screen_12_enhanced_ar.png`
- **Viewport Dimensions:** 768 × 1376
- **Platforms:** Flutter Mobile
- **Role:** Fan / In-Venue Tipping
- **Application Route:** `/tip/ar-scanner`
- **User Journey:** AR camera targeting with frosted glass performer card and instant emoji-enabled tipping drawer.

### Visual Composition & Layout
1. **Full-Bleed Live Camera View:**
   - Centered neon green targeting bracket with horizontal scanning line.
   - `🟢 PERFORMER DETECTED` floating glass badge.
2. **Frosted Glassmorphic Artist Card:**
   - Translucent container with blur: Jake Rios, Indie • Folk • Acoustic, LIVE at The Holding Company, 0.3 mi away.
3. **Bottom Sheet:**
   - Amount selection: `$5`, `⭐ $10`, `$20`, `Custom`.
   - Message field with emoji picker button (`😀`).
   - Apple Pay selector.
   - Glowing purple CTA: `💜 Tip Now — $10`.
