# Fan Journey Specification - Crowdbeats V2

## Overview
This document specifies the complete Fan mobile experience for Crowdbeats V2 based on the 10 core screens. It outlines the architecture, state models, and widget specifications for onboarding, discovery, tipping, and user activity.

## Architecture & State Models

### Global State (`FanAppState`)
*   `currentUser`: `FanUser` object containing profile data, preferences, and authentication status.
*   `currentLocation`: `LocationData` for nearby discovery.
*   `walletBalance`: Current balance or linked payment methods.
*   `feed`: List of `ActivityItem` for the activity feed.

### Data Models
*   `FanUser`: id, username, email, phone, bio, city, birthDate, occupation, pronouns, visibility, favoriteGenres, discoveryChannels, favoriteArtists, socialLinks, notificationPrefs.
*   `Performer`: id, name, isVerified, currentVenue, distance, genres.
*   `TipTransaction`: id, performerId, amount, currency, timestamp, paymentMethod, cheerMessage, status.
*   `ActivityItem`: id, type (tip, follow, campaign, system), timestamp, content, relatedEntityId.

---

## Screen Specifications

### 1. Onboarding Step 1 (Basic Info)
*   **State:** `OnboardingBasicInfoState` (avatarFile, names, username, usernameAvailable, email, phone, selectedGenres, socialConnects)
*   **Widgets:**
    *   `ProgressBar` (Progress 1/4)
    *   `HeroArt` (Crowd theme)
    *   `AvatarUploader`
    *   `ValidatedTextField` (Username with real-time available check, Email verified check)
    *   `GenreChipGroup` (Selectable chips)
    *   `SocialConnectButtons` (OAuth providers)

### 2. Onboarding Step 2 (Preferences)
*   **State:** `OnboardingPreferencesState` (favoriteGenres, discoveryChannels, favoriteArtists, socialAuthToggles, pushPrefs)
*   **Widgets:**
    *   `ProgressBar` (Progress 2/4)
    *   `SearchableChipInput` (Favorite artists)
    *   `MultiSelectChips` (Discovery channels)
    *   `SwitchListTile` (Social auth toggles, Notification push preferences)

### 3. Onboarding Step 3 (Profile Details)
*   **State:** `OnboardingProfileState` (shortBio, city, birthDate, occupation, pronouns, interests, liveShowFrequency, profileVisibility)
*   **Widgets:**
    *   `ProgressBar` (Progress 3/4)
    *   `CitySelector` (Autocomplete location)
    *   `DatePickerField` (Birth date)
    *   `DropdownMenu` (Pronouns, Live show frequency, Profile visibility selector)
    *   `MultiSelectDropdown` (Interests)

### 4. Onboarding Step 4 (Review Profile)
*   **State:** `OnboardingReviewState` (Reads combined state from steps 1-3)
*   **Widgets:**
    *   `ProgressBar` (Progress 4/4)
    *   `ReviewSummaryCard` (Contains inline edit buttons for all 5 sections)
    *   `PrimaryCTAButton` ("Create My Profile")

### 5. Onboarding Complete (Celebration)
*   **State:** Stateless / Animation state
*   **Widgets:**
    *   `ConfettiAnimation` (Purple concert stage background)
    *   `WelcomeText`
    *   `ChecklistCard` ("What's next?")
    *   `InviteFriendsCard`
    *   `PrimaryCTAButton` ("Explore Crowdbeats")

### 6. Fan Dashboard (Home)
*   **State:** `FanDashboardState` (timeOfDay, userName, nearbyShows, upcomingShows, recentTips)
*   **Widgets:**
    *   `GreetingHeader` (Contextual time-of-day greeting)
    *   `QuickActionGrid` (3 cards: 'Nearby Live', 'Tip a Musician', 'Following')
    *   `HorizontalCarousel` ('Live Near You')
    *   `EventList` ('Upcoming Shows' with 'Remind Me' button)
    *   `TransactionList` ('Recent Tips' with status indicator)

### 7. Discover / Nearby Live
*   **State:** `DiscoverState` (selectedCity, viewMode: Map/List/Venues, mapCenter, nearbyActs)
*   **Widgets:**
    *   `CitySelectorHeader`
    *   `SegmentedToggle` (Map / List / Venues)
    *   `InteractiveMap` (Glowing performer pins)
    *   `BottomSheetDrawer` (List of nearby acts with distance, venue, genre, Tip CTA)

### 8. Direct Musician Tip
*   **State:** `TipState` (performerId, selectedAmount, paymentMethod, cheerMessage)
*   **Widgets:**
    *   `PerformerSpotlightCard` (Name, verified badge, venue, following pill)
    *   `AmountPresetGrid` ($5 / $10 / $20 / Custom)
    *   `PaymentMethodSelector` (Apple Pay, Google Pay, Card)
    *   `TextField` (Optional cheer message)
    *   `PrimaryCTAButton` ("Tip Now")

### 9. Camera-assisted Tip
*   **State:** `CameraTipState` (cameraActive, detectedPerformerId)
*   **Widgets:**
    *   `CameraViewfinder` (With "PERFORMER DETECTED" reticle)
    *   `DetectedPerformerCard` (Overlay when recognized)
    *   `InstantAmountPills` (Quick selection)
    *   `NativePaymentButton` (Apple Pay / Google Pay)

### 10. Activity Feed
*   **State:** `ActivityFeedState` (activeFilter, groupedActivities)
*   **Widgets:**
    *   `FilterTabs` (All, Tips, Follows, Campaigns, System)
    *   `GroupedList` (Headers: Today, Yesterday, This Week)
    *   `ActivityFeedCard` (Net tip amounts, follow-back actions)
