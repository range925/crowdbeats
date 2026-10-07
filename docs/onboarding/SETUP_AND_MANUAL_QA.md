# Crowdbeats V2 — Setup, Run Documentation & Manual QA Script

---

## 1. Running the System Locally

1. **Start Mobile / Web Application:**
   ```bash
   cd apps/mobile
   flutter run -d web-server --web-port 8081 --web-hostname localhost
   ```
   Navigate to [http://localhost:8081/#/onboarding](http://localhost:8081/#/onboarding).

2. **Start Next.js Web Application:**
   ```bash
   cd apps/web
   npm run dev
   ```
   Navigate to [http://localhost:3000/onboarding](http://localhost:3000/onboarding).

---

## 2. Step-by-Step Manual QA Script

1. **Step 0 — Welcome:**
   - Verify value statement and click "Create Account".
2. **Step 1 — Auth Method:**
   - Select "Continue with Google" or enter test email.
3. **Step 2 — Legal Eligibility:**
   - Verify that Age, ToS, and Privacy checkboxes start **UNCHECKED**.
   - Check all three boxes and click "Agree & Continue".
4. **Step 3 — Persona Selection:**
   - Verify that no persona is preselected.
   - Tap "Solo Musician" (or "Fan", "Band", "Sponsor") and click Continue.
5. **Step 4 — Identity:**
   - Enter Display Name and optional Handle. Click Next Step.
6. **Persona Steps:**
   - Select genres / stage name / goals.
7. **Review & Completion:**
   - Verify summary card. Tap "Complete Onboarding & Enter Crowdbeats".
   - Confirm successful transition to the selected persona dashboard!
