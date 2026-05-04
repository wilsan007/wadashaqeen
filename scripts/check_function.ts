import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg4OTg0NiwiZXhwIjoyMDc4MjQ5ODQ2fQ.Pqkp9LPw4K_gKTsoBe6yRtTBqBxRMrjGj4t2CpC6zAc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFunction() {
  console.log('Checking for function sync_employees_to_payroll...');

  const { data, error } = await supabase.rpc('sync_employees_to_payroll', {
    p_tenant_id: '00000000-0000-0000-0000-000000000000',
  }); // Dummy UUID

  if (error) {
    console.log(
      'Error calling function (might be expected if tenant not found, but checks existence):',
      error.message
    );
    if (
      error.message.includes('function "sync_employees_to_payroll" does not exist') ||
      error.message.includes('Could not find the function')
    ) {
      console.error('FUNCTION DOES NOT EXIST');
    } else {
      console.log('Function likely exists (error was execution related).');
    }
  } else {
    console.log('Function executed successfully (returned void/null).');
  }
}

checkFunction();
