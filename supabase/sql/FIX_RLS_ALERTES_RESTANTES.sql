-- =============================================================================
-- FIX_RLS_ALERTES_RESTANTES.sql
-- Corrige les 5 alertes restantes après FIX_RBAC_RLS_COMPLET.sql
-- Date : 2026-06-01
--
--  1. app_secrets           → RLS désactivé (activation + super_admin seulement)
--  2. development_plans     → 0 policy (table bloquée → inaccessible)
--  3. plan_skill_goals      → 0 policy (table bloquée → inaccessible)
--  4. training_sessions     → 0 policy (table bloquée → inaccessible)
--  5. training_skills       → 0 policy (table bloquée → inaccessible)
--
-- Les tables 2-4 n'ont pas tenant_id. Le script inspecte dynamiquement les
-- colonnes disponibles via information_schema et adapte les politiques.
-- =============================================================================

BEGIN;

-- ============================================================================
-- 1. app_secrets — données système critiques, RLS désactivé
-- ============================================================================
-- Secrets applicatifs (clés API, credentials) : accès super_admin uniquement.
-- En production : préférer service_role exclusivement via Edge Functions.

ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_secrets_superadmin_only" ON public.app_secrets;

CREATE POLICY "app_secrets_superadmin_only"
  ON public.app_secrets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id  = auth.uid()
        AND ur.is_active = true
        AND r.name = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id  = auth.uid()
        AND ur.is_active = true
        AND r.name = 'super_admin'
    )
  );

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.app_secrets FROM anon;

-- ============================================================================
-- 2. development_plans — plans de développement individuels
-- ============================================================================
-- Inspection dynamique : employee_id > tenant_id > fallback authenticated
DO $$
DECLARE
  has_employee_id boolean;
  has_tenant_id   boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'development_plans'
      AND column_name = 'employee_id'
  ) INTO has_employee_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'development_plans'
      AND column_name = 'tenant_id'
  ) INTO has_tenant_id;

  DROP POLICY IF EXISTS "dev_plans_select_self"  ON public.development_plans;
  DROP POLICY IF EXISTS "dev_plans_select_hr"    ON public.development_plans;
  DROP POLICY IF EXISTS "dev_plans_insert_hr"    ON public.development_plans;
  DROP POLICY IF EXISTS "dev_plans_update_hr"    ON public.development_plans;
  DROP POLICY IF EXISTS "dev_plans_delete_admin" ON public.development_plans;
  DROP POLICY IF EXISTS "dev_plans_tenant_access"          ON public.development_plans;
  DROP POLICY IF EXISTS "dev_plans_authenticated_read"     ON public.development_plans;
  DROP POLICY IF EXISTS "dev_plans_hr_write"               ON public.development_plans;

  IF has_employee_id THEN
    -- Employé voit son plan, HR voit tout le tenant via employees.tenant_id
    EXECUTE $p$
      CREATE POLICY "dev_plans_select_self"
        ON public.development_plans FOR SELECT
        USING (
          employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
        );
    $p$;
    EXECUTE $p$
      CREATE POLICY "dev_plans_select_hr"
        ON public.development_plans FOR SELECT
        USING (
          public.user_has_min_role('hr_manager')
          AND employee_id IN (
            SELECT id FROM public.employees WHERE tenant_id = public.get_user_tenant_id()
          )
        );
    $p$;
    EXECUTE $p$
      CREATE POLICY "dev_plans_insert_hr"
        ON public.development_plans FOR INSERT
        WITH CHECK (
          public.user_has_min_role('hr_manager')
          AND employee_id IN (
            SELECT id FROM public.employees WHERE tenant_id = public.get_user_tenant_id()
          )
        );
    $p$;
    EXECUTE $p$
      CREATE POLICY "dev_plans_update_hr"
        ON public.development_plans FOR UPDATE
        USING (
          public.user_has_min_role('hr_manager')
          AND employee_id IN (
            SELECT id FROM public.employees WHERE tenant_id = public.get_user_tenant_id()
          )
        )
        WITH CHECK (
          public.user_has_min_role('hr_manager')
          AND employee_id IN (
            SELECT id FROM public.employees WHERE tenant_id = public.get_user_tenant_id()
          )
        );
    $p$;
    EXECUTE $p$
      CREATE POLICY "dev_plans_delete_admin"
        ON public.development_plans FOR DELETE
        USING (
          public.user_has_min_role('tenant_admin')
          AND employee_id IN (
            SELECT id FROM public.employees WHERE tenant_id = public.get_user_tenant_id()
          )
        );
    $p$;
    RAISE NOTICE 'development_plans: 5 policies créées via employee_id';

  ELSIF has_tenant_id THEN
    EXECUTE $p$
      CREATE POLICY "dev_plans_tenant_access"
        ON public.development_plans FOR SELECT
        USING (tenant_id = public.get_user_tenant_id());
    $p$;
    EXECUTE $p$
      CREATE POLICY "dev_plans_hr_write"
        ON public.development_plans FOR ALL
        USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'))
        WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));
    $p$;
    RAISE NOTICE 'development_plans: policies créées via tenant_id';

  ELSE
    -- Fallback : données de cette table sans FK identifiable
    EXECUTE $p$
      CREATE POLICY "dev_plans_authenticated_read"
        ON public.development_plans FOR SELECT
        TO authenticated
        USING (true);
    $p$;
    EXECUTE $p$
      CREATE POLICY "dev_plans_hr_write"
        ON public.development_plans FOR ALL
        USING (public.user_has_min_role('hr_manager'))
        WITH CHECK (public.user_has_min_role('hr_manager'));
    $p$;
    RAISE NOTICE 'development_plans: fallback policies (ni employee_id ni tenant_id détecté)';
  END IF;
