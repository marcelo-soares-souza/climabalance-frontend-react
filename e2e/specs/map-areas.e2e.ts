import {
  test,
  expect,
  loginAsUser,
  loginAsProducer,
  loginAsAnalyst,
} from "../helpers/test-utils";

const API_URL = process.env.E2E_API_URL ?? "https://dev.climabalance.org";

const MOCK_AREA = {
  id: "0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a",
  slug: "reserva-legal-amazonia",
  name: "Reserva Legal Amazônia",
  description:
    "Área de preservação na Amazônia Legal com reflorestamento ativo.",
  country_code: "BR",
  state: "PA",
  city: "Altamira",
  biome: "Amazônia",
  price_per_tree: 15,
  t_co2e_per_tree_per_year: 10,
  default_horizon_years: 20,
  total_capacity_t_co2e: 1000,
  committed_t_co2e: 50,
  status: "active",
  audit_status: "approved",
  owner: {
    id: "owner-001",
    name: "João Produtor",
    slug: "joao-produtor",
  },
  media: [
    {
      id: "media-001",
      type: "image",
      url: "/api/v1/areas/media/media-001/file",
    },
  ],
  created_at: "2025-02-01T00:00:00Z",
  updated_at: "2025-04-15T00:00:00Z",
};

const MOCK_AREAS_LIST = [
  MOCK_AREA,
  {
    ...MOCK_AREA,
    id: "area-002",
    slug: "area-pendente-amazonia",
    name: "Área Pendente Amazônia",
    status: "pending_audit",
    audit_status: "pending",
  },
];

