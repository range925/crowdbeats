# Sponsor Mobile Experience Specification - Crowdbeats V2

## Overview
This document outlines the architecture, screen inventory, data models, and Flutter widget architecture for the **Sponsor Mobile Experience** within the Crowdbeats V2 Flutter mobile app. It brings full parity with the design system and fan vision board, focusing on enabling organizations to easily discover talent, manage sponsorships, review contracts, and track ROI on the go.

---

## 1. Sponsor Mobile Navigation & Shell
The Sponsor mobile app utilizes a persistent 5-tab bottom navigation structure for quick access to essential workflows.

### Tab Structure
1. **Home:** Overview dashboard, budget summary, and urgent notifications.
2. **Discover:** Search and filter for talent and venues.
3. **Sponsorships:** Pipeline of active, under review, and completed sponsorships.
4. **Messages:** Direct communication with talent, venues, and Crowdbeats support.
5. **Profile:** Organization settings, billing, documents, and analytics.

---

## 2. Sponsor Home Dashboard
The Home dashboard provides a high-level view of the sponsor's current standing, active campaigns, and budget.

### Key Elements
* **Organization Header:** Displays the company logo, name, and sponsor tier/status.
* **Budget Overview Card:** Visual progress bar showing Allocated vs. Spent sponsorship budget.
* **Active Sponsored Performances Carousel:** Horizontal scroll of upcoming gigs the sponsor is currently backing.
* **Recent Applicant Requests List:** Quick access list of pending sponsorship requests from talent/venues needing review.

---

## 3. Talent Discovery & Shortlist
A robust discovery engine optimized for mobile, allowing sponsors to find the perfect fit for their brand.

### Features
* **Mobile Search & Filter:** 
  * Filters: Genre, City/Location, Audience Draw (min/max), Venue Tier.
* **Performer Spotlight Cards:**
  * Rich media cards featuring the artist/band photo.
  * Badges: "Solo", "Band", "Verified Check".
  * Metrics: Follower counts, average draw, engagement rate.
* **Shortlist / Save Functionality:**
  * Bookmark icon to save talent to lists.
  * "Add Note" feature for internal team collaboration (e.g., "Good fit for summer campaign").

---

## 4. Sponsorships & Applications
A Kanban-style or tabbed list view to manage the lifecycle of sponsorship deals.

### Tabbed View
* **Under Review:** Inbound requests or pending outbound offers.
* **Active:** Ongoing campaigns and upcoming gigs.
* **Completed:** Past sponsorships with pending or completed ROI analytics.

### Application Review Modal
When tapping a pending application, a bottom sheet or full-screen modal appears containing:
* **Artist Proposal:** Summary of the event and why the talent wants the sponsor.
* **Proposed Compensation:** Financial ask (flat fee, tier matching, etc.).
* **Deliverable Checklist:** What the sponsor gets (e.g., Logo on flyer, Stage shoutout, Social media post).
* **Action Buttons:** `Accept`, `Counter Offer` (opens negotiation form), `Decline`.

---

## 5. Contracts & Documents
Secure and accessible mobile contract management.

### Features
* **Mobile Document Preview:** PDF viewer for reviewing contracts, riders, and NDAs natively.
* **Signed Agreement Status:** Visual indicators (Pending Signature, Signed, Expired).
* **Payment Milestones:** Timeline view of when payments are due (e.g., 50% upfront, 50% post-show).

---

## 6. Spending & Payment Receipts
Financial tracking and ROI measurement tailored for corporate sponsors.

### Features
* **Corporate Payment Review:** Approval workflows for releasing funds.
* **Invoice History:** List of past invoices with one-tap download.
* **Stripe Corporate Payment Integration:** Secure handling of ACH, corporate cards, and wallet payments via Stripe.
* **ROI & Engagement Analytics:** Post-event dashboards showing audience reach, engagement metrics, and cost-per-impression.

---

## 7. Data Models

```dart
// lib/models/sponsor.dart
class Sponsor {
  final String id;
  final String organizationName;
  final String logoUrl;
  final double totalBudget;
  final double spentBudget;
  final bool isVerified;
}

// lib/models/talent_profile.dart
class TalentProfile {
  final String id;
  final String name;
  final String type; // 'Solo', 'Band'
  final bool isVerified;
  final int followerCount;
  final String primaryGenre;
  final String location;
  final int averageDraw;
}

// lib/models/sponsorship_application.dart
enum ApplicationStatus { underReview, active, completed, declined }

class SponsorshipApplication {
  final String id;
  final String talentId;
  final String sponsorId;
  final String proposalText;
  final double proposedCompensation;
  final List<String> deliverables;
  final ApplicationStatus status;
}

// lib/models/contract.dart
class Contract {
  final String id;
  final String applicationId;
  final String documentUrl;
  final bool isSignedBySponsor;
  final bool isSignedByTalent;
  final List<PaymentMilestone> milestones;
}
```

---

## 8. Flutter Widget Architecture
The mobile architecture follows a feature-based folder structure under `lib/sponsor/`.

```text
lib/
└── sponsor/
    ├── navigation/
    │   └── sponsor_bottom_nav.dart
    ├── home/
    │   ├── sponsor_home_screen.dart
    │   ├── widgets/
    │   │   ├── budget_overview_card.dart
    │   │   ├── active_performances_carousel.dart
    │   │   └── recent_requests_list.dart
    ├── discover/
    │   ├── discover_screen.dart
    │   ├── widgets/
    │   │   ├── search_filter_sheet.dart
    │   │   └── performer_spotlight_card.dart
    ├── sponsorships/
    │   ├── sponsorships_screen.dart
    │   ├── application_review_modal.dart
    │   └── widgets/
    │       ├── status_tab_bar.dart
    │       └── sponsorship_list_item.dart
    ├── documents/
    │   ├── document_preview_screen.dart
    │   └── widgets/
    │       └── milestone_timeline.dart
    └── finance/
        ├── spending_dashboard.dart
        └── widgets/
            ├── invoice_history_list.dart
            └── roi_analytics_chart.dart
```
