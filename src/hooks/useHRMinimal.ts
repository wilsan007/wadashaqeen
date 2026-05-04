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

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { useRolesCompat as useUserRoles } from '@/contexts/RolesContext';
import { cacheManager } from '@/lib/cacheManager';
import { useRenderTracker } from '@/hooks/usePerformanceMonitor';
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
    enabled = {
      employees: true,
      leaveRequests: true,
      attendances: true,
      leaveBalances: true,
      departments: true,
      absenceTypes: true,
    },
    limits = {
      employees: 20, // Réduit de 50-100
      leaveRequests: 10, // Réduit de 50-100
      attendances: 10, // Réduit de 30-100
      leaveBalances: 20, // Nouveau
    },
    enablePagination = true,
  } = options;
  // Performance monitoring - DISABLED temporairement car trop de bruit
  // const performanceMonitor = useRenderTracker('useHRMinimal');
  // États optimisés avec métriques
  const [data, setData] = useState<HRData>({
    leaveRequests: [],
    absenceTypes: [],
    attendances: [],
    employees: [],
    leaveBalances: [],
    departments: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<HRMetrics>({
    fetchTime: 0,
    cacheHit: false,
    dataSize: 0,
    lastUpdate: new Date(),
  });

  // Pagination state
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    limit: 50,
    total: 0,
    hasMore: false,
  });

  // Hooks externes
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { isSuperAdmin, isLoading: rolesLoading, userRoles } = useUserRoles();

  // ✅ CORRECTION BOUCLE INFINIE: Calculer directement depuis userRoles
  // Éviter d'appeler isSuperAdmin() car c'est une fonction qui change
  const isSuperAdminValue = useMemo(() => {
    return userRoles.some(role => role.roles?.name === 'super_admin');
  }, [userRoles]);

  // Refs pour éviter les boucles et optimisations
  const fetchedRef = useRef(false);
  const tenantIdRef = useRef<string | null>(null);
  const cacheRef = useRef<Map<string, { data: HRData; timestamp: number }>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cache TTL (5 minutes comme Stripe)
  const CACHE_TTL = 5 * 60 * 1000;

  // Fonction pour générer une clé de cache unique - Contextuelle (Pattern Stripe)
  // ✅ CORRECTION: Stabiliser avec useCallback
  const getCacheKey = useCallback((tenant: string | null, isSuper: boolean) => {
    if (isSuper) {
      return 'hr_super_admin'; // Super Admin voit tout
    }
    return tenant ? `hr_${tenant}` : 'hr_no_tenant';
  }, []); // Pas de dépendances, c'est une pure function

  const getCachedData = useCallback((cacheKey: string): HRData | null => {
    return cacheManager.get<HRData>(cacheKey);
  }, []);

  const setCachedData = useCallback((cacheKey: string, data: HRData) => {
    cacheManager.set(cacheKey, data, 'hr_data');
  }, []);

  // Fonction de fetch stable
  useEffect(() => {
    // Conditions de sortie pour éviter les boucles
    if (rolesLoading) {
      // // console.log('⏳ Roles still loading...');
      return;
    }

    // Super Admin peut accéder aux données même sans tenant_id
    if (!tenantId && !isSuperAdminValue) {
      // // console.log('⚠️ No tenant ID available and not Super Admin');
      setLoading(false);
      return;
    }

    // Protection STRICTE contre les refetch - hash stable
    const currentTenantHash = `${tenantId || 'null'}-${isSuperAdminValue}`;
    const lastTenantHash = tenantIdRef.current || '';

    // ARRÊT COMPLET si mêmes paramètres et déjà fetché
    if (fetchedRef.current && currentTenantHash === lastTenantHash) {
      return;
    }

    // Vérifier le cache avant tout fetch
    const cacheKey = getCacheKey(tenantId, isSuperAdminValue);
    const cachedData = getCachedData(cacheKey);

    if (cachedData && currentTenantHash === lastTenantHash) {
      // Si on a du cache et que rien n'a changé, ne pas refetch
      setData(cachedData);
      setLoading(false);
      return;
    }

    // Marquer comme en cours de fetch AVANT le fetch pour éviter les races
    fetchedRef.current = true;
    tenantIdRef.current = currentTenantHash;

    const fetchData = async () => {
      // Annuler la requête précédente si elle existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const startTime = performance.now();
        setLoading(true);
        setError(null);

        const isSuper = isSuperAdminValue; // ✅ Utiliser la valeur stable
        const cacheKey = getCacheKey(tenantId, isSuper);

        // Vérifier le cache d'abord (Pattern Stripe)
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return; // Pas de mise à jour des métriques si c'est du cache pour éviter re-renders
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
          enabled.leaveRequests
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
          enabled.absenceTypes
            ? supabase.from('absence_types').select('*').order('name')
            : Promise.resolve({ data: [], error: null }),

          // Attendances
          enabled.attendances
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
          enabled.employees
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
          enabled.leaveBalances
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
          enabled.departments
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

        setCachedData(cacheKey, newData);

        setData(newData);
        setMetrics({
          fetchTime,
          cacheHit: false,
          dataSize,
          lastUpdate: new Date(),
        });
      } catch (error: any) {
        console.error('❌ Error fetching HR data:', error);
        setError(error.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenantId, rolesLoading, isSuperAdminValue]);

  // Fonction de refresh optimisée
  const refresh = useCallback(() => {
    const cacheKey = getCacheKey(tenantId, isSuperAdminValue);
    cacheManager.invalidate(cacheKey);
    fetchedRef.current = false;
    tenantIdRef.current = null;
    setLoading(true);
  }, [tenantId, isSuperAdminValue, getCacheKey]);

  // Fonction pour charger plus de données
  const loadMore = useCallback(
    async (resource: keyof HRData) => {
      if (!enablePagination) return;
      setLoading(true);
      try {
        const currentData = data[resource];
        const currentLimit = limits[resource as keyof typeof limits] || 20;
        const newLimit = currentLimit + 20;
        const cacheKey = getCacheKey(tenantId, isSuperAdminValue);
        cacheManager.invalidate(cacheKey);
        fetchedRef.current = false;
        setLoading(true);
      } catch (error) {
        console.error('Error loading more:', error);
      }
    },
    [enablePagination, data, limits, tenantId, isSuperAdminValue, getCacheKey]
  );

  const clearCache = useCallback(() => {
    cacheManager.invalidatePattern('hr:*');
  }, []);

  const getCacheStats = useCallback(() => {
    return cacheManager.getStats();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const currentUserRole = userRoles[0]?.roles?.name || 'Aucun rôle';
  const requiredRole = 'manager_hr ou tenant_admin';
  const tenantIdFromRoles = userRoles[0]?.tenant_id;
  const effectiveTenantId = tenantId || tenantIdFromRoles;
  const hasRequiredRole =
    isSuperAdminValue || currentUserRole === 'manager_hr' || currentUserRole === 'tenant_admin';
  const hasAccess = hasRequiredRole && !!effectiveTenantId;

  return {
    ...data,
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
    loadMore, // Export loadMore
    isDataStale: metrics.lastUpdate && Date.now() - metrics.lastUpdate.getTime() > CACHE_TTL,
    cacheKey: getCacheKey(tenantId, isSuperAdminValue),
  };
};
