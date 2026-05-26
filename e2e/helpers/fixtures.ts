export const MOCK_AREA = {
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
  owner_user_id: "owner-001",
  owner_name: "João Produtor",
  owner_slug: "joao-produtor",
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

export const MOCK_AREAS_LIST = [
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

export const MOCK_EMISSION_FACTORS = [
  {
    id: "factor-energy",
    activity_type: "electricity",
    factor_value: 0.5,
    factor_unit: "kwh",
    region: "BR",
    version: "2026.01",
  },
  {
    id: "factor-transport",
    activity_type: "car_medium",
    factor_value: 0.2,
    factor_unit: "km",
    region: "BR",
    version: "2026.01",
  },
];
