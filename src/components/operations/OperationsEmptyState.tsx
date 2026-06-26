/**
 * Composant: OperationsEmptyState
 * État vide élégant pour la page Operations
 * Pattern: Linear/Notion empty states
 */

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { CalendarClock, CalendarDays, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface OperationsEmptyStateProps {
  onCreateRecurring: () => void;
  onCreateOneOff: () => void;
}

export const OperationsEmptyState: React.FC<OperationsEmptyStateProps> = ({
  onCreateRecurring,
  onCreateOneOff,
}) => {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-4 text-4xl font-bold">{t('operations.pageTitle')}</h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
            Automatisez vos tâches récurrentes et planifiez vos opérations ponctuelles hors projet
          </p>
        </div>

        {/* Types d'activités */}
        <div className="mb-12 grid gap-6 md:grid-cols-2">
          {/* Activités Récurrentes */}
          <Card className="group cursor-pointer border-2 border-blue-200 transition-shadow hover:shadow-lg dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="rounded-full bg-blue-100 p-4 transition-transform group-hover:scale-110 dark:bg-blue-950">
                  <CalendarClock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">{t('operations.emptyRecurringTitle')}</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Génération automatique de tâches selon une planification (quotidienne,
                    hebdomadaire, mensuelle)
                  </p>
                </div>
                <ul className="w-full space-y-2 text-left text-sm">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                    <span>{t('operations.emptyRecurringItem1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                    <span>{t('operations.emptyRecurringItem2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                    <span>{t('operations.emptyRecurringItem3')}</span>
                  </li>
                </ul>
                <Button onClick={onCreateRecurring} className="w-full group-hover:bg-blue-700">
                  <CalendarClock className="mr-2 h-4 w-4" />
                  {t('operations.createRecurringBtn')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activités Ponctuelles */}
          <Card className="group cursor-pointer border-2 border-purple-200 transition-shadow hover:shadow-lg dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="rounded-full bg-purple-100 p-4 transition-transform group-hover:scale-110 dark:bg-purple-950">
                  <CalendarDays className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">{t('operations.emptyOneOffTitle')}</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Création manuelle d'une tâche unique à une date précise
                  </p>
                </div>
                <ul className="w-full space-y-2 text-left text-sm">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600" />
                    <span>{t('operations.emptyOneOffItem1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600" />
                    <span>{t('operations.emptyOneOffItem2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600" />
                    <span>{t('operations.emptyOneOffItem3')}</span>
                  </li>
                </ul>
                <Button
                  onClick={onCreateOneOff}
                  variant="outline"
                  className="w-full group-hover:bg-purple-50 dark:group-hover:bg-purple-950"
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {t('operations.createOneOffBtn')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fonctionnalités */}
        <div className="rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-8 dark:from-gray-900 dark:to-gray-800">
          <h3 className="mb-6 text-center text-xl font-semibold">{t('operations.featuresTitle')}</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 text-3xl">🔄</div>
              <h4 className="mb-2 font-semibold">{t('operations.featAutoTitle')}</h4>
              <p className="text-muted-foreground text-sm">
                {t('operations.featAutoDesc')}
              </p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl">✅</div>
              <h4 className="mb-2 font-semibold">{t('operations.featActionsTitle')}</h4>
              <p className="text-muted-foreground text-sm">
                {t('operations.featActionsDesc')}
              </p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl">📊</div>
              <h4 className="mb-2 font-semibold">{t('operations.featStatsTitle')}</h4>
              <p className="text-muted-foreground text-sm">
                {t('operations.featStatsDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm">
            {t('operations.needHelp')}{' '}
            <a href="/docs/operations" className="text-primary hover:underline">
              {t('operations.docsLink')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
