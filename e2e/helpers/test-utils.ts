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

export async function interceptArea(
  page: Page,
  apiUrl: string,
  areaId: string,
  areaData?: Record<string, unknown>,
) {
  await page.route(`${apiUrl}/api/v1/areas/${areaId}`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: areaData ?? {
            id: areaId,
            name: "Área Mockada",
            slug: areaId,
            description: "Descrição mockada.",
            country_code: "BR",
            state: "PA",
            city: "Altamira",
            biome: "Amazônia",
            price_per_tree: 15,
            t_co2e_per_tree_per_year: 10,
            default_horizon_years: 20,
            status: "active",
            audit_status: "approved",
            owner: {
              id: "owner-001",
              name: "Proprietário",
              slug: "proprietario",
            },
            media: [],
            created_at: "2025-01-01T00:00:00Z",
            updated_at: "2025-04-01T00:00:00Z",
          },
        }),
      });
      return;
    }
    await route.fallback();
  });
}

export async function interceptAreaCapacity(
  page: Page,
  apiUrl: string,
  areaId: string,
) {
  await page.route(
    `${apiUrl}/api/v1/areas/${areaId}/capacity`,
    async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              total_trees: 5000,
              available_trees: 3450,
              total_capacity_tco2: 1000,
            },
          }),
        });
        return;
      }
      await route.fallback();
    },
  );
}

export async function interceptEmissionFactors(page: Page, apiUrl: string) {
  await page.route(
    `${apiUrl}/api/v1/footprint/emission-factors`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "factor-energy",
              activity_type: "electricity",
              factor_value: 0.5,
              factor_unit: "kwh",
              region: "BR",
              version: "2026.01",
            },
            {
              id: "factor-transport",
              activity_type: "car_medium",
              factor_value: 0.2,
              factor_unit: "km",
              region: "BR",
              version: "2026.01",
            },
          ],
        }),
      });
    },
  );
}

export async function selectOption(page: Page, label: string, value: string) {
  const select = page.locator(`select[id="${label}"]`);
  await select.selectOption(value);
}

export async function setupStripeMock(page: Page) {
  await page.addInitScript(() => {
    const stripeMock = (_publishableKey: string) => ({
      elements: () => {
        const mockElement = {
          mount: () => {},
          destroy: () => {},
          on: (_event: string, handler: Function) => {
            if (_event === "ready") setTimeout(handler, 50);
          },
          clear: () => {},
          focus: () => {},
        };
        return {
          create: (_type: string, _options?: Record<string, unknown>) =>
            mockElement,
          getElement: () => mockElement,
        };
      },
      confirmCardPayment: async (_clientSecret: string) => ({
        paymentIntent: {
          id: "pi-e2e-001",
          status: "succeeded",
          amount: 37500,
          currency: "BRL",
        },
      }),
    });
    (window as unknown as Record<string, unknown>).Stripe = stripeMock;
  });
}

export async function interceptCreatePaymentIntent(
  page: Page,
  apiUrl: string,
  overrides?: Record<string, unknown>,
) {
  await page.route(
    `${apiUrl}/api/v1/payments/create-payment-intent`,
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            payment_id: "pay-e2e-001",
            compensation_id: "comp-e2e-001",
            client_secret: "pi_mock_secret_123",
            payment_intent_id: "pi-e2e-001",
            payment_method: "card",
            ...overrides,
          },
        }),
      });
    },
  );
}

export async function interceptPaymentStatus(
  page: Page,
  apiUrl: string,
  overrides?: Record<string, unknown>,
) {
  await page.route(`${apiUrl}/api/v1/payments/**/status`, async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          payment_id: "pay-e2e-001",
          compensation_id: "comp-e2e-001",
          provider: "stripe",
          provider_reference: "pi-e2e-001",
          simulation_status: "confirmed",
          payment_status: "paid",
          compensation_status: "completed",
          amount: 375,
          currency: "BRL",
          installments: 1,
          processed_at: "2026-05-26T00:00:00Z",
          certificate: {
            id: "cert-e2e-001",
            certificate_number: "CERT-E2E-FULL",
            status: "issued",
            issued_at: "2026-05-26T00:00:00Z",
          },
          ...overrides,
        },
      }),
    });
  });
}

export async function getCurrentUserRefFromPage(page: Page): Promise<string> {
  await page.goto("/profile");
  await page.waitForLoadState("networkidle");
  const link = page.locator('a[href*="/users/"]').first();
  await expect(link).toBeVisible({ timeout: 10000 });
  const href = await link.getAttribute("href");
  if (!href) throw new Error("No scoped link found on profile page");
  const match = href.match(/\/users\/([^/]+)/);
  if (!match) throw new Error(`Could not extract user ref from "${href}"`);
  return match[1];
}

export async function interceptCreateContribution(
  page: Page,
  apiUrl: string,
  overrides?: Record<string, unknown>,
) {
  await page.route(`${apiUrl}/api/v1/contributions`, async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          compensation_id: "comp-e2e-001",
          area_id: "area-e2e-001",
          compensation_mode: "tree_purchase",
          horizon_years: 20,
          trees_requested: 25,
          price_per_tree: 15,
          estimated_total_t_co2e: 2.5,
          total_t_co2e: 2.5,
          total_amount: 375,
          currency: "BRL",
          status: "pending",
          created_at: "2026-05-26T00:00:00Z",
          ...overrides,
        },
      }),
    });
  });
}
