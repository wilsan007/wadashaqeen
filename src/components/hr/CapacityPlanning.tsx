import React, { useMemo } from 'react';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import { useTasks, Task } from '@/hooks/optimized';
import { useHRMinimal } from '@/hooks/useHRMinimal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface EmployeeCapacity {
  employeeId: string;
  name: string;
  avatarUrl?: string;
  jobTitle?: string;
  totalHours: number;
  assignedHours: number;
  absenceHours: number;
  utilization: number;
  status: 'overloaded' | 'optimal' | 'available';
  tasks: Task[];
  absences: any[];
}

export const CapacityPlanning: React.FC = () => {
  const { employees, loading: employeesLoading } = useEmployees();
  const { tasks, loading: tasksLoading } = useTasks();
  const { leaveRequests, loading: hrLoading } = useHRMinimal({
    enabled: {
      leaveRequests: true,
      employees: false,
      attendances: false,
      leaveBalances: false,
      departments: false,
      absenceTypes: false,
    },
    limits: { leaveRequests: 100 },
  });

  const capacities = useMemo(() => {
    if (!employees.length || !tasks.length) return [];

    return employees
      .map(emp => {
        // Filtrer les tâches assignées à cet employé et qui sont en cours (pas terminées)
        const empTasks = tasks.filter(
          t =>
            (t.assigned_to === emp.user_id || t.assignee_id === emp.user_id) &&
            t.status !== 'done' &&
            t.status !== 'completed'
        );

        // Filtrer les absences validées pour cet employé (sur la période courante - simplifié ici)
        const empAbsences = leaveRequests.filter(
          lr => lr.employee_id === emp.user_id && lr.status === 'approved'
        );

        // Calculer les heures d'absence (8h par jour d'absence)
        const absenceHours = empAbsences.reduce((acc, lr) => acc + lr.total_days * 8, 0);

        // Calculer la charge (somme des efforts estimés)
        // Si pas d'effort estimé, on compte 0 par défaut (ou une valeur arbitraire comme 4h)
        const assignedHours = empTasks.reduce((acc, t) => acc + (t.estimated_effort || 0), 0);

        // Capacité totale (basée sur weekly_hours ou 40h par défaut)
        // On considère ici une fenêtre de planification de 1 semaine pour simplifier l'affichage immédiat
        // On soustrait les heures d'absence de la capacité totale disponible
        const baseTotalHours = emp.weekly_hours || 40;
        const totalHours = Math.max(0, baseTotalHours - absenceHours);

        // Utilisation basée sur la capacité RESTANTE (après absences)
        // Si totalHours est 0 (vacances complètes), utilisation est 100% si assignedHours > 0, sinon 0%
        let utilization = 0;
        if (totalHours === 0) {
          utilization = assignedHours > 0 ? 100 : 0;
        } else {
          utilization = Math.min(100, Math.round((assignedHours / totalHours) * 100));
        }

        let status: 'overloaded' | 'optimal' | 'available' = 'available';
        if (assignedHours > totalHours) status = 'overloaded';
        else if (utilization >= 80) status = 'optimal';

        return {
          employeeId: emp.id,
          name: emp.full_name,
          avatarUrl: emp.avatar_url,
          jobTitle: emp.job_title,
          totalHours,
          assignedHours,
          absenceHours,
          utilization,
          status,
          tasks: empTasks,
          absences: empAbsences,
        } as EmployeeCapacity;
      })
      .sort((a, b) => b.utilization - a.utilization); // Trier par utilisation décroissante
  }, [employees, tasks, leaveRequests]);

  if (employeesLoading || tasksLoading || hrLoading) {
    return <Skeleton className="h-[600px] w-full rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-2xl font-bold text-transparent">
          Planification des Capacités
        </h2>
        <p className="text-muted-foreground">
          Analyse de la charge de travail et disponibilité des équipes
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-red-200/20 bg-red-500/10">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-red-500/20 p-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-700">
                {capacities.filter(c => c.status === 'overloaded').length}
              </div>
              <div className="text-sm font-medium text-red-600/80">Surchargés</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200/20 bg-emerald-500/10">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-emerald-500/20 p-3 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-700">
                {capacities.filter(c => c.status === 'available').length}
              </div>
              <div className="text-sm font-medium text-emerald-600/80">Disponibles</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200/20 bg-blue-500/10">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-500/20 p-3 text-blue-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-700">
                {Math.round(capacities.reduce((acc, c) => acc + c.assignedHours, 0))}h
              </div>
              <div className="text-sm font-medium text-blue-600/80">Heures planifiées</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {capacities.map(cap => (
          <Card key={cap.employeeId} className="overflow-hidden transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
                {/* Employee Info */}
                <div className="flex w-full min-w-[200px] items-center gap-3 md:w-1/4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={cap.avatarUrl} />
                    <AvatarFallback>{cap.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-semibold">{cap.name}</div>
                    <div className="text-muted-foreground text-xs">{cap.jobTitle || 'Employé'}</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex-1 space-y-2">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Utilisation</span>
                    <span
                      className={`font-bold ${
                        cap.status === 'overloaded'
                          ? 'text-red-600'
                          : cap.status === 'optimal'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                      }`}
                    >
                      {cap.utilization}% ({cap.assignedHours}h / {cap.totalHours}h)
                      {cap.absenceHours > 0 && (
                        <span className="text-muted-foreground ml-1">
                          (-{cap.absenceHours}h abs)
                        </span>
                      )}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, cap.utilization)}
                    className={`h-2.5 ${
                      cap.status === 'overloaded'
                        ? '[&>div]:bg-red-500'
                        : cap.status === 'optimal'
                          ? '[&>div]:bg-amber-500'
                          : '[&>div]:bg-emerald-500'
                    }`}
                  />
                </div>

                {/* Tasks Summary */}
                <div className="flex w-full flex-col gap-1 md:w-1/4">
                  <div className="text-muted-foreground mb-1 text-xs font-medium">
                    Tâches en cours
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cap.tasks.slice(0, 3).map(t => (
                      <Badge
                        key={t.id}
                        variant="secondary"
                        className="h-5 max-w-[100px] truncate px-1 text-[10px]"
                      >
                        {t.title}
                      </Badge>
                    ))}
                    {cap.tasks.length > 3 && (
                      <Badge variant="outline" className="h-5 px-1 text-[10px]">
                        +{cap.tasks.length - 3}
                      </Badge>
                    )}
                    {cap.tasks.length === 0 && (
                      <span className="text-muted-foreground text-xs italic">Aucune tâche</span>
                    )}
                  </div>

                  {/* Absences */}
                  {cap.absences.length > 0 && (
                    <div className="mt-2">
                      <div className="mb-1 text-xs font-medium text-red-500">Absences validées</div>
                      <div className="flex flex-wrap gap-1">
                        {cap.absences.map(a => (
                          <Badge
                            key={a.id}
                            variant="outline"
                            className="h-5 border-red-200 bg-red-50 px-1 text-[10px] text-red-600"
                          >
                            {new Date(a.start_date).toLocaleDateString()} ({a.total_days}j)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
