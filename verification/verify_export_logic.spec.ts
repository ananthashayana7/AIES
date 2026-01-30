
import { test, expect } from '@playwright/test';

test('verify export flow', async ({ page }) => {
  // 1. Load app
  await page.goto('http://localhost:3003');

  // 2. Select Agent
  await page.getByRole('button', { name: 'AGENT' }).click();

  // 3. Create Design First
  const input = page.getByPlaceholder('Ask Jarvis');
  const sendBtn = page.getByRole('button', { name: '➤' });

  await input.fill('Design a box');
  await sendBtn.click();
  await expect(page.locator('.message.assistant').last()).toContainText('Starting new design');
  await page.waitForTimeout(5000); // Wait for mesh to mount (dynamic import + mock delay)

  // 4. Ask for Export
  await input.fill('Export STL');

  // 5. Intercept Download
  const downloadPromise = page.waitForEvent('download');
  await sendBtn.click();

  // 5. Verify Response Text
  await expect(page.locator('.message.assistant').last()).toContainText('Generating STL');

  // 6. Verify Download
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('.stl');
});
