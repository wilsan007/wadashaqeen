---
name: Wadashaqayn design system architecture
description: Token system structure, Tailwind v4 setup, dual variable system rationale, key file locations
type: project
---

## Stack

- React 18 + TypeScript + Vite 7
- Tailwind CSS v4.1.17 (uses @import 'tailwindcss' — v4 syntax)
- PostCSS via @tailwindcss/postcss (no separate Tailwind CLI)
- shadcn/ui style=default, baseColor=slate, cssVariables=true
- 272 components across src/components/

## Key design system files

- `src/index.css` — @theme block (Tailwind v4 tokens) + @layer base (CSS variables for shadcn)
- `tailwind.config.ts` — Tailwind v3-style config consumed via @tailwindcss/postcss; still valid in v4
- `src/lib/dialog-themes.ts` — per-module theme objects (tasks/projects/hr/operations/admin/training/analytics/settings)
- `tailwind.config.ts` bridges v4 @theme tokens to named Tailwind classes (bg-tech-blue, text-success, etc.)

## Dual token system — why it exists (intentional)

Two parallel systems coexist:
1. `@theme {}` in index.css — Tailwind v4 native tokens, used by bg-*, text-*, border-* classes
2. `@layer base :root {}` — HSL bare-value CSS variables (no hsl() wrapper), consumed by shadcn/ui components

This is NOT a bug. shadcn/ui reads variables as raw HSL channels and wraps them in hsl() in tailwind.config.ts:
  `primary: { DEFAULT: 'hsl(var(--primary))' }`
The @theme block enables Tailwind v4 utility classes to resolve the same values.

**Obligation**: When changing a color value in @layer base, also update the matching --color-* entry in @theme to stay in sync.

## Custom token namespace

Beyond shadcn base tokens, the project defines:
- `--tech-blue/purple/cyan/green/orange/red` — module identity colors
- `--priority-high/medium/low/critical` — task priority badges
- `--status-todo/doing/blocked/done/review/backlog` — task status chips
- `--badge-blue/purple/pink/green/yellow/orange/red/gray` — badge fills
- `--gantt-grid/header/hover/task-bg` — Gantt-specific colors
- `--glass-bg/border`, `--gradient-primary/secondary/accent/bg/card` — UI effects
- `--sidebar-*` (8 tokens) — sidebar component colors
- `--success/warning/danger/info` — semantic state colors

## Styles sub-directory

`src/styles/` contains 5 auxiliary CSS files:
- `force-purple.css` — emergency overrides (REFACTORED 2026-05-08 to use CSS vars)
- `sticky-headers.css` — sticky table header fixes (FIXED 2026-05-08)
- `sidebar-overlay.css`, `landscape-optimization.css`, `sticky-table.css` — not yet audited

**Why:** line 5 of src/styles/sticky-headers.css previously had rgb(var(--primary)) which is always invalid since --primary holds HSL channel triplets, not RGB channels.
