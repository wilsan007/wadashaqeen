---
name: WCAG contrast audit results
description: Contrast ratio results for all key color pairings, failures found and fixes applied (2026-05-08)
type: project
---

## Audit date: 2026-05-08

## Passing pairs (no action needed)

| Pair | Ratio | Level |
|------|-------|-------|
| Light: foreground on background | 19.74:1 | AAA |
| Light: muted-foreground on background | 10.84:1 | AAA |
| Light: muted-foreground on muted | 7.52:1 | AAA |
| Light: primary-foreground on primary | 4.45:1 | AA (large text only) — borderline |
| Light: sidebar-foreground on sidebar | 14.50:1 | AAA |
| Dark: all pairs tested | >8:1 | AAA |

## FAILURES found and fixed

### 1. accent / accent-foreground (CRITICAL — fixed)
- **Before**: `--accent: 176 85% 40%` = 2.35:1 on white — FAIL
- **After**: `--accent: 176 85% 28%` = ~4.6:1 on white — PASS AA
- Also updated `--tech-cyan` from 45% to 28% lightness for consistency
- Also updated `--color-accent` in @theme block to match

### 2. warning (DOCUMENTED — not fixable by changing the token)
- `--warning: 43 96% 56%` (yellow) = 1.69:1 on white — FAIL
- Yellow cannot pass AA as text on white backgrounds. WCAG has no exception.
- **Rule**: warning token must ONLY be used as background fill with dark text on top
- For warning text labels: use `text-amber-800` (4.6:1) or `text-amber-900` (6.1:1)
- Updated KPICard.tsx to use `text-amber-800 dark:text-amber-300` for warning variant

### 3. status-todo / status-backlog (FIXED)
- **Before**: status-todo = 220 15% 65% = 2.6:1 on white — FAIL
- **After**: status-todo = 220 15% 42% = ~4.6:1 on white — PASS AA
- **Before**: status-backlog = 220 15% 75% — FAIL
- **After**: status-backlog = 220 15% 48% = ~3.9:1 on white — PASS AA (large text)

### 4. primary on white (WARNING — borderline)
- `--primary: 214 100% 50%` = 4.45:1 on white — PASS AA (large text only, 0.05 below AA small text)
- If primary is used as small body text it technically fails. Acceptable for buttons/headings.
- Recommendation: darken to 214 100% 47% for full AA compliance if needed.

## Not yet audited
- Dark mode status/badge colors on their respective background fills
- All component-specific color combinations in hr/, gantt/, kanban/ directories
