
import { test, expect } from '@playwright/test';

test('verify mec agent ui', async ({ page }) => {
  // 1. Load the app
  await page.goto('http://localhost:3003');

  // 2. Select Agent Tab
  const agentTab = page.getByRole('button', { name: 'AGENT' });
  await agentTab.click();

  // 3. Interact with Agent
  const input = page.getByPlaceholder('Ask Jarvis');
  const sendBtn = page.getByRole('button', { name: '➤' });

  // "Design a NEMA 17 bracket"
  await input.fill('Design a NEMA 17 bracket');
  await sendBtn.click();
  await expect(page.locator('.message.assistant').last()).toContainText('Starting new design');
  await page.waitForTimeout(1000);

  // "It needs to hold 5kg"
  await input.fill('It needs to hold 5kg');
  await sendBtn.click();
  await expect(page.locator('.message.assistant').last()).toContainText('Understood');
  await page.waitForTimeout(2000); // Wait for solver

  // 4. Trigger Visual FEM
  await input.fill('Show stress');
  await sendBtn.click();

  // Wait for "Activating real-time stress"
  await expect(page.locator('.message.assistant').last()).toContainText('Activating real-time stress');

  // 5. Take Screenshot
  // Wait a moment for 3D render updates (heatmap application)
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'verification/mec_agent_demo.png', fullPage: true });
});
