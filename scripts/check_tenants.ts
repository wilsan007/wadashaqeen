import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg4OTg0NiwiZXhwIjoyMDc4MjQ5ODQ2fQ.Pqkp9LPw4K_gKTsoBe6yRtTBqBxRMrjGj4t2CpC6zAc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTenants() {
  console.log('Checking tenants...');

  const { data: tenants, error } = await supabase.from('tenants').select('id, name');

  if (error) {
    console.error('Error fetching tenants:', error);
  } else {
    console.log('Tenants:', tenants);
  }

  const { data: users, error: userError } = await supabase
    .from('auth_users_view') // Try to access a view if auth.users is not accessible directly via client (usually it isn't)
    // Actually, with service role we can access auth admin api but let's try to see if we can find users in public tables
    .select('*')
    .limit(5);

  // Better to check user_roles or profiles if they exist
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, tenant_id, roles(name)');

  if (rolesError) {
    console.error('Error fetching user roles:', rolesError);
  } else {
    console.log('User Roles:', JSON.stringify(userRoles, null, 2));
  }
}

checkTenants();
