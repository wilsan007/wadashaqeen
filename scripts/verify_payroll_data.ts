import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg4OTg0NiwiZXhwIjoyMDc4MjQ5ODQ2fQ.Pqkp9LPw4K_gKTsoBe6yRtTBqBxRMrjGj4t2CpC6zAc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyData() {
  console.log('Verifying payroll data...');

  const { count: employeesCount, error: empError } = await supabase
    .from('paie_employes')
    .select('*', { count: 'exact', head: true });

  if (empError) console.error('Error fetching employees:', empError);
  else console.log('Payroll Employees count:', employeesCount);

  const { count: periodsCount, error: periodError } = await supabase
    .from('paie_periodes')
    .select('*', { count: 'exact', head: true });

  if (periodError) console.error('Error fetching periods:', periodError);
  else console.log('Payroll Periods count:', periodsCount);

  const { count: advancesCount, error: advError } = await supabase
    .from('paie_avances_prets')
    .select('*', { count: 'exact', head: true });

  if (advError) console.error('Error fetching advances:', advError);
  else console.log('Advances/Loans count:', advancesCount);

  // Check for specific employee
  const { data: ahmed, error: ahmedError } = await supabase
    .from('paie_employes')
    .select('*')
    .ilike('nom_complet', '%Ahmed%')
    .limit(1);

  if (ahmedError) console.error('Error fetching Ahmed:', ahmedError);
  else console.log('Found Ahmed:', ahmed?.length > 0);

  // Check for schema updates
  const { data: periodData, error: schemaError } = await supabase
    .from('paie_periodes')
    .select('date_debut')
    .limit(1);

  if (schemaError) {
    console.error('Schema check failed (date_debut missing?):', schemaError.message);
  } else {
    console.log('Schema check passed: date_debut column exists.');
  }

  // Check for Leave Requests
  const { count: leaveCount, error: leaveError } = await supabase
    .from('leave_requests')
    .select('*', { count: 'exact', head: true });

  if (leaveError) console.error('Error fetching leave requests:', leaveError);
  else console.log('Leave Requests count:', leaveCount);
}

verifyData();
