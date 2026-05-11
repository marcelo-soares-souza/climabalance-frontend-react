export const MOCK_USER_ID = '0195f1e2-3a4b-5c6d-7e8f-9a0b1c2d3e4f';
export const MOCK_AREA_ID = '0195f1e2-4b5c-6d7e-8f9a-0b1c2d3e4f5a';
export const MOCK_CALCULATION_ID = 'calc-001';
export const MOCK_COMPENSATION_ID = 'comp-001';
export const MOCK_PAYMENT_ID = 'pay-001';
export const MOCK_CERTIFICATE_ID = 'cert-001';

export function createTestToken(roles: string[] = ['individual']): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: MOCK_USER_ID,
      roles,
      iss: 'climabalance',
      aud: 'climabalance',
      iat: Math.floor(Date.now() / 1000) - 3600,
      exp: Math.floor(Date.now() / 1000) + 86400 * 365,
    })
  );
  return `${header}.${payload}.fake-signature`;
}

export const MOCK_AUTH = {
  login: {
    accessToken: createTestToken(['individual']),
    tokenType: 'Bearer',
    expiresIn: 3600,
    refreshExpiresIn: 86400,
    csrfToken: 'test-csrf-token',
  },
  register: {
    id: MOCK_USER_ID,
    email: 'test@example.com',
    status: 'pending_confirmation',
  },
  humanCheck: {
    challenge_id: 'challenge-001',
    question: 'Quanto é 5 + 3?',
    locale: 'pt-BR',
  },
  sessions: [
    {
      id: 'sess-001',
      user_agent: 'Mozilla/5.0 Chrome/120',
      ip_address: '192.168.1.1',
      created_at: '2025-01-01T00:00:00Z',
      last_activity: '2025-05-01T00:00:00Z',
      is_current: true,
      device_info: { os: 'Linux', browser: 'Chrome 120' },
    },
  ],
};

export const MOCK_USER = {
  id: MOCK_USER_ID,
  name: 'Maria Silva',
  email: 'maria@example.com',
  slug: 'maria-silva',
  status: 'active',
  locale: 'pt-BR',
  roles: ['individual'],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-05-01T00:00:00Z',
  profile: {
    display_name: 'Maria Silva',
    document_number: '123.456.789-00',
    birth_date: '1990-05-15',
    phone: '+55 11 99999-8888',
    address_line1: 'Rua Exemplo, 123',
    address_city: 'São Paulo',
    address_state: 'SP',
    address_country: 'BR',
    address_postal_code: '01001-000',
    about: 'Ambientalista e engenheira florestal.',
    avatar_url: null,
    website_url: 'https://maria.example.com',
    instagram_url: 'https://instagram.com/maria',
    x_url: null,
    bluesky_url: null,
    mastodon_url: null,
    youtube_url: null,
    linkedin_url: 'https://linkedin.com/in/maria',
  },
  stats: {
    total_footprint_tco2: 12.5,
    total_compensated_tco2: 3.2,
    climate_balance_tco2: -9.3,
    total_trees_planted: 48,
    total_compensations: 3,
    total_contributions: 1,
  },
};

export const MOCK_AREAS = [
  {
    id: MOCK_AREA_ID,
    name: 'Reserva Legal Amazônia',
    slug: 'reserva-legal-amazonia',
    description: 'Área de preservação na Amazônia Legal com reflorestamento ativo.',
    country_code: 'BR',
    state: 'PA',
    city: 'Altamira',
    latitude: -3.2078,
    longitude: -52.2098,
    biome: 'Amazônia',
    t_co2e_per_tree_per_year: 10,
    price_per_tree: 15,
    default_horizon_years: 20,
    total_trees: 5000,
    available_trees: 3500,
    total_capacity_tco2: 1000,
    status: 'active',
    owner: {
      id: 'owner-001',
      name: 'João Produtor',
      slug: 'joao-produtor',
    },
    media: [
      { id: 'media-001', type: 'image', url: '/api/v1/areas/media/media-001/file' },
    ],
    created_at: '2025-02-01T00:00:00Z',
    updated_at: '2025-04-15T00:00:00Z',
  },
  {
    id: 'area-002',
    name: 'Reflorestamento Mata Atlântica',
    slug: 'reflorestamento-mata-atlantica',
    description: 'Projeto de recuperação da Mata Atlântica no sul da Bahia.',
    country_code: 'BR',
    state: 'BA',
    city: 'Ilhéus',
    latitude: -14.7891,
    longitude: -39.0486,
    biome: 'Mata Atlântica',
    t_co2e_per_tree_per_year: 8,
    price_per_tree: 12,
    default_horizon_years: 25,
    total_trees: 10000,
    available_trees: 8200,
    total_capacity_tco2: 2000,
    status: 'active',
    owner: { id: 'owner-001', name: 'João Produtor', slug: 'joao-produtor' },
    media: [],
    created_at: '2025-03-01T00:00:00Z',
    updated_at: '2025-05-01T00:00:00Z',
  },
];

