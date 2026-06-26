/**
 * useNotificationSystem — Unified notification hook
 *
 * Replaces the competing useNotifications + useRealtimeNotifications hooks.
 * Single source of truth for all notification state with:
 * - Realtime Supabase subscription (INSERT + UPDATE only) — kept as useEffect
 * - useQuery for initial fetch (notifications + preferences)
 * - useMutation for markAsRead / dismiss / updatePreference
 * - Optimistic updates for read/dismiss/snooze
 * - In-memory cache (no localStorage for unread counter)
 * - Date grouping: today / yesterday / this-week / earlier
 * - 30-second deduplication window by entity_id + type
 * - Snooze support (temporary hide, not persisted — UX-only)
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { UserContext } from '@/lib/roleBasedFiltering';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';
import {
  isToday,
  isYesterday,
  isThisWeek,
  parseISO,
} from 'date-fns';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ── Domain types ──────────────────────────────────────────────────────────────

export type NotificationType =
  | 'task_assigned'
  | 'task_updated'
  | 'task_deadline_approaching'
  | 'task_comment_added'
  | 'leave_request_submitted'
  | 'leave_request_approved'
  | 'leave_request_rejected'
  | 'expense_report_submitted'
  | 'expense_report_approved'
  | 'expense_report_rejected'
  | 'workload_alert'
  | 'mention'
  | 'system'
  | (string & {});

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error' | 'urgent';
export type NotificationStatus = 'unread' | 'read' | 'dismissed' | 'snoozed';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  status: NotificationStatus;
  /** ISO timestamp — only set when snoozed */
  snoozeUntil?: string;
  /** Deep-link to the related entity */
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  readAt?: string;
}

export interface NotificationPreference {
  id: string;
  notification_type: string;
  enabled: boolean;
  email_enabled: boolean;
  in_app_enabled: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
}

export type PreferenceMap = Map<string, NotificationPreference>;

export interface NotificationState {
  items: NotificationItem[];
  stats: NotificationStats;
  preferences: PreferenceMap;
  isLoading: boolean;
}

export interface GroupedNotifications {
  today: NotificationItem[];
  yesterday: NotificationItem[];
  thisWeek: NotificationItem[];
  earlier: NotificationItem[];
}

// ── DB row shape (matches existing Supabase table) ────────────────────────────

interface DbNotification {
  id: string;
  title: string;
  message: string;
  notification_type?: string;
  type?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  read_at?: string | null;
  viewed_at?: string | null;
  dismissed_at?: string | null;
  action_url?: string | null;
  entity_id?: string | null;
  entity_type?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  sender_id?: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function priorityToSeverity(priority?: string): NotificationSeverity {
  switch (priority) {
    case 'urgent':
      return 'urgent';
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'info';
  }
}

function deriveStatus(row: DbNotification): NotificationStatus {
  if (row.dismissed_at) return 'dismissed';
  if (row.read_at) return 'read';
  return 'unread';
}

function dbRowToItem(row: DbNotification): NotificationItem {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: (row.notification_type ?? row.type ?? 'system') as NotificationType,
    severity: priorityToSeverity(row.priority),
    status: deriveStatus(row),
    actionUrl: row.action_url ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    readAt: row.read_at ?? undefined,
  };
}

// Deduplicate: same entity_id + type within 30s
function isDuplicate(
  incoming: DbNotification,
  existing: NotificationItem[]
): boolean {
  if (!incoming.entity_id) return false;
  const cutoff = Date.now() - 30_000;
  return existing.some(
    item =>
      item.type === (incoming.notification_type ?? incoming.type) &&
      item.metadata?.entity_id === incoming.entity_id &&
      new Date(item.createdAt).getTime() > cutoff
  );
}

function computeStats(items: NotificationItem[]): NotificationStats {
  return {
    total: items.length,
    unread: items.filter(i => i.status === 'unread').length,
    urgent: items.filter(i => i.severity === 'urgent' && i.status === 'unread').length,
  };
}

// ── Fetch functions (used by useQuery) ────────────────────────────────────────

