import { useState, useEffect, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobileLayout } from '@/hooks/use-mobile';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { LandscapeWrapper } from '@/components/layout/LandscapeWrapper';

// 🎨 Utilisation des vues ORIGINALES avec design complet + performance Enterprise
import { TaskTableWithOnboarding } from '@/components/onboarding/TaskTableWithOnboarding';

// 🚀 OPTIMISATION BUNDLE - Lazy loading vues lourdes
const GanttChart = lazy(() => import('@/components/vues/gantt/GanttChart'));

// Composant de chargement professionnel
// Spinner inline — ne masque pas les onglets lors du chargement
const ViewLoading = () => (
  <div className="flex min-h-[200px] items-center justify-center py-12" role="status" aria-label="Chargement de la vue">
    <div className="flex flex-col items-center gap-3">
      <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" aria-hidden="true" />
      <p className="text-muted-foreground text-sm">Chargement...</p>
    </div>
  </div>
);

// import { HRDashboard } from "@/components/hr/HRDashboard"; // Temporarily commented out

const Index = () => {
  const [activeTab, setActiveTab] = useState('table');
  const isMobile = useIsMobileLayout(); // < 1024px pour layout
  const { isScrollingDown } = useScrollDirection();

  // Force landscape orientation on mobile for better table viewing
  useEffect(() => {
    if (isMobile && 'screen' in window && 'orientation' in window.screen) {
      // Add landscape lock hint for mobile devices
      const meta = document.querySelector('meta[name="viewport"]');
      if (meta) {
        meta.setAttribute(
          'content',
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
        );
      }
    }
  }, [isMobile]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex h-full w-full flex-col overflow-hidden"
      >
        <TabsList
          aria-label="Vues disponibles"
          className={`modern-card glow-primary from-primary/10 via-accent/10 to-tech-purple/10 grid w-full flex-shrink-0 border bg-gradient-to-r transition-all duration-300 ease-in-out ${isMobile && isScrollingDown
            ? 'h-0 overflow-hidden p-0 opacity-0'
            : isMobile
              ? 'grid-cols-2 gap-0 p-0'
              : 'grid-cols-2 gap-2 p-2'
            }`}
        >
          <TabsTrigger
            value="gantt"
            className={`transition-smooth data-[state=active]:from-primary data-[state=active]:to-violet-600 font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:text-white data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground ${isMobile ? 'min-h-[28px] py-1 text-xs' : 'text-sm'}`}
          >
            {isMobile ? 'Gantt' : 'Diagramme de Gantt'}
          </TabsTrigger>
          <TabsTrigger
            value="table"
            className={`transition-smooth data-[state=active]:from-violet-600 data-[state=active]:to-primary font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:text-white data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground ${isMobile ? 'min-h-[28px] py-1 text-xs' : 'text-sm'}`}
          >
            {isMobile ? 'Tableau' : 'Tableau Dynamique'}
          </TabsTrigger>
          {/* Temporarily commented out HR tab
            <TabsTrigger 
              value="hr" 
              className={`transition-smooth hover-glow data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white font-semibold ${isMobile ? 'text-sm py-2' : ''}`}
            >
              RH
            </TabsTrigger>
            */}
        </TabsList>

        {/* Table content - Full width with landscape optimization on mobile */}
        <TabsContent
          value="table"
          className="m-0 h-0 flex-1 overflow-hidden data-[state=active]:flex"
        >
          <LandscapeWrapper
            viewType="table"
            forceOnTablet={true}
            customMessage="Pour profiter pleinement du tableau, veuillez tourner votre appareil en mode paysage"
          >
            <div className="h-full w-full">
              <TaskTableWithOnboarding />
            </div>
          </LandscapeWrapper>
        </TabsContent>

        {/* Gantt content - Full width */}
        <TabsContent
          value="gantt"
          className="m-0 h-0 flex-1 overflow-hidden data-[state=active]:flex"
        >
          <LandscapeWrapper
            viewType="gantt"
            forceOnTablet={true}
            customMessage="Le diagramme de Gantt offre une meilleure expérience en mode paysage"
          >
            <div className="modern-card transition-smooth hover-glow h-full w-full overflow-auto rounded-xl">
              <Suspense fallback={<ViewLoading />}>
                <GanttChart />
              </Suspense>
            </div>
          </LandscapeWrapper>
        </TabsContent>

        {/* Temporarily commented out HR content
          <TabsContent value="hr" className={isMobile ? 'mt-2' : 'mt-6'}>
            <div className="modern-card rounded-xl transition-smooth hover-glow">
              <HRDashboard />
            </div>
          </TabsContent>
          */}
      </Tabs>
    </div>
  );
};

export default Index;
