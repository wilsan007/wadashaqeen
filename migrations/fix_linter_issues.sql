-- Fix security_definer_view linter issue
-- Make the view respect the RLS policies of the invoking user
ALTER VIEW public.v_task_dependencies_info SET (security_invoker = true);

-- Fix rls_disabled_in_public linter issue
-- Enable RLS on the webhook_logs table
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Add policy to allow service_role full access (since it's a system log table)
-- If admins need access, we can add another policy later.
CREATE POLICY "Enable access to service_role" ON public.webhook_logs 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);
