/**
 * Formulaire de Configuration d'Action Template
 * Avec assignation employé + timeline visuelle
 * Pattern: Linear/Asana - Configuration avancée
 */

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useHRMinimal } from '@/hooks/useHRMinimal';
import {
  getAvailableDays,
  getMaxOffsetDays,
  getTimelineInfo,
  extractFrequency,
  type FrequencyType,
} from '@/lib/scheduleUtils';
import { QuickInviteCollaborator } from '@/components/tasks/QuickInviteCollaborator';
import { useToast } from '@/hooks/use-toast';
import { useProjectEditPermissions } from '@/hooks/useProjectEditPermissions';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  User,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface ActionTemplateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ActionTemplateData) => void;
  initialData?: Partial<ActionTemplateData>;
  mainTaskAssignee?: {
    id: string;
    name: string;
  };
  mainTaskDate?: Date;
  activityKind?: 'recurring' | 'one_off'; // Type de l'activité parent
  rrule?: string | null; // Règle de récurrence pour déterminer la fourchette
}

export interface ActionTemplateData {
  title: string;
  description?: string;
  position: number;
  assignee_id?: string;
  assigned_name?: string;
  inherit_assignee: boolean;
  estimated_hours: number;
  offset_days: number; // Pour récurrente : offset en jours
  specific_date?: string; // Pour ponctuelle : date ISO (YYYY-MM-DD)
}

const actionTemplateSchema = z.object({
  title: z.string().min(1, 'Le titre est obligatoire'),
  description: z.string().optional(),
  position: z.number(),
  assignee_id: z.string().optional(),
  assigned_name: z.string().optional(),
  inherit_assignee: z.boolean(),
  estimated_hours: z.coerce.number().positive('La durée doit être supérieure à 0'),
  offset_days: z.number(),
  specific_date: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.inherit_assignee && !data.assignee_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Veuillez sélectionner un employé', path: ['assignee_id'] });
  }
});
type ActionTemplateFormValues = z.infer<typeof actionTemplateSchema>;

const DEFAULT_VALUES: ActionTemplateFormValues = {
  title: '', description: '', position: 0, inherit_assignee: true, estimated_hours: 1, offset_days: 0,
};

