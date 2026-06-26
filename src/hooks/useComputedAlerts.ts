import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertSolution } from './useAlerts';
import { CACHE_TTL } from '@/lib/queryConfig';

export interface ComputedAlert {
  id: string;
  type: string;
  code: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  entity_type?: string;
  entity_id?: string;
  entity_name?: string;
  context_data?: any;
  triggered_at: string;
  application_domain: 'hr' | 'project';
  recommendations: AlertSolution[];
}

// --- Fetch whether current user can view HR data ---
const fetchCanViewHRData = async (): Promise<boolean> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: userRoles, error } = await supabase
    .from('user_roles')
    .select(
      `
      *,
      roles:role_id (name)
    `
    )
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching user roles:', error);
    return false;
  }

  return (
    userRoles?.some(role => ['admin', 'tenant_admin', 'owner'].includes(role.roles.name)) || false
  );
};

// --- Fetch and compute alerts from SQL view ---
const fetchComputedAlerts = async (canViewHRData: boolean): Promise<ComputedAlert[]> => {
  const { data: alerts, error } = await supabase.from('current_alerts_view').select('*');

  if (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    throw error;
  }

  let filteredAlerts = alerts || [];

  // Filtrer selon les permissions
  if (!canViewHRData) {
    filteredAlerts = filteredAlerts.filter(alert => alert.application_domain !== 'hr');
  }

  // Mapper les données de la vue vers le format ComputedAlert
  // Trier par sévérité puis par date
  const mapped: ComputedAlert[] = filteredAlerts.map(alert => ({
    id: alert.id,
    type: alert.type,
    code: alert.code,
    title: alert.title,
    description: alert.description,
    severity: alert.severity as 'low' | 'medium' | 'high' | 'critical',
    category: alert.category,
    entity_type: alert.entity_type,
    entity_id: alert.entity_id,
    entity_name: alert.entity_name,
    context_data: alert.context_data,
    triggered_at: alert.triggered_at,
    application_domain: alert.application_domain as 'hr' | 'project',
    recommendations: [], // À implémenter si nécessaire
  }));

  const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  return mapped.sort((a, b) => {
    const severityDiff = (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0);
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime();
  });
};

export const useComputedAlerts = () => {
  const queryClient = useQueryClient();

  // Query 1: check HR permissions
  const { data: canViewHRData = false } = useQuery<boolean>({
    queryKey: ['computed-alerts', 'permissions'],
    queryFn: fetchCanViewHRData,
    ...CACHE_TTL.semiStatic,
  });

  // Query 2: fetch computed alerts (depends on permissions)
  const {
    data: computedAlerts = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<ComputedAlert[]>({
    queryKey: ['computed-alerts', canViewHRData],
    queryFn: () => fetchComputedAlerts(canViewHRData),
    ...CACHE_TTL.realtime,
  });

  const error = queryError ? (queryError as Error).message : null;

  const refreshAlerts = async () => {
    await queryClient.invalidateQueries({ queryKey: ['computed-alerts'] });
  };

  // Fonctions utilitaires
  const getActiveAlerts = () => computedAlerts;

  const getHighPriorityAlerts = () =>
    computedAlerts.filter(alert => alert.severity === 'high' || alert.severity === 'critical');

  const getCriticalAlerts = () => computedAlerts.filter(alert => alert.severity === 'critical');

  const getAlertsByCategory = (category: string) =>
    computedAlerts.filter(alert => alert.category === category);

  const getTopAlerts = (limit: number = 4) => computedAlerts.slice(0, limit);

  // Fonctions spécialisées pour filtrer par domaine d'application (utilisant la colonne DB)
  const getHRAlerts = () => computedAlerts.filter(alert => alert.application_domain === 'hr');

  const getHRHighPriorityAlerts = () =>
    getHRAlerts().filter(alert => alert.severity === 'high' || alert.severity === 'critical');

  const getTopHRAlerts = (limit: number = 4) => getHRAlerts().slice(0, limit);

  const getProjectAlerts = () =>
    computedAlerts.filter(alert => alert.application_domain === 'project');

  const getProjectHighPriorityAlerts = () =>
    getProjectAlerts().filter(alert => alert.severity === 'high' || alert.severity === 'critical');

  const getTopProjectAlerts = (limit: number = 4) => getProjectAlerts().slice(0, limit);

  return {
    computedAlerts,
    loading,
    error,
    refreshAlerts,
    getActiveAlerts,
    getHighPriorityAlerts,
    getCriticalAlerts,
    getAlertsByCategory,
    getTopAlerts,
    getHRAlerts,
    getHRHighPriorityAlerts,
    getTopHRAlerts,
    getProjectAlerts,
    getProjectHighPriorityAlerts,
    getTopProjectAlerts,
  };
};
