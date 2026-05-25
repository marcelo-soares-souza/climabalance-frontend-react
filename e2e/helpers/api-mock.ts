import type { Page } from "@playwright/test";
import {
  MOCK_AUTH,
  MOCK_USER,
  MOCK_AREAS,
  MOCK_PAYMENT,
  MOCK_GLOBAL_STATS,
  MOCK_USERS,
  MOCK_DIRECTORY,
  MOCK_AUDIT_LOG,
  MOCK_CERTIFICATE_VALIDATION,
  MOCK_USER_ID,
  MOCK_AREA_ID,
  MOCK_CALCULATION_ID,
  MOCK_COMPENSATION_ID,
  MOCK_PAYMENT_ID,
  MOCK_CERTIFICATE_ID,
} from "../fixtures/mock-data";

const API_BASE = "http://localhost:3001/api/v1";

type RawBreakdownItem = {
  category: string;
  kg_co2e: number;
  t_co2e: number;
};

type RawCalculationInput = {
  id: string;
  category: string;
  activity_type: string;
  quantity: number;
  unit: string;
  kg_co2e: number;
  metadata: Record<string, unknown> | null;
};

type RawCalculation = {
  id: string;
  calculation_id: string;
  user_id: string;
  profile_type: "individual" | "legal_entity";
  period_start: string;
  period_end: string;
  total_kg_co2e: number;
  total_t_co2e: number;
  status: "draft" | "finalized";
  data_quality: "real" | "estimated";
  factors_version: string;
  region: string;
  breakdown: RawBreakdownItem[];
  inputs: RawCalculationInput[];
  created_at: string;
  updated_at: string;
};

type RawContribution = {
  id: string;
  area_id: string;
  area_name: string;
  area_slug: string;
  calculation_id: string | null;
  compensation_mode: "tree_purchase";
  total_t_co2e: number;
  trees_count: number;
  total_amount: number;
  currency: string;
  status: "pending" | "completed";
  created_at: string;
  paid_at: string | null;
};

type RawPaymentStatus = {
  payment_id: string;
  compensation_id: string;
  provider: string;
  provider_reference: string;
  simulation_status: string;
  payment_status: "pending" | "paid" | "failed";
  compensation_status: string;
  amount: number;
  currency: string;
  installments: number;
  processed_at: string;
  certificate: {
    id: string;
    certificate_number: string;
    status: string;
    issued_at: string;
  } | null;
};

export type MockApiState = {
  calculations: RawCalculation[];
  contributions: RawContribution[];
  nextCalculationId: number;
  lastCreatedCalculationId: string | null;
  latestContributionId: string | null;
  latestPaymentId: string;
  latestPaymentStatus: RawPaymentStatus;
  latestPixPayload: {
    qrCode: string;
    copyPasteCode: string;
  };
  quoteOverride: Partial<{
    remaining_purchasable_trees: number;
    total_amount: number;
    estimated_total_t_co2e: number;
    estimated_total_kg_co2e: number;
    producer_ready_to_receive_support: boolean;
  }>;
  requests: {
    createdCalculations: Array<Record<string, unknown>>;
    updatedCalculations: Array<Record<string, unknown>>;
    finalizedCalculations: string[];
    createdContributions: Array<Record<string, unknown>>;
    paymentIntents: Array<Record<string, unknown>>;
    guestCalculations: Array<Record<string, unknown>>;
  };
};

const pageState = new WeakMap<Page, MockApiState>();

