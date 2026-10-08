# Creator Journey Mobile Specification

## Overview
This specification outlines the complete mobile architecture and design system implementation for Creators on Crowdbeats V2, encompassing both Solo Musicians and Band Collectives. The experiences extend the core fan vision board design language to the creator tools.

### Core Design System (Extended)
- **Background**: `#0B0C10` (Obsidian Canvas)
- **Surface/Cards**: `#151722` (Elevated Panel)
- **Primary Accent**: `#7C3AED` (Electric Violet - Actions, Focus)
- **Status/Live**: `#10B981` (Live Green - Active Status, Tips)
- **Spacing**: 4px base grid (4, 8, 16, 24, 32, 48)
- **Touch Targets**: Minimum 48dp for all interactive elements

---

## 1. Solo Musician Mobile Experience

### 1.1 Creator Onboarding
- **State Model**: `Unverified` -> `VerificationPending` -> `Verified`
- **Screens**:
  - **Artist Profile Creation**: Inputs for Stage Name, Genres (pill selection), Bio.
  - **Financial Onboarding**: Stripe Connect integration view. KYC requirement checklist (ID upload, SSN/TIN).
- **Design Mappings**:
  - Full-screen onboarding flow with `#7C3AED` primary progress indicators.
  - Success states trigger `#10B981` confirmation overlays.

### 1.2 Creator Studio Home
- **State Model**: Aggregated view of `CreatorProfile`, `TipLedger`, `FollowerMetrics`.
- **Screens**:
  - **Dashboard**: Glanceable cards (`#151722`) detailing active set status, tip revenue summary, and recent follower growth.
  - **Quick Actions**: Floating Action Button (FAB) or prominent grid for "Go Live", "Cash Out", "Messages".
- **Design Mappings**:
  - Card-based layout with 16px padding.
  - Revenue text highlighted in `#10B981` if positive trend.

### 1.3 Live Stage HUD
- **State Model**: `Offline` -> `Preparing` -> `Live` -> `WrappingUp`
- **Screens**:
  - **Pre-Live**: Venue check-in, set duration estimate.
  - **Live HUD**: 
    - "Go Live" toggle shifts to `#10B981`.
    - Centered 240px Rotating QR Code modal with a countdown ring (animating `#7C3AED` to `#10B981`).
    - Real-time tip stream ticker at the bottom of the screen (marquee or stacking toast notifications).
- **Design Mappings**:
  - Obsidian Canvas (`#0B0C10`) background to reduce glare on stage.
  - Large, high-contrast QR code (240x240) against a bright white background bounded within a `#151722` card for scanning reliability.

### 1.4 Earnings & Cashout
- **State Model**: `AvailableBalance`, `PendingFunds`, `PayoutHistory`
- **Screens**:
  - **Wallet View**: Large typography for available balance. Pending funds grouped below.
  - **Cashout Sheet**: Bottom sheet modal for requesting payouts. 
  - **Bank Management**: List of linked accounts, add new account.
- **Design Mappings**:
  - Bottom sheet components with 48dp touch targets for amounts and confirm buttons.

### 1.5 Audience & Messages
- **State Model**: `FollowerList`, `MessageThread`, `FanTier`
- **Screens**:
  - **Relationship List**: Searchable directory of fans.
  - **Inbox**: Message threads with fans. Top supporters feature a unique badge (e.g., `#7C3AED` crown icon).
- **Design Mappings**:
  - List items with 8px vertical spacing.

---

## 2. Band Mobile Experience

### 2.1 Band Profile & Hub
- **State Model**: `BandIdentity`, `MemberList`
- **Screens**:
  - **Collective Identity**: Band name, collective genre, shared bio.
  - **Member Roster**: List of band members with explicit Role Badges (`Owner`, `Manager`, `Musician`).
- **Design Mappings**:
  - Role badges styled as distinct pills (e.g., `Owner` gets a solid `#7C3AED` fill, `Musician` gets an outlined `#7C3AED` stroke).

### 2.2 Member Governance
- **State Model**: `InvitationPending`, `MemberActive`, `MemberRemoved`
- **Screens**:
  - **Invite Flow**: Input field for email/handle.
  - **Pending Invitations**: Card list showing pending invites.
  - **Accept/Decline Sheet**: Bottom sheet for invitees.
- **Design Mappings**:
  - Destructive actions (Remove Member) use standard red warning colors with a confirmation step.

### 2.3 Revenue Splits
- **State Model**: `SplitConfiguration` (Totaling 100%), `EffectiveDate`
- **Screens**:
  - **Split Configurator**: Slider or numeric input for each member's percentage. Real-time validation ensuring it equals 100%.
  - **Privacy Enforcement**: Strict view logic. Only `Owner` or `Manager` roles can view financial details; others may only see their own split percentage and earnings.
- **Design Mappings**:
  - Slider controls with 48dp thumb size for easy adjustment.

### 2.4 Band Live Performance
- **State Model**: `BandLiveStatus`, `RoutingEngine`
- **Screens**:
  - **Collective Check-In**: Unified "Go Live" action for the band.
  - **Band QR Code**: A single rotating QR code that routes tips through the configured Revenue Split engine automatically.
- **Design Mappings**:
  - Similar HUD to Solo, but indicating "Band Mode" in the top status bar.
