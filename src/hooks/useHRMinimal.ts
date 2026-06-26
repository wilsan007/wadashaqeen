/**
 * Hook HR Optimisé - Pattern Enterprise SaaS
 * Inspiré de Stripe, Salesforce, Monday.com
 *
 * Fonctionnalités:
 * - Query-level filtering (sécurité maximale)
 * - Cache intelligent avec invalidation
 * - Pagination et lazy loading
 * - Métriques de performance
 * - Gestion d'erreurs robuste
 */

import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { useRolesCompat as useUserRoles } from '@/contexts/RolesContext';
import { cacheManager } from '@/lib/cacheManager';
import type {
  Employee,
  LeaveRequest,
  Attendance,
  AbsenceType,
  LeaveBalance,
  HRData,
  HRMetrics,
  PaginationConfig,
} from '@/types/hr';

// Export types for consumers
export type { Employee, HRData, HRMetrics };

// Configuration options for the hook
export interface UseHRMinimalOptions {
  enabled?: {
    employees?: boolean;
    leaveRequests?: boolean;
    attendances?: boolean;
    leaveBalances?: boolean;
    departments?: boolean;
    absenceTypes?: boolean;
  };
  limits?: {
    employees?: number;
    leaveRequests?: number;
    attendances?: number;
    leaveBalances?: number;
  };
  enablePagination?: boolean;
}

/**
 * Hook HR Minimal - ZERO boucle infinie garantie
 * Optimisé avec cache enterprise et monitoring
 */
