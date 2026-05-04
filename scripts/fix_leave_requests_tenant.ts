import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg4OTg0NiwiZXhwIjoyMDc4MjQ5ODQ2fQ.Pqkp9LPw4K_gKTsoBe6yRtTBqBxRMrjGj4t2CpC6zAc';

const supabase = createClient(supabaseUrl, supabaseKey);

const TENANT_ID = '878c5ac9-4e99-4baf-803a-14f8ac964ec4';

async function fixLeaveTenants() {
  console.log('Fixing leave_requests with missing tenant_id...');

  // Update the 2 recent requests that have null tenant_id
  const { data, error } = await supabase
    .from('leave_requests')
    .update({ tenant_id: TENANT_ID })
    .is('tenant_id', null)
    .select('id');

  if (error) {
    console.error('Error updating leave requests:', error);
  } else {
    console.log(`✅ Updated ${data?.length || 0} leave requests with tenant_id`);
  }
}

fixLeaveTenants();
