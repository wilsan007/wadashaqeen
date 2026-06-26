-- =============================================================================
-- FIX_RBAC_RLS_COMPLET.sql
-- Audit et correction complète du système RBAC + RLS — Wadashaqayn SaaS
-- Date     : 2026-06-01
-- Standard : OWASP A01:2021 / Supabase Security Advisor / NIST 800-53 AC-3
-- =============================================================================
-- INSTRUCTIONS D'APPLICATION
--   1. Ouvrir Supabase Dashboard > SQL Editor
--   2. Coller et exécuter ce fichier intégralement dans une transaction
--   3. Vérifier la section "VERIFICATION POST-CORRECTION" en fin de fichier
--   4. En cas d'erreur, le bloc BEGIN/COMMIT isole tout dans la même transaction
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- SECTION 0 : FONCTION HELPER ROBUSTE user_has_min_role()
-- ---------------------------------------------------------------------------
-- Remplace user_has_role() qui dépend de app.current_tenant_id (non fiable).
-- Utilise get_user_tenant_id() (SECURITY DEFINER, interroge tenant_members).
-- Hiérarchie stockée dans roles.hierarchy_level (0=super_admin … 70=viewer).
-- Fonctionne automatiquement avec les rôles custom (Designer, DevOps, etc.).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_has_min_role(min_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id   = auth.uid()
      AND ur.tenant_id = public.get_user_tenant_id()
      AND ur.is_active = true
      AND r.hierarchy_level <= (
            SELECT hierarchy_level
            FROM   roles
            WHERE  name = min_role
            LIMIT  1
          )
  );
$$;

-- Fonction d'appartenance au tenant (utilisée partout en lecture)
-- Inclut les super_admin qui n'ont pas forcément un enregistrement dans tenant_members
CREATE OR REPLACE FUNCTION public.is_tenant_member()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (public.get_user_tenant_id() IS NOT NULL)
      OR EXISTS (
           SELECT 1 FROM user_roles
           WHERE user_id  = auth.uid()
             AND is_active = true
             AND role_id   IN (SELECT id FROM roles WHERE name = 'super_admin')
         );
$$;

-- ---------------------------------------------------------------------------
-- SECTION 1 : CORRECTION — skills (USING(true) remplacé par filtre tenant)
-- ---------------------------------------------------------------------------
-- Critique 2 : 20250928023500 crée "skills_read_all" USING(true) sans tenant

DROP POLICY IF EXISTS "skills_read_all"    ON public.skills;
DROP POLICY IF EXISTS "skills_write_admin" ON public.skills;

-- Après correction : lecture pour tout membre du tenant, écriture super_admin seulement
CREATE POLICY "skills_select_tenant"
  ON public.skills
  FOR SELECT
  USING (
    -- skills sans tenant_id = données globales partagées (référentiel)
    tenant_id IS NULL
    OR tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "skills_insert_admin"
  ON public.skills
  FOR INSERT
  WITH CHECK (
    public.user_has_min_role('tenant_admin')
    AND (tenant_id IS NULL OR tenant_id = public.get_user_tenant_id())
  );

CREATE POLICY "skills_update_admin"
  ON public.skills
  FOR UPDATE
  USING (
    public.user_has_min_role('tenant_admin')
    AND (tenant_id IS NULL OR tenant_id = public.get_user_tenant_id())
  )
  WITH CHECK (
    public.user_has_min_role('tenant_admin')
    AND (tenant_id IS NULL OR tenant_id = public.get_user_tenant_id())
  );

CREATE POLICY "skills_delete_admin"
  ON public.skills
  FOR DELETE
  USING (
    public.user_has_min_role('tenant_admin')
    AND (tenant_id IS NULL OR tenant_id = public.get_user_tenant_id())
  );

-- ---------------------------------------------------------------------------
-- SECTION 2 : CORRECTION — departments (USING(true) possible, remplacé)
-- ---------------------------------------------------------------------------
-- Correction préventive en cas de doublon/résidu de l'ancienne migration

DROP POLICY IF EXISTS "departments_read_all"    ON public.departments;
DROP POLICY IF EXISTS "departments_tenant_access" ON public.departments;

CREATE POLICY "departments_select_tenant"
  ON public.departments
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "departments_insert_admin"
  ON public.departments
  FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "departments_update_admin"
  ON public.departments
  FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "departments_delete_admin"
  ON public.departments
  FOR DELETE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('tenant_admin')
  );

