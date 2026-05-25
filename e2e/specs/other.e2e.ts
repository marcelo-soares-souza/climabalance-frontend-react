import { test, expect, loginAsUser } from "../helpers/test-utils";

test.describe("Other Pages & Flows", () => {
  test("should display home page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should display about page", async ({ page }) => {
    await page.goto("/about");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should display how-to-use page", async ({ page }) => {
    await page.goto("/how-to-use");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should display privacy policy", async ({ page }) => {
    await page.goto("/privacy-policy");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Política de Privacidade/i);
  });

  test("should display terms of use", async ({ page }) => {
    await page.goto("/terms-of-use");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Termos de Uso/i);
  });

  test("should display access denied page", async ({ page }) => {
    await page.goto("/access-denied");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Acesso Negado|Sem permissão/i);
  });

  test("should redirect unknown routes to home", async ({ page }) => {
    await page.goto("/nonexistent-route");
    await expect(page).toHaveURL("/");
  });

  test("should display certificate validation page", async ({ page }) => {
    await page.goto("/certificates/validate");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Validar Certificado/i);
  });

  test("should display user directory", async ({ page }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Produtores e apoiadores/i);
  });

  test.describe("Authenticated", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page);
    });

    test("should display contact page", async ({ page }) => {
      await page.goto("/contact");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1")).toHaveText(/Fale Conosco/i);
      await expect(page.locator("textarea")).toBeVisible();
    });

    test("should display onboarding page", async ({ page }) => {
      await page.goto("/onboarding");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1")).toBeVisible();
    });

    test("should submit contact form successfully", async ({ page }) => {
      await page.goto("/contact");
      await page.waitForLoadState("networkidle");

      await page
        .locator("#message")
        .fill("Preciso de ajuda para apoiar uma área.");
      await page.getByRole("button", { name: /Enviar/i }).click();

      await expect(page.locator("#message")).toHaveValue("");
      await expect(
        page.getByText(/mensagem enviada com sucesso/i),
      ).toBeVisible();
    });
  });

  test("should validate a certificate and display the result", async ({
    page,
  }) => {
    await page.goto("/certificates/validate");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("Ex: CERT-2025-001").fill("CERT-001");
    await page.getByPlaceholder("Ex: abc123def456...").fill("hash-valido");
    await page.getByRole("button", { name: /Validar/i }).click();

    await expect(page.getByText(/Certificado Válido/i)).toBeVisible();
    await expect(page.getByText("CERT-001")).toBeVisible();
  });
});
