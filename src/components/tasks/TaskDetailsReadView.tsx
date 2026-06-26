import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  User,
  Flag,
  Building2,
  FolderKanban,
  CheckCircle2,
  Circle,
  FileText,
  MessageSquare,
  Paperclip,
  History,
  GitBranch,
  ListTree,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { type Task } from '@/hooks/optimized';
import { useTranslation } from '@/hooks/useTranslation';

interface TaskDetailsReadViewProps {
  task: Task;
  employees: Array<{ id: string; full_name: string }>;
  departments: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
  statusIcons: Record<string, string>;
  priorityIcons: Record<string, string>;
}

export const TaskDetailsReadView: React.FC<TaskDetailsReadViewProps> = ({
  task,
  employees,
  departments,
  projects,
  statusIcons,
  priorityIcons,
}) => {
  const { t } = useTranslation();

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      todo: t('tasks.status.todo'),
      doing: t('tasks.status.in_progress'),
      blocked: t('tasks.status.blocked'),
      done: t('tasks.status.done'),
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: t('tasks.priority.low'),
      medium: t('tasks.priority.medium'),
      high: t('tasks.priority.high'),
      urgent: t('tasks.priority.urgent'),
    };
    return labels[priority] || priority;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      todo: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
      doing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      blocked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      done: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    };
    return colors[status] || colors.todo;
  };

  const assigneeName = employees.find(e => e.id === task.assignee_id)?.full_name || 'Non assigné';
  const projectName =
    projects.find(p => p.id === task.project_id)?.name || task.project_name || 'Aucun projet';
  const departmentName =
    departments.find(d => d.id === task.department_id)?.name || 'Aucun département';
  const isSubtask = !!task.parent_id || (task.task_level && task.task_level > 0);

  return (
    <div className="space-y-6">
      {/* Type de tâche */}
      <div className="flex items-center gap-2">
        {isSubtask ? (
          <Badge variant="secondary" className="flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            Sous-tâche
          </Badge>
        ) : (
          <Badge variant="default" className="flex items-center gap-1.5">
            <ListTree className="h-3.5 w-3.5" />
            Tâche principale
          </Badge>
        )}
        {isSubtask && task.parent_id && (
          <span className="text-muted-foreground text-xs">
            Tâche parente : {task.parent_id.substring(0, 8)}...
          </span>
        )}
      </div>
      {/* Vue d'ensemble */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <FileText className="h-4 w-4" />
            Vue d'ensemble
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statut et Priorité */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-muted-foreground mb-2 block text-sm font-medium">Statut</label>
              <Badge className={`${getStatusColor(task.status as string)} px-3 py-1 text-sm`}>
                <span className="mr-2">{statusIcons[task.status as string]}</span>
                {getStatusLabel(task.status as string)}
              </Badge>
            </div>
            <div>
              <label className="text-muted-foreground mb-2 block text-sm font-medium">
                Priorité
              </label>
              <Badge className={`${getPriorityColor(task.priority as string)} px-3 py-1 text-sm`}>
                <Flag className="mr-2 h-3 w-3" />
                {getPriorityLabel(task.priority as string)}
              </Badge>
            </div>
          </div>

          {/* Progression */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-muted-foreground text-sm font-medium">Progression</label>
              <span className="text-sm font-semibold">{task.progress || 0}%</span>
            </div>
            <Progress value={task.progress || 0} className="h-2" />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-muted-foreground mb-2 flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Date de début
              </label>
              <p className="text-sm">
                {task.start_date
                  ? format(new Date(task.start_date), 'PPP', { locale: fr })
                  : 'Non définie'}
              </p>
            </div>
            <div>
              <label className="text-muted-foreground mb-2 flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Date d'échéance
              </label>
              <p className="text-sm">
                {task.due_date
                  ? format(new Date(task.due_date), 'PPP', { locale: fr })
                  : 'Non définie'}
              </p>
            </div>
          </div>

          {/* Effort */}
          <div>
            <label className="text-muted-foreground mb-2 flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Effort estimé
            </label>
            <p className="text-sm">{task.effort_estimate_h || 0} heures</p>
          </div>
        </CardContent>
      </Card>

      {/* Attribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <User className="h-4 w-4" />
            Attribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-muted-foreground mb-2 flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Responsable
            </label>
            <p className="text-sm font-medium">{assigneeName}</p>
          </div>
          <div>
            <label className="text-muted-foreground mb-2 flex items-center gap-2 text-sm font-medium">
              <FolderKanban className="h-4 w-4" />
              Projet
            </label>
            <p className="text-sm">{projectName}</p>
          </div>
          <div>
            <label className="text-muted-foreground mb-2 flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4" />
              Département
            </label>
            <p className="text-sm">{departmentName}</p>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {task.description && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{task.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {(task as any).task_actions?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Actions ({(task as any).task_actions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(task as any).task_actions.map((action: any) => (
              <div
                key={action.id}
                className="hover:bg-muted/50 flex items-start gap-3 rounded-md p-2"
              >
                {action.is_done ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                ) : (
                  <Circle className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
                )}
                <div className="flex-1">
                  <p
                    className={`text-sm ${action.is_done ? 'text-muted-foreground line-through' : ''}`}
                  >
                    {action.title}
                  </p>
                  {action.due_date && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Échéance: {format(new Date(action.due_date), 'PPP', { locale: fr })}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {action.weight_percentage}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sous-tâches */}
      {task.subtasks?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <GitBranch className="h-4 w-4" />
              Sous-tâches ({task.subtasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {task.subtasks.map((subtask: any) => (
              <div key={subtask.id} className="hover:bg-muted/50 rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex-1 text-sm font-medium">{subtask.title}</p>
                  {subtask.status && (
                    <Badge variant="outline" className="text-xs">
                      {getStatusLabel(subtask.status)}
                    </Badge>
                  )}
                </div>
                {subtask.progress !== undefined && (
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={subtask.progress} className="h-1.5 flex-1" />
                    <span className="text-muted-foreground text-xs font-medium">
                      {subtask.progress}%
                    </span>
                  </div>
                )}
                {(subtask.assignee || subtask.due_date) && (
                  <div className="text-muted-foreground mt-2 flex items-center gap-3 text-xs">
                    {subtask.assignee && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {employees.find(e => e.id === subtask.assignee)?.full_name ||
                          subtask.assignee}
                      </div>
                    )}
                    {subtask.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(subtask.due_date), 'PPP', { locale: fr })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Commentaires (Placeholder) */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <MessageSquare className="h-4 w-4" />
            Commentaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm italic">Aucun commentaire pour le moment</p>
        </CardContent>
      </Card>

      {/* Documents (Placeholder) */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Paperclip className="h-4 w-4" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm italic">Aucun document attaché</p>
        </CardContent>
      </Card>

      {/* Historique des modifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <History className="h-4 w-4" />
            Historique des modifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* TODO: Implémenter l'historique depuis la table d'audit */}
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm italic">
              L'historique détaillé des modifications sera disponible prochainement
            </p>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-start gap-3 text-sm">
                <div className="bg-primary mt-1.5 h-2 w-2 shrink-0 rounded-full" />
                <div className="flex-1">
                  <p className="font-medium">Création</p>
                  <p className="text-muted-foreground text-xs">
                    {task.created_at
                      ? format(new Date(task.created_at), 'PPP à HH:mm', { locale: fr })
                      : 'N/A'}
                  </p>
                </div>
              </div>
              {task.updated_at && task.updated_at !== task.created_at && (
                <div className="flex items-start gap-3 text-sm">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium">Dernière modification</p>
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(task.updated_at), 'PPP à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métadonnées système */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Métadonnées système</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">ID</span>
            <span className="font-mono text-xs">{task.id}</span>
          </div>
          {task.parent_id && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ID Tâche parente</span>
              <span className="font-mono text-xs">{task.parent_id}</span>
            </div>
          )}
          {task.task_level !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Niveau</span>
              <span className="text-xs">{task.task_level}</span>
            </div>
          )}
          {task.display_order && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ordre d'affichage</span>
              <span className="text-xs">{task.display_order}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
