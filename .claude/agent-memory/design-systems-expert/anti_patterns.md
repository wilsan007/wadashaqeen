---
name: Design system anti-patterns and corrections
description: Recurring code patterns that violate design system principles, with corrections and locations
type: feedback
---

## Anti-pattern 1: rgb(var(--hsl-token)) — always invalid

**Where found**: `src/styles/sticky-headers.css` lines 20, 43–46, 59

**Why invalid**: Design system variables (`--primary`, `--tech-blue`, etc.) store raw HSL channel triplets
(e.g., "214 100% 50%") without the hsl() wrapper. The `rgb()` function expects `r g b` channels.
Passing HSL channels to rgb() produces completely wrong colors silently.

**Correct pattern**:
- Use: `hsl(var(--primary))` for opaque colors
- Use: `hsl(var(--primary) / 0.3)` for alpha
- Never: `rgb(var(--primary))` or `rgba(var(--primary), 0.3)`

**Status**: Fixed in sticky-headers.css (2026-05-08)

---

## Anti-pattern 2: Hardcoded hex colors in utility CSS (force-purple.css)

**Where found**: `src/styles/force-purple.css` — entire file used #667eea, #764ba2 hardcoded

**Why problematic**:
- Breaks dark mode completely
- Disconnected from the design token system — cannot be updated from one place
- Used !important throughout, making it impossible to override with proper tokens
- The CSS selector strategy (`div[style*='flex-shrink: 0']`) is catastrophically brittle

**Status**: Refactored to use `hsl(var(--primary))` and `hsl(var(--tech-purple))` (2026-05-08)
Long-term: the underlying component should be refactored to not use inline styles for colors.

---

## Anti-pattern 3: Hardcoded rgb() values in dialog-themes.ts

**Where found**: `src/lib/dialog-themes.ts` — all 8 module themes used rgb() for primary/primaryLight/primaryDark

**Example**: `primary: 'rgb(59, 130, 246)'` (blue-500 Tailwind static value)

**Why problematic**:
- These values never respond to dark mode
- They duplicate values already in the design token system as --tech-blue etc.
- If the brand color changes, the file must be updated manually in isolation

**Status**: Fixed — all primary/primaryLight/primaryDark now use `hsl(var(--tech-*))` (2026-05-08)

---

## Anti-pattern 4: 821+ hardcoded color classes across components

**Where found**: 821 occurrences of text-green-600, text-red-600, bg-blue-50, etc. across pages/

**Why problematic**:
- These static Tailwind colors do not adapt to dark mode without explicit dark: variants
- They bypass the semantic token layer (text-success, text-danger, bg-primary/10)
- Makes theme changes require touching hundreds of files

**Status**: Partially addressed (KPICard.tsx fixed). Full remediation is a multi-sprint effort.
**Priority components to fix next**: AcceptInvitation.tsx, CollaboratorSetup.tsx, MyTimesheetsPage.tsx,
MyRemoteWorkPage.tsx, Analytics.tsx

---

## Anti-pattern 5: bg-zinc-900 as bodyBg in dialog-themes

**Where found**: All 8 module themes had `bodyBg: 'bg-white dark:bg-zinc-900'`

**Why problematic**: bg-zinc-900 is a static Tailwind value, not the --card or --background token.
In dark mode this may diverge from the actual card background if tokens change.

**Status**: Fixed — replaced with `bodyBg: 'bg-background'` (2026-05-08)

---

## Anti-pattern 6: @keyframes gradient defined twice

**Where found**: `src/index.css` — `@keyframes gradient` appears at line ~22 (outside @layer) and
again at line ~398 (inside @layer base)

**Impact**: Low — browser deduplication handles it, but it creates confusion.
**Recommended fix**: Keep only the @layer base version, remove the top-level duplicate.
