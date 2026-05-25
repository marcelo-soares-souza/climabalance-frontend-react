import { test as base, expect, type Page } from "@playwright/test";

export { expect };

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.context().addInitScript(() => {
      localStorage.setItem("cb_locale", "pt-BR");
      localStorage.setItem(
        "cb_cookie_consent",
        JSON.stringify({
          accepted: true,
          timestamp: "2026-05-25T00:00:00.000Z",
        }),
      );
    });
    await use(page);
  },
});

function getCredentials(roles: string[]) {
  const primaryRole = roles[0] ?? "individual";

  const roleMap: Record<string, { email?: string; password?: string }> = {
    administrator: {
      email: process.env.E2E_ADMIN_EMAIL,
      password: process.env.E2E_ADMIN_PASSWORD,
    },
    admin: {
      email: process.env.E2E_ADMIN_EMAIL,
      password: process.env.E2E_ADMIN_PASSWORD,
    },
    analyst: {
      email: process.env.E2E_ANALYST_EMAIL,
      password: process.env.E2E_ANALYST_PASSWORD,
    },
    producer: {
      email: process.env.E2E_PRODUCER_EMAIL,
      password: process.env.E2E_PRODUCER_PASSWORD,
    },
    individual: {
      email: process.env.E2E_USER_EMAIL,
      password: process.env.E2E_USER_PASSWORD,
    },
  };

  const fallback = {
    email: process.env.E2E_USER_EMAIL,
    password: process.env.E2E_USER_PASSWORD,
  };

  const creds = roleMap[primaryRole] ?? fallback;
  if (!creds.email || !creds.password) {
    throw new Error(
      `Missing credentials for role "${primaryRole}". Set the appropriate E2E_*_EMAIL and E2E_*_PASSWORD environment variables.`,
    );
  }

  return { email: creds.email, password: creds.password };
}

export async function loginAsUser(
  page: Page,
  roles: string[] = ["individual"],
) {
  const { email, password } = getCredentials(roles);

  for (let attempt = 0; attempt < 3; attempt++) {
    await page
      .evaluate(() => {
        localStorage.removeItem("cb_access_token");
        localStorage.removeItem("cb_csrf_token");
      })
      .catch(() => {});
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.getByLabel(/E-mail/i).fill(email);
    await page.getByLabel(/Senha/i).fill(password);
    await page
      .locator("main")
      .getByRole("button", { name: /Entrar/i })
      .click();

    try {
      await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
      return;
    } catch {
      if (attempt < 2) {
        await page.waitForTimeout(1000);
      }
    }
  }

  throw new Error(`Login failed for role "${roles[0]}" after 3 attempts.`);
}

export async function loginAsAdmin(page: Page) {
  await loginAsUser(page, ["administrator"]);
}

export async function loginAsProducer(page: Page) {
  await loginAsUser(page, ["producer"]);
}

export async function loginAsAnalyst(page: Page) {
  await loginAsUser(page, ["analyst"]);
}

export async function seedCompensationSelection(
  page: Page,
  selection: {
    areaId: string;
    areaName: string;
    treesRequested: number;
    totalTCO2e: number;
    totalAmount: number;
    currency?: string;
    calculationId?: string | null;
  },
) {
  await page.evaluate((data) => {
    localStorage.setItem(
      "cb_compensation",
      JSON.stringify({
        state: {
          areaId: data.areaId,
          areaName: data.areaName,
          calculationId: data.calculationId ?? null,
          compensationMode: "tree_purchase",
          treesRequested: data.treesRequested,
          totalTCO2e: data.totalTCO2e,
          totalAmount: data.totalAmount,
          currency: data.currency ?? "BRL",
        },
        version: 0,
      }),
    );
  }, selection);
}

export async function navigateWithState(
  page: Page,
  pathname: string,
  state: Record<string, unknown>,
) {
  await page.evaluate(
    ({ nextPathname, nextState }) => {
      window.history.pushState(nextState, "", nextPathname);
      window.dispatchEvent(new PopStateEvent("popstate", { state: nextState }));
    },
    { nextPathname: pathname, nextState: state },
  );
}

export function waitForPageReady(page: Page) {
  return page.waitForLoadState("networkidle");
}

export async function waitAndClick(page: Page, selector: string) {
  await page.waitForSelector(selector, { state: "visible" });
  await page.click(selector);
}

export async function fillInput(page: Page, label: string, value: string) {
  const input = page.locator(`input[id="${label}"]`);
  await input.fill(value);
}

export async function selectOption(page: Page, label: string, value: string) {
  const select = page.locator(`select[id="${label}"]`);
  await select.selectOption(value);
}
