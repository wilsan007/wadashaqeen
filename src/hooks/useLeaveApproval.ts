/**
 * 🎯 useLeaveApproval - Hook pour gérer le workflow d'approbation des congés
 * Pattern: BambooHR, Workday, SAP SuccessFactors
 *
 * Fonctionnalités:
 * - Récupération des demandes en attente d'approbation
 * - Approbation/Rejet avec notes
 * - Historique des approbations
 * - Notifications automatiques
 * - Support multi-niveaux
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

export interface LeaveApproval {
  id: string;
  leave_request_id: string;
  tenant_id: string;
  approver_id: string;
  approver_level: number;
  status: 'pending' | 'approved' | 'rejected';
  decision_date?: string;
  notes?: string;
  sequence_order: number;
  is_final_approver: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  leave_request?: {
    id: string;
    employee_id: string;
    start_date: string;
    end_date: string;
    leave_type: string;
    reason?: string;
    status: string;
    employee?: {
      full_name: string;
      email: string;
      department?: string;
    };
  };
}

interface UseLeaveApprovalReturn {
  pendingApprovals: LeaveApproval[];
  myApprovals: LeaveApproval[];
  loading: boolean;
  error: Error | null;
  approveRequest: (approvalId: string, notes?: string) => Promise<boolean>;
  rejectRequest: (approvalId: string, reason: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const LEAVE_APPROVAL_SELECT = `
  *,
  leave_request:leave_requests(
    id,
    employee_id,
    start_date,
    end_date,
    leave_type,
    reason,
    status,
    employee:employees(
      full_name,
      email,
      department
    )
  )
`;

export const useLeaveApproval = (): UseLeaveApprovalReturn => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentTenant } = useTenant();

  // Helper to get current session user id
  const getCurrentUserId = async (): Promise<string> => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) throw new Error('Non authentifié');
    return session.session.user.id;
  };

  // Query: pending approvals
  const {
    data: pendingApprovals = [],
    isLoading: pendingLoading,
    error: pendingError,
    refetch: refetchPending,
  } = useQuery<LeaveApproval[]>({
    queryKey: ['leave-approvals', 'pending', currentTenant?.id],
    queryFn: async () => {
      const userId = await getCurrentUserId();
      const { data, error: fetchError } = await supabase
        .from('leave_approvals')
        .select(LEAVE_APPROVAL_SELECT)
        .eq('tenant_id', currentTenant!.id)
        .eq('approver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return (data as any) || [];
    },
    enabled: !!currentTenant?.id,
  });

  // Query: my approvals (history)
  const {
    data: myApprovals = [],
    isLoading: myApprovalsLoading,
    error: myApprovalsError,
    refetch: refetchMyApprovals,
  } = useQuery<LeaveApproval[]>({
    queryKey: ['leave-approvals', 'my', currentTenant?.id],
    queryFn: async () => {
      const userId = await getCurrentUserId();
      const { data, error: fetchError } = await supabase
        .from('leave_approvals')
        .select(LEAVE_APPROVAL_SELECT)
        .eq('tenant_id', currentTenant!.id)
        .eq('approver_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      return (data as any) || [];
    },
    enabled: !!currentTenant?.id,
  });

  const loading = pendingLoading || myApprovalsLoading;
  const error = (pendingError || myApprovalsError) as Error | null;

  const invalidateApprovals = () => {
    queryClient.invalidateQueries({ queryKey: ['leave-approvals', 'pending', currentTenant?.id] });
    queryClient.invalidateQueries({ queryKey: ['leave-approvals', 'my', currentTenant?.id] });
  };

  // Mutation: approve request
  const approveMutation = useMutation({
    mutationFn: async ({ approvalId, notes }: { approvalId: string; notes?: string }) => {
      const { data, error } = await supabase.rpc('process_leave_approval', {
        p_approval_id: approvalId,
        p_status: 'approved',
        p_notes: notes || null,
      });
      if (error) throw error;
      const result = data as { success: boolean; message: string; final_status: string };
      if (!result.success) throw new Error(result.message || "Erreur lors de l'approbation");
      return result;
    },
    onSuccess: result => {
      toast({ title: '✅ Demande approuvée', description: result.message });
      invalidateApprovals();
    },
    onError: () => {
      toast({
        title: '❌ Erreur',
        description: "Impossible d'approuver la demande",
        variant: 'destructive',
      });
    },
  });

  const approveRequest = async (approvalId: string, notes?: string): Promise<boolean> => {
    try {
      await approveMutation.mutateAsync({ approvalId, notes });
      return true;
    } catch (err) {
      console.error('Erreur approbation:', err);
      return false;
    }
  };

  // Mutation: reject request
  const rejectMutation = useMutation({
    mutationFn: async ({ approvalId, reason }: { approvalId: string; reason: string }) => {
      const { data, error } = await supabase.rpc('process_leave_approval', {
        p_approval_id: approvalId,
        p_status: 'rejected',
        p_notes: reason,
      });
      if (error) throw error;
      const result = data as { success: boolean; message: string };
      if (!result.success) throw new Error(result.message || 'Erreur lors du rejet');
      return result;
    },
    onSuccess: result => {
      toast({ title: '❌ Demande rejetée', description: result.message });
      invalidateApprovals();
    },
    onError: () => {
      toast({
        title: '❌ Erreur',
        description: 'Impossible de rejeter la demande',
        variant: 'destructive',
      });
    },
  });

  const rejectRequest = async (approvalId: string, reason: string): Promise<boolean> => {
    if (!reason.trim()) {
      toast({
        title: '⚠️ Attention',
        description: 'Veuillez fournir une raison pour le rejet',
        variant: 'destructive',
      });
      return false;
    }
    try {
      await rejectMutation.mutateAsync({ approvalId, reason });
      return true;
    } catch (err) {
      console.error('Erreur rejet:', err);
      return false;
    }
  };

  /**
   * Rafraîchir les données
   */
  const refresh = async () => {
    await Promise.all([refetchPending(), refetchMyApprovals()]);
  };

  return {
    pendingApprovals,
    myApprovals,
    loading,
    error,
    approveRequest,
    rejectRequest,
    refresh,
  };
};
