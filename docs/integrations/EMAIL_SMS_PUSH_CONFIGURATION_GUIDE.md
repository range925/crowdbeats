# Crowdbeats V2 — Email, SMS & Push Notifications Guide

**Document Status:** Permanent Configuration Guide  
**Dashboard Route:** `/admin/integrations/notifications`  

---

## 1. Multi-Channel Specifications
- **Email (SendGrid/Resend):** Verified DNS with SPF, DKIM, and DMARC. Mandatory 1-click unsubscribe headers in transactional and marketing streams.
- **SMS (Twilio 10DLC):** Registered A2P 10DLC brand campaign. Automated STOP/HELP auto-responders. Explicit affirmative user opt-in required.
- **Push (FCM & APNs):** Authenticated using Apple APNs p8 token. Automated daily cleanup of expired/invalid FCM device tokens.
