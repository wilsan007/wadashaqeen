/**
 * 🎯 Wrapper pour DynamicTable avec Onboarding
 *
 * Affiche les templates d'onboarding si le tenant n'a pas encore de tâches.
 * Sinon, affiche DynamicTable normalement.
 */

import { useState, useEffect, useMemo } from 'react';
import { useTasks } from '@/hooks/optimized';
import { EmptyStateWithTemplates } from './EmptyStateWithTemplates';
import DynamicTable from '@/components/vues/table/DynamicTable';
import { TaskTemplate } from '@/data/taskTemplates';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { supabase } from '@/integrations/supabase/client';

import type { Task } from '@/types/tasks';

const ONBOARDING_DISMISSED_KEY = 'wadashaqayn_onboarding_dismissed';

import { ModernTaskCreationDialog } from '@/components/tasks/ModernTaskCreationDialog';
import { useTranslation } from '@/hooks/useTranslation';

export function TaskTableWithOnboarding() {
  const { tasks, loading, createTask } = useTasks();
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { t } = useTranslation();

  // État pour le modal de création
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [initialValues, setInitialValues] = useState<any>(null);

  // Vérifier si l'utilisateur a déjà masqué l'onboarding
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    const dismissed = localStorage.getItem(`${ONBOARDING_DISMISSED_KEY}_${tenantId}`);
    return dismissed === 'true';
  });

  // Mode démo: afficher des tâches mockées au lieu de vraies tâches
  const [showDemoData, setShowDemoData] = useState(() => {
    const demo = localStorage.getItem(`wadashaqayn_demo_mode_${tenantId}`);
    return demo === 'true';
  });

  // Afficher EmptyState si:
  // 1. Pas de chargement
  // 2. Aucune tâche
  // 3. Onboarding pas encore masqué
  // 4. Pas en mode démo
  const shouldShowOnboarding =
    !loading && tasks.length === 0 && !onboardingDismissed && !showDemoData;

  // Créer des tâches mockées pour le mode démo avec vrais UUIDs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockTasks = useMemo<any[]>(
    () => [
      {
        id: '00000000-0000-0000-0000-000000000001',
        title: t('onboarding.fakeTask1Format'),
        description: t('onboarding.fakeTask1Desc'),
        status: 'todo',
        priority: 'medium',
        start_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        estimated_hours: null,
        progress: 0,
        tenant_id: tenantId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assigned_to: null,
        assigned_name: null,
        project_id: null,
        project_name: null,
        department_name: null,
        parent_task_id: null,
        position: 0,
        // Ajouter des actions mockées
        task_actions: [
          {
            id: '00000000-0000-0000-0001-000000000001',
            task_id: '00000000-0000-0000-0000-000000000001',
            title: 'Définir une action pour la tâche N°1',
            notes: 'Ceci est une action associée à la première tâche',
            is_done: false,
            position: 0,
            weight_percentage: 25,
            tenant_id: tenantId || '',
          },
          {
            id: '00000000-0000-0000-0001-000000000002',
            task_id: '00000000-0000-0000-0000-000000000001',
            title: 'Définir une seconde action pour la tâche N°1',
            notes: 'Action 2 de la première tâche',
            is_done: false,
            position: 1,
            weight_percentage: 25,
            tenant_id: tenantId || '',
          },
          {
            id: '00000000-0000-0000-0001-000000000003',
            task_id: '00000000-0000-0000-0000-000000000001',
            title: 'Définir une troisième action pour la tâche N°1',
            notes: 'Action 3 de la première tâche',
            is_done: false,
            position: 2,
            weight_percentage: 25,
            tenant_id: tenantId || '',
          },
          {
            id: '00000000-0000-0000-0001-000000000004',
            task_id: '00000000-0000-0000-0000-000000000001',
            title: 'Définir une quatrième action pour la tâche N°1',
            notes: 'Action 4 de la première tâche',
            is_done: false,
            position: 3,
            weight_percentage: 25,
            tenant_id: tenantId || '',
          },
        ],
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        title: t('onboarding.fakeTask2Format'),
        description: t('onboarding.fakeTask2Desc'),
        status: 'todo',
        priority: 'medium',
        start_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        estimated_hours: null,
        progress: 0,
        tenant_id: tenantId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assigned_to: null,
        project_id: null,
        parent_task_id: null,
        position: 1,
        // Ajouter des actions mockées
        task_actions: [
          {
            id: '00000000-0000-0000-0002-000000000001',
            task_id: '00000000-0000-0000-0000-000000000002',
            title: 'Définir une action pour la tâche N°2',
            notes: 'Ceci est une action associée à la seconde tâche',
            is_done: false,
            position: 0,
            weight_percentage: 20,
            tenant_id: tenantId || '',
          },
          {
            id: '00000000-0000-0000-0002-000000000002',
            task_id: '00000000-0000-0000-0000-000000000002',
            title: 'Définir une seconde action pour la tâche N°2',
            notes: 'Action 2 de la seconde tâche',
            is_done: false,
            position: 1,
            weight_percentage: 20,
            tenant_id: tenantId || '',
          },
          {
            id: '00000000-0000-0000-0002-000000000003',
            task_id: '00000000-0000-0000-0000-000000000002',
            title: 'Définir une troisième action pour la tâche N°2',
            notes: 'Action 3 de la seconde tâche',
            is_done: false,
            position: 2,
            weight_percentage: 20,
            tenant_id: tenantId || '',
          },
          {
            id: '00000000-0000-0000-0002-000000000004',
            task_id: '00000000-0000-0000-0000-000000000002',
            title: 'Définir une quatrième action pour la tâche N°2',
            notes: 'Action 4 de la seconde tâche',
            is_done: false,
            position: 3,
            weight_percentage: 20,
            tenant_id: tenantId || '',
          },
          {
            id: '00000000-0000-0000-0002-000000000005',
            task_id: '00000000-0000-0000-0000-000000000002',
            title: 'Définir une cinquième action pour la tâche N°2',
            notes: 'Action 5 de la seconde tâche',
            is_done: false,
            position: 4,
            weight_percentage: 20,
            tenant_id: tenantId || '',
          },
        ],
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        title: t('onboarding.fakeTask3Format'),
        description: t('onboarding.fakeTask3Desc'),
        status: 'todo',
        priority: 'medium',
        start_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        estimated_hours: null,
        progress: 0,
        tenant_id: tenantId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assigned_to: null,
        project_id: null,
        parent_task_id: null,
        position: 2,
        // Ajouter des actions mockées
        task_actions: [
          {
            id: '00000000-0000-0000-0003-000000000001',
            task_id: '00000000-0000-0000-0000-000000000003',
            title: 'Définir une action pour la tâche N°3',
            notes: 'Ceci est une action associée à la troisième tâche',
            is_done: false,
            position: 0,
            weight_percentage: 33,
            tenant_id: tenantId || '',
          },
          {
            id: '00000000-0000-0000-0003-000000000002',
            task_id: '00000000-0000-0000-0000-000000000003',
            title: 'Définir une seconde action pour la tâche N°3',
            notes: 'Action 2 de la troisième tâche',
            is_done: false,
            position: 1,
            weight_percentage: 33,
            tenant_id: tenantId || '',
          },
          {
            id: '00000000-0000-0000-0003-000000000003',
            task_id: '00000000-0000-0000-0000-000000000003',
            title: 'Définir une troisième action pour la tâche N°3',
            notes: 'Action 3 de la troisième tâche',
            is_done: false,
            position: 2,
            weight_percentage: 34,
            tenant_id: tenantId || '',
          },
        ],
      },
    ],
    [tenantId]
  );

  const handleUseTemplate = (template: TaskTemplate) => {
    // Ouvrir le modal de création avec les données du template
    setInitialValues({
      title: template.title,
      description: template.description,
      priority: template.priority,
      // On pourrait aussi passer les actions si ModernTaskCreationDialog le supporte
    });
    setIsDialogOpen(true);
  };

  const handleDismissOnboarding = () => {
    // Activer le mode démo avec données mockées
    localStorage.setItem(`wadashaqayn_demo_mode_${tenantId}`, 'true');
    localStorage.setItem(`${ONBOARDING_DISMISSED_KEY}_${tenantId}`, 'true');
    setShowDemoData(true);
    setOnboardingDismissed(true);

    toast({
      title: t('onboarding.demoModeActivated'),
      description: t('onboarding.demoModeDesc'),
    });
  };

  // ⏳ ÉTAPE 1 : Spinner inline pendant le chargement (ne masque pas les onglets)
  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-muted-foreground text-sm">{t('onboarding.loadingTasks')}</p>
        </div>
      </div>
    );
  }

  // Si en mode démo et pas de vraies tâches, afficher les données mockées
  if (!loading && tasks.length === 0 && showDemoData) {
    return (
      <div className="relative">
        {/* Bannière mode démo */}
        <div className="mb-2 rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-2 sm:mb-4 sm:p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🎨</div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900">{t('onboarding.demoTitle')}</h4>
              <p className="mt-1 text-sm text-blue-700">
                {t('onboarding.demoDesc1')}{' '}
                <strong>{t('onboarding.demoDesc2')}</strong>{t('onboarding.demoDesc3')}{' '}
                <strong>{t('onboarding.demoOpt1')}</strong>, <strong>{t('onboarding.demoOpt2')}</strong>,{' '}
                <strong>{t('onboarding.demoOpt3')}</strong>,<strong>{t('onboarding.demoOpt4')}</strong>, {t('onboarding.demoOpt5')}{' '}
                <strong>{t('onboarding.demoOpt6')}</strong>{t('onboarding.demoCreate')}{' '}
                <strong>{t('onboarding.demoCreateBtn')}</strong> {t('onboarding.demoReady')}
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem(`wadashaqayn_demo_mode_${tenantId}`);
                localStorage.removeItem(`${ONBOARDING_DISMISSED_KEY}_${tenantId}`);
                setShowDemoData(false);
                setOnboardingDismissed(false);
              }}
              className="text-xs whitespace-nowrap text-blue-600 hover:text-blue-800 hover:underline"
            >
              {t('onboarding.backToGuide')}
            </button>
          </div>
        </div>

        {/* Tableau avec données mockées */}
        <DynamicTable demoTasks={mockTasks} isDemoMode={true} />

        <ModernTaskCreationDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onCreateTask={createTask}
          initialValues={initialValues}
        />
      </div>
    );
  }

  // Si onboarding dismissed mais toujours 0 tâches et pas en mode démo
  if (!loading && tasks.length === 0 && onboardingDismissed && !showDemoData) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4 sm:p-8">
        <div className="max-w-md space-y-4 text-center">
          <div className="mb-4 text-6xl">📋</div>
          <h3 className="text-2xl font-bold">{t('onboarding.noTaskYet')}</h3>
          <p className="text-muted-foreground">
            {t('onboarding.startCreateFirst')}
            <span className="text-primary font-semibold"> {t('onboarding.startCreateFirstBtn')} </span>
            {t('onboarding.topRight')}
          </p>
          <button
            onClick={() => {
              localStorage.removeItem(`${ONBOARDING_DISMISSED_KEY}_${tenantId}`);
              setOnboardingDismissed(false);
            }}
            className="text-primary text-sm hover:underline"
          >
            {t('onboarding.showHelpAgain')}
          </button>
        </div>

        <ModernTaskCreationDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onCreateTask={createTask}
          initialValues={initialValues}
        />
      </div>
    );
  }

  // Afficher les templates d'onboarding
  if (shouldShowOnboarding) {
    return (
      <div className="h-full w-full overflow-y-auto">
        <EmptyStateWithTemplates
          onUseTemplate={handleUseTemplate}
          onDismiss={handleDismissOnboarding}
        />
        <ModernTaskCreationDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onCreateTask={createTask}
          initialValues={initialValues}
        />
      </div>
    );
  }

  // Afficher le tableau normal avec vraies tâches
  // Désactiver le mode démo si l'utilisateur a créé des vraies tâches
  if (tasks.length > 0 && showDemoData) {
    localStorage.removeItem(`wadashaqayn_demo_mode_${tenantId}`);
    setShowDemoData(false);
  }

  return (
    <>
      <DynamicTable />
      <ModernTaskCreationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCreateTask={createTask}
        initialValues={initialValues}
      />
    </>
  );
}
