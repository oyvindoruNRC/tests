import { test, expect } from '../../../fixtures/authFixture';
import { HIRE_DETAILS, getTestDate } from '../../../fixtures/hireDetails';
import { TIMEOUTS } from '../../../env';
import {
  fillCombobox,
  fillAllHireDetailFields,
  validateAllHireDetailFields,
  clickContinue,
  getHireDetailLocators,
} from '../../../helpers/hcmHelpers';

test.describe('HCM New Employee Generation', () => {

  // ── Happy Path ─────────────────────────────────────────────────────────

  test('User can hire a new employee', async ({ page }) => {
    const testDate = getTestDate();

    // ── Step 1: Navigate to Hire an Employee ────────────────────────────

    await page.getByRole('tab', { name: 'My Client Groups' }).click();

    const showMoreActions = page.getByRole('link', { name: 'Show more quick actions' });
    await showMoreActions.scrollIntoViewIfNeeded();
    await showMoreActions.click();

    const hireLink = page.getByRole('link', { name: /Hire an Employee/ }).first();
    await hireLink.scrollIntoViewIfNeeded();
    await hireLink.click();

    await page.waitForTimeout(TIMEOUTS.LONG);
    await clickContinue(page);

    // ── Step 2: Hire Details ─────────────────────────────────────────────

    await fillAllHireDetailFields(page, testDate);

    // Validate all fields are intact before proceeding
    await validateAllHireDetailFields(page, testDate);
    await clickContinue(page);

    // ── Step 3: Personal Details ─────────────────────────────────────────

    const firstName = page.getByRole('textbox', { name: /First Name 1/i });
    await firstName.fill(HIRE_DETAILS.firstName);
    await expect(firstName).toHaveValue(HIRE_DETAILS.firstName);

    const lastName = page.getByRole('textbox', { name: /Last Name 2/i });
    await lastName.fill(HIRE_DETAILS.lastName);
    await expect(lastName).toHaveValue(HIRE_DETAILS.lastName);

    await clickContinue(page);

    // ── Steps 4+: Navigate remaining steps until Submit becomes available ──

    for (let step = 0; step < 8; step++) {
      await page.waitForTimeout(TIMEOUTS.LONG);
      const submitButton = page.getByRole('button', { name: 'Submit', exact: true });
      if (await submitButton.isEnabled()) {
        await submitButton.scrollIntoViewIfNeeded();
        await submitButton.click();
        break;
      }
      const continueButton = page.getByRole('button', { name: 'Continue', exact: true });
      if (await continueButton.isVisible()) {
        await continueButton.scrollIntoViewIfNeeded();
        await continueButton.click();
      }
    }

    // Confirm submission and verify employee record was created
    const employeeLink = page.getByRole('link', { name: `${HIRE_DETAILS.firstName} ${HIRE_DETAILS.lastName}` }).first();
    await expect(employeeLink).toBeVisible({ timeout: 60000 });
    await employeeLink.click();
    await page.waitForTimeout(TIMEOUTS.LONG);

    await expect(page.getByText(HIRE_DETAILS.firstName)).toBeVisible();
    await expect(page.getByText(HIRE_DETAILS.lastName)).toBeVisible();
    await expect(page.getByText(testDate)).toBeVisible();

  });

  // ── Negative Tests ─────────────────────────────────────────────────────

  test('User cannot proceed with missing required fields', async ({ page }) => {

    await page.getByRole('tab', { name: 'My Client Groups' }).click();

    const showMoreActions = page.getByRole('link', { name: 'Show more quick actions' });
    await showMoreActions.scrollIntoViewIfNeeded();
    await showMoreActions.click();

    const hireLink = page.getByRole('link', { name: /Hire an Employee/ }).first();
    await hireLink.scrollIntoViewIfNeeded();
    await hireLink.click();

    await page.waitForTimeout(TIMEOUTS.LONG);
    await clickContinue(page);

    // Attempt to continue without filling any fields
    await page.waitForTimeout(TIMEOUTS.LONG);
    await clickContinue(page);

    await expect(
      page.getByText(/required/i).first()
    ).toBeVisible();

    // Confirm we have not advanced past the Hire Details page
    const fields = getHireDetailLocators(page);
    await expect(fields.hireDate).toBeVisible();

  });

  test('User cannot proceed with an invalid hire date', async ({ page }) => {

    await page.getByRole('tab', { name: 'My Client Groups' }).click();

    const showMoreActions = page.getByRole('link', { name: 'Show more quick actions' });
    await showMoreActions.scrollIntoViewIfNeeded();
    await showMoreActions.click();

    const hireLink = page.getByRole('link', { name: /Hire an Employee/ }).first();
    await hireLink.scrollIntoViewIfNeeded();
    await hireLink.click();

    await page.waitForTimeout(TIMEOUTS.LONG);
    await clickContinue(page);

    const fields = getHireDetailLocators(page);
    await fillCombobox(page, fields.hireDate, 'not-a-date');
    await clickContinue(page);

    await expect(
      page.getByText(/invalid|enter a valid date|not valid|date.*format/i).first()
    ).toBeVisible();

    // Confirm we have not advanced past the Hire Details page
    await expect(fields.hireDate).toBeVisible();

  });

  test('User is warned when hiring a duplicate employee', async ({ page }) => {
    const testDate = getTestDate();

    await page.getByRole('tab', { name: 'My Client Groups' }).click();

    const showMoreActions = page.getByRole('link', { name: 'Show more quick actions' });
    await showMoreActions.scrollIntoViewIfNeeded();
    await showMoreActions.click();

    const hireLink = page.getByRole('link', { name: /Hire an Employee/ }).first();
    await hireLink.scrollIntoViewIfNeeded();
    await hireLink.click();

    await page.waitForTimeout(TIMEOUTS.LONG);
    await clickContinue(page);

    await fillAllHireDetailFields(page, testDate);

    await validateAllHireDetailFields(page, testDate);
    await clickContinue(page);

    // Use the same name as an existing employee
    const firstName = page.getByRole('textbox', { name: /First Name 1/i });
    await firstName.fill(HIRE_DETAILS.firstName);

    const lastName = page.getByRole('textbox', { name: /Last Name 2/i });
    await lastName.fill(HIRE_DETAILS.lastName);

    await clickContinue(page);

    await expect(
      page.getByText(/duplicate/i).first()
    ).toBeVisible();

  });

});