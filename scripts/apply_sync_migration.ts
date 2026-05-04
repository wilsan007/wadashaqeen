import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg4OTg0NiwiZXhwIjoyMDc4MjQ5ODQ2fQ.Pqkp9LPw4K_gKTsoBe6yRtTBqBxRMrjGj4t2CpC6zAc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('Applying migration...');

  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/20251204000006_sync_employees_to_payroll.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split by statement if needed, but supabase-js doesn't support raw SQL execution directly on the client usually.
  // However, we can use the postgres connection if available, or a special RPC if one exists to run SQL.
  // But usually we don't have that.

  // WAIT! I can't run raw SQL via supabase-js client unless I have an RPC for it.
  // But I do have the service role key.

  // If I can't run SQL, I might have to rely on the user to run it or use a workaround.
  // But wait, I see `EXECUTE_THIS_SQL.sql` in the file list. Maybe there is a pattern here.

  // Let's check if there is an `exec_sql` function or similar in the DB.

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Error executing SQL via RPC:', error);
    // Fallback: try to create the function via another way? No.
    // If exec_sql doesn't exist, I'm stuck unless I can use the postgres connection string.
    // I don't see a postgres connection string in the env (I can't see env).

    // However, I see `scripts/seed_payroll.ts` works by using the client.
    // But that uses `insert`, `update`, etc.

    // I can try to recreate the function logic in Typescript and run it as a script.
    // That would be a "polyfill" for the migration.

    console.log('Attempting to implement sync logic in Typescript...');
    await syncEmployeesInTypescript();
  } else {
    console.log('Migration applied successfully via RPC.');
  }
}

async function syncEmployeesInTypescript() {
  // Logic from the SQL function
  const TENANT_ID = '878c5ac9-4e99-4baf-803a-14f8ac964ec4'; // We should probably do this for all tenants or the specific one.
  // But the SQL function takes a parameter.

  // Let's just do it for the known tenant for now.

  console.log('Syncing for tenant:', TENANT_ID);

  // 1. Get employees for tenant
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, full_name, job_title, salary, tenant_id')
    .eq('tenant_id', TENANT_ID);

  if (empError) {
    console.error('Error fetching employees:', empError);
    return;
  }

  console.log(`Found ${employees.length} employees.`);

  // 2. Check existing payroll employees
  const { data: payrollEmps, error: payError } = await supabase
    .from('paie_employes')
    .select('user_id')
    .eq('tenant_id', TENANT_ID);

  if (payError) {
    console.error('Error fetching payroll employees:', payError);
    return;
  }

  const existingUserIds = new Set(payrollEmps.map(p => p.user_id));

  // 3. Insert missing
  for (const emp of employees) {
    if (!existingUserIds.has(emp.id)) {
      console.log(`Adding ${emp.full_name} to payroll...`);
      await supabase.from('paie_employes').insert({
        tenant_id: emp.tenant_id,
        user_id: emp.id,
        nom_complet: emp.full_name,
        fonction: emp.job_title || 'Employé',
        salaire_base: emp.salary || 0,
        prime_transport_fixe: 0,
        prime_logement_fixe: 0,
        prime_fonction_fixe: 0,
        prime_responsabilite_fixe: 0,
        retenue_waqf_fixe: 0,
      });
    }
  }
  console.log('Sync completed (Typescript version).');
}

applyMigration();
