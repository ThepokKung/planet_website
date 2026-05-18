# Website Validation Report — Vertical Forest Dashboard

**Date:** 2026-05-15

---

## Authentication Result

- **Login credentials used:** `superadmin` / `superadmin123`
- **Result:** Login succeeds and creates a valid session (session object returned by `/api/auth/session`).
- **Notes:** The login UI displays a misleading error message on success: the client shows "Cannot connect to server" even though the session is established and protected routes are accessible.

## Tested Routes

- `/login`
- `/dashboard`
- `/analytics`
- `/plants`
- `/system-logs`
- `/settings`
- `/setup`
- `/plant-master`
- `/users`
- `/details/B-N1-1`
- `/api/auth/session`
- `/api/config`
- `/api/logs`

## Passed Checks

- Dashboard loads and displays stats, fleet table, and navigation.
- Analytics page loads; filters (time range, zone) are interactive.
- Plants page lists seeded plant records and row links are clickable.
- System logs page renders empty-state and filters correctly.
- Setup page: Add Pot updates the JSON payload preview correctly.
- Plant Master page: Add New Template opens creation UI.
- Users page: seeded users render; role toggle and zone-selection UI respond.
- Details page (`/details/B-N1-1`): robot overview, history logs and accordions render and respond.
- Settings page: after auth check, password-change form appears and client-side validation works.
- API session endpoint (`/api/auth/session`) returns the correct session object in-browser.

## Failed Checks (Concrete Issues)

1. Login UI shows false network error
   - **Page/route:** `/login`
   - **Action:** Submit login form
   - **Expected:** On successful authentication, user is redirected to `/dashboard` and no error message shown.
   - **Actual:** UI briefly displays "Cannot connect to server. Check your network." even though the session was created and redirect occurs.
   - **Console / Network:** No backend error — session was set.
   - **Suspected root cause:** The client-side form `handleSubmit` treats the server action redirect as an error in the `catch` path or misinterprets the server action response. See [app/login/page.tsx](app/login/page.tsx).
   - **Suggested fix:** Use the server action return contract clearly (avoid relying on thrown redirects in the client handler). Update `loginAction` server code to return a structured success response (or let the client follow a normal form submission) and remove the client-side network error fallback when server actions redirect successfully.

2. Sign out throws ReferenceError and does not clear session
   - **Page/route:** All protected pages (Sidebar Sign Out)
   - **Action:** Click sidebar "Sign Out" button
   - **Expected:** Session cookie cleared and redirect to `/login`.
   - **Actual:** Browser error: `ReferenceError: logoutAction is not defined` and nothing else executes.
   - **Console error:** Shown on click (runtime ReferenceError).
   - **Suspected root cause:** `logoutAction` is referenced but not imported or defined in [components/sidebar.tsx](components/sidebar.tsx).
   - **Suggested fix:** Import and call the correct server/client logout handler or implement a client-side fetch to `/api/auth/logout` that clears the cookie and redirects. Example: import `logoutAction` from `@/actions/auth` (if available) or call an API route that clears the session cookie.

3. Analytics Recharts sizing warnings
   - **Page/route:** `/analytics`
   - **Action:** Open analytics page
   - **Expected:** Charts render without warnings.
   - **Actual:** Recharts prints repeated warnings: `The width(-1) and height(-1) of chart should be greater than 0`.
   - **Console:** Recharts dimension warnings (console.warn)
   - **Suspected root cause:** Chart container may be rendered before layout dimensions are calculated (common with server-rendered layouts or hidden container). See [components/analytics-charts.tsx] (file to inspect).
   - **Suggested fix:** Ensure charts are given an explicit width/height or a stable container size (CSS min-width/min-height), or render charts only on the client after measuring container size (use ResizeObserver or a useEffect to set sizes). Consider using responsive wrappers that delay rendering until mounted.

## Console Errors (collected)
- `ReferenceError: logoutAction is not defined` — click on Sign Out (components/sidebar.tsx).
- Recharts warnings about width/height <= 0 on `/analytics` (components/analytics-charts.tsx).
- Login page initially shows a network/execution error message (client-side UI), though no backend failure.

## API Failures
- `/api/config` returns `401 Unauthorized` when called without `x-api-key` — this is expected for OTA devices.
- `/api/logs` returns `401 Unauthorized` for missing `x-api-key` for POST operations — expected.
- No unexpected HTTP 5xx errors were observed during route sweeps.

## UI/UX Problems
- Misleading error message on login success causes confusion.
- Broken Sign Out prevents users from consciously terminating sessions.
- Analytics chart warnings may indicate visual glitches on small/hidden containers.
- Settings page briefly shows a loader while session is verified (expected), but it resolves correctly.

## Security / Authorization Observations
- Middleware correctly blocks non-public routes and redirects to `/login` when session absent.
- Session cookie content is set and readable by server-side `getSession` endpoints. No unauthorized access discovered during checks.
- The inability to sign out is a session management risk (users can't clear cookies locally via UI).

## Recommendations

### High priority
- Fix Sign Out: import/use a defined `logoutAction` or implement a secure server API to clear the session cookie and redirect. See [components/sidebar.tsx](components/sidebar.tsx).
- Fix login flow UX: remove the false negative error in `app/login/page.tsx` and align client behavior with server action redirects.

### Medium priority
- Fix Recharts sizing in analytics: give charts stable container dimensions or render charts only on client mount. Inspect [components/analytics-charts.tsx].
- Add clearer API docs / runtime checks for `/api/config` and `/api/logs` regarding `x-api-key` usage and allowed methods.

### Low priority
- Improve user feedback for Settings loader (shorter spinner or skeleton content) so the UI appears snappier during session verification.
- Add tests that exercise login → navigation → logout flows to prevent regressions.

---

## Notes & Next Steps
- I did not perform destructive actions (create/modify users, templates, or send robot commands).
- If you want, I can:
  - Patch the two high-priority fixes (`app/login/page.tsx` and `components/sidebar.tsx`) and run the app to verify.
  - Open a PR with the fixes and tests.

---

*(Report generated automatically by an interactive validation run against http://localhost:3000 on 2026-05-15.)*
