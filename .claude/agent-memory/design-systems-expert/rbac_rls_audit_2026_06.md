---
name: rbac-rls-audit-2026-06
description: Full RLS/RBAC security audit June 2026 — 14 unprotected tables, payroll access control gaps, unreliable session variable, and frontend guard analysis
metadata:
  type: project
---

# RBAC + RLS Audit — June 2026

## Key facts established

### Helper function reliability
`user_has_role()` relies on `current_setting('app.current_tenant_id', true)::uuid` which returns NULL when the session variable is not set (e.g. Edge Functions, direct DB calls, Supabase Studio). Any policy using it silently fails open or raises a cast exception.
New canonical helper: `public.user_has_min_role(TEXT)` (created in FIX_RBAC_RLS_COMPLET.sql) uses `get_user_tenant_id()` which is SECURITY DEFINER and queries `tenant_members` — always reliable.

### 14 tables with RLS disabled (Critique 1)
Disabled in `20250111000203_rls_policies_part2.sql` lines 375–394, labeled "non-critical":
`hr_analytics`, `employee_insights`, `task_audit_logs`, `candidates`, `interviews`, `job_applications`, `job_offers`, `job_posts`, `capacity_planning`, `country_policies`, `employee_access_logs`, `safety_documents`, `safety_incidents`, `corrective_actions`.
All re-enabled with proper tenant + role policies in the fix file.

### skills table — USING(true) (Critique 2)
`20250928023500_fix_rls_performance.sql` dropped ALL policies then recreated `skills_read_all` with `USING(true)` — no tenant filter. Fixed.

### Payroll tables — no role filter (Critiques 3 + 6)
`20251204000005_fix_payroll_rls.sql` replaced the broken `app.current_tenant_id` policy with `tenant_id IN (SELECT tenant_id FROM user_roles WHERE user_id = auth.uid())` — correct tenant isolation but zero role check. Any employee can read and write all payslips of the tenant. Fixed to hr_manager+ for writes, hr_manager+ for reads (plus self-read for employee on paie_bulletins).

### Seniority bonus config — no role filter (Critique 7)
`20260126000001_fix_seniority_bonus_rls.sql` grants INSERT/UPDATE to any authenticated user with an active user_roles record — no role check. Fixed to hr_manager+.

### ref_bareme_its — USING(true) write (Critique new)
`20251203000000_create_payroll_module.sql` creates both read and write policies with `USING(true)`. Write restricted to hr_manager+ in fix.

### Operational tables — using auth.jwt()
`03-setup-rls-policies.sql` uses `(auth.jwt()->>'tenant_id')::uuid` — JWT claim not guaranteed in Supabase unless custom claim is set. Migrated to `get_user_tenant_id()` for all 3 operational tables.

### Role name mismatch (Critique new — latent)
Migrations in `20250111000202` reference `hr_admin`, `payroll_admin`, `finance_admin` — these role names do NOT exist in the canonical hierarchy in `src/lib/rbac/hierarchy.ts` (which uses `hr_manager`). Any policy depending on `hr_admin` is silently non-functional. The fix file uses `user_has_min_role('hr_manager')` exclusively.

## Frontend permission layer analysis

### Route-level guards (App.tsx)
ProtectedRoute with `requiredAccess="canAccessHR"` used for all HR routes. However `canAccessHR = true` for ALL authenticated users (line 109 in `useRoleBasedAccess.ts`). The HR section is effectively unguarded at the route level — the comment says "chacun voit ses propres infos RH."

### Implication
PayrollManagement, OnboardingOffboarding, HealthSafety, and HierarchyConfig sub-tabs inside HRPage render for ANY authenticated user. The RLS layer is the only meaningful enforcement — making the database-side fixes critical.

### Analytics page
Guarded with `canAccessTasks` which is also `true` for everyone. No role gate on Analytics; relies solely on RLS and data scoping at query level.

### ApprovalsPage
Guarded with `canAccessHR` (= always true). No `hr_manager`/`team_lead` role check before rendering. ApprovalPanel must do its own permission check internally.

## Fix file location
`/home/awaleh/projet de creation app/Wadashaqayn/gantt-flow-supabase-baseline/supabase/sql/FIX_RBAC_RLS_COMPLET.sql`

**Why:** Comprehensive single-file correction recommended for atomic application via Supabase Dashboard SQL Editor.
**How to apply:** This memory should prompt recommending the fix file is applied to Supabase before any production tenant onboarding.

See also: [[rbac-permission-gaps]]
