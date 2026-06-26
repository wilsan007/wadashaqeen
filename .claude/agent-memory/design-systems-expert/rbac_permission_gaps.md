---
name: rbac-permission-gaps
description: RBAC gaps found and fixed in May 2026 — components that lacked permission hooks, invite button exposure, attachment upload bypasses
metadata:
  type: project
---

## Audit RBAC — Mai 2026

Infrastructure de permissions existante et bien conçue (useTaskEditPermissions, useProjectEditPermissions, canManageTeam, etc.) mais plusieurs composants ne l'appliquaient pas.

### Problèmes corrigés

**TaskEditDialog.tsx** (`src/components/vues/dialogs/`)
- N'appelait pas useTaskEditPermissions. Tout utilisateur pouvait modifier titre, assigné, priorité, statut.
- Correction : hook branché, chaque champ disabled selon canEditTitle / canEditAssignee / canEditPriority / canEditStatus. Bloc d'accès refusé affiché si canEdit=false.

**AssigneeSelect.tsx** (`src/components/vues/table/`)
- Bouton "Inviter un collaborateur" visible à tous les rôles.
- Correction : conditionné sur useProjectEditPermissions().canManageTeam.

**ModernTaskCreationDialog.tsx** (`src/components/tasks/`)
- QuickInviteDialog monté sans condition, bouton d'invitation toujours accessible.
- Correction : canManageTeam guard sur le montage du dialog et sur onInviteClick passé à TaskProperties.

**TaskProperties.tsx** (`src/components/tasks/creation/`)
- Bouton UserPlus toujours rendu même quand onInviteClick=undefined.
- Correction : prop onInviteClick rendue optionnelle, bouton conditionnel sur sa présence.

**ProjectCreationDialog.tsx** (`src/components/projects/`)
- Bouton "Inviter le manager" et QuickInviteCollaborator sans garde.
- Correction : conditionné sur canManageTeam.

**ActionTemplateForm.tsx** (`src/components/operations/`)
- Bouton d'invitation dans section assignation sans garde.
- Correction : conditionné sur canManageTeam.

**TaskAttachmentUpload.tsx** (`src/components/tasks/`)
- Aucune vérification permissions avant d'afficher le formulaire d'upload.
- Correction : useTaskEditPermissions({ taskId }), bloc d'accès refusé si canEdit=false.

**ActionAttachmentUpload.tsx** (`src/components/operations/`)
- Même problème. Pour task_action : vérification canEdit. Pour operational_template : vérification canView.
- Correction : garde d'accès refusé ajoutée.

**TaskActionColumns.tsx** (`src/components/vues/table/`)
- Bouton `+` (upload preuve) affiché pour toutes les tâches sans distinction.
- Correction : extraction en sous-composant TaskActionRow qui appelle useTaskEditPermissions par tâche (les hooks ne peuvent pas être dans des boucles). Bouton conditionnel sur canEdit.

### Pattern à retenir
- Les hooks de permissions (useTaskEditPermissions, useProjectEditPermissions) sont déjà complets et corrects.
- Le pattern d'anti-pattern récurrent : composant reçoit une prop ou ouvre un dialog sans appeler le hook.
- Pour les listes de tâches, extraire chaque ligne en sous-composant pour pouvoir appeler les hooks React de façon correcte.
- canManageTeam de useProjectEditPermissions est la clé pour les invitations collaborateurs (PM+, admin, tenant_admin, super_admin uniquement).

**Why:** Employés avaient accès à des actions administratives via l'UI malgré les règles métier définies dans les hooks.

**How to apply:** Toujours vérifier si un composant qui affiche un bouton d'édition, d'invitation, ou d'upload appelle bien le hook de permissions correspondant.
