import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import {
  Home,
  Calculator,
  History,
  MapPin,
  User,
  Users,
  CheckCircle,
  Clock,
  Shield,
  LogOut,
  LogIn,
  TreePine,
  Award,
  ShieldCheck,
  FileText,
  Info,
  Waypoints,
  X,
  Lock,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  getUserCertificatesPath,
  getUserImpactPath,
  getUserNewCalculationPath,
  getUserProfilePath,
  matchesPublicRef,
} from "@/lib/public-refs";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const {
    isAuthenticated,
    isAdmin,
    hasRole,
    logout,
    userId,
    userSlug,
    hasRestoredSession,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const currentUser = { id: userId, slug: userSlug };
  const calculatorPath = getUserNewCalculationPath(currentUser);
  const historyPath = getUserImpactPath(currentUser);
  const profilePath = getUserProfilePath(currentUser);
  const certificatesPath = getUserCertificatesPath(currentUser);

  const handleLogout = () => {
    logout();
    navigate("/login");
    onClose();
  };

  const isAnalystOrAdmin = hasRole("analyst") || hasRole("administrator");
  const canManageAreas = hasRole("producer") || isAdmin;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 px-4 py-2.5 rounded-[10px] text-base transition-colors",
      isActive
        ? "bg-white/10 text-white font-medium"
        : "text-white/70 hover:bg-sidebar-hover hover:text-white",
    );

  const linkClassByValue = (isActive: boolean) =>
    cn(
      "flex items-center gap-3 px-4 py-2.5 rounded-[10px] text-base transition-colors",
      isActive
        ? "bg-white/10 text-white font-medium"
        : "text-white/70 hover:bg-sidebar-hover hover:text-white",
    );

  const userRouteRef = pathname.match(/^\/users\/([^/]+)/)?.[1] ?? null;
  const isCurrentUserRoute = matchesPublicRef(userRouteRef, currentUser);
  const isCalculatorActive = userId
    ? pathname === calculatorPath ||
      (isCurrentUserRoute &&
        /^\/users\/[^/]+\/impact\/calculations\/[^/]+\/edit$/.test(pathname))
    : pathname === "/footprint/calculator" || pathname === "/calculator";
  const isHistoryActive = userId
    ? pathname === historyPath ||
      (isCurrentUserRoute &&
        /^\/users\/[^/]+\/impact\/calculations\/(?!new$)[^/]+$/.test(pathname))
    : pathname === "/footprint/history" ||
      /^\/footprint\/calculation\/[^/]+$/.test(pathname);
  const isPublicAreasActive = pathname === "/areas/public";
  const isAreaDetailActive =
    /^\/areas\/[^/]+$/.test(pathname) &&
    pathname !== "/areas/available" &&
    pathname !== "/areas/public" &&
    pathname !== "/areas/create" &&
    !pathname.startsWith("/areas/edit/");
  const isMyAreasActive =
    pathname === "/areas" ||
    pathname === "/areas/create" ||
    /^\/areas\/edit\/[^/]+$/.test(pathname) ||
    isAreaDetailActive;

  const sectionLabel = (text: string) => (
    <div className="pt-4 pb-1 px-4 text-sm font-semibold text-white/40 uppercase tracking-wider">
      {text}
    </div>
  );

  const socialLinks = [
    {
      title: "X (Twitter)",
      href: "https://x.com/ClimaBalanceOrg",
      viewBox: "0 0 24 24",
      path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    },
    {
      title: "LinkedIn",
      href: "https://www.linkedin.com/company/climabalanceorg",
      viewBox: "0 0 24 24",
      path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
    },
    {
      title: "Bluesky",
      href: "https://bsky.app/profile/climabalance.bsky.social",
      viewBox: "0 0 576 512",
      path: "M407.8 294.7c-3.3-.4-6.7-.8-10-1.3 3.4.4 6.7.9 10 1.3zM288 227.1C261.9 176.4 190.9 81.9 124.9 35.3 61.6-9.4 37.5 1.7 21.6 10.5 3.3 20.6 0 52.5 0 71.5c0 19.1 10.5 154.8 17.4 177.6 22.3 74.7 102.6 99.4 175.1 91.9-87.8 13.1-165 45.9-63.5 158.2 111.8 115.3 153.2-24.4 159-95.7 5.8 71.3 47.2 211 159 95.7 101.5-112.3 24.3-145.1-63.5-158.2 72.5 7.5 152.8-17.3 175.1-91.9 6.9-22.8 17.4-158.5 17.4-177.6 0-19-3.3-50.9-21.6-61C538.5 1.7 514.4-9.4 451.1 35.3 385.1 81.9 314.1 176.4 288 227.1z",
    },
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-sidebar flex flex-col transition-transform duration-250 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt={t("app.name")}
              className="h-8 w-8 brightness-0 invert"
            />
            <div>
              <span className="font-semibold text-lg text-white">
                {t("app.name")}
              </span>
              {/* <p className="text-sm text-white/50">
                {t("home.welcome.description")}
              </p> */}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <NavLink to="/" end className={linkClass} onClick={onClose}>
            <Home className="h-4 w-4" /> {t("nav.home")}
          </NavLink>
          <NavLink to="/about" className={linkClass} onClick={onClose}>
            <Info className="h-4 w-4" /> {t("nav.about")}
          </NavLink>
          <NavLink to="/how-to-use" className={linkClass} onClick={onClose}>
            <Waypoints className="h-4 w-4" /> {t("nav.howToUse")}
          </NavLink>
          <NavLink to="/map" className={linkClass} onClick={onClose}>
            <MapPin className="h-4 w-4" /> {t("nav.map")}
          </NavLink>
          <NavLink
            to="/areas/public"
            className={() => linkClassByValue(isPublicAreasActive)}
            onClick={onClose}
          >
            <TreePine className="h-4 w-4" /> {t("nav.publicAreas")}
          </NavLink>
          <NavLink to="/users" end className={linkClass} onClick={onClose}>
            <Users className="h-4 w-4" /> {t("nav.directory")}
          </NavLink>
          {hasRestoredSession && !isAuthenticated && (
            <NavLink
              to="/calculator"
              className={() => linkClassByValue(isCalculatorActive)}
              onClick={onClose}
            >
              <Calculator className="h-4 w-4" /> {t("nav.calculator")}
            </NavLink>
          )}

          {hasRestoredSession && isAuthenticated && (
            <>
              {sectionLabel(t("nav.impact"))}
              <NavLink
                to={calculatorPath}
                className={() => linkClassByValue(isCalculatorActive)}
                onClick={onClose}
              >
                <Calculator className="h-4 w-4" /> {t("nav.calculator")}
              </NavLink>
              <NavLink
                to={historyPath}
                className={() => linkClassByValue(isHistoryActive)}
                onClick={onClose}
              >
                <History className="h-4 w-4" /> {t("nav.history")}
              </NavLink>

              {canManageAreas && (
                <>
                  {sectionLabel(t("nav.areas"))}
                  <NavLink
                    to="/areas"
                    className={() => linkClassByValue(isMyAreasActive)}
                    onClick={onClose}
                  >
                    <TreePine className="h-4 w-4" /> {t("nav.myAreas")}
                  </NavLink>
                </>
              )}

              {sectionLabel(t("nav.account"))}
              <NavLink
                to={profilePath}
                end
                className={linkClass}
                onClick={onClose}
              >
                <User className="h-4 w-4" /> {t("nav.profile")}
              </NavLink>
              <NavLink
                to="/profile/contributions"
                className={linkClass}
                onClick={onClose}
              >
                <TreePine className="h-4 w-4" /> {t("nav.compensations")}
              </NavLink>
              <NavLink
                to={certificatesPath}
                className={linkClass}
                onClick={onClose}
              >
                <Award className="h-4 w-4" /> {t("nav.certificates")}
              </NavLink>
              <NavLink
                to="/certificates/validate"
                className={linkClass}
                onClick={onClose}
              >
                <ShieldCheck className="h-4 w-4" />{" "}
                {t("nav.validateCertificate")}
              </NavLink>
              <NavLink
                to="/privacy"
                end
                className={linkClass}
                onClick={onClose}
              >
                <Lock className="h-4 w-4" /> {t("nav.privacyCenter")}
              </NavLink>
              <NavLink to="/contact" className={linkClass} onClick={onClose}>
                <MessageSquare className="h-4 w-4" /> {t("nav.contact")}
              </NavLink>

              {isAdmin && (
                <>
                  {sectionLabel(t("nav.admin"))}
                  <NavLink
                    to="/admin/users"
                    className={linkClass}
                    onClick={onClose}
                  >
                    <Users className="h-4 w-4" /> {t("nav.users")}
                  </NavLink>
                  <NavLink
                    to="/audit/pending-areas"
                    className={linkClass}
                    onClick={onClose}
                  >
                    <Clock className="h-4 w-4" /> {t("nav.pendingAreas")}
                  </NavLink>
                  <NavLink
                    to="/admin/approved-areas"
                    className={linkClass}
                    onClick={onClose}
                  >
                    <CheckCircle className="h-4 w-4" /> {t("nav.approvedAreas")}
                  </NavLink>
                </>
              )}

              {isAnalystOrAdmin && (
                <>
                  {sectionLabel(t("nav.audit"))}
                  {isAdmin && (
                    <NavLink
                      to="/admin/audit-log"
                      className={linkClass}
                      onClick={onClose}
                    >
                      <Shield className="h-4 w-4" /> {t("nav.auditLog")}
                    </NavLink>
                  )}
                </>
              )}
            </>
          )}
          {sectionLabel(t("nav.legal"))}
          <NavLink to="/privacy-policy" className={linkClass} onClick={onClose}>
            <Shield className="h-4 w-4" /> {t("nav.privacyPolicy")}
          </NavLink>
          <NavLink to="/terms-of-use" className={linkClass} onClick={onClose}>
            <FileText className="h-4 w-4" /> {t("nav.termsOfUse")}
          </NavLink>

          {sectionLabel(t("nav.social"))}
          <div className="flex flex-wrap gap-2 px-4 py-2">
            {socialLinks.map(({ title, href, path, viewBox }) => (
              <a
                key={title}
                href={href}
                target="_blank"
                rel="noreferrer"
                title={title}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg
                  viewBox={viewBox}
                  className="h-4 w-4"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d={path} />
                </svg>
              </a>
            ))}
          </div>
        </nav>

        {/* Bottom: logout in drawer */}
        {hasRestoredSession && isAuthenticated && (
          <div className="border-t border-white/10 p-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-base text-red-300 hover:bg-red-500/20 rounded-[10px] transition-colors"
            >
              <LogOut className="h-4 w-4" /> {t("nav.logout")}
            </button>
          </div>
        )}

        {hasRestoredSession && !isAuthenticated && (
          <div className="border-t border-white/10 p-3">
            <NavLink
              to="/login"
              className="flex items-center gap-2 px-4 py-2.5 text-base text-white/70 hover:bg-sidebar-hover hover:text-white rounded-[10px] transition-colors"
              onClick={onClose}
            >
              <LogIn className="h-4 w-4" /> {t("nav.login")}
            </NavLink>
          </div>
        )}
      </aside>
    </>
  );
}
