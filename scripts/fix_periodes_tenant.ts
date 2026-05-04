import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg4OTg0NiwiZXhwIjoyMDc4MjQ5ODQ2fQ.Pqkp9LPw4K_gKTsoBe6yRtTBqBxRMrjGj4t2CpC6zAc';

const supabase = createClient(supabaseUrl, supabaseKey);

const TENANT_ID = '878c5ac9-4e99-4baf-803a-14f8ac964ec4';

async function checkPeriodesWithTenant() {
  console.log('Checking paie_periodes with service role...');

  // Check all periodes
  const { data: allPeriodes, error: allError } = await supabase.from('paie_periodes').select('*');

  if (allError) {
    console.error('Error fetching all periodes:', allError);
  } else {
    console.log(`\nTotal periodes in database: ${allPeriodes?.length || 0}`);
    allPeriodes?.forEach(p => {
      console.log(`  - Mois ${p.mois}/${p.annee}, tenant_id: ${p.tenant_id}`);
    });
  }

  // Check periodes for specific tenant
  const { data: tenantPeriodes, error: tenantError } = await supabase
    .from('paie_periodes')
    .select('*')
    .eq('tenant_id', TENANT_ID);

  if (tenantError) {
    console.error('\nError fetching tenant periodes:', tenantError);
  } else {
    console.log(`\nPeriodes for tenant ${TENANT_ID}: ${tenantPeriodes?.length || 0}`);
    tenantPeriodes?.forEach(p => {
      console.log(`  - Mois ${p.mois}/${p.annee} (ID: ${p.id})`);
    });
  }

  // Update periodes without tenant_id
  const { data: updated, error: updateError } = await supabase
    .from('paie_periodes')
    .update({ tenant_id: TENANT_ID })
    .is('tenant_id', null)
    .select();

  if (updateError) {
    console.error('\nError updating periodes:', updateError);
  } else if (updated && updated.length > 0) {
    console.log(`\n✅ Updated ${updated.length} periodes with tenant_id`);
  } else {
    console.log('\nNo periodes needed tenant_id update');
  }
}

checkPeriodesWithTenant();
