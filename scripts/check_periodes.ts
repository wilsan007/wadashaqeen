import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg4OTg0NiwiZXhwIjoyMDc4MjQ5ODQ2fQ.Pqkp9LPw4K_gKTsoBe6yRtTBqBxRMrjGj4t2CpC6zAc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPeriodes() {
  console.log('Checking paie_periodes...');

  const { data, error } = await supabase
    .from('paie_periodes')
    .select('*')
    .order('annee', { ascending: false })
    .order('mois', { ascending: false });

  if (error) {
    console.error('Error fetching periodes:', error);
  } else {
    console.log(`Found ${data?.length || 0} periodes:`);
    data?.forEach(p => {
      const label = new Date(p.annee, p.mois - 1).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });
      console.log(`  - ${label} (ID: ${p.id})`);
    });
  }
}

checkPeriodes();
