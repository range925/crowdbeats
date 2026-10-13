# Crowdbeats Mobile Redesign: Profile & Settings Hierarchy (Phase 2)

**Document Status:** Complete & Approved Specification  
**Owners:** UX Coordinator, Auth Lead, Creator/Band Lead  
**Scope:** Fan Profile, Creator Profile, Account Hub, and Complete 8-Section Settings Hierarchy  

---

## 1. Information Architecture & Section Hierarchy

The Crowdbeats settings architecture follows the Uber/Lyft design benchmark: clear grouped list rows, subtle dividers, labeled icons, and unambiguous section headings. Settings are partitioned into **8 explicit top-level sections**:

```
Account Hub (/account or /creator/account)
├── 1. Account & Security
│   ├── Edit Public Profile
│   ├── Email & Password
│   ├── Two-Factor Authentication (2FA)
│   ├── Authorized Devices & Active Sessions
│   ├── Permitted Role Management (Switch Active Context)
│   └── Account Closure & Deactivation
├── 2. Payments (Fan & Creator)
│   ├── Saved Payment Methods (Cards / Apple Pay / Google Pay)
│   └── Default Tipping Currency
├── 3. Creator Payouts (Creator-Only: Solo Musician & Band)
│   ├── Stripe Connect Account Status
│   ├── Payout Schedule & Transfer History
│   └── Tax & Identity Verification Documents (W-9 / 1099-K)
├── 4. Privacy & Safety
│   ├── Location Precision (Precise vs Approximate vs Disabled)
│   ├── Crowd Radar Discoverability Toggle
│   ├── Blocked & Restricted Accounts
│   └── Data Privacy & Export (GDPR / CCPA Download)
├── 5. Notifications
│   ├── Live Performance Stage Alerts
│   ├── Direct Message & Fan Alerts
│   ├── Campaign Milestones
│   ├── Tip & Transaction Receipts
│   └── Email Digests & Push Toggles
├── 6. Preferences
│   ├── Appearance & Theme Mode (System / Light / Dark / OLED Black)
│   ├── App Language Selector
│   └── Text Scaling & Accessibility (Font Multiplier, High Contrast, Reduce Motion)
├── 7. Support
│   ├── Help Center & FAQs
│   ├── Report an Incident / Content Safety
│   └── Contact Support & Live Concierge
└── 8. Legal & Compliance
    ├── Terms of Service
    ├── Privacy Policy
    ├── Platform Fee Disclosure (6% Platform Fee Policy)
    └── Open Source Software Licenses
```

---

## 2. Exhaustive Section Specification & Data Binding Matrix

### Section 1: Account & Security
| Subsection Row Label | Primary Action | Target Route / Modal | Permission / Role | Data Binding | Handlers & Outcomes |
|---|---|---|---|---|---|
| **Edit Public Profile** | Edit avatar, stage name, bio, and handles | `/settings/profile` | Authenticated | `users/{uid}`, `artistProfiles/{id}` | Form validation; writes to Firestore; updates session. |
| **Email & Password** | Update email address or initiate password reset | `/settings/email-password` | Authenticated | `FirebaseAuth.currentUser` | Re-auth prompt; triggers verification email. |
| **Two-Factor Authentication** | Toggle SMS / Authenticator app 2FA | `/settings/security` | Authenticated | `userSettingsProvider.security` | Updates Firestore security settings. |
| **Devices & Active Sessions** | View logged-in devices and revoke sessions | `/settings/sessions` | Authenticated | `userSettingsProvider.activeSessions` | Lists session IDs; "Revoke All Other Sessions" callable. |
| **Permitted Role Management** | Switch between Solo Musician and Band contexts | `/settings/roles` (or Context Pill) | Solo / Band | `creatorContextProvider` | Toggles active creator identity. Prohibits Fan switching. |
| **Account Closure & Deactivation**| Request permanent deletion or soft deactivation | `/settings/close-account` | Authenticated | `requestAccountDeletion` callable | Destructive action confirmation dialog; cleans user data. |

### Section 2: Payments (Fan & Creator)
| Subsection Row Label | Primary Action | Target Route / Modal | Permission / Role | Data Binding | Handlers & Outcomes |
|---|---|---|---|---|---|
| **Saved Payment Methods** | View, add, or remove credit/debit cards | `/settings/payments` | Authenticated | `listPaymentMethods` callable, Stripe SDK | Launches Stripe SetupIntent / PaymentSheet. |
| **Default Tipping Currency** | Select currency for display and tipping (USD, EUR, GBP) | `/settings/currency` | Authenticated | `userSettingsProvider.tipping` | Updates user preference in Firestore and local state. |

