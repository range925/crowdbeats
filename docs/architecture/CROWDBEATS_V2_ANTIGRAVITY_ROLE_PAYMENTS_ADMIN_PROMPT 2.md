# Crowdbeats V2 — Antigravity Role, Payments, Payouts, Profiles, and Admin-Finance Prompt

## Copy everything below into Google Antigravity

Improve the real Crowdbeats V2 Flutter mobile application, Next.js website, Firebase backend, Stripe integration, and admin portal. This is an implementation and verification task—not a mockup, placeholder-menu, or documentation-only task.

Use the existing Crowdbeats V2 clean-room architecture and the authoritative Stitch project at:

`https://stitch.withgoogle.com/projects/5326179813018056505`

Do not import or reuse old Crowdbeats repositories, folders, Firebase projects, credentials, schemas, or designs. Preserve the current approved V2 work and do not deploy to staging or production without explicit approval.

## Primary outcome

Implement an enforceable role system, secure fan payment methods, Stripe Connect onboarding and payouts for eligible musicians, complete financial observability for authorized administrators, editable user profiles, and safe profile-image uploads.

Every screen, menu, submenu, card, filter, chart, action, export, and button introduced by this task must use live authorized data or an explicitly labeled empty state. Do not create dead links, decorative controls, simulated values, fake success messages, or client-only permissions.

## 0. Public guest experience and authentication boundaries

Crowdbeats must support a useful, clearly identified **Guest** mode for people who have not created an account or signed in. Guest is an unauthenticated access state, not a selectable account role, not a hidden Fan account, and never an administrator or creator identity.

### Guest bottom navigation

Show exactly three bottom-navigation destinations in Guest mode:

1. **Nearby** — the default Guest home screen, containing location search, a compact Google Map, nearby performers, popular performers, and suggestions.
2. **Discover** — public discovery by performer or Band name, genre, city/region, live/upcoming status, and other approved public filters.
3. **Account** — a simple Guest account screen with **Create account** and **Sign in**, plus public Help, Terms of Service, and Privacy Policy links.

Do not show Activity, Wallet, Campaigns, Earnings, Payouts, Messages, Saved items, Band management, profile editing, or any authenticated navigation item to a Guest. After authentication, replace the Guest navigation with the correct role-authorized navigation; do not merely hide unauthorized screens while leaving their routes callable.

### Guest Nearby home screen

The Guest’s initial route on mobile and responsive web must be the Nearby screen. Compose it in this order:

1. a compact Crowdbeats header with clear **Create account** and **Sign in** entry points that do not obstruct browsing;
2. an accessible location search field labeled **Search city, town, venue, or area**;
3. Google Maps Places Autocomplete (New) predictions while typing;
4. a compact interactive Google Map directly below the search field;
5. exactly three **Nearby musicians** cards;
6. exactly three **Popular on Crowdbeats** cards;
7. exactly three **Suggested for you** cards using non-sensitive guest context;
8. a **See all** action for each section that opens the appropriate public Discover result list.

“Musician” in these three sections means an eligible, published Solo Musician or Band profile. Use a visible type label so a Guest can distinguish **Solo Musician** from **Band**. Never show drafts, suspended accounts, unapproved claims, private profiles, failed moderation, incomplete profiles that are not publishable, or Stripe verification details.

The screen must remain useful when fewer than three qualifying profiles exist. Show only real qualifying profiles and a polished truthful empty state; never duplicate profiles or fabricate cards to reach three.

### Location and Google Maps behavior

Do not request device location immediately on app launch. The initial state must explain that the Guest can search manually or choose **Use my location**. Only trigger the operating-system permission prompt after that explicit action. Guest browsing must still work when location permission is denied, unavailable, approximate, or revoked.

Use Google Maps Platform and Places Autocomplete (New) correctly:

