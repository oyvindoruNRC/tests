import 'dotenv/config';
import { chromium } from '@playwright/test';

export default async () => {
  if (!process.env.HCM_GLOBALHR_USER || !process.env.HCM_GLOBALHR_PASSWORD) {
    throw new Error('Missing HCM credentials');
  }
  if (!process.env.HCM_BASE_URL) {
    throw new Error('HCM_BASE_URL is not defined in .env');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Oracle HCM redirects to IDCS sign-in when no session exists.
  await page.goto(process.env.HCM_BASE_URL);

  // Fill both fields and submit. The IDCS page shows username and password simultaneously.
  await page.getByLabel('Username').fill(process.env.HCM_GLOBALHR_USER);
  await page.getByLabel('Password').fill(process.env.HCM_GLOBALHR_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();

};
