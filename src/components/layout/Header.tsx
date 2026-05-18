import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Menu, LogIn, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getUserProfilePath } from '@/lib/public-refs';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { t } = useTranslation();
  const { isAuthenticated, logout, userId, userSlug, hasRestoredSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const profilePath = getUserProfilePath({ id: userId, slug: userSlug });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isOnProfile =
    location.pathname === '/profile'
    || location.pathname === profilePath
    || location.pathname.endsWith('/profile')
    || location.pathname.endsWith('/profile/edit');
  const isOnLogin = location.pathname === '/login';

  return (
    <header className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-gray-200 sticky top-0 z-30">
      {/* Left: hamburger + logo */}
      <button onClick={onMenuClick} className="text-text-primary hover:text-primary p-1 -ml-1">
        <Menu className="h-6 w-6" />
      </button>
      <button onClick={() => navigate('/')} className="flex items-center gap-2">
        <img src="/logo.png" alt={t('app.name')} className="h-7 w-7 max-sm:hidden" />
        <span className="font-semibold text-primary hidden sm:inline">{t('app.name')}</span>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: language + auth actions */}
      <div className="flex items-center gap-2">
        <LanguageSelector />

        {!hasRestoredSession ? (
          <div className="h-9 w-20 rounded-[var(--radius-button)] bg-primary-50/70 animate-pulse" />
        ) : isAuthenticated ? (
          <>
            <button
              onClick={() => navigate(profilePath)}
              disabled={isOnProfile}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-base rounded-[var(--radius-button)] transition-colors',
                isOnProfile
                  ? 'text-text-secondary cursor-default'
                  : 'text-primary hover:bg-primary-50',
              )}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.profile')}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-base text-error hover:bg-red-50 rounded-[var(--radius-button)] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.logout')}</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            disabled={isOnLogin}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-base rounded-[var(--radius-button)] transition-colors',
              isOnLogin
                ? 'text-text-secondary cursor-default'
                : 'text-primary hover:bg-primary-50',
            )}
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">{t('nav.login')}</span>
          </button>
        )}
      </div>
    </header>
  );
}
