import type { Page } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
    await this.page.waitForLoadState("networkidle");
  }

  async login(email: string, password: string) {
    await this.page.locator('input[id="email"]').fill(email);
    await this.page.locator('input[id="password"]').fill(password);
    await this.page.getByRole("button", { name: "Entrar" }).click();
  }

  get forgotPasswordLink() {
    return this.page.getByRole("link", { name: /Esqueci/ });
  }
  get registerLink() {
    return this.page.getByRole("link", { name: /Criar uma conta/ });
  }
  get errorMessage() {
    return this.page.locator("text=E-mail ou senha inválidos");
  }
}

export class RegisterPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/register");
    await this.page.waitForLoadState("networkidle");
  }

  async register(
    name: string,
    email: string,
    password: string,
    role: string,
    humanAnswer: string,
  ) {
    await this.page.locator('input[id="name"]').fill(name);
    await this.page.locator('input[id="email"]').fill(email);
    await this.page.locator('input[id="password"]').first().fill(password);
    await this.page.locator('input[id="passwordConfirm"]').fill(password);
    await this.page.locator('select[id="roleKey"]').selectOption(role);
    await this.page.locator('input[id="humanAnswer"]').fill(humanAnswer);
    await this.page.locator('input[type="checkbox"]').check();
    await this.page.getByRole("button", { name: "Criar conta" }).click();
  }
}

export class PasswordResetPage {
  constructor(private page: Page) {}

  async gotoRequest() {
    await this.page.goto("/password-reset");
    await this.page.waitForLoadState("networkidle");
  }
  async gotoConfirm() {
    await this.page.goto("/password-reset/confirm");
    await this.page.waitForLoadState("networkidle");
  }

  async requestReset(email: string) {
    await this.page.locator('input[id="email"]').fill(email);
    await this.page.getByRole("button", { name: /Enviar link/i }).click();
  }

  async confirmReset(token: string, password: string) {
    await this.page.locator('input[id="token"]').fill(token);
    await this.page.locator('input[id="password"]').fill(password);
    await this.page.locator('input[id="passwordConfirm"]').fill(password);
    await this.page.getByRole("button", { name: /Atualizar senha/i }).click();
  }
}

export class ConfirmEmailPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/confirm-email");
    await this.page.waitForLoadState("networkidle");
  }
  async confirm(token: string) {
    await this.page.locator('input[id="token"]').fill(token);
    await this.page.getByRole("button", { name: /Confirmar/ }).click();
  }
}
