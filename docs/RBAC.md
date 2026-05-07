# Système RBAC — Wadashaqayn SaaS

## Rôles

| Rôle | Niveau | Description |
|------|--------|-------------|
| SUPER_ADMIN | 1 | Accès total multi-tenant |
| TENANT_ADMIN | 2 | Administration du tenant |
| MANAGER_HR | 3 | Gestion RH |
| PROJECT_MANAGER | 3 | Gestion projets |
| TEAM_LEAD | 4 | Chef d'équipe |
| EMPLOYEE | 5 | Employé standard |
| COLLABORATOR | 6 | Collaborateur externe |
| VIEWER | 7 | Lecture seule |

## Matrice de permissions

| Permission | SUPER_ADMIN | TENANT_ADMIN | MANAGER_HR | PROJECT_MANAGER | EMPLOYEE |
|-----------|:-----------:|:------------:|:----------:|:---------------:|:-------:|
| canAccessSuperAdmin | ✅ | ❌ | ❌ | ❌ | ❌ |
| canAccessHR | ✅ | ✅ | ✅ | ❌ | ❌ |
| canAccessProjects | ✅ | ✅ | ❌ | ✅ | ✅ |
| canAccessTasks | ✅ | ✅ | ✅ | ✅ | ✅ |
| canManageUsers | ✅ | ✅ | ❌ | ❌ | ❌ |
| canInviteUsers | ✅ | ✅ | ✅ | ✅ | ❌ |

## Implémentation

### Client (React)
```typescript
const { hasPermission, isSuperAdmin } = useUserRoles();
if (!hasPermission('canAccessHR')) return <Unauthorized />;
```

### Routing
```tsx
<ProtectedRoute requiredAccess="canAccessHR">
  <HRPage />
</ProtectedRoute>
```

### Base de données (RLS)
```sql
-- Isolation tenant
CREATE POLICY "tenant_isolation" ON tasks
  USING (tenant_id = get_current_tenant_id());

-- Bypass super admin
CREATE POLICY "super_admin_bypass" ON tasks
  USING (is_super_admin());
```

## Cache des rôles

Les rôles sont mis en cache via `roleCacheManager` avec invalidation automatique
sur changement de permissions. La dégradation gracieuse sur erreur 42501 (permission
denied PostgreSQL) retourne un tableau vide plutôt que de planter l'application.