function nowIso() {
  return "2025-05-01T12:00:00Z";
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function buildBreakdown(inputs: RawCalculationInput[]): RawBreakdownItem[] {
  const totals = new Map<string, number>();
  for (const input of inputs) {
    const current = totals.get(input.category) ?? 0;
    totals.set(input.category, current + input.kg_co2e);
  }

  return Array.from(totals.entries()).map(([category, kg_co2e]) => ({
    category,
    kg_co2e,
    t_co2e: Number((kg_co2e / 1000).toFixed(4)),
  }));
}

function factorForInput(
  category: string,
  metadata: Record<string, unknown> | null | undefined,
): number {
  if (category === "energy") return 0.5;
  if (category === "transport") return 0.2;
  if (category === "fuel") return 2.7;
  if (category === "flights") {
    return metadata?.class === "business" ? 2250 : 1500;
  }
  if (category === "scope1") return 0.35;
  if (category === "scope2") return 0.4;
  if (category === "scope3") return 0.25;
  return 1;
}

function activityTypeForInput(
  category: string,
  metadata: Record<string, unknown> | null | undefined,
): string {
  if (typeof metadata?.subcategory === "string") return metadata.subcategory;
  if (typeof metadata?.vehicle_type === "string") return metadata.vehicle_type;
  if (typeof metadata?.fuel_type === "string") return metadata.fuel_type;
  if (
    typeof metadata?.flight_type === "string" &&
    typeof metadata?.class === "string"
  ) {
    return `${metadata.flight_type}_${metadata.class}`;
  }
  if (typeof metadata?.activity_subtype === "string") {
    return metadata.activity_subtype;
  }
  if (category === "energy") return "electricity";
  return `${category}_activity`;
}

function normalizeInputs(
  inputs: Array<{
    category: string;
    unit: string;
    value: number;
    metadata?: Record<string, unknown> | null;
  }>,
): RawCalculationInput[] {
  return inputs.map((input, index) => {
    const kg = Number(
      (input.value * factorForInput(input.category, input.metadata)).toFixed(2),
    );
    return {
      id: `input-${index + 1}`,
      category: input.category,
      activity_type: activityTypeForInput(input.category, input.metadata),
      quantity: input.value,
      unit: input.unit,
      kg_co2e: kg,
      metadata: input.metadata ?? null,
    };
  });
}

function calculationTotals(inputs: RawCalculationInput[]) {
  const totalKg = inputs.reduce((sum, item) => sum + item.kg_co2e, 0);
  return {
    totalKg,
    totalT: Number((totalKg / 1000).toFixed(4)),
    breakdown: buildBreakdown(inputs),
  };
}

function buildCalculation(
  overrides: Partial<RawCalculation> & {
    id: string;
    status: "draft" | "finalized";
  },
): RawCalculation {
  const inputs = overrides.inputs ?? [];
  const totals = calculationTotals(inputs);
  return {
    id: overrides.id,
    calculation_id: overrides.id,
    user_id: overrides.user_id ?? MOCK_USER_ID,
    profile_type: overrides.profile_type ?? "individual",
    period_start: overrides.period_start ?? "2025-01-01",
    period_end: overrides.period_end ?? "2025-12-31",
    total_kg_co2e:
      overrides.total_kg_co2e ??
      (overrides.status === "draft" ? totals.totalKg : totals.totalKg),
    total_t_co2e:
      overrides.total_t_co2e ??
      (overrides.status === "draft" ? totals.totalT : totals.totalT),
    status: overrides.status,
    data_quality: overrides.data_quality ?? "estimated",
    factors_version: overrides.factors_version ?? "2025.1",
    region: overrides.region ?? "BR",
    breakdown: overrides.breakdown ?? totals.breakdown,
    inputs,
    created_at: overrides.created_at ?? nowIso(),
    updated_at: overrides.updated_at ?? nowIso(),
  };
}

function buildQuote(state: MockApiState) {
  const remaining = state.quoteOverride.remaining_purchasable_trees ?? 3500;
  const estimatedTotalTCO2e = state.quoteOverride.estimated_total_t_co2e ?? 5;
  const estimatedTotalKgCO2e =
    state.quoteOverride.estimated_total_kg_co2e ?? 5000;
  const totalAmount = state.quoteOverride.total_amount ?? 750;

  return {
    area_id: MOCK_AREA_ID,
    compensation_mode: "tree_purchase",
    horizon_years: 20,
    trees_requested: 50,
    estimated_kg_co2_per_tree_per_year: 100,
    estimated_total_t_co2e: estimatedTotalTCO2e,
    estimated_total_kg_co2e: estimatedTotalKgCO2e,
    price_per_tree: 15,
    total_amount: totalAmount,
    currency: "BRL",
    max_purchasable_trees: 3500,
    remaining_purchasable_trees: remaining,
    producer_stripe_connected: true,
    producer_charges_enabled: true,
    producer_ready_to_receive_support:
      state.quoteOverride.producer_ready_to_receive_support ?? true,
  };
}

function createInitialState(): MockApiState {
  const finalizedInputs = normalizeInputs([
    { category: "energy", unit: "kwh", value: 3600, metadata: {} },
    {
      category: "transport",
      unit: "km",
      value: 15000,
      metadata: { vehicle_type: "car_medium" },
    },
    {
      category: "flights",
      unit: "trip",
      value: 2,
      metadata: { flight_type: "short_haul", class: "economy" },
    },
  ]);

  const finalizedCalculation = buildCalculation({
    id: MOCK_CALCULATION_ID,
    status: "finalized",
    inputs: finalizedInputs,
    total_kg_co2e: 7800,
    total_t_co2e: 7.8,
    breakdown: buildBreakdown(finalizedInputs),
  });

  const draftCalculation = buildCalculation({
    id: "calc-002",
    status: "draft",
    inputs: normalizeInputs([
      { category: "energy", unit: "kwh", value: 1200, metadata: {} },
    ]),
    total_kg_co2e: 600,
    total_t_co2e: 0.6,
  });

  return {
    calculations: [finalizedCalculation, draftCalculation],
    contributions: [
      {
        id: MOCK_COMPENSATION_ID,
        area_id: MOCK_AREA_ID,
        area_name: "Reserva Legal Amazônia",
        area_slug: "reserva-legal-amazonia",
        calculation_id: MOCK_CALCULATION_ID,
        compensation_mode: "tree_purchase",
        total_t_co2e: 5,
        trees_count: 50,
        total_amount: 750,
        currency: "BRL",
        status: "completed",
        created_at: "2025-04-15T00:00:00Z",
        paid_at: "2025-04-15T00:10:00Z",
      },
    ],
    nextCalculationId: 3,
    lastCreatedCalculationId: null,
    latestContributionId: MOCK_COMPENSATION_ID,
    latestPaymentId: MOCK_PAYMENT_ID,
    latestPaymentStatus: {
      payment_id: MOCK_PAYMENT_ID,
      compensation_id: MOCK_COMPENSATION_ID,
      provider: "stripe",
      provider_reference: "pi_123",
      simulation_status: "confirmed",
      payment_status: "paid",
      compensation_status: "completed",
      amount: 750,
      currency: "BRL",
      installments: 1,
      processed_at: "2025-05-01T00:00:00Z",
      certificate: {
        id: MOCK_CERTIFICATE_ID,
        certificate_number: "CERT-001",
        status: "issued",
        issued_at: "2025-05-01T00:00:00Z",
      },
    },
    latestPixPayload: {
      qrCode: "data:image/png;base64,ZmFrZS1waXgtcXItY29kZQ==",
      copyPasteCode:
        "00020126580014br.gov.bcb.pix0136pix-test-code5204000053039865405750.005802BR5925ClimaBalance Teste6009Sao Paulo62070503***6304ABCD",
    },
    quoteOverride: {},
    requests: {
      createdCalculations: [],
      updatedCalculations: [],
      finalizedCalculations: [],
      createdContributions: [],
      paymentIntents: [],
      guestCalculations: [],
    },
  };
}

export function getMockApiState(page: Page): MockApiState {
  const state = pageState.get(page);
  if (!state) {
    throw new Error("Mock API state not initialized for page");
  }
  return state;
}

export async function setupApiMocks(page: Page): Promise<void> {
  const state = createInitialState();
  pageState.set(page, state);

  await page.route(`${API_BASE}/**`, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api/v1", "");
    const method = route.request().method();
    const body = route.request().postDataJSON?.() ?? {};

    try {
      const response = handleMockRoute(state, method, path, url, body);
      await route.fulfill({
        status: response.status,
        contentType:
          response.contentType ??
          (response.body instanceof ArrayBuffer
            ? "application/octet-stream"
            : "application/json"),
        body:
          response.body instanceof ArrayBuffer
            ? Buffer.from(response.body)
            : JSON.stringify(response.body),
      });
    } catch (error) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: String(error instanceof Error ? error.message : error),
        }),
      });
    }
  });
}

