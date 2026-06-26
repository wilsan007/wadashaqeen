-- =============================================================================
-- DEV ONLY : Suppression totale en cascade lors de la suppression d'un user
-- À EXÉCUTER UNE SEULE FOIS dans le SQL Editor du Dashboard Supabase
-- ⚠️ NE PAS utiliser en production — pour le développement uniquement
-- =============================================================================

-- 1. project_comments : supprimer le commentaire avec l'auteur
ALTER TABLE public.project_comments
  DROP CONSTRAINT IF EXISTS project_comments_user_id_fkey;
ALTER TABLE public.project_comments
  ADD CONSTRAINT project_comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. leave_requests : supprimer les demandes si l'approbateur est supprimé
ALTER TABLE public.leave_requests
  DROP CONSTRAINT IF EXISTS leave_requests_approver_id_fkey;
ALTER TABLE public.leave_requests
  ADD CONSTRAINT leave_requests_approver_id_fkey
  FOREIGN KEY (approver_id) REFERENCES auth.users(id) ON DELETE SET NULL;
-- NOTE : approver_id est nullable → SET NULL car la demande appartient à l'employé,
--        pas à l'approbateur. Si on cascade ici on perd les demandes de l'employé.

-- 3. leave_approvals : supprimer si l'approbateur est supprimé
ALTER TABLE public.leave_approvals
  DROP CONSTRAINT IF EXISTS leave_approvals_approver_id_fkey;
ALTER TABLE public.leave_approvals
  ADD CONSTRAINT leave_approvals_approver_id_fkey
  FOREIGN KEY (approver_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. invitations : supprimer les invitations envoyées par ce user
ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_invited_by_fkey;
ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. task_history : supprimer l'historique lié à ce user
ALTER TABLE public.task_history
  DROP CONSTRAINT IF EXISTS task_history_changed_by_fkey;
ALTER TABLE public.task_history
  ADD CONSTRAINT task_history_changed_by_fkey
  FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE CASCADE;


