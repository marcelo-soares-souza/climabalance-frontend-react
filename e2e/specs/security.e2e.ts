import { test, expect, loginAsProducer } from "../helpers/test-utils";

declare global {
  interface Window {
    __xssExecuted?: boolean;
  }
}

const MALICIOUS_AREA = {
  id: "malicious-area-001",
  name: '<img src=x onerror="window.__xssExecuted=true">',
  slug: "malicious-area",
  description:
    "<script>window.__xssExecuted=true</script><b>unsafe description</b>",
  country_code: "BR",
  state: 'PA" onmouseover="window.__xssExecuted=true"',
  city: '<svg onload="window.__xssExecuted=true"></svg>',
  latitude: -3.2078,
  longitude: -52.2098,
  biome: "Amazonia",
  t_co2e_per_tree_per_year: 10,
  price_per_tree: 15,
  default_horizon_years: 20,
  total_trees: 5000,
  available_trees: 3500,
  total_capacity_tco2: 1000,
  status: "active",
  owner: {
    id: "owner-001",
    name: '<img src=x onerror="window.__xssExecuted=true">',
    slug: "owner-malicious",
  },
  media: [
    {
      id: "media-malicious",
      type: "image",
      url: "javascript:window.__xssExecuted=true",
    },
  ],
  created_at: "2025-02-01T00:00:00Z",
  updated_at: "2025-05-01T00:00:00Z",
};

test.describe("Security regressions", () => {
  test("renders malicious area data as inert content", async ({ page }) => {
    await page.addInitScript(() => {
      window.__xssExecuted = false;
    });
    await page.route(
      "http://localhost:3001/api/v1/map/areas",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: [MALICIOUS_AREA] }),
        });
      },
    );
    await page.route(
      "http://localhost:3001/api/v1/areas/malicious-area",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MALICIOUS_AREA }),
        });
      },
    );

    await page.goto("/map");
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".leaflet-container")).toBeVisible({
      timeout: 10000,
    });

    await page.goto("/areas/malicious-area");
    await page.waitForLoadState("networkidle");

    await expect(
      page.locator("script").filter({ hasText: "window.__xssExecuted=true" }),
    ).toHaveCount(0);
    await expect(page.locator('img[src^="javascript:"]')).toHaveCount(0);
    await expect(page.locator("svg[onload]")).toHaveCount(0);
    await expect(page.locator("[onerror], [onmouseover]")).toHaveCount(0);
    await expect(page.locator("body")).toContainText("unsafe description");
    await expect
      .poll(() => page.evaluate(() => Boolean(window.__xssExecuted)))
      .toBe(false);
  });

  test("sends dynamic CSRF token on cookie-backed auth revoke", async ({
    page,
  }) => {
    await loginAsProducer(page);

    let csrfHeader: string | null = null;
    await page.route(
      "http://localhost:3001/api/v1/auth/revoke",
      async (route) => {
        if (route.request().method() === "POST") {
          csrfHeader = route.request().headers()["x-csrf-token"] ?? null;
        }
        await route.fallback();
      },
    );

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /Sair/i }).first().click();

    await expect.poll(() => csrfHeader).toBe("test-csrf-token");
  });
});