-- ---------------------------------------------------------------------------
-- SECTION 3 : CORRECTION — ref_bareme_its (USING(true) en lecture ET écriture)
-- ---------------------------------------------------------------------------
-- 20251203000000 crée deux politiques USING(true) pour authenticated
-- Corrigé : lecture libre (données fiscales de référence), écriture hr_manager+

DROP POLICY IF EXISTS "Allow read access for authenticated users"  ON public.ref_bareme_its;
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON public.ref_bareme_its;

CREATE POLICY "ref_bareme_its_select_authenticated"
  ON public.ref_bareme_its
  FOR SELECT
  TO authenticated
  USING (true);  -- données fiscales publiques de référence (non sensibles par tenant)

CREATE POLICY "ref_bareme_its_insert_hr"
  ON public.ref_bareme_its
  FOR INSERT
  WITH CHECK (public.user_has_min_role('hr_manager'));

CREATE POLICY "ref_bareme_its_update_hr"
  ON public.ref_bareme_its
  FOR UPDATE
  USING  (public.user_has_min_role('hr_manager'))
  WITH CHECK (public.user_has_min_role('hr_manager'));

CREATE POLICY "ref_bareme_its_delete_admin"
  ON public.ref_bareme_its
  FOR DELETE
  USING (public.user_has_min_role('tenant_admin'));

-- ---------------------------------------------------------------------------
-- SECTION 4 : CORRECTION — Payroll tables (Critique 3 + 6)
-- ---------------------------------------------------------------------------
-- Problème : FOR ALL USING(tenant_id IN user_roles) sans filtre de rôle ni WITH CHECK
-- Todo : remplacer par SELECT séparé pour employé (sa propre fiche), écriture hr_manager+

-- 4.1 paie_employes
DROP POLICY IF EXISTS "Tenant Isolation Policy for paie_employes" ON public.paie_employes;

ALTER TABLE public.paie_employes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paie_employes_select_hr"
  ON public.paie_employes
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "paie_employes_insert_hr"
  ON public.paie_employes
  FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "paie_employes_update_hr"
  ON public.paie_employes
  FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "paie_employes_delete_admin"
  ON public.paie_employes
  FOR DELETE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('tenant_admin')
  );

-- 4.2 paie_periodes
DROP POLICY IF EXISTS "Tenant Isolation Policy for paie_periodes" ON public.paie_periodes;

ALTER TABLE public.paie_periodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paie_periodes_select_hr"
  ON public.paie_periodes
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "paie_periodes_insert_hr"
  ON public.paie_periodes
  FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "paie_periodes_update_hr"
  ON public.paie_periodes
  FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "paie_periodes_delete_admin"
  ON public.paie_periodes
  FOR DELETE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('tenant_admin')
  );

-- 4.3 paie_elements_variables
DROP POLICY IF EXISTS "Tenant Isolation Policy for paie_elements_variables" ON public.paie_elements_variables;

ALTER TABLE public.paie_elements_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paie_elv_select_hr"
  ON public.paie_elements_variables
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "paie_elv_insert_hr"
  ON public.paie_elements_variables
  FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "paie_elv_update_hr"
  ON public.paie_elements_variables
  FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "paie_elv_delete_hr"
  ON public.paie_elements_variables
  FOR DELETE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

-- 4.4 paie_bulletins — employé peut lire sa propre fiche, hr_manager gère tout
DROP POLICY IF EXISTS "Tenant Isolation Policy for paie_bulletins" ON public.paie_bulletins;

ALTER TABLE public.paie_bulletins ENABLE ROW LEVEL SECURITY;

-- Lecture : HR voit tout le tenant, employé voit sa propre fiche via paie_employes
CREATE POLICY "paie_bulletins_select_hr"
  ON public.paie_bulletins
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "paie_bulletins_select_self"
  ON public.paie_bulletins
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND employe_id IN (
      SELECT id FROM public.paie_employes
      WHERE user_id  = auth.uid()
        AND tenant_id = public.get_user_tenant_id()
    )
  );

CREATE POLICY "paie_bulletins_insert_hr"
  ON public.paie_bulletins
  FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "paie_bulletins_update_hr"
  ON public.paie_bulletins
  FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "paie_bulletins_delete_admin"
  ON public.paie_bulletins
  FOR DELETE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('tenant_admin')
  );

-- ---------------------------------------------------------------------------
-- SECTION 5 : CORRECTION — config_prime_anciennete & periodes_gel_anciennete
-- ---------------------------------------------------------------------------
-- Critique 7 : tout utilisateur actif peut écrire la config des primes (CVE de privilege)

