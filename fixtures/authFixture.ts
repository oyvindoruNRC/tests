import { test as base } from '@playwright/test';
import { loginUrl } from '../env';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto(loginUrl('HCM_BASE_URL'));
    await page.getByRole('link', { name: 'Oracle Logo Home' }).click();
    await page.getByRole('tab', { name: 'Me' }).waitFor({ state: 'visible' });
    await use(page);
  },
});

export { expect } from '@playwright/test';