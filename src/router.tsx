import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { UserScopeGuard } from '@/components/UserScopeGuard';

// Auth
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ConfirmEmailPage } from '@/features/auth/ConfirmEmailPage';
import { PasswordResetRequestPage } from '@/features/auth/PasswordResetRequestPage';
import { PasswordResetConfirmPage } from '@/features/auth/PasswordResetConfirmPage';

// Home
import { HomePage } from '@/features/home/HomePage';
import { AboutPage } from '@/features/about/AboutPage';
import { HowToUsePlatformPage } from '@/features/how-to-use/HowToUsePlatformPage';
import { PrivacyPolicyPage } from '@/features/privacy/PrivacyPolicyPage';
import { TermsOfUsePage } from '@/features/privacy/TermsOfUsePage';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';

// Footprint
import { CalculatorPage } from '@/features/footprint/CalculatorPage';
import { HistoryPage } from '@/features/footprint/HistoryPage';
import { CalculationDetailPage } from '@/features/footprint/CalculationDetailPage';
import { EmbedCalculatorPage } from '@/features/footprint/EmbedCalculatorPage';
import { EmbedDemoPage } from '@/features/footprint/EmbedDemoPage';

// Map & Areas
import { MapPage } from '@/features/map/MapPage';
import { AreaDetailPage } from '@/features/map/AreaDetailPage';
import { TreePlantingPage } from '@/features/map/TreePlantingPage';
import { AreaListPage } from '@/features/map/AreaListPage';
import { AvailableAreasPage } from '@/features/map/AvailableAreasPage';
import { AreaFormPage } from '@/features/map/AreaFormPage';
import { PendingAreasPage } from '@/features/map/PendingAreasPage';
import { AreaAuditPage } from '@/features/map/AreaAuditPage';
import { PublicAreasPage } from '@/features/map/PublicAreasPage';

// Compensation
import { CompensationReviewPage } from '@/features/compensation/ReviewPage';
import { CompensationCheckoutPage } from '@/features/compensation/CheckoutPage';
import { CompensationReportPage } from '@/features/compensation/ReportPage';
import { CompensationHistoryPage } from '@/features/compensation/HistoryPage';

// Profile
import { ProfilePage } from '@/features/profile/ProfilePage';
import { ProfileEditPage } from '@/features/profile/ProfileEditPage';
import { CertificatesPage } from '@/features/profile/CertificatesPage';
import { SessionsPage } from '@/features/profile/SessionsPage';

// Admin
import { AdminUsersPage } from '@/features/admin/AdminUsersPage';
import { UserEditPage } from '@/features/admin/UserEditPage';
import { AuditLogPage } from '@/features/admin/AuditLogPage';

// Certificates
import { CertificateValidationPage } from '@/features/certificates/CertificateValidationPage';

// Shared
import { AccessDeniedPage } from '@/features/shared/AccessDeniedPage';

