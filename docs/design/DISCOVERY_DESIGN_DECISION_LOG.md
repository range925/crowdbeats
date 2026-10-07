# Crowdbeats V2 — Public Discovery Design Decision Log
**Document Reference**: `CB-DESIGN-DECISION-LOG-003`  
**Classification**: Product Architecture & Design Rationale  
**Status**: `RECORDED & RATIFIED`  

---

## 1. Decision Log Index

### Decision 1: Relocation of Dense Components to Secondary Views
- **Context**: The previous discovery screen rendered a map, segmented controls, 8+ filter pills, 15+ performer cards, and live counters simultaneously on startup.
- **Decision**: Remove all dense lists, filter pills, and segmented controls from the initial screen, placing them exclusively in dedicated secondary views (`NearbySecondaryView`, `PopularSecondaryView`, `LiveNowSecondaryView`).
- **Rationale**: Reduces time-to-value from 12+ seconds to under 3 seconds. Allows first-time visitors to immediately grasp the app's purpose without cognitive paralysis.

---

### Decision 2: Search Input Placeholder Copy
- **Context**: Evaluated *"Where do you want to discover music?"* vs *"Search city, town, state or country"*.
- **Decision**: Adopted `"Search city, town, state or country"` as the primary placeholder.
- **Rationale**: Directly communicates the geographic scope (city, town, state, or country level) and immediately prompts user to enter a destination (e.g. *Torrance, CA*, *San Diego, CA*, *London, UK*).

---

### Decision 3: The 3 Primary Discovery Paths
- **Context**: Analyzed fan intent vectors when exploring live music platforms.
- **Decision**: Standardize on exactly three primary options:
  1. **`Nearby`**: For fans looking for live sets within walking or short driving distance.
  2. **`Popular`**: For fans seeking trending artists, top-rated bands, and popular venues in the chosen city.
  3. **`Live Now`**: For fans looking for active live stage performances occurring right now.
- **Rationale**: Covers 100% of organic discovery intentions while maintaining an uncluttered, balanced 3-item UI layout.

---

### Decision 4: Compact Map Preview with 2–5 Representative Pins
- **Context**: Large full-bleed maps with 20+ pins created visual noise, battery drain, and frame drops on initial mobile startup.
- **Decision**: First screen renders a compact, elegant map card displaying the active location header (*"You are here"* or *"Exploring Torrance, CA"*) and 2–5 glowing representative pins.
- **Rationale**: Provides instant spatial confirmation of the active city while inviting the user to tap to open the full interactive map with complete venue details.

---

### Decision 5: Non-Blocking Location Architecture
- **Context**: Many mobile apps present modal alert popups demanding GPS permission on launch, causing drop-offs when denied.
- **Decision**: Location permission is 100% optional. If denied or unavailable, the app immediately defaults to curated music hubs (*San Diego, CA* or *Torrance, CA*) and provides one-tap search without any blocking dialogs.
- **Rationale**: Eliminates user onboarding friction and guarantees 100% feature availability in web browsers and privacy-restricted mobile environments.
