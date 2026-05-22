import { test, expect } from '../../../fixtures/authFixture';
import type { Page } from '@playwright/test';
import { TIMEOUTS } from '../../../env';
import { fillCombobox } from '../../../helpers/hcmHelpers';

const CHECK_IN = {
  template: 'Check-In',
};

// Navigate from the HCM home page (provided by authFixture) to the Performance documents list.
async function navigateToPerformanceDocuments(page: Page): Promise<void> {
  const careerAndPerf = page.getByRole('link', { name: 'Career and Performance' });
  await careerAndPerf.scrollIntoViewIfNeeded();
  await careerAndPerf.click();
  await page.waitForTimeout(TIMEOUTS.MED);

  const viewPerfDocs = page.getByRole('link', { name: /View performance documents/i });
  await viewPerfDocs.scrollIntoViewIfNeeded();
  await viewPerfDocs.click();
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: 'Performance' })).toBeVisible();
}

test.describe('HCM Employee Check-In', () => {

  // ── Happy Path ──────────────────────────────────────────────────────────

  test('User can perform an employee check-in', async ({ page }) => {
    await navigateToPerformanceDocuments(page);

    // Open the new performance document form.
    const addDocButton = page.getByRole('button', { name: 'Add' });
    await addDocButton.scrollIntoViewIfNeeded();
    await addDocButton.click();
    await page.waitForTimeout(TIMEOUTS.LONG);

    // Select the Check-In template.
    const templateField = page.getByRole('combobox', { name: /Template/i });
    await fillCombobox(page, templateField, CHECK_IN.template);
    await expect(templateField).toHaveValue(CHECK_IN.template);

    // Add a timestamped discussion topic so each run creates a unique entry.
    const topic = `Playwright Test ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;
    const topicField = page.getByRole('textbox', { name: /Create your own discussion topic/i });
    await topicField.fill(topic);
    await page.waitForTimeout(TIMEOUTS.MED);

    const addTopicButton = page.getByRole('button', { name: 'Add' });
    await addTopicButton.scrollIntoViewIfNeeded();
    await addTopicButton.click();
    await page.waitForTimeout(TIMEOUTS.MED);
    await expect(page.getByText(topic)).toBeVisible();

    // Schedule the check-in and confirm the topic is still present (no error occurred).
    const scheduleButton = page.getByRole('button', { name: 'Schedule' });
    await scheduleButton.scrollIntoViewIfNeeded();
    await scheduleButton.click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(topic)).toBeVisible();
  });

  // ── Negative Test ───────────────────────────────────────────────────────

  test('User cannot schedule a check-in without a discussion topic', async ({ page }) => {
    await navigateToPerformanceDocuments(page);

    const addDocButton = page.getByRole('button', { name: 'Add' });
    await addDocButton.scrollIntoViewIfNeeded();
    await addDocButton.click();
    await page.waitForTimeout(TIMEOUTS.LONG);

    // Select template but skip adding a topic.
    const templateField = page.getByRole('combobox', { name: /Template/i });
    await fillCombobox(page, templateField, CHECK_IN.template);
    await expect(templateField).toHaveValue(CHECK_IN.template);

    // Attempt to schedule without a topic.
    const scheduleButton = page.getByRole('button', { name: 'Schedule' });
    await scheduleButton.scrollIntoViewIfNeeded();
    await scheduleButton.click();
    await page.waitForTimeout(TIMEOUTS.MED);

    // Oracle must not advance — the topic field should still be visible.
    await expect(page.getByRole('textbox', { name: /Create your own discussion topic/i })).toBeVisible();
  });

});
