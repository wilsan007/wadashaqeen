import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useHRMinimal } from '@/hooks/useHRMinimal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { User, Calendar, CheckSquare, AlertCircle, UserCircle } from 'lucide-react';

const activitySchema = z
  .object({
    name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
    description: z.string().optional(),
    kind: z.enum(['recurring', 'one_off']),
    scope: z.enum(['org', 'department', 'team', 'person']),
    owner_employee_id: z.string().min(1, 'Vous devez assigner cette activité à une personne'),
    owner_name: z.string().optional(),
    department_id: z.string().optional(),
    project_id: z.string().optional(),
    task_title_template: z.string().optional(),
    is_active: z.boolean(),
    one_off_date: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === 'one_off' && !data.one_off_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La date est obligatoire pour une activité ponctuelle',
        path: ['one_off_date'],
      });
    }
  });

type ActivityFormValues = z.infer<typeof activitySchema>;

interface ActivityFormWithAssignmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ActivityData) => void;
  initialData?: Partial<ActivityData>;
  mode?: 'create' | 'edit';
}

export interface ActivityData {
  name: string;
  description?: string;
  kind: 'recurring' | 'one_off';
  scope: 'org' | 'department' | 'team' | 'person';
  owner_employee_id: string; // OBLIGATOIRE
  owner_name?: string;
  department_id?: string;
  project_id?: string;
  task_title_template?: string;
  is_active: boolean;

  // Pour ponctuelle : DATE OBLIGATOIRE
  one_off_date?: string; // Format ISO: YYYY-MM-DD
}

const DEFAULT_VALUES: ActivityFormValues = {
  name: '',
  description: '',
  kind: 'recurring',
  scope: 'org',
  owner_employee_id: '',
  task_title_template: 'Activité {{date}}',
  is_active: true,
};

