import { test, expect } from '../../../fixtures/authFixture';
import type { Page } from '@playwright/test';
import { TIMEOUTS } from '../../../env';
import { fillCombobox, clickContinue } from '../../../helpers/hcmHelpers';

const PENDING_WORKER = {
  legalEmployer: 'Flyktninghjelpen (Norwegian Refugee Council)',
  workerType:    'Employee',
  wayToAdd:      'Add Pending Worker',
  reason:        'New Position',
  businessUnit:  'Cameroon',
  position:      'ICT Assistant Cameroon Kousseri',
  firstName:     'Magma',
  lastName:      'Lava',
  gender:        'Female',
};

// Navigate from the HCM home page (provided by authFixture) to the When and why step.
// Clicking "Add a Pending Worker" leads to an intro page; the first Continue advances to the form.
async function navigateToWhenAndWhy(page: Page): Promise<void> {
  await page.getByRole('tab', { name: 'My Client Groups' }).click();
  await page.waitForTimeout(TIMEOUTS.MED);

  const addPendingWorker = page.getByRole('link', { name: /Add a Pending Worker/i });
  await addPendingWorker.scrollIntoViewIfNeeded();
  await addPendingWorker.click();
  await page.waitForLoadState('networkidle');

  await clickContinue(page);
  await page.waitForTimeout(TIMEOUTS.LONG);
}

