import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Loader2 } from 'lucide-react';
import { type Task } from '@/hooks/optimized';
import { useEmployees } from '@/hooks/useEmployees';
import { useTaskEditPermissions } from '@/hooks/useTaskEditPermissions';
import { TaskTitleSection, TaskProperties, TaskDescription, TaskActionsSubtasks } from './edit';
import { TaskDetailsReadView } from './TaskDetailsReadView';

interface TaskAction {
  id: string;
  name: string;
  description?: string;
  status?: string;
  progress?: number;
}

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSave: (taskData: any) => void;
}

export const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({
  open,
  onOpenChange,
  task,
  onSave,
}) => {
  // États de base
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'todo' | 'doing' | 'blocked' | 'done'>('todo');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [effortEstimate, setEffortEstimate] = useState<number>(0);
  const [department, setDepartment] = useState('');
  const [project, setProject] = useState('');
  const [actions, setActions] = useState<TaskAction[]>([]);
  const [showActions, setShowActions] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'edit'>('details');

  // Hooks pour les données
  const { employees, departments } = useEmployees();

  // 🔒 Vérifier les permissions d'édition
  const permissions = useTaskEditPermissions({ task });

  // Mock projects data (useEmployees doesn't provide projects)
  const projects = [
    { id: '1', name: 'Gantt Flow Next' },
    { id: '2', name: 'Projet Alpha' },
    { id: '3', name: 'Projet Beta' },
  ];

  const statusIcons = {
    todo: '📝',
    doing: '⚡',
    blocked: '🚫',
    done: '✅',
  };

  const priorityIcons = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    urgent: '🔴',
  };

  // Initialiser les champs quand la tâche change
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus((task.status as any) || 'todo');
      setStartDate(task.start_date ? new Date(task.start_date) : undefined);
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setAssignee(task.assignee_id || '');
      setPriority((task.priority as any) || 'medium');
      setEffortEstimate(task.effort_estimate_h || 0);
      setDepartment(task.department_id || '');
      setProject(task.project_id || '');
      setActions((task as any).actions || []);
    }
  }, [task]);

  const handleSave = async () => {
    if (!title.trim() || !assignee) return;

    try {
      setLoading(true);
      await onSave({
        ...task,
        title,
        description,
        status,
        start_date: startDate?.toISOString(),
        due_date: dueDate?.toISOString(),
        assignee_id: assignee,
        priority,
        effort_estimate_h: effortEstimate,
        department_id: department || null,
        project_id: project || null,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur:', error);
      // alert('Erreur lors de la modification de la tâche'); // Avoid alert
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/20 flex max-h-[85vh] w-[90vw] max-w-4xl flex-col overflow-hidden border p-0 shadow-lg sm:w-[88vw] sm:rounded-2xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span>{title || 'Nouvelle tâche'}</span>
          </DialogTitle>
          <DialogDescription>Détails et configuration de la tâche</DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={v => setActiveTab(v as 'details' | 'edit')}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="shrink-0 px-6 pt-4">
            <TabsList
              className={`grid w-full max-w-md ${permissions.canEdit ? 'grid-cols-2' : 'grid-cols-1'}`}
            >
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Détails
              </TabsTrigger>
              {permissions.canEdit && (
                <TabsTrigger value="edit" className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Modifier
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="details" className="mt-0 min-h-0 flex-1 overflow-y-auto">
            <div className="px-6 py-6">
              <TaskDetailsReadView
                task={task}
                employees={employees}
                departments={departments}
                projects={projects}
                statusIcons={statusIcons}
                priorityIcons={priorityIcons}
              />
            </div>
          </TabsContent>

          {permissions.canEdit && (
            <TabsContent value="edit" className="mt-0 min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-6 px-6 py-6">
                {/* Titre et Actions Rapides */}
                <div className="flex flex-col gap-4">
                  <TaskTitleSection
                    title={title}
                    onTitleChange={setTitle}
                    hasParent={!!task.parent_id}
                  />
                </div>

                {/* Informations Générales */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">Informations Générales</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-6">
                    <TaskProperties
                      status={status}
                      onStatusChange={(value: any) => setStatus(value)}
                      startDate={startDate}
                      onStartDateChange={setStartDate}
                      endDate={dueDate}
                      onEndDateChange={setDueDate}
                      effortEstimate={effortEstimate}
                      onEffortChange={setEffortEstimate}
                      assignee={assignee}
                      onAssigneeChange={setAssignee}
                      priority={priority}
                      onPriorityChange={(value: any) => setPriority(value)}
                      department={department}
                      onDepartmentChange={setDepartment}
                      project={project}
                      onProjectChange={setProject}
                      employees={employees}
                      departments={departments}
                      projects={projects}
                      statusIcons={statusIcons}
                      priorityIcons={priorityIcons}
                    />
                  </CardContent>
                </Card>

                {/* Description */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TaskDescription
                      description={description}
                      onDescriptionChange={setDescription}
                    />
                  </CardContent>
                </Card>

                {/* Sous-tâches et Actions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">Sous-tâches & Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TaskActionsSubtasks
                      actions={actions}
                      onActionsChange={setActions}
                      showActions={showActions}
                      onToggleActions={() => setShowActions(!showActions)}
                      showSubtasks={showSubtasks}
                      onToggleSubtasks={() => setShowSubtasks(!showSubtasks)}
                    />
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="bg-background shrink-0 border-t px-6 py-4">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={loading || !title.trim() || !assignee}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
              </DialogFooter>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
