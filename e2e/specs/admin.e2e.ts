import { test, expect, loginAsAdmin, loginAsUser } from "../helpers/test-utils";

const API_URL = process.env.E2E_API_URL ?? "https://dev.climabalance.org";

const MOCK_USERS = [
  {
    id: "admin-001",
    email: "admin@climabalance.local",
    slug: "admin",
    status: "active",
    locale: "pt-BR",
    roles: ["administrator"],
    email_confirmed_at: "2025-01-01T00:00:00Z",
    created_at: "2025-01-01T00:00:00Z",
    last_login_at: "2025-05-01T00:00:00Z",
  },
  {
    id: "user-001",
    email: "user@climabalance.local",
    slug: "user",
    status: "active",
    locale: "pt-BR",
    roles: ["individual"],
    email_confirmed_at: "2025-01-01T00:00:00Z",
    created_at: "2025-01-01T00:00:00Z",
    last_login_at: "2025-05-01T00:00:00Z",
  },
];

test.describe("Admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should list users and filter by search", async ({ page }) => {
    await page.route(`${API_URL}/api/v1/users**`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_USERS }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Usuários/i);
    await expect(page.getByText("admin@climabalance.local")).toBeVisible();
    await expect(page.getByText("user@climabalance.local")).toBeVisible();

    const searchInput = page.locator('input[placeholder*="Buscar" i]');
    await searchInput.fill("admin");
    await expect(page.getByText("admin@climabalance.local")).toBeVisible();
  });

  test("should edit a user via admin panel", async ({ page }) => {
    let updatePayload: Record<string, unknown> | null = null;
    const userId = "edit-user-001";

    await page.route(`${API_URL}/api/v1/users/${userId}`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              id: userId,
              email: "user@example.com",
              slug: "test-user",
              status: "active",
              locale: "pt-BR",
              email_confirmed_at: "2025-01-01T00:00:00Z",
              roles: ["individual"],
              created_at: "2025-01-01T00:00:00Z",
              updated_at: "2025-05-01T00:00:00Z",
            },
          }),
        });
        return;
      }
      if (route.request().method() === "PATCH") {
        updatePayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: { ...MOCK_USERS[1], email: "updated@example.com" },
          }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto(`/admin/users/edit/${userId}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator('input[id="email"]')).toBeVisible();

    await page.locator("#email").fill("updated@example.com");
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL("/admin/users");
    await expect.poll(() => updatePayload?.email).toBe("updated@example.com");
  });

  test("should display audit log with entries and pagination", async ({
    page,
  }) => {
    const mockEntries = Array.from({ length: 50 }, (_, i) => ({
      id: `entry-${i}`,
      actor_user_id: "admin-001",
      actor_email: "admin@climabalance.local",
      action: "user.login",
      entity_type: "user",
      entity_id: `user-${i}`,
      client_ip: "127.0.0.1",
      created_at: "2025-05-01T00:00:00Z",
      success: true,
      http_status: 200,
      severity: "info",
    }));

    await page.route(`${API_URL}/api/v1/audit-log`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: mockEntries }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto("/admin/audit-log");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Auditoria/i);

    const nextButton = page.getByRole("button", { name: /Próximo/i });
    await expect(nextButton).toBeVisible();
    await expect(nextButton).not.toBeDisabled();

    await nextButton.click();
    await expect(page.getByText(/Página 2/)).toBeVisible();
  });

  test("should deny non-admin access to admin routes", async ({ page }) => {
    await loginAsUser(page);
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/access-denied/);
  });

  test("should show empty state when no users found", async ({ page }) => {
    await page.route(`${API_URL}/api/v1/users**`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: [] }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Nenhum usuário encontrado/i)).toBeVisible();
  });
});

test.describe("Admin — Stripe Pages", () => {
  test("should display stripe setup page as producer", async ({ page }) => {
    const { loginAsProducer } = await import("../helpers/test-utils");
    await loginAsProducer(page);
    await page.goto("/how-to-use/stripe-setup");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should display stripe platform setup page as admin", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/how-to-use/stripe-platform-setup");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toBeVisible();
  });
});
