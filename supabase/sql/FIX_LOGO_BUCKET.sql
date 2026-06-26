-- ============================================================================
-- FIX DÉFINITIF : Bucket tenant-logos + policies RLS
-- Pattern identique aux autres buckets fonctionnels du projet (profiles)
-- ============================================================================
-- À exécuter dans : Supabase Dashboard → SQL Editor → Run
-- ============================================================================

-- ─── 1. Bucket ───────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-logos',
  'tenant-logos',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public             = true,
  file_size_limit    = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];

-- ─── 2. Supprimer toutes les anciennes policies du bucket ────────────────────
DROP POLICY IF EXISTS "Anyone can view logos"                ON storage.objects;
DROP POLICY IF EXISTS "Tenant members can upload logo"       ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can update tenant logo" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can delete tenant logo" ON storage.objects;
DROP POLICY IF EXISTS "Public can view tenant logos"         ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload tenant logos"       ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete tenant logos"       ON storage.objects;
DROP POLICY IF EXISTS "Admins can update tenant logos"       ON storage.objects;
DROP POLICY IF EXISTS "tenant_logos_public_read"             ON storage.objects;
DROP POLICY IF EXISTS "tenant_logos_admin_insert"            ON storage.objects;
DROP POLICY IF EXISTS "tenant_logos_admin_delete"            ON storage.objects;
DROP POLICY IF EXISTS "tenant_logos_admin_update"            ON storage.objects;

-- ─── 3. Lecture publique ─────────────────────────────────────────────────────
CREATE POLICY "tenant_logos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tenant-logos');

-- ─── 4. Upload : membres du tenant uniquement ────────────────────────────────
-- Même pattern que les autres buckets fonctionnels du projet (action-attachments, etc.)
-- Le 1er dossier du chemin doit correspondre au tenant_id de l'utilisateur
CREATE POLICY "tenant_logos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tenant-logos'
    AND (storage.foldername(name))[1] = ANY (
      ARRAY(
        SELECT (profiles.tenant_id)::text
        FROM public.profiles
        WHERE profiles.user_id = auth.uid()
      )
    )
  );

-- ─── 5. Suppression ──────────────────────────────────────────────────────────
CREATE POLICY "tenant_logos_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tenant-logos'
    AND (storage.foldername(name))[1] = ANY (
      ARRAY(
        SELECT (profiles.tenant_id)::text
        FROM public.profiles
        WHERE profiles.user_id = auth.uid()
      )
    )
  );

-- ─── 6. Mise à jour ──────────────────────────────────────────────────────────
CREATE POLICY "tenant_logos_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'tenant-logos'
    AND (storage.foldername(name))[1] = ANY (
      ARRAY(
        SELECT (profiles.tenant_id)::text
        FROM public.profiles
        WHERE profiles.user_id = auth.uid()
      )
    )
  );

-- ─── 7. Colonne logo_url sur tenants (idempotent) ────────────────────────────
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS logo_url text;

-- ─── 8. Vérification ─────────────────────────────────────────────────────────
-- Résultat attendu : 1 ligne avec nb_policies = 4
SELECT
  b.id,
  b.name,
  b.public,
  b.allowed_mime_types,
  (
    SELECT count(*) FROM pg_policies p
    WHERE p.schemaname = 'storage'
      AND p.tablename  = 'objects'
      AND p.policyname LIKE 'tenant_logos%'
  ) AS nb_policies
FROM storage.buckets b
WHERE b.id = 'tenant-logos';
