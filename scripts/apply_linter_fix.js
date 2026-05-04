import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env vars from root .env
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variables d'environnement manquantes!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('\n🚀 Application du correctif linter...\n');

  try {
    const migrationPath = resolve(process.cwd(), 'migrations/fix_linter_issues.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('Lecture du fichier:', migrationPath);

    // Split into statements because exec_sql might handle one at a time or we want to be safe
    // But the original script tried to run the whole thing first.
    // Let's try running the whole thing first.

    // Note: exec_sql is a custom RPC function. If it doesn't exist, we might need another way.
    // But since apply-migration.js uses it, it likely exists.

    const { error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL,
    });

    if (error) {
      console.error('❌ Erreur RPC:', error.message);
      console.log('Tentative par instructions individuelles...');

      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const stmt of statements) {
        console.log(`Exécution: ${stmt.substring(0, 50)}...`);
        const { error: stmtError } = await supabase.rpc('exec_sql', {
          sql_query: stmt + ';',
        });
        if (stmtError) {
          console.error(`❌ Erreur: ${stmtError.message}`);
        } else {
          console.log('✅ OK');
        }
      }
    } else {
      console.log('✅ Migration appliquée avec succès!');
    }
  } catch (err) {
    console.error('❌ Erreur script:', err.message);
  }
}

applyMigration();
