---
name: Wadashaqayn Design System
description: Palette de couleurs, tokens, et conventions de design du projet Wadashaqayn après refonte Premium SaaS 2025
type: project
---

Design system refondu en mai 2026 vers une esthétique "Premium SaaS 2025" (Linear/Vercel/Arc).

**Palette principale (light)**
- Background: `hsl(40 20% 98%)` — warm white (pas blanc pur)
- Foreground: `hsl(222 47% 8%)` — slate profond
- Primary: `hsl(250 80% 55%)` — indigo vif (remplace le bleu `214 100% 50%`)
- Accent: `hsl(250 80% 96%)` / accent-foreground `hsl(250 80% 40%)` — indigo très light pour bg
- Border: `hsl(220 13% 88%)` — subtile
- Sidebar: `hsl(222 47% 97%)` — lavande très doux

**Palette principale (dark)**
- Background: `hsl(222 47% 7%)` — slate profond type Vercel
- Card: `hsl(222 47% 9%)`
- Primary: `hsl(252 87% 72%)` — indigo lumineux
- Accent: `hsl(250 40% 18%)` / accent-foreground `hsl(252 87% 78%)`
- Border: `hsl(222 30% 16%)`
- Sidebar: `hsl(222 47% 5%)` — plus sombre que le fond

**Conventions établies**
- Border radius: `--radius-lg: 0.875rem`, `--radius-md: 0.625rem`, `--radius-sm: 0.375rem`
- Shadows: douces multi-layer (pas de glow excessif)
- Gradients: indigo/violet, plus de cyan criard
- Animations: blob réduit, transitions 150-200ms cubic-bezier

**Why:** L'ancienne palette bleu saturé/cyberpunk (primary `214 100% 50%`, accent cyan `176 85% 28%`) était inadaptée à un SaaS B2B professionnel.

**How to apply:** Toute nouvelle composant utilise les tokens CSS `--primary`, `--sidebar-*`, etc. Ne jamais hardcoder `bg-zinc-950` ou couleurs hex/hsl directes quand un token existe.
