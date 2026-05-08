import { test, expect, loginAsAdmin } from '../helpers/test-utils';

test.describe('Admin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display user list', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toHaveText(/Usuários/i);
  });

  test('should display user edit form', async ({ page }) => {
    await page.goto('/admin/users/edit/0195f1e2-3a4b-5c6d-7e8f-9a0b1c2d3e4f');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('select[id="status"]')).toBeVisible();
  });

  test('should display audit log', async ({ page }) => {
    await page.goto('/admin/audit-log');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();
  });
});