export const MOCK_FOOTPRINT = {
  calculation: {
    id: MOCK_CALCULATION_ID,
    status: 'draft',
    profile_type: 'individual',
    period_start: '2025-01-01',
    period_end: '2025-12-31',
    data_quality: 'estimated',
    total_tco2: null,
    inputs: {},
    breakdown: {},
    created_at: '2025-05-01T00:00:00Z',
    updated_at: '2025-05-01T00:00:00Z',
  },
  finalizedCalculation: {
    id: MOCK_CALCULATION_ID,
    status: 'finalized',
    profile_type: 'individual',
    period_start: '2025-01-01',
    period_end: '2025-12-31',
    data_quality: 'estimated',
    total_tco2: 12.5,
    inputs: {
      energy_electricity_kwh: 3600,
      transport_car_km: 15000,
      flights_short_haul: 2,
    },
    breakdown: {
      energy: 2.1,
      transport: 3.8,
      fuel: 1.5,
      flights: 3.0,
      scope1: 0.8,
      scope2: 0.6,
      scope3: 0.7,
    },
    created_at: '2025-05-01T00:00:00Z',
    updated_at: '2025-05-01T00:00:00Z',
  },
  calculations: [
    {
      id: 'calc-001',
      status: 'finalized',
      total_tco2: 12.5,
      period_start: '2025-01-01',
      period_end: '2025-12-31',
      created_at: '2025-05-01T00:00:00Z',
    },
    {
      id: 'calc-002',
      status: 'draft',
      total_tco2: null,
      period_start: '2024-01-01',
      period_end: '2024-12-31',
      created_at: '2025-03-15T00:00:00Z',
    },
  ],
  emissionFactors: {
    energy_electricity_kwh: 0.5,
    transport_car_km: 0.2,
    flights_short_haul: 1.5,
    flights_long_haul: 3.0,
  },
  guestResult: {
    total_tco2: 12.5,
    breakdown: {
      energy: 2.1,
      transport: 3.8,
      fuel: 1.5,
      flights: 3.0,
      scope1: 0.8,
      scope2: 0.6,
      scope3: 0.7,
    },
  },
  projection: {
    projection_trees: 65,
    projection_tco2: 12.5,
    area_options: MOCK_AREAS.map((a) => ({ id: a.id, name: a.name, price_per_tree: a.price_per_tree })),
  },
};