- use the supported Maps and Places SDK/widget for Flutter, iOS, Android, and web where available;
- use a unique Autocomplete session token per search session when the selected implementation requires it;
- debounce input, cancel stale requests, and request only fields the UI actually needs;
- bias results to the visible map viewport or selected region without silently restricting valid results;
- store a selected Google Place ID where allowed instead of caching prohibited Places content;
- display all required Google Maps and third-party attributions and never hide map attribution;
- use different API keys for web, Android, iOS, and trusted server usage as appropriate;
- restrict every key by its application and only the required Maps/Places APIs;
- keep server-side keys and signing secrets out of client code and source control;
- add quotas, budget alerts, usage monitoring, abuse detection, and graceful quota/error states.

Selecting an autocomplete prediction must recenter the compact map, update the public search area, and refresh the three content sections without a full-page reload. Map-marker selection and card selection must stay synchronized. Cluster overlapping markers at broader zoom levels and ensure map controls, markers, cards, and result lists are accessible by keyboard and screen reader.

Never expose a musician’s home address, private rehearsal address, or precise non-public coordinates. Query only publishable performance/service locations using server-approved geospatial indexes. Display rounded distance or a public city/area—not private coordinates. Do not retain a Guest’s precise location longer than required to fulfill the nearby request, and do not put it in analytics, logs, URLs, or advertising profiles.

### Ranking rules for the three Guest sections

- **Nearby musicians:** return the three closest eligible, published Solo Musician/Band profiles within the configured radius, subject to safety, moderation, and availability rules. Define deterministic tie-breaking and expand the radius progressively when necessary.
- **Popular on Crowdbeats:** return three eligible profiles using a documented, abuse-resistant popularity score based on approved aggregate signals and a defined time window. Exclude fraudulent or manipulated activity. Clearly label paid placement as sponsored and do not mix it invisibly with organic popularity.
- **Suggested for you:** because a Guest has no account profile, use only the manually selected area, current public browsing session, selected genres/filters, time, availability, diversity/fairness rules, and approved non-sensitive context. Do not claim personal recommendations, create a shadow profile, or infer protected characteristics. Rename this section to **You may like** if that is more truthful for an unauthenticated visitor.

Document every ranking input, filter, fallback, cache lifetime, data freshness rule, and moderation exclusion. Add admin controls to inspect ranking health and eligibility without letting staff secretly rewrite engagement history.

### Public performer and Band profiles

Guests may open eligible public Solo Musician and Band profiles from the map, markers, cards, Discover results, and shared links. Public profiles may show only approved public fields such as:

- public stage/Band name and approved profile image;
- Solo Musician or Band label;
- verified/public badges only when the underlying status is truly earned and current;
- public biography, genres, public city/region, approved media, and social links;
- public live/upcoming appearances and campaigns when publication policy permits;
- a prominent **Tip** action;
- public reporting/help entry points.

Never send private profile fields to the Guest client and then hide them with CSS. Public APIs, Firestore rules, Storage rules, serializers, caches, search indexes, and server responses must return only approved public fields.

### Tip authentication gate and intent restoration

A Guest may view the **Tip** button but cannot create a PaymentIntent, attach a payment method, or submit a tip while unauthenticated. When a Guest taps **Tip**:

1. open a premium, accessible authentication gate explaining: **Create an account or sign in to tip this musician securely**;
2. provide **Create account**, **Sign in**, and **Not now**;
3. support the approved Google, Apple, and email authentication choices from Crowdbeats onboarding;
4. preserve only a signed/validated return destination and public recipient identifier—not an amount, card, secret, or trusted payment state supplied by the Guest client;
5. after successful authentication and authorization, return the user to the selected Solo Musician or Band Tip flow;
6. require the authenticated user to review or enter the tip amount and confirm payment before trusted server code creates the financial operation;
7. if authentication is canceled or fails, return to the same public profile without losing safe browsing context;
8. prevent open redirects, recipient substitution, replay, duplicate payment creation, and stale intents.

Do not force signup merely because a Guest opens a profile, moves the map, searches, changes filters, or browses the three sections.

### Protected creation and account actions

