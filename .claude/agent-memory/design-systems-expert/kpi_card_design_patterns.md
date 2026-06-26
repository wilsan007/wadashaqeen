---
name: kpi-card-design-patterns
description: KPICard and MetricCard redesign decisions — gradient icons, progress bars, WCAG value color rule, variant palette
metadata:
  type: project
---

## KPICard — Premium redesign (Linear/Stripe/Notion style)

**Variant palette** (`colorConfig` object in KPICard.tsx):
- `primary`     → `border-l-blue-500`    | icon: `from-blue-500 to-blue-700`     | progress: `bg-blue-500`
- `success`     → `border-l-emerald-500` | icon: `from-emerald-500 to-teal-600`  | progress: `bg-emerald-500`
- `warning`     → `border-l-amber-500`   | icon: `from-amber-500 to-orange-600`  | progress: `bg-amber-500`
- `destructive` → `border-l-rose-500`    | icon: `from-rose-500 to-red-600`      | progress: `bg-rose-500`
- `accent`      → `border-l-cyan-500`    | icon: `from-cyan-500 to-sky-600`      | progress: `bg-cyan-500`

**WCAG rule**: Value text must be `text-foreground` (adaptive). Color is only applied to the icon gradient and the progress bar fill — never to the large numeric value. This prevents contrast failures on both dark and light themes.

**Added props** (backward compatible):
- `progress?: number` (0–100) — renders a thin `h-1.5` progress bar with ARIA `role="progressbar"`
- `subtitle?: string` — secondary line beneath the title

**Trend badge rule**: The pill badge is only rendered when `trend.value > 0`. A zero-value trend shows only the label line (no badge clutter).

**Hover animation**: `hover:-translate-y-0.5 hover:shadow-xl` + per-variant shadow color via `hover:shadow-{color}/15`.

## MetricCard — Aligned upgrade

Same gradient icon pattern (`bg-gradient-to-br`) using `metricCardGradients` record.
Added `delta?: { value: number; isPositive: boolean }` for "+12%" pill display.
Added `progress?: number` with `metricCardProgressColors` record.
Icon wrapper uses `[&>svg]:text-white` Tailwind arbitrary selector to color passed React icon nodes.

## RAG section in ProjectDashboardAnalytics

Replaced plain div cards with `border-l-4` + gradient icon containers matching KPICard visual language:
- Red: `border-l-rose-500` + `from-rose-500 to-red-600`
- Amber: `border-l-amber-500` + `from-amber-500 to-orange-600`
- Green: `border-l-emerald-500` + `from-emerald-500 to-teal-600`

**Why:** Maintains visual coherence between RAG status cards and KPI cards across the dashboard.
**How to apply:** Any new status/health indicator card in this app should follow the same border-l-4 + gradient icon pattern from the colorConfig palette.
