# Test Suite Overview

This document covers all test files in the suite **except** `tests/scenarios/CHR/chr_scen01.spec.ts` (New Employee Generation), which has its own detailed documentation in `helpers/hcmHelpers.md`.

---

## Test inventory

| File | Describe block | Status |
|---|---|---|
| `tests/example.spec.ts` | _(none)_ | Playwright scaffold — not HCM-related |
| `tests/smoke/hcm-dashboard.spec.ts` | HCM Dashboard access | Complete smoke test |
| `tests/scenarios/CHR/chr_scen08.spec.ts` | HCM New Employee Generation | Superseded by chr_scen01 — bugs fixed |
| `tests/scenarios/CHR/chr_scen14.spec.ts` | HCM Employee Termination | Complete — happy path + negative test |
| `tests/scenarios/CHR/hrc_scen01.spec.ts` | HCM Pending Worker Creation | Complete — happy path + negative test |
| `tests/scenarios/Recruitment/recr_scen06.spec.ts` | HCM Job Requisition Generation | Complete — happy path + negative test |
| `tests/scenarios/Recruitment/recr_scen20.spec.ts` | Accept Job Offer in HCM | Stub — no form interaction |
| `tests/scenarios/Talent Management/tm_scenpm01.spec.ts` | HCM Employee Check-In | Complete — happy path + negative test |

---

## `tests/example.spec.ts`

**What it is:** Playwright's default generated example file. Tests the Playwright documentation website, not Oracle HCM.

**Status:** Should be removed or moved out of the test run. It navigates to `playwright.dev` which is unrelated to the HCM suite, and it runs on every `npx playwright test` invocation against all configured browsers. It is not broken, but it does not belong here.

---

## `tests/smoke/hcm-dashboard.spec.ts` — HCM Dashboard access

**Purpose:** A minimal smoke test confirming the Oracle HCM environment is reachable and the core navigation elements are present. Useful as a first check before running longer scenario tests.

**What it does:**

1. Navigates directly to the NRC Oracle HCM welcome page URL (hard-coded).
2. Asserts the Oracle Logo Home button is visible.
3. Asserts the "My Client Groups" navigation link is visible.

**Notes and limitations:**

- The URL is **hard-coded** (`ekum-dev1.fa.em2.oraclecloud.com/...`). This will fail silently if the environment changes. It should read from `HCM_BASE_URL` like other tests.
- This test imports from `@playwright/test` directly rather than `authFixture`, so it does **not** navigate to the HCM home page before running. It relies on the `auth.json` storage state (loaded via `playwright.config.ts`) but does its own navigation.
- There are no assertions about the logged-in user or any data, so this test would pass even if the page displayed an error banner, as long as those two elements are present.

---

## `tests/scenarios/CHR/chr_scen08.spec.ts` — HCM New Employee Generation (legacy)

**Purpose:** An earlier, inline version of the "hire a new employee" workflow. Predates the helper-based refactor in `chr_scen01.spec.ts`.

**What it does:**

1. Navigates to the HCM home page and confirms login.
2. Navigates to "My Client Groups" → "Show more quick actions" → "Hire an Employee".
3. Fills the "When and why" fields individually and inline (no shared helpers).
4. Fills first name (`Magma`) and last name (`Lava`).
5. Navigates through "Position Override" and "Assignment" steps.
6. Clicks Submit.

**Relationship to `chr_scen01.spec.ts`:** This file covers the same workflow but without the negative tests, without post-submission verification, and without the cascade-aware LOV handling. It was the original implementation; `chr_scen01.spec.ts` is the refactored replacement.

**Fixes applied:**

- All `scrollIntoViewIfNeeded` calls (lines 39, 108, 127, 136) now include `()`.
- `whyHire` value corrected from `'Hire'` to `'Hire to fill vacant position'` to match `hireDetails.ts`.
- All `waitForLoadState('domcontentloaded')` calls replaced with `'networkidle'` for reliable Oracle SPA synchronisation.

**Recommendation:** Treat this file as a historical reference. `chr_scen01.spec.ts` supersedes it. Exclude from regular runs or delete.

---

## `tests/scenarios/CHR/chr_scen14.spec.ts` — HCM Employee Termination

**Purpose:** Automate the "Terminate Employment" wizard in Oracle HCM. Searches for a specific employee, fills termination details, and submits.

**What it does:**

1. Navigates to "My Client Groups" → "Show more quick actions" → "Terminate Employment" via `scrollIntoViewIfNeeded()` + click (`navigateToTerminateEmployment` helper).
2. Searches for the employee using the `TESTUSER` environment variable, presses Enter, and waits for `networkidle`.
3. **Info to include** — asserts the heading is visible, clicks "Comments and attachments", validates it is enabled, then clicks Continue.
4. **Termination details** — fills Termination Notification Date and Termination Action via `fillCombobox`, validates both fields, then clicks Continue.
5. **Working day and access** — asserts "Revoke User Access" defaults to `"After termination"` (no user action), fills Last Working Day via `fillCombobox`, validates, then clicks Continue.
6. Clicks Submit, waits for `networkidle`, and asserts the Oracle Logo Home link is visible (confirming no error page was shown). Navigates home.

