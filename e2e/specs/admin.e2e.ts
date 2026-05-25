import { test, expect, loginAsAdmin } from "../helpers/test-utils";

const API_URL = process.env.E2E_API_URL ?? "https://dev.climabalance.org";

test.describe("Admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should display user list", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Usuários/i);
  });

  test("should display user edit form", async ({ page }) => {
    await page.route(`${API_URL}/api/v1/users/edit-user-001`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: "edit-user-001",
            email: "user@example.com",
            slug: "test-user",
            status: "active",
            locale: "pt-BR",
            email_confirmed_at: "2025-01-01T00:00:00Z",
            roles: ["individual"],
            created_at: "2025-01-01T00:00:00Z",
            updated_at: "2025-05-01T00:00:00Z",
          },
        }),
      });
    });

    await page.goto("/admin/users/edit/edit-user-001");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('select[id="status"]')).toBeVisible();
  });

  test("should display audit log", async ({ page }) => {
    await page.goto("/admin/audit-log");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toBeVisible();
  });
});
