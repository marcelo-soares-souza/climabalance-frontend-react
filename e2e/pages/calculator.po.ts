import type { Page } from "@playwright/test";
import { fillInput, selectOption } from "../helpers/test-utils";

export class CalculatorPage {
  constructor(private page: Page) {}

  async gotoGuest() {
    await this.page.goto("/calculator");
  }
  async gotoAuthenticated() {
    await this.page.goto("/footprint/calculator");
  }
  async gotoHistory() {
    await this.page.goto("/footprint/history");
  }

  async selectProfileType(type: string) {
    await selectOption(this.page, "profileType", type);
  }
  async fillPeriodStart(date: string) {
    await fillInput(this.page, "periodStart", date);
  }
  async fillPeriodEnd(date: string) {
    await fillInput(this.page, "periodEnd", date);
  }
  async selectDataQuality(quality: string) {
    await selectOption(this.page, "dataQuality", quality);
  }

  async nextStep() {
    await this.page.click('button:has-text("Próximo")');
  }
  async calculate() {
    await this.page.click('button:has-text("Calcular")');
  }
  async saveAndCompensate() {
    await this.page.click('button:has-text("Compensar")');
  }

  async fillEnergyInput(value: string) {
    await fillInput(this.page, "energy_electricity_kwh", value);
  }
  async fillTransportInput(value: string) {
    await fillInput(this.page, "transport_car_km", value);
  }

  get resultSection() {
    return this.page.locator('[data-testid="calculation-result"]');
  }
  get breakdownChart() {
    return this.page.locator('[data-testid="breakdown-chart"]');
  }
  get historyList() {
    return this.page.locator('[data-testid="history-list"]');
  }
  get calculationItem() {
    return this.page.locator('[data-testid="calculation-item"]');
  }
  get newCalculationButton() {
    return this.page.locator(
      'a[href="/footprint/calculator"], a[href*="calculations/new"]',
    );
  }
}

export class CalculationDetailPage {
  constructor(private page: Page) {}

  async goto(id: string) {
    await this.page.goto(`/footprint/calculation/${id}`);
  }

  get totalTco2() {
    return this.page.locator('[data-testid="total-tco2"]');
  }
  get breakdownSection() {
    return this.page.locator('[data-testid="breakdown-section"]');
  }
  get editButton() {
    return this.page.locator('button:has-text("Editar")');
  }
  get finalizeButton() {
    return this.page.locator('button:has-text("Finalizar")');
  }
  get deleteButton() {
    return this.page.locator('button:has-text("Excluir")');
  }
  get compensateButton() {
    return this.page.locator('button:has-text("Compensar")');
  }
}