export const router = createBrowserRouter([
  // Embed routes (no shell)
  { path: '/embed/calculator', element: <EmbedCalculatorPage /> },
  { path: '/demo/embed-calculator', element: <EmbedDemoPage /> },

  // Main app routes (with shell)
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/how-to-use', element: <HowToUsePlatformPage /> },
      { path: '/privacy-policy', element: <PrivacyPolicyPage /> },
      { path: '/terms-of-use', element: <TermsOfUsePage /> },

      // Auth routes (inside shell)
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/confirm-email', element: <ConfirmEmailPage /> },
      { path: '/password-reset', element: <PasswordResetRequestPage /> },
      { path: '/password-reset/confirm', element: <PasswordResetConfirmPage /> },
      { path: '/map', element: <MapPage /> },
      { path: '/areas/public', element: <PublicAreasPage /> },
      { path: '/areas', element: <AuthGuard><AreaListPage /></AuthGuard> },
      { path: '/certificates/validate', element: <CertificateValidationPage /> },
      { path: '/access-denied', element: <AccessDeniedPage /> },

      // Protected routes
      {
        path: '/onboarding',
        element: <AuthGuard><OnboardingPage /></AuthGuard>,
      },
      {
        path: '/footprint/calculator',
        element: <AuthGuard><CalculatorPage /></AuthGuard>,
      },
      {
        path: '/footprint/history',
        element: <AuthGuard><HistoryPage /></AuthGuard>,
      },
      {
        path: '/footprint/calculation/:id',
        element: <AuthGuard><CalculationDetailPage /></AuthGuard>,
      },
      {
        path: '/users/:userId/impact',
        element: <AuthGuard><UserScopeGuard><HistoryPage /></UserScopeGuard></AuthGuard>,
      },
      {
        path: '/users/:userId/impact/calculations/new',
        element: <AuthGuard><UserScopeGuard><CalculatorPage /></UserScopeGuard></AuthGuard>,
      },
      {
        path: '/users/:userId/impact/calculations/:id',
        element: <AuthGuard><UserScopeGuard><CalculationDetailPage /></UserScopeGuard></AuthGuard>,
      },
      {
        path: '/users/:userId/impact/calculations/:id/edit',
        element: <AuthGuard><UserScopeGuard><CalculatorPage /></UserScopeGuard></AuthGuard>,
      },
      {
        path: '/areas/available',
        element: <AuthGuard><AvailableAreasPage /></AuthGuard>,
      },
      {
        path: '/areas/create',
        element: <AuthGuard roles={['producer', 'administrator']}><AreaFormPage /></AuthGuard>,
      },
      {
        path: '/areas/edit/:areaId',
        element: <AuthGuard roles={['producer', 'administrator']}><AreaFormPage /></AuthGuard>,
      },
      {
        path: '/compensation/review',
        element: <AuthGuard><CompensationReviewPage /></AuthGuard>,
      },
      {
        path: '/compensation/checkout',
        element: <AuthGuard><CompensationCheckoutPage /></AuthGuard>,
      },
      {
        path: '/compensation/report',
        element: <AuthGuard><CompensationReportPage /></AuthGuard>,
      },
      {
        path: '/profile/compensations',
        element: <AuthGuard><CompensationHistoryPage /></AuthGuard>,
      },
      {
        path: '/profile/contributions',
        element: <AuthGuard><CompensationHistoryPage /></AuthGuard>,
      },
      {
        path: '/profile',
        element: <AuthGuard><ProfilePage /></AuthGuard>,
      },
      {
        path: '/users/:userId/profile',
        element: <ProfilePage />,
      },
      {
        path: '/profile/edit',
        element: <AuthGuard><ProfileEditPage /></AuthGuard>,
      },
      {
        path: '/users/:userId/profile/edit',
        element: <AuthGuard><UserScopeGuard><ProfileEditPage /></UserScopeGuard></AuthGuard>,
      },
      {
        path: '/profile/certificates',
        element: <AuthGuard><CertificatesPage /></AuthGuard>,
      },
      {
        path: '/users/:userId/certificates',
        element: <AuthGuard><UserScopeGuard><CertificatesPage /></UserScopeGuard></AuthGuard>,
      },
      {
        path: '/profile/sessions',
        element: <AuthGuard><SessionsPage /></AuthGuard>,
      },
      {
        path: '/users/:userId/sessions',
        element: <AuthGuard><UserScopeGuard><SessionsPage /></UserScopeGuard></AuthGuard>,
      },
      { path: '/areas/:areaId/plant-trees', element: <AuthGuard roles={['producer', 'administrator']}><TreePlantingPage /></AuthGuard> },
      { path: '/areas/:areaId', element: <AreaDetailPage /> },

      // Analyst/Admin routes
      {
        path: '/audit/pending-areas',
        element: <AuthGuard roles={['analyst', 'administrator']}><PendingAreasPage /></AuthGuard>,
      },
      {
        path: '/audit/area/:areaId',
        element: <AuthGuard roles={['analyst', 'administrator']}><AreaAuditPage /></AuthGuard>,
      },

      // Admin routes
      {
        path: '/admin/users',
        element: <AuthGuard roles={['administrator']}><AdminUsersPage /></AuthGuard>,
      },
      {
        path: '/admin/users/edit/:userId',
        element: <AuthGuard roles={['administrator']}><UserEditPage /></AuthGuard>,
      },
      {
        path: '/admin/audit-log',
        element: <AuthGuard roles={['administrator']}><AuditLogPage /></AuthGuard>,
      },

      // Catch-all
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