Guests must not be able to create, edit, submit, publish, join, claim, fund, manage, or administer any of the following without first creating an account or signing in and then passing the applicable role authorization:

- Solo Musician profiles;
- Bands or Band memberships;
- campaigns, rewards, updates, or campaign applications;
- tips or other payments;
- saved payment methods or wallet settings;
- follows, favorites, messages, reports requiring an account, or private activity history;
- payout accounts, withdrawals, fees, splits, or financial settings;
- venues, sponsorships, contracts, staff access, or administrative functions.

Authentication alone is not authorization. After sign-in, enforce the canonical role transition and permission rules in this document. A signed-in Fan still cannot create a Solo Musician profile or Band. A Guest cannot bypass the restriction by calling an API directly, changing a route, modifying local state, reusing a deep link, or manipulating Firebase requests.

### Guest analytics, abuse prevention, and accessibility

Use a rotating, privacy-reviewed session identifier only when necessary for product analytics and abuse protection. Do not create a persistent cross-device Guest identity or store precise location/search history without approved consent and disclosure. Track privacy-safe aggregate events such as Guest Nearby viewed, autocomplete selected, performer profile opened, Tip gate shown, authentication started/completed/canceled, and protected action denied. Never include raw search text, exact coordinates, email, name, payment information, or authentication tokens.

Rate-limit public profile, search, map-data, autocomplete-proxy, and authentication-gate endpoints. Protect public data from scraping, enumeration, excessive map cost, and denial-of-service behavior without blocking ordinary browsing. Provide accessible loading, skeleton, no-results, denied-location, offline, quota, retry, and degraded-map states. When the map cannot load, retain a functional list-based public discovery experience.

## 1. Canonical Crowdbeats identity and role model

One human must have one Firebase Authentication UID. Do not create a second Firebase identity when that person joins a band, leaves a band, links another sign-in provider, or creates an additional eligible musician profile.

Model the system as:

- **Fan account** — a consumer/supporter account that can discover, follow, tip, donate, pay, receive receipts, and manage its own profile and payment methods.
- **Musician account** — an eligible creator identity that may have a Solo Musician profile, one or more authorized Band memberships, or both.
- **Band profile** — an organization/profile managed by verified human musician accounts with membership roles such as owner, manager, member, or authorized representative. A band must not be treated as an unaudited shared login.
- **Administrator/staff account** — an invitation-only, separately protected account with granular permissions. Admin must never appear as a public signup choice.

### Required transition policy

Enforce this exact user-facing transition matrix on the server and in the UI:

| Starting state | Requested state | User self-service result |
| --- | --- | --- |
| Fan | Solo Musician | Denied |
| Fan | Create or join Band | Denied |
| Fan | Fan | Allowed |
| Solo Musician | Create a Band | Allowed after required authorization checks |
| Solo Musician | Join an existing Band | Allowed through invitation/request and acceptance workflow |
| Solo Musician | Remain Solo while joining a Band | Allowed |
| Band member | Create or retain a Solo Musician profile | Allowed |
| Band member | Leave a Band | Allowed unless ownership/contract/payout obligations require a safe transfer or review |
| Band owner/manager | Leave or remove own last ownership role | Block until ownership and financial responsibilities are transferred safely |
| Musician | Fan-only account | Do not silently downgrade; require a dedicated reviewed closure/downgrade workflow that resolves balances, payouts, campaigns, disputes, tax records, memberships, and retention duties |

A Fan must not be able to change a client field, call a Firebase endpoint, manipulate a route, or modify a token to become a Solo Musician or Band member. Firestore rules and trusted server code must deny these attempts.

An authorized administrator may correct or change a user’s platform role only through a protected workflow. This is not an unrestricted database edit. Require:

