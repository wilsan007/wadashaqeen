import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qliinxtanjdnwxlvnxji.supabase.co';
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '...'; // I need to extract this from .env

async function check() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) console.error(error);
  
  for (const u of users?.users?.slice(0, 3) || []) {
    console.log(u.email, u.user_metadata);
  }
}
check();
