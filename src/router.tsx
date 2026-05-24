import { lazy, type ComponentType } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { UserScopeGuard } from "@/components/UserScopeGuard";

// Auth
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { ConfirmEmailPage } from "@/features/auth/ConfirmEmailPage";
import { PasswordResetRequestPage } from "@/features/auth/PasswordResetRequestPage";
import { PasswordResetConfirmPage } from "@/features/auth/PasswordResetConfirmPage";

// Home
import { HomePage } from "@/features/home/HomePage";
import { AboutPage } from "@/features/about/AboutPage";
import { PrivacyPolicyPage } from "@/features/privacy/PrivacyPolicyPage";
import { TermsOfUsePage } from "@/features/privacy/TermsOfUsePage";
import { PrivacyPage } from "@/features/privacy/PrivacyPage";
import { OnboardingPage } from "@/features/onboarding/OnboardingPage";

// Footprint
import { EmbedCalculatorPage } from "@/features/footprint/EmbedCalculatorPage";
import { EmbedDemoPage } from "@/features/footprint/EmbedDemoPage";

// Map & Areas
import { PublicAreasPage } from "@/features/map/PublicAreasPage";

// Compensation
import { GuestCalculatorPage } from "@/features/footprint/GuestCalculatorPage";
import { TripCalculatorPage } from "@/features/footprint/TripCalculatorPage";

// Profile
import { UserEditPage } from "@/features/admin/UserEditPage";

// Certificates
import { CertificateValidationPage } from "@/features/certificates/CertificateValidationPage";

// Contact
import { ContactPage } from "@/features/contact/ContactPage";
import { UserDirectoryPage } from "@/features/directory/UserDirectoryPage";

// Shared
import { AccessDeniedPage } from "@/features/shared/AccessDeniedPage";

function lazyNamedPage<TModule, TKey extends keyof TModule & string>(
  loader: () => Promise<TModule>,
  key: TKey,
) {
  return lazy(async () => {
    const module = await loader();
    return { default: module[key] as ComponentType };
  });
}

const HowToUsePlatformPage = lazyNamedPage(
  () => import("@/features/how-to-use/HowToUsePlatformPage"),
  "HowToUsePlatformPage",
);
const CalculatorPage = lazyNamedPage(
  () => import("@/features/footprint/CalculatorPage"),
  "CalculatorPage",
);
const HistoryPage = lazyNamedPage(
  () => import("@/features/footprint/HistoryPage"),
  "HistoryPage",
);
const CalculationDetailPage = lazyNamedPage(
  () => import("@/features/footprint/CalculationDetailPage"),
  "CalculationDetailPage",
);
const MapPage = lazyNamedPage(
  () => import("@/features/map/MapPage"),
  "MapPage",
);
const AreaDetailPage = lazyNamedPage(
  () => import("@/features/map/AreaDetailPage"),
  "AreaDetailPage",
);
const TreePlantingPage = lazyNamedPage(
  () => import("@/features/map/TreePlantingPage"),
  "TreePlantingPage",
);
const AreaListPage = lazyNamedPage(
  () => import("@/features/map/AreaListPage"),
  "AreaListPage",
);
const AvailableAreasPage = lazyNamedPage(
  () => import("@/features/map/AvailableAreasPage"),
  "AvailableAreasPage",
);
const AreaFormPage = lazyNamedPage(
  () => import("@/features/map/AreaFormPage"),
  "AreaFormPage",
);
const PendingAreasPage = lazyNamedPage(
  () => import("@/features/map/PendingAreasPage"),
  "PendingAreasPage",
);
const AreaAuditPage = lazyNamedPage(
  () => import("@/features/map/AreaAuditPage"),
  "AreaAuditPage",
);
const CompensationReviewPage = lazyNamedPage(
  () => import("@/features/compensation/ReviewPage"),
  "CompensationReviewPage",
);
const CompensationCheckoutPage = lazyNamedPage(
  () => import("@/features/compensation/CheckoutPage"),
  "CompensationCheckoutPage",
);
const CompensationReportPage = lazyNamedPage(
  () => import("@/features/compensation/ReportPage"),
  "CompensationReportPage",
);
const CompensationHistoryPage = lazyNamedPage(
  () => import("@/features/compensation/HistoryPage"),
  "CompensationHistoryPage",
);
const PixPaymentPage = lazyNamedPage(
  () => import("@/features/compensation/PixPaymentPage"),
  "PixPaymentPage",
);
const StripeSetupPage = lazyNamedPage(
  () => import("@/features/how-to-use/StripeSetupPage"),
  "StripeSetupPage",
);
const StripePlatformSetupPage = lazyNamedPage(
  () => import("@/features/how-to-use/StripePlatformSetupPage"),
  "StripePlatformSetupPage",
);
const ProfilePage = lazyNamedPage(
  () => import("@/features/profile/ProfilePage"),
  "ProfilePage",
);
const ProfileEditPage = lazyNamedPage(
  () => import("@/features/profile/ProfileEditPage"),
  "ProfileEditPage",
);
const CertificatesPage = lazyNamedPage(
  () => import("@/features/profile/CertificatesPage"),
  "CertificatesPage",
);
const SessionsPage = lazyNamedPage(
  () => import("@/features/profile/SessionsPage"),
  "SessionsPage",
);
const AdminUsersPage = lazyNamedPage(
  () => import("@/features/admin/AdminUsersPage"),
  "AdminUsersPage",
);
const AuditLogPage = lazyNamedPage(
  () => import("@/features/admin/AuditLogPage"),
  "AuditLogPage",
);