DROP POLICY IF EXISTS "Enable read access for authenticated users"  ON public.config_prime_anciennete;
DROP POLICY IF EXISTS "Enable insert for authenticated users"        ON public.config_prime_anciennete;
DROP POLICY IF EXISTS "Enable update for authenticated users"        ON public.config_prime_anciennete;
DROP POLICY IF EXISTS "Tenant Isolation for config_prime_anciennete" ON public.config_prime_anciennete;

CREATE POLICY "config_anciennete_select_tenant"
  ON public.config_prime_anciennete
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "config_anciennete_insert_hr"
  ON public.config_prime_anciennete
  FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "config_anciennete_update_hr"
  ON public.config_prime_anciennete
  FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "config_anciennete_delete_admin"
  ON public.config_prime_anciennete
  FOR DELETE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('tenant_admin')
  );

DROP POLICY IF EXISTS "Enable read access for authenticated users"  ON public.periodes_gel_anciennete;
DROP POLICY IF EXISTS "Enable insert for authenticated users"        ON public.periodes_gel_anciennete;
DROP POLICY IF EXISTS "Enable update for authenticated users"        ON public.periodes_gel_anciennete;
DROP POLICY IF EXISTS "Enable delete for authenticated users"        ON public.periodes_gel_anciennete;
DROP POLICY IF EXISTS "Tenant Isolation for periodes_gel_anciennete" ON public.periodes_gel_anciennete;

CREATE POLICY "gel_anciennete_select_tenant"
  ON public.periodes_gel_anciennete
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "gel_anciennete_insert_hr"
  ON public.periodes_gel_anciennete
  FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "gel_anciennete_update_hr"
  ON public.periodes_gel_anciennete
  FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "gel_anciennete_delete_admin"
  ON public.periodes_gel_anciennete
  FOR DELETE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('tenant_admin')
  );

-- ---------------------------------------------------------------------------
-- SECTION 6 : ACTIVER RLS + politiques — Tables HR avec RLS DÉSACTIVÉ
-- ---------------------------------------------------------------------------
-- Critique 1 : 14 tables avaient ALTER TABLE ... DISABLE ROW LEVEL SECURITY

-- 6.1 hr_analytics — lecture hr_manager+, écriture via aggregation seulement
ALTER TABLE public.hr_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hr_analytics_select" ON public.hr_analytics;
DROP POLICY IF EXISTS "hr_analytics_insert" ON public.hr_analytics;
DROP POLICY IF EXISTS "hr_analytics_update" ON public.hr_analytics;
DROP POLICY IF EXISTS "hr_analytics_delete" ON public.hr_analytics;

CREATE POLICY "hr_analytics_select_hr"
  ON public.hr_analytics
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "hr_analytics_write_admin"
  ON public.hr_analytics
  FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('tenant_admin')
  );

CREATE POLICY "hr_analytics_update_admin"
  ON public.hr_analytics
  FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('tenant_admin')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('tenant_admin')
  );

CREATE POLICY "hr_analytics_delete_admin"
  ON public.hr_analytics
  FOR DELETE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('tenant_admin')
  );

-- 6.2 employee_insights — données d'analyse individuelle, hr_manager+ uniquement
ALTER TABLE public.employee_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employee_insights_select" ON public.employee_insights;
DROP POLICY IF EXISTS "employee_insights_write"  ON public.employee_insights;

CREATE POLICY "employee_insights_select_hr"
  ON public.employee_insights
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

-- Lecture de son propre insight
CREATE POLICY "employee_insights_select_self"
  ON public.employee_insights
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "employee_insights_insert_hr"
  ON public.employee_insights
  FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "employee_insights_update_hr"
  ON public.employee_insights
  FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "employee_insights_delete_admin"
  ON public.employee_insights
  FOR DELETE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('tenant_admin')
  );

-- 6.3 task_audit_logs — lecture tous membres du tenant, écriture via trigger SECURITY DEFINER seulement
ALTER TABLE public.task_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_audit_logs_select" ON public.task_audit_logs;
DROP POLICY IF EXISTS "task_audit_logs_insert" ON public.task_audit_logs;
DROP POLICY IF EXISTS "task_audit_logs_update" ON public.task_audit_logs;
DROP POLICY IF EXISTS "task_audit_logs_delete" ON public.task_audit_logs;

CREATE POLICY "task_audit_logs_select_tenant"
  ON public.task_audit_logs
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