END $$;

-- ============================================================================
-- 3. plan_skill_goals — objectifs de compétences liés aux plans de développement
-- ============================================================================
-- Chaîne d'isolation : plan_id → development_plans → employee_id → employees.tenant_id
DO $$
DECLARE
  has_plan_id     boolean;
  has_employee_id boolean;
  has_tenant_id   boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plan_skill_goals'
      AND column_name = 'plan_id'
  ) INTO has_plan_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plan_skill_goals'
      AND column_name = 'employee_id'
  ) INTO has_employee_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plan_skill_goals'
      AND column_name = 'tenant_id'
  ) INTO has_tenant_id;

  DROP POLICY IF EXISTS "plan_goals_select_self" ON public.plan_skill_goals;
  DROP POLICY IF EXISTS "plan_goals_select_hr"   ON public.plan_skill_goals;
  DROP POLICY IF EXISTS "plan_goals_write_hr"    ON public.plan_skill_goals;
  DROP POLICY IF EXISTS "plan_goals_authenticated_read" ON public.plan_skill_goals;
  DROP POLICY IF EXISTS "plan_goals_hr_write"           ON public.plan_skill_goals;

  IF has_plan_id THEN
    EXECUTE $p$
      CREATE POLICY "plan_goals_select_self"
        ON public.plan_skill_goals FOR SELECT
        USING (
          plan_id IN (
            SELECT id FROM public.development_plans
            WHERE employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
          )
        );
    $p$;
    EXECUTE $p$
      CREATE POLICY "plan_goals_select_hr"
        ON public.plan_skill_goals FOR SELECT
        USING (
          public.user_has_min_role('hr_manager')
          AND plan_id IN (
            SELECT id FROM public.development_plans
            WHERE employee_id IN (
              SELECT id FROM public.employees WHERE tenant_id = public.get_user_tenant_id()
            )
          )
        );
    $p$;
    EXECUTE $p$
      CREATE POLICY "plan_goals_write_hr"
        ON public.plan_skill_goals FOR ALL
        USING (
          public.user_has_min_role('hr_manager')
          AND plan_id IN (
            SELECT id FROM public.development_plans
            WHERE employee_id IN (
              SELECT id FROM public.employees WHERE tenant_id = public.get_user_tenant_id()
            )
          )
        )
        WITH CHECK (
          public.user_has_min_role('hr_manager')
          AND plan_id IN (
            SELECT id FROM public.development_plans
            WHERE employee_id IN (
              SELECT id FROM public.employees WHERE tenant_id = public.get_user_tenant_id()
            )
          )
        );
    $p$;
    RAISE NOTICE 'plan_skill_goals: 3 policies créées via plan_id → development_plans';

  ELSIF has_employee_id THEN
    EXECUTE $p$
      CREATE POLICY "plan_goals_select_self"
        ON public.plan_skill_goals FOR SELECT
        USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
    $p$;
    EXECUTE $p$
      CREATE POLICY "plan_goals_write_hr"
        ON public.plan_skill_goals FOR ALL
        USING (
          employee_id IN (SELECT id FROM public.employees WHERE tenant_id = public.get_user_tenant_id())
          AND public.user_has_min_role('hr_manager')
        )
        WITH CHECK (
          employee_id IN (SELECT id FROM public.employees WHERE tenant_id = public.get_user_tenant_id())
          AND public.user_has_min_role('hr_manager')
        );
    $p$;
    RAISE NOTICE 'plan_skill_goals: policies créées via employee_id';

  ELSIF has_tenant_id THEN
    EXECUTE $p$
      CREATE POLICY "plan_goals_tenant_read"
        ON public.plan_skill_goals FOR SELECT
        USING (tenant_id = public.get_user_tenant_id());
    $p$;
    EXECUTE $p$
      CREATE POLICY "plan_goals_hr_write"
        ON public.plan_skill_goals FOR ALL
        USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'))
        WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));
    $p$;
    RAISE NOTICE 'plan_skill_goals: policies créées via tenant_id';

  ELSE
    EXECUTE $p$
      CREATE POLICY "plan_goals_authenticated_read"
        ON public.plan_skill_goals FOR SELECT
        TO authenticated
        USING (true);
    $p$;
    EXECUTE $p$
      CREATE POLICY "plan_goals_hr_write"
        ON public.plan_skill_goals FOR ALL
        USING (public.user_has_min_role('hr_manager'))
        WITH CHECK (public.user_has_min_role('hr_manager'));
    $p$;
    RAISE NOTICE 'plan_skill_goals: fallback policies créées';
  END IF;
