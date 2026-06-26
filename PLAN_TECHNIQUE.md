# Plan Technique — 4 Chantiers Majeurs

> État au 2026-05-09 | Projet Wadashaqayn | 491 fichiers TS/TSX

---

## Vue d'ensemble

| Chantier | Périmètre | Effort | Agent | Isolation |
|---|---|---|---|---|
| React Query | 100 fichiers, ~271 fetches | Élevé | general-purpose | worktree par module |
| Zod sur formulaires | 8 formulaires | Moyen | general-purpose | worktree par formulaire |
| strictNullChecks | tsconfig + 9 modules | Élevé | general-purpose | worktree par module |
| Icônes PWA | manifest + 2 icônes PNG | Faible | agent-browser + general-purpose | direct |

---

## Chantier 1 — Migration React Query

**Contexte :** 100 fichiers appellent `supabase.from()` / `supabase.rpc()` directement. 9 fichiers utilisent déjà `useQuery`. Aucun `QueryClientProvider` global trouvé — à vérifier.

**Principe d'exécution par module :**
```
Agent general-purpose (worktree isolé) :
1. Lister tous les appels supabase dans le module cible
2. Créer les queryKeys et queryFn correspondants
3. Remplacer useState+useEffect par useQuery/useMutation
4. Vérifier que le build TypeScript passe
5. Ouvrir PR ou appliquer directement
```

**Ordre des modules (du moins risqué au plus risqué) :**

### Module 1 — `src/services/` (2 fichiers)
- [src/services/task.service.ts](src/services/task.service.ts)
- [src/services/project.service.ts](src/services/project.service.ts)

**Prompt agent :**
> "Dans le projet Wadashaqayn (React + Supabase), migre src/services/task.service.ts et src/services/project.service.ts de fetch directs Supabase vers des fonctions pures (queryFn) compatibles React Query — sans encore appeler useQuery ici, juste extraire la logique fetch pour la rendre appelable par useQuery. Vérifie que le build passe après. Isolation worktree."

---

### Module 2 — `src/hooks/` (28 fichiers avec fetches directs)
Fichiers clés : useTasksEnterprise.ts, useOperationalTasksEnterprise.ts, usePermissions.ts, useEmployees.ts, useHRMinimal.ts, useHRSelfService.ts...

**Prompt agent :**
> "Dans le projet Wadashaqayn, migre le hook [NOM_HOOK].ts de son pattern useState+useEffect+supabase.from vers useQuery de @tanstack/react-query. Conserve la même interface publique (mêmes props retournées). Utilise la queryKey pattern [entity, filters]. Vérifie que le build passe."

---

### Module 3 — `src/components/tasks/`
### Module 4 — `src/components/hr/`
### Module 5 — `src/components/operations/`
### Module 6 — `src/components/notifications/`
### Module 7 — `src/components/vues/table/`

---

## Chantier 2 — Schémas Zod sur les formulaires

**Contexte :** 0 formulaire utilise react-hook-form ou Zod actuellement. Formulaires HTML natifs avec gestion d'état locale.

**Prérequis (à faire une seule fois) :**
```bash
npm install zod react-hook-form @hookform/resolvers
```

**Principe d'exécution par formulaire :**
```
Agent general-purpose (worktree isolé) :
1. Analyser les champs du formulaire cible (types, contraintes)
2. Créer le schema Zod correspondant
3. Intégrer useForm + zodResolver
4. Remplacer la gestion d'état manuelle
5. Vérifier le build
```

**Ordre des formulaires :**

### Formulaire 1 — QuickTaskForm (le plus simple)
- [src/components/tasks/QuickTaskForm.tsx](src/components/tasks/QuickTaskForm.tsx)

**Prompt agent :**
> "Dans le projet Wadashaqayn, ajoute un schéma Zod sur src/components/tasks/QuickTaskForm.tsx. Installe zod + react-hook-form + @hookform/resolvers si absent. Analyse les champs existants, crée le schéma Zod avec les validations appropriées, intègre useForm avec zodResolver. Conserve le comportement onSubmit existant. Vérifie le build TypeScript."

---

### Formulaire 2 — ExpenseReportForm
- [src/components/hr/ExpenseReportForm.tsx](src/components/hr/ExpenseReportForm.tsx)

### Formulaire 3 — EmployeePayrollForm
- [src/components/hr/EmployeePayrollForm.tsx](src/components/hr/EmployeePayrollForm.tsx)

### Formulaire 4 — ActivityForm
- [src/components/operations/ActivityForm.tsx](src/components/operations/ActivityForm.tsx)

### Formulaire 5 — ActivityFormWithAssignment
- [src/components/operations/ActivityFormWithAssignment.tsx](src/components/operations/ActivityFormWithAssignment.tsx)

### Formulaire 6 — ScheduleForm
- [src/components/operations/ScheduleForm.tsx](src/components/operations/ScheduleForm.tsx)

