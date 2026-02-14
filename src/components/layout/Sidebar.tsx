import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { LanguageSelector } from '@/components/LanguageSelector';
import {
  Home, Calculator, History, MapPin, User, Users, FileCheck, Shield, LogOut, LogIn, TreePine, Award, X, Leaf,
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, hasRole, logout, session } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  const isAnalystOrAdmin = hasRole('analyst') || hasRole('administrator');

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors',
      isActive ? 'bg-primary text-white' : 'text-text-primary hover:bg-primary-50',
    );

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-surface border-r border-gray-200 flex flex-col transition-transform duration-200',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg text-primary">ClimaBalance</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-text-secondary hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <NavLink to="/" end className={linkClass} onClick={onClose}>
            <Home className="h-4 w-4" /> {t('nav.home')}
          </NavLink>
          <NavLink to="/map" className={linkClass} onClick={onClose}>
            <MapPin className="h-4 w-4" /> {t('nav.map')}
          </NavLink>

          {isAuthenticated && (
            <>
              <div className="pt-3 pb-1 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                {t('nav.impact')}
              </div>
              <NavLink to="/footprint/calculator" className={linkClass} onClick={onClose}>
                <Calculator className="h-4 w-4" /> {t('nav.calculator')}
              </NavLink>
              <NavLink to="/footprint/history" className={linkClass} onClick={onClose}>
                <History className="h-4 w-4" /> {t('nav.history')}
              </NavLink>

              {(hasRole('producer') || isAdmin) && (
                <>
                  <div className="pt-3 pb-1 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {t('nav.areas')}
                  </div>
                  <NavLink to="/areas/available" className={linkClass} onClick={onClose}>
                    <TreePine className="h-4 w-4" /> {t('nav.myAreas')}
                  </NavLink>
                </>
              )}

              <div className="pt-3 pb-1 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                {t('nav.account')}
              </div>
              <NavLink to="/profile" className={linkClass} onClick={onClose}>
                <User className="h-4 w-4" /> {t('nav.profile')}
              </NavLink>
              <NavLink to="/profile/certificates" className={linkClass} onClick={onClose}>
                <Award className="h-4 w-4" /> {t('nav.certificates')}
              </NavLink>

              {isAnalystOrAdmin && (
                <>
                  <div className="pt-3 pb-1 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {t('nav.audit')}
                  </div>
                  <NavLink to="/audit/pending-areas" className={linkClass} onClick={onClose}>
                    <FileCheck className="h-4 w-4" /> {t('nav.pendingAreas')}
                  </NavLink>
                </>
              )}

              {isAdmin && (
                <>
                  <div className="pt-3 pb-1 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {t('nav.admin')}
                  </div>
                  <NavLink to="/admin/users" className={linkClass} onClick={onClose}>
                    <Users className="h-4 w-4" /> {t('nav.users')}
                  </NavLink>
                  <NavLink to="/admin/audit-log" className={linkClass} onClick={onClose}>
                    <Shield className="h-4 w-4" /> {t('nav.auditLog')}
                  </NavLink>
                </>
              )}
            </>
          )}
        </nav>

        <div className="border-t border-gray-100 p-3 space-y-2">
          <LanguageSelector />
          {isAuthenticated ? (
            <div>
              <p className="text-xs text-text-secondary truncate px-2 mb-1">{session?.email}</p>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-error hover:bg-red-50 rounded-lg"
              >
                <LogOut className="h-4 w-4" /> {t('nav.logout')}
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary-50 rounded-lg"
              onClick={onClose}
            >
              <LogIn className="h-4 w-4" /> {t('nav.login')}
            </NavLink>
          )}
        </div>
      </aside>
    </>
  );
}
