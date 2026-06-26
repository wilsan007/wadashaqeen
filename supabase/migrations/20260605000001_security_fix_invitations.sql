-- Security fix: remove plaintext temp_password from invitations metadata
-- and restrict SELECT access to authenticated users only.

BEGIN;

-- ─── 1. Scrub any existing temp_password stored in invitations.metadata ────────
UPDATE public.invitations
SET metadata = metadata - 'temp_password'
WHERE metadata ? 'temp_password';

-- ─── 2. Restrict RLS: authenticated users can only read their own invitations ──
-- The broad "USING (true)" SELECT policy was dropped in migration 20250111000219.
-- We add a scoped policy so that the frontend auth-callback and invite pages can
-- still look up invitations without exposing other tenants' data to anon callers.

DROP POLICY IF EXISTS "Users can read own invitations" ON public.invitations;
CREATE POLICY "Users can read own invitations"
  ON public.invitations FOR SELECT
  TO authenticated
  USING (email = auth.email());

-- Note: "Admins can view invitations" (tenant_id = get_current_tenant_id()) and
-- "Super admin can manage invitations" remain in place from prior migrations and
-- cover admin-level access correctly.

COMMIT;