export const ActionTemplateForm: React.FC<ActionTemplateFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mainTaskAssignee,
  mainTaskDate = new Date(),
  activityKind = 'recurring',
  rrule = null,
}) => {
  const { toast } = useToast();
  const {
    employees,
    loading: loadingEmployees,
    refresh: refetchEmployees,
  } = useHRMinimal({
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
  const [showQuickInvite, setShowQuickInvite] = useState(false);

  // 🔒 Seuls PM+, admins et tenant_admin peuvent inviter des collaborateurs
  const projectPermissions = useProjectEditPermissions();
  const canInviteCollaborator = projectPermissions.canManageTeam;

  const form = useForm<ActionTemplateFormValues>({ resolver: zodResolver(actionTemplateSchema), defaultValues: DEFAULT_VALUES });

  const { t } = useTranslation();

  // Calculer la fréquence et les jours disponibles
  const frequency: FrequencyType = activityKind === 'recurring' ? extractFrequency(rrule) : null;
  const availableDays = getAvailableDays(frequency, activityKind);
  const maxOffset = getMaxOffsetDays(frequency, activityKind);
  const timelineInfo = getTimelineInfo(frequency, activityKind);
  const isDailyRecurrence = frequency === 'daily';

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && initialData) form.reset({ ...DEFAULT_VALUES, ...initialData });
  }, [open, initialData]);

  const offsetDays = form.watch('offset_days');
  const inheritAssignee = form.watch('inherit_assignee');
  const assigneeId = form.watch('assignee_id');
  const specificDate = form.watch('specific_date');

  const onSubmitValid = (data: ActionTemplateFormValues) => {
    if (activityKind === 'one_off') {
      if (!data.specific_date) {
        form.setError('specific_date', { message: t('operations.template.errorDateMiss') });
        return;
      }
      const selectedDate = new Date(data.specific_date);
      if (selectedDate < new Date(minDate) || selectedDate > new Date(maxDate)) {
        form.setError('specific_date', { message: t('operations.template.errorDateOob').replace('%s', new Date(minDate).toLocaleDateString('fr-FR')).replace('%s', new Date(maxDate).toLocaleDateString('fr-FR')) });
        return;
      }
    }
    const finalData = { ...data };
    if (!finalData.inherit_assignee && finalData.assignee_id) {
      const employee = employees.find(e => e.user_id === finalData.assignee_id);
      finalData.assigned_name = employee?.full_name || '';
    }
    onSubmit(finalData as ActionTemplateData);
    onOpenChange(false);
  };

  const handleOffsetChange = (newOffset: number) => {
    form.setValue('offset_days', newOffset);
  };

  const selectedEmployee = employees.find(e => e.user_id === assigneeId);
  const displayAssignee = inheritAssignee
    ? mainTaskAssignee
    : selectedEmployee
      ? { id: selectedEmployee.user_id, name: selectedEmployee.full_name }
      : null;

  // Calcul de la date effective de l'action
  const getActionDate = () => {
    const date = new Date(mainTaskDate);
    date.setDate(date.getDate() + offsetDays);
    return date;
  };

  // Calculer les dates min/max pour les activités ponctuelles
  const getMinMaxDates = () => {
    const minDate = new Date(mainTaskDate);
    const maxDate = new Date(mainTaskDate);

    // Pour ponctuel : ±15 jours
    const offsetRange = activityKind === 'one_off' ? 15 : maxOffset / 2;

    minDate.setDate(minDate.getDate() - offsetRange);
    maxDate.setDate(maxDate.getDate() + offsetRange);

    return {
      min: minDate.toISOString().split('T')[0], // Format YYYY-MM-DD
      max: maxDate.toISOString().split('T')[0],
    };
  };

  const { min: minDate, max: maxDate } = getMinMaxDates();

  // La timeline est maintenant calculée selon la fréquence (availableDays)

  const formatDate = (daysOffset: number) => {
    const date = new Date(mainTaskDate);
    date.setDate(date.getDate() + daysOffset);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {initialData?.title ? t('operations.template.titleEdit') : t('operations.template.titleNew')}
          </DialogTitle>
          <DialogDescription>
            {t('operations.template.description')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitValid)} className="space-y-6">
              {/* Informations de base */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">{t('operations.template.titleLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          id="title"
                          placeholder={t('operations.template.titlePlaceholder')}
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
                      <FormLabel>{t('operations.template.descLabel')}</FormLabel>
                      <FormControl>
                        <Textarea
                          id="description"
                          placeholder={t('operations.template.descPlaceholder')}
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimated_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('operations.template.durationLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          id="estimated_hours"
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Assignation */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="inherit_assignee" className="text-base font-semibold">
                    {t('operations.template.assignmentTitle')}
                  </Label>
                </div>

                {/* Switch: Hériter ou personnaliser */}
                <div className="bg-muted/50 flex items-center justify-between rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <UserCheck className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="font-medium">{t('operations.template.inheritTitle')}</p>
                      <p className="text-muted-foreground text-sm">
                        {t('operations.template.inheritDesc')}
                      </p>
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="inherit_assignee"
                    render={({ field }) => (
                      <Switch
                        id="inherit_assignee"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>

                {/* Sélection employé si non hérité */}
                {!inheritAssignee && (
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="assignee_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="required">{t('operations.template.assigneeLabel')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('operations.activity.selectEmployee')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {loadingEmployees ? (
                                <SelectItem value="loading" disabled>
                                  {t('operations.activity.loading')}
                                </SelectItem>
                              ) : employees.length === 0 ? (
                                <SelectItem value="empty" disabled>
                                  {t('operations.activity.noEmployee')}
                                </SelectItem>
                              ) : (
                                employees.map(employee => (
                                  <SelectItem key={employee.user_id} value={employee.user_id}>
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      <span>{employee.full_name}</span>
                                      {employee.job_title && (
                                        <span className="text-muted-foreground text-xs">
                                          ({employee.job_title})
                                        </span>
                                      )}
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
                    {canInviteCollaborator && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQuickInvite(true)}
                        className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        {t('operations.template.inviteBtn')}
                      </Button>
                    )}
                  </div>
                )}

                {/* Affichage de l'assigné actuel */}
                {displayAssignee && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{t('operations.template.assignedTo').replace('%s', displayAssignee.name)}</span>
                      {inheritAssignee && (
                        <Badge variant="secondary" className="text-xs">
                          {t('operations.template.inherited')}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Timeline ou Date selon le type */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">
                    {activityKind === 'recurring' ? t('operations.template.timePositionLabel') : t('operations.template.actionDateLabel')}
                  </Label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {activityKind === 'recurring'
                      ? t('operations.template.timePositionDesc')
                      : t('operations.template.actionDateDesc')}
                  </p>
                </div>

                {/* ACTIVITÉ RÉCURRENTE : Timeline avec offset de jours */}
                {activityKind === 'recurring' && (
                  <>
                    {/* Date calculée */}
                    <div className="bg-muted/50 rounded-lg border-2 border-dashed p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <p className="text-muted-foreground text-sm">{t('operations.template.parentFixed').replace(' (Fixe)', '')}</p>
                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                              🔒 Fixe
                            </Badge>
                          </div>
                          <p className="font-medium">
                            {mainTaskDate.toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="mb-1 flex items-center justify-end gap-2">
                            <p className="text-muted-foreground text-sm">{t('operations.template.thisActionVar').replace(' (Variable)', '')}</p>
                            <Badge
                              variant="outline"
                              className="border-blue-500 px-1.5 py-0 text-[10px] text-blue-600"
                            >
                              ✓ Variable
                            </Badge>
                          </div>
                          <p className="font-medium text-blue-600">
                            {getActionDate().toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-3 text-center text-xs">
                        {t('operations.template.parentFixedDesc')}
                      </p>
                    </div>

                    {/* Info fourchette disponible */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
                      <div className="mb-1 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          {t('operations.template.rangeTitle')}
                        </p>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {t('operations.template.rangeFormat')
                          .replace(
                            '%s',
                            `<strong>${availableDays[0] < 0 ? availableDays[0] : `J+${availableDays[0]}`}</strong>`
                          )
                          .replace(
                            '%s',
                            `<strong>${availableDays[availableDays.length - 1] > 0 ? `J+${availableDays[availableDays.length - 1]}` : availableDays[availableDays.length - 1]}</strong>`
                          )}
                      </p>
                    </div>

                    {/* Timeline interactive */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOffsetChange(offsetDays - 1)}
                          disabled={isDailyRecurrence || offsetDays <= availableDays[0]}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          {t('operations.template.prevDayBtn')}
                        </Button>

                        <Badge variant="outline" className="px-4 py-2">
                          {offsetDays === 0
                            ? t('operations.template.sameDayBadge')
                            : offsetDays > 0
                              ? `J+${offsetDays}`
                              : `J${offsetDays}`}
                        </Badge>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOffsetChange(offsetDays + 1)}
                          disabled={
                            isDailyRecurrence ||
                            offsetDays >= availableDays[availableDays.length - 1]
                          }
                        >
                          {t('operations.template.nextDayBtn')}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Grille timeline */}
                      <div className="relative">
                        {isDailyRecurrence ? (
                          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center dark:border-blue-800 dark:bg-blue-950/20">
                            <Calendar className="mx-auto mb-2 h-8 w-8 text-blue-600" />
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              {t('operations.template.dailyTasksTitle')}
                            </p>
                            <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                              {t('operations.template.dailyTasksDesc')}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1 overflow-x-auto pb-2">
                              {availableDays.map(offset => {
                                const isMainDay = offset === 0;
                                const isSelectedDay = offset === offsetDays;
                                const isPastDay = offset < offsetDays;
                                const isFutureDay = offset > offsetDays;

                                return (
                                  <button
                                    key={offset}
                                    type="button"
                                    onClick={() => handleOffsetChange(offset)}
                                    className={`relative min-w-[60px] flex-1 rounded-lg border-2 p-3 transition-all ${isMainDay
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                                        : isSelectedDay
                                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                                      } `}
                                  >
                                    <div className="text-center">
                                      <div className="mb-1 text-xs font-medium">
                                        {offset === 0
                                          ? 'J'
                                          : offset > 0
                                            ? `J+${offset}`
                                            : `J${offset}`}
                                      </div>
                                      <div className="text-muted-foreground text-[10px]">
                                        {formatDate(offset)}
                                      </div>
                                    </div>

                                    {isMainDay && (
                                      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                                        <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                                          Tâche
                                        </Badge>
                                      </div>
                                    )}

                                    {isSelectedDay && !isMainDay && (
                                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                                        <Check className="h-4 w-4 text-blue-600" />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Légende */}
                            <div className="text-muted-foreground mt-4 flex items-center justify-center gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <div className="h-3 w-3 rounded border-2 border-orange-500 bg-orange-50" />
                                <span>{t('operations.template.legendParent')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="h-3 w-3 rounded border-2 border-blue-500 bg-blue-50" />
                                <span>{t('operations.template.legendAction')}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Info sur la fréquence */}
                    <p className="text-muted-foreground text-center text-xs">{timelineInfo}</p>
                  </>
                )}

                {/* ACTIVITÉ PONCTUELLE : Date spécifique */}
                {activityKind === 'one_off' && (
                  <div className="space-y-4">
                    {/* Date de la tâche parent (lecture seule) */}
                    <div className="bg-muted/50 rounded-lg border-2 border-dashed p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Calendar className="text-muted-foreground h-4 w-4" />
                        <Label className="text-muted-foreground text-sm font-medium">
                          {t('operations.template.oneOffParentLabel')}
                        </Label>
                      </div>
                      <p className="text-lg font-medium">
                        {mainTaskDate.toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {t('operations.template.oneOffParentDesc')}
                      </p>
                    </div>

                    {/* Fourchette autorisée */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
                      <div className="mb-1 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          {t('operations.template.oneOffRangeTitle')}
                        </p>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {t('operations.template.oneOffRangeFormat')
                          .replace('%s', `<strong>${new Date(minDate).toLocaleDateString('fr-FR')}</strong>`)
                          .replace('%s', `<strong>${new Date(maxDate).toLocaleDateString('fr-FR')}</strong>`)}
                      </p>
                    </div>

                    {/* Sélection de la date */}
                    <FormField
                      control={form.control}
                      name="specific_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="required">{t('operations.template.oneOffDateLabel')}</FormLabel>
                          <FormControl>
                            <Input
                              id="specific_date"
                              type="date"
                              min={minDate}
                              max={maxDate}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-muted-foreground mt-1 text-xs">
                            {t('operations.template.oneOffDateHelp')}
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t('operations.template.cancelBtn')}
                </Button>
                <Button type="submit">{initialData?.title ? t('operations.template.saveBtn') : t('operations.template.createBtn')}</Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>

      {canInviteCollaborator && (
        <QuickInviteCollaborator
          open={showQuickInvite}
          onOpenChange={setShowQuickInvite}
          onSuccess={employeeId => {
            if (refetchEmployees) {
              refetchEmployees();
            }
            if (employeeId) {
              form.setValue('assignee_id', employeeId);
            }
            toast({
              title: t('operations.template.inviteSuccessTitle'),
              description: t('operations.template.inviteSuccessDesc'),
            });
          }}
        />
      )}
    </Dialog>
  );
};

export default ActionTemplateForm;
