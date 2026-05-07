import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('redirige vers login si non connecté', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(url => !url.pathname.includes('/dashboard'), { timeout: 5000 }).catch(() => {});
    expect(page.url()).not.toContain('/dashboard');
  });

  test('not-found affiche une page 404', async ({ page }) => {
    await page.goto('/cette-page-nexiste-pas');
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    const has404 = /404|not found|introuvable/i.test(body ?? '');
    expect(has404).toBeTruthy();
  });
});
