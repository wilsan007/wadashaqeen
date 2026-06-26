/**
 * AppLayoutWithSidebar - Layout principal avec Sidebar Notion
 * Pattern: Sidebar desktop + Menu mobile hamburger
 *
 * Fonctionnalités:
 * - Sidebar fixe (desktop)
 * - Menu hamburger (mobile)
 * - Header responsive
 * - Transitions fluides
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
// 🚀 OPTIMISATION BUNDLE - Import depuis barrel export optimisé
import { Menu, X, Building2 } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NotionStyleSidebar } from './NotionStyleSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { NotificationButton } from '@/components/notifications/NotificationButton';
import { RoleIndicator } from '@/components/auth/RoleIndicator';
import { SessionIndicator } from '@/components/SessionIndicator';
import { UserMenu } from '@/components/user/UserMenu';
import { SimpleUserMenu } from '@/components/user/SimpleUserMenu';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useTenant } from '@/contexts/TenantContext';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { useIsMobileLayout } from '@/hooks/use-mobile';
import FuturisticBackground from '@/components/ui/FuturisticBackground';
import { useTranslation } from '@/hooks/useTranslation';

interface AppLayoutWithSidebarProps {
  children: React.ReactNode;
  accessRights: any;
  accessLoading: boolean;
  showWarning: boolean;
  timeLeftFormatted: string;
  signOut: () => Promise<void>;
  isTenantAdmin: boolean;
  user?: any;
}

export const AppLayoutWithSidebar: React.FC<AppLayoutWithSidebarProps> = ({
  children,
  accessRights,
  accessLoading,
  showWarning,
  timeLeftFormatted,
  signOut,
  isTenantAdmin,
  user,
}) => {
  const { isSuperAdmin: checkIsSuperAdmin } = useUserRoles();
  const isSuperAdmin = checkIsSuperAdmin();
  const { currentTenant } = useTenant();
  const tenantName = currentTenant?.name;
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Ref vers le conteneur scrollable principal
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Détection du scroll et du layout mobile pour cacher les éléments UI
  const { isScrollingDown } = useScrollDirection(scrollContainerRef);
  const isMobile = useIsMobileLayout(); // < 1024px pour layout (portrait + paysage)

  // Fermer le menu lors du changement de route
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Empêcher le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <FuturisticBackground />
      {/* Sidebar Desktop - Toujours visible sur large screens */}
      <div className="hidden lg:block">
        <NotionStyleSidebar
          accessRights={accessRights}
          accessLoading={accessLoading}
          isTenantAdmin={isTenantAdmin}
          signOut={signOut}
        />
      </div>

      {/* Menu Mobile Overlay - REDESIGNED */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu de navigation">
          {/* Backdrop cliquable + accessible au clavier */}
          <div
            className="animate-in fade-in absolute inset-0 bg-black/40 backdrop-blur-sm duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
            onKeyDown={e => e.key === 'Escape' && setIsMobileMenuOpen(false)}
            tabIndex={-1}
            aria-hidden="true"
          />

          {/* Sidebar Mobile — token CSS sidebar-background, border cohérente */}
          <div className="animate-in slide-in-from-left absolute inset-y-0 left-0 w-fit overflow-y-auto rounded-r-xl border-r border-sidebar-border bg-sidebar shadow-2xl duration-300">
            <NotionStyleSidebar
              accessRights={accessRights}
              accessLoading={accessLoading}
              isTenantAdmin={isTenantAdmin}
              signOut={signOut}
              onLinkClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div ref={scrollContainerRef} className="flex flex-1 flex-col overflow-y-auto">
        {/* Menu Hamburger Floating - TOUJOURS VISIBLE en mode mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`bg-background/80 border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 fixed top-4 left-4 z-[80] h-11 w-11 rounded-full border shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 lg:hidden`}
          aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Menu Utilisateur Floating - TOUJOURS VISIBLE en mode mobile (à droite) */}
        {user && (
          <div className="fixed top-4 right-4 z-[80] lg:hidden">
            {isSuperAdmin ? (
              <UserMenu
                user={user}
                isSuperAdmin={isSuperAdmin}
                isTenantAdmin={isTenantAdmin}
                tenantName={tenantName}
                onSignOut={signOut}
                className="bg-background/95 border-border hover:bg-accent flex h-10 w-10 items-center justify-center rounded-full border p-0 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110"
              />
            ) : (
              <SimpleUserMenu
                user={user}
                isTenantAdmin={isTenantAdmin}
                tenantName={tenantName}
                onSignOut={signOut}
                className="bg-background/95 border-border hover:bg-accent flex h-10 w-10 items-center justify-center rounded-full border p-0 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110"
              />
            )}
          </div>
        )}

        {/* Header Desktop — épuré avec backdrop-blur premium */}
        <header
          className={cn(
            'sticky top-0 z-30 hidden lg:block',
            'border-b border-border/60',
            'bg-background/80 backdrop-blur-md',
            'supports-[backdrop-filter]:bg-background/70'
          )}
        >
          <div className="flex items-center justify-between px-6 py-3">
            {/* Nom et Logo Entreprise Tenant */}
            <div className="flex items-center gap-3">
              {currentTenant?.logo_url ? (
                <div className="flex h-8 w-auto max-w-[10rem] min-w-[2rem] items-center justify-center overflow-hidden rounded-md border border-border/50 bg-card px-1 shadow-sm">
                  <img
                    src={currentTenant.logo_url}
                    alt={`Logo ${tenantName}`}
                    className="h-full w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/20 bg-primary/5">
                  <Building2 className="h-4 w-4 text-primary/70" />
                </div>
              )}

              {/* Nom de l'entreprise — texte direct, plus lisible qu'un gradient */}
              <h1 className="text-base font-semibold tracking-tight text-foreground">
                {tenantName || 'Mon Entreprise'}
              </h1>
            </div>

            {/* Actions Desktop */}
            <div className="flex items-center gap-1.5">
              {showWarning && (
                <div className="flex items-center gap-1.5 rounded-md bg-warning/15 px-2.5 py-1 text-sm font-medium text-amber-800 dark:bg-warning/10 dark:text-amber-300">
                  <span aria-hidden="true">⏰</span>
                  {timeLeftFormatted}
                </div>
              )}

              <NotificationButton />
              <RoleIndicator />
              <SessionIndicator />
              <LanguageToggle />
              <ThemeToggle />
              {user &&
                (isSuperAdmin ? (
                  <UserMenu
                    user={user}
                    isSuperAdmin={isSuperAdmin}
                    isTenantAdmin={isTenantAdmin}
                    tenantName={tenantName}
                    onSignOut={signOut}
                  />
                ) : (
                  <SimpleUserMenu
                    user={user}
                    isTenantAdmin={isTenantAdmin}
                    tenantName={tenantName}
                    onSignOut={signOut}
                  />
                ))}
            </div>
          </div>
        </header>

        {/* Page Content with Scroll - SANS ESPACE EN HAUT */}
        {/* Pas de overflow-y-auto ici : le scroll unique est géré par scrollContainerRef ci-dessus */}
        <main id="main-content" className="bg-muted/30 flex-1">
          <div className="flex min-h-full w-full flex-col">
            <div className="flex-1">{children}</div>
            <footer className="text-muted-foreground py-6 text-center text-xs">
              <div className="flex justify-center gap-4">
                <a
                  href="/privacy-policy"
                  className="hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
                >
                  {t('footer.privacyPolicy')}
                </a>
                <a
                  href="/terms-of-use"
                  className="hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
                >
                  {t('footer.termsOfUse')}
                </a>
              </div>
              <p className="mt-2">
                © {new Date().getFullYear()} Wadashaqayn. {t('footer.allRightsReserved')}
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};