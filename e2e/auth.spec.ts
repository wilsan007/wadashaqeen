import { test, expect } from '@playwright/test';

test.describe('Authentification', () => {
  test('landing page accessible sans connexion', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Wadashaqayn|SaaS/i);
  });

  test('page login est accessible', async ({ page }) => {
    await page.goto('/login');
    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailField).toBeVisible({ timeout: 5000 });
  });

  test('signup tenant owner accessible', async ({ page }) => {
    await page.goto('/signup/tenant-owner');
    await expect(page).toHaveURL(/signup/);
  });

  test('privacy policy accessible publiquement', async ({ page }) => {
    await page.goto('/privacy-policy');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('terms of use accessible publiquement', async ({ page }) => {
    await page.goto('/terms-of-use');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});
