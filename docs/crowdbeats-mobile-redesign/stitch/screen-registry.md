# Crowdbeats Mobile Redesign V2 - Stitch Screen Registry

**Stitch Project ID:** `15796146082333643164`  
**Project Title:** `Crowdbeats Mobile Redesign V2 (Guest, Fan, Solo, Band)`  
**Design System Asset ID:** `assets/158be66c29654dc3a7b1bb7f1613e6ea` ("Obsidian & Clarity")  
**Device Type:** `MOBILE` (390x844 logical pt baseline, responsive down to 360px and up to 430px)  
**Model ID:** `GEMINI_3_8_FLASH`  
**Date Generated:** October 12, 2026

---

## Screen Inventory to Stitch Generation Mapping

| Batch | Screen Name | Inventory IDs | Persona | Stitch Screen ID | Screenshot Resource | Title / Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Batch 1** | Sign In & Universal Onboarding | `AUTH-01`, `ONB-01`, `ONB-02`, `ONB-03` | Guest / Fan / Musician | `4485ca0bf9124dcba39b077e367d94b2` | `projects/15796146082333643164/files/1b6c50c0c9c642a4bbbdca24f24e6800` | High-contrast auth header, Apple/Google social auth, email/password form, dual persona intent selector cards (Music Fan vs. Musician/Band), dominant Electric Purple CTA, and guest discovery bypass. |
| **Batch 2** | Live Music Nearby (Discover) | `DSC-01`, `GST-01`, `DSC-02`, `DSC-03` | Guest / Fan | `4a29ad49f22448859996ff9da1a40faa` | `projects/15796146082333643164/files/dce5ce3a9ac242caae53fdedbe43e2a7` | Location-first live discovery, segmented radius filters, live stage cards (Elena Cruz @ The Blue Note), interactive map preview toggle, and 4-tab FanShell navigation. |
| **Batch 3A** | Tip & Payment Confirmation | `TIP-01`, `TIP-02`, `TIP-04`, `TIP-05` | Fan / Guest (with auth resume) | `ca5f8e01565d4fde9080d6f9774d84db` | `projects/15796146082333643164/files/415e90bef40e44bc97e65c4cc7ed9ae4` | Elena Cruz live set context, quick tip amount pills ($5, $10, $20, custom), transparent fee schedule ($10.00 tip + $0.60 6% platform fee = $10.60 total), Apple Pay / saved card selector, song cheer note input, and 52px dominant 'Send $10.60 Tip' CTA. |
| **Batch 3B** | Tip Sent (Authoritative Receipt) | `TIP-06` | Fan / Guest | `2310da91984f41ecb30a59d7ee64e62a` | `projects/15796146082333643164/files/a164628f2c7a44688d51bcb2dd471e06` | Uber/Lyft receipt elegance: emerald success checkmark, $10.00 Sent header, grouped transaction metadata card (Apple Pay •••• 4242, timestamp, reference ID `cb_tip_8f93b2ec9`, itemized breakdown), follower engagement card, and primary 'Return to Live Session' CTA. |
| **Batch 4** | Fan Activity & Following Feed | `ACT-01`, `SOC-01`, `SOC-02` | Fan | `4b03db4156434caaafeb9b5ee5feac55` | `projects/15796146082333643164/files/4bcf38e7907842259aaaa7be98a17c61` | Segmented 'Live & Following' / 'Tip History' top control, horizontal 'Performing Now' live stories strip with emerald pulses, stage broadcast announcement card from Elena Cruz, and grouped Uber/Lyft activity feed (tip receipts, song requests played, new follows). |
| **Batch 5A** | Creator Studio Hub | `CRS-01`, `CRS-04`, `CRS-02`, `CRS-05` | Solo Musician / Band Creator | `6b600e7e6c944c27bff4394f42d56c62` | `projects/15796146082333643164/files/d3b26977779d4a26afb7530c51c19c4c` | Creator avatar with online status, interactive persona switcher pill (`Solo: Elena Cruz ▾`), Hero 'Go Live' card with prominent Electric Purple CTA, 2x2 performance metrics grid (tips, audience, followers, duration), grouped capability rows (Audience Radar, Setlist Requests, Persistent QR, Stripe Connect, Band Splits, Broadcasts), and 5-tab CreatorShell navigation. |
| **Batch 5B** | Go Live Cockpit (Active Session) | `CRS-06`, `CRS-07`, `CRS-08` | Solo Musician / Band Creator | `92fe82d7cee34fcbbdd115b7779d246f` | `projects/15796146082333643164/files/83d44b93927240d58368a36b410181ac` | High-contrast stage control cockpit: pulsing 'LIVE ON AIR' banner, elapsed session timer (`01:24:18`), $245.00 real-time tip counter, full-screen Stage QR popover button, live audience feed with pinned song request queue ('Midnight Echoes'), performance toggles (requests ON, BLE radar active), and bottom safety controls (Pause Set / End Session). |
| **Batch 6** | Band Roster & Revenue Splits | `BND-02`, `BND-07`, `BND-01`, `BND-03` | Band Founder / Admin | `c1bdaed383fb48f289833bbc330ef824` | `projects/15796146082333643164/files/f3b581c4d9f8437f89503f97ccb911d0` | 'The Midnight Echoes' band identity card with FOUNDER ACCESS tag, emerald '100.0% Total Allocated • Fully Compliant' banner, member roster with individual split controls (Elena Cruz 40%, Marcus Vance 25%, Sarah Chen 20%, Leo Ortiz 15% pending setup), governance rows, and dominant 'Save Split Changes' CTA. |
| **Batch 7** | Account & Settings Hub | `ACC-01`, `ACC-06`, `ACC-08`, `ACC-02` - `ACC-07` | Universal (Fan & Creator) | `d6dd2f8f53fc4c19bb730886d774998a` | `projects/15796146082333643164/files/eb30671db71f4bd3ba5b36638ed5035f` | Comprehensive 8-section settings hierarchy using Uber/Lyft grouped cards: Profile header with verified badge, Account & Security, Payments & Wallet, Creator Payouts & 1099-K Tax Documents, Privacy & Safety (Audience Signals, Location), Preferences (Theme Dark/Light/System, Push Alerts), Support & Legal, and outlined logout / data export actions. |

