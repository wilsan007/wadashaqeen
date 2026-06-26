import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';
import { CACHE_TTL } from '@/lib/queryConfig';

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  entity_type?: string;
  entity_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read_at?: string;
  viewed_at?: string; // Nouvelle propriété pour "vu"
  dismissed_at?: string; // Nouvelle propriété pour "fermé"
  created_at: string;
  metadata?: any;
  sender_id?: string;
}

export interface NotificationPreference {
  id: string;
  notification_type: string;
  enabled: boolean;
  email_enabled: boolean;
  in_app_enabled: boolean;
}

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 🔒 Contexte utilisateur pour le filtrage
  const { userContext } = useAuth();

  // Local state for unviewed tracking (localStorage-based, not server state)
  const [lastViewedAt, setLastViewedAt] = useState<string | null>(() =>
    localStorage.getItem('notifications_last_viewed')
  );

  // --- Fetch notifications ---
  const {
    data: notifications = [],
    isLoading: loadingNotifications,
    refetch: refetchNotifications,
  } = useQuery<Notification[]>({
    queryKey: ['notifications', userContext?.userId],
    queryFn: async () => {
      if (!userContext) return [];

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // 🔒 Appliquer le filtrage par rôle
      query = applyRoleFilters(query, userContext, 'notifications');

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!userContext,
    ...CACHE_TTL.realtime,
  });

  // --- Fetch preferences ---
  const { data: preferences = [] } = useQuery<NotificationPreference[]>({
    queryKey: ['notification-preferences', userContext?.userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('notification_preferences').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: !!userContext,
    ...CACHE_TTL.semiStatic,
  });

  // Derived counts
  const unreadCount = notifications.filter(n => !n.read_at).length;
  const unviewedCount = (() => {
    const storedLastViewed = lastViewedAt;
    if (storedLastViewed) {
      const lastViewedDate = new Date(storedLastViewed);
      return notifications.filter(n => new Date(n.created_at) > lastViewedDate && !n.dismissed_at)
        .length;
    }
    return notifications.filter(n => !n.dismissed_at).length;
  })();

  const loading = loadingNotifications;

  // --- Mutation: mark as read ---
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const { error } = await supabase.rpc('mark_notifications_read', {
        notification_ids: notificationIds,
      });
      if (error) throw error;
      return notificationIds;
    },
    onSuccess: (notificationIds) => {
      // Optimistic update in cache
      queryClient.setQueryData<Notification[]>(
        ['notifications', userContext?.userId],
        prev =>
          (prev || []).map(n =>
            notificationIds.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n
          )
      );
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer les notifications comme lues',
        variant: 'destructive',
      });
    },
  });

  const markAsRead = async (notificationIds: string[]) => {
    return markAsReadMutation.mutateAsync(notificationIds);
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  // Marquer les notifications comme vues (lors de l'ouverture du popup)
  const markAsViewed = async () => {
    const now = new Date().toISOString();
    localStorage.setItem('notifications_last_viewed', now);
    setLastViewedAt(now);

    // Mettre à jour en base de données
    try {
      const unviewedIds = notifications
        .filter(n => !lastViewedAt || new Date(n.created_at) > new Date(lastViewedAt))
        .map(n => n.id);

      if (unviewedIds.length > 0) {
        const { error } = await supabase
          .from('notifications')
          .update({ viewed_at: now } as any)
          .in('id', unviewedIds);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error marking notifications as viewed:', error);
    }
  };

  // --- Mutation: mark as dismissed ---
  const markAsDismissedMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed_at: now } as any)
        .in('id', notificationIds);
      if (error) throw error;
      return { notificationIds, now };
    },
    onSuccess: ({ notificationIds, now }) => {
      queryClient.setQueryData<Notification[]>(
        ['notifications', userContext?.userId],
        prev =>
          (prev || []).map(n =>
            notificationIds.includes(n.id) ? { ...n, dismissed_at: now } : n
          )
      );
      localStorage.setItem('notifications_last_viewed', now);
      setLastViewedAt(now);
      toast({
        title: '✅ Notifications fermées',
        description: 'Les notifications ont été marquées comme vues.',
        variant: 'default',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de fermer les notifications',
        variant: 'destructive',
      });
    },
  });

  const markAsDismissed = async (notificationIds: string[]) => {
    return markAsDismissedMutation.mutateAsync(notificationIds);
  };

  // --- Mutation: update preference ---
  const updatePreferenceMutation = useMutation({
    mutationFn: async ({
      notificationType,
      enabled,
      emailEnabled,
    }: {
      notificationType: string;
      enabled: boolean;
      emailEnabled?: boolean;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase.from('notification_preferences').upsert({
        user_id: user.user.id,
        notification_type: notificationType,
        enabled,
        email_enabled: emailEnabled ?? false,
        in_app_enabled: enabled,
      });
      if (error) throw error;
      return { notificationType, enabled, emailEnabled };
    },
    onSuccess: ({ notificationType, enabled, emailEnabled }) => {
      queryClient.setQueryData<NotificationPreference[]>(
        ['notification-preferences', userContext?.userId],
        prev => {
          const existing = (prev || []).find(p => p.notification_type === notificationType);
          if (existing) {
            return (prev || []).map(p =>
              p.notification_type === notificationType
                ? {
                    ...p,
                    enabled,
                    in_app_enabled: enabled,
                    email_enabled: emailEnabled ?? p.email_enabled,
                  }
                : p
            );
          } else {
            return [
              ...(prev || []),
              {
                id: crypto.randomUUID(),
                notification_type: notificationType,
                enabled,
                email_enabled: emailEnabled ?? false,
                in_app_enabled: enabled,
              },
            ];
          }
        }
      );
      toast({
        title: 'Succès',
        description: 'Préférences de notification mises à jour',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les préférences',
        variant: 'destructive',
      });
    },
  });

  const updatePreference = async (
    notificationType: string,
    enabled: boolean,
    emailEnabled?: boolean
  ) => {
    return updatePreferenceMutation.mutateAsync({ notificationType, enabled, emailEnabled });
  };

  const getNotificationsByType = (type: string) => {
    return notifications.filter(n => n.notification_type === type);
  };

  const getUnreadNotifications = () => {
    return notifications.filter(n => !n.read_at);
  };

  // Nouvelles notifications depuis la dernière consultation
  const getUnviewedNotifications = () => {
    if (!lastViewedAt) {
      return notifications.filter(n => !n.dismissed_at);
    }
    const lastViewedDate = new Date(lastViewedAt);
    return notifications.filter(n => new Date(n.created_at) > lastViewedDate && !n.dismissed_at);
  };

  // Notifications non fermées (à afficher dans le popup)
  const getActiveNotifications = () => {
    return notifications.filter(n => !n.dismissed_at);
  };

  const getPriorityNotifications = () => {
    return notifications.filter(n => n.priority === 'urgent' || n.priority === 'high');
  };

  // Real-time subscription — MUST stay as useEffect, do NOT migrate to useQuery
  useEffect(() => {
    let channel: any = null;

    const setupSubscription = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      channel = supabase
        .channel('notifications_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${user.user.id}`,
          },
          payload => {
            const newNotification = payload.new as Notification;

            // Inject into query cache
            queryClient.setQueryData<Notification[]>(
              ['notifications', user.user!.id],
              prev => [newNotification, ...(prev || [])]
            );

            // Show toast for high priority notifications
            if (newNotification.priority === 'urgent' || newNotification.priority === 'high') {
              toast({
                title: newNotification.title,
                description: newNotification.message,
                variant: newNotification.priority === 'urgent' ? 'destructive' : 'default',
              });
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fetchNotifications = async () => {
    await refetchNotifications();
  };

  return {
    notifications,
    preferences,
    loading,
    unreadCount,
    unviewedCount,
    lastViewedAt,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    markAsViewed,
    markAsDismissed,
    updatePreference,
    getNotificationsByType,
    getUnreadNotifications,
    getUnviewedNotifications,
    getActiveNotifications,
    getPriorityNotifications,
  };
};
