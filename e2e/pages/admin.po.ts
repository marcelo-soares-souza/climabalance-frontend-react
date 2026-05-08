import type { Page } from '@playwright/test';
import { fillInput } from '../helpers/test-utils';

export class AdminUsersPage {
  constructor(private page: Page) {}

  async goto() { await this.page.goto('/admin/users'); }

  get userTable() { return this.page.locator('table'); }
  get userRows() { return this.page.locator('table tbody tr'); }
  get searchInput() { return this.page.locator('input[placeholder*="Buscar"]'); }
  get statusFilter() { return this.page.locator('select[id="statusFilter"]'); }
  get editButton() { return this.page.locator('a[href*="/admin/users/edit/"]'); }
  get deleteButton() { return this.page.locator('button:has-text("Excluir")'); }
}

export class UserEditPage {
  constructor(private page: Page) {}

  async goto(userId: string) { await this.page.goto(`/admin/users/edit/${userId}`); }

  async fillEmail(email: string) { await fillInput(this.page, 'email', email); }
  async selectStatus(status: string) { await this.page.locator('select[id="status"]').selectOption(status); }
  async selectLocale(locale: string) { await this.page.locator('select[id="locale"]').selectOption(locale); }
  async submit() { await this.page.click('button[type="submit"]'); }
}

export class AuditLogPage {
  constructor(private page: Page) {}

  async goto() { await this.page.goto('/admin/audit-log'); }

  get logTable() { return this.page.locator('table'); }
  get logRows() { return this.page.locator('table tbody tr'); }
  get actorFilter() { return this.page.locator('input[placeholder*="Ator"]'); }
  get actionFilter() { return this.page.locator('select[id="actionFilter"]'); }
}
