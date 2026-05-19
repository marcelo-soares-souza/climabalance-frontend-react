import { test as base, type Page } from "@playwright/test";
import { setupApiMocks } from "./api-mock";
import {
  createTestToken,
  MOCK_USER_ID,
  MOCK_USER,
} from "../fixtures/mock-data";

export { expect } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.context().addInitScript(() => {
      localStorage.setItem("cb_locale", "pt-BR");
    });
    await setupApiMocks(page);
    await use(page);
  },
});

export async function loginAsUser(
  page: Page,
  roles: string[] = ["individual"],
) {
  const token = createTestToken(roles);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.evaluate((t) => {
    localStorage.setItem("cb_locale", "pt-BR");
    localStorage.setItem("cb_csrf_token", "test-csrf-token");
    sessionStorage.setItem("cb_access_token", t);
  }, token);
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

export async function selectOption(page: Page, label: string, value: string) {
  const select = page.locator(`select[id="${label}"]`);
  await select.selectOption(value);
}
