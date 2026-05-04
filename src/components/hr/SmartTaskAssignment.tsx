import React, { useState, useMemo } from 'react';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import { useTasks, Task } from '@/hooks/optimized';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, AlertTriangle, Sparkles, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface AssignmentScore {
  employee: Employee;
  score: number;
  reasons: string[];
  utilization: number;
}

export const SmartTaskAssignment: React.FC = () => {
  const { employees, loading: employeesLoading } = useEmployees();
  const { tasks, updateTask } = useTasks();
  const [selectedTask, setSelectedTask] = useState<string>('');

  // Tâches non assignées ou à revoir
  const unassignedTasks = useMemo(() => {
    return tasks.filter(t => !t.assigned_to && !t.assignee_id && t.status !== 'done');
  }, [tasks]);

  // Calculer les scores pour la tâche sélectionnée
  const suggestions = useMemo(() => {
    if (!selectedTask || !employees.length) return [];

    const task = tasks.find(t => t.id === selectedTask);
    if (!task) return [];

    return employees
      .map(emp => {
        let score = 100;
        const reasons: string[] = [];

        // 1. Disponibilité / Charge actuelle
        const empTasks = tasks.filter(
          t =>
            (t.assigned_to === emp.user_id || t.assignee_id === emp.user_id) && t.status !== 'done'
        );
        const assignedHours = empTasks.reduce((acc, t) => acc + (t.estimated_effort || 0), 0);
        const totalHours = emp.weekly_hours || 40;
        const utilization = Math.min(100, Math.round((assignedHours / totalHours) * 100));

        if (utilization > 100) {
          score -= 50;
          reasons.push('⚠️ Surchargé (>100%)');
        } else if (utilization > 80) {
          score -= 20;
          reasons.push('⚠️ Charge élevée (>80%)');
        } else {
          score += 10;
          reasons.push('✅ Bonne disponibilité');
        }

        // 2. Compétences (Mock pour l'instant car pas de champ skills)
        // On pourrait imaginer vérifier le job_title
        if (emp.job_title && task.title.toLowerCase().includes(emp.job_title.toLowerCase())) {
          score += 20;
          reasons.push(`✅ Titre correspondant (${emp.job_title})`);
        }

        // 3. Historique (Mock)
        // Si a déjà travaillé sur ce projet
        const projectTasks = tasks.filter(
          t =>
            (t.assigned_to === emp.user_id || t.assignee_id === emp.user_id) &&
            t.project_id === task.project_id
        );
        if (projectTasks.length > 0) {
          score += 10;
          reasons.push(`✅ Connaît le projet (${projectTasks.length} tâches)`);
        }

        return {
          employee: emp,
          score: Math.max(0, Math.min(100, score)),
          reasons,
          utilization,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [selectedTask, employees, tasks]);

  const handleAssign = async (employeeId: string) => {
    try {
      await updateTask(selectedTask, {
        assigned_to: employeeId,
        assignee_id: employeeId,
      });
      toast.success('Tâche assignée avec succès !');
      setSelectedTask('');
    } catch (error) {
      toast.error("Erreur lors de l'assignation");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-2xl font-bold text-transparent">
          <Sparkles className="h-6 w-6 text-amber-500" />
          Assignation Intelligente
        </h2>
        <p className="text-muted-foreground">
          L'IA suggère le meilleur candidat pour vos tâches en fonction de la charge et des
          compétences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sélectionner une tâche à assigner</CardTitle>
          <CardDescription>
            {unassignedTasks.length} tâches en attente d'assignation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTask} onValueChange={setSelectedTask}>
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="Choisir une tâche..." />
            </SelectTrigger>
            <SelectContent>
              {unassignedTasks.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title} {t.priority && `(${t.priority})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTask && (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-500">
          <h3 className="text-lg font-semibold">Suggestions ({suggestions.length})</h3>

          <div className="grid gap-4">
            {suggestions.slice(0, 5).map(({ employee, score, reasons, utilization }, index) => (
              <Card
                key={employee.id}
                className={`border-l-4 ${
                  index === 0 ? 'border-l-amber-500 bg-amber-50/10' : 'border-l-transparent'
                }`}
              >
                <CardContent className="flex flex-col items-center gap-4 p-4 md:flex-row">
                  {/* Score */}
                  <div className="flex min-w-[60px] flex-col items-center justify-center">
                    <div
                      className={`text-2xl font-bold ${
                        score >= 80
                          ? 'text-green-600'
                          : score >= 50
                            ? 'text-amber-600'
                            : 'text-red-600'
                      }`}
                    >
                      {score}%
                    </div>
                    <div className="text-muted-foreground text-[10px] font-bold uppercase">
                      Match
                    </div>
                  </div>

                  {/* Employee Info */}
                  <div className="flex min-w-[200px] items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={employee.avatar_url} />
                      <AvatarFallback>
                        {employee.full_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{employee.full_name}</div>
                      <div className="text-muted-foreground text-xs">
                        {employee.job_title || 'Employé'}
                      </div>
                    </div>
                  </div>

                  {/* Reasons */}
                  <div className="flex flex-1 flex-wrap gap-2">
                    {reasons.map((reason, i) => (
                      <Badge key={i} variant="outline" className="bg-background/50">
                        {reason}
                      </Badge>
                    ))}
                  </div>

                  {/* Utilization */}
                  <div className="w-full space-y-1 md:w-[150px]">
                    <div className="flex justify-between text-xs">
                      <span>Charge</span>
                      <span>{utilization}%</span>
                    </div>
                    <Progress
                      value={utilization}
                      className={`h-2 ${
                        utilization > 100 ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'
                      }`}
                    />
                  </div>

                  {/* Action */}
                  <Button onClick={() => handleAssign(employee.user_id || employee.id)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assigner
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