export const MOCK_COMPENSATION = {
  quote: {
    remainingTrees: 3500,
    pricePerTree: 15,
    estimatedTotalTCO2e: 5,
    estimatedTotalKgCO2e: 5000,
    totalAmount: 750,
    trees: 50,
    areaId: MOCK_AREA_ID,
  },
  confirmation: {
    id: MOCK_COMPENSATION_ID,
    status: 'pending',
    trees: 50,
    tco2: 5.0,
    totalPrice: 750.0,
    paymentId: MOCK_PAYMENT_ID,
    certificateId: null,
    createdAt: '2025-05-01T00:00:00Z',
  },
  history: [
    {
      id: MOCK_COMPENSATION_ID,
      status: 'completed',
      trees: 50,
      tco2: 5.0,
      total_price: 750.0,
      area_name: 'Reserva Legal Amazônia',
      certificate_number: 'CERT-001',
      payment_status: 'paid',
      created_at: '2025-04-15T00:00:00Z',
    },
    {
      id: 'comp-002',
      status: 'completed',
      trees: 30,
      tco2: 3.0,
      total_price: 360.0,
      area_name: 'Reflorestamento Mata Atlântica',
      certificate_number: 'CERT-002',
      payment_status: 'paid',
      created_at: '2025-03-10T00:00:00Z',
    },
  ],
  payment: {
    id: MOCK_PAYMENT_ID,
    status: 'completed',
    amount: 750.0,
    payment_method: 'pix',
    pix_data: {
      qr_code: '00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540510.005802BR5913Maria Silva6009Sao Paulo62070503***6304ABCD',
      qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAA...',
      copy_paste_key: '00020126580014br.gov.bcb.pix0136a1b2c3d4e5f67890abcdef1234567890520400005303986540510.005802BR5913Maria Silva6009Sao Paulo62070503***6304ABCD',
    },
    created_at: '2025-05-01T00:00:00Z',
  },
  report: {
    id: MOCK_COMPENSATION_ID,
    status: 'completed',
    trees: 50,
    tco2: 5.0,
    total_price: 750.0,
    payment_status: 'paid',
    area_name: 'Reserva Legal Amazônia',
    certificate_number: 'CERT-001',
    certificate_id: MOCK_CERTIFICATE_ID,
    created_at: '2025-05-01T00:00:00Z',
  },
  certificates: [
    {
      id: MOCK_CERTIFICATE_ID,
      certificate_number: 'CERT-001',
      compensation_id: MOCK_COMPENSATION_ID,
      trees: 50,
      tco2: 5.0,
      area_name: 'Reserva Legal Amazônia',
      issued_at: '2025-05-01T00:00:00Z',
      download_url: `/api/v1/certificates/${MOCK_CERTIFICATE_ID}/download`,
    },
  ],
};

export const MOCK_PAYMENT = {
  intent: {
    clientSecret: 'pi_123_secret_456',
    paymentIntentId: MOCK_PAYMENT_ID,
  },
  status: {
    id: MOCK_PAYMENT_ID,
    status: 'completed',
    amount: 750.0,
    payment_method: 'pix',
    created_at: '2025-05-01T00:00:00Z',
  },
};

export const MOCK_GLOBAL_STATS = {
  total_areas: 15,
  total_trees_planted: 45000,
  total_tco2_compensated: 3200,
  total_users: 850,
  total_producers: 42,
};

export const MOCK_USERS = [
  MOCK_USER,
  {
    id: 'user-002',
    name: 'Carlos Auditor',
    email: 'carlos@example.com',
    slug: 'carlos-auditor',
    status: 'active',
    locale: 'pt-BR',
    roles: ['analyst'],
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-04-20T00:00:00Z',
  },
  {
    id: 'user-003',
    name: 'Admin Sistema',
    email: 'admin@example.com',
    slug: 'admin-sistema',
    status: 'active',
    locale: 'pt-BR',
    roles: ['administrator'],
    created_at: '2024-12-01T00:00:00Z',
    updated_at: '2025-05-01T00:00:00Z',
  },
];

export const MOCK_DIRECTORY = MOCK_USERS.map((u) => ({
  id: u.id,
  name: u.name,
  slug: u.slug,
  avatar_url: null,
  country: 'BR',
  total_areas: u.roles.includes('producer') ? 3 : 0,
  total_trees: u.roles.includes('producer') ? 5000 : 0,
}));

export const MOCK_CERTIFICATE_VALIDATION = {
  valid: true,
  certificate_number: 'CERT-001',
  holder_name: 'Maria Silva',
  trees: 50,
  tco2: 5.0,
  area_name: 'Reserva Legal Amazônia',
  issued_at: '2025-05-01T00:00:00Z',
};

export const MOCK_AUDIT_LOG = [
  {
    id: 'log-001',
    actor_name: 'Admin Sistema',
    action: 'area.approve',
    target_type: 'area',
    target_id: MOCK_AREA_ID,
    ip_address: '192.168.1.100',
    created_at: '2025-04-15T00:00:00Z',
    details: { reason: 'Documentação completa e conforme.' },
  },
  {
    id: 'log-002',
    actor_name: 'Maria Silva',
    action: 'user.register',
    target_type: 'user',
    target_id: MOCK_USER_ID,
    ip_address: '192.168.1.50',
    created_at: '2025-01-01T00:00:00Z',
    details: null,
  },
];
