-- 1. Cleanup Seed Data
DELETE FROM public.employees 
WHERE email IN (
    'ahmed.compta@test.com',
    'moussa.ing@test.com',
    'fatouma.chef@test.com',
    'ali.absent@test.com',
    'sarah.dg@test.com',
    'omar.tech@test.com',
    'hassan.planton@test.com'
);

-- 2. Create Sync Function
DROP FUNCTION IF EXISTS public.sync_employees_to_payroll();
DROP FUNCTION IF EXISTS public.sync_employees_to_payroll(uuid);

CREATE OR REPLACE FUNCTION public.sync_employees_to_payroll(p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert new employees from public.employees to paie_employes
    INSERT INTO public.paie_employes (
        tenant_id,
        user_id,
        nom_complet,
        fonction,
        salaire_base,
        prime_transport_fixe,
        prime_logement_fixe,
        prime_fonction_fixe,
        prime_responsabilite_fixe,
        retenue_waqf_fixe
    )
    SELECT 
        e.tenant_id,
        e.id, -- user_id in paie_employes maps to employees.id
        e.full_name,
        COALESCE(e.job_title, 'Employé'),
        COALESCE(e.salary, 0), -- Default salary if null
        0, -- Default transport
        0, -- Default logement
        0, -- Default fonction
        0, -- Default resp
        0  -- Default waqf
    FROM public.employees e
    WHERE e.tenant_id = p_tenant_id 
    AND NOT EXISTS (
        SELECT 1 FROM public.paie_employes pe WHERE pe.user_id = e.id
    );

    -- Optional: Update existing employees (name/job/salary) if changed
    -- For now, we only insert new ones to avoid overwriting manual payroll adjustments
END;
$$;
