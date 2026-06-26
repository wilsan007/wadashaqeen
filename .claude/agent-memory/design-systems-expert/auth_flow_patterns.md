---
name: auth-flow-patterns
description: Dual auth flows for Tenant Owner and Collaborator invitation — active vs dead paths, anti-patterns, and design system divergences found during audit
metadata:
  type: project
---

## Active vs Dead Flows

### Tenant Owner
- **Active golden path**: `send-invitation` Edge Fn → Magic Link → `AuthCallback.tsx` (`?invitation=tenant_owner`) → `onboard-tenant-owner` Edge Fn → `/update-password?welcome=true`
- **Dead/parallel path**: `TenantOwnerSignup.tsx` (`?token=`) — depends on DB trigger `auto_create_tenant_owner` which is unreliable; uses `window.confirm()` for password change; calls `supabase.auth.admin.getUserById` from the client (service role leak risk)

### Collaborator
- **Active golden path**: `send-collaborator-invitation` Edge Fn → Magic Link → `AuthCallback.tsx` (`?invitation=collaborator`) → `handle-collaborator-confirmation` Edge Fn (called as HTTP POST, not webhook) → `/dashboard`
- **Dead/parallel path**: `AcceptInvitation.tsx` (`?token=`) — calls `supabase.auth.signUp` with a new password; is inconsistent with magic-link flow; different styling (shadow-lg, bg-gray-50, native `<label>` elements)
- **Orphan page**: `CollaboratorSetup.tsx` — standalone polling page that appears to be a leftover, not reachable from the active flow (AuthCallback redirects directly to /dashboard, not to /collaborator-setup)

## Key Anti-Patterns Recorded

1. `window.confirm()` at line 390 of `TenantOwnerSignup.tsx` — blocks the render thread, no styling
2. `supabase.auth.admin.getUserById()` called from client-side in `TenantOwnerSignup.tsx` line 269 — requires service role key; will silently fail with anon key
3. Token extracted via regex `match(/token=([^&]+)/)?.[1]` in both Edge Functions — fragile against URL structure changes
4. `handle-collaborator-confirmation` is coded as a webhook handler (checks `payload.type === 'UPDATE'`) but is actually called as a direct POST from `AuthCallback.tsx` — the payload shape mismatch means `payload.record` will be undefined, making the function dead code in the active flow
5. `listUsers()` called without pagination in both Edge Functions (scales badly)
6. `processUserSession()` function in AuthCallback.tsx is a legacy fallback using `setInterval` — never cleaned up on unmount, potential memory leak

## Design System Divergences Between Auth Pages

| Property | TenantOwnerSignup | AcceptInvitation | CollaboratorSetup |
|---|---|---|---|
| Card shadow | shadow-2xl | shadow-lg | shadow-xl |
| Background | bg-gradient-to-br from-blue-50 to-indigo-100 | bg-gray-50 | bg-gradient-to-br from-blue-50 via-white to-purple-50 |
| Label component | `<Label>` from shadcn | native `<label>` HTML | `<CardDescription>` only |
| Toast system | `useToast()` from shadcn | `toast()` from sonner | no toasts |
| Loading state | `<BrandedLoadingScreen>` | inline `<Loader2>` spinner | gradient icon with Loader2 |

## Security Issues

- Both email flows include the temp password in plaintext in the email body (intentional fallback, but risky)
- CORS `Access-Control-Allow-Origin: '*'` in `send-collaborator-invitation` and `handle-collaborator-confirmation` and `accept-invitation`
- `send-invitation` uses `validateWebhookSecret`; `send-collaborator-invitation` uses JWT — inconsistency
- `AcceptInvitation.tsx` uses `import.meta.env.VITE_SUPABASE_ANON_KEY` directly in fetch headers — acceptable but exposes key in source maps

**Why:** Audit requested by user to map flows, find inconsistencies, and identify security/UX risks before cleanup sprint.

**How to apply:** When working on any auth-related page or Edge Function, reference this to understand which paths are live vs dead, and which components need design system alignment.
