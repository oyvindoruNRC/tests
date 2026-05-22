import { test, expect } from '../../../fixtures/authFixture';
import type { Page } from '@playwright/test';
import { TIMEOUTS } from '../../../env';
import { clickContinue } from '../../../helpers/hcmHelpers';

const REQUISITION = {
  createUsing:            'Job',
  businessUnit:           'Iraq',
  job:                    'Administration Assistant',
  hiringManager:          'Thiyagarajah Nadanasabesan',
  hiringManagerSearch:    'Thiyag',
  recruiter:              'Sara Abed',
  recruitingType:         'Hourly',
  organization:           'The Norwegian Refugee Council',
  primaryLocationSearch:  'Baghdad',
  primaryLocation:        'Baghdad, Iraq',
  workerType:             'Employee',
  regularOrTemporary:     'Open-ended',
  fullTimeOrPartTime:     'Full time',
  jobType:                'Standard',
  externalApplicationFlow: 'External global - ext_global',
};

// Navigate from the HCM home page (provided by authFixture) to the Create Requisition form.
async function navigateToCreateRequisition(page: Page): Promise<void> {
  const hiringNav = page.locator('#itemNode_workforce_management_hiring_redwood > .svg-nav');
  await hiringNav.scrollIntoViewIfNeeded();
  await hiringNav.click();
  await page.waitForLoadState('networkidle');

  const createButton = page.getByRole('button', { name: 'Create' });
  await createButton.scrollIntoViewIfNeeded();
  await createButton.click();
  await page.waitForTimeout(TIMEOUTS.LONG);
}

