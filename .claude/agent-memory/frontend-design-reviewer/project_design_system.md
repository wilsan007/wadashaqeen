---
name: Wadashaqayn Design System
description: Design system details for the Wadashaqayn SaaS app — Tailwind v4, shadcn/ui, HSL CSS variables, French locale
type: project
---

The project uses Tailwind v4 with a custom `@theme` block in `src/index.css` as the source of truth, plus `@layer base :root {}` HSL variables for shadcn/ui compatibility.

**Key token conventions:**
- Priority colors: `--priority-high`, `--priority-medium`, `--priority-low`, `--priority-critical` (all HSL, no hsl() wrapper in var)
- To use in Tailwind classes: `bg-[hsl(var(--priority-high))]` pattern
- Tech accent colors: `--tech-blue`, `--tech-green`, `--tech-cyan`, `--tech-purple`, `--tech-orange`, `--tech-red`
- Today highlight: use `border-primary bg-primary/5` (NOT `border-blue-500 bg-blue-50`)
- Selected ring: use `ring-primary` (NOT `ring-blue-500`)
- Muted fallback: `bg-muted-foreground` (NOT `bg-gray-500`)

**Animation:** `animate-fade-in` is defined in `tailwind.config.ts` (0.3s ease-out). Use it on page-level container divs for entrance animation.

**Framework:** React + TypeScript + Tailwind v4 + shadcn/ui, French locale (`date-fns/locale/fr`).

**Status badge pattern (canonical):** All HR status badges use `variant="outline"` with a `className` conditional:
- approved / done / completed / present → `border-transparent bg-[hsl(var(--status-done)/0.15)] text-[hsl(var(--status-done))]`
- rejected / blocked / absent / cancelled → `border-transparent bg-[hsl(var(--status-blocked)/0.15)] text-[hsl(var(--status-blocked))]`
- pending / review / scheduled / late → `border-transparent bg-[hsl(var(--status-review)/0.15)] text-amber-800 dark:text-[hsl(var(--status-review))]` (amber-800 for WCAG AA on white)
- doing / in-progress / partial / active → `border-transparent bg-[hsl(var(--status-doing)/0.15)] text-[hsl(var(--status-doing))]`
- todo / draft / default → `border-transparent bg-[hsl(var(--status-todo)/0.15)] text-[hsl(var(--status-todo))]`

**Warning:** `--status-review` (43 96% 56%) fails WCAG AA as text on white — always use `text-amber-800` as light-mode fallback with `dark:text-[hsl(var(--status-review))]`.

**bg-card vs bg-white/dark:bg-gray-800:** Always use `bg-card` token. Never hardcode `bg-white dark:bg-gray-800`.

**Why:** Hardcoded Tailwind color classes (e.g., `bg-red-500`) bypass the design token system and break dark-mode adaptability. All colors must go through CSS custom properties.

**How to apply:** Always use `bg-[hsl(var(--token-name))]` for semantic color tokens. Never use raw Tailwind palette classes (red-500, blue-50, green-600, gray-500, etc.) for semantic UI states.
