import type { Page } from '@playwright/test';
import { fillInput } from '../helpers/test-utils';

export class CompensationReviewPage {
  constructor(private page: Page) {}

  async goto() { await this.page.goto('/compensation/review'); }

  async fillTrees(count: string) { await fillInput(this.page, 'trees', count); }
  async proceedToCheckout() { await this.page.click('button:has-text("Finalizar")'); }

  get quoteBreakdown() { return this.page.locator('[data-testid="quote-breakdown"]'); }
  get totalPrice() { return this.page.locator('[data-testid="total-price"]'); }
}

export class CompensationCheckoutPage {
  constructor(private page: Page) {}

  async goto() { await this.page.goto('/compensation/checkout'); }

  get orderSummary() { return this.page.locator('[data-testid="order-summary"]'); }
  get pixTab() { return this.page.locator('button:has-text("Pix")'); }
  get cardTab() { return this.page.locator('button:has-text("Cartão")'); }
  get payButton() { return this.page.locator('button:has-text("Pagar")'); }
  get pixQrCode() { return this.page.locator('[data-testid="pix-qrcode"]'); }
  get pixCopyPaste() { return this.page.locator('[data-testid="pix-copy-paste"]'); }
}

export class PixPaymentPage {
  constructor(private page: Page) {}

  async goto(paymentId: string) { await this.page.goto(`/payment/pix/${paymentId}`); }

  get qrCode() { return this.page.locator('[data-testid="pix-qrcode"] img'); }
  get copyPasteKey() { return this.page.locator('[data-testid="pix-copy-paste"]'); }
  get paymentStatus() { return this.page.locator('[data-testid="payment-status"]'); }
}

export class CompensationReportPage {
  constructor(private page: Page) {}

  async goto() { await this.page.goto('/compensation/report'); }

  get successMessage() { return this.page.locator('[data-testid="success-message"]'); }
  get compensationSummary() { return this.page.locator('[data-testid="compensation-summary"]'); }
  get certificateInfo() { return this.page.locator('[data-testid="certificate-info"]'); }
  get downloadCertificateButton() { return this.page.locator('button:has-text("Download")'); }
}

export class CompensationHistoryPage {
  constructor(private page: Page) {}

  async goto() { await this.page.goto('/profile/compensations'); }

  get historyItems() { return this.page.locator('[data-testid="history-item"]'); }
  get emptyState() { return this.page.locator('[data-testid="empty-state"]'); }
}