-- Aucune politique INSERT/UPDATE/DELETE pour le rôle authenticated :
-- l'écriture doit transiter exclusivement par un trigger SECURITY DEFINER.
-- (Si la table n'a pas encore de trigger, ajouter un commentaire et créer le trigger séparément.)

-- 6.4 Recrutement : candidates, interviews, job_applications, job_offers, job_posts
ALTER TABLE public.candidates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posts         ENABLE ROW LEVEL SECURITY;

-- candidates
DROP POLICY IF EXISTS "candidates_select" ON public.candidates;
DROP POLICY IF EXISTS "candidates_insert" ON public.candidates;
DROP POLICY IF EXISTS "candidates_update" ON public.candidates;
DROP POLICY IF EXISTS "candidates_delete" ON public.candidates;

CREATE POLICY "candidates_select_hr"
  ON public.candidates FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "candidates_insert_hr"
  ON public.candidates FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "candidates_update_hr"
  ON public.candidates FOR UPDATE
  USING  (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "candidates_delete_admin"
  ON public.candidates FOR DELETE
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('tenant_admin'));

-- interviews
DROP POLICY IF EXISTS "interviews_select" ON public.interviews;
DROP POLICY IF EXISTS "interviews_insert" ON public.interviews;
DROP POLICY IF EXISTS "interviews_update" ON public.interviews;
DROP POLICY IF EXISTS "interviews_delete" ON public.interviews;

CREATE POLICY "interviews_select_hr"
  ON public.interviews FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "interviews_insert_hr"
  ON public.interviews FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "interviews_update_hr"
  ON public.interviews FOR UPDATE
  USING  (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "interviews_delete_admin"
  ON public.interviews FOR DELETE
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('tenant_admin'));

-- job_applications
DROP POLICY IF EXISTS "job_applications_select" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_insert" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_update" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_delete" ON public.job_applications;

CREATE POLICY "job_applications_select_hr"
  ON public.job_applications FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "job_applications_insert_hr"
  ON public.job_applications FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "job_applications_update_hr"
  ON public.job_applications FOR UPDATE
  USING  (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "job_applications_delete_admin"
  ON public.job_applications FOR DELETE
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('tenant_admin'));

-- job_offers
DROP POLICY IF EXISTS "job_offers_select" ON public.job_offers;
DROP POLICY IF EXISTS "job_offers_insert" ON public.job_offers;
DROP POLICY IF EXISTS "job_offers_update" ON public.job_offers;
DROP POLICY IF EXISTS "job_offers_delete" ON public.job_offers;

CREATE POLICY "job_offers_select_hr"
  ON public.job_offers FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "job_offers_insert_hr"
  ON public.job_offers FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "job_offers_update_hr"
  ON public.job_offers FOR UPDATE
  USING  (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "job_offers_delete_admin"
  ON public.job_offers FOR DELETE
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('tenant_admin'));

-- job_posts
DROP POLICY IF EXISTS "job_posts_select" ON public.job_posts;
DROP POLICY IF EXISTS "job_posts_insert" ON public.job_posts;
DROP POLICY IF EXISTS "job_posts_update" ON public.job_posts;
DROP POLICY IF EXISTS "job_posts_delete" ON public.job_posts;

CREATE POLICY "job_posts_select_hr"
  ON public.job_posts FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "job_posts_insert_hr"
  ON public.job_posts FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "job_posts_update_hr"
  ON public.job_posts FOR UPDATE
  USING  (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "job_posts_delete_admin"
  ON public.job_posts FOR DELETE
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('tenant_admin'));

-- 6.5 capacity_planning — project_manager+ en lecture, tenant_admin en écriture
ALTER TABLE public.capacity_planning ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "capacity_planning_select" ON public.capacity_planning;
DROP POLICY IF EXISTS "capacity_planning_insert" ON public.capacity_planning;
DROP POLICY IF EXISTS "capacity_planning_update" ON public.capacity_planning;
DROP POLICY IF EXISTS "capacity_planning_delete" ON public.capacity_planning;

CREATE POLICY "capacity_planning_select_pm"
  ON public.capacity_planning FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('project_manager'));

CREATE POLICY "capacity_planning_insert_admin"
  ON public.capacity_planning FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('tenant_admin'));

CREATE POLICY "capacity_planning_update_admin"
  ON public.capacity_planning FOR UPDATE
  USING  (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('tenant_admin'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('tenant_admin'));

CREATE POLICY "capacity_planning_delete_admin"
  ON public.capacity_planning FOR DELETE
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('tenant_admin'));