**Environment variables required:**

| Variable | Description |
|---|---|
| `TESTUSER` | Full name or identifier of the employee to terminate |
| `TESTDATE` | Termination date, format `DD-MM-YYYY` |

**Test data** (defined in `TERMINATION` constant at the top of the file):

| Field | Value |
|---|---|
| Termination Action | `Assignment End` |
| Revoke User Access (default) | `After termination` |

**Negative test:** "User cannot proceed past termination details without required fields" — navigates to the termination details step for `TESTUSER`, clicks Continue without filling Termination Notification Date or Termination Action, and asserts a required-field validation message is shown and the date field is still visible.

---

## `tests/scenarios/CHR/hrc_scen01.spec.ts` — HCM Pending Worker Creation

**Purpose:** Create a "Pending Worker" record in Oracle HCM — a pre-hire placeholder for a worker who has been offered a position but not yet started. Validates the record appears in search after submission.

**What it does:**

1. Navigates to "My Client Groups" → "Add a Pending Worker" via `scrollIntoViewIfNeeded()`, then clicks Continue past the intro page (`navigateToWhenAndWhy` helper).
2. Fills the **When and why** step using `fillCombobox` for each field. Fields that may auto-fill or be reset by Oracle's cascade (`Legal Employer`, `Proposed Worker Type`, `Way to Add`) are guarded — they are only re-filled if Oracle left them empty or reset them.
3. Validates all seven fields are intact before proceeding (Oracle can silently reset upstream fields when a cascade completes).
4. Fills **Personal Details**: first name, last name, gender, date of birth.
5. Loops through any remaining wizard steps (Position Override, Assignment, etc.) clicking Continue until Submit becomes available, then submits.
6. Navigates home via the Oracle Logo link and searches for `Magma Lava` to confirm the record was created.

**Environment variables required:**

| Variable | Description |
|---|---|
| `TESTDATE` | Proposed start date, format `DD-MM-YYYY` |
| `BIRTHDATE` | Date of birth for the pending worker, format `DD-MM-YYYY` |

**Test data** (defined in `PENDING_WORKER` constant at the top of the file):

| Field | Value |
|---|---|
| Legal Employer | `Flyktninghjelpen (Norwegian Refugee Council)` |
| Proposed Worker Type | `Employee` |
| Way to Add | `Add Pending Worker` |
| Reason | `New Position` |
| Business Unit | `Cameroon` |
| Position | `ICT Assistant Cameroon Kousseri` |
| First Name | `Magma` |
| Last Name | `Lava` |
| Gender | `Female` |

**Negative test:** "User cannot proceed with missing required fields on When and why" — clicks Continue without filling any fields, asserts a required-field validation message is shown, and confirms `Proposed Start Date` is still visible (no navigation occurred).

**Data concerns:** This test creates a real Pending Worker record in the Oracle HCM instance on every successful run. There is no cleanup step. Running this test repeatedly will accumulate duplicate `Magma Lava` pending worker records. Consider using a unique name per run (e.g. appending a timestamp), or adding a teardown step. The search step uses `.first()` on the result to avoid a strict-mode error if multiple records exist.

---

## `tests/scenarios/Recruitment/recr_scen06.spec.ts` — HCM Job Requisition Generation

**Purpose:** Create a job requisition in Oracle HCM's Recruiting module and verify it is submitted successfully.

**What it does:**

1. Navigates to the Hiring module via the main navigation bar and clicks "Create".
2. **How to start** — sets Create Requisition Using to `Job`, Business Unit to `Iraq`, and Job to `Administration Assistant`. Validates Business Unit after selection.
3. **Basic Info** — no required fields; clicks Continue.
4. **Hiring Team** — fills Hiring Manager (`Thiyagarajah Nadanasabesan`, searched as `Thiyag`) and Recruiter (`Sara Abed`). Validates both fields after selection.
5. **Requisition Structure** — sets Recruiting Type (`Hourly`), Organization (`The Norwegian Refugee Council`), and Primary Location (`Baghdad, Iraq`). Validates Primary Location after selection.
6. **Details** — sets Worker Type (`Employee`), Regular or Temporary (`Open-ended`), Job Type (`Standard`), and Full Time or Part Time (`Full time`).
7. **Posting Description, Offer Info, Attachments** — no required fields; clicks Continue on each.
8. **Configuration** — selects the first available Candidate Selection Process and sets External Application Flow to `External global - ext_global`.
9. **Prescreening Questions** — no required fields; clicks Continue.
10. **Interview Questionnaires** — clicks Add, then Continue.
11. **Background Checks** — clicks Submit.
12. Asserts the job title (`Administration Assistant`) is visible on the confirmation page.

