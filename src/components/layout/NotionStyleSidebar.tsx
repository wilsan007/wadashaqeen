/**
 * NotionStyleSidebar - Navigation Premium SaaS 2025
 * Pattern: Sidebar fixe avec sections collapsibles + rétractable
 *
 * Design:
 * - Fond sidebar via token CSS (sidebar-background) — s'adapte light/dark
 * - Hover states doux avec bg sidebar-accent
 * - Active state pill indigo (primary/10 + text-primary)
 * - Texte muted pour items inactifs, semibold pour actifs
 * - Icônes cohérentes sans arc-en-ciel
 * - Workspace avatar + nom en haut soigné
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useTranslation } from '@/hooks/useTranslation';
// 🚀 OPTIMISATION BUNDLE - Import depuis barrel export optimisé
import {
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Home,
  Inbox,
  MessageSquare,
  CheckSquare,
  MoreHorizontal,
  Star,
  Plus,
  Users,
  FolderKanban,
  Settings,
  Crown,
  Calendar,
  BarChart3,
  Target,
  Hash,
  UserPlus,
  LogOut,
  Bell,
  Sun,
  Moon,
  LayoutDashboard,
  GanttChartSquare,
} from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { LanguageToggle } from '@/components/LanguageToggle';

interface NotionStyleSidebarProps {
  accessRights: any;
  accessLoading: boolean;
  isTenantAdmin: boolean;
  signOut: () => Promise<void>;
  onLinkClick?: () => void; // Callback optionnel pour fermer le menu mobile
}

export const NotionStyleSidebar: React.FC<NotionStyleSidebarProps> = ({
  accessRights,
  accessLoading,
  isTenantAdmin,
  onLinkClick,
  signOut,
}) => {
  const location = useLocation();
  const { currentTenant } = useTenant();
  const { t } = useTranslation();

  // État de rétractation avec persistance localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  const [isHomeExpanded, setIsHomeExpanded] = useState(true);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(true);
  const [isSpacesExpanded, setIsSpacesExpanded] = useState(true);
  const [favorites, setFavorites] = useState<string[]>(['/tasks', '/projects']);

  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isCollapsed.toString());
  }, [isCollapsed]);

  const isActivePath = (path: string) => location.pathname === path;

  const toggleFavorite = (path: string) => {
    setFavorites(prev => (prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]));
  };

  // Section Accueil
  const homeItems = [
    { to: '/accueil', label: t('nav.dashboard'), icon: Home, show: true },
    {
      to: '/dashboard',
      label: t('nav.workViews'),
      icon: GanttChartSquare,
      show: accessLoading || accessRights.canAccessTasks,
    },
    {
      to: '/inbox',
      label: t('nav.inbox'),
      icon: Inbox,
      show: !accessLoading && accessRights.canAccessSuperAdmin,
      badge: 3,
    },
    {
      to: '/tasks',
      label: t('nav.myTasks'),
      icon: CheckSquare,
      show: accessLoading || accessRights.canAccessTasks,
    },
    { to: '/calendar', label: t('nav.calendar'), icon: Calendar, show: true },
  ];

  // Section Espaces (Projets/Modules)
  const spaceItems = [
    {
      to: '/projects',
      label: t('nav.projects'),
      icon: FolderKanban,
      show: accessLoading || accessRights.canAccessProjects,
      color: 'text-sidebar-primary',
    },
    {
      to: '/hr',
      label: t('nav.hr'),
      icon: Users,
      show: accessLoading || accessRights.canAccessHR,
      color: 'text-sidebar-primary',
    },
    {
      to: '/operations',
      label: t('nav.operations'),
      icon: Target,
      show: accessLoading || accessRights.canAccessTasks,
      color: 'text-sidebar-primary',
    },
    {
      to: '/analytics',
      label: t('nav.analytics'),
      icon: BarChart3,
      show: !accessLoading && (accessRights.canViewReports || accessRights.canAccessSuperAdmin),
      color: 'text-sidebar-primary',
    },
  ];

  // Section Plus (Autres)
  const moreItems = [
    {
      to: '/settings',
      label: t('nav.settings'),
      icon: Settings,
      show: !accessLoading && accessRights.canAccessSuperAdmin,
    },
    {
      to: '/super-admin',
      label: t('nav.superAdmin'),
      icon: Crown,
      show: !accessLoading && accessRights.canAccessSuperAdmin,
    },
  ];

  // Classes réutilisables
  const navItemBase = cn(
    'group relative flex items-center gap-2.5 rounded-lg text-sm transition-all duration-150'
  );
  const navItemActive =
    'bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm';
  const navItemInactive =
    'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground font-normal';

  return (
    <aside
      aria-label={t('sidebar.home')}
      className={cn(
        'sticky top-0 flex h-[100dvh] flex-col transition-all duration-300 ease-in-out',
        'border-r border-sidebar-border bg-sidebar text-sidebar-foreground',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header — Workspace switcher */}
      <div
        className={cn(
          'flex items-center border-b border-sidebar-border',
          isCollapsed ? 'justify-center p-3' : 'justify-between p-4'
        )}
      >
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2.5 overflow-hidden"
          onClick={onLinkClick}
        >
          {currentTenant?.logo_url ? (
            <img
              src={currentTenant.logo_url}
              alt={currentTenant.name}
              className="h-7 w-7 flex-shrink-0 rounded-md object-contain ring-1 ring-sidebar-border"
            />
          ) : (
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-sidebar-primary shadow-sm">
              <span className="text-xs font-bold text-sidebar-primary-foreground">
                {currentTenant?.name ? currentTenant.name.charAt(0).toUpperCase() : 'W'}
              </span>
            </div>
          )}
          {!isCollapsed && (
            <span className="truncate text-sm font-semibold text-sidebar-foreground tracking-tight">
              {currentTenant?.name || 'Wadashaqayn'}
            </span>
          )}
        </Link>

        {/* Bouton Toggle */}
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (onLinkClick) {
                onLinkClick();
              } else {
                setIsCollapsed(!isCollapsed);
              }
            }}
            className="h-7 w-7 flex-shrink-0 rounded-md p-0 text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label={
              onLinkClick
                ? t('sidebar.closeMenu')
                : isCollapsed
                  ? t('sidebar.expandMenu')
                  : t('sidebar.collapseMenu')
            }
          >
            <ChevronsLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        )}
        {isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="h-7 w-7 rounded-md p-0 text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label={t('sidebar.expandMenu')}
          >
            <ChevronsRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Bouton Créer (CTA Principal) */}
      <div className={cn('p-3', isCollapsed && 'px-2')}>
        <Button
          className={cn(
            'w-full gap-2 bg-sidebar-primary text-sidebar-primary-foreground shadow-sm',
            'hover:opacity-90 active:opacity-80 transition-opacity',
            isCollapsed ? 'justify-center px-0' : 'justify-start text-sm font-medium'
          )}
          size="sm"
          aria-label={isCollapsed ? t('sidebar.createItem') : undefined}
        >
          <Plus className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          {!isCollapsed && t('sidebar.create')}
        </Button>
      </div>

      <ScrollArea className={cn('flex-1', isCollapsed ? 'px-1.5' : 'px-2.5')}>
        {/* Section ACCUEIL */}
        <div className="mb-5">
          {!isCollapsed && (
            <button
              onClick={() => setIsHomeExpanded(!isHomeExpanded)}
              className="mb-1 flex w-full items-center gap-1.5 px-1.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 transition-colors hover:text-sidebar-foreground/70"
            >
              {isHomeExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              {t('sidebar.home')}
            </button>
          )}

          {(isHomeExpanded || isCollapsed) && (
            <div className={cn('space-y-0.5', isCollapsed && 'mt-1')}>
              {homeItems.map(item =>
                item.show ? (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onLinkClick}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      navItemBase,
                      isCollapsed ? 'justify-center px-1.5 py-2' : 'px-2 py-1.5',
                      isActivePath(item.to) ? navItemActive : navItemInactive
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isActivePath(item.to) ? 'text-sidebar-primary' : 'text-sidebar-foreground/50'
                      )}
                    />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto rounded-full bg-sidebar-primary px-1.5 py-0.5 text-[10px] font-semibold text-sidebar-primary-foreground">
                            {item.badge}
                          </span>
                        )}
                        <button
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(item.to);
                          }}
                          aria-label={
                            favorites.includes(item.to)
                              ? t('sidebar.removeFromFavorites').replace('%s', item.label)
                              : t('sidebar.addToFavorites').replace('%s', item.label)
                          }
                          aria-pressed={favorites.includes(item.to)}
                          className={cn(
                            'opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100',
                            favorites.includes(item.to) && 'opacity-100'
                          )}
                        >
                          <Star
                            className={cn(
                              'h-3.5 w-3.5',
                              favorites.includes(item.to)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-sidebar-foreground/30'
                            )}
                            aria-hidden="true"
                          />
                        </button>
                      </>
                    )}
                  </Link>
                ) : null
              )}
            </div>
          )}
        </div>

        {/* Section FAVORIS */}
        {favorites.length > 0 && !isCollapsed && (
          <div className="mb-5">
            <button
              onClick={() => setIsFavoritesExpanded(!isFavoritesExpanded)}
              className="mb-1 flex w-full items-center gap-1.5 px-1.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 transition-colors hover:text-sidebar-foreground/70"
            >
              {isFavoritesExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              {t('sidebar.favorites')}
            </button>

            {isFavoritesExpanded && (
              <div className="space-y-0.5">
                {[...homeItems, ...spaceItems].map(item =>
                  item.show && favorites.includes(item.to) ? (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onLinkClick}
                      className={cn(
                        navItemBase,
                        'px-2 py-1.5',
                        isActivePath(item.to) ? navItemActive : navItemInactive
                      )}
                    >
                      <Star className="h-3.5 w-3.5 flex-shrink-0 fill-amber-400 text-amber-400" />
                      <span className="flex-1 truncate">{item.label}</span>
                    </Link>
                  ) : null
                )}
              </div>
            )}
          </div>
        )}

        {!isCollapsed && (
          <Separator className="my-3 bg-sidebar-border/60" />
        )}

        {/* Section ESPACES */}
        <div className="mb-5">
          {!isCollapsed && (
            <div className="mb-1 flex items-center justify-between px-1.5 py-1">
              <button
                onClick={() => setIsSpacesExpanded(!isSpacesExpanded)}
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 transition-colors hover:text-sidebar-foreground/70"
              >
                {isSpacesExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                {t('sidebar.spaces')}
              </button>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 rounded p-0 text-sidebar-foreground/30 hover:bg-sidebar-accent hover:text-sidebar-foreground/70"
                aria-label={t('sidebar.addSpace')}
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
              </Button>
            </div>
          )}

          {(isSpacesExpanded || isCollapsed) && (
            <div className={cn('space-y-0.5', isCollapsed && 'mt-1')}>
              {spaceItems.map(item =>
                item.show ? (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onLinkClick}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      navItemBase,
                      isCollapsed ? 'justify-center px-1.5 py-2' : 'px-2 py-1.5',
                      isActivePath(item.to) ? navItemActive : navItemInactive
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isActivePath(item.to)
                          ? 'text-sidebar-primary'
                          : 'text-sidebar-foreground/50'
                      )}
                    />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        <button
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(item.to);
                          }}
                          aria-label={
                            favorites.includes(item.to)
                              ? t('sidebar.removeFromFavorites').replace('%s', item.label)
                              : t('sidebar.addToFavorites').replace('%s', item.label)
                          }
                          aria-pressed={favorites.includes(item.to)}
                          className={cn(
                            'opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100',
                            favorites.includes(item.to) && 'opacity-100'
                          )}
                        >
                          <Star
                            className={cn(
                              'h-3.5 w-3.5',
                              favorites.includes(item.to)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-sidebar-foreground/30'
                            )}
                            aria-hidden="true"
                          />
                        </button>
                      </>
                    )}
                  </Link>
                ) : null
              )}
            </div>
          )}
        </div>

        {!isCollapsed && (
          <Separator className="my-3 bg-sidebar-border/60" />
        )}

        {/* Section PLUS */}
        <div className="mb-4">
          {!isCollapsed && (
            <div className="mb-1 flex items-center gap-1.5 px-1.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              <MoreHorizontal className="h-3 w-3" />
              {t('sidebar.more')}
            </div>
          )}

          <div className={cn('space-y-0.5', isCollapsed && 'mt-1')}>
            {moreItems.map(item =>
              item.show ? (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onLinkClick}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    navItemBase,
                    isCollapsed ? 'justify-center px-1.5 py-2' : 'px-2 py-1.5',
                    isActivePath(item.to) ? navItemActive : navItemInactive
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-4 w-4 flex-shrink-0',
                      isActivePath(item.to)
                        ? 'text-sidebar-primary'
                        : 'text-sidebar-foreground/50'
                    )}
                  />
                  {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                </Link>
              ) : null
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Footer Sidebar */}
      <div
        className={cn(
          'space-y-1 border-t border-sidebar-border',
          isCollapsed ? 'p-2' : 'p-3'
        )}
      >
        {/* Bouton Langue */}
        {!isCollapsed && (
          <div className="flex justify-center pb-1">
            <LanguageToggle />
          </div>
        )}

        {/* Bouton Inviter (Tenant Admin) */}
        {isTenantAdmin && (
          <Link to="/invite-collaborators" className="block" onClick={onLinkClick}>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'w-full gap-2 border-sidebar-border bg-transparent text-sidebar-foreground/60',
                'hover:bg-sidebar-accent hover:text-sidebar-foreground hover:border-sidebar-border',
                'transition-all duration-150',
                isCollapsed ? 'justify-center px-0' : 'justify-start text-sm'
              )}
              aria-label={isCollapsed ? t('sidebar.inviteCollaborators') : undefined}
            >
              <UserPlus className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              {!isCollapsed && t('sidebar.invite')}
            </Button>
          </Link>
        )}

        {/* Bouton Déconnexion */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'w-full gap-2 text-sidebar-foreground/50',
            'hover:bg-destructive/10 hover:text-destructive',
            'transition-all duration-150',
            isCollapsed ? 'justify-center px-0' : 'justify-start text-sm'
          )}
          onClick={signOut}
          aria-label={isCollapsed ? t('sidebar.disconnect') : undefined}
        >
          <LogOut className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          {!isCollapsed && t('sidebar.disconnect')}
        </Button>
      </div>
    </aside>
  );
};
