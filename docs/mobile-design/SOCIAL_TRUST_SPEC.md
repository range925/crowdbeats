# Crowdbeats V2: Social, Trust & Safety Specifications

This document outlines the interaction contracts, safety mechanisms, and financial transparency rules for the Crowdbeats V2 mobile platform across Fan, Solo Musician, Band, and Sponsor roles.

## 1. Identity & Follow Model

### 1.1 Follow Relationships
Crowdbeats uses a directed follow model.
*   **Fan to Artist/Band:** Fans follow artists and bands to stay updated on new content, events, and drops.
*   **Artist/Band to Artist/Band:** Artists and bands can follow each other for networking, collaboration, and mutual support.
*   **Sponsor to Artist/Band:** Sponsors follow artists to track their performance, engagement, and potential partnership opportunities.
*   **Artist/Band to Sponsor:** Artists follow sponsors to stay informed about campaigns and sponsorship programs.
*   **Fan to Fan:** Fans can follow each other to discover new music and connect with like-minded users.

### 1.2 Follow Constraints
*   **Self-Follow Prevention:** The system prevents users from following their own accounts.
*   **Privacy Settings:**
    *   **Public Accounts:** Follows are automatically accepted. Artists, Bands, and Sponsors are public by default.
    *   **Private Accounts (Fans only):** Follows require a follow request. The requested user must accept or decline before the follow relationship is established.

### 1.3 Follow Metrics & Lists
*   **Follower/Following Counts:** Displayed on user profiles.
*   **Follower/Following Lists:** Viewable by the user and their followers (if public).
*   **Follow Requests Queue:** A dedicated interface for private accounts to manage incoming requests.

---

## 2. Direct Messaging & Inboxes

### 2.1 Messaging Eligibility
*   **Mutual Follows:** Users who follow each other can exchange messages directly in the primary inbox.
*   **Non-Connected Accounts:**
    *   Messages from users who are not followed back are routed to a "Message Requests" folder.
    *   The recipient can review the request without triggering read receipts.
    *   The recipient must explicitly "Accept" the request to move the conversation to the primary inbox and enable replies.
    *   "Decline" removes the request without notifying the sender.
*   **Sponsor Outreach:** Sponsors may have elevated messaging privileges to send initial partnership inquiries to artists. These may appear in a dedicated "Partnerships" request tab.

### 2.2 Inbox Structure
*   **Primary Inbox:** Active conversations with mutual follows and accepted requests.
*   **Message Requests:** Incoming messages from non-connected accounts.
*   **Restricted Inbox:** (Hidden from main view) Messages from restricted users (see Safety Controls).
*   **Unread Badges:** Visual indicators for new messages and pending requests.

### 2.3 Conversation Management
*   **Persistence:** Conversations are stored securely in the database and synchronized across devices.
*   **Pagination:** Message histories use cursor-based pagination to load dynamically, optimizing mobile performance and reducing initial data payload.

---

## 3. Safety Controls (Block / Restrict / Report)

### 3.1 Block
*   **Definition:** Complete and mutual visibility suppression.
*   **Effects:**
    *   Users are immediately removed from each other's follower/following lists.
    *   Profiles, posts, and comments become completely invisible to each other.
    *   Direct messaging is permanently disabled between the two accounts.
    *   Accounts are excluded from each other's search results.
*   **Recovery:** Users can manage blocked accounts in Settings -> Privacy and choose to Unblock.

### 3.2 Restrict
*   **Definition:** A softer form of moderation to limit interactions without alerting the restricted user.
*   **Effects:**
    *   **Messaging:** Messages from the restricted user are silently routed to a hidden "Restricted" queue. Read receipts are never sent.
    *   **Comments:** Comments left by the restricted user on the restricting user's public content are visible *only* to the restricted user. The restricting user can view these comments behind a warning and optionally approve them for public visibility.
*   **Recovery:** Users can unrestrict accounts at any time via Settings -> Privacy.

### 3.3 Report
*   **Categories:** Spam, Harassment, Inappropriate Content, Impersonation, Intellectual Property Violation, Fraud.
*   **Process:**
    *   Users can report entire profiles, specific posts, comments, or direct messages.
    *   Flow includes optional evidence collection (e.g., text descriptions, selected messages).
    *   Reports are securely routed to the Admin/Trust & Safety Support queue.
    *   Automated UI acknowledgment of report receipt, ensuring the user feels heard.

---

## 4. Financial States & Transparent Receipts

### 4.1 Tipping & Transaction Payment States
All financial transactions (tips, digital goods) progress through a strict state machine:
1.  `submitted`: The user has initiated the tip and authorized the client.
2.  `processing`: The payment gateway (Stripe) is verifying and authorizing the charge.
3.  `held`: (Optional) Funds are captured but held in escrow (e.g., pending dispute windows or scheduled payouts).
4.  `failed`: The payment was declined by the issuer or failed fraud checks.
5.  `completed`: The funds have successfully settled and the net amount is credited to the payee's available balance.

### 4.2 Fee Transparency
Every transaction receipt must present a clear, itemized breakdown to both the payer (Fan) and the payee (Artist/Band):
*   **Gross Amount:** The total amount charged to the fan's payment method.
*   **Platform Fee:** 6% of the gross amount, retained by Crowdbeats for platform maintenance.
*   **Processing Fee:** Payment gateway (Stripe) fees (typically 2.9% + $0.30, depending on region).
*   **Net Amount:** The actual amount credited to the artist's account.

### 4.3 Idempotency Guarantees
*   To prevent duplicate charges, all financial mutations to the backend must include a unique `Idempotency-Key` (e.g., a v4 UUID generated on the mobile client).
*   The backend validates this key. If a request with an existing idempotency key is received, the backend bypasses processing and returns the status of the original transaction.
*   This ensures safe retries in low-connectivity mobile environments.
