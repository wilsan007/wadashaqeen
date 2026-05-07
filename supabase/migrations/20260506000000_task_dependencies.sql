-- ============================================================
-- Migration : table task_dependencies
-- Date      : 2026-05-06
-- Note      : La table est déjà présente dans la BDD de production.
--             Ce fichier sert de référence pour les environnements
--             locaux/staging qui n'ont pas encore cette migration.
-- ============================================================

-- ─── Table ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id             uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id  uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  dependency_type     text NOT NULL DEFAULT 'finish-to-start'
                        CHECK (dependency_type IN (
                          'finish-to-start',
                          'start-to-start',
                          'finish-to-finish',
                          'start-to-finish'
                        )),
  lag_days            integer DEFAULT 0,
  tenant_id           uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),

  -- Évite les doublons de dépendance entre deux tâches dans le même sens
  CONSTRAINT uq_task_dependency UNIQUE (task_id, depends_on_task_id, dependency_type)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id
  ON public.task_dependencies (task_id);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on_task_id
  ON public.task_dependencies (depends_on_task_id);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_tenant_id
  ON public.task_dependencies (tenant_id);

-- ─── Trigger updated_at ──────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at_task_dependencies'
      AND tgrelid = 'public.task_dependencies'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at_task_dependencies
      BEFORE UPDATE ON public.task_dependencies
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
EXCEPTION WHEN undefined_function THEN
  -- La fonction set_updated_at() n'existe pas encore : on ignore silencieusement
  NULL;
END;
$$;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent (idempotence)
DROP POLICY IF EXISTS "task_dep_select"  ON public.task_dependencies;
DROP POLICY IF EXISTS "task_dep_insert"  ON public.task_dependencies;
DROP POLICY IF EXISTS "task_dep_update"  ON public.task_dependencies;
DROP POLICY IF EXISTS "task_dep_delete"  ON public.task_dependencies;

-- SELECT : membres du tenant peuvent lire les dépendances de leurs tâches
CREATE POLICY "task_dep_select"
ON public.task_dependencies
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    WHERE t.id = task_dependencies.task_id
      AND t.tenant_id IN (
        SELECT tenant_id
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
      )
  )
);

-- INSERT : membres du tenant peuvent créer des dépendances sur leurs tâches
CREATE POLICY "task_dep_insert"
ON public.task_dependencies
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    WHERE t.id = task_dependencies.task_id
      AND t.tenant_id IN (
        SELECT tenant_id
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
      )
  )
);

-- UPDATE : membres du tenant peuvent modifier leurs dépendances
CREATE POLICY "task_dep_update"
ON public.task_dependencies
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    WHERE t.id = task_dependencies.task_id
      AND t.tenant_id IN (
        SELECT tenant_id
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
      )
  )
);

-- DELETE : membres du tenant peuvent supprimer leurs dépendances
CREATE POLICY "task_dep_delete"
ON public.task_dependencies
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    WHERE t.id = task_dependencies.task_id
      AND t.tenant_id IN (
        SELECT tenant_id
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
      )
  )
);