- a specific staff permission such as `users.roles.manage`;
- recent reauthentication and MFA where supported;
- selected reason code plus required written explanation;
- review of active transactions, disputes, campaigns, balances, memberships, payouts, tax/retention obligations, and sanctions;
- confirmation dialog showing exact before/after access changes;
- append-only audit record containing actor, subject, before/after state, reason, timestamp, request/correlation ID, and source;
- notification to the affected user;
- optional two-person approval for high-risk changes;
- automatic rollback or a recoverable remediation path when dependent operations fail.

An admin role change must never mark a user as Stripe-verified, fabricate a Connect account, enable payouts, erase financial records, change ownership of money, or bypass legal/compliance requirements.

## 2. Fan payment-method experience

Fans may pay Solo Musicians and Bands through supported Crowdbeats payment flows. Implement a real **Wallet & Payment Methods** section for Fans.

Use Stripe Customer objects and Stripe’s supported mobile/web payment UI. Use SetupIntents or the current Stripe-recommended equivalent for saving a reusable payment method. Explicitly collect the Fan’s consent to save and reuse the method under the disclosed terms.

Fans must be able to:

- add more than one supported card;
- see safe display metadata only: brand, last four digits, expiration month/year, and Stripe-provided wallet/type label when available;
- select a default saved payment method;
- change the default;
- remove an eligible saved method after confirmation;
- replace an expired or failed method;
- use Google Pay or card when supported by the device, browser, country, currency, and Stripe configuration;
- understand when a wallet is available only at checkout and cannot be stored as a reusable Crowdbeats default in the same way as a saved card;
- receive clear authentication, decline, offline, duplicate-submit, canceled-wallet, and retry states;
- view and download Crowdbeats receipts for completed payments.

Never store or log raw primary account numbers, full card numbers, CVC/CVV, wallet tokens, cryptograms, full billing credentials, or Stripe client secrets in Firestore, logs, analytics, support tickets, exports, or admin screens. Store only Crowdbeats-to-Stripe identifiers and safe display metadata when necessary. The secret Stripe key must remain server-side in approved secret management.

All PaymentIntent and SetupIntent creation, amount calculation, recipient selection, currency, platform fee, transfer configuration, metadata allowlist, and idempotency keys must be created or validated by trusted server code. Never trust a client-supplied amount, recipient, fee percentage, role, or payment status.

## 3. Musician Stripe Connect verification and withdrawals

Only verified Solo Musicians and eligible Band payout representatives may access payout setup or withdraw available funds. Fans must never see or call payout-account or withdrawal endpoints.

Use Stripe Connect hosted or embedded onboarding to collect identity, business, tax, representative, bank-account, and supported debit-card payout information. Do not build Crowdbeats text fields that directly collect raw routing numbers, account numbers, debit-card numbers, identity documents, Social Security numbers, or tax IDs.

The musician payout flow must be:

1. User selects **Set up payouts** or **Start earning**.
2. Trusted backend confirms the user is an eligible Solo Musician or authorized Band payout representative.
3. Backend creates or retrieves exactly one appropriate Stripe connected account and stores only its Stripe ID plus safe status fields.
4. User completes Stripe Connect onboarding.
5. Signed Stripe webhooks synchronize `details_submitted`, requirements, capabilities, charges eligibility, payout eligibility, disabled reason, and external-account status.
6. Crowdbeats displays a plain-language state: Not started, Information required, Under review, Restricted, Verified for payments, Verified for payouts, or Action required.
7. Withdrawal controls remain disabled until Stripe reports the required payout capability/status and Crowdbeats confirms available funds and no applicable hold.
8. Payout request is created server-side with idempotency, available-balance validation, risk/hold checks, audit logging, and user confirmation.
9. Webhooks update pending, in transit, paid, failed, canceled, reversed, or returned states.

Support bank accounts and eligible debit cards only when Stripe supports that payout method for the connected account’s country, currency, account configuration, and platform settings. Do not promise Instant Payouts or debit-card payouts universally. Show Stripe-provided eligibility and fee information before confirmation.

For Band funds, do not allow a single member to redirect the Band’s payout destination or alter member splits unless that person has the required Band permission and every required approval is recorded. Preserve historical splits and ledger allocations; never rewrite past transactions when a future split changes.

