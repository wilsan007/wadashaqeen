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
  assignee_id?: string | null;
  assigned_to?: string | null; // alias rétrocompatible — en DB la colonne est assignee_id
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
  assignee_id?: string | null;
  assigned_to?: string | null; // alias rétrocompatible
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

  static async getMyMetrics(userId: string): Promise<{ status: string; count: number }[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('status')
      .eq('assignee_id', userId);
    if (error) throw new ServiceError(error.message, error.code);
    const counts: Record<string, number> = {};
    (data ?? []).forEach(({ status }) => {
      counts[status] = (counts[status] ?? 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }

  static async getMyOverdueTasks(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('tasks')
      .select('id')
      .eq('assignee_id', userId)
      .lt('due_date', today)
      .not('status', 'in', '("done","completed")');
    if (error) throw new ServiceError(error.message, error.code);
    return (data ?? []).length;
  }

  static async getOverdueCount(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('tasks')
      .select('id')
      .lt('due_date', today)
      .not('status', 'in', '("done","completed")');
    if (error) throw new ServiceError(error.message, error.code);
    return (data ?? []).length;
  }

  static async getMyProjectCount(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('assignee_id', userId)
      .not('project_id', 'is', null);
    if (error) throw new ServiceError(error.message, error.code);
    const uniqueProjects = new Set((data ?? []).map(t => t.project_id).filter(Boolean));
    return uniqueProjects.size;
  }

  // ── Tâches bloquées ───────────────────────────────────────────────────────
  // Retourne le nombre de tâches bloquées depuis plus de 3 et 7 jours.
  static async getBlockedTasksStats(): Promise<{
    blockedOver3d: number;
    blockedOver7d: number;
    total: number;
  }> {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, updated_at')
      .eq('status', 'blocked')
      .not('updated_at', 'is', null);
    if (error) throw new ServiceError(error.message, error.code);

    const now = Date.now();
    const MS_3D = 3 * 24 * 60 * 60 * 1000;
    const MS_7D = 7 * 24 * 60 * 60 * 1000;
    const rows = data ?? [];
    return {
      total: rows.length,
      blockedOver3d: rows.filter(t => now - new Date(t.updated_at!).getTime() > MS_3D).length,
      blockedOver7d: rows.filter(t => now - new Date(t.updated_at!).getTime() > MS_7D).length,
    };
  }

  // ── Top contributeurs ──────────────────────────────────────────────────────
  // Retourne les N employés ayant terminé le plus de tâches, avec leur taux.
  static async getTopContributors(limit = 5): Promise<{
    assigneeId: string;
    name: string;
    done: number;
    total: number;
    rate: number;
  }[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('assignee_id, status, employees!tasks_assignee_id_fkey(full_name)')
      .not('assignee_id', 'is', null);
    if (error) throw new ServiceError(error.message, error.code);

    const byAssignee: Record<string, { name: string; done: number; total: number }> = {};
    (data ?? []).forEach((t: any) => {
      if (!t.assignee_id) return;
      if (!byAssignee[t.assignee_id]) {
        byAssignee[t.assignee_id] = {
          name: t.employees?.full_name ?? `…${t.assignee_id.slice(-6)}`,
          done: 0,
          total: 0,
        };
      }
      byAssignee[t.assignee_id].total++;
      if (t.status === 'done' || t.status === 'completed') byAssignee[t.assignee_id].done++;
    });

    return Object.entries(byAssignee)
      .map(([assigneeId, { name, done, total }]) => ({
        assigneeId,
        name,
        done,
        total,
        rate: total > 0 ? Math.round((done / total) * 100) : 0,
      }))
      .sort((a, b) => b.done - a.done)
      .slice(0, limit);
  }

  // ── Vélocité hebdomadaire ──────────────────────────────────────────────────
  // Retourne le nombre de tâches terminées cette semaine, la semaine précédente,
  // et les 4 dernières semaines pour afficher la tendance.
  static async getVelocityStats(): Promise<{
    currentWeek: number;
    previousWeek: number;
    trendPct: number;
    last4Weeks: { label: string; count: number }[];
  }> {
    // Lundi de la semaine courante à minuit
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // ISO: lundi=1
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - (dayOfWeek - 1));
    currentWeekStart.setHours(0, 0, 0, 0);

    // Fenêtre : 4 semaines complètes en arrière
    const fourWeeksAgo = new Date(currentWeekStart);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const { data, error } = await supabase
      .from('tasks')
      .select('updated_at')
      .in('status', ['done', 'completed'])
      .gte('updated_at', fourWeeksAgo.toISOString())
      .not('updated_at', 'is', null);
    if (error) throw new ServiceError(error.message, error.code);

    // Construire 4 buckets hebdomadaires (S-3 → S courant)
    const buckets: { start: Date; end: Date; label: string; count: number }[] = Array.from(
      { length: 4 },
      (_, i) => {
        const start = new Date(currentWeekStart);
        start.setDate(start.getDate() - (3 - i) * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        return { start, end, label: i === 3 ? 'Cette sem.' : `S-${3 - i}`, count: 0 };
      }
    );

    (data ?? []).forEach(({ updated_at }) => {
      if (!updated_at) return;
      const d = new Date(updated_at);
      const bucket = buckets.find(b => d >= b.start && d < b.end);
      if (bucket) bucket.count++;
    });

    const currentWeek = buckets[3].count;
    const previousWeek = buckets[2].count;
    const trendPct =
      previousWeek > 0
        ? Math.round(((currentWeek - previousWeek) / previousWeek) * 100)
        : currentWeek > 0
          ? 100
          : 0;

    return {
      currentWeek,
      previousWeek,
      trendPct,
      last4Weeks: buckets.map(b => ({ label: b.label, count: b.count })),
    };
  }

  // ── Temps moyen de résolution ──────────────────────────────────────────────
  // Calcule la durée médiane (en jours) entre start_date (ou created_at si
  // start_date est null) et updated_at (date de complétion), pour les tâches
  // terminées au cours des 30 derniers jours.
  // Le cap de 60 jours filtre les valeurs aberrantes (tâches créées longtemps
  // avant le démarrage effectif du travail).
  static async getResolutionTimeStats(): Promise<{
    avgDays: number;
    medianDays: number;
    sampleSize: number;
    color: 'success' | 'warning' | 'destructive';
  }> {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data, error } = await supabase
      .from('tasks')
      .select('created_at, start_date, updated_at')
      .in('status', ['done', 'completed'])
      .gte('updated_at', since.toISOString())
      .not('updated_at', 'is', null);
    if (error) throw new ServiceError(error.message, error.code);

    const MAX_DAYS = 60; // cap outliers: tâches créées longtemps avant démarrage

    const durations = (data ?? [])
      .map(t => {
        // Préférence: start_date. Fallback: created_at.
        const startRaw = (t as any).start_date ?? t.created_at;
        if (!startRaw || !t.updated_at) return null;
        const ms = new Date(t.updated_at).getTime() - new Date(startRaw).getTime();
        const days = ms / (1000 * 60 * 60 * 24);
        if (days < 0 || days > MAX_DAYS) return null; // ignorer les aberrations
        return days;
      })
      .filter((d): d is number => d !== null)
      .sort((a, b) => a - b);

    if (durations.length === 0) {
      return { avgDays: 0, medianDays: 0, sampleSize: 0, color: 'success' };
    }

    const sum = durations.reduce((s, d) => s + d, 0);
    const avgDays = Math.round((sum / durations.length) * 10) / 10;
    const mid = Math.floor(durations.length / 2);
    const medianDays =
      durations.length % 2 === 0
        ? Math.round(((durations[mid - 1] + durations[mid]) / 2) * 10) / 10
        : Math.round(durations[mid] * 10) / 10;

    const color: 'success' | 'warning' | 'destructive' =
      medianDays <= 3 ? 'success' : medianDays <= 7 ? 'warning' : 'destructive';

    return { avgDays, medianDays, sampleSize: durations.length, color };
  }
}
