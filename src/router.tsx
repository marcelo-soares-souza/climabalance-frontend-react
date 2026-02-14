import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/AuthGuard';

// Auth
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ConfirmEmailPage } from '@/features/auth/ConfirmEmailPage';
import { PasswordResetRequestPage } from '@/features/auth/PasswordResetRequestPage';
import { PasswordResetConfirmPage } from '@/features/auth/PasswordResetConfirmPage';

// Home
import { HomePage } from '@/features/home/HomePage';
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
import { AreaListPage } from '@/features/map/AreaListPage';
import { AvailableAreasPage } from '@/features/map/AvailableAreasPage';
import { AreaFormPage } from '@/features/map/AreaFormPage';
import { PendingAreasPage } from '@/features/map/PendingAreasPage';
import { AreaAuditPage } from '@/features/map/AreaAuditPage';

// Compensation
import { CompensationReviewPage } from '@/features/compensation/ReviewPage';
import { CompensationCheckoutPage } from '@/features/compensation/CheckoutPage';

// Profile
import { ProfilePage } from '@/features/profile/ProfilePage';
import { ProfileEditPage } from '@/features/profile/ProfileEditPage';
import { CertificatesPage } from '@/features/profile/CertificatesPage';

// Admin
import { AdminUsersPage } from '@/features/admin/AdminUsersPage';
import { UserEditPage } from '@/features/admin/UserEditPage';
import { AuditLogPage } from '@/features/admin/AuditLogPage';

// Shared
import { AccessDeniedPage } from '@/features/shared/AccessDeniedPage';

export const router = createBrowserRouter([
  // Auth routes (no shell)
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/confirm-email', element: <ConfirmEmailPage /> },
  { path: '/password-reset', element: <PasswordResetRequestPage /> },
  { path: '/password-reset/confirm', element: <PasswordResetConfirmPage /> },

  // Embed routes (no shell)
  { path: '/embed/calculator', element: <EmbedCalculatorPage /> },
  { path: '/demo/embed-calculator', element: <EmbedDemoPage /> },

  // Main app routes (with shell)
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/map', element: <MapPage /> },
      { path: '/areas/:areaId', element: <AreaDetailPage /> },
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
        path: '/profile',
        element: <AuthGuard><ProfilePage /></AuthGuard>,
      },
      {
        path: '/profile/edit',
        element: <AuthGuard><ProfileEditPage /></AuthGuard>,
      },
      {
        path: '/profile/certificates',
        element: <AuthGuard><CertificatesPage /></AuthGuard>,
      },

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