## 4. Financial ledger, receipts, and reconciliation

Stripe is the payment processor/source of truth for processor state. Crowdbeats must maintain its own append-only, double-entry-style operational ledger or equivalently auditable financial subledger for platform reporting and reconciliation. Never calculate financial truth solely from client UI state or mutable profile documents.

For every money movement, preserve links among the relevant Crowdbeats and Stripe objects, including when applicable:

- Fan payer UID and Stripe Customer ID;
- Solo Musician or Band beneficiary ID and connected-account ID;
- PaymentIntent, Charge, Balance Transaction, Transfer, Application Fee, Refund, Dispute, Payout, and external receipt/reference IDs;
- gross amount, currency, Stripe fee, Crowdbeats platform fee, net amount, recipient allocation, refund amount, disputed amount, and payout amount;
- status history and authoritative timestamps;
- campaign, tip, event, venue, band split, promotion, or other business context;
- webhook event ID, API version, livemode/test-mode flag, idempotency key, reconciliation status, and audit correlation ID.

Process Stripe webhooks through one verified, replay-safe ingestion system. Verify signatures against the raw request body, reject stale/invalid signatures, store the Stripe event ID for deduplication, make handlers idempotent, queue retryable processing, quarantine poison events, and alert on repeated failures. A webhook must update state; it must not create duplicate revenue, refunds, transfers, receipts, or ledger entries.

Reconcile Crowdbeats records against Stripe balance transactions and reports at least daily, with on-demand reconciliation for authorized finance staff. Display mismatches without silently correcting them. Corrections require a traceable adjustment entry; never delete or overwrite the original financial event.

Generate immutable receipt snapshots for successful Fan payments and refunds. Receipts must show the legally approved merchant/platform identity, date, amount, currency, musician/band recipient, payment-method safe descriptor, Crowdbeats reference number, Stripe receipt link when applicable, refund history, and support/contact details. Never expose another user’s personal or financial data.

Apply documented retention and deletion rules. Account deletion must not erase records Crowdbeats is legally or contractually required to retain; instead separate/de-identify personal profile data where permitted and retain protected financial/audit records under an approved retention schedule.

## 5. Complete admin financial control plane

Audit the existing Crowdbeats admin navigation and ensure the following finance areas exist, are permission-gated, use real data, and have working detail pages:

1. Finance command center
2. Gross payment volume
3. Tips and supporter payments
4. PaymentIntents and Charges
5. Stripe connected accounts
6. Connected-account requirements and restrictions
7. Musician and Band balances
8. Transfers and Band split allocations
9. Payouts and withdrawals
10. Payout destinations—safe metadata/status only
11. Crowdbeats platform fees
12. Stripe processing and payout fees
13. Refunds and partial refunds
14. Disputes, evidence deadlines, and outcomes
15. Failed, canceled, blocked, and abandoned payments
16. Reserves, holds, negative balances, and risk reviews
17. Receipts and transaction documents
18. Daily reconciliation
19. Reconciliation exceptions and manual adjustments
20. Webhook health, retries, duplicates, and dead-letter events
21. Tax-reporting status and export links where applicable
22. Financial exports and scheduled reports
23. Immutable finance audit log
24. Configuration and fee-policy history

Finance overview cards must include clearly defined, currency-safe metrics such as gross volume, refunds, disputes, Stripe fees, Crowdbeats fees, creator net, pending balance, available balance, payouts in transit, failed payouts, unreconciled items, and webhook failures. Do not combine different currencies into a misleading total. Provide date, currency, recipient type, recipient, location, campaign/event, status, test/live mode, and Stripe-object filters.

Charts must include accessible table alternatives, labeled axes, date ranges, timezone, currency, data freshness timestamp, empty state, and metric definitions. Recommended charts include payment volume, Crowdbeats revenue, creator net, refunds, dispute rate, payout success/failure, Stripe fees, reconciliation exceptions, and webhook processing health.