END $$;

-- ============================================================================
-- 4. training_sessions — séances planifiées de formation
-- ============================================================================
DO $$
DECLARE
  has_tenant_id   boolean;
  has_employee_id boolean;
  has_training_id boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'training_sessions'
      AND column_name = 'tenant_id'
  ) INTO has_tenant_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'training_sessions'
      AND column_name = 'employee_id'
  ) INTO has_employee_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'training_sessions'
      AND column_name = 'training_id'
  ) INTO has_training_id;

  DROP POLICY IF EXISTS "training_sessions_select"           ON public.training_sessions;
  DROP POLICY IF EXISTS "training_sessions_insert"           ON public.training_sessions;
  DROP POLICY IF EXISTS "training_sessions_update"           ON public.training_sessions;
  DROP POLICY IF EXISTS "training_sessions_delete"           ON public.training_sessions;
  DROP POLICY IF EXISTS "training_sessions_tenant"           ON public.training_sessions;
  DROP POLICY IF EXISTS "training_sessions_write_hr"         ON public.training_sessions;
  DROP POLICY IF EXISTS "training_sessions_select_self"      ON public.training_sessions;
  DROP POLICY IF EXISTS "training_sessions_select_hr"        ON public.training_sessions;
  DROP POLICY IF EXISTS "training_sessions_read_authenticated" ON public.training_sessions;

  IF has_tenant_id THEN
    EXECUTE $p$
      CREATE POLICY "training_sessions_tenant"
        ON public.training_sessions FOR SELECT
        USING (tenant_id = public.get_user_tenant_id());
    $p$;
    EXECUTE $p$
      CREATE POLICY "training_sessions_write_hr"
        ON public.training_sessions FOR ALL
        USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'))
        WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));
    $p$;
    RAISE NOTICE 'training_sessions: policies via tenant_id créées';

  ELSIF has_employee_id THEN
    EXECUTE $p$
      CREATE POLICY "training_sessions_select_self"
        ON public.training_sessions FOR SELECT
        USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
    $p$;
    EXECUTE $p$
      CREATE POLICY "training_sessions_select_hr"
        ON public.training_sessions FOR SELECT
        USING (
          public.user_has_min_role('hr_manager')
          AND employee_id IN (
            SELECT id FROM public.employees WHERE tenant_id = public.get_user_tenant_id()
          )
        );
    $p$;
    EXECUTE $p$
      CREATE POLICY "training_sessions_write_hr"
        ON public.training_sessions FOR ALL
        USING (
          public.user_has_min_role('hr_manager')
          AND employee_id IN (
            SELECT id FROM public.employees WHERE tenant_id = public.get_user_tenant_id()
          )
        )
        WITH CHECK (
          public.user_has_min_role('hr_manager')
          AND employee_id IN (
            SELECT id FROM public.employees WHERE tenant_id = public.get_user_tenant_id()
          )
        );
    $p$;
    RAISE NOTICE 'training_sessions: policies via employee_id créées';

  ELSE
    -- Référentiel partagé : séances de formation = données non sensibles
    EXECUTE $p$
      CREATE POLICY "training_sessions_read_authenticated"
        ON public.training_sessions FOR SELECT
        TO authenticated
        USING (true);
    $p$;
    EXECUTE $p$
      CREATE POLICY "training_sessions_write_hr"
        ON public.training_sessions FOR ALL
        USING (public.user_has_min_role('hr_manager'))
        WITH CHECK (public.user_has_min_role('hr_manager'));
    $p$;
    RAISE NOTICE 'training_sessions: référentiel partagé — policies authenticated/hr créées';
  END IF;
