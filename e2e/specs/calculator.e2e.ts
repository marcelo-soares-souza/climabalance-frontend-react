import type { Page } from "@playwright/test";
import { test, expect, loginAsUser } from "../helpers/test-utils";

const API_URL = process.env.E2E_API_URL ?? "https://dev.climabalance.org";

async function interceptEmissionFactors(page: Page) {
  await page.route(
    `${API_URL}/api/v1/footprint/emission-factors`,
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

async function completeAuthenticatedCalculation(page: Page) {
  await page.goto("/footprint/calculator");
  await page.waitForSelector('button:has-text("Próximo")', {
    timeout: 10000,
  });
  await page.getByRole("button", { name: /Próximo/i }).click();

  await page.getByLabel(/Energia Elétrica Residencial/i).fill("3600");
  await page.getByRole("button", { name: /Próximo/i }).click();

  await page.getByRole("button", { name: /Próximo/i }).click();

  await page.getByLabel(/Automóvel/i).fill("15000");
  await page.getByRole("button", { name: /Próximo/i }).click();

  await page.getByRole("button", { name: /Calcular/i }).click();
  await expect(page.getByText(/7,8/).first()).toBeVisible({ timeout: 10000 });
}

async function completeGuestCalculation(page: Page) {
  await page.goto("/calculator");
  await page.waitForSelector('button:has-text("Próximo")', {
    timeout: 10000,
  });
  await page.getByRole("button", { name: /Próximo/i }).click();

  await page.getByLabel(/Energia Elétrica Residencial/i).fill("1800");
  await page.getByRole("button", { name: /Próximo/i }).click();

  await page.getByRole("button", { name: /Próximo/i }).click();

  await page.getByLabel(/Automóvel/i).fill("5000");
  await page.getByRole("button", { name: /Próximo/i }).click();

  await page.getByRole("button", { name: /Calcular/i }).click();
}

test.describe("Carbon Footprint Calculator", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await interceptEmissionFactors(page);
  });

  test("should save a draft, finalize it, and show the finalized detail", async ({
    page,
  }) => {
    let calculationFinalized = false;

    await page.route(
      `${API_URL}/api/v1/footprint/calculations**`,
      async (route) => {
        const method = route.request().method();
        const url = route.request().url();

        if (method === "POST" && !url.includes("/finalize")) {
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify({
              data: {
                calculation_id: "calc-e2e-001",
                status: "draft",
                total_kg_co2e: 7800,
                total_t_co2e: 7.8,
                breakdown: [
                  { category: "energy", kg_co2e: 1800, t_co2e: 1.8 },
                  { category: "transport", kg_co2e: 6000, t_co2e: 6.0 },
                ],
              },
            }),
          });
          return;
        }

        if (method === "POST" && url.includes("/finalize")) {
          calculationFinalized = true;
          await route.fulfill({ status: 204 });
          return;
        }

        if (method === "GET" && url.includes("/calc-e2e-001")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: {
                id: "calc-e2e-001",
                calculation_id: "calc-e2e-001",
                user_id: "user-001",
                profile_type: "individual",
                period_start: "2025-01-01",
                period_end: "2025-12-31",
                total_kg_co2e: 7800,
                total_t_co2e: 7.8,
                status: calculationFinalized ? "finalized" : "draft",
                data_quality: "real",
                inputs: [
                  {
                    id: "input-1",
                    category: "energy",
                    activity_type: "electricity",
                    quantity: 3600,
                    unit: "kwh",
                    kg_co2e: 1800,
                    metadata: null,
                  },
                  {
                    id: "input-2",
                    category: "transport",
                    activity_type: "transport_car_medium",
                    quantity: 15000,
                    unit: "km",
                    kg_co2e: 6000,
                    metadata: null,
                  },
                ],
                breakdown: [
                  { category: "energy", kg_co2e: 1800, t_co2e: 1.8 },
                  { category: "transport", kg_co2e: 6000, t_co2e: 6.0 },
                ],
                created_at: "2025-05-01T00:00:00Z",
                updated_at: "2025-05-01T00:00:00Z",
              },
            }),
          });
          return;
        }

        if (method === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: [
                {
                  id: "calc-e2e-001",
                  calculation_id: "calc-e2e-001",
                  user_id: "user-001",
                  profile_type: "individual",
                  period_start: "2025-01-01",
                  period_end: "2025-12-31",
                  total_kg_co2e: 7800,
                  total_t_co2e: 7.8,
                  status: calculationFinalized ? "finalized" : "draft",
                  data_quality: "real",
                  factors_version: "2026.01",
                  region: "BR",
                  created_at: "2025-05-01T00:00:00Z",
                  updated_at: "2025-05-01T00:00:00Z",
                },
              ],
            }),
          });
          return;
        }

        await route.fallback();
      },
    );

    await completeAuthenticatedCalculation(page);

    await loginAsUser(page, ["administrator"]);
    await page.goto("/footprint/calculation/calc-e2e-001");
    await page.getByRole("button", { name: /Finalizar/i }).click();

    await page.goto("/footprint/history");
    await expect(
      page.getByRole("heading", { name: /Histórico de Cálculos/i }),
    ).toBeVisible();

    await page.getByText(/7,80/).first().click();
    await expect(page).toHaveURL(/\/footprint\/calculation\/calc-e2e-001$/);
    await expect(
      page.getByRole("button", { name: /Compensar/i }),
    ).toBeVisible();
    await expect(page.getByText(/3600 kwh/i)).toBeVisible();
    await expect(page.getByText(/15000 km/i)).toBeVisible();
  });

  test("should calculate a guest footprint with visible result assertions", async ({
    page,
  }) => {
    await page.route(
      `${API_URL}/api/v1/footprint/calculate-guest`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              total_kg_co2e: 1900,
              total_t_co2e: 1.9,
              breakdown: [
                { category: "energy", kg_co2e: 900, t_co2e: 0.9 },
                { category: "transport", kg_co2e: 1000, t_co2e: 1.0 },
              ],
              data_quality: "estimated",
              factors_version: "2026.01",
            },
          }),
        });
      },
    );

    await completeGuestCalculation(page);

    await expect(page.getByText(/1,9/).first()).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("button", { name: /Entrar e Compensar/i }),
    ).toBeVisible();
  });

  test("should calculate a trip footprint and forward to compensation discovery", async ({
    page,
  }) => {
    await page.route(
      `${API_URL}/api/v1/footprint/calculate-guest`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              total_kg_co2e: 434,
              total_t_co2e: 0.434,
              breakdown: [{ category: "flights", kg_co2e: 434, t_co2e: 0.434 }],
              data_quality: "estimated",
              factors_version: "2026.01",
            },
          }),
        });
      },
    );

    await page.goto("/calculator/trip");

    const selects = page.locator(".max-w-2xl select");
    await selects.nth(0).selectOption("0");
    await selects.nth(1).selectOption("3");
    await page.getByRole("button", { name: /Executiva/i }).click();

    await expect(page.getByText(/São Paulo → Brasília/i)).toBeVisible();
    await expect(page.getByText(/kg.*CO2e/i)).toBeVisible();

    await page.getByRole("button", { name: /Compensar/i }).click();
    await expect(page).toHaveURL(/\/map\?tCO2e=/);
  });

  test("should render the compensation report route with payment summary state", async ({
    page,
  }) => {
    const reportState = {
      paymentResult: {
        paymentId: "pay-report",
        compensationId: "contrib-report",
        provider: "stripe",
        providerReference: "pi-report",
        simulationStatus: "confirmed",
        paymentStatus: "paid",
        compensationStatus: "completed",
        amount: 750,
        currency: "BRL",
        installments: 1,
        processedAt: "2025-05-01T00:00:00Z",
        certificate: {
          id: "cert-report",
          certificateNumber: "CERT-REPORT",
          status: "issued",
          issuedAt: "2025-05-01T00:00:00Z",
        },
      },
      summary: {
        areaName: "Reserva Legal Amazônia",
        compensationMode: "tree_purchase",
        treesRequested: 50,
        totalTCO2e: 5,
        totalAmount: 750,
        currency: "BRL",
        installments: 1,
      },
    };

    await page.addInitScript((data) => {
      window.history.replaceState({ usr: data, key: "e2e", idx: 0 }, "");
    }, reportState);

    await page.goto("/compensation/report");

    await expect(
      page.getByRole("heading", { name: /Relatório da compensação/i }),
    ).toBeVisible();
    await expect(page.getByText(/Reserva Legal Amazônia/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Baixar/i })).toBeVisible();
  });

  test("should show empty state when no calculations exist", async ({
    page,
  }) => {
    await page.route(
      `${API_URL}/api/v1/footprint/calculations`,
      async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: [] }),
          });
          return;
        }
        await route.fallback();
      },
    );

    await page.goto("/footprint/history");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByText(/Você ainda não fez nenhum cálculo/i),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Iniciar Nova Calculadora/i }),
    ).toBeVisible();
  });
});
