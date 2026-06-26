import { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  Building,
  TrendingUp,
  BookOpen,
  Shield,
  UserX,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveLayout } from '@/components/responsive/ResponsiveLayout';
import { useTranslation } from '@/hooks/useTranslation';


// 🚀 OPTIMISATION BUNDLE - Lazy loading des composants HR lourds
const HRDashboard = lazy(() =>
  import('@/components/hr/HRDashboardMinimal').then(m => ({ default: m.HRDashboardMinimal }))
);
const LeaveManagement = lazy(() =>
  import('@/components/hr/LeaveManagement').then(m => ({ default: m.LeaveManagement }))
);
const AttendanceManagement = lazy(() =>
  import('@/components/hr/AttendanceManagement').then(m => ({ default: m.AttendanceManagement }))
);
const EnhancedEmployeeManagement = lazy(() =>
  import('@/components/hr/EnhancedEmployeeManagement').then(m => ({
    default: m.EnhancedEmployeeManagement,
  }))
);
const AbsenceTypeManagement = lazy(() =>
  import('@/components/hr/AbsenceTypeManagement').then(m => ({ default: m.AbsenceTypeManagement }))
);
const LeaveBalanceManagement = lazy(() =>
  import('@/components/hr/LeaveBalanceManagement').then(m => ({
    default: m.LeaveBalanceManagement,
  }))
);
const TimesheetManagement = lazy(() =>
  import('@/components/hr/TimesheetManagement').then(m => ({ default: m.TimesheetManagement }))
);
const DepartmentManagement = lazy(() =>
  import('@/components/hr/DepartmentManagement').then(m => ({ default: m.DepartmentManagement }))
);
const OnboardingOffboarding = lazy(() =>
  import('@/components/hr/OnboardingOffboarding').then(m => ({ default: m.OnboardingOffboarding }))
);
const PerformanceManagement = lazy(() =>
  import('@/components/hr/PerformanceManagement').then(m => ({ default: m.PerformanceManagement }))
);
const SkillsTraining = lazy(() =>
  import('@/components/hr/SkillsTraining').then(m => ({ default: m.SkillsTraining }))
);
const ExpenseManagement = lazy(() =>
  import('@/components/hr/ExpenseManagement').then(m => ({ default: m.ExpenseManagement }))
);
const PayrollManagement = lazy(() =>
  import('@/components/hr/PayrollManagement').then(m => ({ default: m.PayrollManagement }))
);
const HealthSafety = lazy(() =>
  import('@/components/hr/HealthSafety').then(m => ({ default: m.HealthSafety }))
);
const HierarchyConfig = lazy(() =>
  import('@/components/hr/HierarchyConfig').then(m => ({ default: m.HierarchyConfig }))
);
const OrganizationChart = lazy(() =>
  import('@/components/hr/OrganizationChart').then(m => ({ default: m.OrganizationChart }))
);
const FormerEmployees = lazy(() =>
  import('@/components/hr/FormerEmployees').then(m => ({ default: m.FormerEmployees }))
);

// Spinner inline léger — ne masque PAS la barre d'onglets
const LoadingFallback = () => {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[200px] items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
      </div>
    </div>
  );
};

// Composants enveloppés
const HRDashboardWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <HRDashboard />
  </Suspense>
);
const LeaveManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LeaveManagement />
  </Suspense>
);
const AttendanceManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <AttendanceManagement />
  </Suspense>
);
const EnhancedEmployeeManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <EnhancedEmployeeManagement />
  </Suspense>
);
const AbsenceTypeManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <AbsenceTypeManagement />
  </Suspense>
);
const LeaveBalanceManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LeaveBalanceManagement />
  </Suspense>
);
const TimesheetManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <TimesheetManagement />
  </Suspense>
);
const DepartmentManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <DepartmentManagement />
  </Suspense>
);
const OnboardingOffboardingWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <OnboardingOffboarding />
  </Suspense>
);
const PerformanceManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <PerformanceManagement />
  </Suspense>
);
const SkillsTrainingWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <SkillsTraining />
  </Suspense>
);
const ExpenseManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <ExpenseManagement />
  </Suspense>
);
const PayrollManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <PayrollManagement />
  </Suspense>
);
const HealthSafetyWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <HealthSafety />
  </Suspense>
);
const HierarchyConfigWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <HierarchyConfig />
  </Suspense>
);
const OrganizationChartWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <OrganizationChart />
  </Suspense>
);
const FormerEmployeesWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <FormerEmployees />
  </Suspense>
);

const HRPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState({
    employees: 'management',
    operations: 'onboarding',
    development: 'skills',
    leaves: 'requests',
    time: 'attendance',
  });
  // Onglet anciens employés dans la section personnel
  const [showFormer, setShowFormer] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <ResponsiveLayout>
      {/* Header avec navigation retour - Ultra compact mobile */}
      <div className="mb-2 flex flex-col gap-2 sm:mb-4 sm:gap-3 md:mb-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="hover-glow h-9 w-9 shrink-0 p-0 sm:h-10 sm:w-auto sm:px-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-2">{t('common.back')}</span>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="from-primary via-accent to-tech-purple truncate bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent drop-shadow-sm sm:text-2xl md:text-4xl">
              <span className="hidden sm:inline">{t('hr.title')}</span>
              <span className="sm:hidden">{t('hr.titleShort')}</span>
            </h1>
            <p className="text-muted-foreground mt-0.5 truncate text-xs font-medium sm:text-sm md:text-lg">
              <span className="hidden sm:inline">{t('hr.subtitle')}</span>
              <span className="sm:hidden">{t('hr.subtitleShort')}</span>
            </p>
          </div>
        </div>
        <div className="self-end sm:self-auto">
          <ThemeToggle />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tabs principales - Scroll horizontal mobile */}
        <div className="-mx-4 sm:mx-0">
          <TabsList className="modern-card glow-primary from-primary/10 via-accent/10 to-tech-purple/10 flex w-full gap-1 overflow-x-auto border-2 bg-gradient-to-r p-1.5 sm:grid sm:grid-cols-6 sm:gap-2 sm:p-2 md:mb-4">
            <TabsTrigger
              value="dashboard"
              className="flex shrink-0 items-center gap-2 px-3 whitespace-nowrap sm:px-4"
            >
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">{t('hr.dashboard')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="personnel"
              className="flex shrink-0 items-center gap-2 px-3 whitespace-nowrap sm:px-4"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{t('hr.personnel')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="flex shrink-0 items-center gap-2 px-3 whitespace-nowrap sm:px-4"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">{t('hr.performance')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="operations"
              className="flex shrink-0 items-center gap-2 px-3 whitespace-nowrap sm:px-4"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">{t('hr.operations')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="development"
              className="flex shrink-0 items-center gap-2 px-3 whitespace-nowrap sm:px-4"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">{t('hr.development')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="safety"
              className="flex shrink-0 items-center gap-2 px-3 whitespace-nowrap sm:px-4"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{t('hr.safety')}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="dashboard"
          className="m-0 data-[state=active]:mt-2 sm:data-[state=active]:mt-3"
        >
          <div className="modern-card transition-smooth hover-glow rounded-xl">
            <HRDashboardWithSuspense />
          </div>
        </TabsContent>

        <TabsContent
          value="personnel"
          className="m-0 data-[state=active]:mt-2 sm:data-[state=active]:mt-3"
        >
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!showFormer && activeSubTab.employees === 'management' ? 'default' : 'outline'}
                onClick={() => { setShowFormer(false); setActiveSubTab(prev => ({ ...prev, employees: 'management' })); }}
                className="h-10 flex-1 text-xs sm:h-auto sm:text-sm"
              >
                <Users className="mr-1.5 h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('hr.management')} </span>{t('hr.employees')}
              </Button>
              <Button
                variant={!showFormer && activeSubTab.employees === 'departments' ? 'default' : 'outline'}
                onClick={() => { setShowFormer(false); setActiveSubTab(prev => ({ ...prev, employees: 'departments' })); }}
                className="h-10 flex-1 text-xs sm:h-auto sm:text-sm"
              >
                <Building className="mr-1.5 h-4 w-4 sm:mr-2" />
                {t('hr.departments')}
              </Button>
              <Button
                variant={!showFormer && activeSubTab.employees === 'hierarchy' ? 'default' : 'outline'}
                onClick={() => { setShowFormer(false); setActiveSubTab(prev => ({ ...prev, employees: 'hierarchy' })); }}
                className="h-10 flex-1 text-xs sm:h-auto sm:text-sm"
              >
                <TrendingUp className="mr-1.5 h-4 w-4 sm:mr-2" />
                {t('hr.orgChart')}
              </Button>
              <Button
                variant={!showFormer && activeSubTab.employees === 'config' ? 'default' : 'outline'}
                onClick={() => { setShowFormer(false); setActiveSubTab(prev => ({ ...prev, employees: 'config' })); }}
                className="h-10 flex-1 text-xs sm:h-auto sm:text-sm"
              >
                <Shield className="mr-1.5 h-4 w-4 sm:mr-2" />
                {t('hr.config')}
              </Button>
              {/* Onglet Anciens Employés */}
              <Button
                variant={showFormer ? 'default' : 'outline'}
                onClick={() => setShowFormer(true)}
                className="h-10 flex-1 border-red-500/30 text-xs hover:bg-red-500/10 sm:h-auto sm:text-sm"
                style={showFormer ? { backgroundColor: 'rgb(239 68 68)', color: 'white' } : {}}
              >
                <UserX className="mr-1.5 h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Anciens </span>Employés
              </Button>
            </div>

            <div className="modern-card transition-smooth hover-glow rounded-xl">
              {!showFormer && activeSubTab.employees === 'management' && (
                <EnhancedEmployeeManagementWithSuspense />
              )}
              {!showFormer && activeSubTab.employees === 'departments' && <DepartmentManagementWithSuspense />}
              {!showFormer && activeSubTab.employees === 'hierarchy' && <OrganizationChartWithSuspense />}
              {!showFormer && activeSubTab.employees === 'config' && <HierarchyConfigWithSuspense />}
              {showFormer && <FormerEmployeesWithSuspense />}
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="performance"
          className="m-0 data-[state=active]:mt-2 sm:data-[state=active]:mt-3"
        >
          <div className="modern-card transition-smooth hover-glow rounded-xl">
            <PerformanceManagementWithSuspense />
          </div>
        </TabsContent>

        <TabsContent
          value="operations"
          className="m-0 data-[state=active]:mt-2 sm:data-[state=active]:mt-3"
        >
          <div className="space-y-2 sm:space-y-4">
            {/* Sous-tabs opérations - Grid responsive */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button
                variant={activeSubTab.operations === 'onboarding' ? 'default' : 'outline'}
                onClick={() => setActiveSubTab(prev => ({ ...prev, operations: 'onboarding' }))}
                className="h-10 justify-start text-xs sm:min-w-32 sm:flex-1 sm:justify-center sm:text-sm"
              >
                <Users className="mr-1.5 h-4 w-4" />
                <span className="truncate">{t('hr.onboarding')}</span>
              </Button>
              <Button
                variant={activeSubTab.operations === 'leaves' ? 'default' : 'outline'}
                onClick={() => setActiveSubTab(prev => ({ ...prev, operations: 'leaves' }))}
                className="h-10 justify-start text-xs sm:min-w-32 sm:flex-1 sm:justify-center sm:text-sm"
              >
                <Calendar className="mr-1.5 h-4 w-4" />
                <span className="truncate">{t('hr.leaves')}</span>
              </Button>
              <Button
                variant={activeSubTab.operations === 'time' ? 'default' : 'outline'}
                onClick={() => setActiveSubTab(prev => ({ ...prev, operations: 'time' }))}
                className="h-10 justify-start text-xs sm:min-w-32 sm:flex-1 sm:justify-center sm:text-sm"
              >
                <Clock className="mr-1.5 h-4 w-4" />
                <span className="truncate">{t('hr.time')}</span>
              </Button>
              <Button
                variant={activeSubTab.operations === 'expenses' ? 'default' : 'outline'}
                onClick={() => setActiveSubTab(prev => ({ ...prev, operations: 'expenses' }))}
                className="h-10 justify-start text-xs sm:min-w-32 sm:flex-1 sm:justify-center sm:text-sm"
              >
                <Building className="mr-1.5 h-4 w-4" />
                <span className="truncate">{t('hr.expenses')}</span>
              </Button>
              <Button
                variant={activeSubTab.operations === 'payroll' ? 'default' : 'outline'}
                onClick={() => setActiveSubTab(prev => ({ ...prev, operations: 'payroll' }))}
                className="h-10 justify-start text-xs sm:min-w-32 sm:flex-1 sm:justify-center sm:text-sm"
              >
                <TrendingUp className="mr-1.5 h-4 w-4" />
                <span className="truncate">{t('hr.payroll')}</span>
              </Button>
            </div>

            <div className="modern-card transition-smooth hover-glow rounded-xl">
              {activeSubTab.operations === 'onboarding' && <OnboardingOffboardingWithSuspense />}
              {activeSubTab.operations === 'leaves' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={activeSubTab.leaves === 'requests' ? 'default' : 'outline'}
                      onClick={() => setActiveSubTab(prev => ({ ...prev, leaves: 'requests' }))}
                      className="h-10 flex-1 text-xs sm:min-w-32 sm:text-sm"
                    >
                      <Calendar className="mr-1.5 h-4 w-4" />
                      {t('hr.requests')}
                    </Button>
                    <Button
                      variant={activeSubTab.leaves === 'balances' ? 'default' : 'outline'}
                      onClick={() => setActiveSubTab(prev => ({ ...prev, leaves: 'balances' }))}
                      className="h-10 flex-1 text-xs sm:min-w-32 sm:text-sm"
                    >
                      <Clock className="mr-1.5 h-4 w-4" />
                      {t('hr.balances')}
                    </Button>
                    <Button
                      variant={activeSubTab.leaves === 'types' ? 'default' : 'outline'}
                      onClick={() => setActiveSubTab(prev => ({ ...prev, leaves: 'types' }))}
                      className="h-10 flex-1 text-xs sm:min-w-32 sm:text-sm"
                    >
                      <Building className="mr-1.5 h-4 w-4" />
                      {t('hr.types')}
                    </Button>
                  </div>
                  <div>
                    {activeSubTab.leaves === 'requests' && <LeaveManagementWithSuspense />}
                    {activeSubTab.leaves === 'balances' && <LeaveBalanceManagementWithSuspense />}
                    {activeSubTab.leaves === 'types' && <AbsenceTypeManagementWithSuspense />}
                  </div>
                </div>
              )}
              {activeSubTab.operations === 'time' && (
                <div className="space-y-6">
                  <div className="flex gap-2">
                    <Button
                      variant={activeSubTab.time === 'attendance' ? 'default' : 'outline'}
                      onClick={() => setActiveSubTab(prev => ({ ...prev, time: 'attendance' }))}
                      className="h-10 flex-1 text-xs sm:text-sm"
                    >
                      <Clock className="mr-1.5 h-4 w-4" />
                      {t('hr.attendance')}
                    </Button>
                    <Button
                      variant={activeSubTab.time === 'timesheets' ? 'default' : 'outline'}
                      onClick={() => setActiveSubTab(prev => ({ ...prev, time: 'timesheets' }))}
                      className="h-10 flex-1 text-xs sm:text-sm"
                    >
                      <Calendar className="mr-1.5 h-4 w-4" />
                      <span className="hidden sm:inline">{t('hr.timesheets')}</span>
                      <span className="sm:hidden">{t('hr.timesheetsShort')}</span>
                    </Button>
                  </div>
                  <div>
                    {activeSubTab.time === 'attendance' && <AttendanceManagementWithSuspense />}
                    {activeSubTab.time === 'timesheets' && <TimesheetManagementWithSuspense />}
                  </div>
                </div>
              )}
              {activeSubTab.operations === 'expenses' && <ExpenseManagementWithSuspense />}
              {activeSubTab.operations === 'payroll' && <PayrollManagementWithSuspense />}
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="development"
          className="m-0 data-[state=active]:mt-2 sm:data-[state=active]:mt-3"
        >
          <div className="space-y-2 sm:space-y-4">
            <div className="flex gap-2">
              <Button
                variant={activeSubTab.development === 'skills' ? 'default' : 'outline'}
                onClick={() => setActiveSubTab(prev => ({ ...prev, development: 'skills' }))}
                className="h-10 flex-1 text-xs sm:h-auto sm:text-sm"
              >
                <TrendingUp className="mr-1.5 h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('hr.skills')} </span>{t('hr.skillsShort')}
              </Button>
            </div>

            <div className="modern-card transition-smooth hover-glow rounded-xl">
              {activeSubTab.development === 'skills' && <SkillsTrainingWithSuspense />}
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="safety"
          className="m-0 data-[state=active]:mt-2 sm:data-[state=active]:mt-3"
        >
          <div className="modern-card transition-smooth hover-glow rounded-xl">
            <HealthSafetyWithSuspense />
          </div>
        </TabsContent>
      </Tabs>
    </ResponsiveLayout>
  );
};

export default HRPage;