**Test data** (defined in `REQUISITION` constant at the top of the file):

| Field | Value |
|---|---|
| Create Requisition Using | `Job` |
| Business Unit | `Iraq` |
| Job | `Administration Assistant` |
| Hiring Manager | `Thiyagarajah Nadanasabesan` |
| Recruiter | `Sara Abed` |
| Recruiting Type | `Hourly` |
| Organization | `The Norwegian Refugee Council` |
| Primary Location | `Baghdad, Iraq` |
| Worker Type | `Employee` |
| Regular or Temporary | `Open-ended` |
| Full Time or Part Time | `Full time` |
| Job Type | `Standard` |
| External Application Flow | `External global - ext_global` |

**Negative test:** "User cannot proceed with missing required fields on How to start" — clicks Continue without filling any fields on the How to start page, asserts a required-field validation message is shown, and confirms the heading is still visible (no navigation occurred).

**Notes:**

- Navigation to the Hiring module uses the CSS selector `#itemNode_workforce_management_hiring_redwood > .svg-nav` (the module's nav icon in the Oracle sidebar). This is stable as long as the element ID is not changed by an Oracle upgrade.
- Pure-select Oracle JET fields (no free-text input) are opened via `.oj-searchselect-arrow` clicks rather than `fill()`. The specific parent ID is used where available to avoid selecting the wrong arrow on pages with multiple dropdowns.
- The Candidate Selection Process on the Configuration page selects the first available option (`.oj-listitemlayout-textslots > div`). If the list order changes, update this selector to target a named option instead.

---

## `tests/scenarios/Recruitment/recr_scen20.spec.ts` — Accept Job Offer

**Purpose:** Intended to test a candidate accepting a job offer through Oracle HCM.

**Current state:** **Stub.** The test navigates to `HCM_BASE_URL` and asserts that the Oracle Logo Home button is visible — nothing more. The test description (`'Accept Job Offer in HC;'`) has a typo (truncated `HCM`).

**What needs to be built:** Locating an open job offer, navigating through the acceptance flow, and verifying the offer status changes.

---

## `tests/scenarios/Talent Management/tm_scenpm01.spec.ts` — HCM Employee Check-In

**Purpose:** Create a Check-In performance document for the logged-in employee via the "Career and Performance" area.

**What it does:**

1. Navigates to "Career and Performance" via `scrollIntoViewIfNeeded()` + click, then clicks "View performance documents" and confirms the "Performance" heading is visible (`navigateToPerformanceDocuments` helper).
2. Clicks "Add" to open the new performance document form.
3. Selects the "Check-In" template via `fillCombobox` and validates the field value.
4. Fills a timestamped discussion topic (`Playwright Test YYYY-MM-DD HH:MM`) and clicks "Add".
5. Asserts the topic text appears on the page.
6. Clicks "Schedule" and asserts the topic is still visible after `networkidle`, confirming no error occurred.

**Negative test:** "User cannot schedule a check-in without a discussion topic" — selects the Check-In template, skips the topic, clicks Schedule, and asserts the topic field is still visible (Oracle did not advance the form).

**Notes:**

- This test targets the "Me" context (the logged-in user's own performance). The applicable account must have access to "Career and Performance".
- The Schedule assertion checks that the topic text survives the action. If Oracle navigates to a richer success state (e.g. a "Scheduled" badge or meeting confirmation), that element would make a stronger assertion — update after observing the live behaviour.

---

## Common patterns and issues

### Fixed across the suite

**Missing `()` on method calls** — Calls to `.scrollIntoViewIfNeeded`, `.click`, `.clear`, and `expect(...).toBeEnabled` without trailing `()` are a silent no-op in JavaScript/TypeScript: the expression evaluates to the function reference and is discarded without executing. This was present in `chr_scen08`, `chr_scen14`, and `hrc_scen01` and has been corrected in all three files. To prevent recurrence, consider enabling `@typescript-eslint/no-floating-promises` combined with a no-unused-expression lint rule.

**`waitForLoadState('domcontentloaded')` after Oracle interactions** — `domcontentloaded` fires when the initial HTML has been parsed, but Oracle HCM is a single-page application that renders content asynchronously via JavaScript. At `domcontentloaded`, Oracle's components are typically not yet mounted. All occurrences in `chr_scen08` and `hrc_scen01` have been replaced with `'networkidle'`.

### Remaining

**Inline duplication** — Fields like "Legal Employer" and "Business Unit" are filled with hardcoded strings in each test file independently. A central fixture (like `HIRE_DETAILS` in `hireDetails.ts`) or a shared helper reduces the risk of values drifting out of sync across files. This applies to `chr_scen08` and `hrc_scen01`.
