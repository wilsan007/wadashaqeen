import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryConfig';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/styles/landscape-optimization.css';
import '@/styles/sidebar-overlay.css';
import { useRef, useMemo, memo, useCallback, useState, lazy, Suspense } from 'react';
import { useStableCallback } from '@/hooks/useStableCallback';
// import { usePerformanceOptimizer, useRenderOptimizer } from "@/hooks/usePerformanceOptimizer";
import { Auth } from '@/components/Auth';
import { ThemeProvider } from 'next-themes';
import { AppLayoutWithSidebar } from '@/components/layout/AppLayoutWithSidebar';
import { BrandedLoadingScreen } from '@/components/layout/BrandedLoadingScreen';
import { SessionErrorBoundary } from '@/components/SessionErrorBoundary';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TenantProvider } from './contexts/TenantContext';
import { ViewModeProvider } from './contexts/ViewModeContext';
import { RolesProvider } from './contexts/RolesContext';
import { AuthProvider } from './contexts/AuthContext';
// Pages chargées immédiatement (critiques)
import Index from './pages/Index';
import LandingPage from './pages/LandingPage';

// Lazy loading des pages (optimisation performance)
const HRPage = lazy(() => import('./pages/HRPage'));
const HRPageWithCollaboratorInvitation = lazy(
  () => import('./pages/HRPageWithCollaboratorInvitation')
);
const MyExpensesPage = lazy(() => import('./pages/MyExpensesPage'));
const MyTimesheetsPage = lazy(() => import('./pages/MyTimesheetsPage'));
const MyAbsencesPage = lazy(() => import('./pages/MyAbsencesPage'));
const MyRemoteWorkPage = lazy(() => import('./pages/MyRemoteWorkPage'));
const MyAdminRequestsPage = lazy(() => import('./pages/MyAdminRequestsPage'));
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage'));
const MySkillsPage = lazy(() => import('./pages/MySkillsPage'));
const TrainingCatalogPage = lazy(() => import('./pages/TrainingCatalogPage'));
const MyTrainingsPage = lazy(() => import('./pages/MyTrainingsPage'));
const ProjectPage = lazy(() => import('./pages/ProjectPage'));
const TaskManagementPage = lazy(() => import('./pages/TaskManagementPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const SuperAdminPage = lazy(() => import('./pages/SuperAdminPage'));
const TenantOwnerSignup = lazy(() => import('./pages/TenantOwnerSignup'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const SetupAccount = lazy(() => import('./pages/SetupAccount'));
const InvitePage = lazy(() => import('./pages/InvitePage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AcceptInvitation = lazy(() => import('@/pages/AcceptInvitation'));
// Pages nouvellement routées
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const Inbox = lazy(() => import('./pages/Inbox'));
const OperationsPage = lazy(() =>
  import('./components/operations').then(m => ({ default: m.OperationsPage }))
);
const PerformanceMonitor = lazy(() => import('./components/dev/PerformanceMonitor'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));
const DashboardHome = lazy(() => import('./pages/DashboardHome'));
// Pages publiques footer
const DocumentationPage = lazy(() => import('./pages/DocumentationPage'));
const GuidesPage = lazy(() => import('./pages/GuidesPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PartnersPage = lazy(() => import('./pages/PartnersPage'));

import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import { useSessionManager } from './hooks/useSessionManager';
import { useRoleBasedAccess } from './hooks/useRoleBasedAccess';
// import { useRenderTracker } from "@/hooks/usePerformanceMonitor";
import { cacheManager } from '@/lib/cacheManager';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleIndicator } from '@/components/auth/RoleIndicator';
import { InvitationHandler } from '@/components/auth/InvitationHandler';


// Loading component pour Suspense
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="border-primary h-12 w-12 animate-spin rounded-full border-b-2"></div>
  </div>
);

// Composant Routes memoizé pour éviter les re-renders
const MemoizedRoutes = memo(() => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Route publique racine (Landing Page) */}
        <Route path="/" element={<LandingPage />} />

        {/* Tableau de bord KPI — point d'entrée principal après connexion */}
        <Route
          path="/accueil"
          element={
            <ProtectedRoute requiredAccess="canAccessDashboard">
              <DashboardHome />
            </ProtectedRoute>
          }
        />

        {/* Vues de travail : Gantt + Tableau dynamique */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredAccess="canAccessTasks">
              <Index />
            </ProtectedRoute>
          }
        />

        {/* Routes protégées avec système de permissions réactivé */}
        <Route
          path="/hr"
          element={
            <ProtectedRoute requiredAccess="canAccessHR">
              <HRPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invite-collaborators"
          element={
            <ProtectedRoute requiredAccess="canAccessHR">
              <HRPageWithCollaboratorInvitation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-expenses"
          element={
            <ProtectedRoute requiredAccess="canAccessHR">
              <MyExpensesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-timesheets"
          element={
            <ProtectedRoute requiredAccess="canAccessHR">
              <MyTimesheetsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-absences"
          element={
            <ProtectedRoute requiredAccess="canAccessHR">
              <MyAbsencesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-remote-work"
          element={
            <ProtectedRoute requiredAccess="canAccessHR">
              <MyRemoteWorkPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-admin-requests"
          element={
            <ProtectedRoute requiredAccess="canAccessHR">
              <MyAdminRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvals"
          element={
            <ProtectedRoute requiredAccess="canAccessHR">
              <ApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-skills"
          element={
            <ProtectedRoute requiredAccess="canAccessHR">
              <MySkillsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/training-catalog"
          element={
            <ProtectedRoute requiredAccess="canAccessHR">
              <TrainingCatalogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-trainings"
          element={
            <ProtectedRoute requiredAccess="canAccessHR">
              <MyTrainingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute requiredAccess="canAccessProjects">
              <ProjectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute requiredAccess="canAccessTasks">
              <TaskManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute requiredAccess="canAccessTasks">
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/operations"
          element={
            <ProtectedRoute requiredAccess="canAccessTasks">
              <OperationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute requiredAccess="canAccessSuperAdmin">
              <SuperAdminPage />
            </ProtectedRoute>
          }
        />

        {/* Routes utilisateur */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute requiredAccess="canAccessTasks">
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute requiredAccess="canAccessTasks">
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute requiredAccess="canAccessTasks">
              <Inbox />
            </ProtectedRoute>
          }
        />

        {/* Routes publiques */}
        <Route path="/auth" element={<Auth onAuthStateChange={() => { }} />} />
        <Route path="/auth/signup" element={<Navigate to="/auth" replace />} />
        <Route path="/signup" element={<TenantOwnerSignup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/setup" element={<SetupAccount />} />
        <Route path="/invite/:inviteId" element={<InvitePage />} />
        <Route path="/privacy-policy" element={<PrivacyPage />} />
        <Route path="/terms-of-use" element={<TermsPage />} />
        {/* Routes canoniques des pages légales */}
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        {/* Pages publiques footer */}
        <Route path="/documentation" element={<DocumentationPage />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/partners" element={<PartnersPage />} />

        {/* Redirect /login to /accueil if authenticated */}
        <Route path="/login" element={<Navigate to="/accueil" replace />} />

        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </ErrorBoundary>
));

MemoizedRoutes.displayName = 'MemoizedRoutes';

function App() {
  // Protection STRICTE anti-re-renders avec state stable
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(0);
  const stableStateRef = useRef<{
    session: any;
    loading: boolean;
    accessLoading: boolean;
    accessRights: any;
  } | null>(null);

  // Hooks avec protection anti-boucle renforcée
  const { session, loading, signOut, handleAuthStateChange } = useSessionManager();
  const user = session?.user;

  // useRoleBasedAccess appelle useUserRoles en interne — pas besoin d'un appel séparé
  const { accessRights, isLoading: accessLoading, isSuperAdmin, isTenantAdmin } = useRoleBasedAccess();

  // Détection des changements d'état pour éviter les re-renders inutiles
  const currentState = {
    session: !!session,
    loading,
    accessLoading,
    accessRights: JSON.stringify(accessRights),
  };

  const lastState = stableStateRef.current;
  const stateChanged =
    !lastState ||
    lastState.session !== currentState.session ||
    lastState.loading !== currentState.loading ||
    lastState.accessLoading !== currentState.accessLoading ||
    lastState.accessRights !== currentState.accessRights;

  // Mettre à jour l'état stable seulement si changement
  if (stateChanged) {
    stableStateRef.current = {
      session,
      loading,
      accessLoading,
      accessRights,
    };
  }

  // Timer réactivé avec configuration memoizée (protection anti-boucle)
  const timerConfig = useMemo(
    () => ({
      totalTimeoutMinutes: 15,
      warningMinutes: 5,
      enabled: !!session && !loading, // Activer seulement si connecté et chargé
    }),
    [!!session, loading]
  ); // Dépendances minimales et stables

  const { showWarning, timeLeftFormatted, isActive: timerActive } = useInactivityTimer(timerConfig);

  // Callbacks STABLES pour éviter les re-renders (Pattern Stripe)
  const handleSignOut = useStableCallback(async () => {
    // Nettoyer le cache lors de la déconnexion
    cacheManager.clear();
    await signOut();
  });

  // Props stables pour éviter les re-renders du header
  const headerProps = useMemo(() => {
    // Seulement si l'état a vraiment changé
    if (!stateChanged && stableStateRef.current) {
      return {
        accessRights: stableStateRef.current.accessRights,
        accessLoading: stableStateRef.current.accessLoading,
        showWarning,
        timeLeftFormatted,
        signOut: handleSignOut,
        isTenantAdmin,
      };
    }

    return {
      accessRights,
      accessLoading,
      showWarning,
      timeLeftFormatted,
      signOut: handleSignOut,
      isTenantAdmin,
      user,
    };
  }, [
    stateChanged,
    accessRights,
    accessLoading,
    showWarning,
    timeLeftFormatted,
    handleSignOut,
    isTenantAdmin,
    user,
  ]);

  // Protection anti-boucle stricte avec arrêt forcé
  const now = Date.now();
  renderCountRef.current += 1;

  // Détection de boucle de rendu silencieuse en développement uniquement
  if (import.meta.env.DEV && renderCountRef.current > 10) {
    const isStabilized = renderCountRef.current === 11; // log une seule fois
    if (isStabilized) {
      // Warn discret uniquement en dev - pas de log en prod
    }
  }

  // SEO FIX: Allow Landing Page and Legal Pages to render immediately for bots/visitors
  // We bypass the loading screen for the root path and legal pages
  const pathname = window.location.pathname;
  const isPublicRoute = pathname === '/' ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms');

  // AUTH CALLBACK FIX: si on est sur /auth/callback et que la session vient juste
  // d'être établie (loading=false, session=truthy), on retourne un écran de chargement
  // pour éviter que le double BrowserRouter ne détruise le navigate() en cours.
  // AuthCallback gère lui-même la redirection vers /accueil.
  const isAuthCallback = pathname === '/auth/callback';

  if ((loading || accessLoading) && !isPublicRoute) {
    return <BrandedLoadingScreen appName="Wadashaqayn" logoSrc="/logo-w.svg" />;
  }

  // Sur /auth/callback avec session établie : window.location.replace() dans AuthCallback
  // se charge du rechargement — pas besoin de garder le no-session router actif ici.
  if (!session) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <InvitationHandler />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/invite/accept" element={<AcceptInvitation />} />
                <Route path="/login" element={<Auth onAuthStateChange={handleAuthStateChange} />} />
                <Route path="/signup/tenant-owner" element={<TenantOwnerSignup />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/setup-account" element={<SetupAccount />} />
                <Route path="/invite" element={<InvitePage />} />
                <Route path="/update-password" element={<UpdatePassword />} />
                {/* Pages publiques footer */}
                <Route path="/documentation" element={<DocumentationPage />} />
                <Route path="/guides" element={<GuidesPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/careers" element={<CareersPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/partners" element={<PartnersPage />} />
                <Route path="*" element={<Auth onAuthStateChange={handleAuthStateChange} />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SessionErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider level={2} includeProjectIds={true}>
              <TenantProvider>
                <RolesProvider>
                  <ViewModeProvider>
                    <BrowserRouter>
                      <InvitationHandler />
                      <AppLayoutWithSidebar {...headerProps}>
                        {/* Redirection automatique pour les utilisateurs connectés sur la racine */}
                        {window.location.pathname === '/' && <Navigate to="/accueil" replace />}
                        <MemoizedRoutes />
                      </AppLayoutWithSidebar>
                    </BrowserRouter>
                  </ViewModeProvider>
                </RolesProvider>
              </TenantProvider>
            </AuthProvider>
          </ThemeProvider>
        </SessionErrorBoundary>
        <Toaster />
        <PerformanceMonitor />

      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
