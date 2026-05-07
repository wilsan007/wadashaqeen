import { test, expect } from '@playwright/test';

test.describe('Contrôle accès RBAC — routes protégées sans session', () => {
  const protectedRoutes = [
    '/dashboard',
    '/hr',
    '/projects',
    '/tasks',
    '/super-admin',
    '/analytics',
    '/settings',
    '/inbox',
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirige sans authentification`, async ({ page }) => {
      await page.goto(route);
      await page.waitForURL(url => !url.pathname.startsWith(route), { timeout: 5000 }).catch(() => {});
      expect(page.url()).not.toContain(route);
    });
  }

  test('invite/accept est accessible sans connexion', async ({ page }) => {
    await page.goto('/invite/accept');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login?redirect=/invite');
  });
});
