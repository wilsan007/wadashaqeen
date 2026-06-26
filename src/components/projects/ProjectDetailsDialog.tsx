import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Target, DollarSign, Activity, Clock } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string; // Peut être n'importe quelle valeur
  start_date?: string;
  end_date?: string;
  progress?: number;
  manager?: string;
  owner_name?: string;
  team_members?: string[];
  skills_required?: string[];
  budget?: number;
  priority?: string; // Peut être n'importe quelle valeur
  created_at?: string;
  updated_at?: string;
}

interface ProjectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}

export const ProjectDetailsDialog: React.FC<ProjectDetailsDialogProps> = ({
  open,
  onOpenChange,
  project,
}) => {
  const { t } = useTranslation();

  if (!project) return null;

  const getStatusBadge = (status?: string) => {
    if (!status) return { label: t('projectsBloc.creation.unassigned'), color: 'bg-gray-400' };

    const statusConfig: Record<string, { label: string; color: string }> = {
      en_cours: { label: t('gantt.status.inProgress'), color: 'bg-blue-500' },
      a_venir: { label: t('gantt.status.todo'), color: 'bg-gray-500' },
      termine: { label: t('gantt.status.completed'), color: 'bg-green-500' },
      active: { label: t('projectsBloc.analytics.statusActive'), color: 'bg-green-500' },
      completed: { label: t('gantt.status.completed'), color: 'bg-blue-500' },
      planning: { label: t('gantt.status.todo'), color: 'bg-yellow-500' },
    };
    return statusConfig[status] || { label: status, color: 'bg-gray-400' };
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return { label: `⚪ ${t('projectsBloc.creation.unassigned')}`, color: 'bg-gray-100 text-gray-800' };

    const priorityConfig: Record<string, { label: string; color: string }> = {
      low: { label: `🟢 ${t('gantt.priority.low')}`, color: 'bg-green-100 text-green-800' },
      medium: { label: `🟡 ${t('gantt.priority.medium')}`, color: 'bg-yellow-100 text-yellow-800' },
      high: { label: `🟠 ${t('gantt.priority.high')}`, color: 'bg-orange-100 text-orange-800' },
      urgent: { label: `🔴 ${t('gantt.priority.urgent')}`, color: 'bg-red-100 text-red-800' },
    };
    return priorityConfig[priority] || { label: priority, color: 'bg-gray-100 text-gray-800' };
  };

  const mockHistory = [
    { date: '2024-03-15', action: 'Tâche "Interface utilisateur" mise à jour', user: 'AW' },
    { date: '2024-03-14', action: 'Sous-tâche "Design système" terminée', user: 'SM' },
    { date: '2024-03-13', action: 'Action "Tests unitaires" ajoutée', user: 'JD' },
    { date: '2024-03-12', action: 'Projet mis à jour - Budget modifié', user: 'AW' },
  ];

  const statusBadge = getStatusBadge(project.status);
  const priorityBadge = getPriorityBadge(project.priority);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/20 flex max-h-[85vh] w-[90vw] max-w-4xl flex-col overflow-hidden border p-0 shadow-lg sm:w-[88vw] sm:rounded-2xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Target className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">{t('projectsBloc.details.title').replace('%s', project.name)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="h-full min-h-0 w-full flex-1 overflow-y-auto">
          <div className="space-y-4 px-6 py-6 sm:space-y-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('projectsBloc.details.generalInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
                  <Badge className={priorityBadge.color}>{priorityBadge.label}</Badge>
                </div>

                {project.description && (
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {project.description}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                  {project.start_date && project.end_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="text-muted-foreground h-4 w-4" />
                      <span className="text-sm">
                        {new Date(project.start_date).toLocaleDateString()} -{' '}
                        {new Date(project.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {(project.manager || project.owner_name) && (
                    <div className="flex items-center gap-2">
                      <Users className="text-muted-foreground h-4 w-4" />
                      <span className="text-sm">
                        Manager: {project.manager || project.owner_name}
                      </span>
                    </div>
                  )}

                  {project.budget && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="text-muted-foreground h-4 w-4" />
                      <span className="text-sm">{t('projectsBloc.enterprise.budget')}: {project.budget.toLocaleString()} DJF</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Activity className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm">{t('projectsBloc.details.progress').replace('%s', (project.progress ?? 0).toString())}</span>
                  </div>
                </div>

                <div>
                  <Progress value={project.progress ?? 0} className="w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Équipe */}
            {project.team_members && project.team_members.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('projectsBloc.details.team')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.team_members.map(member => (
                      <Badge key={member} variant="outline">
                        {member}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Compétences requises */}
            {project.skills_required && project.skills_required.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('projectsBloc.details.skills')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.skills_required.map(skill => (
                      <Badge key={skill} className="bg-primary/10 text-primary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Historique des modifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  {t('projectsBloc.details.history')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="border-border/50 flex items-start gap-3 border-b pb-3 last:border-b-0"
                    >
                      <Badge variant="outline" className="text-xs">
                        {entry.user}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm">{entry.action}</p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(entry.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
