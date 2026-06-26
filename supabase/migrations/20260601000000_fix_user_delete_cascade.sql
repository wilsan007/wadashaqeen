-- =============================================================================
-- Migration : Correction suppression utilisateur (ON DELETE CASCADE / SET NULL)
-- Date : 2026-06-01
-- Problème : Impossible de supprimer un user depuis le Dashboard Supabase
-- Cause : FK vers auth.users sans ON DELETE CASCADE ou ON DELETE SET NULL
-- =============================================================================

-- 1. project_comments.user_id → SET NULL (on garde le commentaire sans auteur)
ALTER TABLE public.project_comments
  DROP CONSTRAINT IF EXISTS project_comments_user_id_fkey;

ALTER TABLE public.project_comments
  ADD CONSTRAINT project_comments_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- 2. timesheets.user_id → SET NULL (on garde les données de temps sans utilisateur)
ALTER TABLE public.timesheets
  DROP CONSTRAINT IF EXISTS timesheets_user_id_fkey;

ALTER TABLE public.timesheets
  ADD CONSTRAINT timesheets_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- 3. leave_requests.approver_id → SET NULL (on garde la demande sans approbateur)
ALTER TABLE public.leave_requests
  DROP CONSTRAINT IF EXISTS leave_requests_approver_id_fkey;

ALTER TABLE public.leave_requests
  ADD CONSTRAINT leave_requests_approver_id_fkey
  FOREIGN KEY (approver_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- 4. leave_approvals.approver_id → SET NULL (on garde l'historique d'approbation)
ALTER TABLE public.leave_approvals
  DROP CONSTRAINT IF EXISTS leave_approvals_approver_id_fkey;

ALTER TABLE public.leave_approvals
  ADD CONSTRAINT leave_approvals_approver_id_fkey
  FOREIGN KEY (approver_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- 5. invitations.invited_by → SET NULL (on garde l'invitation même si l'invitant est supprimé)
ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_invited_by_fkey;

ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_invited_by_fkey
  FOREIGN KEY (invited_by)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- 6. task_history.changed_by → SET NULL (on garde l'historique des tâches)
ALTER TABLE public.task_history
  DROP CONSTRAINT IF EXISTS task_history_changed_by_fkey;

ALTER TABLE public.task_history
  ADD CONSTRAINT task_history_changed_by_fkey
  FOREIGN KEY (changed_by)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- 7. seniority_bonuses.created_by → SET NULL (on garde les données de paie)
ALTER TABLE public.seniority_bonuses
  DROP CONSTRAINT IF EXISTS seniority_bonuses_created_by_fkey;

ALTER TABLE public.seniority_bonuses
  ADD CONSTRAINT seniority_bonuses_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;
