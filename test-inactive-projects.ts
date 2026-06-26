import { supabase } from './src/integrations/supabase/client';

async function run() {
  const days = 7;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: projects, error: projError } = await supabase
    .from('projects')
    .select('id, name, status, updated_at')
    .not('status', 'in', '("completed","done","cancelled","on_hold")');
    
  console.log("Projects:", projects?.length, projError);

  if (!projects || projects.length === 0) return;
  const projectIds = projects.map((p: any) => p.id as string);

  const { data: recentTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, project_id, updated_at')
    .in('project_id', projectIds)
    .gte('updated_at', since.toISOString());

  console.log("Recent tasks:", recentTasks?.length, tasksError);

  const activeIds = new Set((recentTasks ?? []).map((t: any) => t.project_id as string).filter(Boolean));
  console.log("Active project IDs:", activeIds.size);
  console.log("Inactive count:", projectIds.filter(id => !activeIds.has(id)).length);
}

run();
