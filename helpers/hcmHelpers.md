# CHR Scenario 01 — Test Suite Documentation

## Overview

`tests/scenarios/CHR/chr_scen01.spec.ts` tests the **Hire an Employee** wizard in Oracle HCM Fusion (Norwegian Refugee Council instance). The suite covers one happy-path scenario and three negative tests across the wizard's multi-step form.

All four tests share the same entry point (the "My Client Groups" tab → "Hire an Employee" link) and the same form-filling helpers. Authentication is handled once per test run via a global setup, and the stored session is reused by every test.

---

## Project structure

```
tests/
├── global-setup.ts              # One-time login; saves session to auth.json
├── env.ts                       # TIMEOUTS constants + loginUrl helper
├── playwright.config.ts         # Browser projects, timeout, retries, reporters
├── fixtures/
│   ├── authFixture.ts           # Extended `test` fixture: navigates to HCM home before each test
│   └── hireDetails.ts           # Static test data + getTestDate()
├── helpers/
│   └── hcmHelpers.ts            # Shared form-interaction helpers (see below)
└── tests/scenarios/CHR/
    └── chr_scen01.spec.ts       # The four tests documented here
```

---

## Authentication

### `global-setup.ts`

Runs **once** before the entire test run. It:

1. Reads `HCM_GLOBALHR_USER`, `HCM_GLOBALHR_PASSWORD`, and `HCM_BASE_URL` from the environment (via `.env` file and `dotenv`).
2. Launches a Chromium browser, logs in via the Oracle IDCS sign-in page. The username field is labelled `"Username"` (not `"User ID"` — confirmed by DOM inspection).
3. Waits for the Oracle FA home page (`*.fa.*.oraclecloud.com`) to load as the signal that the full SSO redirect chain completed. A URL check alone is insufficient because the IDCS sign-in page is also on `*.oraclecloud.com`.
4. Saves the browser's storage state (cookies, localStorage) to `auth.json`.
5. Closes the browser.

Every subsequent test loads `auth.json` as its storage state (`storageState: 'auth.json'` in `playwright.config.ts`), skipping the login flow entirely.

**Why this pattern?** Oracle HCM's login flow involves multi-step redirects through IDCS and Okta SAML SSO and can take 15–30 seconds or more. Running it once and reusing the session makes the suite significantly faster and avoids hitting Oracle's rate limits. The trade-off is that if the session expires mid-run, all tests will fail with a redirect error — a re-run (which refreshes `auth.json`) resolves this.

### `fixtures/authFixture.ts`

Extends Playwright's built-in `test` with a custom `page` fixture. Before each test, it:

1. Navigates to `HCM_BASE_URL` (the Oracle HCM home URL from the environment).
2. Clicks the Oracle Logo to reach the authenticated home page.
3. Waits for the "Me" tab to confirm the page is fully loaded.

This ensures every test starts from a known, consistent state regardless of what the previous test did.

---

## Test data

### `fixtures/hireDetails.ts`

```typescript
export const HIRE_DETAILS = {
  legalEmployer: 'Flyktninghjelpen (Norwegian Refugee Council)',
  wayToHire:     'Hire',
  reasonToHire:  'Hire to fill vacant position',
  businessUnit:  'Norway',
  position:      'Donor Service Assistant Norway',
  firstName:     'Magma',
  lastName:      'Lava',
};
```

All string values correspond to exact options in the NRC Oracle HCM instance. The employee name `Magma Lava` is intentionally fictional and already exists as an employee record in the system — this is what makes the duplicate-detection test work without creating a real employee.

### `getTestDate()`

Returns the `TESTDATE` environment variable (format: `DD-MM-YYYY`). This must be set before running the suite. Using an environment variable rather than computing `new Date()` inside the test makes the date predictable and overridable for specific test scenarios (e.g. testing a future hire date).

---

## Configuration

### `playwright.config.ts`

| Setting | Value | Reason |
|---|---|---|
| `timeout` | 400 000 ms (6.7 min) | Oracle HCM's form steps are slow; some cascade loads take 20+ seconds |
| `retries` | 1 | Absorbs transient Oracle slowness without masking real failures |
| `headless` | true | Runs in CI/local without a visible browser window |
| `screenshot` | `only-on-failure` | Saves evidence on failure without cluttering passing runs |
| `video` | `retain-on-failure` | Full video replay available for debugging failures |
| `trace` | `on-first-retry` | Detailed trace (DOM snapshots, network, screenshots) generated on first retry |
| `storageState` | `auth.json` | Reuses the global-setup session for every test |
| `reporter` | `list` + `html` | Console output for CI; browsable HTML report in `playwright-report/` |

