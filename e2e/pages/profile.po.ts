import type { Page } from "@playwright/test";
import { fillInput } from "../helpers/test-utils";

export class ProfilePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/profile");
  }

  get userName() {
    return this.page.locator('[data-testid="user-name"]');
  }
  get userEmail() {
    return this.page.locator('[data-testid="user-email"]');
  }
  get userRoles() {
    return this.page.locator('[data-testid="user-roles"]');
  }
  get climateBalance() {
    return this.page.locator('[data-testid="climate-balance"]');
  }
  get editButton() {
    return this.page.locator('a[href="/profile/edit"]');
  }
  get certificatesLink() {
    return this.page.locator('a[href="/profile/certificates"]');
  }
  get sessionsLink() {
    return this.page.locator('a[href="/profile/sessions"]');
  }
  get compensationsLink() {
    return this.page.locator('a[href="/profile/compensations"]');
  }
  get changePasswordSection() {
    return this.page.locator('[data-testid="change-password"]');
  }
}

export class ProfileEditPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/profile/edit");
  }

  async fillDisplayName(name: string) {
    await fillInput(this.page, "display_name", name);
  }
  async fillDocumentNumber(doc: string) {
    await fillInput(this.page, "document_number", doc);
  }
  async fillPhone(phone: string) {
    await fillInput(this.page, "phone", phone);
  }
  async fillAbout(about: string) {
    await this.page.locator('textarea[id="about"]').fill(about);
  }
  async submit() {
    await this.page.click('button[type="submit"]');
  }

  async editProfile(name: string) {
    await this.fillDisplayName(name);
    await this.submit();
  }
}

export class CertificatesPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/profile/certificates");
  }

  get certificateList() {
    return this.page.locator('[data-testid="certificate-list"]');
  }
  get certificateItem() {
    return this.page.locator('[data-testid="certificate-item"]');
  }
  get downloadButton() {
    return this.page.locator('button:has-text("Download")');
  }
}

export class SessionsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/profile/sessions");
  }

  get sessionList() {
    return this.page.locator('[data-testid="session-list"]');
  }
  get sessionItem() {
    return this.page.locator('[data-testid="session-item"]');
  }
  get revokeButton() {
    return this.page.locator('button:has-text("Revogar")');
  }
  get revokeAllButton() {
    return this.page.locator('button:has-text("Revogar todas")');
  }
}