### Formulaire 7 — ActionTemplateForm
- [src/components/operations/ActionTemplateForm.tsx](src/components/operations/ActionTemplateForm.tsx)

### Formulaire 8 — PerformanceManagement
- [src/components/hr/PerformanceManagement.tsx](src/components/hr/PerformanceManagement.tsx)

---

## Chantier 3 — strictNullChecks TypeScript

**Contexte :** `strictNullChecks: false` dans [tsconfig.json](tsconfig.json) et [tsconfig.app.json](tsconfig.app.json). Activer globalement = milliers d'erreurs. Approche : tsconfig par module via `include` paths.

**Principe d'exécution par module :**
```
Agent general-purpose (worktree isolé) :
1. Créer tsconfig.[module].json avec strictNullChecks: true et include pointant sur le module
2. Lancer tsc --project tsconfig.[module].json --noEmit
3. Fixer les erreurs (null checks, optional chaining, assertions)
4. Vérifier que le build global passe encore (strictNullChecks: false global)
5. Documenter les patterns de fix utilisés
```

**Ordre des modules :**

### Étape 1 — `src/services/` (socle, peu de fichiers)
**Prompt agent :**
> "Dans le projet Wadashaqayn, active strictNullChecks uniquement pour src/services/ en créant un tsconfig.services.json avec include: ['src/services']. Lance tsc --project tsconfig.services.json --noEmit, liste toutes les erreurs, puis corrige-les dans les fichiers services (optional chaining ?., null assertions !, types Union avec null). Ne touche pas tsconfig.app.json global. Vérifie que npm run build passe toujours."

### Étape 2 — `src/hooks/`
### Étape 3 — `src/components/tasks/`
### Étape 4 — `src/components/hr/`
### Étape 5 — `src/components/operations/`
### Étape finale — Activer dans tsconfig.app.json global quand tous les modules sont propres

---

## Chantier 4 — Icônes PWA PNG

**Contexte :** Pas de `manifest.json`. Assets existants : `public/logo-w.svg`, `public/wadashaqayn_logo_final.ico`.

**Tâches (séquentielles, un seul agent) :**

1. **Générer les PNG** depuis logo-w.svg via Sharp ou canvas (Node.js) :
   - `public/icon-192x192.png`
   - `public/icon-512x512.png`

2. **Créer `public/manifest.json`** :
```json
{
  "name": "Wadashaqayn",
  "short_name": "Wadashaqayn",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

3. **Mettre à jour `index.html`** avec `<link rel="manifest" href="/manifest.json">` et `<meta name="theme-color">`.

**Prompt agent :**
> "Dans le projet Wadashaqayn, mets en place les icônes PWA manquantes. Utilise sharp (npm install sharp --save-dev) pour générer public/icon-192x192.png et public/icon-512x512.png depuis public/logo-w.svg (ou convertis wadashaqayn_logo_final.ico si le SVG ne convient pas). Crée public/manifest.json avec les champs PWA standard. Met à jour index.html pour lier le manifest et ajouter la meta theme-color. Vérifie que npm run build passe."

---

## Règles d'exécution communes

1. **Toujours utiliser `isolation: "worktree"`** pour les chantiers 1-3 — les changements sont larges et risqués.
2. **Vérifier `npm run build`** (ou `npx tsc --noEmit`) à la fin de chaque session agent.
3. **Un module à la fois** — ne pas lancer plusieurs agents en parallèle sur des modules qui s'importent mutuellement.
4. **Mettre à jour ce fichier** après chaque module complété (marquer [x]).

---

## Suivi de progression

### React Query
- [x] src/services/ (2 fichiers) — hooks useTasks.ts + useProjects.ts créés
- [x] src/hooks/ (28 fichiers) — tous migrés useQuery/useMutation (mutations optimized/index.ts via refetch)
- [x] src/components/tasks/ — TaskAssignmentManager, TaskAttachmentUpload
- [x] src/components/hr/ — 11 composants (AbsenceType, ApprovalPanel, Department, EmployeePayrollForm, EnhancedEmployee, LeaveBalance, Leave, OrgChart, PayrollList, PayrollMgmt, Timesheet)
- [x] src/components/operations/ — ActionAttachmentUpload, OneOffActivityDialog
- [x] src/components/notifications/ — NotificationTestPanel
- [x] src/components/vues/table/ — CommentCell, Comments, DocumentCell, Documents

### Zod Forms
- [ ] QuickTaskForm
- [ ] ExpenseReportForm
- [ ] EmployeePayrollForm
- [ ] ActivityForm
- [ ] ActivityFormWithAssignment
- [ ] ScheduleForm
- [ ] ActionTemplateForm
- [ ] PerformanceManagement

### strictNullChecks
- [ ] src/services/
- [ ] src/hooks/
- [ ] src/components/tasks/
- [ ] src/components/hr/
- [ ] src/components/operations/
- [ ] tsconfig.app.json global

### PWA Icons
- [ ] Générer PNG 192x192 et 512x512
- [ ] Créer manifest.json
- [ ] Mettre à jour index.html
