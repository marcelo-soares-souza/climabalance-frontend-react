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
      localStorage.setItem(
        "cb_cookie_consent",
        JSON.stringify({
          accepted: true,
          timestamp: "2026-05-25T00:00:00.000Z",
        }),
      );
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
  await page.evaluate(
    async ({ accessToken, mockUser }) => {
      const [{ tokenStorage }, { csrfToken }, { useAuthStore }] =
        await Promise.all([
          import("/src/lib/token-storage.ts"),
          import("/src/lib/csrf-token.ts"),
          import("/src/stores/auth-store.ts"),
        ]);

      tokenStorage.setAccessToken(accessToken);
      csrfToken.set("test-csrf-token");
      localStorage.setItem("cb_locale", "pt-BR");
      localStorage.setItem("cb_csrf_token", "test-csrf-token");
      useAuthStore.setState({
        session: {
          userId: mockUser.id,
          userSlug: mockUser.slug,
          email: mockUser.email,
          roles: JSON.parse(atob(accessToken.split(".")[1])).roles,
          accessToken,
          expiresAt: Date.now() + 86400 * 1000,
        },
        isAuthenticated: true,
        isAdmin: JSON.parse(atob(accessToken.split(".")[1])).roles.includes(
          "administrator",
        ),
        isLoading: false,
        hasRestoredSession: true,
      });
    },
    { accessToken: token, mockUser: MOCK_USER },
  );
}

export async function navigateWithState(
  page: Page,
  pathname: string,
  state: Record<string, unknown>,
) {
  await page.evaluate(
    ({ nextPathname, nextState }) => {
      window.history.pushState(nextState, "", nextPathname);
      window.dispatchEvent(new PopStateEvent("popstate", { state: nextState }));
    },
    { nextPathname: pathname, nextState: state },
  );
}

export async function seedCompensationSelection(
  page: Page,
  selection: {
    areaId: string;
    areaName: string;
    treesRequested: number;
    totalTCO2e: number;
    totalAmount: number;
    currency?: string;
    calculationId?: string | null;
  },
) {
  await page.evaluate((data) => {
    localStorage.setItem(
      "cb_compensation",
      JSON.stringify({
        state: {
          areaId: data.areaId,
          areaName: data.areaName,
          calculationId: data.calculationId ?? null,
          compensationMode: "tree_purchase",
          treesRequested: data.treesRequested,
          totalTCO2e: data.totalTCO2e,
          totalAmount: data.totalAmount,
          currency: data.currency ?? "BRL",
        },
        version: 0,
      }),
    );
  }, selection);
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
