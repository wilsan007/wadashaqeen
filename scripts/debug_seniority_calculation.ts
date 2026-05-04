import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import SeniorityBonusService from '../src/services/seniorityBonusService';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Monkey patch supabase client for the service
(global as any).supabase = supabase;

async function debugSeniority() {
  console.log('--- Debug Seniority Calculation ---');

  // 1. Get Tenants
  const { data: tenants } = await supabase.from('tenants').select('id, name');

  if (!tenants || tenants.length === 0) {
    console.log('No tenants found');
    return;
  }

  for (const tenant of tenants) {
    console.log(`\nTenant: ${tenant.name} (${tenant.id})`);

    // 2. Get Config
    try {
      const config = await SeniorityBonusService.getConfig(tenant.id);
      console.log('Config:', config);
    } catch (e) {
      console.log('Error fetching config:', e);
    }

    // 3. Get Freeze Periods
    const periods = await SeniorityBonusService.getFreezePeriods(tenant.id);
    console.log('Freeze Periods:', periods);

    // 4. Get Employees
    const { data: employees } = await supabase
      .from('paie_employes')
      .select('*')
      .eq('tenant_id', tenant.id);

    if (!employees || employees.length === 0) {
      console.log('No employees found');
      continue;
    }

    console.log(`Found ${employees.length} employees`);

    for (const emp of employees) {
      console.log(`\nEmployee: ${emp.nom_complet} (${emp.id})`);
      console.log(`  Salaire Base: ${emp.salaire_base}`);
      console.log(`  Date Embauche: ${emp.date_embauche}`);

      if (!emp.date_embauche) {
        console.log('  -> SKIP: No hire date');
        continue;
      }

      const dateReference = new Date().toISOString().split('T')[0]; // Today

      try {
        // Test effective seniority
        const months = await SeniorityBonusService.calculateEffectiveSeniority(
          emp.date_embauche,
          dateReference,
          tenant.id
        );
        console.log(`  Effective Seniority (months): ${months}`);
        console.log(`  Expected Periods: ${Math.floor(months / 24)}`); // Assuming 24 months config

        // Test bonus calculation
        const bonus = await SeniorityBonusService.calculateSeniorityBonus(
          emp.salaire_base,
          emp.date_embauche,
          dateReference,
          tenant.id
        );
        console.log(`  Calculated Bonus: ${bonus}`);

        if (bonus === 0) {
          if (months < 24) console.log('  -> REASON: Less than 24 months seniority');
          else console.log('  -> REASON: Other (check logic)');
        }
      } catch (e) {
        console.error('  -> ERROR Calculating:', e);
      }
    }
  }
}

debugSeniority().catch(console.error);
