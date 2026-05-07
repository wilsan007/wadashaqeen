# Architecture — Wadashaqayn SaaS

## Vue d'ensemble

Wadashaqayn est une plateforme SaaS multi-tenant pour la gestion de projets et RH.

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React 18, TypeScript 5.8, Vite 7, TailwindCSS, shadcn/ui |
| State | TanStack Query v5, React Context |
| Backend | Supabase (PostgreSQL 15, RLS, Edge Functions Deno) |
| Auth | Supabase Auth + JWT custom claims |
| CI/CD | GitHub Actions (7 workflows) |
| Déploiement | Hostinger / LWS |

## Modèle multi-tenant

```
tenant_id → filtre automatique sur toutes les tables via RLS PostgreSQL
```

Fonctions helper PostgreSQL :
- `get_current_tenant_id()` — retourne le tenant de l'utilisateur connecté
- `is_super_admin()` — bypass RLS pour les super admins

## Couche Services (`src/services/`)

| Fichier | Responsabilité |
|---------|----------------|
| `task.service.ts` | CRUD tâches + métriques par statut |
| `project.service.ts` | CRUD projets + statistiques (actifs, terminés, en retard) |
| `employee.service.ts` | Gestion employés + stats équipe |
| `notification.service.ts` | Notifications utilisateur (lecture, marquage) |
| `export.service.ts` | Export CSV / JSON côté client |
| `payrollService.ts` | Calculs de paie |
| `HierarchyService.ts` | Hiérarchie organisationnelle |

## Flux d'authentification

```
1. /login → Supabase Auth
2. auth-hook-claims Edge Function → injecte tenant_id + rôles dans JWT
3. useSessionManager → session React
4. RLS PostgreSQL → filtre automatique par tenant
5. useRoleBasedAccess → droits UI
```

## Cache React Query (src/lib/queryConfig.ts)

| Type | staleTime | gcTime | Usage |
|------|-----------|--------|-------|
| `static` | 30 min | 60 min | Rôles, permissions |
| `semiStatic` | 5 min | 15 min | Projets, employés, stats |
| `realtime` | 30 sec | 2 min | Tâches actives |

## Routing

```
/ (public) → LandingPage
/login → Auth
/dashboard → Index [ProtectedRoute: canAccessTasks]
/projects → ProjectPage [ProtectedRoute: canAccessProjects]
/gantt/:projectId → GanttPage [ProtectedRoute: canAccessProjects]
/hr → HRPage [ProtectedRoute: canAccessHR]
/super-admin → SuperAdminPage [ProtectedRoute: canAccessSuperAdmin]
```
