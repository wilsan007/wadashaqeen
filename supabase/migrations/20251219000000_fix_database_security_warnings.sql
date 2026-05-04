-- Migration: Secure Database Functions and Extensions
-- Date: 2025-12-19
-- Description: Fixes security warnings by moving pg_net to extensions schema and setting fixed search_path for functions

BEGIN;

-- 1. Ensure extensions schema exists and move pg_net
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- Move pg_net extension by dropping and recreating it
-- NOTE: This is necessary because pg_net does not support ALTER EXTENSION SET SCHEMA
-- WARNING: This gives a clean slate for pg_net. Any pending requests in the queue will be lost.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pg_net' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- We must drop it first as it doesn't support relocation
    DROP EXTENSION pg_net;
    -- Recreate in extensions schema
    CREATE EXTENSION pg_net SCHEMA extensions;
    RAISE NOTICE 'Recreated pg_net extension in extensions schema';
  END IF;
END $$;

-- 2. Secure functions by setting search_path
DO $$
DECLARE
  func_name text;
  func_oid oid;
  func_args text;
  sql_statement text;
  -- List of functions to secure
  target_functions text[] := ARRAY[
    'get_next_employee_id',
    'get_action_attachments_count',
    'can_validate_action',
    'delete_action_attachments_on_action_delete',
    'is_email_in_tenant',
    'validate_collaborator_invitation',
    'get_task_attachments_count',
    'can_validate_task',
    'delete_task_attachments_on_task_delete',
    'update_session_participants_count',
    'sync_employees_to_payroll',
    'trigger_create_leave_workflow',
    'get_next_approver',
    'generate_employee_id',
    'update_timesheet_total_hours',
    'update_task_templates_updated_at',
    'increment_template_usage',
    'update_leave_approvals_updated_at',
    'process_leave_approval',
    'create_leave_approval_workflow',
    'update_notifications_updated_at',
    'create_notification',
    'notify_new_leave_request',
    'notify_leave_decision',
    'update_task_dependencies_timestamp',
    'check_dependency_cycle',
    'prevent_dependency_cycle',
    'get_task_dependencies',
    'get_dependency_chain',
    'trigger_handle_collaborator_confirmation',
    'get_task_history'
  ];
BEGIN
  FOREACH func_name IN ARRAY target_functions
  LOOP
    -- Find all function signatures for this name in public schema
    FOR func_oid, func_args IN 
      SELECT p.oid, pg_get_function_identity_arguments(p.oid)
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND p.proname = func_name
    LOOP
      -- Construct ALTER FUNCTION statement
      -- We must use format() to safely inject the argument list
      sql_statement := format(
        'ALTER FUNCTION public.%I(%s) SET search_path = public, extensions, pg_temp;',
        func_name,
        func_args
      );
      
      -- Execute the statement
      EXECUTE sql_statement;
      
      RAISE NOTICE 'Secured function public.%(%)', func_name, func_args;
    END LOOP;
  END LOOP;
END $$;

COMMIT;