export const ActivityFormWithAssignment: React.FC<ActivityFormWithAssignmentProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = 'create',
}) => {
  const { employees, loading: loadingEmployees } = useHRMinimal({
    enabled: {
      employees: true,
      leaveRequests: false,
      attendances: false,
      leaveBalances: false,
      departments: false,
      absenceTypes: false,
    },
    limits: { employees: 15 },
  });

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: DEFAULT_VALUES,
  });
  const [currentTab, setCurrentTab] = useState('info');

  useEffect(() => {
    if (open) {
      form.reset(initialData ? { ...DEFAULT_VALUES, ...initialData } : DEFAULT_VALUES);
    }
  }, [open]);

  const watchedKind = form.watch('kind');
  const watchedOwnerId = form.watch('owner_employee_id');
  const selectedEmployee = employees.find(e => e.id === watchedOwnerId);

  const onSubmitValid = (data: ActivityFormValues) => {
    const employee = employees.find(e => e.id === data.owner_employee_id);
    onSubmit({ ...data, owner_name: employee?.full_name || '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === 'edit' ? "Modifier l'activité" : 'Nouvelle activité opérationnelle'}
          </DialogTitle>
          <DialogDescription>
            Créez une activité récurrente ou ponctuelle avec son responsable
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitValid)} className="space-y-6">
              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList
                  className={`grid w-full ${watchedKind === 'recurring' ? 'grid-cols-3' : 'grid-cols-2'}`}
                >
                  <TabsTrigger value="info">Informations</TabsTrigger>
                  {watchedKind === 'recurring' && (
                    <TabsTrigger value="planification">Planification</TabsTrigger>
                  )}
                  <TabsTrigger value="assignment">Assignation</TabsTrigger>
                </TabsList>

                {/* Onglet 1: Informations de base */}
                <TabsContent value="info" className="mt-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="required">Nom de l'activité</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Rapport hebdomadaire des ventes"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Décrivez l'objectif de cette activité..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="kind"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="recurring">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Récurrente
                                </div>
                              </SelectItem>
                              <SelectItem value="one_off">
                                <div className="flex items-center gap-2">
                                  <CheckSquare className="h-4 w-4" />
                                  Ponctuelle
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="scope"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Portée</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="org">Organisation</SelectItem>
                              <SelectItem value="department">Département</SelectItem>
                              <SelectItem value="team">Équipe</SelectItem>
                              <SelectItem value="person">Individuelle</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="task_title_template"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template du titre de tâche</FormLabel>
                        <FormControl>
                          <Input placeholder="Activité {{date}}" {...field} />
                        </FormControl>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Variables disponibles : {'{'}
                          {'{'} date {'}'}
                          {'}'}, {'{'}
                          {'{'} isoWeek {'}'}
                          {'}'}, {'{'}
                          {'{'} year {'}'}
                          {'}'}, {'{'}
                          {'{'} month {'}'}
                          {'}'}, {'{'}
                          {'{'} day {'}'}
                          {'}'}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* DATE pour ponctuelle - affichée directement dans Info */}
                  {watchedKind === 'one_off' && (
                    <FormField
                      control={form.control}
                      name="one_off_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="required">Date de la tâche ponctuelle</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <p className="text-muted-foreground mt-1 text-xs">
                            Date à laquelle la tâche doit être effectuée
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </TabsContent>

                {/* Onglet 2: Planification (UNIQUEMENT pour récurrente) */}
                {watchedKind === 'recurring' && (
                  <TabsContent value="planification" className="mt-4 space-y-4">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                      <div className="flex items-start gap-3">
                        <Calendar className="mt-0.5 h-5 w-5 text-amber-600" />
                        <div>
                          <p className="font-medium text-amber-900 dark:text-amber-100">
                            Planification récurrente
                          </p>
                          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                            Définissez quand cette activité doit se répéter (quotidien, hebdomadaire,
                            mensuel)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-muted-foreground py-8 text-center">
                      <Calendar className="mx-auto mb-3 h-12 w-12 opacity-50" />
                      <p>La planification détaillée sera configurée après la création</p>
                      <p className="mt-1 text-sm">
                        Vous pourrez définir la fréquence, les jours, etc.
                      </p>
                    </div>
                  </TabsContent>
                )}

                {/* Onglet 3: Assignation OBLIGATOIRE */}
                <TabsContent value="assignment" className="mt-4 space-y-4">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                          Assignation obligatoire
                        </p>
                        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                          Chaque activité doit avoir un responsable. Cette personne sera assignée par
                          défaut aux tâches générées (sauf si les actions ont des assignations
                          spécifiques).
                        </p>
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="owner_employee_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="required">Responsable de l'activité</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un employé" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loadingEmployees ? (
                              <SelectItem value="loading" disabled>
                                Chargement...
                              </SelectItem>
                            ) : employees.length === 0 ? (
                              <SelectItem value="empty" disabled>
                                Aucun employé disponible
                              </SelectItem>
                            ) : (
                              employees.map(employee => (
                                <SelectItem key={employee.id} value={employee.id}>
                                  <div className="flex items-center gap-2">
                                    <UserCircle className="h-4 w-4" />
                                    <div>
                                      <div className="font-medium">{employee.full_name}</div>
                                      {employee.job_title && (
                                        <div className="text-muted-foreground text-xs">
                                          {employee.job_title}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Affichage employé sélectionné */}
                  {selectedEmployee && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                          <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{selectedEmployee.full_name}</p>
                          <div className="mt-1 flex items-center gap-2">
                            {selectedEmployee.job_title && (
                              <Badge variant="secondary" className="text-xs">
                                {selectedEmployee.job_title}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {selectedEmployee.employee_id}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <Separator />
              <div className="flex items-center justify-between pt-2">
                <div className="text-muted-foreground text-sm">
                  Étape {currentTab === 'info' ? '1' : '2'} sur 2
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Annuler
                  </Button>
                  {currentTab === 'info' ? (
                    <Button type="button" onClick={() => setCurrentTab('assignment')}>
                      Suivant : Assignation
                    </Button>
                  ) : (
                    <Button type="submit">
                      {mode === 'edit' ? 'Enregistrer' : "Créer l'activité"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityFormWithAssignment;
