import { test, expect } from '@playwright/test';

test.describe('HCM Dashboard access', () => {
  test('User can access the HCM dashboard', async ({ page }) => {
    // Go to a known post-login HCM landing page
    await page.goto('https://ekum-dev1.fa.em2.oraclecloud.com/hcmUI/faces/FuseWelcome');

    // Assert a stable dashboard element is visible
    // Pick something your org always sees on the landing page
    await expect(
      page.getByRole('button', { name: /Oracle Logo Home/i })
    ).toBeVisible();

    // Optional: assert a common HCM navigation entry exists
    await expect(
      page.getByRole('link', { name: 'My Client Groups' })
    ).toBeVisible();
  });
});