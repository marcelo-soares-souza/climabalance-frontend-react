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
  FileCheck,
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

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, hasRole, logout, userId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const calculatorPath = userId
    ? `/users/${userId}/impact/calculations/new`
    : "/footprint/calculator";
  const historyPath = userId ? `/users/${userId}/impact` : "/footprint/history";
  const profilePath = userId ? `/users/${userId}/profile` : "/profile";
  const certificatesPath = userId
    ? `/users/${userId}/certificates`
    : "/profile/certificates";

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

  const isCalculatorActive = userId
    ? pathname === calculatorPath ||
      new RegExp(`^/users/${userId}/impact/calculations/[^/]+/edit$`).test(
        pathname,
      )
    : pathname === "/footprint/calculator" || pathname === "/calculator";
  const isHistoryActive = userId
    ? pathname === historyPath ||
      new RegExp(`^/users/${userId}/impact/calculations/(?!new$)[^/]+$`).test(
        pathname,
      )
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
          {!isAuthenticated && (
            <NavLink
              to="/calculator"
              className={() => linkClassByValue(isCalculatorActive)}
              onClick={onClose}
            >
              <Calculator className="h-4 w-4" /> {t("nav.calculator")}
            </NavLink>
          )}

          {isAuthenticated && (
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
              <NavLink to={profilePath} className={linkClass} onClick={onClose}>
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
              <NavLink to="/privacy" className={linkClass} onClick={onClose}>
                <Lock className="h-4 w-4" /> {t("nav.privacyCenter")}
              </NavLink>
              <NavLink to="/contact" className={linkClass} onClick={onClose}>
                <MessageSquare className="h-4 w-4" /> {t("nav.contact")}
              </NavLink>

              {isAnalystOrAdmin && (
                <>
                  {sectionLabel(t("nav.audit"))}
                  <NavLink
                    to="/audit/pending-areas"
                    className={linkClass}
                    onClick={onClose}
                  >
                    <FileCheck className="h-4 w-4" /> {t("nav.pendingAreas")}
                  </NavLink>
                </>
              )}

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
                    to="/admin/audit-log"
                    className={linkClass}
                    onClick={onClose}
                  >
                    <Shield className="h-4 w-4" /> {t("nav.auditLog")}
                  </NavLink>
                </>
              )}
            </>
          )}
          <NavLink to="/privacy-policy" className={linkClass} onClick={onClose}>
            <FileText className="h-4 w-4" /> {t("nav.privacyPolicy")}
          </NavLink>
          <NavLink to="/terms-of-use" className={linkClass} onClick={onClose}>
            <FileText className="h-4 w-4" /> {t("nav.termsOfUse")}
          </NavLink>
        </nav>

        {/* Bottom: logout in drawer */}
        {isAuthenticated && (
          <div className="border-t border-white/10 p-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-base text-red-300 hover:bg-red-500/20 rounded-[10px] transition-colors"
            >
              <LogOut className="h-4 w-4" /> {t("nav.logout")}
            </button>
          </div>
        )}

        {!isAuthenticated && (
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