Every transaction detail drawer/page must show a safe end-to-end timeline from payment creation through charge, fee, transfer, refund/dispute, and payout. Provide direct Stripe Dashboard links only to staff with the appropriate permission. Never expose secret keys or raw sensitive payment data.

Implement least-privilege admin permissions such as:

- `finance.view_summary`
- `finance.view_transactions`
- `finance.export`
- `finance.reconcile`
- `finance.adjust_ledger`
- `refunds.create`
- `payouts.view`
- `payouts.hold`
- `payouts.release`
- `stripe.accounts.view`
- `stripe.accounts.remediate`
- `users.view`
- `users.edit_profile`
- `users.roles.manage`
- `bands.memberships.manage`
- `audit.view`

Separate view, export, initiate, approve, and execute permissions. Require step-up authentication and two-person approval for high-value refunds, ledger adjustments, payout releases, payout-destination remediation, role changes affecting money, and other configured high-risk operations.

Administrators may edit permitted Fan, Solo Musician, and Band profile fields, but must see the before/after comparison, supply a reason, and generate an audit entry and user notification. Administrators must not edit passwords, raw authentication credentials, raw card/bank details, Stripe verification evidence, immutable ledger facts, historical receipts, or completed financial events.

## 6. Full admin-menu verification

Do not limit the audit to finance. Verify that the complete Crowdbeats admin control plane has functional sections for:

- Command Center
- CRM & Users
- Artists & Bands
- Band Memberships and Claims
- Campaigns & Escrow/Restricted Funds
- Live Stages & Sets
- Finance & Ledger
- Platform Fees & Splits
- Sponsors & Match Pools
- Venues & Geofences
- Growth & Marketing
- Community & Fans
- Trust & Safety
- Compliance Overview
- Legal Documents and policy-version publishing
- Stripe Compliance
- Support & Refunds
- Content Moderation
- Enterprise Analytics
- Integrations & APIs
- Platform Configuration
- Staff, Roles, Permissions, and approval policies
- System Health, Jobs, Logs, Webhooks, and Audit

For each menu and submenu, document its purpose, required permission, data source, filters, summary cards, charts/tables, detail views, edit actions, confirmation requirements, audit events, success/error states, and test coverage. Remove or finish any placeholder. An empty dataset must show a useful empty state, never fabricated business data.

## 7. Profile editing and image uploads

Fans, Solo Musicians, and authorized Band managers/members may edit only the profile fields allowed by their role and Band permissions. Administrators with `users.edit_profile` may edit approved fields through the audited admin workflow.

All three profile types must support a profile image. Accept only:

- `.png`, `.jpg`, or `.jpeg` filenames;
- MIME types `image/png` or `image/jpeg` after server-side content inspection;
- files strictly smaller than 1,000,000 bytes.

Do not trust the filename extension or client MIME type. Validate magic bytes/content server-side, reject polyglot or malformed files, strip metadata including EXIF/geolocation, normalize orientation, re-encode into safe derivatives, limit pixel dimensions/decompression, use randomized object names, and scan/moderate according to the approved safety policy. Provide preview, crop, replace, remove, upload progress, retry, and accessible error states.

Store original uploads only if the approved retention/design requirements require them. Otherwise keep safe generated derivatives. Enforce ownership, role, and Band-management authorization in Storage Rules and trusted backend code. Prevent public directory listing and cross-user overwrite. Deleting/replacing a photo must clean up obsolete objects safely without breaking audit or moderation holds.

## 8. Required Stripe event coverage

Use the project’s canonical Stripe webhook specification and verify coverage for the object lifecycles Crowdbeats actually enables. At minimum, assess and implement the relevant events for:

