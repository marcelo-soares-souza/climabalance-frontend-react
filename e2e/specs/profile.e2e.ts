import { test, expect, loginAsUser } from "../helpers/test-utils";

test.describe("Profile", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test("should display user profile page", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("button", { name: /Editar perfil/i }),
    ).toBeVisible();
  });

  test("should display profile edit form", async ({ page }) => {
    await page.goto("/profile/edit");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('input[id="display_name"]')).toBeVisible();
  });

  test("should display certificates", async ({ page }) => {
    await page.goto("/profile/certificates");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Certificados/i);
  });

  test("should display active sessions", async ({ page }) => {
    await page.goto("/profile/sessions");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Sessões/i);
  });
});
