import {
  test,
  expect,
  loginAsUser,
  loginAsProducer,
  loginAsAnalyst,
} from "../helpers/test-utils";

test.describe("Map & Areas", () => {
  test("should display map page", async ({ page }) => {
    await page.goto("/map");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Mapa de Áreas/i);
    await expect(page.locator(".leaflet-container")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should view public area detail", async ({ page }) => {
    await page.goto("/areas/reserva-legal-amazonia");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Reserva Legal Amazônia/i);
  });

  test("should display public areas list", async ({ page }) => {
    await page.goto("/areas/public");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should show access denied for non-admin on admin route", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/access-denied/);
  });

  test.describe("Authenticated", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page);
    });

    test("should list authenticated areas", async ({ page }) => {
      await page.goto("/areas");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1")).toBeVisible();
    });

    test("should view certificate validation page", async ({ page }) => {
      await page.goto("/certificates/validate");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1")).toHaveText(/Validar Certificado/i);
    });
  });

  test.describe("Producer", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsProducer(page);
    });

    test("should display create area form", async ({ page }) => {
      await page.goto("/areas/create");
      await page.waitForLoadState("networkidle");
      await expect(page.locator('input[id="name"]')).toBeVisible();
      await expect(page.locator('input[id="latitude"]')).toBeVisible();
      await expect(page.locator('input[id="longitude"]')).toBeVisible();
    });

    test("should create a new area", async ({ page }) => {
      await page.goto("/areas/create");
      await page.waitForLoadState("networkidle");
      await page.locator('input[id="name"]').fill("Nova Área Teste");
      await page.locator('input[id="latitude"]').fill("-15.7939");
      await page.locator('input[id="longitude"]').fill("-47.8828");
      await page.locator('button[type="submit"]').click({ force: true });
      await expect(page).toHaveURL(/\/areas\//);
    });

    test("should edit an existing area", async ({ page }) => {
      await page.goto("/areas/edit/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).toBeVisible();
    });

    test("should display tree planting page", async ({ page }) => {
      await page.goto(
        "/areas/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a/plant-trees",
      );
      await page.waitForLoadState("networkidle");
      await expect(page.locator(".leaflet-container")).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe("Analyst", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAnalyst(page);
    });

    test("should display pending areas for audit", async ({ page }) => {
      await page.goto("/audit/pending-areas");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1")).toHaveText(/Áreas Pendentes/i);
    });

    test("should review area for audit", async ({ page }) => {
      await page.goto("/audit/area/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1")).toBeVisible();
    });
  });
});
