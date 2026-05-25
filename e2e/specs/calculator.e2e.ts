import type { Page } from "@playwright/test";
import { test, expect, navigateWithState } from "../helpers/test-utils";
import { getMockApiState } from "../helpers/api-mock";
import { MOCK_USER_ID } from "../fixtures/mock-data";

async function completeAuthenticatedCalculation(page: Page) {
  await page.goto("/footprint/calculator");
  await page.getByRole("button", { name: /Próximo/i }).click();

  await page.getByLabel(/Eletricidade/i).fill("3600");
  await page.getByRole("button", { name: /Próximo/i }).click();

  await page.getByRole("button", { name: /Próximo/i }).click();

  await page.getByLabel(/^Carro/i).fill("15000");
  await page.getByRole("button", { name: /Próximo/i }).click();

  await page.getByRole("button", { name: /Calcular/i }).click();
  await expect(page.getByText(/7,8 tCO2e/i)).toBeVisible();
}

async function completeGuestCalculation(page: Page) {
  await page.goto("/calculator");
  await page.getByRole("button", { name: /Próximo/i }).click();

  await page.getByLabel(/Eletricidade/i).fill("1800");
  await page.getByRole("button", { name: /Próximo/i }).click();

  await page.getByRole("button", { name: /Próximo/i }).click();

  await page.getByLabel(/^Carro/i).fill("5000");
  await page.getByRole("button", { name: /Próximo/i }).click();

  await page.getByRole("button", { name: /Calcular/i }).click();
}

test.describe("Carbon Footprint Calculator", () => {
  test("should save a draft, finalize it, persist it in history, and show the finalized detail", async ({
    page,
  }) => {
    await completeAuthenticatedCalculation(page);

    const mockState = getMockApiState(page);
    expect(mockState.requests.createdCalculations).toHaveLength(1);
    expect(mockState.calculations[0]?.status).toBe("draft");

    await page.getByRole("button", { name: /Finalizar/i }).click();
    expect(mockState.requests.finalizedCalculations).toEqual([
      mockState.calculations[0]?.id,
    ]);

    await page.goto("/footprint/history");
    await expect(
      page.getByRole("heading", { name: /Histórico de Cálculos/i }),
    ).toBeVisible();
    await expect(page.getByText(/7,8 tCO2e/i).first()).toBeVisible();

    await page
      .getByText(/7,8 tCO2e/i)
      .first()
      .click();
    await expect(page).toHaveURL(/\/footprint\/calculation\/calc-003$/);
    await expect(
      page.getByRole("button", { name: /Compensar/i }),
    ).toBeVisible();
    await expect(page.getByText(/3\.600 kwh/i)).toBeVisible();
    await expect(page.getByText(/15\.000 km/i)).toBeVisible();
  });

  test("should cover scoped impact routes for the authenticated user", async ({
    page,
  }) => {
    await page.goto("/users/maria-silva/impact");
    await expect(
      page.getByRole("heading", { name: /Histórico de Cálculos/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Novo cálculo/i }).click();
    await expect(page).toHaveURL("/users/maria-silva/impact/calculations/new");

    await page.goto(`/users/${MOCK_USER_ID}/impact/calculations/calc-001`);
    await expect(
      page.getByRole("button", { name: /Compensar/i }),
    ).toBeVisible();

    await page.goto("/users/maria-silva/impact/calculations/calc-002/edit");
    await expect(
      page.getByRole("heading", { name: /Calculadora de Pegada/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/Eletricidade/i)).toHaveValue("1200");
  });

  test("should calculate a guest footprint with visible result assertions", async ({
    page,
  }) => {
    await completeGuestCalculation(page);

    const mockState = getMockApiState(page);
    expect(mockState.requests.guestCalculations).toHaveLength(1);
    await expect(page.getByText(/1,9 tCO2e/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Salvar e compensar/i }),
    ).toBeVisible();
  });

  test("should calculate a trip footprint and forward the user to compensation discovery", async ({
    page,
  }) => {
    await page.goto("/calculator/trip");

    await page.getByLabel(/Origem/i).selectOption("0");
    await page.getByLabel(/Destino/i).selectOption("3");
    await page.getByRole("button", { name: /Executiva/i }).click();

    await expect(page.getByText(/São Paulo → Brasília/i)).toBeVisible();
    await expect(page.getByText(/kgCO2e/i)).toBeVisible();

    await page.getByRole("button", { name: /Compensar/i }).click();
    await expect(page).toHaveURL(/\/map\?tCO2e=/);
  });

  test("should render the compensation report route with payment summary state", async ({
    page,
  }) => {
    await page.goto("/");

    await navigateWithState(page, "/compensation/report", {
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
    });

    await expect(
      page.getByRole("heading", { name: /Comprovante da compensação/i }),
    ).toBeVisible();
    await expect(page.getByText(/Reserva Legal Amazônia/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Download/i })).toBeVisible();
  });
});
