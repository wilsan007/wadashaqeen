import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthFilterContext } from '@/contexts/AuthContext';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';
import { useToast } from '@/hooks/use-toast';
import { CACHE_TTL } from '@/lib/queryConfig';

export interface ExpenseReport {
  id: string;
  employee_id: string;
  employee_name: string;
  title: string;
  total_amount: number;
  currency: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  submission_date?: string;
  approval_date?: string;
  approved_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface ExpenseItem {
  id: string;
  report_id: string;
  expense_date: string;
  category_id?: string;
  category_name: string;
  description: string;
  amount: number;
  currency: string;
  receipt_url?: string;
  mileage?: number;
  location?: string;
  created_at: string;
  tenant_id?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon?: string;
  max_amount?: number;
  requires_receipt: boolean;
  color: string;
  created_at: string;
  tenant_id?: string;
}

interface ExpenseData {
  expenseReports: ExpenseReport[];
  expenseItems: ExpenseItem[];
  expenseCategories: ExpenseCategory[];
}

export function useExpenseManagement() {
  const { userContext } = useAuthFilterContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const userId = userContext?.userId ?? null;

  // ============================================================
  // QUERY — chargement des 3 collections en parallèle
  // ============================================================
  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<ExpenseData>({
    queryKey: ['expenses', userId],
    queryFn: async () => {
      if (!userContext) {
        return { expenseReports: [], expenseItems: [], expenseCategories: [] };
      }

      let reportsQuery = supabase
        .from('expense_reports')
        .select('*')
        .order('created_at', { ascending: false });
      reportsQuery = applyRoleFilters(reportsQuery, userContext, 'expense_reports');

      let itemsQuery = supabase
        .from('expense_items')
        .select('*')
        .order('expense_date', { ascending: false });
      itemsQuery = applyRoleFilters(itemsQuery, userContext, 'expense_items');

      let categoriesQuery = supabase.from('expense_categories').select('*').order('name');
      categoriesQuery = applyRoleFilters(categoriesQuery, userContext, 'expense_categories');

      const [reportsRes, itemsRes, categoriesRes] = await Promise.all([
        reportsQuery,
        itemsQuery,
        categoriesQuery,
      ]);

      if (reportsRes.error) throw reportsRes.error;
      if (itemsRes.error) throw itemsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      return {
        expenseReports: (reportsRes.data as ExpenseReport[]) || [],
        expenseItems: (itemsRes.data as ExpenseItem[]) || [],
        expenseCategories: (categoriesRes.data as ExpenseCategory[]) || [],
      };
    },
    enabled: !!userContext,
    ...CACHE_TTL.realtime,
  });

  const expenseReports = data?.expenseReports ?? [];
  const expenseItems = data?.expenseItems ?? [];
  const expenseCategories = data?.expenseCategories ?? [];
  const error = queryError ? (queryError as Error).message : null;

  // ============================================================
  // MUTATION — créer un rapport de frais
  // ============================================================
  const createReportMutation = useMutation({
    mutationFn: async (reportData: Omit<ExpenseReport, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('expense_reports').insert(reportData);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Note de frais créée avec succès' });
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
    },
    onError: (err: any) => {
      console.error('Error creating expense report:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la note de frais',
        variant: 'destructive',
      });
    },
  });

  const createExpenseReport = (data: Omit<ExpenseReport, 'id' | 'created_at' | 'updated_at'>) =>
    createReportMutation.mutate(data);

  // ============================================================
  // MUTATION — mettre à jour le statut d'un rapport
  // ============================================================
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      reportId,
      status,
      rejectionReason,
    }: {
      reportId: string;
      status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
      rejectionReason?: string;
    }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'approved') {
        updateData.approval_date = new Date().toISOString().split('T')[0];
      }

      if (status === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('expense_reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Statut de la note de frais mis à jour' });
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
    },
    onError: (err: any) => {
      console.error('Error updating expense report status:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    },
  });

  const updateExpenseReportStatus = (
    reportId: string,
    status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid',
    rejectionReason?: string
  ) => updateStatusMutation.mutate({ reportId, status, rejectionReason });

  // ============================================================
  // MUTATION — créer une catégorie
  // ============================================================
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: Omit<ExpenseCategory, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('expense_categories').insert(categoryData);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Catégorie créée avec succès' });
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
    },
    onError: (err: any) => {
      console.error('Error creating expense category:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la catégorie',
        variant: 'destructive',
      });
    },
  });

  const createExpenseCategory = (data: Omit<ExpenseCategory, 'id' | 'created_at'>) =>
    createCategoryMutation.mutate(data);

  // ============================================================
  // Helpers purs (pas de fetch)
  // ============================================================
  const getTotalByStatus = (status: string) =>
    expenseReports
      .filter(report => report.status === status)
      .reduce((total, report) => total + report.total_amount, 0);

  const getReportItems = (reportId: string) =>
    expenseItems.filter(item => item.report_id === reportId);

  return {
    expenseReports,
    expenseItems,
    expenseCategories,
    loading,
    error,
    refetch,
    createExpenseReport,
    updateExpenseReportStatus,
    createExpenseCategory,
    getTotalByStatus,
    getReportItems,
  };
}
