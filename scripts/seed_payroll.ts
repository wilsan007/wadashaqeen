import { createClient } from '@supabase/supabase-js';
import { addMonths, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { randomUUID } from 'crypto';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg4OTg0NiwiZXhwIjoyMDc4MjQ5ODQ2fQ.Pqkp9LPw4K_gKTsoBe6yRtTBqBxRMrjGj4t2CpC6zAc';

const supabase = createClient(supabaseUrl, supabaseKey);

const TENANT_ID = '878c5ac9-4e99-4baf-803a-14f8ac964ec4';

async function seedPayroll() {
  console.log('Starting payroll seeding...');

  // 1. Create Periods
  console.log('Creating periods...');
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const date = addMonths(today, -i);
    const startDate = startOfMonth(date);
    const endDate = endOfMonth(date);

    const { error } = await supabase.from('paie_periodes').upsert(
      {
        tenant_id: TENANT_ID,
        mois: startDate.getMonth() + 1,
        annee: startDate.getFullYear(),
        date_debut: startDate.toISOString(),
        date_fin: endDate.toISOString(),
        est_cloture: false,
        est_paye: false,
      },
      { onConflict: 'tenant_id,mois,annee' }
    );

    if (error) console.error('Error creating period:', error);
  }

  // 2. Ensure Departments
  console.log('Ensuring departments...');
  const departments = ['Finance', 'Technique', 'Opérations', 'Direction', 'Services Généraux'];
  const deptIds: Record<string, string> = {};

  for (const deptName of departments) {
    const { data: existing } = await supabase
      .from('departments')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('name', deptName)
      .single();

    if (existing) {
      deptIds[deptName] = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from('departments')
        .insert({ tenant_id: TENANT_ID, name: deptName })
        .select('id')
        .single();

      if (error) console.error(`Error creating department ${deptName}:`, error);
      else if (created) deptIds[deptName] = created.id;
    }
  }

  // 3. Create Employees
  console.log('Creating employees...');

  const employees = [
    {
      email: 'ahmed.compta@test.com',
      full_name: 'Ahmed Comptable',
      job_title: 'Chef Service Comptable',
      department: 'Finance',
      employee_id: 'EMP-001',
      payroll: {
        salaire_base: 213500,
        prime_fonction_fixe: 40708,
        prime_logement_fixe: 50000,
        retenue_waqf_fixe: 400,
        prime_responsabilite_fixe: 120000,
      },
      loan: { amount: 1000000, monthly: 100000 },
    },
    {
      email: 'moussa.ing@test.com',
      full_name: 'Moussa Ingenieur',
      job_title: 'Ingénieur',
      department: 'Technique',
      employee_id: 'EMP-002',
      payroll: {
        salaire_base: 213500,
        retenue_waqf_fixe: 400,
        prime_responsabilite_fixe: 100000,
      },
    },
    {
      email: 'fatouma.chef@test.com',
      full_name: 'Fatouma Chef',
      job_title: 'Chef Service',
      department: 'Opérations',
      employee_id: 'EMP-003',
      payroll: {
        salaire_base: 213500,
        prime_fonction_fixe: 40708,
        prime_logement_fixe: 50000,
        retenue_waqf_fixe: 400,
        prime_responsabilite_fixe: 150000,
      },
    },
    {
      email: 'ali.absent@test.com',
      full_name: 'Ali Absent',
      job_title: 'Chef Service',
      department: 'Opérations',
      employee_id: 'EMP-004',
      payroll: {
        salaire_base: 213500,
        prime_fonction_fixe: 40708,
        prime_logement_fixe: 50000,
        retenue_waqf_fixe: 400,
        prime_responsabilite_fixe: 130000,
      },
      absence: { days: 5 },
    },
    {
      email: 'sarah.dg@test.com',
      full_name: 'Sarah Assistante',
      job_title: 'Assistance DG',
      department: 'Direction',
      employee_id: 'EMP-005',
      payroll: {
        salaire_base: 151800,
        prime_transport_fixe: 10000,
        retenue_waqf_fixe: 400,
        prime_responsabilite_fixe: 100000,
      },
    },
    {
      email: 'omar.tech@test.com',
      full_name: 'Omar Tech',
      job_title: 'Technicien',
      department: 'Technique',
      employee_id: 'EMP-006',
      payroll: {
        salaire_base: 71728,
        retenue_waqf_fixe: 400,
      },
      absence: { days: 3 },
      advance: { amount: 20000 },
    },
    {
      email: 'hassan.planton@test.com',
      full_name: 'Hassan Planton',
      job_title: 'Planton',
      department: 'Services Généraux',
      employee_id: 'EMP-007',
      payroll: {
        salaire_base: 56303,
        retenue_waqf_fixe: 400,
      },
    },
  ];

  for (const emp of employees) {
    // Upsert Employee
    let empId;
    let userId; // We need to track user_id for leave_requests

    const { data: existingEmp } = await supabase
      .from('employees')
      .select('id, user_id')
      .eq('email', emp.email)
      .single();

    if (existingEmp) {
      empId = existingEmp.id;
      userId = existingEmp.user_id;

      // If user_id is missing, generate one and update
      if (!userId) {
        userId = randomUUID();
        await supabase
          .from('employees')
          .update({
            user_id: userId,
          })
          .eq('id', empId);
      }

      await supabase
        .from('employees')
        .update({
          full_name: emp.full_name,
          department_id: deptIds[emp.department],
          job_title: emp.job_title,
          employee_id: emp.employee_id,
          status: 'active',
        })
        .eq('id', empId);
    } else {
      userId = randomUUID();
      const { data: newEmp, error } = await supabase
        .from('employees')
        .insert({
          tenant_id: TENANT_ID,
          email: emp.email,
          full_name: emp.full_name,
          department_id: deptIds[emp.department],
          job_title: emp.job_title,
          employee_id: emp.employee_id,
          status: 'active',
          user_id: userId, // Insert fake user_id
        })
        .select('id')
        .single();

      if (error) {
        console.error(`Error creating employee ${emp.full_name}:`, error);
        continue;
      }
      empId = newEmp.id;
    }

    // Upsert Payroll Employee
    let paieEmpId;
    const { data: existingPaieEmp } = await supabase
      .from('paie_employes')
      .select('id')
      .eq('user_id', empId) // paie_employes.user_id links to employees.id
      .single();

    const payrollData = {
      tenant_id: TENANT_ID,
      user_id: empId, // Link to employees.id
      nom_complet: emp.full_name,
      fonction: emp.job_title,
      ...emp.payroll,
    };

    if (existingPaieEmp) {
      paieEmpId = existingPaieEmp.id;
      await supabase.from('paie_employes').update(payrollData).eq('id', paieEmpId);
    } else {
      const { data: newPaieEmp, error } = await supabase
        .from('paie_employes')
        .insert(payrollData)
        .select('id')
        .single();

      if (error) {
        console.error(`Error creating payroll employee ${emp.full_name}:`, error);
        continue;
      }
      paieEmpId = newPaieEmp.id;
    }

    // Handle Loan
    if (emp.loan) {
      await supabase.from('paie_avances_prets').insert({
        employe_id: paieEmpId,
        type: 'pret',
        montant: emp.loan.amount,
        date_demande: subDays(new Date(), 60).toISOString(),
        date_debut_remboursement: subDays(new Date(), 30).toISOString(),
        mensualite: emp.loan.monthly,
        statut: 'en_cours',
      });
    }

    // Handle Advance
    if (emp.advance) {
      await supabase.from('paie_avances_prets').insert({
        employe_id: paieEmpId,
        type: 'avance',
        montant: emp.advance.amount,
        date_demande: new Date().toISOString(),
        statut: 'en_cours',
      });
    }

    // Handle Absence
    if (emp.absence) {
      // Get absence type
      const { data: types } = await supabase.from('absence_types').select('id').limit(1);
      if (types && types.length > 0) {
        // Check if request already exists to avoid duplicates
        const { data: existingRequest } = await supabase
          .from('leave_requests')
          .select('id')
          .eq('employee_id', userId) // Use userId (employees.user_id)
          .eq('start_date', subDays(new Date(), emp.absence.days).toISOString())
          .single();

        if (!existingRequest) {
          const { error: leaveError } = await supabase.from('leave_requests').insert({
            employee_id: userId, // Use userId (employees.user_id)
            absence_type_id: types[0].id,
            start_date: subDays(new Date(), emp.absence.days).toISOString(),
            end_date: new Date().toISOString(),
            total_days: emp.absence.days,
            status: 'approved',
            reason: 'Congé test',
            tenant_id: TENANT_ID, // Add tenant_id
          });
          if (leaveError)
            console.error(`Error creating leave request for ${emp.full_name}:`, leaveError);
        }
      }
    }
  }

  console.log('Seeding completed!');
}

seedPayroll();
