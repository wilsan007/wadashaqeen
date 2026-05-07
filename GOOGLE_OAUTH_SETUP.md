# Configuration Google OAuth pour Wadashaqayn

Ce guide explique comment configurer Google OAuth pour que l'écran de consentement affiche
**Wadashaqayn** (et non "Supabase") et que le redirect URI soit correct.

---

## 1. Google Cloud Console — Créer / configurer l'application OAuth

### 1.1 Accéder au projet

1. Ouvrir [console.cloud.google.com](https://console.cloud.google.com)
2. Sélectionner (ou créer) le projet associé à Wadashaqayn

### 1.2 Configurer l'écran de consentement OAuth

Aller dans **APIs & Services → OAuth consent screen**

| Champ | Valeur |
|---|---|
| User Type | **External** (ou Internal si G Workspace interne) |
| App name | **Wadashaqayn** |
| User support email | support@wadashaqayn.org |
| App logo | Charger `public/logo-w.svg` (ou une version PNG 120×120) |
| App domain > Application home page | `https://wadashaqayn.org` |
| App domain > Privacy policy | `https://wadashaqayn.org/privacy` |
| App domain > Terms of service | `https://wadashaqayn.org/terms` |
| Authorized domains | `wadashaqayn.org` |
| Developer contact | contact@wadashaqayn.org |

> ⚠️ **Important** : Le champ "App name" détermine ce que voit l'utilisateur sur l'écran Google.
> Si vous voyez encore "Supabase", c'est que ce champ n'a pas été mis à jour.

Cliquer **Save and Continue** sur chaque étape.

### 1.3 Créer les identifiants OAuth 2.0

Aller dans **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**

| Champ | Valeur |
|---|---|
| Application type | **Web application** |
| Name | `Wadashaqayn Production` |
| Authorized JavaScript origins | `https://wadashaqayn.org` |
| **Authorized redirect URIs** | `https://<TON-PROJECT-ID>.supabase.co/auth/v1/callback` |

> 💡 Trouver votre `PROJECT-ID` dans Supabase Dashboard → Settings → General → Reference ID.
> L'URL complète ressemble à : `https://abcdefghijkl.supabase.co/auth/v1/callback`

Cliquer **Create** et noter le **Client ID** et le **Client Secret**.

---

## 2. Supabase Dashboard — Activer Google Provider

1. Aller sur [supabase.com/dashboard](https://supabase.com/dashboard) → votre projet
2. **Authentication → Providers → Google**
3. Activer le toggle **Enable Google provider**
4. Remplir :
   - **Client ID** : coller le Client ID Google
   - **Client Secret** : coller le Client Secret Google
5. Cliquer **Save**

---

## 3. Supabase Dashboard — Configurer les URLs autorisées

Dans **Authentication → URL Configuration** :

| Champ | Valeur |
|---|---|
| Site URL | `https://wadashaqayn.org` |
| Redirect URLs (whitelist) | `https://wadashaqayn.org/auth/callback` |
| Redirect URLs (whitelist) | `http://localhost:5173/auth/callback` *(pour le dev)* |

> ⚠️ Sans la Site URL correcte, le redirect après login renvoie vers l'URL Supabase par défaut.

---

## 4. Variable d'environnement (optionnel mais recommandé)

Dans `.env.production` :

```env
VITE_APP_URL=https://wadashaqayn.org
```

Dans `.env.development` (ou `.env.local`) :

```env
VITE_APP_URL=http://localhost:5173
```

Le code dans `SocialAuth.tsx` utilise automatiquement `VITE_APP_URL` si définie,
sinon `window.location.origin` (fonctionnel pour le développement local).

---

## 5. Vérification de l'écran de consentement

Après publication de l'app OAuth (ou en mode test) :

1. Aller sur `https://wadashaqayn.org/login`
2. Cliquer "Continuer avec Google"
3. L'écran Google doit afficher :
   - **Nom** : Wadashaqayn
   - **Logo** : logo de l'entreprise
   - **URL** : wadashaqayn.org
   - **Lien confidentialité** : `https://wadashaqayn.org/privacy`
   - **Lien CGU** : `https://wadashaqayn.org/terms`

---

## 6. Flux OAuth dans l'application

```
Utilisateur clique "Continuer avec Google"
  → SocialAuth.tsx : signInWithOAuth({ provider: 'google', redirectTo: 'https://wadashaqayn.org/auth/callback' })
  → Redirection vers Google
  → Authentification Google
  → Redirect vers https://<PROJECT>.supabase.co/auth/v1/callback  ← côté Supabase
  → Supabase échange le code, crée la session
  → Redirect vers https://wadashaqayn.org/auth/callback  ← notre app
  → AuthCallback.tsx : lit la session, redirige vers /dashboard
```

---

## 7. Statut de vérification de l'app Google

Pour que l'écran de consentement ne montre pas "Cette application n'est pas vérifiée" :

- **En test** : ajouter les emails des testeurs dans *OAuth consent screen → Test users*
- **En production** : soumettre l'app à la vérification Google (nécessaire si >100 utilisateurs externes)

Pour la vérification, Google demandera :
- Domaine vérifié dans Google Search Console
- Page de politique de confidentialité accessible (→ `https://wadashaqayn.org/privacy`)
- Page CGU accessible (→ `https://wadashaqayn.org/terms`)
- Justification de l'utilisation des scopes demandés
