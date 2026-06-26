/**
 * useRealtimeNotifications - Notifications temps réel avec Supabase Realtime
 * Pattern: Linear, Slack, Discord
 *
 * Fonctionnalités:
 * - Fetch initial via useQuery
 * - Écoute des changements en temps réel (supabase.channel → useEffect, non migré)
 * - Notifications pour: congés, tâches, approbations
 * - Badge compteur non-lues
 * - Marquage lu/non-lu via useMutation
 * - Persistence des notifications
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  type:
    | 'leave_request'
    | 'leave_approval'
    | 'task_assigned'
    | 'task_completed'
    | 'mention'
    | 'system';
  title: string;
  message: string;
  action_url?: string;
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

interface UseRealtimeNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

// ── Fetch function used by useQuery ───────────────────────────────────────────

async function fetchNotificationsForTenant(
  tenantId: string
): Promise<Notification[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) {
    throw new Error('Non authentifié');
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', session.session.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data as Notification[]) || [];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useRealtimeNotifications = (): UseRealtimeNotificationsReturn => {
  const { toast } = useToast();
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Realtime overlay: notifications pushed via channel that are not yet in the query cache
  const [realtimeItems, setRealtimeItems] = useState<Notification[]>([]);

  const tenantId = currentTenant?.id;

  // ── useQuery: fetch initial des notifications ──────────────────────────────

  const notifQuery = useQuery({
    queryKey: ['realtime-notifications', tenantId],
    queryFn: () => fetchNotificationsForTenant(tenantId!),
    enabled: !!tenantId,
    staleTime: 30_000,
  });

  // ── Merge server + realtime overlay ───────────────────────────────────────

  const serverNotifications = notifQuery.data ?? [];
  const newRealtimeItems = realtimeItems.filter(
    rt => !serverNotifications.some(s => s.id === rt.id)
  );
  const notifications: Notification[] = [...newRealtimeItems, ...serverNotifications];

  const loading = notifQuery.isLoading;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ── Realtime channel (intentionally kept as useEffect — RULE: no migration) ─

  useEffect(() => {
    if (!tenantId) return;

    const setupRealtime = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const userId = session.session.user.id;

      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          payload => {
            const newNotification = payload.new as Notification;

            // Add to realtime overlay (capped at 50)
            setRealtimeItems(prev => [newNotification, ...prev].slice(0, 50));

            // Invalidate the query cache so a background refetch stays in sync
            queryClient.invalidateQueries({ queryKey: ['realtime-notifications', tenantId] });

            // Afficher un toast
            toast({
              title: newNotification.title,
              description: newNotification.message,
              duration: 5000,
            });

            // Jouer un son (optionnel)
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(newNotification.title, {
                body: newNotification.message,
                icon: '/favicon.ico',
              });
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    setupRealtime();

    // Nettoyage
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [tenantId, queryClient, toast]);

  // ── useMutation: markAsRead ────────────────────────────────────────────────

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id: string) => {
      // Optimistic update in overlay
      setRealtimeItems(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
      // Optimistic update in cache
      queryClient.setQueryData<Notification[]>(
        ['realtime-notifications', tenantId],
        old => (old ? old.map(n => (n.id === id ? { ...n, is_read: true } : n)) : old)
      );
    },
    onError: (err) => {
      console.error('Erreur marquage notification:', err);
      queryClient.invalidateQueries({ queryKey: ['realtime-notifications', tenantId] });
    },
  });

  const markAsRead = async (id: string) => {
    await markAsReadMutation.mutateAsync(id);
  };

  // ── useMutation: markAllAsRead ─────────────────────────────────────────────

  const markAllAsReadMutation = useMutation({
    mutationFn: async ({
      userId,
      tId,
    }: {
      userId: string;
      tId: string;
    }) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('tenant_id', tId)
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
    },
    onMutate: async () => {
      setRealtimeItems(prev => prev.map(n => ({ ...n, is_read: true })));
      queryClient.setQueryData<Notification[]>(
        ['realtime-notifications', tenantId],
        old => (old ? old.map(n => ({ ...n, is_read: true })) : old)
      );
    },
    onError: (err) => {
      console.error('Erreur marquage toutes notifications:', err);
      queryClient.invalidateQueries({ queryKey: ['realtime-notifications', tenantId] });
    },
  });

  const markAllAsRead = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user || !tenantId) return;
    await markAllAsReadMutation.mutateAsync({
      userId: session.session.user.id,
      tId: tenantId,
    });
  };

  // ── useMutation: deleteNotification ───────────────────────────────────────

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id: string) => {
      setRealtimeItems(prev => prev.filter(n => n.id !== id));
      queryClient.setQueryData<Notification[]>(
        ['realtime-notifications', tenantId],
        old => (old ? old.filter(n => n.id !== id) : old)
      );
    },
    onError: (err) => {
      console.error('Erreur suppression notification:', err);
      queryClient.invalidateQueries({ queryKey: ['realtime-notifications', tenantId] });
    },
  });

  const deleteNotification = async (id: string) => {
    await deleteNotificationMutation.mutateAsync(id);
  };

  // ── refresh ────────────────────────────────────────────────────────────────

  const refresh = async () => {
    setRealtimeItems([]);
    await queryClient.invalidateQueries({ queryKey: ['realtime-notifications', tenantId] });
  };

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  };
};
