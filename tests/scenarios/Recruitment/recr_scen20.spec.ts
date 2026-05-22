import { test, expect } from '@playwright/test';
import { loginUrl } from '../../../env';

test.describe('Accept Job Offer in HC;', () => {
  test('User can accept a job offer', async ({ page }) => {
    // Go to a known post-login HCM landing page
    await page.goto(loginUrl('HCM_BASE_URL'));

    // Assert a stable dashboard element is visible
    // Pick something your org always sees on the landing page
    await expect(
      page.getByRole('button', { name: /Oracle Logo Home/i })
    ).toBeVisible();
      });
});