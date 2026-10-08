# Crowdbeats V2 Design System Specification

## 1. Dual-Theme System

The application utilizes a dual-theme architecture.

### Dark Obsidian Mode
* **Background:** `#0B0C10`
* **Surface-1:** `#151722`
* **Surface-2:** `#1E2032`
* **Borders:** `#2B2D44`
* **Accent (Electric Violet):** `#7C3AED`
* **Highlight (Gradient):** `#A855F7`
* **Live Green:** `#10B981`
* **Heart Orange:** `#FB923C`
* **Verified Blue:** `#38BDF8`

### Light Mode
* **Background:** `#F9FAFB`
* **Cards / Surface:** `#FFFFFF`
* **Borders:** `#E5E7EB`
* **Text (Primary):** `#111827`
* **Accent (Primary Purple):** `#7C3AED`
* *Constraint:* Ensure >= 4.5:1 WCAG contrast on all text and controls.

## 2. Typography Scale

*Primary Font:* DM Sans / *Secondary Font:* Inter

* **Display:** 48px, Bold (700), Tracking: -2%
* **Headline 1 (H1):** 32px, Bold (700), Tracking: -1%
* **Headline 2 (H2):** 24px, Bold (700), Tracking: -1%
* **Headline 3 (H3):** 20px, Semi-Bold (600), Tracking: 0%
* **Subheading 1:** 16px, Semi-Bold (600), Tracking: 0%
* **Subheading 2:** 14px, Medium (500), Tracking: 0%
* **Body 1 (Primary):** 16px, Regular (400), Tracking: 0%, Line Height: 150%
* **Body 2 (Secondary):** 14px, Regular (400), Tracking: 0%, Line Height: 140%
* **Caption:** 12px, Regular (400), Tracking: 2%
* **Label:** 12px, Medium (500), Tracking: 4%, Uppercase

## 3. Spacing & Shape

### Spacing Rhythm (4px Grid)
* `xs`: 4px
* `sm`: 8px
* `md`: 12px
* `lg`: 16px
* `xl`: 24px
* `2xl`: 32px
* `3xl`: 48px

### Corner Radii
* `sm`: 8px
* `md`: 12px
* `lg`: 16px
* `xl`: 20px
* `pill`: 9999px

### Elevation & Glow
* **Layer 1 (Card):** 0px 4px 6px rgba(0, 0, 0, 0.1)
* **Layer 2 (Modal):** 0px 10px 15px rgba(0, 0, 0, 0.2)
* **Layer 3 (Popover):** 0px 20px 25px rgba(0, 0, 0, 0.25)
* **Glow (Accent):** 0px 0px 15px rgba(124, 58, 237, 0.5)

## 4. Standard Reusable Components

* **CbButton:** 
  * *Primary:* Pill shape, Electric Violet background, White text.
  * *Secondary:* Pill shape, Transparent background, Border match to accent or surface, Text matches accent.
  * *Ghost:* Pill shape, No border, No background, Text matches primary or accent.
* **CbChip:** Used for Filters, Genres, and Statuses. Small radius, subtle background variation depending on state (active vs. inactive).
* **CbLiveBadge:** Red or Live Green `#10B981` background, white text, pill shape, uppercase label, used to indicate active live streams.
* **CbPerformerCard:** Card layout using `md` or `lg` radii, Surface-1/Surface-2 backgrounds in Dark mode, includes image placeholder, performer name, genres, and a CbLiveBadge if applicable.
* **CbInput:** Standard text input field. Border `#2B2D44` (Dark) / `#E5E7EB` (Light), rounded `sm` or `md`, focused state glow.
* **CbBottomSheet:** Modal surface originating from the bottom of the screen. Radius `xl` on top corners, uses Layer 2 or 3 elevation.
* **CbTabBar:** Bottom navigation bar, pill or block shape, transparent or Surface-1 background, icons colored based on active/inactive state.

## 5. Stitch Design Tokens & Screen-to-Component Mappings

### Design Tokens
* `color-bg-dark`: `#0B0C10`
* `color-bg-light`: `#F9FAFB`
* `color-surface-dark-1`: `#151722`
* `color-accent-primary`: `#7C3AED`
* `radius-pill`: `9999px`
* `spacing-lg`: `16px`

### Screen-to-Component Mappings
* **Create Profile Steps 1-4:** Uses `CbInput`, `CbButton` (Primary/Secondary), `CbChip` (for genre selection), Typography scales for headers and labels.
* **Profile Created Celebration:** Uses `CbButton` (Primary), Display typography, Accent Glow effects.
* **Fan Home Dashboard:** Uses `CbTabBar` (navigation), `CbPerformerCard` (feed items), `CbLiveBadge` (status), `CbChip` (filters).
* **Discover Nearby Map/List:** Uses `CbBottomSheet` (for list view over map), `CbPerformerCard` (list items), `CbChip` (map markers/filters).
* **Direct Tip / Camera AR Tip:** Uses `CbBottomSheet` (for tip amount selection), `CbButton` (Primary for confirmation), `CbInput` (custom tip amount).
* **Activity Feed:** Uses `CbPerformerCard`, `CbTabBar`, Typography (Body 1 & 2 for feed content).
