import * as dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: projects } = await supabase.from('projects').select('id, name, created_at, updated_at').limit(5);
  console.log("Projects:", projects);

  const { data: tasks } = await supabase.from('tasks').select('id, project_id, title, created_at, updated_at').limit(5);
  console.log("Tasks:", tasks);
}

run();
