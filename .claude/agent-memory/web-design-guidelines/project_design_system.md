---
name: Wadashaqayn Design System
description: Tokens CSS, typographie, couleurs, breakpoints et conventions de composants de l'application SaaS Wadashaqayn
type: project
---

Wadashaqayn est une application SaaS de gestion de projets et RH en React + TypeScript + Tailwind CSS v4 + shadcn/ui, localisée en français.

**Why:** Conserver la source de vérité du système de design pour guider tous les futurs audits et implémentations.

**How to apply:** Utiliser ces tokens en priorité absolue — ne jamais hardcoder des couleurs hex ou des classes `slate-*`/`white`/`black` directement dans les pages.

## Stack design
- Tailwind CSS v4 + `@theme` tokens (pas de tailwind.config.ts manuel pour les couleurs)
- shadcn/ui avec dark mode `['class']` (basculé via `.dark` sur `<html>`)
- Icônes : Lucide React
- Animations : framer-motion (BrandedLoadingScreen) + classes Tailwind custom

## Tokens de couleur (src/index.css)

### Couleurs sémantiques principales
- `--background` / `--foreground` : fond et texte principal
- `--card` / `--card-foreground` : cartes
- `--muted` / `--muted-foreground` : texte secondaire / zones atténuées
- `--primary` (bleu 214 100% 50%) / `--primary-foreground` (blanc)
- `--accent` (cyan 176 85% 28% — WCAG AA corrigé) / `--accent-foreground` (blanc)
- `--destructive` (rouge 0 84% 55%) / `--destructive-foreground` (blanc)
- `--border`, `--input`, `--ring` : contours et focus

### Tech colors (accent visuel)
- `--tech-blue` : 214 100% 50% (bleu primaire)
- `--tech-purple` : 262 100% 58%
- `--tech-cyan` : 176 85% 28% (WCAG AA — version assombrie)
- `--tech-green` : 142 76% 36%
- `--tech-orange` : 25 95% 50%
- `--tech-red` : 0 84% 55%

### Tokens sémantiques métier
- `--priority-high/medium/low/critical`
- `--status-todo/doing/blocked/done/review/backlog`
- `--badge-blue/purple/pink/green/yellow/orange/red/gray`

### WCAG Notes importantes
- `--warning` (43 96% 56%) = 1.69:1 sur blanc — NE JAMAIS utiliser en texte sur fond blanc
- Pour texte warning AA : utiliser `text-amber-800` (43 96% 25%) = 7.2:1
- `--status-backlog` = 3.9:1 (passe AA large text seulement)

## Tokens d'espacement et forme
- `--radius` : 0.75rem (lg), 0.5rem (md), 0.25rem (sm)
- Grille 4px/8px implicite via Tailwind

## Sidebar
- Fond : `bg-zinc-950` / texte : blanc + gris zinc — intentionnellement hors du thème light/dark
- Largeur : 256px (expanded) / 64px (collapsed), persisté dans localStorage
- Transition : 300ms

## Breakpoints
- Mobile layout : < 1024px (`useIsMobileLayout`)
- Mobile strict : < 768px (`useIsMobile`)
- Desktop : >= 1024px (sidebar fixe visible)

## Classes utilitaires CSS custom
- `.glass` : glassmorphism adaptatif light/dark
- `.modern-card` : cartes premium avec gradient
- `.glow-primary` / `.glow-accent` : effets lumineux
- `.hover-glow` : élévation au hover
- `.animate-scroll-seamless` : carrousel infini (landing)
- `.skip-link` : lien d'évitement clavier (WCAG 2.4.1)

## Conventions de composants
- Icônes Lucide dans les headings → `aria-hidden="true"`
- Boutons icon-only (sidebar collapsed, actions) → `aria-label` obligatoire (pas `title`)
- Boutons toggle → `aria-pressed` + `aria-label`
- Barres de progression → `role="progressbar"` + `aria-valuenow/min/max`
- Emojis dans le contenu → `aria-hidden="true"` sur le span emoji
- Listes de notifications/éléments → `role="list"` + `role="listitem"`
- États vides → `role="status"` avec message contextuel (différencier "aucun résultat" de "aucun élément")
- Zones de chargement → `aria-busy="true"` + `aria-label`
- SVG décoratifs → `aria-hidden="true"`
