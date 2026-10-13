import fs from 'fs';
import path from 'path';

const unauthenticatedTests = [
  // 1. Truly public routes (must return HTTP 200 without cookies)
  { path: '/', expectedStatus: 200, label: 'Landing Page' },
  { path: '/discover', expectedStatus: 200, label: 'Live Music Discovery Map' },
  { path: '/tip/art_maya_lin', expectedStatus: 200, label: 'Performer Tip Direct Route' },
  { path: '/artist/maya-lin', expectedStatus: 200, label: 'Solo Artist Public Profile' },
  { path: '/band/the-sunsets', expectedStatus: 200, label: 'Band Public Profile' },
  { path: '/auth', expectedStatus: 200, label: 'Auth Login / Registration' },
  { path: '/legal/terms', expectedStatus: 200, label: 'Terms of Service' },
  { path: '/legal/privacy', expectedStatus: 200, label: 'Privacy Policy' },

  // 2. Protected routes without session (must redirect with HTTP 307 to /auth)
  { path: '/onboarding', expectedStatus: 307, expectedRedirect: '/auth', label: 'Onboarding Gate (Unauthenticated)' },
  { path: '/onboarding/persona', expectedStatus: 307, expectedRedirect: '/auth', label: 'Persona Selection Gate (Unauthenticated)' },
  { path: '/fan', expectedStatus: 307, expectedRedirect: '/auth', label: 'Fan Portal Gate (Unauthenticated)' },
  { path: '/admin/dashboard', expectedStatus: 307, expectedRedirect: '/auth', label: 'Admin Command Center Gate (Unauthenticated)' },
  { path: '/creator/dashboard', expectedStatus: 307, expectedRedirect: '/auth', label: 'Creator Studio Gate (Unauthenticated)' },
  { path: '/sponsor/discovery', expectedStatus: 307, expectedRedirect: '/auth', label: 'Sponsor Suite Gate (Unauthenticated)' },
];

const authenticatedTests = [
  // 3. Onboarding routes with unonboarded user session cookie (must return HTTP 200)
  {
    path: '/onboarding',
    expectedStatus: 200,
    session: { uid: 'u_test_onboarding', personaType: null, emailVerified: true, onboarded: false },
    label: 'Onboarding Consent with Valid Session',
  },
  {
    path: '/onboarding/persona',
    expectedStatus: 200,
    session: { uid: 'u_test_onboarding', personaType: null, emailVerified: true, onboarded: false },
    label: 'Persona Selection with Valid Session',
  },
  // 4. Fan routes with authenticated fan session cookie
  {
    path: '/fan',
    expectedStatus: 200,
    session: { uid: 'u_test_fan', personaType: 'fan', emailVerified: true, onboarded: true },
    label: 'Fan Portal Home with Authenticated Fan Session',
  },
];

console.log("=== PHASE 15: ROUTE & EDGE ROUTE GUARD SMOKE TEST ===");

async function testRoutes() {
  const results = [];
  let allPass = true;

  console.log("\n--- PART 1: UNAUTHENTICATED ROUTE ACCESS & REDIRECT GATES ---");
  for (const t of unauthenticatedTests) {
    const url = `http://localhost:3000${t.path}`;
    try {
      const res = await fetch(url, { redirect: 'manual' });
      let pass = res.status === t.expectedStatus;

      if (t.expectedRedirect && pass) {
        const loc = res.headers.get('location') || '';
        if (!loc.includes(t.expectedRedirect)) {
          pass = false;
        }
      }

      const mark = pass ? 'PASS' : 'FAIL';
      if (!pass) allPass = false;

      const redirInfo = t.expectedRedirect ? ` -> redirects to ${res.headers.get('location')}` : '';
      console.log(`[${mark}] ${t.label} (${t.path}): HTTP ${res.status}${redirInfo}`);

      results.push({
        label: t.label,
        path: t.path,
        status: res.status,
        passed: pass,
      });
    } catch (err) {
      console.error(`[FAIL] ${t.label}: ${err.message}`);
      allPass = false;
      results.push({ label: t.label, path: t.path, error: err.message, passed: false });
    }
  }

  console.log("\n--- PART 2: AUTHENTICATED SESSION ACCESS ---");
  for (const t of authenticatedTests) {
    const url = `http://localhost:3000${t.path}`;
    const cookieVal = encodeURIComponent(JSON.stringify(t.session));
    try {
      const res = await fetch(url, {
        redirect: 'manual',
        headers: {
          Cookie: `__cb_session=${cookieVal}`,
        },
      });

      const pass = res.status === t.expectedStatus;
      const mark = pass ? 'PASS' : 'FAIL';
      if (!pass) allPass = false;

      console.log(`[${mark}] ${t.label} (${t.path}): HTTP ${res.status}`);

      results.push({
        label: t.label,
        path: t.path,
        status: res.status,
        passed: pass,
      });
    } catch (err) {
      console.error(`[FAIL] ${t.label}: ${err.message}`);
      allPass = false;
      results.push({ label: t.label, path: t.path, error: err.message, passed: false });
    }
  }

  const outDir = path.resolve('phase15_release_validation');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'route_smoke_summary.json'), JSON.stringify(results, null, 2));

  if (!allPass) {
    console.error("\nCRITICAL: One or more route smoke checks failed!");
    process.exit(1);
  } else {
    console.log("\nALL 17 ROUTE SMOKE AND ROUTE-GUARD VALIDATIONS PASSED!");
  }
}

testRoutes();