export const router = createBrowserRouter([
  // Embed routes (no shell)
  { path: "/embed/calculator", element: <EmbedCalculatorPage /> },
  { path: "/demo/embed-calculator", element: <EmbedDemoPage /> },

  // Main app routes (with shell)
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/how-to-use", element: <HowToUsePlatformPage /> },
      { path: "/privacy-policy", element: <PrivacyPolicyPage /> },
      {
        path: "/privacy",
        element: (
          <AuthGuard>
            <PrivacyPage />
          </AuthGuard>
        ),
      },
      { path: "/terms-of-use", element: <TermsOfUsePage /> },

      // Auth routes (inside shell)
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/confirm-email", element: <ConfirmEmailPage /> },
      { path: "/password-reset", element: <PasswordResetRequestPage /> },
      {
        path: "/password-reset/confirm",
        element: <PasswordResetConfirmPage />,
      },
      { path: "/map", element: <MapPage /> },
      { path: "/areas/public", element: <PublicAreasPage /> },
      { path: "/calculator", element: <GuestCalculatorPage /> },
      { path: "/calculator/trip", element: <TripCalculatorPage /> },
      {
        path: "/areas",
        element: (
          <AuthGuard>
            <AreaListPage />
          </AuthGuard>
        ),
      },
      {
        path: "/certificates/validate",
        element: <CertificateValidationPage />,
      },
      { path: "/access-denied", element: <AccessDeniedPage /> },

      // Protected routes
      {
        path: "/onboarding",
        element: (
          <AuthGuard>
            <OnboardingPage />
          </AuthGuard>
        ),
      },
      {
        path: "/footprint/calculator",
        element: (
          <AuthGuard>
            <CalculatorPage />
          </AuthGuard>
        ),
      },
      {
        path: "/footprint/history",
        element: (
          <AuthGuard>
            <HistoryPage />
          </AuthGuard>
        ),
      },
      {
        path: "/footprint/calculation/:id",
        element: (
          <AuthGuard>
            <CalculationDetailPage />
          </AuthGuard>
        ),
      },
      {
        path: "/users/:userId/impact",
        element: (
          <AuthGuard>
            <UserScopeGuard>
              <HistoryPage />
            </UserScopeGuard>
          </AuthGuard>
        ),
      },
      {
        path: "/users/:userId/impact/calculations/new",
        element: (
          <AuthGuard>
            <UserScopeGuard>
              <CalculatorPage />
            </UserScopeGuard>
          </AuthGuard>
        ),
      },
      {
        path: "/users/:userId/impact/calculations/:id",
        element: (
          <AuthGuard>
            <UserScopeGuard>
              <CalculationDetailPage />
            </UserScopeGuard>
          </AuthGuard>
        ),
      },
      {
        path: "/users/:userId/impact/calculations/:id/edit",
        element: (
          <AuthGuard>
            <UserScopeGuard>
              <CalculatorPage />
            </UserScopeGuard>
          </AuthGuard>
        ),
      },
      {
        path: "/areas/available",
        element: (
          <AuthGuard>
            <AvailableAreasPage />
          </AuthGuard>
        ),
      },
      {
        path: "/areas/create",
        element: (
          <AuthGuard roles={["producer", "administrator"]}>
            <AreaFormPage />
          </AuthGuard>
        ),
      },
      {
        path: "/areas/edit/:areaId",
        element: (
          <AuthGuard roles={["producer", "administrator"]}>
            <AreaFormPage />
          </AuthGuard>
        ),
      },
      {
        path: "/compensation/review",
        element: (
          <AuthGuard>
            <CompensationReviewPage />
          </AuthGuard>
        ),
      },
      {
        path: "/compensation/checkout",
        element: (
          <AuthGuard>
            <CompensationCheckoutPage />
          </AuthGuard>
        ),
      },
      {
        path: "/compensation/report",
        element: (
          <AuthGuard>
            <CompensationReportPage />
          </AuthGuard>
        ),
      },
      {
        path: "/payment/pix/:paymentId",
        element: (
          <AuthGuard>
            <PixPaymentPage />
          </AuthGuard>
        ),
      },
      {
        path: "/how-to-use/stripe-setup",
        element: (
          <AuthGuard roles={["producer", "administrator"]}>
            <StripeSetupPage />
          </AuthGuard>
        ),
      },
      {
        path: "/how-to-use/stripe-platform-setup",
        element: (
          <AuthGuard roles={["administrator"]}>
            <StripePlatformSetupPage />
          </AuthGuard>
        ),
      },
      {
        path: "/profile/compensations",
        element: (
          <AuthGuard>
            <CompensationHistoryPage />
          </AuthGuard>
        ),
      },
      {
        path: "/profile/contributions",
        element: (
          <AuthGuard>
            <CompensationHistoryPage />
          </AuthGuard>
        ),
      },
      {
        path: "/profile",
        element: (
          <AuthGuard>
            <ProfilePage />
          </AuthGuard>
        ),
      },
      {
        path: "/users",
        element: <UserDirectoryPage />,
      },
      {
        path: "/users/:userId/profile",
        element: <ProfilePage />,
      },
      {
        path: "/profile/edit",
        element: (
          <AuthGuard>
            <ProfileEditPage />
          </AuthGuard>
        ),
      },
      {
        path: "/users/:userId/profile/edit",
        element: (
          <AuthGuard>
            <UserScopeGuard>
              <ProfileEditPage />
            </UserScopeGuard>
          </AuthGuard>
        ),
      },
      {
        path: "/profile/certificates",
        element: (
          <AuthGuard>
            <CertificatesPage />
          </AuthGuard>
        ),
      },
      {
        path: "/users/:userId/certificates",
        element: (
          <AuthGuard>
            <UserScopeGuard>
              <CertificatesPage />
            </UserScopeGuard>
          </AuthGuard>
        ),
      },
      {
        path: "/profile/sessions",
        element: (
          <AuthGuard>
            <SessionsPage />
          </AuthGuard>
        ),
      },
      {
        path: "/users/:userId/sessions",
        element: (
          <AuthGuard>
            <UserScopeGuard>
              <SessionsPage />
            </UserScopeGuard>
          </AuthGuard>
        ),
      },
      {
        path: "/areas/:areaId/plant-trees",
        element: (
          <AuthGuard roles={["producer", "administrator"]}>
            <TreePlantingPage />
          </AuthGuard>
        ),
      },
      { path: "/areas/:areaId", element: <AreaDetailPage /> },

      // Analyst/Admin routes
      {
        path: "/audit/pending-areas",
        element: (
          <AuthGuard roles={["analyst", "administrator"]}>
            <PendingAreasPage />
          </AuthGuard>
        ),
      },
      {
        path: "/audit/area/:areaId",
        element: (
          <AuthGuard roles={["analyst", "administrator"]}>
            <AreaAuditPage />
          </AuthGuard>
        ),
      },

      // Contact
      {
        path: "/contact",
        element: (
          <AuthGuard>
            <ContactPage />
          </AuthGuard>
        ),
      },

      // Admin routes
      {
        path: "/admin/users",
        element: (
          <AuthGuard roles={["administrator"]}>
            <AdminUsersPage />
          </AuthGuard>
        ),
      },
      {
        path: "/admin/users/edit/:userId",
        element: (
          <AuthGuard roles={["administrator"]}>
            <UserEditPage />
          </AuthGuard>
        ),
      },
      {
        path: "/admin/audit-log",
        element: (
          <AuthGuard roles={["administrator"]}>
            <AuditLogPage />
          </AuthGuard>
        ),
      },

      // Catch-all
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
