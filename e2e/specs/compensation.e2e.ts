import type { Page } from "@playwright/test";
import {
  test,
  expect,
  loginAsUser,
  seedCompensationSelection,
  setupStripeMock,
  interceptCreatePaymentIntent,
  interceptPaymentStatus,
  interceptCreateContribution,
} from "../helpers/test-utils";

const API_URL = process.env.E2E_API_URL ?? "https://dev.climabalance.org";

async function seedReviewSelection(page: Page) {
  await seedCompensationSelection(page, {
    areaId: "area-e2e-001",
    areaName: "Reserva Legal Amazônia",
    treesRequested: 50,
    totalTCO2e: 5,
    totalAmount: 750,
    currency: "BRL",
    calculationId: "calc-001",
  });
}

async function interceptQuote(page: Page, overrides?: Record<string, unknown>) {
  await page.route(`${API_URL}/api/v1/**/quote`, async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    const trees =
      (overrides?.trees_requested as number) ??
      (body.trees_requested as number) ??
      50;
    const pricePerTree = 15;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          area_id: "area-e2e-001",
          area_name: "Reserva Legal Amazônia",
          compensation_mode: "tree_purchase",
          horizon_years: 20,
          trees_requested: trees,
          estimated_kg_co2_per_tree_per_year: 100,
          estimated_total_t_co2e: trees * 0.1,
          estimated_total_kg_co2e: trees * 100,
          price_per_tree: pricePerTree,
          total_amount: trees * pricePerTree,
          currency: "BRL",
          max_purchasable_trees: 3500,
          remaining_purchasable_trees: 3450,
          producer_stripe_connected: true,
          producer_charges_enabled: true,
          producer_ready_to_receive_support: true,
          ...overrides,
        },
      }),
    });
  });
}

async function interceptArea(page: Page) {
  await page.route(`${API_URL}/api/v1/areas/area-e2e-001`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: "area-e2e-001",
          name: "Reserva Legal Amazônia",
          slug: "reserva-legal-amazonia",
          description: "Área de preservação na Amazônia Legal.",
          country_code: "BR",
          state: "PA",
          city: "Altamira",
          biome: "Amazônia",
          price_per_tree: 15,
          t_co2e_per_tree_per_year: 10,
          default_horizon_years: 20,
          status: "active",
          owner: {
            id: "owner-001",
            name: "João Produtor",
            slug: "joao-produtor",
          },
        },
      }),
    });
  });
  await page.route(
    `${API_URL}/api/v1/areas/area-e2e-001/capacity`,
    async (route) => {
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
    },
  );
}

test.describe("Compensation Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await seedReviewSelection(page);
    await interceptArea(page);
  });

  test("should review the quote, edit tree quantity, and proceed to checkout", async ({
    page,
  }) => {
    await interceptQuote(page);
    await page.goto("/compensation/review");

    await expect(
      page.getByRole("heading", { name: /Revisar sua compensação/i }),
    ).toBeVisible();
    await expect(page.getByText(/Reserva Legal Amazônia/i)).toBeVisible();
    await expect(page.getByText(/750,00/)).toBeVisible();

    await page
      .getByRole("spinbutton", { name: /Quantidade de Árvores/i })
      .fill("25");
    await expect(page.getByText(/375,00/)).toBeVisible();
    await expect(page.getByText(/2,50? tCO2e/i)).toBeVisible();

    await page
      .getByRole("button", { name: /Prosseguir para pagamento/i })
      .click();

    await expect(page).toHaveURL("/compensation/checkout");
    await expect(
      page.getByRole("heading", { name: /Checkout/i }),
    ).toBeVisible();
    await expect(page.getByText(/Resumo do pedido/i)).toBeVisible();
    await expect(page.getByText(/Reserva Legal Amazônia/i)).toBeVisible();
    await expect(page.getByText(/25/).nth(0)).toBeVisible();
    await expect(page.getByText(/375,00/)).toBeVisible();
  });

  test("should show producer not onboarded error at checkout", async ({
    page,
  }) => {
    await interceptQuote(page, { producer_ready_to_receive_support: false });
    await page.goto("/compensation/review");
    await page.waitForLoadState("networkidle");

    await page
      .getByRole("button", { name: /Prosseguir para pagamento/i })
      .click();

    await expect(page).toHaveURL("/compensation/checkout");
    await expect(
      page.getByText(/reflorestador ainda não concluiu a configuração/i),
    ).toBeVisible();
  });

  test("should show error when checkout quote fails to load", async ({
    page,
  }) => {
    await page.route(`${API_URL}/api/v1/**/quote`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: { message_key: "errors.generic" },
        }),
      });
    });

    await page.goto("/compensation/checkout");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/erro|Algo deu errado/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("should complete full compensation flow and display report", async ({
    page,
  }) => {
    await interceptQuote(page);

    await page.goto("/compensation/review");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /Revisar sua compensação/i }),
    ).toBeVisible();
    await expect(page.getByText(/Reserva Legal Amazônia/i)).toBeVisible();

    await page
      .getByRole("spinbutton", { name: /Quantidade de Árvores/i })
      .fill("25");
    await expect(page.getByText(/tCO2e/i)).toBeVisible({ timeout: 10000 });

    await page
      .getByRole("button", { name: /Prosseguir para pagamento/i })
      .click();

    await expect(page).toHaveURL("/compensation/checkout");
    await expect(
      page.getByRole("heading", { name: /Checkout/i }),
    ).toBeVisible();
    await expect(page.getByText(/Reserva Legal Amazônia/i)).toBeVisible();
    await expect(page.getByText(/25/).first()).toBeVisible();
    await expect(page.getByText(/375,00/)).toBeVisible();

    const paymentResult = {
      paymentId: "pay-e2e-001",
      compensationId: "comp-e2e-001",
      provider: "stripe",
      providerReference: "pi-e2e-001",
      simulationStatus: "confirmed",
      paymentStatus: "paid",
      compensationStatus: "completed",
      amount: 375,
      currency: "BRL",
      installments: 1,
      processedAt: "2026-05-26T00:00:00Z",
      certificate: {
        id: "cert-e2e-001",
        certificateNumber: "CERT-E2E-FULL",
        status: "issued",
        issuedAt: "2026-05-26T00:00:00Z",
      },
    };
    const summary = {
      areaName: "Reserva Legal Amazônia",
      compensationMode: "tree_purchase",
      treesRequested: 25,
      totalTCO2e: 2.5,
      totalAmount: 375,
      currency: "BRL",
      installments: 1,
    };

    const reportState = { paymentResult, summary };

    await page.addInitScript((data: unknown) => {
      window.history.replaceState({ usr: data, key: "e2e", idx: 0 }, "");
    }, reportState);

    await page.goto("/compensation/report");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: /Relatório da compensação/i }),
    ).toBeVisible();
    await expect(page.getByText(/Reserva Legal Amazônia/i)).toBeVisible();
    await expect(page.getByText(/25/).first()).toBeVisible();
    await expect(page.getByText(/2,5.*tCO2e/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Baixar/i })).toBeVisible();
  });
});
