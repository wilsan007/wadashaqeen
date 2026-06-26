import { supabase } from '@/integrations/supabase/client';
import { ServiceError } from './task.service';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  tenant_id?: string;
  created_at?: string;
  progress?: number;
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
}

export class ProjectService {
  static async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new ServiceError(error.message, error.code);
    return data ?? [];
  }

  static async getById(id: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new ServiceError(error.message, error.code);
    return data;
  }

  static async create(payload: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert(payload)
      .select()
      .single();
    if (error) throw new ServiceError(error.message, error.code);
    return data;
  }

  static async update(id: string, payload: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new ServiceError(error.message, error.code);
    return data;
  }

  // ── Projets sans activité depuis N jours ──────────────────────────────────
  static async getInactiveProjectsCount(days = 7): Promise<{
    count: number;
    total: number;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('id')
      .not('status', 'in', '("completed","done","cancelled","on_hold")');
    if (projError) throw new ServiceError(projError.message);

    const projectIds = (projects ?? []).map((p: any) => p.id as string);
    if (projectIds.length === 0) return { count: 0, total: 0 };

    const { data: recentTasks } = await supabase
      .from('tasks')
      .select('project_id')
      .in('project_id', projectIds)
      .gte('updated_at', since.toISOString());

    const activeIds = new Set((recentTasks ?? []).map((t: any) => t.project_id as string).filter(Boolean));
    return {
      count: projectIds.filter(id => !activeIds.has(id)).length,
      total: projectIds.length,
    };
  }

  static async getStats(): Promise<ProjectStats> {
    const { data, error } = await supabase.from('projects').select('status, end_date');
    if (error) throw new ServiceError(error.message, error.code);
    const today = new Date().toISOString().split('T')[0];
    const rows = data ?? [];
    return {
      total: rows.length,
      active: rows.filter(p => p.status === 'active' || p.status === 'in_progress').length,
      completed: rows.filter(p => p.status === 'completed' || p.status === 'done').length,
      overdue: rows.filter(p => p.end_date && p.end_date < today && p.status !== 'completed' && p.status !== 'done').length,
    };
  }
}
