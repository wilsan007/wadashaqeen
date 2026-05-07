-- ================================================================
-- Audit RLS — Wadashaqayn SaaS
-- Exécuter dans Supabase SQL Editor pour vérifier la sécurité
-- ================================================================

-- 1. Tables sans RLS activé (CRITIQUE)
SELECT
  schemaname,
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ RLS activé' ELSE '🚨 RLS DÉSACTIVÉ' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity ASC, tablename;

-- 2. Policies trop permissives (ALL sans condition)
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'ALL'
  AND (qual = 'true' OR qual IS NULL)
ORDER BY tablename;

-- 3. Tables avec RLS activé mais AUCUNE policy définie (faux sentiment de sécurité)
SELECT t.tablename,
       '⚠️  RLS actif mais aucune policy — accès bloqué pour tous' AS warning
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = t.tablename
  );

-- 4. Vérifier que tenant_id est bien utilisé dans les policies
SELECT
  tablename,
  policyname,
  qual,
  CASE
    WHEN qual LIKE '%tenant_id%' THEN '✅ tenant_id présent'
    WHEN qual LIKE '%auth.uid()%' THEN '⚠️  user_id seulement (pas tenant_id)'
    ELSE '🚨 Pas de filtre tenant'
  END AS tenant_isolation
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd IN ('SELECT', 'ALL')
ORDER BY tablename;

-- 5. Résumé global
SELECT
  COUNT(*) FILTER (WHERE rowsecurity = true) AS tables_rls_active,
  COUNT(*) FILTER (WHERE rowsecurity = false) AS tables_rls_missing,
  COUNT(*) AS total_tables
FROM pg_tables
WHERE schemaname = 'public';
