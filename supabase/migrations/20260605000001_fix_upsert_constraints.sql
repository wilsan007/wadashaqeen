-- ============================================================
-- Fix: Add missing composite UNIQUE constraints needed by
-- Edge Function upsert operations
-- ============================================================

-- 1. employees: add UNIQUE(user_id, tenant_id)
--
--    IMPORTANT: We do NOT drop unique_employees_user_id because 17 FK
--    constraints in other tables (absences, attendances, evaluations,
--    tasks, leave_requests, etc.) reference employees.user_id via that
--    index. Dropping it would cascade-destroy all those FKs.
--
--    Since user_id is already globally unique on employees, the composite
--    (user_id, tenant_id) is also unique by transitivite — PostgreSQL
--    allows adding it as a second distinct constraint without conflict.
--
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'employees_user_id_tenant_id_key'
    AND conrelid = 'public.employees'::regclass
  ) THEN
    ALTER TABLE public.employees
      ADD CONSTRAINT employees_user_id_tenant_id_key UNIQUE (user_id, tenant_id);
    RAISE NOTICE 'Added employees_user_id_tenant_id_key constraint';
  ELSE
    RAISE NOTICE 'employees_user_id_tenant_id_key already exists — skipping';
  END IF;
END $$;

-- 2. user_roles: add UNIQUE(user_id, role_id, tenant_id)
--
--    The existing constraint is (user_id, role_id, context_type, context_id).
--    We add a simpler composite for Edge Function upsert idempotency.
--
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_roles_user_id_role_id_tenant_id_key'
    AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_role_id_tenant_id_key UNIQUE (user_id, role_id, tenant_id);
    RAISE NOTICE 'Added user_roles_user_id_role_id_tenant_id_key constraint';
  ELSE
    RAISE NOTICE 'user_roles_user_id_role_id_tenant_id_key already exists — skipping';
  END IF;
END $$;