- `payment_intent.*` success, failure, cancellation, processing, and required-action states;
- `charge.*`, refunds, and disputes;
- `customer.*` and saved PaymentMethod attachment/detachment changes needed by the wallet UI;
- `account.updated` and connected-account requirement/capability changes;
- connected external-account changes;
- `transfer.*` including reversals;
- `payout.*` including paid, failed, canceled, and updated states;
- `application_fee.created`;
- `application_fee.refunded`;
- `application_fee.refund.updated`;
- balance availability and reconciliation-relevant events.

Do not subscribe blindly to every Stripe event. Subscribe only to events required by the enabled integration, document why each event exists, pin and test the intended API version, and maintain a change-review process when Stripe versions or enabled products change.

## 9. Security and testing acceptance criteria

Implement automated unit, component/widget, integration, Firebase Emulator, Stripe test-mode, security-rule, and end-to-end tests proving:

1. Fan cannot self-transition to Solo Musician or Band through UI, API, rules bypass, or manipulated token.
2. Solo Musician can create/join a Band through the approved workflow.
3. Band member can retain/create a Solo profile and leave safely.
4. Last owner cannot abandon a Band with unresolved ownership or financial duties.
5. Admin role corrections require correct permission, reason, reauthentication, audit, and notification.
6. Admin role changes cannot bypass Stripe verification or alter historical money records.
7. Fan can add multiple cards, give save consent, choose/change a default, delete an eligible method, and use supported wallets.
8. No raw card, CVC, bank, wallet-token, identity-document, or secret-key data reaches Firebase, logs, analytics, exports, or admin UI.
9. Fan cannot access payout endpoints.
10. Unverified musician cannot withdraw.
11. Verified eligible musician can request a valid payout within available balance.
12. Band payout permissions and split approvals are enforced.
13. Duplicate/replayed webhooks produce one financial result.
14. Refunds, disputes, transfers, application fees, and payouts reconcile correctly.
15. Every admin menu, submenu, action, filter, card, chart, export, and tooltip has functional behavior and permission tests.
16. Profile image accepts valid PNG/JPEG below the limit and rejects oversize, spoofed, malformed, unauthorized, or dangerous uploads.
17. Cross-user and cross-Band reads/writes are denied.
18. Test-mode and live-mode data can never be mixed.
19. Receipts and exports are accurate, authorized, and privacy-safe.
20. Accessibility, keyboard, screen-reader, responsive-layout, loading, empty, error, retry, and offline states pass review.
21. Guest launches into Nearby and sees exactly Nearby, Discover, and Account in bottom navigation.
22. Guest can search with Places Autocomplete, use or deny location, interact with map/list results, and open only approved public profile data.
23. Nearby, Popular, and Suggested sections return at most three distinct real eligible profiles each, with truthful fewer-than-three and empty states.
24. Guest Tip opens the authentication gate; canceled authentication safely restores the profile; successful authentication restores the recipient but does not submit or duplicate a payment.
25. Guest cannot create profiles, Bands, memberships, campaigns, payments, wallet records, or financial resources through UI, deep links, direct APIs, or manipulated Firebase requests.
26. Maps/Places keys are correctly separated and restricted, required attribution remains visible, stale autocomplete requests are canceled, and map failure preserves list discovery.

## 10. Required deliverables

Before implementation, provide:

- current-state audit;
- canonical role/transition matrix;
- payment-versus-payout data-flow diagram;
- Firestore/Storage model and security-rule plan;
- Stripe object and webhook mapping;
- admin menu/permission matrix;
- financial ledger and reconciliation design;
- migration and rollback plan.

After implementation, provide:

- files and schemas changed;
- working routes, menus, and components;
- Firestore and Storage rules;
- Cloud Functions/server endpoints;
- Stripe test-mode configuration and webhook coverage;
- tests run with exact results;
- screenshots for the Guest Nearby/Discover/Account experience, Guest profile and Tip authentication gate, Fan wallet, musician verification/payouts, admin finance, transaction timeline, role management, and image upload states;
- accessibility results;
- remaining legal, compliance, product, or production blockers.

Do not deploy to staging or production. Stop after verified development implementation and request explicit approval.
