# Automated Testing of Oracle HCM
### Norwegian Refugee Council — Test Suite Overview

---

## What is this project?

NRC uses **Oracle HCM** (Human Capital Management) to manage its workforce globally — hiring staff, creating job postings, handling terminations, and tracking performance.

This project is a suite of **automated tests** that check whether Oracle HCM is working correctly. Instead of a person manually clicking through the system before every release or change, a script does it automatically — in minutes, not hours.

---

## What do the tests cover?

Each test simulates a real HR workflow from start to finish:

| Test | What it does |
|---|---|
| **Hire an Employee** | Fills the full hire wizard and confirms the new employee appears in the system |
| **Terminate Employment** | Processes a termination and confirms the correct defaults are applied |
| **Add a Pending Worker** | Creates a pre-hire placeholder and verifies it is searchable |
| **Create a Job Requisition** | Builds a full recruitment request across 10+ form pages and submits it |
| **Employee Check-In** | Creates a performance check-in document and schedules it |

Each test also includes a **negative check** — confirming that Oracle correctly blocks the user when required information is missing. This matters as much as the happy path: a system that accepts incomplete data is just as broken as one that rejects valid data.

---

## Why is this hard?

Oracle HCM was not built with automated testing in mind. Three problems made this significantly more difficult than a typical web application.

### 1. The system is slow by design

Oracle HCM is an enterprise system processing real HR data. After clicking a button, the system can take 20–30 seconds to load the next step. An automated test that does not account for this will fail simply because it moved faster than the system could respond.

**Solution:** Every step waits for the system to signal it has finished loading before the test continues. The suite uses generous wait times calibrated to Oracle's actual response speed in NRC's environment.

---

### 2. Logging in is complicated

Oracle HCM uses a multi-step login process involving two separate identity systems (Oracle IDCS and Okta). Running this login sequence before every single test would be slow and could trigger security lockouts.

**Solution:** The login runs once before the test suite starts and saves the session to a file. All tests then reuse that saved session — the same way a browser remembers you are logged in between visits.

---

### 3. Dropdown fields that talk to each other

Some form fields in Oracle HCM are linked: selecting a value in one field triggers the system to contact the server and update the options available in another field. For example, selecting a **Business Unit** causes the **Position** field to load only positions available in that unit.

This is the most technically complex problem in the suite. Oracle's dropdown components require a genuine mouse click on the popup option to trigger these updates. Keyboard shortcuts — the usual automated testing approach — do not work in Oracle's implementation.

**Solution:** The test waits for a precise signal that the dropdown popup has opened (a change in the field's internal state), then immediately fires a mouse click at the exact screen coordinates where the first option appears. This mimics what a human user does closely enough that Oracle accepts it and updates the dependent fields correctly.

---

## How is the suite structured?

The tests follow a consistent pattern, making them easy to read and extend:

- **Shared login session** — set up once, reused by all tests
- **Test data in one place** — field values (employer names, positions, etc.) defined at the top of each file, not scattered through the code
- **Shared helpers** — common actions like "click Continue" or "fill a dropdown" are written once and reused, so a change to how Oracle works only needs to be fixed in one place
- **Validation at every step** — after filling each field, the test checks the value was accepted before moving on

---

## What happens when a test fails?

Playwright (the testing framework) automatically captures:

- A **screenshot** of the screen at the moment of failure
- A **video recording** of the entire test run
- A detailed **trace** — a step-by-step replay with DOM snapshots and network activity

This means failures are diagnosed from evidence rather than guesswork.

---

## Current status

| Area | Status |
|---|---|
| HR — Hire an Employee | Complete (happy path + 3 negative tests) |
| HR — Terminate Employment | Complete (happy path + negative test) |
| HR — Pending Worker | Complete (happy path + negative test) |
| Recruitment — Job Requisition | Complete (happy path + negative test) |
| Talent — Employee Check-In | Complete (happy path + negative test) |
| Recruitment — Accept Job Offer | Stub — workflow to be built |
| Login automation | In progress — SSO configuration pending |

---

*Generated May 2026 — NRC Oracle HCM Test Suite*
