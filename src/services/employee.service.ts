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

  static async getHRDashboardStats(): Promise<HRDashboardStats> {
    const today = new Date().toISOString().split('T')[0];

    const [employeesRes, leaveRes] = await Promise.all([
      supabase.from('employees').select('status, department_id'),
      supabase
        .from('leave_requests')
        .select('status, start_date, end_date')
        .gte('end_date', today),
    ]);

    if (employeesRes.error) throw new ServiceError(employeesRes.error.message, employeesRes.error.code);

    const employees = employeesRes.data ?? [];
    const leaves = leaveRes.data ?? [];

    const onLeaveToday = leaves.filter(
      l => l.status === 'approved' && l.start_date <= today && l.end_date >= today
    ).length;
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length;

    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.status === 'active').length,
      departments: new Set(employees.map(e => e.department_id).filter(Boolean)).size,
      onLeaveToday,
      pendingLeaveRequests: pendingLeaves,
    };
  }

  // ── Taux d'utilisation des ressources ─────────────────────────────────────
  // Calcule le % d'heures planifiées / capacité pour les employés actifs.
  static async getResourceUtilizationStats(): Promise<{
    avgUtilization: number;
    overloadedCount: number;
    availableCount: number;
    totalEmployees: number;
    details: { id: string; name: string; utilization: number; plannedHours: number; capacity: number }[];
  }> {
    const [empRes, taskRes] = await Promise.all([
      supabase.from('employees').select('id, user_id, weekly_hours, full_name').eq('status', 'active'),
      supabase
        .from('tasks')
        .select('assignee_id, effort_estimate_h')
        .not('assignee_id', 'is', null)
        .not('effort_estimate_h', 'is', null)
        .not('status', 'in', '("done","completed","cancelled")'),
    ]);
    if (empRes.error) throw new ServiceError(empRes.error.message);

    const employees = empRes.data ?? [];
    const tasks = taskRes.data ?? [];

    const hoursById: Record<string, number> = {};
    tasks.forEach((t: any) => {
      if (!t.assignee_id) return;
      hoursById[t.assignee_id] = (hoursById[t.assignee_id] ?? 0) + (t.effort_estimate_h ?? 0);
    });

    const utilizations = employees.map(emp => {
      const assignedHours = (hoursById[emp.id] ?? 0) + (emp.user_id ? (hoursById[emp.user_id] ?? 0) : 0);
      const cap = emp.weekly_hours ?? 35;
      const rate = Math.round((assignedHours / cap) * 100);
      return { id: emp.id, name: emp.full_name, utilization: rate, plannedHours: assignedHours, capacity: cap };
    });

    if (utilizations.length === 0) {
      return { avgUtilization: 0, overloadedCount: 0, availableCount: 0, totalEmployees: 0, details: [] };
    }

    utilizations.sort((a, b) => b.utilization - a.utilization);

    return {
      avgUtilization: Math.round(utilizations.reduce((s, u) => s + u.utilization, 0) / utilizations.length),
      overloadedCount: utilizations.filter(u => u.utilization > 100).length,
      availableCount: utilizations.filter(u => u.utilization < 60).length,
      totalEmployees: employees.length,
      details: utilizations,
    };
  }

  // ── Taux d'absentéisme mensuel ─────────────────────────────────────────────
  // Calcule jours d'absence approuvés / (effectif × jours ouvrés du mois).
  static async getAbsenteeismRate(): Promise<{
    rate: number;
    totalAbsenceDays: number;
    workingDaysInMonth: number;
    employeeCount: number;
  }> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Jours ouvrés du mois (lundi–vendredi)
    let workingDays = 0;
    const d = new Date(monthStart);
    while (d.toISOString().split('T')[0] <= monthEnd) {
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) workingDays++;
      d.setDate(d.getDate() + 1);
    }

    const [empRes, leaveRes] = await Promise.all([
      supabase.from('employees').select('id').eq('status', 'active'),
      supabase
        .from('leave_requests')
        .select('total_days')
        .eq('status', 'approved')
        .gte('start_date', monthStart)
        .lte('end_date', monthEnd),
    ]);
    if (empRes.error) throw new ServiceError(empRes.error.message);

    const employeeCount = (empRes.data ?? []).length;
    const totalAbsenceDays = (leaveRes.data ?? []).reduce(
      (s: number, r: any) => s + (r.total_days ?? 0), 0
    );
    const denominator = employeeCount * workingDays;
    const rate = denominator > 0
      ? Math.round((totalAbsenceDays / denominator) * 1000) / 10
      : 0;

    return { rate, totalAbsenceDays, workingDaysInMonth: workingDays, employeeCount };
  }

  static async getMyLeaveBalance(userId: string): Promise<MyLeaveBalance> {
    const { data, error } = await supabase
      .from('leave_balances')
      .select('leave_type_id, total_days, used_days, remaining_days')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // Pas d'erreur sur table inexistante — retourne 0 gracieusement
    }

    return {
      totalDays: data?.total_days ?? 0,
      usedDays: data?.used_days ?? 0,
      remainingDays: data?.remaining_days ?? 0,
    };
  }
}

export interface HRDashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  departments: number;
  onLeaveToday: number;
  pendingLeaveRequests: number;
}

export interface MyLeaveBalance {
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}
