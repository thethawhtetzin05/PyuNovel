import { test, expect } from '@playwright/test';

test('has title and welcome message', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/PyuNovel/);

  // Check for localized welcome message or key elements
  // This depends on the actual content of your homepage
  const welcomeText = page.locator('text=PyuNovel');
  await expect(welcomeText).toBeVisible();
});

test('can navigate to about page', async ({ page }) => {
  await page.goto('/');
  
  // Click the about link (this assumes you have one in the footer or nav)
  // The route is /[locale]/about
  const aboutLink = page.locator('a[href*="/about"]');
  if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await expect(page).toHaveURL(/.*\/about/);
  }
});
