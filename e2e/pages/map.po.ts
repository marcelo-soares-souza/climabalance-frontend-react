import type { Page } from '@playwright/test';
import { fillInput, selectOption } from '../helpers/test-utils';

export class MapPage {
  constructor(private page: Page) {}

  async goto() { await this.page.goto('/map'); }

  get mapContainer() { return this.page.locator('.leaflet-container'); }
  get countryFilter() { return this.page.locator('select[id="countryFilter"]'); }
  get areaMarkers() { return this.page.locator('.leaflet-marker-icon'); }
  get satelliteToggle() { return this.page.locator('button:has-text("Satélite")'); }
}

export class AreaDetailPage {
  constructor(private page: Page) {}

  async goto(areaId: string) { await this.page.goto(`/areas/${areaId}`); }

  get areaName() { return this.page.locator('h1').first(); }
  get areaDescription() { return this.page.locator('[data-testid="area-description"]'); }
  get areaMetrics() { return this.page.locator('[data-testid="area-metrics"]'); }
  get mediaGallery() { return this.page.locator('[data-testid="media-gallery"]'); }
  get contributionsList() { return this.page.locator('[data-testid="contributions-list"]'); }
  get compensateButton() { return this.page.locator('button:has-text("Compensar")'); }
  get editButton() { return this.page.locator('button:has-text("Editar")'); }
  get submitAuditButton() { return this.page.locator('button:has-text("Submeter")'); }
  get approveButton() { return this.page.locator('button:has-text("Aprovar")'); }
  get rejectButton() { return this.page.locator('button:has-text("Rejeitar")'); }
  get activateButton() { return this.page.locator('button:has-text("Ativar")'); }
  get suspendButton() { return this.page.locator('button:has-text("Suspender")'); }
  get deleteButton() { return this.page.locator('button:has-text("Excluir")'); }
  get treePlantingButton() { return this.page.locator('a:has-text("Plantar Árvores")'); }
  get satelliteButton() { return this.page.locator('button:has-text("Imagem Satélite")'); }
}

export class AreaFormPage {
  constructor(private page: Page) {}

  async gotoCreate() { await this.page.goto('/areas/create'); }
  async gotoEdit(areaId: string) { await this.page.goto(`/areas/edit/${areaId}`); }

  async fillName(name: string) { await fillInput(this.page, 'name', name); }
  async fillDescription(desc: string) { await this.page.locator('textarea[id="description"]').fill(desc); }
  async selectCountry(code: string) { await selectOption(this.page, 'countryCode', code); }
  async fillLatitude(lat: string) { await fillInput(this.page, 'latitude', lat); }
  async fillLongitude(lng: string) { await fillInput(this.page, 'longitude', lng); }
  async fillBiome(biome: string) { await fillInput(this.page, 'biome', biome); }
  async fillTco2PerTree(value: string) { await fillInput(this.page, 't_co2e_per_tree_per_year', value); }
  async fillPricePerTree(value: string) { await fillInput(this.page, 'price_per_tree', value); }
  async submit() { await this.page.click('button[type="submit"]'); }

  async createArea(name: string, lat: string, lng: string) {
    await this.fillName(name);
    await this.fillLatitude(lat);
    await this.fillLongitude(lng);
    await this.submit();
  }
}

export class AreaListPage {
  constructor(private page: Page) {}

  async goto() { await this.page.goto('/areas'); }
  get areaCards() { return this.page.locator('[data-testid="area-card"]'); }
  get createButton() { return this.page.locator('a[href="/areas/create"]'); }
  get searchInput() { return this.page.locator('input[placeholder*="Buscar"]'); }
}

export class TreePlantingPage {
  constructor(private page: Page) {}

  async goto(areaId: string) { await this.page.goto(`/areas/${areaId}/plant-trees`); }

  get mapContainer() { return this.page.locator('.leaflet-container'); }
  get saveButton() { return this.page.locator('button:has-text("Salvar")'); }
  get clearButton() { return this.page.locator('button:has-text("Limpar")'); }
  get progressBar() { return this.page.locator('[role="progressbar"]'); }
}

export class PendingAreasPage {
  constructor(private page: Page) {}

  async goto() { await this.page.goto('/audit/pending-areas'); }
  get pendingAreaItems() { return this.page.locator('[data-testid="pending-area-item"]'); }
}

export class AreaAuditPage {
  constructor(private page: Page) {}

  async goto(areaId: string) { await this.page.goto(`/audit/area/${areaId}`); }

  async fillNotes(notes: string) { await this.page.locator('textarea').fill(notes); }
  async approve() { await this.page.click('button:has-text("Aprovar")'); }
  async reject() { await this.page.click('button:has-text("Rejeitar")'); }
}
