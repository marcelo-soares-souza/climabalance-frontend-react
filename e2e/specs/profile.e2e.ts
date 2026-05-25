import { test, expect, loginAsUser } from "../helpers/test-utils";

const API_URL = process.env.E2E_API_URL ?? "https://dev.climabalance.org";

test.describe("Profile", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test("should display user profile page with navigation to certificates and sessions", async ({
    page,
  }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("button", { name: /Editar perfil/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Ver Certificados/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Sessões/i })).toBeVisible();
  });

  test("should display profile edit form", async ({ page }) => {
    await page.goto("/profile/edit");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('input[id="display_name"]')).toBeVisible();
  });

  test("should display certificates", async ({ page }) => {
    await page.goto("/profile/certificates");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Certificados/i);
  });

  test("should display active sessions", async ({ page }) => {
    await page.goto("/profile/sessions");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Sessões/i);
  });

  test("should display compensation history", async ({ page }) => {
    await page.goto("/profile/compensations");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Histórico de Compensações/i);
  });

  test("should display contributions history", async ({ page }) => {
    await page.goto("/profile/contributions");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Histórico de Compensações/i);
  });

  test("should save profile changes and redirect to profile", async ({
    page,
  }) => {
    let updatePayload: Record<string, unknown> | null = null;
    await page.route(`${API_URL}/api/v1/users/*/profile`, async (route) => {
      if (route.request().method() === "PUT") {
        updatePayload = route.request().postDataJSON() as Record<
          string,
          unknown
        >;
      }
      await route.fallback();
    });

    await page.goto("/profile/edit");
    await page.waitForLoadState("networkidle");

    await page.locator("#display_name").fill("Maria QA");
    await page.locator("#address_city").fill("Campinas");
    await page.getByRole("button", { name: /Salvar/i }).click();

    await expect(page).toHaveURL(/\/profile$/);
    await expect.poll(() => updatePayload?.display_name).toBe("Maria QA");
    await expect.poll(() => updatePayload?.address_city).toBe("Campinas");
  });

  test("should revoke all active sessions", async ({ page }) => {
    let revokeAllCalls = 0;
    await page.route(`${API_URL}/api/v1/auth/sessions`, async (route) => {
      if (route.request().method() === "DELETE") {
        revokeAllCalls += 1;
      }
      await route.fallback();
    });

    await page.goto("/profile/sessions");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /Sair de todos/i }).click();
    await page
      .getByRole("button", { name: /Sair de todos/i })
      .last()
      .click();

    await expect.poll(() => revokeAllCalls).toBe(1);
  });

  test("should revoke a single session", async ({ page }) => {
    let revokeCalls = 0;
    await page.route(`${API_URL}/api/v1/auth/sessions`, async (route) => {
      const url = route.request().url();
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [
              {
                id: "session-001",
                createdAt: "2025-01-01T00:00:00Z",
                expiresAt: "2025-06-01T00:00:00Z",
                userAgent: "Mozilla/5.0 Chrome/120",
                hasFingerprint: true,
              },
            ],
          }),
        });
        return;
      }
      if (
        route.request().method() === "DELETE" &&
        url.includes("/session-001")
      ) {
        revokeCalls += 1;
        await route.fulfill({ status: 204 });
        return;
      }
      await route.fallback();
    });

    await page.goto("/profile/sessions");
    await page.waitForLoadState("networkidle");

    const deleteButton = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-trash2") });
    await deleteButton.first().click();
    await expect.poll(() => revokeCalls).toBe(1);
  });

  test("should list certificates and trigger download", async ({ page }) => {
    let downloadCalled = false;
    await page.route(
      `${API_URL}/api/v1/users/*/certificates`,
      async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: [
                {
                  id: "cert-001",
                  certificateNumber: "CERT-E2E-001",
                  compensationId: "comp-001",
                  totalTCO2e: 5,
                  treesCount: 50,
                  status: "issued",
                  issuedAt: "2025-05-01T00:00:00Z",
                },
              ],
            }),
          });
          return;
        }
        await route.fallback();
      },
    );
    await page.route(
      `${API_URL}/api/v1/certificates/cert-001/download`,
      async (route) => {
        downloadCalled = true;
        await route.fulfill({
          status: 200,
          contentType: "application/pdf",
          body: Buffer.from("%PDF-1.4 mock"),
        });
      },
    );

    await page.goto("/profile/certificates");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("CERT-E2E-001")).toBeVisible();
    await page.getByRole("button", { name: /Baixar/i }).click();
    await expect.poll(() => downloadCalled).toBe(true);
  });

  test("should navigate from profile to certificates", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /Ver Certificados/i }).click();
    await expect(page).toHaveURL(
      /\/profile\/certificates|\/users\/.+\/certificates/,
    );
  });

  test("should navigate from profile to sessions", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /Sessões/i }).click();
    await expect(page).toHaveURL(/\/profile\/sessions|\/users\/.+\/sessions/);
  });

  test("should access scoped public profile route", async ({ page }) => {
    await page.route(`${API_URL}/api/v1/users/*`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              id: "user-other",
              email: "other@example.com",
              slug: "other-user",
              status: "active",
              locale: "pt-BR",
              roles: ["individual"],
              createdAt: "2025-01-01T00:00:00Z",
            },
          }),
        });
        return;
      }
      await route.fallback();
    });
    await page.route(
      `${API_URL}/api/v1/users/other-user/profile`,
      async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: {
                displayName: "Outro Usuário",
                phone: "+55 61 99999-9999",
              },
            }),
          });
          return;
        }
        await route.fallback();
      },
    );

    await page.goto("/users/other-user/profile");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Outro Usuário")).toBeVisible();
  });

  test("should access scoped certificates route", async ({ page }) => {
    await page.route(
      `${API_URL}/api/v1/users/other-user/certificates`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: [] }),
        });
      },
    );

    await page.goto("/users/other-user/certificates");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Certificados/i);
  });

  test("should show access denied on other user sessions", async ({ page }) => {
    await page.goto("/users/other-user/sessions");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Acesso negado/i)).toBeVisible();
  });

  test("should show access denied on other user profile edit", async ({
    page,
  }) => {
    await page.goto("/users/other-user/profile/edit");
    await expect(page).toHaveURL(/\/access-denied/);
  });

  test("should show access denied on other user impact page", async ({
    page,
  }) => {
    await page.goto("/users/other-user/impact");
    await expect(page).toHaveURL(/\/access-denied/);
  });
});