test.describe('HCM Pending Worker Creation', () => {

  // ── Happy Path ──────────────────────────────────────────────────────────

  test('User can create a pending worker', async ({ page }) => {
    if (!process.env.TESTDATE)  throw new Error('TESTDATE env var is required');
    if (!process.env.BIRTHDATE) throw new Error('BIRTHDATE env var is required');
    const testDate  = process.env.TESTDATE;
    const birthDate = process.env.BIRTHDATE;

    await navigateToWhenAndWhy(page);

    // ── When and why ─────────────────────────────────────────────────────

    const proposedStartDate  = page.getByRole('combobox', { name: /Proposed Start Date/i });
    const legalEmployer      = page.getByRole('combobox', { name: /Legal Employer/i });
    const proposedWorkerType = page.getByRole('combobox', { name: /Proposed Worker Type/i });
    const wayToAdd           = page.getByRole('combobox', { name: /What's the way to add the pending worker\?/i });
    const whyAddWorker       = page.getByRole('combobox', { name: /Why are you adding a pending worker\?/i });
    const businessUnit       = page.getByRole('combobox', { name: /Business Unit/i });
    const position           = page.getByRole('combobox', { name: /Position/i });

    await fillCombobox(page, proposedStartDate, testDate);
    await expect(proposedStartDate).toHaveValue(testDate);

    // Legal Employer can auto-fill; only fill if Oracle left it empty or reset it.
    if ((await legalEmployer.inputValue()) !== PENDING_WORKER.legalEmployer) {
      await fillCombobox(page, legalEmployer, PENDING_WORKER.legalEmployer);
    }
    await expect(legalEmployer).toHaveValue(PENDING_WORKER.legalEmployer);

    // Proposed Worker Type may be reset by the Legal Employer cascade.
    if ((await proposedWorkerType.inputValue()) !== PENDING_WORKER.workerType) {
      await fillCombobox(page, proposedWorkerType, PENDING_WORKER.workerType);
    }
    await expect(proposedWorkerType).toHaveValue(PENDING_WORKER.workerType);

    // Way to add sometimes auto-fills after worker type is confirmed.
    if ((await wayToAdd.inputValue()) !== PENDING_WORKER.wayToAdd) {
      await fillCombobox(page, wayToAdd, PENDING_WORKER.wayToAdd);
    }
    await expect(wayToAdd).toHaveValue(PENDING_WORKER.wayToAdd);

    await fillCombobox(page, whyAddWorker, PENDING_WORKER.reason);
    await expect(whyAddWorker).toHaveValue(PENDING_WORKER.reason);

    await fillCombobox(page, businessUnit, PENDING_WORKER.businessUnit);
    await expect(businessUnit).toHaveValue(PENDING_WORKER.businessUnit);

    await fillCombobox(page, position, PENDING_WORKER.position);
    await expect(position).toHaveValue(PENDING_WORKER.position);

    // Validate all fields are intact before proceeding — Oracle can silently reset
    // upstream fields when a downstream cascade completes.
    await expect(proposedStartDate).toHaveValue(testDate);
    await expect(legalEmployer).toHaveValue(PENDING_WORKER.legalEmployer);
    await expect(proposedWorkerType).toHaveValue(PENDING_WORKER.workerType);
    await expect(wayToAdd).toHaveValue(PENDING_WORKER.wayToAdd);
    await expect(whyAddWorker).toHaveValue(PENDING_WORKER.reason);
    await expect(businessUnit).toHaveValue(PENDING_WORKER.businessUnit);
    await expect(position).toHaveValue(PENDING_WORKER.position);

    await clickContinue(page);
    await page.waitForLoadState('networkidle');

    // ── Personal Details ─────────────────────────────────────────────────

    await page.waitForTimeout(TIMEOUTS.LONG);

    const firstName = page.getByRole('textbox', { name: /First Name 1/i });
    await firstName.fill(PENDING_WORKER.firstName);
    await expect(firstName).toHaveValue(PENDING_WORKER.firstName);

    const lastName = page.getByRole('textbox', { name: /Last Name 2/i });
    await lastName.fill(PENDING_WORKER.lastName);
    await expect(lastName).toHaveValue(PENDING_WORKER.lastName);

    const gender = page.getByRole('combobox', { name: /Gender/i });
    await gender.scrollIntoViewIfNeeded();
    await fillCombobox(page, gender, PENDING_WORKER.gender);
    await expect(gender).toHaveValue(PENDING_WORKER.gender);

    const dateOfBirth = page.getByRole('combobox', { name: /Date of Birth/i });
    await dateOfBirth.scrollIntoViewIfNeeded();
    await fillCombobox(page, dateOfBirth, birthDate);
    await expect(dateOfBirth).toHaveValue(birthDate);

    await clickContinue(page);
    await page.waitForLoadState('networkidle');

    // ── Remaining steps (variable count) ────────────────────────────────
    // The wizard can have additional steps (e.g. Position Override, Assignment).
    // Loop until Submit becomes available rather than hard-coding the step count.

    for (let step = 0; step < 6; step++) {
      await page.waitForTimeout(TIMEOUTS.LONG);
      const submitButton = page.getByRole('button', { name: 'Submit', exact: true });
      if (await submitButton.isEnabled()) {
        await submitButton.scrollIntoViewIfNeeded();
        await submitButton.click();
        break;
      }
      await clickContinue(page);
      await page.waitForLoadState('networkidle');
    }

    // ── Validation ───────────────────────────────────────────────────────
    // Return to the home page and confirm the pending worker record appears in search.

    await page.waitForLoadState('networkidle');
    const homeLink = page.getByRole('link', { name: 'Oracle Logo Home' });
    await homeLink.scrollIntoViewIfNeeded();
    await homeLink.click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('tab', { name: 'Me' })).toBeVisible();

    const fullName = `${PENDING_WORKER.firstName} ${PENDING_WORKER.lastName}`;
    await page.getByRole('searchbox', { name: /Search for people and actions/i }).fill(fullName);
    await page.waitForTimeout(TIMEOUTS.MED);
    await page.getByRole('option', { name: fullName }).first().click();

    await expect(page.getByRole('heading', { name: fullName })).toBeVisible();
  });

  // ── Negative Test ───────────────────────────────────────────────────────

  test('User cannot proceed with missing required fields on When and why', async ({ page }) => {
    await navigateToWhenAndWhy(page);

    // Attempt to continue without filling any fields.
    await page.waitForTimeout(TIMEOUTS.LONG);
    await clickContinue(page);

    // Oracle should block navigation and display validation messages.
    await expect(page.getByText(/required/i).first()).toBeVisible();

    // Confirm we have not advanced past the When and why page.
    await expect(page.getByRole('combobox', { name: /Proposed Start Date/i })).toBeVisible();
  });

});