function jsonResponse(data: unknown, status = 200) {
  return { status, body: { data } };
}

function handleMockRoute(
  state: MockApiState,
  method: string,
  path: string,
  url: URL,
  body: Record<string, unknown>,
) {
  if (path === "/auth/login" && method === "POST")
    return jsonResponse(MOCK_AUTH.login);
  if (path === "/auth/register" && method === "POST")
    return jsonResponse(MOCK_AUTH.register);
  if (path === "/auth/human-check" && method === "GET")
    return jsonResponse(MOCK_AUTH.humanCheck);
  if (path === "/auth/session" && method === "GET")
    return jsonResponse({ csrfToken: "test-csrf-token" });
  if (path === "/auth/confirm-email" && method === "POST")
    return jsonResponse({ message: "Email confirmed" });
  if (path === "/auth/confirm-email/resend" && method === "POST")
    return jsonResponse({ message: "Resent" });
  if (path === "/auth/password-reset/request" && method === "POST")
    return jsonResponse({ message: "Reset email sent" });
  if (path === "/auth/password-reset/confirm" && method === "POST")
    return jsonResponse({ message: "Password reset" });
  if (path === "/auth/refresh" && method === "POST")
    return jsonResponse(MOCK_AUTH.login);
  if (path === "/auth/revoke" && method === "POST")
    return jsonResponse({ message: "Revoked" });
  if (path === "/auth/sessions" && method === "GET")
    return jsonResponse(MOCK_AUTH.sessions);
  if (path === "/auth/sessions" && method === "DELETE")
    return jsonResponse({ message: "All sessions revoked" });
  if (path.match(/^\/auth\/sessions\/.+$/) && method === "DELETE")
    return jsonResponse({ message: "Session revoked" });

  const userMatch = path.match(/^\/users\/([^/]+)$/);
  if (userMatch && method === "GET") {
    const user = MOCK_USERS.find(
      (candidate) =>
        candidate.id === userMatch[1] || candidate.slug === userMatch[1],
    );
    return jsonResponse(user ?? MOCK_USER);
  }

  const userProfileMatch = path.match(/^\/users\/([^/]+)\/profile$/);
  if (userProfileMatch && method === "GET") {
    return jsonResponse({
      id: "profile-001",
      user_id: MOCK_USER_ID,
      ...MOCK_USER.profile,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-05-01T00:00:00Z",
    });
  }
  if (userProfileMatch && method === "PUT") {
    return jsonResponse({
      id: "profile-001",
      user_id: MOCK_USER_ID,
      ...MOCK_USER.profile,
      ...body,
      updated_at: nowIso(),
    });
  }

  if (path.match(/^\/users\/([^/]+)\/profile\/avatar$/) && method === "POST") {
    return jsonResponse({
      avatar_path: "/avatars/test.png",
      avatar_url: "/avatars/test.png",
    });
  }

  if (path.match(/^\/users\/([^/]+)\/compensations$/) && method === "GET") {
    return jsonResponse(state.contributions);
  }

  if (path.match(/^\/users\/([^/]+)\/contributions$/) && method === "GET") {
    return jsonResponse(state.contributions);
  }

  if (path.match(/^\/users\/([^/]+)\/certificates$/) && method === "GET") {
    return jsonResponse([
      {
        id: MOCK_CERTIFICATE_ID,
        certificate_number: "CERT-001",
        compensation_id: MOCK_COMPENSATION_ID,
        status: "issued",
        issued_at: "2025-05-01T00:00:00Z",
        file_name: "certificate-cert-001.pdf",
        mime_type: "application/pdf",
      },
    ]);
  }

  if (path.match(/^\/users\/([^/]+)\/climate-balance$/) && method === "GET") {
    return jsonResponse({
      gross_emissions_t_co2e: 12.5,
      estimated_offset_t_co2e: 3.2,
      net_balance_t_co2e: -9.3,
      total_trees_purchased: 48,
      total_contribution_amount: 750,
    });
  }

  if (path === "/users" && method === "GET") return jsonResponse(MOCK_USERS);
  if (path.match(/^\/users\/([^/]+)$/) && method === "PATCH")
    return jsonResponse(MOCK_USER);
  if (path.match(/^\/users\/([^/]+)$/) && method === "DELETE")
    return jsonResponse({ message: "Deleted" });
  if (path === "/users/change-password" && method === "POST")
    return jsonResponse({ message: "Password changed" });

  if (path === "/directory/users" && method === "GET")
    return jsonResponse(MOCK_DIRECTORY);

  if (path === "/areas" && method === "GET") return jsonResponse(MOCK_AREAS);
  if (path === "/areas" && method === "POST")
    return jsonResponse({ ...MOCK_AREAS[0], ...body, id: "new-area-001" }, 201);

  const areaByIdMatch = path.match(/^\/areas\/([^/]+)$/);
  if (areaByIdMatch && method === "GET") {
    const area = MOCK_AREAS.find(
      (candidate) =>
        candidate.id === areaByIdMatch[1] ||
        candidate.slug === areaByIdMatch[1],
    );
    return jsonResponse(area ?? MOCK_AREAS[0]);
  }
  if (areaByIdMatch && method === "PATCH") return jsonResponse(MOCK_AREAS[0]);
  if (areaByIdMatch && method === "DELETE")
    return jsonResponse({ message: "Deleted" });

  if (path.match(/^\/areas\/([^/]+)\/capacity$/) && method === "GET") {
    return jsonResponse({
      total_trees: 5000,
      available_trees: 3500,
      total_capacity_tco2: 1000,
    });
  }

  if (path.match(/^\/areas\/([^/]+)\/contributions$/) && method === "GET")
    return jsonResponse([]);

  if (path.match(/^\/areas\/([^/]+)\/media$/) && method === "GET")
    return jsonResponse(MOCK_AREAS[0].media);
  if (path.match(/^\/areas\/([^/]+)\/media$/) && method === "POST")
    return jsonResponse({
      id: "media-new",
      type: "image",
      url: "/media/test.png",
    });
  if (
    path.match(/^\/areas\/media\/([^/]+)\/(file|thumbnail)$/) &&
    method === "GET"
  )
    return jsonResponse({});
  if (path.match(/^\/areas\/media\/([^/]+)$/) && method === "DELETE")
    return jsonResponse({ message: "Deleted" });

  if (path.match(/^\/areas\/([^/]+)\/submit-audit$/) && method === "POST")
    return jsonResponse({ status: "pending_audit" });
  if (path.match(/^\/areas\/([^/]+)\/approve$/) && method === "POST")
    return jsonResponse({ status: "approved" });
  if (path.match(/^\/areas\/([^/]+)\/reject$/) && method === "POST")
    return jsonResponse({ status: "rejected" });
  if (path.match(/^\/areas\/([^/]+)\/activate$/) && method === "POST")
    return jsonResponse({ status: "active" });
  if (path.match(/^\/areas\/([^/]+)\/suspend$/) && method === "POST")
    return jsonResponse({ status: "suspended" });

  if (path === "/map/areas" && method === "GET")
    return jsonResponse(MOCK_AREAS);
  if (path === "/stats/global" && method === "GET")
    return jsonResponse(MOCK_GLOBAL_STATS);

  if (path.match(/^\/areas\/([^/]+)\/planted-trees$/) && method === "GET")
    return jsonResponse([]);
  if (path.match(/^\/areas\/([^/]+)\/planted-trees$/) && method === "POST")
    return jsonResponse({ count: 10 });
  if (path.match(/^\/areas\/([^/]+)\/planted-trees$/) && method === "DELETE")
    return jsonResponse({ message: "Cleared" });
  if (path.match(/^\/areas\/([^/]+)\/pending-tree-count$/) && method === "GET")
    return jsonResponse({ count: 0 });

  if (path.match(/^\/areas\/([^/]+)\/satellite-image$/) && method === "POST")
    return jsonResponse({ status: "processing" });
  if (
    path.match(/^\/areas\/([^/]+)\/satellite-image\/latest$/) &&
    method === "GET"
  ) {
    return jsonResponse({ url: null, status: "not_available" });
  }

  if (path === "/footprint/calculations" && method === "GET") {
    const userEmail = url.searchParams.get("user_email");
    if (userEmail && userEmail !== MOCK_USER.email) {
      return jsonResponse([]);
    }
    return jsonResponse(
      state.calculations.map((calculation) => ({
        ...calculation,
        inputs: undefined,
      })),
    );
  }

  if (path === "/footprint/calculations" && method === "POST") {
    state.requests.createdCalculations.push(clone(body));
    const id = `calc-${String(state.nextCalculationId).padStart(3, "0")}`;
    state.nextCalculationId += 1;
    const inputs = normalizeInputs(
      Array.isArray(body.inputs)
        ? (body.inputs as Array<{
            category: string;
            unit: string;
            value: number;
            metadata?: Record<string, unknown> | null;
          }>)
        : [],
    );
    const calculation = buildCalculation({
      id,
      status: "draft",
      profile_type:
        (body.profile_type as "individual" | "legal_entity") ?? "individual",
      period_start: String(body.period_start ?? "2025-01-01"),
      period_end: String(body.period_end ?? "2025-12-31"),
      data_quality: (body.data_quality as "real" | "estimated") ?? "estimated",
      inputs,
    });
    state.calculations.unshift(calculation);
    state.lastCreatedCalculationId = id;
    return jsonResponse(
      {
        calculation_id: id,
        total_kg_co2e: calculation.total_kg_co2e,
        total_t_co2e: calculation.total_t_co2e,
        breakdown: calculation.breakdown,
      },
      201,
    );
  }

  const calcByIdMatch = path.match(/^\/footprint\/calculations\/([^/]+)$/);
  if (calcByIdMatch && method === "GET") {
    const calculation = state.calculations.find(
      (candidate) => candidate.id === calcByIdMatch[1],
    );
    return jsonResponse(calculation ?? state.calculations[0]);
  }

  if (calcByIdMatch && method === "PATCH") {
    state.requests.updatedCalculations.push(clone(body));
    const calculation = state.calculations.find(
      (candidate) => candidate.id === calcByIdMatch[1],
    );
    if (!calculation) return jsonResponse({ message: "Not found" }, 404);
    const inputs = normalizeInputs(
      Array.isArray(body.inputs)
        ? (body.inputs as Array<{
            category: string;
            unit: string;
            value: number;
            metadata?: Record<string, unknown> | null;
          }>)
        : calculation.inputs.map((input) => ({
            category: input.category,
            unit: input.unit,
            value: input.quantity,
            metadata: input.metadata,
          })),
    );
    const totals = calculationTotals(inputs);
    Object.assign(calculation, {
      period_start: String(body.period_start ?? calculation.period_start),
      period_end: String(body.period_end ?? calculation.period_end),
      data_quality:
        (body.data_quality as "real" | "estimated") ?? calculation.data_quality,
      inputs,
      total_kg_co2e: totals.totalKg,
      total_t_co2e: totals.totalT,
      breakdown: totals.breakdown,
      updated_at: nowIso(),
    });
    return jsonResponse(undefined, 204);
  }

  if (calcByIdMatch && method === "DELETE") {
    state.calculations = state.calculations.filter(
      (candidate) => candidate.id !== calcByIdMatch[1],
    );
    return jsonResponse({ message: "Deleted" });
  }

  const finalizeMatch = path.match(
    /^\/footprint\/calculations\/([^/]+)\/finalize$/,
  );
  if (finalizeMatch && method === "POST") {
    state.requests.finalizedCalculations.push(finalizeMatch[1]);
    const calculation = state.calculations.find(
      (candidate) => candidate.id === finalizeMatch[1],
    );
    if (calculation) {
      calculation.status = "finalized";
      calculation.updated_at = nowIso();
    }
    return jsonResponse(undefined, 204);
  }

  if (
    path.match(/^\/footprint\/calculations\/([^/]+)\/projection$/) &&
    method === "POST"
  ) {
    return jsonResponse({
      projection_id: "proj-001",
      calculation_id: state.lastCreatedCalculationId ?? MOCK_CALCULATION_ID,
      area_id: MOCK_AREA_ID,
      biome: "Amazônia",
      trees_needed: 65,
      horizon_years: 20,
      t_co2e_per_tree_per_year: 0.2,
    });
  }

  if (path === "/footprint/emission-factors" && method === "GET") {
    return jsonResponse([
      {
        id: "factor-energy",
        activity_type: "electricity",
        factor_value: 0.5,
        factor_unit: "kwh",
        region: "BR",
        version: "2025.1",
      },
      {
        id: "factor-transport",
        activity_type: "car_medium",
        factor_value: 0.2,
        factor_unit: "km",
        region: "BR",
        version: "2025.1",
      },
    ]);
  }

  if (path === "/footprint/calculate-guest" && method === "POST") {
    state.requests.guestCalculations.push(clone(body));
    const inputs = normalizeInputs(
      Array.isArray(body.inputs)
        ? (body.inputs as Array<{
            category: string;
            unit: string;
            value: number;
            metadata?: Record<string, unknown> | null;
          }>)
        : [],
    );
    const totals = calculationTotals(inputs);
    return jsonResponse({
      total_kg_co2e: totals.totalKg,
      total_t_co2e: totals.totalT,
      breakdown: totals.breakdown,
      data_quality: body.data_quality ?? "estimated",
      factors_version: "2025.1",
    });
  }

  if (path === "/compensations" && method === "POST")
    return jsonResponse({ id: MOCK_COMPENSATION_ID }, 201);
  if (path === "/compensations" && method === "GET")
    return jsonResponse(state.contributions);
  if (path === "/compensations/quote" && method === "POST")
    return jsonResponse(buildQuote(state));

  if (path === "/contributions" && method === "POST") {
    state.requests.createdContributions.push(clone(body));
    const contributionId = `contrib-${state.requests.createdContributions.length}`;
    state.latestContributionId = contributionId;
    return jsonResponse(
      {
        compensation_id: contributionId,
        area_id: body.area_id ?? MOCK_AREA_ID,
        compensation_mode: body.compensation_mode ?? "tree_purchase",
        trees_requested: body.trees_requested ?? 0,
        price_per_tree: 15,
        estimated_total_t_co2e: body.total_t_co2e ?? 0,
        total_t_co2e: body.total_t_co2e ?? 0,
        trees_count: body.trees_requested ?? 0,
        total_amount: body.total_amount ?? 0,
        currency: body.currency ?? "BRL",
        status: "pending",
        created_at: nowIso(),
      },
      201,
    );
  }

  if (path === "/contributions/quote" && method === "POST") {
    const quote = buildQuote(state);
    return jsonResponse({
      ...quote,
      trees_requested: body.trees_requested ?? quote.trees_requested,
      total_amount:
        typeof body.trees_requested === "number"
          ? Number(body.trees_requested) * 15
          : quote.total_amount,
      estimated_total_t_co2e:
        typeof body.trees_requested === "number"
          ? Number(body.trees_requested) * 0.1
          : quote.estimated_total_t_co2e,
      estimated_total_kg_co2e:
        typeof body.trees_requested === "number"
          ? Number(body.trees_requested) * 100
          : quote.estimated_total_kg_co2e,
    });
  }

  if (path === "/contributions" && method === "GET")
    return jsonResponse(state.contributions);

  if (path === "/payments/simulate" && method === "POST")
    return jsonResponse(state.latestPaymentStatus);

  const paymentStatusMatch = path.match(/^\/payments\/([^/]+)\/status$/);
  if (paymentStatusMatch && method === "GET") {
    const paymentStatus = {
      ...state.latestPaymentStatus,
      payment_id: paymentStatusMatch[1],
      compensation_id: state.latestContributionId ?? MOCK_COMPENSATION_ID,
    };
    if (
      paymentStatus.payment_status === "paid" &&
      state.latestContributionId &&
      !state.contributions.some(
        (item) => item.id === state.latestContributionId,
      )
    ) {
      state.contributions.unshift({
        id: state.latestContributionId,
        area_id: MOCK_AREA_ID,
        area_name: "Reserva Legal Amazônia",
        area_slug: "reserva-legal-amazonia",
        calculation_id: state.lastCreatedCalculationId,
        compensation_mode: "tree_purchase",
        total_t_co2e: paymentStatus.amount / 150,
        trees_count: Math.round(paymentStatus.amount / 15),
        total_amount: paymentStatus.amount,
        currency: paymentStatus.currency,
        status: "completed",
        created_at: nowIso(),
        paid_at: paymentStatus.processed_at,
      });
    }
    return jsonResponse(paymentStatus);
  }

  if (path === "/payments/create-payment-intent" && method === "POST") {
    state.requests.paymentIntents.push(clone(body));
    const paymentId = `${MOCK_PAYMENT_ID}-${state.requests.paymentIntents.length}`;
    state.latestPaymentId = paymentId;
    state.latestPaymentStatus = {
      ...state.latestPaymentStatus,
      payment_id: paymentId,
      compensation_id: String(body.compensation_id ?? MOCK_COMPENSATION_ID),
      amount: Number(
        state.requests.createdContributions.at(-1)?.total_amount ?? 750,
      ),
    };

    if (body.payment_method === "pix") {
      return jsonResponse(
        {
          payment_id: paymentId,
          compensation_id: body.compensation_id ?? MOCK_COMPENSATION_ID,
          payment_status: "pending",
          payment_intent_id: MOCK_PAYMENT.intent.payment_intent_id,
          payment_method: "pix",
          qr_code: state.latestPixPayload.qrCode,
          copy_paste_code: state.latestPixPayload.copyPasteCode,
        },
        200,
      );
    }

    return jsonResponse(
      {
        payment_id: paymentId,
        compensation_id: body.compensation_id ?? MOCK_COMPENSATION_ID,
        payment_status: "pending",
        client_secret: "pi_123_secret_456",
        payment_intent_id: "pi_123",
        payment_method: "card",
      },
      200,
    );
  }

  if (path === "/producers/stripe/status" && method === "GET") {
    return jsonResponse({ connected: true, onboarding_status: "complete" });
  }
  if (path === "/producers/stripe/onboard" && method === "POST")
    return jsonResponse({
      onboarding_url: "https://connect.stripe.com/onboard",
    });
  if (path === "/producers/stripe/dashboard" && method === "POST")
    return jsonResponse({ dashboard_url: "https://dashboard.stripe.com" });

  if (path.match(/^\/certificates\/validate/) && method === "GET")
    return jsonResponse(MOCK_CERTIFICATE_VALIDATION);
  if (path.match(/^\/certificates\/([^/]+)\/download$/) && method === "GET") {
    return {
      status: 200,
      contentType: "application/pdf",
      body: new ArrayBuffer(0),
    };
  }

  if (path === "/contact" && method === "POST")
    return jsonResponse({ message: "Sent" });
  if (path === "/privacy/cookie-consent" && method === "POST")
    return jsonResponse({ message: "Saved" });

  if (path === "/locations/states" && method === "GET") {
    return jsonResponse([
      { code: "SP", name: "São Paulo" },
      { code: "BA", name: "Bahia" },
      { code: "PA", name: "Pará" },
    ]);
  }
  if (path === "/locations/cities" && method === "GET") {
    return jsonResponse([
      { name: "São Paulo" },
      { name: "Altamira" },
      { name: "Ilhéus" },
    ]);
  }

  if (path === "/audit-log" && method === "GET")
    return jsonResponse(MOCK_AUDIT_LOG);

  if (path === "/areas/pending" && method === "GET") {
    return jsonResponse(
      MOCK_AREAS.map((area) => ({
        ...area,
        status: "pending_audit",
      })),
    );
  }

  throw new Error(`Unhandled route: ${method} ${path}`);
}