END $$;

-- ============================================================================
-- 5. training_skills — table de liaison formation ↔ compétence (référentiel)
-- ============================================================================
-- Données non personnelles : liaison entre programmes de formation et compétences.
-- Lecture : tous les membres authentifiés. Écriture : hr_manager+.

DROP POLICY IF EXISTS "training_skills_select"            ON public.training_skills;
DROP POLICY IF EXISTS "training_skills_insert"            ON public.training_skills;
DROP POLICY IF EXISTS "training_skills_update"            ON public.training_skills;
DROP POLICY IF EXISTS "training_skills_delete"            ON public.training_skills;
DROP POLICY IF EXISTS "training_skills_read_authenticated" ON public.training_skills;
DROP POLICY IF EXISTS "training_skills_write_hr"           ON public.training_skills;

CREATE POLICY "training_skills_read_authenticated"
  ON public.training_skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "training_skills_write_hr"
  ON public.training_skills FOR ALL
  USING (public.user_has_min_role('hr_manager'))
  WITH CHECK (public.user_has_min_role('hr_manager'));

-- ============================================================================
-- VERIFICATION FINALE
-- ============================================================================
SELECT
  t.tablename,
  t.rowsecurity,
  (
    SELECT count(*) FROM pg_policies p
    WHERE p.tablename = t.tablename AND p.schemaname = 'public'
  ) AS policy_count,
  CASE
    WHEN t.rowsecurity = false THEN 'ALERTE: RLS DESACTIVE'
    WHEN (
      SELECT count(*) FROM pg_policies p
      WHERE p.tablename = t.tablename AND p.schemaname = 'public'
    ) = 0 THEN 'ALERTE: 0 policy (table bloquee)'
    ELSE 'OK'
  END AS status
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'app_secrets', 'development_plans', 'plan_skill_goals',
    'training_sessions', 'training_skills'
  )
ORDER BY t.tablename;

COMMIT;

-- =============================================================================
-- FIN DU SCRIPT FIX_RLS_ALERTES_RESTANTES.sql
-- =============================================================================