---

## Download URLs & Cloud Storage Links

### 1. Discover Screen (`4a29ad49f22448859996ff9da1a40faa`)
- **Screenshot URL:** `https://lh3.googleusercontent.com/aida/AEtjO1UlJMoYlozQDug52EdKL8LASIt0xdpdaxp-YWXwS3OR0518UzsB3ccyWX71AWK2FjHaiZTU5gVnTS3rdsrnMSMMZT6up_RX9xhNJ22VhRFdEHPZcAqULLBggzsfvmmCOpDSGRXNo32LwTyMdwyc4kJYLw7URj0TL5SGsMUf590Bgpr2CQqGkxfVyBJJrwhd4ILx1S8-QIvuf13Exiy0fR7KVnK91B1xnfR053f7S2BurMSo7Yz_3RDJ4I3T`
- **HTML Asset:** `projects/15796146082333643164/files/72a71ce017f642ea80720db1457c4439`

### 2. Tip & Payment Confirmation Screen (`ca5f8e01565d4fde9080d6f9774d84db`)
- **Screenshot URL:** `https://lh3.googleusercontent.com/aida/AEtjO1VYAsrvuQahLrq7QH6KJmQU1du7Vdu7Fju0yBFtu3FDsc6nOgNEbGuyHA0V2bNCUGcwZTp8yK70k2XzK3t3A3lWwCYs2E8e27ifeejZoBpPH1nNbXxqUON2y__gnQDUuoFuA4NagsNwidSgygLnwUVerP5HR-4yqVGri6VzO6GUgMK2mnL4st1AlqAj-xXopTMtalxdAoCLxR_e4HMFtRktM2k2ke6O587N-sWHSOK3rxf8gIPeTAiQ_AUK`
- **HTML Asset:** `projects/15796146082333643164/files/94e6f4c0e34f49a283479248a22b5dfc`

### 3. Tip Sent - Receipt Screen (`2310da91984f41ecb30a59d7ee64e62a`)
- **Screenshot URL:** `https://lh3.googleusercontent.com/aida/AEtjO1Xlu7hnHGL8KKEqRudTIWjj682SHlirYc2Sy3glvzLvX9UD3c0a68m4okFZOLzV_XLwMsh2t7Pxwuc_WlsPuvj9OEyA8z_rWcIa7bNVyF5LZa7b9LvoaG_Q5dIn2lD59NLcH0Tv-DV3bZ-5VXyFQDPLdgWCnt_YkgmLmFKP62DGu2fyiXKSjQHuu_oOkHGa3CinlqPBAVZK5eNDPseiZSrVmRXSl7r2Sc3CWAYrEUGAAZYIOXpducDqXbAy`
- **HTML Asset:** `projects/15796146082333643164/files/5f210b164bd24ab79e733a1c5f65755b`

### 4. Creator Studio Hub Screen (`6b600e7e6c944c27bff4394f42d56c62`)
- **Screenshot URL:** `https://lh3.googleusercontent.com/aida/AEtjO1UPHu-X5FH24CRN9Bbs64NzlJTjwS5SkDd_iD6kM6WwOqy7MapdJ6ZQPOK8K9VFuElQOXMq6tbWB6wlF5IY4Z2HIAGVu7zLfT9CweOXiqkzEhS5x4FWMwRxR9gJnh_0AN9X3RiJAoNii-YWU9bPFBAODKHwh1IKzt6xdVAG8T4JRgj3u21yLrPUstxewFtqJh9ZNFnUQ9mRaDKu0lKn7fpKAb5iwVSxLF8yUOUa_j9aeA7LRWd4Gad0hyg`
- **HTML Asset:** `projects/15796146082333643164/files/0bc3453339e2401488a8a9ce67a1bb83`

