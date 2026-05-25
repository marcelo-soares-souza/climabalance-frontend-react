import type { Page } from "@playwright/test";
import {
  test,
  expect,
  loginAsUser,
  seedCompensationSelection,
} from "../helpers/test-utils";
import { getMockApiState } from "../helpers/api-mock";
import { MOCK_AREA_ID } from "../fixtures/mock-data";

async function seedReviewSelection(page: Page) {
  await seedCompensationSelection(page, {
    areaId: MOCK_AREA_ID,
    areaName: "Reserva Legal Amazônia",
    treesRequested: 50,
    totalTCO2e: 5,
    totalAmount: 750,
    currency: "BRL",
    calculationId: "calc-001",
  });
}

test.describe("Compensation Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await seedReviewSelection(page);
  });

  test("should review the quote, edit tree quantity, and proceed to checkout", async ({
    page,
  }) => {
    await page.goto("/compensation/review");

    await expect(
      page.getByRole("heading", { name: /Revisar sua compensação/i }),
    ).toBeVisible();
    await expect(page.getByText(/Reserva Legal Amazônia/i)).toBeVisible();
    await expect(page.getByText(/R\$\s*750,00/i)).toBeVisible();

    await page.getByLabel(/Quantidade de árvores/i).fill("25");
    await expect(page.getByText(/R\$\s*375,00/i)).toBeVisible();
    await expect(page.getByText(/2,5 tCO2e/i)).toBeVisible();

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
    await expect(page.getByText(/R\$\s*375,00/i)).toBeVisible();
  });

  test("should complete the PIX payment path and reflect the new contribution in history pages", async ({
    page,
  }) => {
    await page.goto("/compensation/review");
    await page
      .getByRole("button", { name: /Prosseguir para pagamento/i })
      .click();

    await expect(page).toHaveURL("/compensation/checkout");
    await page.getByRole("tab", { name: /Pix/i }).click();
    await page.getByRole("button", { name: /Pagar com Pix/i }).click();

    await expect(page).toHaveURL(/\/payment\/pix\//);
    await expect(
      page.getByRole("heading", { name: /Pagamento via Pix/i }),
    ).toBeVisible();
    await expect(page.getByText(/copiar e colar/i)).toBeVisible();

    await expect(page).toHaveURL("/compensation/report", { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: /Comprovante da compensação/i }),
    ).toBeVisible();
    await expect(page.getByText(/R\$\s*750,00/i)).toBeVisible();
    await expect(page.getByText(/CERT-001/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Download/i })).toBeVisible();

    const mockState = getMockApiState(page);
    expect(mockState.requests.createdContributions).toHaveLength(1);
    expect(mockState.requests.paymentIntents).toHaveLength(1);

    await page.goto("/profile/compensations");
    await expect(
      page.getByRole("heading", { name: /Compensações/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/Reserva Legal Amazônia/i).first(),
    ).toBeVisible();
    await expect(page.getByText(/R\$\s*750,00/i).first()).toBeVisible();

    await page.goto("/profile/contributions");
    await expect(
      page.getByRole("heading", { name: /Compensações/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/Reserva Legal Amazônia/i).first(),
    ).toBeVisible();
  });

  test("should block checkout when the producer is not ready to receive support", async ({
    page,
  }) => {
    const mockState = getMockApiState(page);
    mockState.quoteOverride.producer_ready_to_receive_support = false;

    await page.goto("/compensation/review");
    await page
      .getByRole("button", { name: /Prosseguir para pagamento/i })
      .click();

    await expect(page).toHaveURL("/compensation/checkout");
    await expect(page.getByText(/produtor.*não.*configur/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Editar$/i })).toBeVisible();
  });
});
