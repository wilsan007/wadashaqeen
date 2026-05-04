-- Fix RLS Policies for Seniority Bonus Tables
-- This migration fixes the Row Level Security policies that were blocking operations

-- Drop existing policies
DROP POLICY IF EXISTS "Tenant Isolation for config_prime_anciennete" ON config_prime_anciennete;
DROP POLICY IF EXISTS "Tenant Isolation for periodes_gel_anciennete" ON periodes_gel_anciennete;

-- Fix config_prime_anciennete policies
CREATE POLICY "Enable read access for authenticated users"
ON config_prime_anciennete
FOR SELECT
USING (
    tenant_id = (
        SELECT tenant_id 
        FROM user_roles 
        WHERE user_id = auth.uid() 
        AND is_active = true 
        LIMIT 1
    )
);

CREATE POLICY "Enable insert for authenticated users"
ON config_prime_anciennete
FOR INSERT
WITH CHECK (
    tenant_id = (
        SELECT tenant_id 
        FROM user_roles 
        WHERE user_id = auth.uid() 
        AND is_active = true 
        LIMIT 1
    )
);

CREATE POLICY "Enable update for authenticated users"
ON config_prime_anciennete
FOR UPDATE
USING (
    tenant_id = (
        SELECT tenant_id 
        FROM user_roles 
        WHERE user_id = auth.uid() 
        AND is_active = true 
        LIMIT 1
    )
)
WITH CHECK (
    tenant_id = (
        SELECT tenant_id 
        FROM user_roles 
        WHERE user_id = auth.uid() 
        AND is_active = true 
        LIMIT 1
    )
);

-- Fix periodes_gel_anciennete policies
CREATE POLICY "Enable read access for authenticated users"
ON periodes_gel_anciennete
FOR SELECT
USING (
    tenant_id = (
        SELECT tenant_id 
        FROM user_roles 
        WHERE user_id = auth.uid() 
        AND is_active = true 
        LIMIT 1
    )
);

CREATE POLICY "Enable insert for authenticated users"
ON periodes_gel_anciennete
FOR INSERT
WITH CHECK (
    tenant_id = (
        SELECT tenant_id 
        FROM user_roles 
        WHERE user_id = auth.uid() 
        AND is_active = true 
        LIMIT 1
    )
);

CREATE POLICY "Enable update for authenticated users"
ON periodes_gel_anciennete
FOR UPDATE
USING (
    tenant_id = (
        SELECT tenant_id 
        FROM user_roles 
        WHERE user_id = auth.uid() 
        AND is_active = true 
        LIMIT 1
    )
)
WITH CHECK (
    tenant_id = (
        SELECT tenant_id 
        FROM user_roles 
        WHERE user_id = auth.uid() 
        AND is_active = true 
        LIMIT 1
    )
);

CREATE POLICY "Enable delete for authenticated users"
ON periodes_gel_anciennete
FOR DELETE
USING (
    tenant_id = (
        SELECT tenant_id 
        FROM user_roles 
        WHERE user_id = auth.uid() 
        AND is_active = true 
        LIMIT 1
    )
);