-- 6.6 country_policies — données de référence mondiale, lecture libre, écriture super_admin
ALTER TABLE public.country_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "country_policies_select" ON public.country_policies;
DROP POLICY IF EXISTS "country_policies_insert" ON public.country_policies;
DROP POLICY IF EXISTS "country_policies_update" ON public.country_policies;
DROP POLICY IF EXISTS "country_policies_delete" ON public.country_policies;

CREATE POLICY "country_policies_select_all"
  ON public.country_policies
  FOR SELECT
  TO authenticated
  USING (true);  -- données de référence (pays/législation), pas de données sensibles

CREATE POLICY "country_policies_write_superadmin"
  ON public.country_policies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id  = auth.uid()
        AND ur.is_active  = true
        AND r.name = 'super_admin'
    )
  );

CREATE POLICY "country_policies_update_superadmin"
  ON public.country_policies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id  = auth.uid()
        AND ur.is_active  = true
        AND r.name = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id  = auth.uid()
        AND ur.is_active  = true
        AND r.name = 'super_admin'
    )
  );

CREATE POLICY "country_policies_delete_superadmin"
  ON public.country_policies
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id  = auth.uid()
        AND ur.is_active  = true
        AND r.name = 'super_admin'
    )
  );

-- 6.7 employee_access_logs — logs de sécurité, tenant_admin uniquement en lecture
ALTER TABLE public.employee_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employee_access_logs_select" ON public.employee_access_logs;
DROP POLICY IF EXISTS "employee_access_logs_insert" ON public.employee_access_logs;

CREATE POLICY "employee_access_logs_select_admin"
  ON public.employee_access_logs
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('tenant_admin')
  );

-- Ecriture uniquement par service_role (triggers, Edge Functions) — aucune policy INSERT/UPDATE/DELETE pour authenticated

-- 6.8 safety_documents, safety_incidents, corrective_actions
--     Lecture : tous membres du tenant (santé/sécurité au travail = droit d'accès universel)
--     Ecriture : hr_manager+
ALTER TABLE public.safety_documents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_incidents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;

-- safety_documents
DROP POLICY IF EXISTS "safety_documents_select" ON public.safety_documents;
DROP POLICY IF EXISTS "safety_documents_insert" ON public.safety_documents;
DROP POLICY IF EXISTS "safety_documents_update" ON public.safety_documents;
DROP POLICY IF EXISTS "safety_documents_delete" ON public.safety_documents;

CREATE POLICY "safety_docs_select_tenant"
  ON public.safety_documents FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "safety_docs_insert_hr"
  ON public.safety_documents FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "safety_docs_update_hr"
  ON public.safety_documents FOR UPDATE
  USING  (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "safety_docs_delete_admin"
  ON public.safety_documents FOR DELETE
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('tenant_admin'));

-- safety_incidents
DROP POLICY IF EXISTS "safety_incidents_select" ON public.safety_incidents;
DROP POLICY IF EXISTS "safety_incidents_insert" ON public.safety_incidents;
DROP POLICY IF EXISTS "safety_incidents_update" ON public.safety_incidents;
DROP POLICY IF EXISTS "safety_incidents_delete" ON public.safety_incidents;

CREATE POLICY "safety_incidents_select_tenant"
  ON public.safety_incidents FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "safety_incidents_insert_employee"
  ON public.safety_incidents FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('employee')  -- tout employé peut déclarer un incident
  );

CREATE POLICY "safety_incidents_update_hr"
  ON public.safety_incidents FOR UPDATE
  USING  (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "safety_incidents_delete_admin"
  ON public.safety_incidents FOR DELETE
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('tenant_admin'));

-- corrective_actions
DROP POLICY IF EXISTS "corrective_actions_select" ON public.corrective_actions;
DROP POLICY IF EXISTS "corrective_actions_insert" ON public.corrective_actions;
DROP POLICY IF EXISTS "corrective_actions_update" ON public.corrective_actions;
DROP POLICY IF EXISTS "corrective_actions_delete" ON public.corrective_actions;

CREATE POLICY "corrective_actions_select_tenant"
  ON public.corrective_actions FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "corrective_actions_insert_hr"
  ON public.corrective_actions FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "corrective_actions_update_hr"
  ON public.corrective_actions FOR UPDATE
  USING  (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "corrective_actions_delete_admin"
  ON public.corrective_actions FOR DELETE
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('tenant_admin'));