test.describe('HCM Job Requisition Generation', () => {

  // ── Happy Path ──────────────────────────────────────────────────────────

  test('User can generate a job requisition', async ({ page }) => {
    await navigateToCreateRequisition(page);

    // ── How to start ────────────────────────────────────────────────────
    // Requisition Type [Standard] is autofilled — no action needed.

    await expect(page.getByRole('heading', { name: /how to start/i })).toBeVisible();

    // Create Requisition Using: Job
    await page.locator('#requisitionUseTypeCompId .oj-searchselect-arrow').click();
    await page.waitForTimeout(TIMEOUTS.MED);
    await page.getByRole('row', { name: REQUISITION.createUsing }).click();
    await page.waitForTimeout(TIMEOUTS.MED);

    // Business Unit: Iraq
    const businessUnit = page.getByRole('combobox', { name: 'Business Unit' });
    await businessUnit.fill(REQUISITION.businessUnit);
    await page.waitForTimeout(TIMEOUTS.LONG);
    await page.getByRole('gridcell', { name: REQUISITION.businessUnit }).click();
    await page.waitForTimeout(TIMEOUTS.MED);
    await expect(businessUnit).toHaveValue(REQUISITION.businessUnit);

    // Job: Administration Assistant
    await page.locator('div:nth-child(3) > .oj-text-field-end > .oj-searchselect-arrow').click();
    await page.waitForTimeout(TIMEOUTS.LONG);
    await page.getByText(REQUISITION.job).click();
    await page.waitForTimeout(TIMEOUTS.MED);

    await clickContinue(page);
    await page.waitForLoadState('networkidle');

    // ── Basic Info ──────────────────────────────────────────────────────
    // No required fields on this page.

    await page.waitForTimeout(TIMEOUTS.LONG);
    await clickContinue(page);
    await page.waitForLoadState('networkidle');

    // ── Hiring Team ─────────────────────────────────────────────────────

    await page.waitForTimeout(TIMEOUTS.LONG);

    // Hiring Manager
    const hiringManager = page.getByRole('combobox', { name: 'Hiring Manager' });
    await hiringManager.fill(REQUISITION.hiringManagerSearch);
    await page.waitForTimeout(TIMEOUTS.LONG);
    await page.getByText(REQUISITION.hiringManager).click();
    await page.waitForTimeout(TIMEOUTS.MED);
    await expect(hiringManager).toHaveValue(REQUISITION.hiringManager);

    // Recruiter
    const recruiter = page.getByRole('combobox', { name: 'Recruiter' });
    await recruiter.fill(REQUISITION.recruiter);
    await page.waitForTimeout(TIMEOUTS.LONG);
    await page.getByRole('cell', { name: REQUISITION.recruiter }).click();
    await page.waitForTimeout(TIMEOUTS.MED);
    await expect(recruiter).toHaveValue(REQUISITION.recruiter);

    await clickContinue(page);
    await page.waitForLoadState('networkidle');

    // ── Requisition Structure ────────────────────────────────────────────

    await page.waitForTimeout(TIMEOUTS.LONG);

    // Recruiting Type: Hourly
    await page.locator('.oj-searchselect-arrow').first().click();
    await page.waitForTimeout(TIMEOUTS.MED);
    await page.getByRole('gridcell', { name: REQUISITION.recruitingType }).click();
    await page.waitForTimeout(TIMEOUTS.MED);

    // Organization: The Norwegian Refugee Council
    await page.locator('#organizationCompId .oj-searchselect-arrow').click();
    await page.waitForTimeout(TIMEOUTS.LONG);
    await page.getByText(REQUISITION.organization, { exact: true }).click();
    await page.waitForTimeout(TIMEOUTS.MED);

    // Primary Location: Baghdad, Iraq
    const primaryLocation = page.getByRole('combobox', { name: 'Primary Location' });
    await primaryLocation.fill(REQUISITION.primaryLocationSearch);
    await page.waitForTimeout(TIMEOUTS.LONG);
    await page.getByRole('gridcell', { name: REQUISITION.primaryLocation }).click();
    await page.waitForTimeout(TIMEOUTS.MED);
    await expect(primaryLocation).toHaveValue(REQUISITION.primaryLocation);

    await clickContinue(page);
    await page.waitForLoadState('networkidle');

    // ── Details ──────────────────────────────────────────────────────────

    await page.waitForTimeout(TIMEOUTS.LONG);

    // Worker Type: Employee
    await page.locator('.oj-searchselect-arrow').first().click();
    await page.waitForTimeout(TIMEOUTS.MED);
    await page.getByRole('row', { name: REQUISITION.workerType }).click();
    await page.waitForTimeout(TIMEOUTS.MED);

    // Regular or Temporary: Open-ended
    await page.locator('[id="additional_info_dyn_form_fl_Details.RegularOrTemporary"] .oj-searchselect-arrow').click();
    await page.waitForTimeout(TIMEOUTS.MED);
    await page.getByRole('gridcell', { name: REQUISITION.regularOrTemporary }).click();
    await page.waitForTimeout(TIMEOUTS.MED);

    // Job Type: Standard
    await page.locator('[id="additional_info_dyn_form_fl_Details.JobTypeCode"] .oj-searchselect-arrow').click();
    await page.waitForTimeout(TIMEOUTS.MED);
    await page.getByRole('gridcell', { name: REQUISITION.jobType }).click();
    await page.waitForTimeout(TIMEOUTS.MED);

    // Full Time or Part Time: Full time
    await page.locator('[id="additional_info_dyn_form_fl_Details.FullTimeOrPartTime"] .oj-searchselect-arrow').click();
    await page.waitForTimeout(TIMEOUTS.MED);
    await page.getByText(REQUISITION.fullTimeOrPartTime, { exact: true }).click();
    await page.waitForTimeout(TIMEOUTS.MED);

    await clickContinue(page);
    await page.waitForLoadState('networkidle');

    // ── Posting Description ──────────────────────────────────────────────
    // No required fields on this page.

    await page.waitForTimeout(TIMEOUTS.LONG);
    await clickContinue(page);
    await page.waitForLoadState('networkidle');

    // ── Offer Info ───────────────────────────────────────────────────────
    // No required fields on this page.

    await page.waitForTimeout(TIMEOUTS.LONG);
    await clickContinue(page);
    await page.waitForLoadState('networkidle');

    // ── Attachments ──────────────────────────────────────────────────────
    // No required fields on this page.

    await page.waitForTimeout(TIMEOUTS.LONG);
    await clickContinue(page);
    await page.waitForLoadState('networkidle');

    // ── Configuration ────────────────────────────────────────────────────

    await page.waitForTimeout(TIMEOUTS.LONG);

    // Candidate Selection Process: first available option
    await page.locator('.oj-searchselect-arrow').first().click();
    await page.waitForTimeout(TIMEOUTS.LONG);
    await page.locator('.oj-listitemlayout-textslots > div').first().click();
    await page.waitForTimeout(TIMEOUTS.MED);

    // External Application Flow
    await page.locator('#externalApplicationFlow .oj-searchselect-arrow').click();
    await page.waitForTimeout(TIMEOUTS.LONG);
    await page.getByText(REQUISITION.externalApplicationFlow).click();
    await page.waitForTimeout(TIMEOUTS.MED);

    await clickContinue(page);
    await page.waitForLoadState('networkidle');

    // ── Prescreening Questions ───────────────────────────────────────────
    // No required fields on this page.

    await page.waitForTimeout(TIMEOUTS.LONG);
    await clickContinue(page);
    await page.waitForLoadState('networkidle');

    // ── Interview Questionnaires ─────────────────────────────────────────

    await page.waitForTimeout(TIMEOUTS.LONG);
    const addButton = page.getByRole('button', { name: 'Add' });
    await addButton.scrollIntoViewIfNeeded();
    await addButton.click();
    await page.waitForTimeout(TIMEOUTS.MED);
    await clickContinue(page);
    await page.waitForLoadState('networkidle');

    // ── Background Checks → Submit ───────────────────────────────────────

    await page.waitForTimeout(TIMEOUTS.LONG);
    const submitButton = page.getByRole('button', { name: 'Submit' });
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click();
    await page.waitForLoadState('networkidle');

    // Confirm the requisition was created — the job title must be visible on the confirmation page.
    await expect(page.getByText(REQUISITION.job)).toBeVisible({ timeout: 60000 });
  });

  // ── Negative Test ───────────────────────────────────────────────────────

  test('User cannot proceed with missing required fields on How to start', async ({ page }) => {
    await navigateToCreateRequisition(page);

    await expect(page.getByRole('heading', { name: /how to start/i })).toBeVisible();

    // Attempt to continue without filling any fields.
    await page.waitForTimeout(TIMEOUTS.LONG);
    await clickContinue(page);

    // Oracle should block navigation and display validation messages.
    await expect(page.getByText(/required/i).first()).toBeVisible();

    // Confirm we have not advanced past How to start.
    await expect(page.getByRole('heading', { name: /how to start/i })).toBeVisible();
  });

});
