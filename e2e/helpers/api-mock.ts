import type { Page } from '@playwright/test';
import {
  MOCK_AUTH,
  MOCK_USER,
  MOCK_AREAS,
  MOCK_FOOTPRINT,
  MOCK_COMPENSATION,
  MOCK_PAYMENT,
  MOCK_GLOBAL_STATS,
  MOCK_USERS,
  MOCK_DIRECTORY,
  MOCK_AUDIT_LOG,
  MOCK_CERTIFICATE_VALIDATION,
} from '../fixtures/mock-data';

const API_BASE = 'http://localhost:3001/api/v1';

export async function setupApiMocks(page: Page): Promise<void> {
  await page.route(`${API_BASE}/**`, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace('/api/v1', '');
    const method = route.request().method();

    try {
      const response = await handleMockRoute(method, path, url, route.request());
      await route.fulfill({ status: response.status, contentType: 'application/json', body: JSON.stringify(response.body) });
    } catch {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'not_found' }) });
    }
  });
}

function jsonResponse(data: unknown, status = 200) {
  return { status, body: { data } };
}

function paginatedResponse(data: unknown[], total?: number) {
  return {
    status: 200,
    body: { data, total: total ?? data.length, limit: 20, offset: 0 },
  };
}

function handleMockRoute(method: string, path: string, url: URL, request: { postData(): string | null }) {
  const body = request.postData() ? JSON.parse(request.postData()!) : {};

  // --- Auth ---
  if (path === '/auth/login' && method === 'POST') return jsonResponse(MOCK_AUTH.login);
  if (path === '/auth/register' && method === 'POST') return jsonResponse(MOCK_AUTH.register);
  if (path === '/auth/human-check' && method === 'GET') return jsonResponse(MOCK_AUTH.humanCheck);
  if (path === '/auth/confirm-email' && method === 'POST') return jsonResponse({ message: 'Email confirmed' });
  if (path === '/auth/confirm-email/resend' && method === 'POST') return jsonResponse({ message: 'Resent' });
  if (path === '/auth/password-reset/request' && method === 'POST') return jsonResponse({ message: 'Reset email sent' });
  if (path === '/auth/password-reset/confirm' && method === 'POST') return jsonResponse({ message: 'Password reset' });
  if (path === '/auth/refresh' && method === 'POST') return jsonResponse(MOCK_AUTH.login);
  if (path === '/auth/revoke' && method === 'POST') return jsonResponse({ message: 'Revoked' });
  if (path === '/auth/sessions' && method === 'GET') return jsonResponse(MOCK_AUTH.sessions);

  const sessionMatch = path.match(/^\/auth\/sessions\/(.+)$/);
  if (sessionMatch && method === 'DELETE') return jsonResponse({ message: 'Session revoked' });

  // --- Users ---
  const userMatch = path.match(/^\/users\/([^/]+)$/);
  if (userMatch && method === 'GET') {
    const user = MOCK_USERS.find((u) => u.id === userMatch[1] || u.slug === userMatch[1]);
    return jsonResponse(user || MOCK_USER);
  }

  const userProfileMatch = path.match(/^\/users\/([^/]+)\/profile$/);
  if (userProfileMatch && method === 'GET') return jsonResponse(MOCK_USER.profile);
  if (userProfileMatch && method === 'PUT') return jsonResponse(MOCK_USER.profile);

  const avatarMatch = path.match(/^\/users\/([^/]+)\/profile\/avatar$/);
  if (avatarMatch && method === 'POST') return jsonResponse({ avatar_url: '/avatars/test.png' });

  const userCompensationsMatch = path.match(/^\/users\/([^/]+)\/compensations$/);
  if (userCompensationsMatch && method === 'GET') return paginatedResponse(MOCK_COMPENSATION.history);

  const userContributionsMatch = path.match(/^\/users\/([^/]+)\/contributions$/);
  if (userContributionsMatch && method === 'GET') return paginatedResponse([]);

  const userCertificatesMatch = path.match(/^\/users\/([^/]+)\/certificates$/);
  if (userCertificatesMatch && method === 'GET') return paginatedResponse(MOCK_COMPENSATION.certificates);

  const userClimateMatch = path.match(/^\/users\/([^/]+)\/climate-balance$/);
  if (userClimateMatch && method === 'GET') return jsonResponse(MOCK_USER.stats);

  if (path === '/users' && method === 'GET') {
    const searchParams = url.searchParams;
    if (searchParams.has('search') || searchParams.has('status') || searchParams.has('sort')) {
      return paginatedResponse(MOCK_USERS);
    }
    return paginatedResponse(MOCK_USERS);
  }

  const updateUserMatch = path.match(/^\/users\/([^/]+)$/);
  if (updateUserMatch && method === 'PATCH') return jsonResponse(MOCK_USER);
  if (updateUserMatch && method === 'DELETE') return jsonResponse({ message: 'Deleted' });

  const changePasswordMatch = path.match(/^\/users\/change-password/);
  if (changePasswordMatch && method === 'POST') return jsonResponse({ message: 'Password changed' });

  // --- Directory ---
  if (path === '/directory/users' && method === 'GET') return paginatedResponse(MOCK_DIRECTORY);

  // --- Areas ---
  if (path === '/areas' && method === 'GET') return paginatedResponse(MOCK_AREAS);
  if (path === '/areas' && method === 'POST') {
    return jsonResponse({ ...MOCK_AREAS[0], ...body, id: 'new-area-001' }, 201);
  }

  const areaByIdMatch = path.match(/^\/areas\/([^/]+)$/);
  if (areaByIdMatch && method === 'GET') {
    const area = MOCK_AREAS.find((a) => a.id === areaByIdMatch[1] || a.slug === areaByIdMatch[1]);
    return jsonResponse(area || MOCK_AREAS[0]);
  }
  if (areaByIdMatch && method === 'PATCH') return jsonResponse(MOCK_AREAS[0]);
  if (areaByIdMatch && method === 'DELETE') return jsonResponse({ message: 'Deleted' });

  const areaCapacityMatch = path.match(/^\/areas\/([^/]+)\/capacity$/);
  if (areaCapacityMatch && method === 'GET') return jsonResponse({ total_trees: 5000, available_trees: 3500, total_capacity_tco2: 1000 });

  const areaContributionsMatch = path.match(/^\/areas\/([^/]+)\/contributions$/);
  if (areaContributionsMatch && method === 'GET') return paginatedResponse([]);

  const areaMediaListMatch = path.match(/^\/areas\/([^/]+)\/media$/);
  if (areaMediaListMatch && method === 'GET') return jsonResponse(MOCK_AREAS[0].media);

  const areaMediaUploadMatch = path.match(/^\/areas\/([^/]+)\/media$/);
  if (areaMediaUploadMatch && method === 'POST') return jsonResponse({ id: 'media-new', type: 'image', url: '/media/test.png' });

  if (path.match(/^\/areas\/media\/([^/]+)\/(file|thumbnail)$/) && method === 'GET') return jsonResponse({});

  if (path.match(/^\/areas\/media\/([^/]+)$/) && method === 'DELETE') return jsonResponse({ message: 'Deleted' });

  const areaSubmitAuditMatch = path.match(/^\/areas\/([^/]+)\/submit-audit$/);
  if (areaSubmitAuditMatch && method === 'POST') return jsonResponse({ status: 'pending_audit' });

  const areaApproveMatch = path.match(/^\/areas\/([^/]+)\/approve$/);
  if (areaApproveMatch && method === 'POST') return jsonResponse({ status: 'approved' });

  const areaRejectMatch = path.match(/^\/areas\/([^/]+)\/reject$/);
  if (areaRejectMatch && method === 'POST') return jsonResponse({ status: 'rejected' });

  const areaActivateMatch = path.match(/^\/areas\/([^/]+)\/activate$/);
  if (areaActivateMatch && method === 'POST') return jsonResponse({ status: 'active' });

  const areaSuspendMatch = path.match(/^\/areas\/([^/]+)\/suspend$/);
  if (areaSuspendMatch && method === 'POST') return jsonResponse({ status: 'suspended' });

  if (path === '/map/areas' && method === 'GET') return jsonResponse(MOCK_AREAS);
  if (path === '/stats/global' && method === 'GET') return jsonResponse(MOCK_GLOBAL_STATS);

  // --- Planted Trees ---
  const plantedTreesMatch = path.match(/^\/areas\/([^/]+)\/planted-trees$/);
  if (plantedTreesMatch && method === 'GET') return jsonResponse([]);
  if (plantedTreesMatch && method === 'POST') return jsonResponse({ count: 10 });
  if (plantedTreesMatch && method === 'DELETE') return jsonResponse({ message: 'Cleared' });

  const pendingTreesMatch = path.match(/^\/areas\/([^/]+)\/pending-tree-count$/);
  if (pendingTreesMatch && method === 'GET') return jsonResponse({ count: 0 });

  // --- Satellite ---
  const satelliteImageMatch = path.match(/^\/areas\/([^/]+)\/satellite-image/);
  if (satelliteImageMatch && method === 'POST') return jsonResponse({ status: 'processing' });

  const satelliteLatestMatch = path.match(/^\/areas\/([^/]+)\/satellite-image\/latest$/);
  if (satelliteLatestMatch && method === 'GET') return jsonResponse({ url: null, status: 'not_available' });

  // --- Footprint ---
  if (path === '/footprint/calculations' && method === 'GET') return paginatedResponse(MOCK_FOOTPRINT.calculations);
  if (path === '/footprint/calculations' && method === 'POST') return jsonResponse(MOCK_FOOTPRINT.calculation, 201);

  const calcByIdMatch = path.match(/^\/footprint\/calculations\/([^/]+)$/);
  if (calcByIdMatch && method === 'GET') {
    const calcId = calcByIdMatch[1];
    return jsonResponse(calcId === 'calc-001' ? MOCK_FOOTPRINT.finalizedCalculation : MOCK_FOOTPRINT.calculation);
  }
  if (calcByIdMatch && method === 'PATCH') return jsonResponse(MOCK_FOOTPRINT.calculation);
  if (calcByIdMatch && method === 'DELETE') return jsonResponse({ message: 'Deleted' });

  const finalizeMatch = path.match(/^\/footprint\/calculations\/([^/]+)\/finalize$/);
  if (finalizeMatch && method === 'POST') return jsonResponse(MOCK_FOOTPRINT.finalizedCalculation);

  const projectionMatch = path.match(/^\/footprint\/calculations\/([^/]+)\/projection$/);
  if (projectionMatch && method === 'POST') return jsonResponse(MOCK_FOOTPRINT.projection);

  if (path === '/footprint/emission-factors' && method === 'GET') return jsonResponse(MOCK_FOOTPRINT.emissionFactors);
  if (path === '/footprint/calculate-guest' && method === 'POST') return jsonResponse(MOCK_FOOTPRINT.guestResult);

  // --- Compensation ---
  if (path === '/compensations' && method === 'POST') return jsonResponse(MOCK_COMPENSATION.confirmation, 201);
  if (path === '/compensations' && method === 'GET') return paginatedResponse(MOCK_COMPENSATION.history);
  if (path === '/compensations/quote' && method === 'POST') return jsonResponse(MOCK_COMPENSATION.quote);

  // --- Contributions ---
  if (path === '/contributions' && method === 'POST') return jsonResponse({ id: 'contrib-001', status: 'completed' }, 201);
  if (path === '/contributions/quote' && method === 'POST') return jsonResponse({ trees: 10, tco2: 1, total_price: 150 });
  if (path === '/contributions' && method === 'GET') return paginatedResponse([]);

  // --- Payments ---
  if (path === '/payments/simulate' && method === 'POST') return jsonResponse(MOCK_PAYMENT.status);
  if (path.match(/^\/payments\/([^/]+)\/status$/) && method === 'GET') return jsonResponse(MOCK_PAYMENT.status);
  if (path === '/payments/create-payment-intent' && method === 'POST') return jsonResponse(MOCK_PAYMENT.intent);

  // --- Stripe ---
  if (path === '/producers/stripe/status' && method === 'GET') return jsonResponse({ connected: true, onboarding_complete: true });
  if (path === '/producers/stripe/onboard' && method === 'POST') return jsonResponse({ url: 'https://connect.stripe.com/onboard' });
  if (path === '/producers/stripe/dashboard' && method === 'POST') return jsonResponse({ url: 'https://dashboard.stripe.com' });

  // --- Certificates ---
  if (path.match(/^\/certificates\/validate/) && method === 'GET') return jsonResponse(MOCK_CERTIFICATE_VALIDATION);
  if (path.match(/^\/certificates\/([^/]+)\/download$/) && method === 'GET') return { status: 200, body: new ArrayBuffer(0) };

  // --- Contact ---
  if (path === '/contact' && method === 'POST') return jsonResponse({ message: 'Sent' });

  // --- Locations ---
  if (path === '/locations/states' && method === 'GET') return jsonResponse([{ code: 'SP', name: 'São Paulo' }, { code: 'BA', name: 'Bahia' }, { code: 'PA', name: 'Pará' }]);
  if (path === '/locations/cities' && method === 'GET') return jsonResponse([{ name: 'São Paulo' }, { name: 'Altamira' }, { name: 'Ilhéus' }]);

  // --- Audit ---
  if (path === '/audit-log' && method === 'GET') return paginatedResponse(MOCK_AUDIT_LOG);

  if (path === '/areas/pending' && method === 'GET') {
    const pendingAreas = MOCK_AREAS.map((a) => ({ ...a, status: 'pending_audit' }));
    return paginatedResponse(pendingAreas);
  }

  console.warn(`[Mock] Unhandled route: ${method} ${path}`);
  throw new Error(`Unhandled route: ${method} ${path}`);
}