async function fetchNotificationsPage(
  userContext: UserContext | null,
  limit: number,
  pageIndex: number
): Promise<{ items: NotificationItem[]; hasMore: boolean }> {
  if (!userContext) return { items: [], hasMore: false };

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { items: [], hasMore: false };

  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .range(pageIndex * limit, (pageIndex + 1) * limit - 1);

  query = applyRoleFilters(query, userContext, 'notifications');

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as DbNotification[];
  return {
    items: rows.map(dbRowToItem),
    hasMore: rows.length === limit,
  };
}

async function fetchPreferencesData(): Promise<PreferenceMap> {
  const { data, error } = await supabase.from('notification_preferences').select('*');
  if (error) throw error;
  return new Map(
    (data ?? []).map((p: NotificationPreference) => [p.notification_type, p])
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseNotificationSystemOptions {
  /** Maximum items to fetch on initial load */
  limit?: number;
}

interface UseNotificationSystemReturn extends NotificationState {
  markAsRead: (ids: string | string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (ids: string | string[]) => Promise<void>;
  snooze: (id: string, minutes: number) => void;
  unsnooze: (id: string) => void;
  updatePreference: (type: string, enabled: boolean, emailEnabled?: boolean) => Promise<void>;
  groupByDate: () => GroupedNotifications;
  /** Load the next page of older notifications */
  loadMore: () => Promise<void>;
  hasMore: boolean;
  refresh: () => Promise<void>;
}

export function useNotificationSystem(
  options: UseNotificationSystemOptions = {}
): UseNotificationSystemReturn {
  const { limit = 20 } = options;

  const queryClient = useQueryClient();
  const { userContext } = useAuth();

  const [page, setPage] = useState(0);
  // Local overlay for realtime additions and snooze (not covered by useQuery cache)
  const [realtimeItems, setRealtimeItems] = useState<NotificationItem[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const snoozeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const userId = userContext ? (userContext as { userId?: string }).userId : undefined;

  // ── useQuery: initial page fetch ───────────────────────────────────────────

  const notifQuery = useQuery({
    queryKey: ['notification-system', userId, page, limit],
    queryFn: () => fetchNotificationsPage(userContext, limit, page),
    enabled: !!userContext,
    staleTime: 30_000,
  });

  // ── useQuery: preferences ──────────────────────────────────────────────────

  const prefQuery = useQuery({
    queryKey: ['notification-system-preferences', userId],
    queryFn: fetchPreferencesData,
    enabled: !!userContext,
    staleTime: 60_000,
  });

  // ── Merge server items with realtime overlay ───────────────────────────────

  const serverItems = notifQuery.data?.items ?? [];
  const hasMore = notifQuery.data?.hasMore ?? false;

  // Realtime items that are not already in the server list
  const newRealtimeItems = realtimeItems.filter(
    rt => !serverItems.some(s => s.id === rt.id)
  );
  const items = [...newRealtimeItems, ...serverItems];

  const preferences = prefQuery.data ?? new Map<string, NotificationPreference>();
  const isLoading = notifQuery.isLoading || prefQuery.isLoading;

  // ── Derived stats ──────────────────────────────────────────────────────────

  const stats = useMemo(() => computeStats(items), [items]);

  // ── Realtime channel (intentionally kept as useEffect — RULE: no migration) ─

  useEffect(() => {
    if (!userContext) return;

    const bootstrap = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const uid = authData.user.id;

      const channel = supabase
        .channel(`notification-system:${uid}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${uid}`,
          },
          payload => {
            const row = payload.new as DbNotification;
            setRealtimeItems(prev => {
              if (isDuplicate(row, prev)) return prev;
              // Also check server items to avoid duplicating after a refetch
              if (isDuplicate(row, serverItems)) return prev;
              return [dbRowToItem(row), ...prev];
            });
            // Invalidate so the next explicit refetch picks up the new row
            queryClient.invalidateQueries({ queryKey: ['notification-system', userId] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${uid}`,
          },
          payload => {
            const row = payload.new as DbNotification;
            // Update realtime overlay if present
            setRealtimeItems(prev =>
              prev.map(item => (item.id === row.id ? dbRowToItem(row) : item))
            );
            // Invalidate cache so server state stays in sync
            queryClient.invalidateQueries({ queryKey: ['notification-system', userId] });
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    bootstrap();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      snoozeTimers.current.forEach(t => clearTimeout(t));
      snoozeTimers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userContext, userId, queryClient]);

  // ── refresh / loadMore ─────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    setPage(0);
    setRealtimeItems([]);
    await queryClient.invalidateQueries({ queryKey: ['notification-system', userId] });
  }, [queryClient, userId]);

  const loadMore = useCallback(async () => {
    setPage(prev => prev + 1);
  }, []);

  // ── useMutation: markAsRead ────────────────────────────────────────────────

  const markAsReadMutation = useMutation({
    mutationFn: async (idList: string[]) => {
      const { error } = await supabase.rpc('mark_notifications_read', {
        notification_ids: idList,
      });
      if (error) throw error;
    },
    onMutate: async (idList: string[]) => {
      const now = new Date().toISOString();
      // Optimistic update in realtime overlay
      setRealtimeItems(prev =>
        prev.map(item =>
          idList.includes(item.id) && item.status === 'unread'
            ? { ...item, status: 'read' as NotificationStatus, readAt: now }
            : item
        )
      );
      // Optimistic update in query cache
      queryClient.setQueryData<{ items: NotificationItem[]; hasMore: boolean }>(
        ['notification-system', userId, page, limit],
        old => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map(item =>
              idList.includes(item.id) && item.status === 'unread'
                ? { ...item, status: 'read' as NotificationStatus, readAt: now }
                : item
            ),
          };
        }
      );
      return { idList };
    },
    onError: (_err, _idList, context) => {
      console.error('[useNotificationSystem] markAsRead error:', _err);
      // Rollback realtime overlay
      if (context?.idList) {
        setRealtimeItems(prev =>
          prev.map(item =>
            context.idList.includes(item.id)
              ? { ...item, status: 'unread' as NotificationStatus, readAt: undefined }
              : item
          )
        );
      }
      queryClient.invalidateQueries({ queryKey: ['notification-system', userId] });
    },
  });

  const markAsRead = useCallback(
    async (ids: string | string[]) => {
      const idList = Array.isArray(ids) ? ids : [ids];
      await markAsReadMutation.mutateAsync(idList);
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(async () => {
    const unreadIds = items.filter(i => i.status === 'unread').map(i => i.id);
    if (unreadIds.length === 0) return;
    await markAsRead(unreadIds);
  }, [items, markAsRead]);

  // ── useMutation: dismiss ───────────────────────────────────────────────────

  const dismissMutation = useMutation({
    mutationFn: async ({ idList, now }: { idList: string[]; now: string }) => {
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed_at: now } as Record<string, unknown>)
        .in('id', idList);
      if (error) throw error;
    },
    onMutate: async ({ idList }: { idList: string[]; now: string }) => {
      // Optimistic update in realtime overlay
      setRealtimeItems(prev =>
        prev.map(item =>
          idList.includes(item.id)
            ? { ...item, status: 'dismissed' as NotificationStatus }
            : item
        )
      );
      // Optimistic update in query cache
      queryClient.setQueryData<{ items: NotificationItem[]; hasMore: boolean }>(
        ['notification-system', userId, page, limit],
        old => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map(item =>
              idList.includes(item.id)
                ? { ...item, status: 'dismissed' as NotificationStatus }
                : item
            ),
          };
        }
      );
      return { idList };
    },
    onError: (_err, _vars, context) => {
      console.error('[useNotificationSystem] dismiss error:', _err);
      if (context?.idList) {
        setRealtimeItems(prev =>
          prev.map(item =>
            context.idList.includes(item.id)
              ? { ...item, status: 'unread' as NotificationStatus }
              : item
          )
        );
      }
      queryClient.invalidateQueries({ queryKey: ['notification-system', userId] });
    },
  });

  const dismiss = useCallback(
    async (ids: string | string[]) => {
      const idList = Array.isArray(ids) ? ids : [ids];
      const now = new Date().toISOString();
      await dismissMutation.mutateAsync({ idList, now });
    },
    [dismissMutation]
  );

  // ── Snooze (UX-only, no persistence) ──────────────────────────────────────

  const snooze = useCallback((id: string, minutes: number) => {
    const until = new Date(Date.now() + minutes * 60_000).toISOString();

    const applySnooze = (prev: NotificationItem[]): NotificationItem[] =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: 'snoozed' as NotificationStatus, snoozeUntil: until }
          : item
      );

    setRealtimeItems(applySnooze);
    queryClient.setQueryData<{ items: NotificationItem[]; hasMore: boolean }>(
      ['notification-system', userId, page, limit],
      old => (old ? { ...old, items: applySnooze(old.items) } : old)
    );

    const existing = snoozeTimers.current.get(id);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      snoozeTimers.current.delete(id);
      const revert = (prev: NotificationItem[]): NotificationItem[] =>
        prev.map(item =>
          item.id === id
            ? { ...item, status: 'unread' as NotificationStatus, snoozeUntil: undefined }
            : item
        );
      setRealtimeItems(revert);
      queryClient.setQueryData<{ items: NotificationItem[]; hasMore: boolean }>(
        ['notification-system', userId, page, limit],
        old => (old ? { ...old, items: revert(old.items) } : old)
      );
    }, minutes * 60_000);

    snoozeTimers.current.set(id, timer);
  }, [queryClient, userId, page, limit]);

  const unsnooze = useCallback((id: string) => {
    const timer = snoozeTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      snoozeTimers.current.delete(id);
    }
    const revert = (prev: NotificationItem[]): NotificationItem[] =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: 'unread' as NotificationStatus, snoozeUntil: undefined }
          : item
      );
    setRealtimeItems(revert);
    queryClient.setQueryData<{ items: NotificationItem[]; hasMore: boolean }>(
      ['notification-system', userId, page, limit],
      old => (old ? { ...old, items: revert(old.items) } : old)
    );
  }, [queryClient, userId, page, limit]);

  // ── useMutation: updatePreference ─────────────────────────────────────────

  const updatePreferenceMutation = useMutation({
    mutationFn: async ({
      type,
      enabled,
      emailEnabled,
      authUserId,
    }: {
      type: string;
      enabled: boolean;
      emailEnabled?: boolean;
      authUserId: string;
    }) => {
      const { error } = await supabase.from('notification_preferences').upsert({
        user_id: authUserId,
        notification_type: type,
        enabled,
        email_enabled: emailEnabled ?? false,
        in_app_enabled: enabled,
      });
      if (error) throw error;
    },
    onMutate: async ({ type, enabled, emailEnabled }) => {
      queryClient.setQueryData<PreferenceMap>(
        ['notification-system-preferences', userId],
        old => {
          const next = new Map(old ?? []);
          const existing = next.get(type);
          next.set(type, {
            id: existing?.id ?? crypto.randomUUID(),
            notification_type: type,
            enabled,
            email_enabled: emailEnabled ?? existing?.email_enabled ?? false,
            in_app_enabled: enabled,
          });
          return next;
        }
      );
    },
    onError: (err) => {
      console.error('[useNotificationSystem] updatePreference error:', err);
      queryClient.invalidateQueries({ queryKey: ['notification-system-preferences', userId] });
      throw err;
    },
  });

  const updatePreference = useCallback(
    async (type: string, enabled: boolean, emailEnabled?: boolean) => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error('Non authentifié');
      await updatePreferenceMutation.mutateAsync({
        type,
        enabled,
        emailEnabled,
        authUserId: authData.user.id,
      });
    },
    [updatePreferenceMutation]
  );

  // ── Grouping ───────────────────────────────────────────────────────────────

  const groupByDate = useCallback((): GroupedNotifications => {
    const visible = items.filter(i => i.status !== 'dismissed' && i.status !== 'snoozed');
    const result: GroupedNotifications = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: [],
    };

    for (const item of visible) {
      const date = parseISO(item.createdAt);
      if (isToday(date)) {
        result.today.push(item);
      } else if (isYesterday(date)) {
        result.yesterday.push(item);
      } else if (isThisWeek(date, { weekStartsOn: 1 })) {
        result.thisWeek.push(item);
      } else {
        result.earlier.push(item);
      }
    }

    return result;
  }, [items]);

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    items,
    stats,
    preferences,
    isLoading,
    hasMore,
    markAsRead,
    markAllAsRead,
    dismiss,
    snooze,
    unsnooze,
    updatePreference,
    groupByDate,
    loadMore,
    refresh,
  };
}
