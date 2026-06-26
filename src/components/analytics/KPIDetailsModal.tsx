import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/useTranslation';
import { ResourceUtilizationView } from './details/ResourceUtilizationView';
import { TasksDetailView } from './details/TasksDetailView';
import { VelocityDetailView } from './details/VelocityDetailView';

export interface KPIDetailsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    kpiId: string | null;
    kpiTitle?: string;
}

export const KPIDetailsModal: React.FC<KPIDetailsModalProps> = ({ isOpen, onOpenChange, kpiId, kpiTitle }) => {
    const { t } = useTranslation();

    if (!kpiId) return null;

    // Render specific content depending on the kpiId
    const renderContent = () => {
        switch (kpiId) {
            // PROJETS
            case 'active_projects':
            case 'inactive_projects':
            case 'overdue_projects':
            case 'completed_projects':
                return <div className="p-4 text-center text-muted-foreground">Liste des projets (à venir)</div>;

            // TÂCHES
            case 'in_progress_tasks':
                return <TasksDetailView filterType="in_progress" />;
            case 'overdue_tasks':
                return <TasksDetailView filterType="overdue" />;
            case 'blocked_tasks':
                return <TasksDetailView filterType="blocked" />;
            case 'completion_rate':
                return <TasksDetailView filterType="completed" />;

            // PERFORMANCE
            case 'velocity':
                return <VelocityDetailView />;
            case 'resolution_time':
            case 'health_score':
                return <div className="p-4 text-center text-muted-foreground">Détail des performances (à venir)</div>;

            // ÉQUIPE
            case 'active_members':
            case 'team_members':
                return <div className="p-4 text-center text-muted-foreground">Liste de l'équipe (à venir)</div>;

            case 'resource_utilization':
                return <ResourceUtilizationView />;

            default:
                return (
                    <div className="p-4 text-center text-muted-foreground">
                        Détails non disponibles pour ce KPI ({kpiId}).
                    </div>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
                <DialogHeader className="p-6 pb-2 border-b">
                    <DialogTitle className="text-xl font-bold">{kpiTitle || kpiId}</DialogTitle>
                    <DialogDescription>
                        {t('kpi.modal.detailsSubtitle', 'Aperçu détaillé des données composant cet indicateur.')}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
                    {renderContent()}
                </div>
            </DialogContent>
        </Dialog>
    );
};
