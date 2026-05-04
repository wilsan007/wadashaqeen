-- Fix onboard_tenant_owner function to ensure Profile and Employee are created
-- This function replaces the existing one to add proper transactional creation of all required records

DROP FUNCTION IF EXISTS public.onboard_tenant_owner(uuid, text, text, text, uuid);



CREATE OR REPLACE FUNCTION public.onboard_tenant_owner(
    p_user_id UUID,
    p_email TEXT,
    p_slug TEXT,
    p_tenant_name TEXT,
    p_invite_code UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_id UUID;
    v_role_id UUID;
    v_employee_id UUID;
    v_employee_code TEXT;
BEGIN
    -- 1. Create Tenant
    INSERT INTO public.tenants (name, slug, subscription_plan, status)
    VALUES (p_tenant_name, p_slug, 'TRIAL', 'ACTIVE')
    RETURNING id INTO v_tenant_id;

    -- 2. Get Tenant Owner Role ID
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'tenant_admin';
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role tenant_admin not found';
    END IF;

    -- 3. Create Profile
    INSERT INTO public.profiles (
        user_id,
        email,
        full_name,
        role,
        tenant_id
    )
    VALUES (
        p_user_id,
        p_email,
        'Admin ' || p_tenant_name, -- Default name
        'tenant_admin',
        v_tenant_id
    );
    -- Note: Profiles might trigger Employee creation, but we explicitly do it to be safe and set specific fields

    -- 4. Create Employee
    -- Generate simple unique code
    v_employee_code := 'EMP-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 6);
    
    INSERT INTO public.employees (
        tenant_id,
        user_id,
        full_name,
        email,
        employee_id,
        status,
        created_at
    )
    VALUES (
        v_tenant_id,
        p_user_id,
        'Admin ' || p_tenant_name,
        p_email,
        v_employee_code,
        'active',
        NOW()
    )
    RETURNING id INTO v_employee_id;

    -- 5. Assign Role
    INSERT INTO public.user_roles (
        user_id,
        role_id,
        tenant_id,
        assigned_at,
        is_active
    )
    VALUES (
        p_user_id,
        v_role_id,
        v_tenant_id,
        NOW(),
        true
    );

    -- 6. Update Invitation
    UPDATE public.invitations
    SET 
        status = 'accepted',
        accepted_at = NOW(),
        accepted_by = p_user_id,
        tenant_id = v_tenant_id -- Link invitation to created tenant if not already
    WHERE id = p_invite_code;

    -- Return result
    RETURN jsonb_build_object(
        'success', true,
        'tenant_id', v_tenant_id,
        'user_id', p_user_id,
        'employee_id', v_employee_id,
        'role_name', 'tenant_admin'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$$;
