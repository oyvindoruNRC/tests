import { test, expect } from '../../../fixtures/authFixture';
import type { Page } from '@playwright/test';
import { TIMEOUTS } from '../../../env';
import { fillCombobox, clickContinue } from '../../../helpers/hcmHelpers';

const TERMINATION = {
  action:           'Assignment End',
  revokeUserAccess: 'After termination',
};

// Navigate from the HCM home page (provided by authFixture) to the Terminate Employment wizard.
async function navigateToTerminateEmployment(page: Page): Promise<void> {
  await page.getByRole('tab', { name: 'My Client Groups' }).click();
  await page.waitForTimeout(TIMEOUTS.MED);

  const showMoreActions = page.getByRole('link', { name: 'Show more quick actions' });
  await showMoreActions.scrollIntoViewIfNeeded();
  await showMoreActions.click();
  await page.waitForTimeout(TIMEOUTS.MED);

  const terminateLink = page.getByRole('link', { name: 'Terminate Employment' });
  await terminateLink.scrollIntoViewIfNeeded();
  await terminateLink.click();
  await page.waitForLoadState('networkidle');
}

test.describe('HCM Employee Termination', () => {

  // ── Happy Path ──────────────────────────────────────────────────────────

  test('User can terminate an employee', async ({ page }) => {
    if (!process.env.TESTUSER) throw new Error('TESTUSER env var is required');
    if (!process.env.TESTDATE) throw new Error('TESTDATE env var is required');
    const testUser = process.env.TESTUSER;
    const testDate = process.env.TESTDATE;

    await navigateToTerminateEmployment(page);

    // ── Employee search ───────────────────────────────────────────────────

    const employeeSearch = page.getByRole('textbox', { name: /Search by Name/i });
    await employeeSearch.fill(testUser);
    await page.waitForTimeout(TIMEOUTS.MED);
    await employeeSearch.press('Enter');
    await page.waitForLoadState('networkidle');

    // ── Info to include ───────────────────────────────────────────────────

    await expect(page.getByRole('heading', { name: 'Info to include' })).toBeVisible();

    const cAndA = page.getByRole('button', { name: 'Comments and attachments' });
    await cAndA.scrollIntoViewIfNeeded();
    await cAndA.click();
    await expect(cAndA).toBeEnabled();

    await clickContinue(page);
    await page.waitForLoadState('networkidle');

    // ── Termination details ───────────────────────────────────────────────

    await page.waitForTimeout(TIMEOUTS.LONG);

    const terminationDate = page.getByRole('combobox', { name: 'Termination Notification Date' });
    await fillCombobox(page, terminationDate, testDate);
    await expect(terminationDate).toHaveValue(testDate);

    const terminationAction = page.getByRole('combobox', { name: 'Termination Action' });
    await fillCombobox(page, terminationAction, TERMINATION.action);
    await expect(terminationAction).toHaveValue(TERMINATION.action);

    await clickContinue(page);
    await page.waitForLoadState('networkidle');

    // ── Working day and access ────────────────────────────────────────────

    await page.waitForTimeout(TIMEOUTS.LONG);

    // Revoke User Access must default to "After termination" without any user action.
    await expect(page.getByRole('combobox', { name: 'Revoke User Access' }))
      .toHaveValue(TERMINATION.revokeUserAccess);

    const lastWorkingDay = page.getByRole('combobox', { name: 'Last Working Day' });
    await fillCombobox(page, lastWorkingDay, testDate);
    await expect(lastWorkingDay).toHaveValue(testDate);

    await clickContinue(page);
    await page.waitForLoadState('networkidle');

    // ── Submit ────────────────────────────────────────────────────────────

    await page.waitForTimeout(TIMEOUTS.LONG);
    const submitButton = page.getByRole('button', { name: 'Submit' });
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click();
    await page.waitForLoadState('networkidle');

    // Confirm the wizard completed — the Oracle Logo Home link must be reachable.
    const homeLink = page.getByRole('link', { name: 'Oracle Logo Home' });
    await expect(homeLink).toBeVisible();
    await homeLink.click();
  });

  // ── Negative Test ───────────────────────────────────────────────────────

  test('User cannot proceed past termination details without required fields', async ({ page }) => {
    if (!process.env.TESTUSER) throw new Error('TESTUSER env var is required');

    await navigateToTerminateEmployment(page);

    const employeeSearch = page.getByRole('textbox', { name: /Search by Name/i });
    await employeeSearch.fill(process.env.TESTUSER);
    await page.waitForTimeout(TIMEOUTS.MED);
    await employeeSearch.press('Enter');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Info to include' })).toBeVisible();
    await clickContinue(page);
    await page.waitForLoadState('networkidle');

    // Attempt to continue without filling Termination Notification Date or Termination Action.
    await page.waitForTimeout(TIMEOUTS.LONG);
    await clickContinue(page);

    // Oracle should block navigation and display validation messages.
    await expect(page.getByText(/required/i).first()).toBeVisible();

    // Confirm we have not advanced past the termination details page.
    await expect(page.getByRole('combobox', { name: 'Termination Notification Date' })).toBeVisible();
  });

});
