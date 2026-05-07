# Guide de Déploiement — Wadashaqayn SaaS

## Pré-requis

- Node.js 18+
- npm 9+
- Supabase CLI
- Accès FTP/SSH Hostinger ou LWS

## 1. Configuration locale

```bash
cp .env.example .env
# Remplir les valeurs dans .env
npm install
npm run dev  # port 8080
```

## 2. Build production

```bash
npm run build
# Génère dist/ (~446 KB, 123 KB compressé)
```

## 3. Migrations Supabase

```bash
# Vérifier l'état des migrations
supabase db diff --linked

# Appliquer les nouvelles migrations
supabase db push

# Générer les types TypeScript après migration
npm run db:types
```

## 4. Déploiement Edge Functions

```bash
supabase functions deploy
supabase secrets set WEBHOOK_SECRET=<openssl rand -hex 32>
supabase secrets set RESEND_API_KEY=<valeur>
```

## 5. Déploiement frontend (Hostinger)

Via GitHub Actions `.github/workflows/deploy-hostinger.yml` — déclenché sur push `main`.

Ou manuellement via FTP :
```bash
# Uploader le contenu de dist/ vers public_html/
```

Copier `.htaccess` (voir `hostinger.htaccess`) pour le routing SPA :
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## 6. Variables d'environnement en production

Configurer dans Hostinger → Hébergement → Variables d'environnement :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SENTRY_DSN`

## 7. Audit post-déploiement

```bash
# Vérifier les vulnérabilités
npm audit

# Vérifier RLS (Supabase SQL Editor)
# Exécuter supabase/sql/audit_rls.sql
```