-- ---------------------------------------------------------------------------
-- SECTION 7 : MIGRATION — Politiques existantes utilisant app.current_tenant_id
-- ---------------------------------------------------------------------------
-- Critique 4 : current_setting('app.current_tenant_id', true) peut retourner NULL
-- Les politiques des tables employees, absences, timesheets etc. sont migrées.
-- NOTA : 20250928023500 a déjà nettoyé et recréé les politiques core (tasks, projects,
-- departments, employees) avec get_user_tenant_id(). On corrige ici les tables RH
-- restantes de 20250111000202 qui n'ont pas été reprises par ce nettoyage.

-- 7.1 employees — recréer avec user_has_min_role (supprimer résidus hr_admin stale)
DROP POLICY IF EXISTS "employees_read_all"   ON public.employees;
DROP POLICY IF EXISTS "employees_insert_hr"  ON public.employees;
DROP POLICY IF EXISTS "employees_update_hr"  ON public.employees;
DROP POLICY IF EXISTS "employees_delete_hr"  ON public.employees;
DROP POLICY IF EXISTS "employees_read_self"  ON public.employees;
DROP POLICY IF EXISTS "employees_update_self" ON public.employees;
DROP POLICY IF EXISTS "employees_tenant_access" ON public.employees;

CREATE POLICY "employees_select_tenant"
  ON public.employees FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "employees_select_self"
  ON public.employees FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "employees_insert_hr"
  ON public.employees FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "employees_update_hr"
  ON public.employees FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "employees_update_self"
  ON public.employees FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "employees_delete_admin"
  ON public.employees FOR DELETE
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('tenant_admin'));

-- 7.2 absences
DROP POLICY IF EXISTS "absences_read_all"    ON public.absences;
DROP POLICY IF EXISTS "absences_create_self" ON public.absences;
DROP POLICY IF EXISTS "absences_update_hr"   ON public.absences;
DROP POLICY IF EXISTS "absences_delete_hr"   ON public.absences;

CREATE POLICY "absences_select_tenant"
  ON public.absences FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "absences_insert_self"
  ON public.absences FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "absences_insert_hr"
  ON public.absences FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "absences_update_hr"
  ON public.absences FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

CREATE POLICY "absences_delete_hr"
  ON public.absences FOR DELETE
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('hr_manager'));

-- 7.3 timesheets
-- Note : timesheets.employee_id → profiles.id (pas employees.id)
-- La colonne tenant_id est absente en production → on l'ajoute et on backfille
-- depuis profiles (profiles.id = auth.uid() dans l'architecture Supabase).

ALTER TABLE public.timesheets
  ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT public.get_user_tenant_id();

-- Backfill des lignes existantes via la jointure profiles
UPDATE public.timesheets ts
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE ts.employee_id = p.id
  AND ts.tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_timesheets_tenant_id ON public.timesheets(tenant_id);

DROP POLICY IF EXISTS "timesheets_read_self"       ON public.timesheets;
DROP POLICY IF EXISTS "timesheets_insert_self"     ON public.timesheets;
DROP POLICY IF EXISTS "timesheets_update_self"     ON public.timesheets;
DROP POLICY IF EXISTS "timesheets_manage_managers" ON public.timesheets;

-- Employé : voit ses propres fiches (employee_id = profiles.id = auth.uid())
CREATE POLICY "timesheets_select_self"
  ON public.timesheets FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "timesheets_select_manager"
  ON public.timesheets FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('project_manager')
  );

CREATE POLICY "timesheets_insert_self"
  ON public.timesheets FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND employee_id = auth.uid()
  );

CREATE POLICY "timesheets_update_self"
  ON public.timesheets FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND employee_id = auth.uid()
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND employee_id = auth.uid()
  );

CREATE POLICY "timesheets_manage_manager"
  ON public.timesheets FOR ALL
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('project_manager')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('project_manager')
  );

-- 7.4 employee_documents
DROP POLICY IF EXISTS "documents_read_self"   ON public.employee_documents;
DROP POLICY IF EXISTS "documents_read_hr"     ON public.employee_documents;
DROP POLICY IF EXISTS "documents_manage_hr"   ON public.employee_documents;

CREATE POLICY "emp_docs_select_self"
  ON public.employee_documents FOR SELECT
  USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  );

CREATE POLICY "emp_docs_select_hr"
  ON public.employee_documents FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "emp_docs_manage_hr"
  ON public.employee_documents FOR ALL
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

-- 7.5 employee_payrolls (table distincte de paie_bulletins — module finance préexistant)
DROP POLICY IF EXISTS "payrolls_read_self"       ON public.employee_payrolls;
DROP POLICY IF EXISTS "payrolls_manage_payroll"  ON public.employee_payrolls;

