# Edge Functions — Documentation

Runtime : **Deno**  
Config : `supabase/config.toml`  
Shared utilities : `supabase/functions/_shared/`

## Inventaire

| Fonction | JWT requis | Description |
|----------|:----------:|-------------|
| `auth-hook-claims` | ✅ | Injecte claims custom dans le JWT (tenant_id, rôles) |
| `onboard-tenant-owner` | ✅ | Initialise un nouveau tenant après inscription |
| `send-invitation` | ❌* | Envoie un email d'invitation collaborateur |
| `send-collaborator-invitation` | ✅ | Invitation avec contexte projet |
| `accept-invitation` | ✅ | Valide et applique une invitation |
| `handle-collaborator-confirmation` | ✅ | Confirmation flux collaborateur |
| `handle-email-confirmation` | ✅ | Confirmation email |
| `send-notifications` | ❌* | Dispatche notifications push/email |
| `webhook-auth-handler` | ✅ | Authentification webhooks entrants |
| `bulk-import-employees` | ✅ | Import masse employés CSV/JSON |
| `operational-instantiator` | ✅ | Instantiation tâches opérationnelles récurrentes |

\* Protégées par `x-webhook-secret` header (voir `_shared/validateWebhook.ts`)

## Sécurisation des fonctions sans JWT

Les fonctions `send-invitation` et `send-notifications` ont `verify_jwt = false`
dans `config.toml`. Elles sont protégées par un secret partagé :

```typescript
import { validateWebhookSecret } from '../_shared/validateWebhook.ts';

const authError = validateWebhookSecret(req);
if (authError) return authError;
```

Configurer dans Supabase Dashboard → Edge Functions → Secrets :
```
WEBHOOK_SECRET=<openssl rand -hex 32>
```

## Déploiement

```bash
# Déployer toutes les fonctions
supabase functions deploy

# Déployer une fonction spécifique
supabase functions deploy auth-hook-claims

# Configurer les secrets
supabase secrets set WEBHOOK_SECRET=<valeur>
supabase secrets set RESEND_API_KEY=<valeur>
```

## Variables d'environnement (auto-injectées)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
