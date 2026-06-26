---
name: Notification System Architecture
description: Unified notification system: token hierarchy, component API, hook interface, and migration decisions
type: project
---

## Notification system refactor (2026-05-09)

The project had two competing hooks (`useNotifications` with `read_at` and `useRealtimeNotifications` with `is_read`) and two near-duplicate dialog components (`NotificationCenter`, `NotificationPopup`). These were replaced with a unified system.

### New files created
- `src/hooks/use-toast.ts` — TOAST_LIMIT raised to 5, TOAST_REMOVE_DELAY corrected to 1000ms, auto-dismiss durations per variant, `persistent` flag
- `src/components/ui/toast.tsx` — Extended variants (info/success/warning/error/urgent/destructive), progress bar, automatic ARIA role (status vs alert per severity), automatic icons
- `src/components/ui/toaster.tsx` — Renders stacked toasts, collapsed indicator at >3
- `src/components/ui/alert-banner.tsx` — Inline banner with 4 severities, dismissible, CSS-only entry animation
- `src/hooks/useNotificationSystem.ts` — Unified hook replacing both old hooks, Supabase realtime (INSERT + UPDATE), optimistic updates, 30s dedup window, snooze (in-memory timers), groupByDate(), loadMore() pagination
- `src/components/notifications/NotificationBell.tsx` — Bell with shake keyframe on new urgent, pulse badge, ARIA label
- `src/components/notifications/NotificationPanel.tsx` — Sheet drawer (right, 400px), 3-tab filter (all/unread/urgent), search, date-grouped list, inline snooze menu, keyboard nav (arrows + Escape), skeleton loading, empty states. Also exports `NotificationPanelTrigger` as drop-in for `NotificationButton`.

### Token additions in `src/index.css`
Notification severity tokens: `--notification-{info|success|warning|error|urgent}` (base + -fg + -bg). Light and dark mode.
Keyframes added: `toast-progress`, `bell-shake`, `badge-pulse`.
Utility classes: `animate-bell-shake`, `animate-badge-pulse`.

### Token naming convention used
`--notification-{severity}` (base hue, used for icon/border)
`--notification-{severity}-fg` (darker, for text — WCAG AA validated)
`--notification-{severity}-bg` (very light, for surface)

### DB interface assumption
The hook reads from `notifications` table using existing columns: `notification_type`, `priority`, `read_at`, `dismissed_at`, `action_url`, `metadata`, `created_at`. The `recipient_id` column is used for Realtime filter. `mark_notifications_read` RPC is preserved.

**Why:** The old localStorage-based `unviewedCount` was not multi-tab safe and drifted from actual DB state. Replaced with computed in-memory stats from the fetched items array.

**How to apply:** Use `useNotificationSystem()` for all new notification features. The old `useNotifications` hook is preserved for backward compat but should not be extended.