CREATE POLICY "employee_payrolls_select_self"
  ON public.employee_payrolls FOR SELECT
  USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  );

CREATE POLICY "employee_payrolls_manage_hr"
  ON public.employee_payrolls FOR ALL
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

-- 7.6 payroll_periods (finance)
DROP POLICY IF EXISTS "payroll_periods_read"   ON public.payroll_periods;
DROP POLICY IF EXISTS "payroll_periods_manage" ON public.payroll_periods;

CREATE POLICY "payroll_periods_select_hr"
  ON public.payroll_periods FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

CREATE POLICY "payroll_periods_manage_admin"
  ON public.payroll_periods FOR ALL
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('tenant_admin')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('tenant_admin')
  );

-- 7.7 payroll_components
DROP POLICY IF EXISTS "payroll_components_read"   ON public.payroll_components;
DROP POLICY IF EXISTS "payroll_components_manage" ON public.payroll_components;

CREATE POLICY "payroll_components_select_self_or_hr"
  ON public.payroll_components FOR SELECT
  USING (
    payroll_id IN (
      SELECT id FROM public.employee_payrolls
      WHERE employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    )
    OR (
      public.user_has_min_role('hr_manager')
      AND payroll_id IN (
        SELECT id FROM public.employee_payrolls
        WHERE tenant_id = public.get_user_tenant_id()
      )
    )
  );

CREATE POLICY "payroll_components_manage_hr"
  ON public.payroll_components FOR ALL
  USING (
    payroll_id IN (
      SELECT id FROM public.employee_payrolls
      WHERE tenant_id = public.get_user_tenant_id()
    )
    AND public.user_has_min_role('hr_manager')
  )
  WITH CHECK (
    payroll_id IN (
      SELECT id FROM public.employee_payrolls
      WHERE tenant_id = public.get_user_tenant_id()
    )
    AND public.user_has_min_role('hr_manager')
  );

-- 7.8 expense_reports
DROP POLICY IF EXISTS "expenses_read_self"      ON public.expense_reports;
DROP POLICY IF EXISTS "expenses_create_self"    ON public.expense_reports;
DROP POLICY IF EXISTS "expenses_manage_finance" ON public.expense_reports;

CREATE POLICY "expense_reports_select_self"
  ON public.expense_reports FOR SELECT
  USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  );

CREATE POLICY "expense_reports_insert_self"
  ON public.expense_reports FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  );

CREATE POLICY "expense_reports_manage_hr"
  ON public.expense_reports FOR ALL
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_has_min_role('hr_manager')
  );

-- 7.9 expense_items
DROP POLICY IF EXISTS "expense_items_read"   ON public.expense_items;
DROP POLICY IF EXISTS "expense_items_manage" ON public.expense_items;

CREATE POLICY "expense_items_select"
  ON public.expense_items FOR SELECT
  USING (
    report_id IN (
      SELECT id FROM public.expense_reports
      WHERE employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    )
    OR public.user_has_min_role('hr_manager')
  );

CREATE POLICY "expense_items_manage_self_or_hr"
  ON public.expense_items FOR ALL
  USING (
    (
      report_id IN (
        SELECT id FROM public.expense_reports
        WHERE employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
          AND status = 'draft'
      )
    )
    OR public.user_has_min_role('hr_manager')
  )
  WITH CHECK (
    (
      report_id IN (
        SELECT id FROM public.expense_reports
        WHERE employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
          AND status = 'draft'
      )
    )
    OR public.user_has_min_role('hr_manager')
  );