### `env.ts` — TIMEOUTS

```typescript
export const TIMEOUTS = {
  SHORT:  2_000,   // ms — wait for a dropdown to populate after typing
  MED:    8_000,   // ms — wait for Oracle to process a field selection
  LONG:  20_000,   // ms — wait for a cascade to load dependent fields
};
```

These are intentionally conservative. Oracle HCM's server-side processing is slow and varies with load. Reducing them speeds up the suite but increases flakiness.

---

## The tests

### Test 1 — "User can hire a new employee" (happy path)

**Goal:** Walk the full wizard from "My Client Groups" through to a successful submission, then verify the new employee record appears in the system.

**Steps:**

1. **Navigation** — Click "My Client Groups" → "Show more quick actions" → "Hire an Employee". Wait for the intro page, then Continue.

2. **Step 2 — Hire Details** — Fill all six required fields using `fillAllHireDetailFields()`. Validate all fields retain their values (Oracle can reset them during cascade loading), then Continue.

3. **Step 3 — Personal Details** — Fill first name (`Magma`) and last name (`Lava`), then Continue.

4. **Steps 4+ — Loop** — Oracle's wizard can have 4–6 steps depending on the position selected. The test loops up to 8 times: if Submit is enabled, click Submit and break; otherwise click Continue. This handles variable step counts without hardcoding the number of steps.

5. **Verification** — After submission, find the new employee's link by name, click it, and confirm the first name, last name, and hire date are visible on the employee record page.

**Why `.first()` on the employee link?** If previous test runs left partial employee records (e.g. after a mid-run failure), Oracle may show multiple "Magma Lava" entries. `.first()` avoids Playwright's strict-mode error when multiple elements match.

---

### Test 2 — "User cannot proceed with missing required fields"

**Goal:** Confirm that clicking Continue without filling any fields shows validation errors and does not advance the wizard.

**Steps:**

1. Navigate to the Hire Details page (same entry path as Test 1).
2. Click Continue without filling anything.
3. Assert that at least one "required" message is visible.
4. Assert that the hire date field is still visible (i.e. the wizard did not advance).

**Why no field filling?** The test is specifically checking that Oracle enforces required-field validation on the client side before allowing navigation to the next step.

---

### Test 3 — "User cannot proceed with an invalid hire date"

**Goal:** Confirm that entering a non-date string in the hire date field triggers a date-format validation error.

**Steps:**

1. Navigate to the Hire Details page.
2. Fill only the hire date field with `'not-a-date'`.
3. Click Continue.
4. Assert that a date-validation error message is visible (matching `/invalid|enter a valid date|not valid|date.*format/i`).
5. Assert that the hire date field is still visible (wizard did not advance).

**Why a regex for the error message?** Oracle HCM's exact error text varies between versions and locales. A regex covering common Oracle date-error phrasings makes the test robust to minor wording changes.

---

### Test 4 — "User is warned when hiring a duplicate employee"

**Goal:** Confirm that Oracle detects when the entered name matches an existing employee record and shows a duplicate warning.

**Steps:**

1. Navigate through Hire Details (same as Test 1 — fills all six LOV fields).
2. On the Personal Details step, enter the name `Magma Lava` — a name that already exists in the system.
3. Click Continue.
4. Assert that a message matching `/duplicate/i` is visible.

**Why `Magma Lava`?** The NRC Oracle HCM instance already has an employee with this name (created in prior test runs). The test intentionally reuses this name to trigger Oracle's duplicate-detection logic without creating a real HR record. No cleanup is needed after the test because the wizard is abandoned before submission.

---

## The LOV cascade problem

The most complex part of the suite is filling the "When and why" fields, specifically `wayToHire` and `businessUnit`. These are **Oracle JET LOV (List of Values) components** that control dependent fields through a cascade mechanism:

```
wayToHire   ──cascade──▶  whyHire
businessUnit ──cascade──▶  position
```

### What a cascade does

Before a cascade fires, the downstream field (`whyHire`, `position`) is a plain HTML text input (`role="textbox"`). After the cascade fires — triggered by a selection in the upstream LOV field — Oracle fetches the relevant options from the server and converts the downstream field into a fully interactive Oracle JET select component (`role="combobox"`).

If `fillCombobox` attempts to fill `whyHire` before the cascade has fired, Playwright's `getByRole('combobox', { name: /Why are you hiring.../ })` finds nothing and times out.

### Why cascade fails in Chromium

Oracle HCM's cascade fires only when a user **physically clicks** an option in the popup dropdown. In **Firefox and WebKit**, keyboard confirmation (Enter) also fires the cascade — likely due to how those engines synthesise change events on Oracle JET components. In **Chromium**, keyboard confirmation does not fire the cascade.

