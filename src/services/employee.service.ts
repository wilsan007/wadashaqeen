import { supabase } from '@/integrations/supabase/client';
import { ServiceError } from './task.service';

export interface Employee {
  id: string;
  full_name: string;
  email: string;
  job_title?: string;
  department_id?: string;
  status: string;
  hire_date?: string;
  tenant_id?: string;
}

export interface TeamStats {
  total: number;
  active: number;
  departments: number;
}

export class EmployeeService {
  static async getAll(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('full_name');
    if (error) throw new ServiceError(error.message, error.code);
    return data ?? [];
  }

  static async getTeamStats(): Promise<TeamStats> {
    const { data, error } = await supabase
      .from('employees')
      .select('status, department_id');
    if (error) throw new ServiceError(error.message, error.code);
    const rows = data ?? [];
    return {
      total: rows.length,
      active: rows.filter(e => e.status === 'active').length,
      departments: new Set(rows.map(e => e.department_id).filter(Boolean)).size,
    };
  }
}
