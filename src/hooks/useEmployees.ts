import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';

export interface Employee {
  id: string;
  user_id?: string;
  employee_id?: string;
  full_name: string;
  phone?: string;
  job_title?: string;
  department_id?: string;
  manager_id?: string;
  hire_date?: string;
  contract_type?: string;
  salary?: number;
  weekly_hours?: number;
  avatar_url?: string;
  emergency_contact?: any;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  budget?: number;
  manager_id?: string;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

export const useEmployees = () => {
  const queryClient = useQueryClient();

  // 🔒 Contexte utilisateur pour le filtrage
  const { userContext } = useAuth();

  // Query: employees from profiles table avec filtrage
  const {
    data: employees = [],
    isLoading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees,
  } = useQuery<Employee[]>({
    queryKey: ['employees', userContext?.userId, userContext?.tenantId],
    queryFn: async () => {
      let query = supabase.from('profiles').select('*').order('full_name');
      query = applyRoleFilters(query, userContext!, 'employees');
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(profile => ({
        ...profile,
        employee_id: profile.employee_id || `EMP${profile.id.slice(-4)}`,
      }));
    },
    enabled: !!userContext,
  });

  // Query: departments
  const {
    data: departments = [],
    isLoading: departmentsLoading,
    error: departmentsError,
    refetch: refetchDepartments,
  } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('departments').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!userContext,
  });

  const loading = employeesLoading || departmentsLoading;
  const error = employeesError
    ? employeesError instanceof Error
      ? employeesError.message
      : String(employeesError)
    : departmentsError
      ? departmentsError instanceof Error
        ? departmentsError.message
        : String(departmentsError)
      : null;

  const refetch = async () => {
    await Promise.all([refetchEmployees(), refetchDepartments()]);
  };

  // createEmployee: always throws (invitation system required)
  const createEmployee = async (
    employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      // TODO: La création d'employés doit passer par le système d'invitation (send-collaborator-invitation)
      // Cette fonction nécessite un email, tenant_id et user_id qui ne sont pas fournis ici
      // Pour créer un employé, utilisez la fonctionnalité d'invitation depuis l'interface RH

      throw new Error(
        "La création directe d'employés n'est pas supportée. Utilisez le système d'invitation."
      );
    } catch (err) {
      console.error('Error creating employee:', err);
      throw err;
    }
  };

  // Mutation: updateEmployee
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Employee> }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['employees', userContext?.userId, userContext?.tenantId],
      });
    },
  });

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      return await updateEmployeeMutation.mutateAsync({ id, updates });
    } catch (err) {
      console.error('Error updating employee:', err);
      throw err;
    }
  };

  // Mutation: deleteEmployee
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('profiles').delete().eq('user_id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['employees', userContext?.userId, userContext?.tenantId],
      });
    },
  });

  const deleteEmployee = async (id: string) => {
    try {
      await deleteEmployeeMutation.mutateAsync(id);
    } catch (err) {
      console.error('Error deleting employee:', err);
      throw err;
    }
  };

  // Mutation: createDepartment
  const createDepartmentMutation = useMutation({
    mutationFn: async (departmentData: Omit<Department, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('departments')
        .insert([departmentData])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const createDepartment = async (
    departmentData: Omit<Department, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      return await createDepartmentMutation.mutateAsync(departmentData);
    } catch (err) {
      console.error('Error creating department:', err);
      throw err;
    }
  };

  // Mutation: updateDepartment
  const updateDepartmentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Department> }) => {
      const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    try {
      return await updateDepartmentMutation.mutateAsync({ id, updates });
    } catch (err) {
      console.error('Error updating department:', err);
      throw err;
    }
  };

  // Mutation: deleteDepartment
  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const deleteDepartment = async (id: string) => {
    try {
      await deleteDepartmentMutation.mutateAsync(id);
    } catch (err) {
      console.error('Error deleting department:', err);
      throw err;
    }
  };

  return {
    employees,
    departments,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    refetch,
  };
};
