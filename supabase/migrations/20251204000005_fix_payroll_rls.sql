-- Fix RLS Policies for Payroll Module
-- Previous policies relied on 'app.current_tenant_id' setting which is not reliably set in all contexts.
-- New policies check public.user_roles directly to ensure robust access control.

-- 1. paie_employes
DROP POLICY IF EXISTS "Tenant Isolation Policy for paie_employes" ON paie_employes;
CREATE POLICY "Tenant Isolation Policy for paie_employes" ON paie_employes
    FOR ALL TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- 2. paie_periodes
DROP POLICY IF EXISTS "Tenant Isolation Policy for paie_periodes" ON paie_periodes;
CREATE POLICY "Tenant Isolation Policy for paie_periodes" ON paie_periodes
    FOR ALL TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- 3. paie_elements_variables
DROP POLICY IF EXISTS "Tenant Isolation Policy for paie_elements_variables" ON paie_elements_variables;
CREATE POLICY "Tenant Isolation Policy for paie_elements_variables" ON paie_elements_variables
    FOR ALL TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- 4. paie_bulletins
DROP POLICY IF EXISTS "Tenant Isolation Policy for paie_bulletins" ON paie_bulletins;
CREATE POLICY "Tenant Isolation Policy for paie_bulletins" ON paie_bulletins
    FOR ALL TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- 5. ref_bareme_its (Optional update for consistency, though previous was permissive)
-- Keeping existing permissive read policy, but restricting write if needed.
-- For now, we leave ref_bareme_its as is since it was USING (true).
