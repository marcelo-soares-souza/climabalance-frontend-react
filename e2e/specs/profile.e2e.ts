import { test, expect, loginAsUser } from "../helpers/test-utils";

const API_URL = process.env.E2E_API_URL ?? "https://dev.climabalance.org";

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

  test("should save profile changes and redirect to profile", async ({
    page,
  }) => {
    let updatePayload: Record<string, unknown> | null = null;
    await page.route(`${API_URL}/api/v1/users/*/profile`, async (route) => {
      if (route.request().method() === "PUT") {
        updatePayload = route.request().postDataJSON() as Record<
          string,
          unknown
        >;
      }
      await route.fallback();
    });

    await page.goto("/profile/edit");
    await page.waitForLoadState("networkidle");

    await page.locator("#display_name").fill("Maria QA");
    await page.locator("#address_city").fill("Campinas");
    await page.getByRole("button", { name: /Salvar/i }).click();

    await expect(page).toHaveURL(/\/profile$/);
    await expect.poll(() => updatePayload?.display_name).toBe("Maria QA");
    await expect.poll(() => updatePayload?.address_city).toBe("Campinas");
  });

  test("should revoke all active sessions", async ({ page }) => {
    let revokeAllCalls = 0;
    await page.route(`${API_URL}/api/v1/auth/sessions`, async (route) => {
      if (route.request().method() === "DELETE") {
        revokeAllCalls += 1;
      }
      await route.fallback();
    });

    await page.goto("/profile/sessions");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /Sair de todos/i }).click();
    await page
      .getByRole("button", { name: /Sair de todos/i })
      .last()
      .click();

    await expect.poll(() => revokeAllCalls).toBe(1);
  });
});
