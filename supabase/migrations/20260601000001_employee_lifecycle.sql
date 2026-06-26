-- =============================================================================
-- Migration : Cycle de vie des employés — Soft Delete + Anciens Employés
-- Date : 2026-06-01
-- =============================================================================
-- PARTIE 1 : Corriger les FK bloquantes (fix suppression Dashboard Supabase en dev)
-- PARTIE 2 : Étendre employees avec champs de licenciement
-- PARTIE 3 : Ajouter is_active dans profiles
-- PARTIE 4 : Vues filtrées active_employees / terminated_employees
-- PARTIE 5 : Fonction terminate_employee() pour licencier proprement
-- PARTIE 6 : RLS — exclure les terminated des vues normales
-- =============================================================================


-- ============================================================
-- PARTIE 1 : FK SET NULL (permet suppression en dev Dashboard)
-- ============================================================

ALTER TABLE public.project_comments
  DROP CONSTRAINT IF EXISTS project_comments_user_id_fkey;
ALTER TABLE public.project_comments
  ADD CONSTRAINT project_comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.leave_requests
  DROP CONSTRAINT IF EXISTS leave_requests_approver_id_fkey;
ALTER TABLE public.leave_requests
  ADD CONSTRAINT leave_requests_approver_id_fkey
  FOREIGN KEY (approver_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.leave_approvals
  DROP CONSTRAINT IF EXISTS leave_approvals_approver_id_fkey;
ALTER TABLE public.leave_approvals
  ADD CONSTRAINT leave_approvals_approver_id_fkey
  FOREIGN KEY (approver_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_invited_by_fkey;
ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.task_history
  DROP CONSTRAINT IF EXISTS task_history_changed_by_fkey;
ALTER TABLE public.task_history
  ADD CONSTRAINT task_history_changed_by_fkey
  FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;


-- ============================================================
-- PARTIE 2 : Étendre employees — champs de licenciement
-- (status 'active' existe déjà — on ajoute les champs manquants)
-- ============================================================

-- Contrainte sur status avec les nouvelles valeurs
ALTER TABLE public.employees
  DROP CONSTRAINT IF EXISTS employees_status_check;

ALTER TABLE public.employees
  ADD CONSTRAINT employees_status_check
  CHECK (status IN ('active', 'terminated', 'suspended', 'on_leave'));

-- Champs de licenciement
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS termination_date        DATE,
  ADD COLUMN IF NOT EXISTS termination_type        TEXT CHECK (termination_type IN ('resigned', 'fired', 'retired', 'contract_end', 'mutual_agreement')),
  ADD COLUMN IF NOT EXISTS termination_reason      TEXT,
  ADD COLUMN IF NOT EXISTS termination_notice_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reintegration_eligible  BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS reintegration_date      DATE,
  ADD COLUMN IF NOT EXISTS reintegration_notes     TEXT;

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status, tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_termination_date ON public.employees(termination_date) WHERE termination_date IS NOT NULL;


-- ============================================================
-- PARTIE 3 : is_active dans profiles (pour Supabase Auth sync)
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active       BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS deactivated_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active, tenant_id);


-- ============================================================
-- PARTIE 4 : Vues filtrées
-- ============================================================

-- Vue : Employés actifs (utilisée partout dans l'app)
CREATE OR REPLACE VIEW public.active_employees
WITH (security_invoker = true) AS
SELECT *
FROM public.employees
WHERE status = 'active';

COMMENT ON VIEW public.active_employees IS
'Vue filtrée des employés actifs uniquement. Utilisée par toutes les vues opérationnelles.';

-- Vue : Anciens employés (licenciés, retraités, démissionnaires)
CREATE OR REPLACE VIEW public.terminated_employees
WITH (security_invoker = true) AS
SELECT
  e.*,
  p.full_name  AS profile_full_name,
  p.avatar_url AS profile_avatar_url,
  p.email      AS profile_email
FROM public.employees e
LEFT JOIN public.profiles p ON p.user_id = e.user_id
WHERE e.status IN ('terminated', 'suspended');

COMMENT ON VIEW public.terminated_employees IS
'Vue des anciens employés avec leur profil. Accessible uniquement aux RH et admins.';

-- Vue enrichie pour la section "Ancien Employé" de l'UI
CREATE OR REPLACE VIEW public.terminated_employees_summary
WITH (security_invoker = true) AS
SELECT
  e.id,
  e.employee_id,
  e.full_name,
  e.email,
  e.job_title,
  e.department_id,
  e.hire_date,
  e.termination_date,
  e.termination_type,
  e.termination_reason,
  e.termination_notice_days,
  e.reintegration_eligible,
  e.reintegration_date,
  e.reintegration_notes,
  e.contract_type,
  e.salary,
  e.status,
  e.avatar_url,
  e.tenant_id,
  e.created_at,
  -- Durée d'ancienneté au moment du licenciement
  CASE
    WHEN e.termination_date IS NOT NULL AND e.hire_date IS NOT NULL
    THEN (e.termination_date - e.hire_date)
    ELSE NULL
  END AS tenure_days,
  d.name AS department_name
FROM public.employees e
LEFT JOIN public.departments d ON d.id = e.department_id
WHERE e.status IN ('terminated', 'suspended');

COMMENT ON VIEW public.terminated_employees_summary IS
'Résumé des anciens employés pour la section UI "Anciens Employés" avec calcul d''ancienneté.';


-- ============================================================
-- PARTIE 5 : Fonction terminate_employee()
-- Licencie proprement : met à jour employee + désactive profile
-- ============================================================

CREATE OR REPLACE FUNCTION public.terminate_employee(
  p_employee_id       UUID,
  p_termination_type  TEXT,
  p_termination_date  DATE DEFAULT CURRENT_DATE,
  p_reason            TEXT DEFAULT NULL,
  p_notice_days       INTEGER DEFAULT 0,
  p_reintegration_eligible BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee  public.employees%ROWTYPE;
  v_user_id   UUID;
BEGIN
  -- Vérifier que l'employé existe et est actif
  SELECT * INTO v_employee
  FROM public.employees
  WHERE id = p_employee_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Employé introuvable');
  END IF;

  IF v_employee.status = 'terminated' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Employé déjà licencié');
  END IF;

  -- Valider le type de licenciement
  IF p_termination_type NOT IN ('resigned', 'fired', 'retired', 'contract_end', 'mutual_agreement') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Type de licenciement invalide');
  END IF;

  -- Mettre à jour l'employé
  UPDATE public.employees SET
    status                 = 'terminated',
    termination_date       = p_termination_date,
    termination_type       = p_termination_type,
    termination_reason     = p_reason,
    termination_notice_days = p_notice_days,
    reintegration_eligible = p_reintegration_eligible,
    updated_at             = NOW()
  WHERE id = p_employee_id;

  -- Désactiver le profil Supabase Auth si user_id existe
  v_user_id := v_employee.user_id;
  IF v_user_id IS NOT NULL THEN
    UPDATE public.profiles SET
      is_active      = false,
      deactivated_at = NOW(),
      updated_at     = NOW()
    WHERE user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success',           true,
    'employee_id',       p_employee_id,
    'termination_date',  p_termination_date,
    'termination_type',  p_termination_type,
    'profile_disabled',  (v_user_id IS NOT NULL)
  );
END;
$$;

COMMENT ON FUNCTION public.terminate_employee IS
'Licencie un employé : passe son status à terminated, enregistre la raison, désactive son profil auth.';


-- ============================================================
-- Fonction reintegrate_employee() — Réintégrer un ex-employé
-- ============================================================

CREATE OR REPLACE FUNCTION public.reintegrate_employee(
  p_employee_id      UUID,
  p_reintegration_date DATE DEFAULT CURRENT_DATE,
  p_notes            TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee public.employees%ROWTYPE;
  v_user_id  UUID;
BEGIN
  SELECT * INTO v_employee
  FROM public.employees
  WHERE id = p_employee_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Employé introuvable');
  END IF;

  IF v_employee.status = 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Employé déjà actif');
  END IF;

  IF NOT v_employee.reintegration_eligible THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cet employé n''est pas éligible à la réintégration');
  END IF;

  -- Réactiver l'employé (on conserve l'historique de licenciement)
  UPDATE public.employees SET
    status               = 'active',
    reintegration_date   = p_reintegration_date,
    reintegration_notes  = p_notes,
    -- On ne remet PAS termination_date/type à NULL pour garder l'historique
    updated_at           = NOW()
  WHERE id = p_employee_id;

  -- Réactiver le profil
  v_user_id := v_employee.user_id;
  IF v_user_id IS NOT NULL THEN
    UPDATE public.profiles SET
      is_active      = true,
      deactivated_at = NULL,
      updated_at     = NOW()
    WHERE user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success',             true,
    'employee_id',         p_employee_id,
    'reintegration_date',  p_reintegration_date,
    'profile_reactivated', (v_user_id IS NOT NULL)
  );
END;
$$;

COMMENT ON FUNCTION public.reintegrate_employee IS
'Réintègre un ancien employé : repasse son status à active, conserve l''historique de licenciement, réactive son profil auth.';


-- ============================================================
-- PARTIE 6 : RLS — Accès anciens employés (HR/admin uniquement)
-- ============================================================

-- Politique sur terminated_employees_summary : HR et admins seulement
ALTER VIEW public.terminated_employees_summary OWNER TO postgres;

-- Les vues héritent des RLS de la table employees sous-jacente (security_invoker)
-- Pas besoin de RLS supplémentaire sur les vues elles-mêmes.