### Section 3: Creator Payouts (Solo & Band Only)
| Subsection Row Label | Primary Action | Target Route / Modal | Permission / Role | Data Binding | Handlers & Outcomes |
|---|---|---|---|---|---|
| **Stripe Connect Status** | View onboarding completion & verification state | `/creator/finance/connect` | Solo / Band | `getConnectStatus` callable | Displays "Active", "Restricted", or "Pending Verification". |
| **Payout History & Schedule** | View historical deposits and rolling transfer schedule | `/creator/finance/payouts`| Solo / Band | `payouts` collection query | Displays standard 2-3 business day transfers. No instant claims. |
| **Tax & Verification Documents** | Access W-9, 1099-K, and Stripe Express tax forms | `/creator/finance/documents`| Solo / Band | `createConnectLink` callable | Launches Stripe Express hosted compliance dashboard. |

### Section 4: Privacy & Safety
| Subsection Row Label | Primary Action | Target Route / Modal | Permission / Role | Data Binding | Handlers & Outcomes |
|---|---|---|---|---|---|
| **Location Precision** | Select "Precise (GPS)", "Approximate (City)", or "Disabled" | `/settings/privacy` | Authenticated | `userSettingsProvider.privacy` | Configures Geolocator accuracy and audience signal sharing. |
| **Crowd Radar Discoverability**| Toggle fan presence visibility in venue heatmaps | `/settings/privacy` | Authenticated | `optIntoAggregateAudienceSignal` | Updates fan privacy flag; enforces k-anonymity. |
| **Blocked Accounts** | Manage blocked users and performers | `/settings/blocked` | Authenticated | `listBlockedEntities` callable | Lists blocked IDs with one-tap "Unblock" action. |
| **Data Export (GDPR / CCPA)** | Request complete archive of personal data | `/settings/data-export` | Authenticated | `requestPrivacyExport` callable | Submits export job; sends download link when compiled. |

### Section 5: Notifications
| Subsection Row Label | Primary Action | Target Route / Modal | Permission / Role | Data Binding | Handlers & Outcomes |
|---|---|---|---|---|---|
| **Live Performance Alerts** | Push alert when followed artists Go Live nearby | `/settings/notifications`| Authenticated | `userSettingsProvider.notifications`| Toggles Firestore notification preference flags. |
| **Direct Message Alerts** | Notification when a performer or fan sends a message | `/settings/notifications`| Authenticated | `userSettingsProvider.notifications`| Toggles push notifications for messaging channel. |
| **Tip & Receipt Alerts** | Instant push / email receipt for tips sent or received | `/settings/notifications`| Authenticated | `userSettingsProvider.notifications`| Toggles transaction notification preference. |

### Section 6: Preferences
| Subsection Row Label | Primary Action | Target Route / Modal | Permission / Role | Data Binding | Handlers & Outcomes |
|---|---|---|---|---|---|
| **Appearance & Theme Mode** | Select "System Default", "Light Mode", "Dark Mode", "OLED" | `/settings/appearance` | Authenticated / Guest | `userSettingsProvider.privacy.themeMode` | Instantly switches theme mode and saves to SharedPreferences. |
| **App Language** | Choose language (English, Spanish, French, German) | `/settings/language` | Authenticated / Guest | `userSettingsProvider.accessibility.language`| Updates localization locale. |
| **Accessibility & Text Scaling**| Adjust font scale multiplier (1.0x - 2.0x), High Contrast | `/settings/accessibility`| Authenticated / Guest | `userSettingsProvider.accessibility` | Updates `MediaQuery` textScaler and color contrast tokens. |

### Section 7: Support
| Subsection Row Label | Primary Action | Target Route / Modal | Permission / Role | Data Binding | Handlers & Outcomes |
|---|---|---|---|---|---|
| **Help Center & FAQs** | Search common questions and tipping guides | `/support/faq` | Public | Static / CMS | In-app searchable knowledge base. |
| **Report an Incident** | Report inappropriate conduct, copyright, or fraud | `/support/report` | Authenticated | `submitReport` callable | Opens structured reporting form with evidence attachment. |
| **Contact Support** | Open direct ticket with customer care | `/support/contact` | Authenticated | `updateSupportTicket` callable | Creates support ticket thread. |

### Section 8: Legal & Compliance
| Subsection Row Label | Primary Action | Target Route / Modal | Permission / Role | Data Binding | Handlers & Outcomes |
|---|---|---|---|---|---|
| **Terms of Service** | Read terms of use | `/legal/terms` | Public | Static markdown | In-app readable document viewer. |
| **Privacy Policy** | Read privacy policy and location data disclosures | `/legal/privacy` | Public | Static markdown | In-app readable document viewer. |
| **Platform Fee Disclosure** | Transparent breakdown of 6% platform fee & Stripe fees | `/legal/fees` | Public | Static markdown | Explains fee allocation, payout timing, and creator nets. |
| **Open Source Licenses** | View Flutter and package attribution licenses | `/legal/licenses` | Public | Flutter `LicensePage` | Standard platform license explorer. |
