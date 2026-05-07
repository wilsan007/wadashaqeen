-- ============================================================================
-- Migration: Support du logo tenant
-- Date: 2026-05-06
-- ============================================================================

-- 1. Ajouter la colonne logo_url sur la table tenants (idempotent)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS logo_url text;

-- 2. Créer le bucket tenant-logos (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-logos',
  'tenant-logos',
  true,
  2097152, -- 2 MB max
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];

-- 3. Supprimer les anciennes policies si elles existent déjà (idempotent)
DROP POLICY IF EXISTS "Tenant members can upload logo" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view logos" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can update tenant logo" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can delete tenant logo" ON storage.objects;

-- 4. Lecture publique
CREATE POLICY "Anyone can view logos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'tenant-logos');

-- 5. Upload par les admins du tenant
CREATE POLICY "Tenant members can upload logo"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'tenant-logos'
    AND EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.tenant_id::text = (storage.foldername(name))[1]
        AND r.name IN ('tenant_owner', 'tenant_admin', 'admin', 'super_admin')
        AND ur.is_active = true
    )
  );

-- 6. Mise à jour par les admins du tenant
CREATE POLICY "Tenant admins can update tenant logo"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'tenant-logos'
    AND EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.tenant_id::text = (storage.foldername(name))[1]
        AND r.name IN ('tenant_owner', 'tenant_admin', 'admin', 'super_admin')
        AND ur.is_active = true
    )
  );

-- 7. Suppression par les admins du tenant
CREATE POLICY "Tenant admins can delete tenant logo"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'tenant-logos'
    AND EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.tenant_id::text = (storage.foldername(name))[1]
        AND r.name IN ('tenant_owner', 'tenant_admin', 'admin', 'super_admin')
        AND ur.is_active = true
    )
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Colonne tenants.logo_url présente (IF NOT EXISTS)';
  RAISE NOTICE '✅ Bucket tenant-logos configuré (public, 2 MB max)';
  RAISE NOTICE '✅ Policies RLS appliquées sur storage.objects';
END $$;