### 5. Go Live Cockpit Screen (`92fe82d7cee34fcbbdd115b7779d246f`)
- **Screenshot URL:** `https://lh3.googleusercontent.com/aida/AEtjO1WRjCyTFjTVQ26p-35Dty9LTx8js4u9J23CvJfQFT0W58D1-_w441EM_cw-U2RQ3dWXBtDAKmOL4I450dGhwZZp2KDOLWBqM486hCOM0NFr3A0OT7VDzXshpRYgJ_G7HvN_rATuV1eaRbtpcwdQzJf7apEymCncZQitif0Nlxty1ZhArST66AnsM0rK-LR6Tlg5WYW0822oQI8ln3kG3Dg8OTDWlkvXZy7bPCaCPUg2NtZ6bgma3arm-jff`
- **HTML Asset:** `projects/15796146082333643164/files/0c3d11b978714d4fa6a134cb65670e6a`

### 6. Band Roster & Revenue Splits Screen (`c1bdaed383fb48f289833bbc330ef824`)
- **Screenshot URL:** `https://lh3.googleusercontent.com/aida/AEtjO1VA5Zay4E449tmTK0k-z3Xlfjq3bzzJjUGl4JDiqs_ACg4UZKmK50SPjyrdZhlNDMWGTvEoCA85n9fNoWderuoafnkYcRJDf0CLmuUVofS99RbBFFtZnmu7_2mPFOtfOxND7oFB8abEcYcs9G-hR2Vo8Nd70szdicubMBcHVHrIirB7VVQaEFppqHp6pcaoFUFLPkToGOvO-7sr1LCDolBwKqX_A4B10yebhljeGpaM8vEhexjaRFdhtP08`
- **HTML Asset:** `projects/15796146082333643164/files/4d8a124db8254937a4ddf61d8ab9d2d1`

### 7. Account & Settings Hub Screen (`d6dd2f8f53fc4c19bb730886d774998a`)
- **Screenshot URL:** `https://lh3.googleusercontent.com/aida/AEtjO1W3dfmykJequVDG4Bf8R2FByTzZNS1tXrCAPrUnuFKimicVQk3AtFCQEKw6PFrwUho0-j9UM511Hj5NNr7pAy3Iilsxac-RXiFAMX7abwCB_5POlgDe3qgI1HlQyEPrahDbym77mWLncECbN-23Giydw472rz6YZjRzxCgXwIefTtdLw0dziwzCai-sYX_emXolnijYXs9mc07dDKw6w0suZyZ9hPuzqrYsd0L2YWz8dAuXKyHl9P9wylHi`
- **HTML Asset:** `projects/15796146082333643164/files/edc461875e484f359b0afdf947a3aebf`

### 8. Sign In & Universal Onboarding Screen (`4485ca0bf9124dcba39b077e367d94b2`)
- **Screenshot URL:** `https://lh3.googleusercontent.com/aida/AEtjO1V66V4ZWZX8FCfxhQONign7a4m-2tsXDTlRujsjfzJUNvBoVMusDeanSe7cxZZH2ynDqb7vNXVoaeKDT9XnSg4GkpJIbR3M4hkfugphvoaxdX_OZ50T_I1dBlDAaYFGWVYVdqvs2FWXaOeQyYiTn_2Oogfzo9clXEJq6kGkTr5PXBt7GK3g7-Yu-PbOb-iFxN0FL097gDIrJ3rvjM4K_kMbfirKlOzn23O1QuveNGNeBZ4WRVrH9CtE_sE`
- **HTML Asset:** `projects/15796146082333643164/files/f9a390ee0f9a4a4ab5988aad07500c92`

### 9. Fan Activity & Following Feed Screen (`4b03db4156434caaafeb9b5ee5feac55`)
- **Screenshot URL:** `https://lh3.googleusercontent.com/aida/AEtjO1Wfj0qokSom5PPfVMOwmnPlOI96VowYCNMEdih4I7jZZ_dchLxK476PAy4pesrlh_j2qoi9kLFSwhg1RWaWkPatC81iuRvEqkCY9EuI4HBg-OsKO6aCuxEmhUe2ElV4D9-OoFcndmu2qDVSvC45YHjLSrOL0kWsXEhFqr_vKto6egtQ-v9n9HScYHcQ6PQMrY5i0T9aggnh1DqClfKQ5FLe0CHGK4pcgcn4f_jquN9It0zVjuI7R2wldrKF`
- **HTML Asset:** `projects/15796146082333643164/files/c291eea118ef4060b444e3ee5ad8c0de`
