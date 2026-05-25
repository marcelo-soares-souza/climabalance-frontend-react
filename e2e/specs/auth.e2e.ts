import { test, expect, loginAsUser } from "../helpers/test-utils";
import {
  LoginPage,
  RegisterPage,
  PasswordResetPage,
  ConfirmEmailPage,
} from "../pages/auth.po";

const API_URL = process.env.E2E_API_URL ?? "https://dev.climabalance.org";

test.describe("Authentication", () => {
  test("should display login page and navigate to register", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(page.locator("h1")).toHaveText(/Bem-vindo de volta/i);
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();

    await loginPage.registerLink.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("should login successfully and redirect to home", async ({ page }) => {
    await loginAsUser(page);
    await expect(page).toHaveURL("/");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should show error on invalid login", async ({ page }) => {
    await page.route(`${API_URL}/api/v1/auth/login`, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          error: { message_key: "auth.invalid_credentials" },
        }),
      });
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("wrong@email.com", "wrongpassword");

    await expect(page.getByText(/E-mail ou senha inválidos/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("should display register page with all required fields", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toHaveText(/Criar conta/i);
    await expect(page.locator('input[id="name"]')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('input[id="passwordConfirm"]')).toBeVisible();
    await expect(page.locator('select[id="roleKey"]')).toBeVisible();
    await expect(page.locator('input[type="checkbox"]')).toBeVisible();
  });

  test("should register successfully and redirect to email confirmation", async ({
    page,
  }) => {
    await page.route(`${API_URL}/api/v1/auth/human-check`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            challenge_id: "mock-challenge-001",
            question: "Quanto é 3 + 5?",
          },
        }),
      });
    });

    await page.route(`${API_URL}/api/v1/auth/register`, async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: "registered-user-id",
            email: "maria@example.com",
            status: "pending_confirmation",
          },
        }),
      });
    });

    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register(
      "Maria Silva",
      "maria@example.com",
      "Test@789!aA",
      "individual",
      "8",
    );
    await expect(page).toHaveURL(/\/confirm-email/);
  });

  test("should confirm email", async ({ page }) => {
    await page.route(`${API_URL}/api/v1/auth/confirm-email`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { message: "Email confirmed" } }),
      });
    });

    const confirmPage = new ConfirmEmailPage(page);
    await confirmPage.goto();
    await confirmPage.confirm("valid-token-123");

    await expect(
      page.locator("text=/confirmado|sucesso|success/i").first(),
    ).toBeVisible();
  });

  test("should request password reset", async ({ page }) => {
    await page.route(
      `${API_URL}/api/v1/auth/password-reset/request`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: { message: "Reset email sent" } }),
        });
      },
    );

    const resetPage = new PasswordResetPage(page);
    await resetPage.gotoRequest();
    await resetPage.requestReset("maria@example.com");

    await expect(page.locator("text=/enviado|email/i")).toBeVisible();
  });

  test("should confirm password reset", async ({ page }) => {
    await page.route(
      `${API_URL}/api/v1/auth/password-reset/confirm`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: { message: "Password reset" } }),
        });
      },
    );

    const resetPage = new PasswordResetPage(page);
    await resetPage.gotoConfirm();
    await resetPage.confirmReset("reset-token-123", "New@789!aA");

    await expect(page.locator("h1")).toHaveText(/Senha atualizada/i);
  });

  test("should logout successfully", async ({ page }) => {
    await loginAsUser(page);

    const sairButton = page.getByRole("button", { name: /Sair/i }).first();
    await expect(sairButton).toBeVisible();
    await sairButton.click();

    await expect(
      page.getByRole("button", { name: /Entrar/i }).first(),
    ).toBeVisible();
  });
});
