import { expect, type Locator, type Page } from '@playwright/test';
import { HIRE_DETAILS } from '../fixtures/hireDetails';
import { TIMEOUTS } from '../env';

export async function fillCombobox(
  page: Page,
  locator: Locator,
  value: string,
  pressKey: 'Enter' | 'ArrowDown' = 'Enter',
  postWait: number = TIMEOUTS.MED,
  preWait: number = TIMEOUTS.SHORT
): Promise<void> {
  await locator.fill(value);
  await page.waitForTimeout(preWait); // wait for HCM dropdown to populate before confirming
  if (pressKey === 'ArrowDown') {
    await locator.press('ArrowDown');
  }
  await locator.press('Enter');
  await page.waitForTimeout(postWait); // wait for HCM to process the selection and load dependent fields
}

// Oracle HCM LOV: cascade only fires when the user clicks an option in the popup, not on
// keyboard confirmation. The combobox's aria-controls attribute points to the popup's exact
// DOM id (e.g. "lovDropdown_..."). We find that element and click the matching text inside
// it. This is more precise than searching the whole page (which risks clicking the Step 1
// action table that also has "Hire" as a cell). Falls back to Tab if popup is not found.
async function fillLovWithDropdownDismiss(
  page: Page,
  locator: Locator,
  value: string
): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await locator.fill(value);

  // Wait for Oracle to open the popup (aria-expanded=true signals popup is open),
  // then immediately click the first option before Oracle auto-confirms.
  // page.mouse.click generates isTrusted:true events required for Oracle's cascade handler.
  try {
    const handle = await locator.elementHandle({ timeout: 2000 });
    if (handle) {
      await page.waitForFunction(
        (el) => (el as Element).getAttribute('aria-expanded') === 'true',
        handle,
        { timeout: 5000 }
      );
      // Popup is open right now — click immediately at the first option position
      const box = await locator.boundingBox();
      if (box) {
        await page.mouse.click(box.x + 40, box.y + box.height + 20);
        await page.waitForTimeout(TIMEOUTS.LONG);
        return;
      }
    }
  } catch {
    // aria-expanded never reached "true" (popup never opened or already closed)
  }

  await locator.press('ArrowDown');
  await locator.press('Enter');
  await page.waitForTimeout(TIMEOUTS.MED);
  await locator.press('Tab');
  await page.waitForTimeout(TIMEOUTS.LONG);
}

export async function validateCombobox(locator: Locator, value: string): Promise<void> {
  await expect(locator).toHaveValue(value, { timeout: 5000 });
}

export async function waitForNextPage(page: Page, expectedHeading: string): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await expect(
    page.getByRole('heading', { name: expectedHeading })
  ).toBeVisible({ timeout: 30000 });
}

export async function clickContinue(page: Page): Promise<void> {
  const continueButton = page.getByRole('button', { name: 'Continue', exact: true });
  await continueButton.waitFor({ state: 'visible' });
  await continueButton.scrollIntoViewIfNeeded();
  await continueButton.click();
}

export function getHireDetailLocators(page: Page) {
  return {
    hireDate:      page.getByRole('combobox', { name: /When is the employee hire date?/i }),
    legalEmployer: page.getByRole('combobox', { name: /Legal Employer/i }),
    wayToHire:     page.getByRole('combobox', { name: /What's the way to hire an employee?/i }),
    whyHire:       page.getByRole('combobox', { name: /Why are you hiring an employee?/i }),
    businessUnit:  page.getByRole('combobox', { name: /Business Unit/i }),
    position:      page.getByRole('combobox', { name: /Position/i }),
  };
}

export async function fillAllHireDetailFields(
  page: Page,
  testDate: string
): Promise<void> {
  const fields = getHireDetailLocators(page);

  await fillCombobox(page, fields.hireDate, testDate, 'Enter', TIMEOUTS.MED, TIMEOUTS.SHORT);
  await fillCombobox(page, fields.legalEmployer, HIRE_DETAILS.legalEmployer, 'Enter', TIMEOUTS.LONG, TIMEOUTS.SHORT);

  // wayToHire and businessUnit: dropdowns stay open after Enter in Chromium — use
  // ArrowDown+Enter to confirm, then force-click the next field to dismiss the dropdown
  await fillLovWithDropdownDismiss(page, fields.wayToHire, HIRE_DETAILS.wayToHire);
  await fillCombobox(page, fields.whyHire, HIRE_DETAILS.reasonToHire, 'Enter', TIMEOUTS.MED, TIMEOUTS.SHORT);
  await fillLovWithDropdownDismiss(page, fields.businessUnit, HIRE_DETAILS.businessUnit);
  await fillCombobox(page, fields.position, HIRE_DETAILS.position, 'Enter', TIMEOUTS.MED, TIMEOUTS.SHORT);

  // Re-fill any fields cleared by HCM cascade resets
  const checks: Array<{ locator: Locator; value: string; isLov?: boolean }> = [
    { locator: fields.hireDate,      value: testDate },
    { locator: fields.legalEmployer, value: HIRE_DETAILS.legalEmployer },
    { locator: fields.wayToHire,     value: HIRE_DETAILS.wayToHire,    isLov: true },
    { locator: fields.whyHire,       value: HIRE_DETAILS.reasonToHire },
    { locator: fields.businessUnit,  value: HIRE_DETAILS.businessUnit, isLov: true },
    { locator: fields.position,      value: HIRE_DETAILS.position },
  ];

  for (const { locator, value, isLov } of checks) {
    const current = await locator.inputValue();
    if (current !== value) {
      if (isLov) {
        await fillLovWithDropdownDismiss(page, locator, value);
      } else {
        await fillCombobox(page, locator, value, 'Enter', TIMEOUTS.MED, TIMEOUTS.SHORT);
      }
    }
  }
}

export async function validateAllHireDetailFields(
  page: Page,
  testDate: string
): Promise<void> {
  const fields = getHireDetailLocators(page);
  await validateCombobox(fields.hireDate,      testDate);
  await validateCombobox(fields.legalEmployer, HIRE_DETAILS.legalEmployer);
  await validateCombobox(fields.wayToHire,     HIRE_DETAILS.wayToHire);
  await validateCombobox(fields.whyHire,       HIRE_DETAILS.reasonToHire);
  await validateCombobox(fields.businessUnit,  HIRE_DETAILS.businessUnit);
  await validateCombobox(fields.position,      HIRE_DETAILS.position);
}
