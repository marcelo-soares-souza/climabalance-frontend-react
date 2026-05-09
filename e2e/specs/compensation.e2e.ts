import { test, expect, loginAsUser } from '../helpers/test-utils';

test.describe('Compensation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await page.evaluate(() => {
      localStorage.setItem('cb_compensation', JSON.stringify({
        state: {
          areaId: '0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a',
          areaName: 'Reserva Legal Amazônia',
          treesRequested: 50,
          totalTCO2e: 5,
          totalAmount: 750,
          currency: 'BRL',
        },
        version: 0,
      }));
    });
  });

  test('should display compensation review page', async ({ page }) => {
    await page.goto('/compensation/review');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toHaveText(/Revisar Sua Compensação/i);
  });

  test('should display checkout page', async ({ page }) => {
    await page.goto('/compensation/checkout');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toHaveText(/Checkout|Pagamento|Revisar/i);
  });

  test('should display compensation history', async ({ page }) => {
    await page.goto('/profile/compensations');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();
  });
});