This makes `wayToHire` and `businessUnit` require special handling in Chromium: the test must click the popup option rather than just pressing Enter.

### Why the popup is difficult to click

The popup element for Oracle's LOV fields does not appear in the DOM under the ID that the `aria-controls` attribute promises (`lovDropdown_oj-dyn-form-...-ActionId`). Confirmed by:

- `document.getElementById(ariaControls)` → `null`
- `page.locator('[id="..."]').waitFor({ state: 'attached', timeout: 8s })` → timeout
- Full DOM scan at t=2s after fill: zero elements with `lov*` IDs, zero popup/dropdown class elements, zero text nodes matching the typed value

The popup renders through a mechanism not accessible to standard DOM queries, and disappears quickly (Oracle auto-confirms single-match results almost immediately).

### Current approach in `fillLovWithDropdownDismiss`

1. Scroll the field into view so the popup opens within the viewport.
2. Fill the value.
3. Wait for `aria-expanded="true"` on the combobox element — this signals the popup is open.
4. Immediately coordinate-click at `(combobox.left + 40px, combobox.bottom + 20px)`, the expected position of the first popup option.
5. `page.mouse.click()` generates `isTrusted: true` events (via Chrome DevTools Protocol), which Oracle's cascade handler requires.
6. Wait `TIMEOUTS.LONG` (20s) for the cascade to complete.

If `aria-expanded` never reaches `true` within 5 seconds, the function falls back to keyboard (ArrowDown + Enter + Tab) which sets the field value but does not fire the cascade. The re-fill check loop in `fillAllHireDetailFields` detects and retries any fields that were reset.

**Note:** The `aria-expanded` approach was saved to the codebase but had not been confirmed working at the time of writing. If it also fails, the next diagnostic steps are:
- Scan `page.frames()` — Oracle may render the popup in a dynamically created iframe.
- Install a `MutationObserver` before filling to catch the popup element the instant it is created.
- Examine the Playwright HTML report or trace (`playwright-report/index.html`, or `npx playwright show-trace <trace.zip>`) for a visual recording of what happens on screen during the fill.

---

## Shared helpers (`helpers/hcmHelpers.ts`)

### `fillCombobox`

For Oracle HCM comboboxes that do **not** have cascade dependencies, or for downstream fields that are already comboboxes (after cascade has fired):

1. Types the value into the field.
2. Waits `preWait` (default 2s) for Oracle to populate the dropdown.
3. Optionally presses ArrowDown to navigate to the first matching item.
4. Presses Enter to confirm.
5. Waits `postWait` (default 8s) for Oracle to process the selection.

### `fillLovWithDropdownDismiss`

Private helper used only for `wayToHire` and `businessUnit`. Implements the cascade-aware click strategy described above.

### `fillAllHireDetailFields`

Orchestrates filling all six "Hire Details" fields in dependency order, then runs a re-fill check loop to catch any fields that Oracle silently reset during cascade processing.

### `validateAllHireDetailFields`

Asserts all six fields hold their expected values before clicking Continue. This catches silent Oracle resets that `fillAllHireDetailFields` might miss on its first pass.

### `clickContinue`

Finds the Continue button, scrolls it into view (Oracle's wizard footer can be below the visible area), and clicks it.

### `waitForNextPage`

Waits for `domcontentloaded` then asserts a specific heading is visible. Used when navigating between wizard steps.

### `getHireDetailLocators`

Returns a centralised map of ARIA-role-based locators for the six "Hire Details" fields. Centralising selectors here ensures consistency across all functions that interact with these fields.

---

## Running the suite

```bash
# Run all tests on all browsers
npx playwright test

# Run only Chromium
npx playwright test --project=chromium

# Run a specific test file
npx playwright test tests/scenarios/CHR/chr_scen01.spec.ts --project=chromium

# Run a single test by name
npx playwright test --grep "User can hire a new employee" --project=chromium

# Run without retries (faster diagnostics)
npx playwright test --retries=0 --project=chromium

# Open the HTML report after a run
npx playwright show-report

# View a trace from a failed retry
npx playwright show-trace test-results/<folder>/trace.zip
```

### Required environment variables

| Variable | Description |
|---|---|
| `HCM_BASE_URL` | Full URL of the Oracle HCM Fusion instance |
| `HCM_GLOBALHR_USER` | Username for global HR admin account |
| `HCM_GLOBALHR_PASSWORD` | Password for global HR admin account |
| `TESTDATE` | Hire date to use in tests, format `DD-MM-YYYY` |

These are typically set in a `.env` file at the project root (loaded automatically via `dotenv` in `global-setup.ts`).