-- ---------------------------------------------------------------------------
-- SECTION 8 : CORRECTION — operational_activities, schedules, templates
-- ---------------------------------------------------------------------------
-- Critique : 03-setup-rls-policies.sql utilise auth.jwt()->>'tenant_id' au lieu de get_user_tenant_id()
-- auth.jwt()->> n'est pas garanti selon la configuration JWT Supabase.
-- Note : ces tables peuvent ne pas exister dans tous les environnements ;
-- les DROP IF EXISTS et CREATE sont conditionnels via DO$$.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='operational_activities') THEN

    DROP POLICY IF EXISTS "op_activities_select" ON public.operational_activities;
    DROP POLICY IF EXISTS "op_activities_insert" ON public.operational_activities;
    DROP POLICY IF EXISTS "op_activities_update" ON public.operational_activities;
    DROP POLICY IF EXISTS "op_activities_delete" ON public.operational_activities;

    EXECUTE $pol$
      CREATE POLICY "op_activities_select" ON public.operational_activities
        FOR SELECT USING (tenant_id = public.get_user_tenant_id());
    $pol$;
    EXECUTE $pol$
      CREATE POLICY "op_activities_insert" ON public.operational_activities
        FOR INSERT WITH CHECK (
          tenant_id = public.get_user_tenant_id()
          AND created_by = auth.uid()
          AND public.user_has_min_role('project_manager')
        );
    $pol$;
    EXECUTE $pol$
      CREATE POLICY "op_activities_update" ON public.operational_activities
        FOR UPDATE
        USING  (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('project_manager'))
        WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('project_manager'));
    $pol$;
    EXECUTE $pol$
      CREATE POLICY "op_activities_delete" ON public.operational_activities
        FOR DELETE USING (
          tenant_id = public.get_user_tenant_id()
          AND public.user_has_min_role('project_manager')
        );
    $pol$;

    RAISE NOTICE 'operational_activities policies fixed';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='operational_schedules') THEN

    DROP POLICY IF EXISTS "op_schedules_select" ON public.operational_schedules;
    DROP POLICY IF EXISTS "op_schedules_insert" ON public.operational_schedules;
    DROP POLICY IF EXISTS "op_schedules_update" ON public.operational_schedules;
    DROP POLICY IF EXISTS "op_schedules_delete" ON public.operational_schedules;

    EXECUTE $pol$
      CREATE POLICY "op_schedules_select" ON public.operational_schedules
        FOR SELECT USING (tenant_id = public.get_user_tenant_id());
    $pol$;
    EXECUTE $pol$
      CREATE POLICY "op_schedules_insert" ON public.operational_schedules
        FOR INSERT WITH CHECK (
          tenant_id = public.get_user_tenant_id()
          AND public.user_has_min_role('project_manager')
          AND EXISTS (
            SELECT 1 FROM public.operational_activities
            WHERE id = activity_id AND tenant_id = public.get_user_tenant_id()
          )
        );
    $pol$;
    EXECUTE $pol$
      CREATE POLICY "op_schedules_update" ON public.operational_schedules
        FOR UPDATE
        USING (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('project_manager'))
        WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_min_role('project_manager'));
    $pol$;
    EXECUTE $pol$
      CREATE POLICY "op_schedules_delete" ON public.operational_schedules
        FOR DELETE USING (
          tenant_id = public.get_user_tenant_id()
          AND public.user_has_min_role('project_manager')
        );
    $pol$;

    RAISE NOTICE 'operational_schedules policies fixed';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- SECTION 9 : GRANT DE SECURITE — Révoquer accès direct anon sur tables sensibles
-- ---------------------------------------------------------------------------
-- Par défaut Supabase auto-grant SELECT au rôle anon sur les tables publiques.
-- Ces tables ne doivent jamais être accessibles en anonyme.

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.hr_analytics         FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.employee_insights     FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.task_audit_logs       FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.candidates            FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.interviews            FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.job_applications      FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.job_offers            FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.job_posts             FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.capacity_planning     FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.employee_access_logs  FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.safety_documents      FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.safety_incidents      FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.corrective_actions    FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.paie_employes         FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.paie_periodes         FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.paie_elements_variables FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.paie_bulletins        FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.employee_payrolls     FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.config_prime_anciennete FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.periodes_gel_anciennete FROM anon;

-- ---------------------------------------------------------------------------
-- SECTION 10 : VERIFICATION POST-CORRECTION
-- ---------------------------------------------------------------------------
-- Exécuter cette requête après COMMIT pour valider l'état final.
-- Toutes les tables doivent avoir rowsecurity = true et au moins 1 policy.

SELECT
  t.tablename,
  t.rowsecurity,
  (
    SELECT count(*)
    FROM pg_policies p
    WHERE p.tablename  = t.tablename
      AND p.schemaname = 'public'
  ) AS policy_count,
  CASE
    WHEN t.rowsecurity = false THEN 'ALERTE: RLS DESACTIVE'
    WHEN (
      SELECT count(*)
      FROM pg_policies p
      WHERE p.tablename  = t.tablename
        AND p.schemaname = 'public'
    ) = 0 THEN 'ALERTE: RLS actif mais 0 policy (table bloquee)'
    ELSE 'OK'
  END AS status
FROM pg_tables t
WHERE t.schemaname = 'public'
ORDER BY
  t.rowsecurity ASC,  -- tables sans RLS en premier
  t.tablename;

COMMIT;

-- =============================================================================
-- FIN DU SCRIPT FIX_RBAC_RLS_COMPLET.sql
-- =============================================================================