test.describe("Map & Areas", () => {
  test("should display map page", async ({ page }) => {
    await page.goto("/map");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Mapa de Áreas/i);
    await expect(page.locator(".leaflet-container")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should view public area detail", async ({ page }) => {
    await page.route(
      `${API_URL}/api/v1/areas/reserva-legal-amazonia`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_AREA }),
        });
      },
    );

    await page.goto("/areas/reserva-legal-amazonia");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Reserva Legal Amazônia/i);
  });

  test("should display public areas list", async ({ page }) => {
    await page.goto("/areas/public");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText(/Áreas públicas/i);
  });

  test("should show access denied for non-admin on admin route", async ({
    page,
  }) => {
    await loginAsUser(page);
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/access-denied/);
  });

  test.describe("Authenticated", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page);
    });

    test("should list authenticated areas", async ({ page }) => {
      await page.goto("/areas");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1")).toBeVisible();
    });

    test("should display available areas", async ({ page }) => {
      await page.goto("/areas/available");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1")).toHaveText(/Áreas Disponíveis/i);
    });

    test("should view certificate validation page", async ({ page }) => {
      await page.goto("/certificates/validate");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1")).toHaveText(/Validar Certificado/i);
    });

    test("should navigate to area detail from list", async ({ page }) => {
      await page.route(`${API_URL}/api/v1/areas**`, async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: { items: [MOCK_AREA], nextCursor: null },
            }),
          });
          return;
        }
        await route.fallback();
      });

      await page.goto("/areas");
      await page.waitForLoadState("networkidle");
      await page.getByText(MOCK_AREA.name).first().click();
      await expect(page).toHaveURL(/\/areas\//);
    });

    test("should redirect individual away from area creation", async ({
      page,
    }) => {
      await page.goto("/areas/create");
      await expect(page).toHaveURL(/\/access-denied/);
    });

    test("should redirect individual away from audit page", async ({
      page,
    }) => {
      await page.goto("/audit/pending-areas");
      await expect(page).toHaveURL(/\/access-denied/);
    });
  });

  test.describe("Producer", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsProducer(page);
    });

    test("should display create area form", async ({ page }) => {
      await page.goto("/areas/create");
      await page.waitForLoadState("networkidle");
      await expect(page.locator('input[id="name"]')).toBeVisible();
      await expect(page.locator('input[id="latitude"]')).toBeVisible();
      await expect(page.locator('input[id="longitude"]')).toBeVisible();
    });

    test("should create a new area", async ({ page }) => {
      await page.route(`${API_URL}/api/v1/areas`, async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify({
              data: {
                ...MOCK_AREA,
                id: "new-area-001",
                slug: "nova-area-teste",
              },
            }),
          });
          return;
        }
        await route.fallback();
      });

      await page.goto("/areas/create");
      await page.waitForLoadState("networkidle");
      await page.locator('input[id="name"]').fill("Nova Área Teste");
      await page.locator('input[id="latitude"]').fill("-15.7939");
      await page.locator('input[id="longitude"]').fill("-47.8828");
      await page.locator('button[type="submit"]').click({ force: true });
      await expect(page).toHaveURL(/\/areas\//);
    });

    test("should edit an existing area", async ({ page }) => {
      let updatePayload: Record<string, unknown> | null = null;
      await page.route(
        `${API_URL}/api/v1/areas/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a`,
        async (route) => {
          if (route.request().method() === "PATCH") {
            updatePayload = route.request().postDataJSON();
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                data: { ...MOCK_AREA, name: "Nome Editado" },
              }),
            });
            return;
          }
          if (route.request().method() === "GET") {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({ data: MOCK_AREA }),
            });
            return;
          }
          await route.fallback();
        },
      );

      await page.goto("/areas/edit/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a");
      await page.waitForLoadState("networkidle");

      await page.locator("#name").fill("Nome Editado");
      await page.locator('button[type="submit"]').click();

      await expect(page).toHaveURL(/\/areas\//);
      await expect.poll(() => updatePayload?.name).toBe("Nome Editado");
    });

    test("should display tree planting page", async ({ page }) => {
      await page.route(
        `${API_URL}/api/v1/areas/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a`,
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: MOCK_AREA }),
          });
        },
      );

      await page.goto(
        "/areas/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a/plant-trees",
      );
      await page.waitForLoadState("networkidle");
      await expect(page.locator(".leaflet-container")).toBeVisible({
        timeout: 10000,
      });
    });

    test("should save planted trees", async ({ page }) => {
      let saveCalled = false;
      await page.route(
        `${API_URL}/api/v1/areas/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a`,
        async (route) => {
          if (route.request().method() === "GET") {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({ data: MOCK_AREA }),
            });
            return;
          }
          await route.fallback();
        },
      );
      await page.route(
        `${API_URL}/api/v1/areas/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a/planted-trees`,
        async (route) => {
          if (route.request().method() === "POST") {
            saveCalled = true;
            await route.fulfill({ status: 201 });
            return;
          }
          await route.fallback();
        },
      );

      await page.goto(
        "/areas/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a/plant-trees",
      );
      await page.waitForLoadState("networkidle");

      const map = page.locator(".leaflet-container");
      await map.click({ position: { x: 300, y: 300 } });

      await page.getByRole("button", { name: /Salvar/i }).click();
      await expect.poll(() => saveCalled).toBe(true);
    });

    test("should redirect producer away from audit page", async ({ page }) => {
      await page.goto("/audit/pending-areas");
      await expect(page).toHaveURL(/\/access-denied/);
    });
  });

  test.describe("Analyst", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAnalyst(page);
    });

    test("should navigate from pending areas list to review", async ({
      page,
    }) => {
      await page.route(`${API_URL}/api/v1/areas**`, async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: { items: MOCK_AREAS_LIST, nextCursor: null },
            }),
          });
          return;
        }
        await route.fallback();
      });

      await page.goto("/audit/pending-areas");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1")).toHaveText(/Áreas Pendentes/i);
      await page.getByText(MOCK_AREAS_LIST[0].name).first().click();
      await expect(page).toHaveURL(/\/audit\/area\//);
    });

    test("should review area for audit", async ({ page }) => {
      await page.route(
        `${API_URL}/api/v1/areas/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a`,
        async (route) => {
          if (route.request().method() === "GET") {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                data: {
                  ...MOCK_AREA,
                  status: "pending_audit",
                  audit_status: "pending",
                },
              }),
            });
            return;
          }
          await route.fallback();
        },
      );

      await page.goto("/audit/area/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1")).toBeVisible();
    });

    test("should approve a pending area after checking all criteria", async ({
      page,
    }) => {
      await page.route(
        `${API_URL}/api/v1/areas/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a/approve`,
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: { status: "approved" } }),
          });
        },
      );

      await page.route(
        `${API_URL}/api/v1/areas/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a`,
        async (route) => {
          if (route.request().method() === "GET") {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                data: {
                  ...MOCK_AREA,
                  id: "0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a",
                  status: "pending_audit",
                  audit_status: "pending",
                },
              }),
            });
            return;
          }
          await route.fallback();
        },
      );

      await page.goto("/audit/area/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a");
      await page.waitForLoadState("networkidle");

      const criteria = page.locator('input[type="checkbox"]');
      await criteria.nth(0).check();
      await criteria.nth(1).check();
      await criteria.nth(2).check();
      await page.locator("#notes").fill("Todos os critérios conferidos.");
      await page.getByRole("button", { name: /Aprovar/i }).click();

      await expect(page).toHaveURL("/audit/pending-areas");
    });

    test("should reject a pending area", async ({ page }) => {
      await page.route(
        `${API_URL}/api/v1/areas/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a/reject`,
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: { status: "rejected" } }),
          });
        },
      );

      await page.route(
        `${API_URL}/api/v1/areas/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a`,
        async (route) => {
          if (route.request().method() === "GET") {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                data: {
                  ...MOCK_AREA,
                  status: "pending_audit",
                  audit_status: "pending",
                },
              }),
            });
            return;
          }
          await route.fallback();
        },
      );

      await page.goto("/audit/area/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a");
      await page.waitForLoadState("networkidle");

      await page.locator("#rejectReason").fill("Documentação insuficiente.");
      await page.getByRole("button", { name: /Rejeitar/i }).click();

      await expect(page).toHaveURL("/audit/pending-areas");
    });

    test("should activate an approved area", async ({ page }) => {
      await page.route(
        `${API_URL}/api/v1/areas/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a/activate`,
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: { status: "active" } }),
          });
        },
      );

      await page.route(
        `${API_URL}/api/v1/areas/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a`,
        async (route) => {
          if (route.request().method() === "GET") {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                data: {
                  ...MOCK_AREA,
                  status: "approved",
                  audit_status: "approved",
                },
              }),
            });
            return;
          }
          await route.fallback();
        },
      );

      await page.goto("/audit/area/0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a");
      await page.waitForLoadState("networkidle");

      await page.getByRole("button", { name: /Ativar/i }).click();
      await expect(page).toHaveURL("/audit/pending-areas");
    });
  });
});
