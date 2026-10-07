# Crowdbeats V2 — Admin Page Information Standards & Metric Rules

**Document Status:** Permanent Architecture Specification  
**Scope:** Universal Standards for Admin Pages, Submenus, Metric Definitions, and State Invariants.

---

## 1. Universal Page Implementation Contract

Every administrative interface must implement the following 26 structural elements:
1. **Page Title:** Clear, consistent, semantic header.
2. **Concise Purpose Explanation:** 1–2 sentence operational description.
3. **Metric Definitions:** Popovers/tooltips explaining exact calculation formulas.
4. **Data Source:** Identification of backing Firestore collection, Cloud Function, or Stripe API.
5. **Last Refreshed Timestamp:** ISO format / relative time display.
6. **Automatic Refresh:** Live Firestore snapshot listener where real-time accuracy is required.
7. **Manual Refresh Button:** Allows instant data re-query.
8. **Filters:** Role, date range, status, and environment filters.
9. **Search Input:** Real-time debounced query filtering.
10. **Sorting:** Multi-column sort with visual directional arrows.
11. **Pagination / Virtualization:** Standard 25/50/100 item pagination or virtualized list.
12. **Loading State:** Shimmer skeletons matching exact card/table geometry.
13. **Empty State:** Contextual empty state illustrations and clear recovery actions.
14. **Offline State:** Network failure banner with offline retry triggers.
15. **Permission-Denied State:** Clean 403 screen with required RBAC role clearly stated.
16. **Partial-Data Warning:** Alert banner when upstream providers are degraded.
17. **Error State:** Redacted error notice with error reference ID.
18. **Retry Behavior:** Instant 1-click retry button.
19. **Saved Views:** Persists active filter preferences in URL search params.
20. **Export Tool:** CSV / JSON export for legally and operationally permissible records.
21. **Row Detail Drawer / Modal:** Slide-out inspection panel for full record attributes.
22. **Action Confirmation Dialog:** Modal confirmation for mutating actions.
23. **Structured Reason Codes:** Mandatory dropdown reason for administrative actions.
24. **Success Confirmation:** Green confirmation snackbars with audit record links.
25. **Failure Recovery:** Guidance and fallback options upon action failure.
26. **Immutable Audit Event:** Automatic write to `/auditEvents` upon any mutation.

---

## 2. Metric Calculation Rules

- **No Invented Values:** Metrics must reflect verified database or Stripe records.
- **Unavailable Behavior:** If upstream data is unreachable, display "Unavailable" with reason and last successful timestamp. Never display zero unless the true value is zero.
- **Timezone Invariant:** All calculations standardize on UTC with optional local browser display.
