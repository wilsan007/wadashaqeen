-- ============================================================================
-- FIX CRITIQUE : Politiques RLS rôle-aware pour tasks et projects
-- Problème : les politiques actuelles n'autorisent que par tenant_id —
--            n'importe quel membre peut modifier/supprimer toute tâche/projet.
-- Solution  : fonctions SECURITY DEFINER + politiques granulaires par rôle.
-- ============================================================================
-- À exécuter dans : Supabase Dashboard → SQL Editor → Run
-- ============================================================================

-- ─── 0. Fonction helper : rôle principal de l'utilisateur ───────────────────

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.name
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = auth.uid()
    AND ur.is_active = true
    AND ur.tenant_id = public.get_user_tenant_id()
  ORDER BY CASE r.name
    WHEN 'super_admin'   THEN 1
    WHEN 'tenant_admin'  THEN 2
    WHEN 'hr_manager'    THEN 3
    WHEN 'project_manager' THEN 4
    WHEN 'team_lead'     THEN 5
    WHEN 'employee'      THEN 6
    WHEN 'collaborator'  THEN 6
    WHEN 'contractor'    THEN 7
    WHEN 'intern'        THEN 8
    WHEN 'viewer'        THEN 9
    ELSE 10
  END
  LIMIT 1;
$$;

-- ─── 1. Fonction : l'utilisateur peut-il modifier cette tâche ? ─────────────

CREATE OR REPLACE FUNCTION public.user_can_edit_task(p_task_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role        TEXT;
  v_assignee_id UUID;
  v_created_by  UUID;
  v_project_mgr UUID;
BEGIN
  -- Récupérer le rôle principal
  SELECT public.get_current_user_role() INTO v_role;
  IF v_role IS NULL THEN RETURN false; END IF;

  -- Admins : accès total
  IF v_role IN ('super_admin', 'tenant_admin') THEN RETURN true; END IF;

  -- PM+ : peut modifier toutes les tâches du tenant
  IF v_role = 'project_manager' THEN RETURN true; END IF;

  -- Récupérer les métadonnées de la tâche (SECURITY DEFINER → pas de récursion RLS)
  SELECT t.assignee_id, t.created_by, p.manager_id
  INTO v_assignee_id, v_created_by, v_project_mgr
  FROM public.tasks t
  LEFT JOIN public.projects p ON p.id = t.project_id
  WHERE t.id = p_task_id;

  -- Team Lead : peut modifier si assigné ou créateur
  IF v_role = 'team_lead' THEN
    RETURN (v_assignee_id = auth.uid() OR v_created_by = auth.uid());
  END IF;

  -- Employee / Collaborator / Contractor : uniquement si assigné
  IF v_role IN ('employee', 'collaborator', 'contractor') THEN
    RETURN (v_assignee_id = auth.uid());
  END IF;

  -- Intern / Viewer : lecture seule
  RETURN false;
END;
$$;

-- ─── 2. Fonction : l'utilisateur peut-il supprimer cette tâche ? ────────────

CREATE OR REPLACE FUNCTION public.user_can_delete_task(p_task_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role       TEXT;
  v_created_by UUID;
BEGIN
  SELECT public.get_current_user_role() INTO v_role;
  IF v_role IS NULL THEN RETURN false; END IF;

  -- Seuls les admins et PM peuvent supprimer des tâches
  IF v_role IN ('super_admin', 'tenant_admin', 'project_manager') THEN RETURN true; END IF;

  -- Team Lead : uniquement si créateur de la tâche
  IF v_role = 'team_lead' THEN
    SELECT created_by INTO v_created_by FROM public.tasks WHERE id = p_task_id;
    RETURN (v_created_by = auth.uid());
  END IF;

  RETURN false;
END;
$$;

-- ─── 3. Fonction : l'utilisateur peut-il modifier ce projet ? ───────────────

CREATE OR REPLACE FUNCTION public.user_can_edit_project(p_project_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role       TEXT;
  v_manager_id UUID;
  v_created_by UUID;
BEGIN
  SELECT public.get_current_user_role() INTO v_role;
  IF v_role IS NULL THEN RETURN false; END IF;

  -- Admins : accès total
  IF v_role IN ('super_admin', 'tenant_admin') THEN RETURN true; END IF;

  -- PM : peut modifier ses propres projets
  IF v_role = 'project_manager' THEN
    SELECT manager_id, created_by
    INTO v_manager_id, v_created_by
    FROM public.projects
    WHERE id = p_project_id;
    RETURN (v_manager_id = auth.uid() OR v_created_by = auth.uid());
  END IF;

  -- Autres rôles : pas de modification de projets
  RETURN false;
END;
$$;

-- ─── 4. Fonction : l'utilisateur peut-il créer un projet ? ──────────────────

CREATE OR REPLACE FUNCTION public.user_can_create_project()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_current_user_role() IN ('super_admin', 'tenant_admin', 'project_manager');
$$;

-- ─── 5. Remplacer les politiques RLS faibles pour tasks ─────────────────────

-- Supprimer les politiques trop permissives
DROP POLICY IF EXISTS "Users can update tasks in their tenant" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their tenant" ON public.tasks;

-- Nouvelle politique UPDATE : tenant + permission rôle
CREATE POLICY "task_update_role_aware"
  ON public.tasks
  FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_can_edit_task(id)
  );

-- Nouvelle politique DELETE : tenant + permission rôle
CREATE POLICY "task_delete_role_aware"
  ON public.tasks
  FOR DELETE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_can_delete_task(id)
  );

-- ─── 6. Remplacer les politiques RLS faibles pour projects ──────────────────

DROP POLICY IF EXISTS "Users can update projects in their tenant" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects in their tenant" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects in their tenant" ON public.projects;

-- Nouvelle politique UPDATE
CREATE POLICY "project_update_role_aware"
  ON public.projects
  FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_can_edit_project(id)
  );

-- Nouvelle politique DELETE
CREATE POLICY "project_delete_role_aware"
  ON public.projects
  FOR DELETE
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.user_can_edit_project(id)
  );

-- Nouvelle politique INSERT : PM+ uniquement
CREATE POLICY "project_insert_role_aware"
  ON public.projects
  FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.user_can_create_project()
  );

-- ─── 7. Vérification ────────────────────────────────────────────────────────
-- Résultat attendu : 2 politiques role_aware pour tasks, 3 pour projects
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('tasks', 'projects')
ORDER BY tablename, policyname;
