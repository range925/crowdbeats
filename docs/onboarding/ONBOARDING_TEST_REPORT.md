# Crowdbeats V2 — Automated Onboarding Test Report

**Execution Timestamp:** 2026-08-29 19:08:00  
**Environment:** Firebase Functions v2 + Jest + Flutter Analyzer + Next.js Typecheck  

---

## 1. Test Execution Summary

| Suite | Component | Tests Ran | Passed | Failed | Duration |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Jest Unit Tests** | `onboardingLifecycle.test.ts` | 4 | 4 | 0 | 7.07s |
| **Contracts Compiler** | `@crowdbeats/contracts` | Type check & build | PASSED | 0 | 2.15s |
| **Next.js Typecheck** | `apps/web (tsc --noEmit)` | Full app check | PASSED | 0 | 4.82s |
| **Flutter Static Analysis** | `apps/mobile (flutter analyze)` | Static checks | Clean | 0 | 9.40s |

---

## 2. Key Verified Test Cases

1. `validates handle formatting and availability correctly` — **PASSED**
2. `saves onboarding draft state to Firestore` — **PASSED**
3. `completes onboarding for Solo Musician and provisions profiles` — **PASSED**
4. `rejects onboarding completion without required Terms of Service version` — **PASSED**
