/**
 * 💼 Hook useHRSelfService - Système RH Complet pour Employés
 * Pattern: Expensify, BambooHR, Workday, SAP Concur
 *
 * Gère:
 * - Notes de frais
 * - Justificatifs d'absence
 * - Demandes administratives
 * - Timesheets
 * - Demandes de télétravail
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// TYPES - Notes de Frais
// ============================================================================
export interface ExpenseReport {
  id: string;
  employee_id: string;
  title: string;
  description: string | null;
  category: string;
  amount: number;
  currency: string;
  expense_date: string;
  receipt_url: string | null;
  status: 'draft' | 'submitted' | 'approved_manager' | 'approved_finance' | 'rejected' | 'paid';
  submitted_at: string | null;
  approved_by_manager: string | null;
  approved_manager_at: string | null;
  rejection_reason: string | null;
  payment_date: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TYPES - Justificatifs d'Absence
// ============================================================================
export interface AbsenceJustification {
  id: string;
  employee_id: string;
  absence_date: string;
  absence_type: 'sick_leave' | 'medical_appointment' | 'family_emergency' | 'other';
  justification_type: 'medical_certificate' | 'official_document' | 'declaration';
  document_url: string | null;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  is_paid: boolean;
  created_at: string;
}

// ============================================================================
// TYPES - Demandes Administratives
// ============================================================================
export interface AdministrativeRequest {
  id: string;
  employee_id: string;
  request_type:
    | 'employment_certificate'
    | 'salary_advance'
    | 'rib_change'
    | 'situation_change'
    | 'other';
  title: string;
  description: string;
  amount: number | null;
  document_url: string | null;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  processed_by: string | null;
  processed_at: string | null;
  response: string | null;
  completion_date: string | null;
  created_at: string;
}

// ============================================================================
// TYPES - Timesheet
// ============================================================================
export interface Timesheet {
  id: string;
  employee_id: string;
  week_start_date: string;
  week_end_date: string;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
}

export interface TimesheetEntry {
  id: string;
  timesheet_id: string;
  work_date: string;
  project_id: string | null;
  task_id: string | null;
  hours: number;
  description: string | null;
  is_overtime: boolean;
}

// ============================================================================
// TYPES - Télétravail
// ============================================================================
export interface RemoteWorkRequest {
  id: string;
  employee_id: string;
  request_date: string;
  start_date: string;
  end_date: string;
  frequency: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================
export function useHRSelfService() {
  const { userContext, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const userId = profile?.userId ?? null;
  const enabled = !authLoading && !!userContext;

  // ============================================================================
  // QUERIES — SELECT
  // ============================================================================

  const expenseReportsQuery = useQuery<ExpenseReport[], Error>({
    queryKey: ['hr-self-service-expenses', userId],
    enabled,
    queryFn: async () => {
      let query = supabase
        .from('expense_reports')
        .select('*')
        .order('created_at', { ascending: false });

      query = applyRoleFilters(query, userContext!, 'expense_reports');

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const absenceJustificationsQuery = useQuery<AbsenceJustification[], Error>({
    queryKey: ['hr-self-service-absences', userId],
    enabled,
    queryFn: async () => {
      let query = supabase
        .from('absence_justifications')
        .select('*')
        .order('absence_date', { ascending: false });

      query = applyRoleFilters(query, userContext!, 'absence_justifications');

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const administrativeRequestsQuery = useQuery<AdministrativeRequest[], Error>({
    queryKey: ['hr-self-service-admin-requests', userId],
    enabled,
    queryFn: async () => {
      let query = supabase
        .from('administrative_requests')
        .select('*')
        .order('created_at', { ascending: false });

      query = applyRoleFilters(query, userContext!, 'administrative_requests');

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const timesheetsQuery = useQuery<Timesheet[], Error>({
    queryKey: ['hr-self-service-timesheets', userId],
    enabled,
    queryFn: async () => {
      let query = supabase
        .from('timesheets')
        .select('*')
        .order('week_start_date', { ascending: false });

      query = applyRoleFilters(query, userContext!, 'timesheets');

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const remoteWorkRequestsQuery = useQuery<RemoteWorkRequest[], Error>({
    queryKey: ['hr-self-service-remote', userId],
    enabled,
    queryFn: async () => {
      let query = supabase
        .from('remote_work_requests')
        .select('*')
        .order('created_at', { ascending: false });

      query = applyRoleFilters(query, userContext!, 'remote_work_requests');

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  // ============================================================================
  // HELPER — récupérer l'employee_id courant
  // ============================================================================

  const getEmployeeId = async (): Promise<string> => {
    if (!profile) throw new Error('Utilisateur non connecté');
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', profile.userId)
      .single();
    if (!employee) throw new Error('Employé non trouvé');
    return employee.id;
  };

  // ============================================================================
  // MUTATIONS — Notes de Frais
  // ============================================================================

  const createExpenseMutation = useMutation({
    mutationFn: async (expense: Partial<ExpenseReport>) => {
      const employeeId = await getEmployeeId();
      const { error } = await supabase.from('expense_reports').insert({
        ...expense,
        employee_id: employeeId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-self-service-expenses', userId] });
      toast({
        title: 'Note de frais créée',
        description: 'Votre note de frais a été enregistrée',
      });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  const submitExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('expense_reports')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', expenseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-self-service-expenses', userId] });
      toast({
        title: 'Note de frais soumise',
        description: 'Votre manager recevra une notification',
      });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  const approveExpenseMutation = useMutation({
    mutationFn: async ({
      expenseId,
      approverId,
      approvalLevel,
    }: {
      expenseId: string;
      approverId: string;
      approvalLevel: 'manager' | 'finance';
    }) => {
      const updates =
        approvalLevel === 'manager'
          ? {
              status: 'approved_manager',
              approved_by_manager: approverId,
              approved_manager_at: new Date().toISOString(),
            }
          : {
              status: 'approved_finance',
              approved_by_finance: approverId,
              approved_finance_at: new Date().toISOString(),
            };

      const { error } = await supabase
        .from('expense_reports')
        .update(updates)
        .eq('id', expenseId);
      if (error) throw error;
      return approvalLevel;
    },
    onSuccess: (approvalLevel) => {
      queryClient.invalidateQueries({ queryKey: ['hr-self-service-expenses', userId] });
      toast({
        title: 'Note de frais approuvée',
        description: `Approuvée par ${approvalLevel === 'manager' ? 'le manager' : 'la finance'}`,
      });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  // ============================================================================
  // MUTATIONS — Justificatifs d'Absence
  // ============================================================================

  const createAbsenceMutation = useMutation({
    mutationFn: async (justification: Partial<AbsenceJustification>) => {
      const employeeId = await getEmployeeId();
      const { error } = await supabase.from('absence_justifications').insert({
        ...justification,
        employee_id: employeeId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-self-service-absences', userId] });
      toast({
        title: 'Justificatif soumis',
        description: "Votre justificatif d'absence a été enregistré",
      });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  // ============================================================================
  // MUTATIONS — Demandes Administratives
  // ============================================================================

  const createAdminRequestMutation = useMutation({
    mutationFn: async (request: Partial<AdministrativeRequest>) => {
      const employeeId = await getEmployeeId();
      const { error } = await supabase.from('administrative_requests').insert({
        ...request,
        employee_id: employeeId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-self-service-admin-requests', userId] });
      toast({
        title: 'Demande envoyée',
        description: 'Votre demande administrative a été enregistrée',
      });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  // ============================================================================
  // MUTATIONS — Timesheets
  // ============================================================================

  const createTimesheetMutation = useMutation({
    mutationFn: async (timesheet: Partial<Timesheet>) => {
      const employeeId = await getEmployeeId();
      const { error } = await supabase.from('timesheets').insert({
        ...timesheet,
        employee_id: employeeId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-self-service-timesheets', userId] });
      toast({
        title: 'Timesheet créé',
        description: 'Votre feuille de temps a été créée',
      });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  // ============================================================================
  // MUTATIONS — Télétravail
  // ============================================================================

  const createRemoteWorkMutation = useMutation({
    mutationFn: async (request: Partial<RemoteWorkRequest>) => {
      const employeeId = await getEmployeeId();
      const { error } = await supabase.from('remote_work_requests').insert({
        ...request,
        employee_id: employeeId,
        request_date: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-self-service-remote', userId] });
      toast({
        title: 'Demande envoyée',
        description: 'Votre demande de télétravail a été soumise',
      });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  // ============================================================================
  // ÉTAT CONSOLIDÉ
  // ============================================================================

  const isLoading =
    expenseReportsQuery.isLoading ||
    absenceJustificationsQuery.isLoading ||
    administrativeRequestsQuery.isLoading ||
    timesheetsQuery.isLoading ||
    remoteWorkRequestsQuery.isLoading;

  const errorMessage =
    expenseReportsQuery.error?.message ??
    absenceJustificationsQuery.error?.message ??
    administrativeRequestsQuery.error?.message ??
    timesheetsQuery.error?.message ??
    remoteWorkRequestsQuery.error?.message ??
    null;

  // ============================================================================
  // RETOUR API — interface identique à l'original
  // ============================================================================

  return {
    // Data
    expenseReports: expenseReportsQuery.data ?? [],
    absenceJustifications: absenceJustificationsQuery.data ?? [],
    administrativeRequests: administrativeRequestsQuery.data ?? [],
    timesheets: timesheetsQuery.data ?? [],
    remoteWorkRequests: remoteWorkRequestsQuery.data ?? [],

    // States
    loading: isLoading,
    error: errorMessage,

    // Actions - Notes de Frais
    fetchExpenseReports: () =>
      queryClient.invalidateQueries({ queryKey: ['hr-self-service-expenses', userId] }),
    createExpenseReport: (expense: Partial<ExpenseReport>) =>
      createExpenseMutation.mutateAsync(expense),
    submitExpenseReport: (expenseId: string) =>
      submitExpenseMutation.mutateAsync(expenseId),
    approveExpenseReport: (
      expenseId: string,
      approverId: string,
      approvalLevel: 'manager' | 'finance'
    ) => approveExpenseMutation.mutateAsync({ expenseId, approverId, approvalLevel }),

    // Actions - Justificatifs
    fetchAbsenceJustifications: () =>
      queryClient.invalidateQueries({ queryKey: ['hr-self-service-absences', userId] }),
    createAbsenceJustification: (justification: Partial<AbsenceJustification>) =>
      createAbsenceMutation.mutateAsync(justification),

    // Actions - Demandes Admin
    fetchAdministrativeRequests: () =>
      queryClient.invalidateQueries({ queryKey: ['hr-self-service-admin-requests', userId] }),
    createAdministrativeRequest: (request: Partial<AdministrativeRequest>) =>
      createAdminRequestMutation.mutateAsync(request),

    // Actions - Timesheets
    fetchTimesheets: () =>
      queryClient.invalidateQueries({ queryKey: ['hr-self-service-timesheets', userId] }),
    createTimesheet: (timesheet: Partial<Timesheet>) =>
      createTimesheetMutation.mutateAsync(timesheet),

    // Actions - Télétravail
    fetchRemoteWorkRequests: () =>
      queryClient.invalidateQueries({ queryKey: ['hr-self-service-remote', userId] }),
    createRemoteWorkRequest: (request: Partial<RemoteWorkRequest>) =>
      createRemoteWorkMutation.mutateAsync(request),

    // Utils
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-self-service-expenses', userId] });
      queryClient.invalidateQueries({ queryKey: ['hr-self-service-absences', userId] });
      queryClient.invalidateQueries({ queryKey: ['hr-self-service-admin-requests', userId] });
      queryClient.invalidateQueries({ queryKey: ['hr-self-service-timesheets', userId] });
      queryClient.invalidateQueries({ queryKey: ['hr-self-service-remote', userId] });
    },
  };
}
