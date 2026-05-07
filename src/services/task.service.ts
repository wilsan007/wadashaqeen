import { supabase } from '@/integrations/supabase/client';

export class ServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to?: string;
  due_date?: string;
  project_id?: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
  progress?: number;
  start_date?: string;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  due_date?: string;
  project_id?: string;
  start_date?: string;
}

export type UpdateTaskDTO = Partial<CreateTaskDTO> & { progress?: number };

export class TaskService {
  static async getByProject(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw new ServiceError(error.message, error.code);
    return data ?? [];
  }

  static async getById(id: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new ServiceError(error.message, error.code);
    return data;
  }

  static async create(payload: CreateTaskDTO): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(payload)
      .select()
      .single();
    if (error) throw new ServiceError(error.message, error.code);
    return data;
  }

  static async update(id: string, payload: UpdateTaskDTO): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new ServiceError(error.message, error.code);
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw new ServiceError(error.message, error.code);
  }

  static async getMetrics(): Promise<{ status: string; count: number }[]> {
    const { data, error } = await supabase.from('tasks').select('status');
    if (error) throw new ServiceError(error.message, error.code);
    const counts: Record<string, number> = {};
    (data ?? []).forEach(({ status }) => {
      counts[status] = (counts[status] ?? 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }
}