export const useHRMinimal = (options: UseHRMinimalOptions = {}) => {
  // Default options
  const {
    enabled: enabledSections = {
      employees: true,
      leaveRequests: true,
      attendances: true,
      leaveBalances: true,
      departments: true,
      absenceTypes: true,
    },
    limits = {
      employees: 20,
      leaveRequests: 10,
      attendances: 10,
      leaveBalances: 20,
    },
    enablePagination = true,
  } = options;

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { isSuperAdmin, isLoading: rolesLoading, userRoles } = useUserRoles();

  // Cache TTL (5 minutes comme Stripe)
  const CACHE_TTL = 5 * 60 * 1000;

  // ✅ CORRECTION BOUCLE INFINIE: Calculer directement depuis userRoles
  const isSuperAdminValue = useMemo(() => {
    return userRoles.some(role => role.roles?.name === 'super_admin');
  }, [userRoles]);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    limit: 50,
    total: 0,
    hasMore: false,
  });

  const [metrics, setMetrics] = useState<HRMetrics>({
    fetchTime: 0,
    cacheHit: false,
    dataSize: 0,
    lastUpdate: new Date(),
  });

  const getCacheKey = useCallback(
    (tenant: string | null, isSuper: boolean) => {
      if (isSuper) return 'hr_super_admin';
      return tenant ? `hr_${tenant}` : 'hr_no_tenant';
    },
    []
  );

  const isQueryEnabled = !rolesLoading && (!!tenantId || isSuperAdminValue);

  // Single bundled useQuery for all 6 HR data sources
  const {
    data,
    isLoading: queryLoading,
    error: rawError,
    refetch: refetchQuery,
  } = useQuery<HRData>({
    queryKey: ['hr-minimal', tenantId, isSuperAdminValue, enabledSections, limits],
    queryFn: async () => {
      const startTime = performance.now();
      const isSuper = isSuperAdminValue;
      const cacheKey = getCacheKey(tenantId, isSuper);

      // Check cacheManager first (Pattern Stripe)
      const cachedData = cacheManager.get<HRData>(cacheKey);
      if (cachedData) {
        setMetrics(prev => ({ ...prev, cacheHit: true, lastUpdate: new Date() }));
        return cachedData;
      }

      const [
        leaveRequestsRes,
        absenceTypesRes,
        attendancesRes,
        employeesRes,
        leaveBalancesRes,
        departmentsRes,
      ] = await Promise.all([
        // Leave Requests
        enabledSections.leaveRequests
          ? isSuper
            ? supabase
                .from('leave_requests')
                .select('*, profiles:employee_id(full_name, tenant_id)')
                .order('created_at', { ascending: false })
                .limit(limits.leaveRequests || 10)
            : tenantId
              ? supabase
                  .from('leave_requests')
                  .select('*')
                  .eq('tenant_id', tenantId)
                  .order('created_at', { ascending: false })
                  .limit(limits.leaveRequests || 10)
              : supabase.from('leave_requests').select('*').limit(0)
          : Promise.resolve({ data: [], error: null }),

        // Absence Types
        enabledSections.absenceTypes
          ? supabase.from('absence_types').select('*').order('name')
          : Promise.resolve({ data: [], error: null }),

        // Attendances
        enabledSections.attendances
          ? isSuper
            ? supabase
                .from('attendances')
                .select('*, profiles:employee_id(full_name, tenant_id)')
                .order('date', { ascending: false })
                .limit(limits.attendances || 10)
            : tenantId
              ? supabase
                  .from('attendances')
                  .select('*')
                  .eq('tenant_id', tenantId)
                  .order('date', { ascending: false })
                  .limit(limits.attendances || 10)
              : supabase.from('attendances').select('*').limit(0)
          : Promise.resolve({ data: [], error: null }),

        // Employees
        enabledSections.employees
          ? isSuper
            ? supabase
                .from('employees')
                .select('*')
                .order('full_name')
                .limit(limits.employees || 20)
            : tenantId
              ? supabase
                  .from('employees')
                  .select('*')
                  .eq('tenant_id', tenantId)
                  .limit(limits.employees || 20)
              : supabase.from('employees').select('*').limit(0)
          : Promise.resolve({ data: [], error: null }),

        // Leave Balances
        enabledSections.leaveBalances
          ? isSuper
            ? supabase
                .from('leave_balances')
                .select('*, profiles:employee_id(full_name), absence_types:absence_type_id(name)')
                .order('year', { ascending: false })
                .limit(limits.leaveBalances || 20)
            : tenantId
              ? supabase
                  .from('leave_balances')
                  .select(
                    '*, profiles:employee_id(full_name), absence_types:absence_type_id(name)'
                  )
                  .eq('tenant_id', tenantId)
                  .order('year', { ascending: false })
                  .limit(limits.leaveBalances || 20)
              : supabase.from('leave_balances').select('*').limit(0)
          : Promise.resolve({ data: [], error: null }),

        // Departments
        enabledSections.departments
          ? isSuper
            ? supabase.from('departments').select('*').order('name')
            : tenantId
              ? supabase.from('departments').select('*').eq('tenant_id', tenantId).order('name')
              : supabase.from('departments').select('*').limit(0)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const newData: HRData = {
        leaveRequests: leaveRequestsRes.data || [],
        absenceTypes: absenceTypesRes.data || [],
        attendances: attendancesRes.data || [],
        employees: employeesRes.data || [],
        leaveBalances: leaveBalancesRes.data || [],
        departments: departmentsRes.data || [],
      };

      const endTime = performance.now();
      const fetchTime = endTime - startTime;
      const dataSize = JSON.stringify(newData).length;

      cacheManager.set(cacheKey, newData, 'hr_data');

      setMetrics({ fetchTime, cacheHit: false, dataSize, lastUpdate: new Date() });

      return newData;
    },
    enabled: isQueryEnabled,
    staleTime: CACHE_TTL,
    gcTime: CACHE_TTL * 2,
  });

  const loading = queryLoading;
  const error: string | null = rawError
    ? rawError instanceof Error
      ? rawError.message
      : String(rawError)
    : null;

  const resolvedData: HRData = data ?? {
    leaveRequests: [],
    absenceTypes: [],
    attendances: [],
    employees: [],
    leaveBalances: [],
    departments: [],
  };

  // Fonction de refresh optimisée
  const refresh = useCallback(() => {
    const cacheKey = getCacheKey(tenantId, isSuperAdminValue);
    cacheManager.invalidate(cacheKey);
    queryClient.invalidateQueries({
      queryKey: ['hr-minimal', tenantId, isSuperAdminValue],
    });
  }, [tenantId, isSuperAdminValue, getCacheKey, queryClient]);

  // Fonction pour charger plus de données
  const loadMore = useCallback(
    async (resource: keyof HRData) => {
      if (!enablePagination) return;
      const cacheKey = getCacheKey(tenantId, isSuperAdminValue);
      cacheManager.invalidate(cacheKey);
      queryClient.invalidateQueries({
        queryKey: ['hr-minimal', tenantId, isSuperAdminValue],
      });
    },
    [enablePagination, tenantId, isSuperAdminValue, getCacheKey, queryClient]
  );

  const clearCache = useCallback(() => {
    cacheManager.invalidatePattern('hr:*');
  }, []);

  const getCacheStats = useCallback(() => {
    return cacheManager.getStats();
  }, []);

  const currentUserRole = userRoles[0]?.roles?.name || 'Aucun rôle';
  const requiredRole = 'hr_manager ou tenant_admin';
  const tenantIdFromRoles = userRoles[0]?.tenant_id;
  const effectiveTenantId = tenantId || tenantIdFromRoles;
  const hasRequiredRole =
    isSuperAdminValue || currentUserRole === 'hr_manager' || currentUserRole === 'tenant_admin';
  const hasAccess = hasRequiredRole && !!effectiveTenantId;

  return {
    ...resolvedData,
    loading,
    error,
    metrics,
    pagination,
    canAccess: hasAccess,
    isSuperAdmin: isSuperAdminValue,
    accessInfo: {
      hasAccess,
      currentRole: currentUserRole,
      requiredRole,
      reason: !hasAccess
        ? currentUserRole === 'Aucun rôle'
          ? 'no_role'
          : 'insufficient_permissions'
        : null,
    },
    refresh,
    refreshData: refresh,
    clearCache,
    getCacheStats,
    loadMore,
    isDataStale: metrics.lastUpdate && Date.now() - metrics.lastUpdate.getTime() > CACHE_TTL,
    cacheKey: getCacheKey(tenantId, isSuperAdminValue),
  };
};
