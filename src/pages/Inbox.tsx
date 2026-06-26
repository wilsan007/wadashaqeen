/**
 * Inbox — Boîte de réception avec Supabase Realtime
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Inbox as InboxIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Users,
  Calendar,
  Trash2,
  Archive,
  Bell,
  BellOff,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isToday, isYesterday, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import { NotificationService } from '@/services/notification.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CACHE_TTL } from '@/lib/queryConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'tasks' | 'approvals' | 'mentions' | 'unread';

// ─── Hook: notifications avec Realtime ────────────────────────────────────────

function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const query = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => (userId ? NotificationService.getForUser(userId) : Promise.resolve([])),
    enabled: !!userId,
    ...CACHE_TTL.realtime,
  });

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    channelRef.current = supabase
      .channel(`inbox:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        }
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [userId, queryClient]);

  const markRead = useCallback(
    async (id: string) => {
      await NotificationService.markAsRead(id);
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
    [userId, queryClient]
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await NotificationService.markAllAsRead(userId);
    queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
  }, [userId, queryClient]);

  return { ...query, markRead, markAllRead, userId };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
  try {
    const date = parseISO(dateString);
    if (isToday(date)) return `Aujourd'hui ${format(date, 'HH:mm')}`;
    if (isYesterday(date)) return `Hier ${format(date, 'HH:mm')}`;
    const diff = differenceInDays(new Date(), date);
    if (diff <= 7) return format(date, 'EEEE HH:mm', { locale: fr });
    return format(date, 'dd MMM yyyy', { locale: fr });
  } catch {
    return dateString;
  }
}

function typeIcon(type: string) {
  if (type?.startsWith('task_')) return <CheckCircle2 className="h-5 w-5 text-blue-400" />;
  if (type?.includes('leave') || type?.includes('expense'))
    return <Clock className="h-5 w-5 text-orange-400" />;
  if (type?.includes('mention')) return <User className="h-5 w-5 text-violet-400" />;
  if (type?.includes('invite')) return <Users className="h-5 w-5 text-emerald-400" />;
  return <Bell className="h-5 w-5 text-slate-400" />;
}

function priorityColor(p?: string) {
  if (p === 'urgent' || p === 'high') return 'bg-rose-500';
  if (p === 'medium') return 'bg-amber-500';
  return 'bg-emerald-500';
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────

function StatChip({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="border">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-xl p-2.5 ${color}`} aria-hidden="true">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground" aria-label={`${value} ${label}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Inbox() {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState<FilterType>('all');
  const { data: notifications = [], isLoading, isFetching, markRead, markAllRead } =
    useRealtimeNotifications();

  const filtered = useMemo(() => {
    switch (filter) {
      case 'tasks':
        return notifications.filter(n => n.notification_type?.startsWith('task_'));
      case 'approvals':
        return notifications.filter(
          n => n.notification_type?.includes('leave') || n.notification_type?.includes('expense')
        );
      case 'mentions':
        return notifications.filter(n => n.notification_type?.includes('mention'));
      case 'unread':
        return notifications.filter(n => !n.is_read);
      default:
        return notifications;
    }
  }, [notifications, filter]);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const taskCount = notifications.filter(n => n.notification_type?.startsWith('task_')).length;
  const approvalCount = notifications.filter(
    n => n.notification_type?.includes('leave') || n.notification_type?.includes('expense')
  ).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent' || n.priority === 'high').length;

  return (
    <div className="min-h-full bg-background p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/30"
            aria-hidden="true"
          >
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
                {unreadCount > 0 ? (
                  <span className="font-medium text-[hsl(var(--tech-blue))]">{unreadCount} non lues</span>
                ) : (
                  'Tout est à jour'
                )}
              </p>
              {isFetching && (
                <Zap
                  className="h-3 w-3 animate-pulse text-[hsl(var(--tech-green))]"
                  aria-label="Synchronisation en temps réel"
                />
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Tout marquer lu</span>
            <span className="sr-only sm:hidden">Tout marquer comme lu</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Résumé des notifications">
        <StatChip icon={Bell} label="Non lues" value={unreadCount} color="bg-[hsl(var(--tech-blue))]" />
        <StatChip icon={AlertCircle} label="Urgentes" value={urgentCount} color="bg-[hsl(var(--priority-high))]" />
        <StatChip icon={CheckCircle2} label="Tâches" value={taskCount} color="bg-[hsl(var(--tech-purple))]" />
        <StatChip icon={Clock} label="Approbations" value={approvalCount} color="bg-[hsl(var(--tech-orange))]" />
      </div>

      {/* Realtime badge */}
      <div className="mb-4 flex items-center gap-2">
        <span
          className="flex items-center gap-1.5 rounded-full border border-[hsl(var(--tech-green)/0.3)] bg-[hsl(var(--tech-green)/0.1)] px-3 py-1 text-xs font-medium text-[hsl(var(--tech-green))]"
          role="status"
          aria-label="Synchronisation en temps réel activée"
        >
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--tech-green))] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--tech-green))]" />
          </span>
          Temps réel activé
        </span>
      </div>

      {/* Tabs */}
      <Tabs value={filter} onValueChange={v => setFilter(v as FilterType)}>
        <TabsList className="mb-4 w-full border border-border bg-muted/60 sm:w-auto">
          {[
            { value: 'all', label: 'Toutes', count: notifications.length },
            { value: 'unread', label: 'Non lues', count: unreadCount },
            { value: 'tasks', label: 'Tâches', count: taskCount },
            { value: 'approvals', label: 'Approbations', count: approvalCount },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm"
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold data-[state=active]:bg-primary-foreground data-[state=active]:text-primary"
                  aria-label={`${tab.count} ${tab.label.toLowerCase()}`}
                >
                  {tab.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={filter}>
          {isLoading ? (
            <div className="space-y-3" aria-label="Chargement des notifications" aria-busy="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl bg-muted" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border">
              <CardContent className="flex flex-col items-center justify-center py-16" role="status">
                <div className="mb-4 rounded-full bg-muted p-6">
                  <BellOff className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-lg font-semibold text-foreground">Aucune notification</p>
                <p className="mt-1 text-sm text-muted-foreground">Vous êtes à jour !</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2" role="list" aria-label="Liste des notifications">
              {filtered.map(notif => (
                <Card
                  key={notif.id}
                  role="listitem"
                  className={`group cursor-pointer border transition-all duration-200 hover:shadow-xl ${
                    !notif.is_read
                      ? 'border-[hsl(var(--tech-blue)/0.3)] bg-[hsl(var(--tech-blue)/0.05)] hover:border-[hsl(var(--tech-blue)/0.5)]'
                      : 'border-border bg-card hover:border-border/80'
                  }`}
                  onClick={() => !notif.is_read && markRead(notif.id)}
                  tabIndex={0}
                  aria-label={`Notification${!notif.is_read ? ' non lue' : ''} : ${notif.title}`}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ' ') && !notif.is_read) {
                      e.preventDefault();
                      markRead(notif.id);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Indicateur non-lu (visuel + accessible) */}
                      <div className="mt-1.5 flex w-5 shrink-0 justify-center" aria-hidden="true">
                        {!notif.is_read ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--tech-blue))] shadow-lg shadow-[hsl(var(--tech-blue)/0.5)]" />
                        ) : (
                          <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                        )}
                      </div>

                      {/* Icône type */}
                      <div className="mt-0.5 shrink-0 rounded-xl bg-muted/80 p-2" aria-hidden="true">
                        {typeIcon(notif.notification_type)}
                      </div>

                      {/* Contenu */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-snug ${!notif.is_read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                            {notif.title}
                          </p>
                          <time
                            className="shrink-0 text-xs text-muted-foreground"
                            dateTime={notif.created_at || notif.sent_at || ''}
                          >
                            {formatDate(notif.created_at || notif.sent_at || '')}
                          </time>
                        </div>
                        {notif.message && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notif.message}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {notif.priority && notif.priority !== 'low' && (
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${priorityColor(notif.priority)}`}
                              aria-label={`Priorité : ${notif.priority === 'urgent' ? 'Urgent' : notif.priority === 'high' ? 'Élevé' : 'Moyen'}`}
                            >
                              {/* Emojis masqués aux lecteurs d'écran */}
                              <span aria-hidden="true">
                                {notif.priority === 'urgent' ? '🔴' : notif.priority === 'high' ? '🟠' : '🟡'}
                              </span>{' '}
                              {notif.priority === 'urgent' ? 'Urgent' : notif.priority === 'high' ? 'Élevé' : 'Moyen'}
                            </span>
                          )}
                          {!notif.is_read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[10px] text-[hsl(var(--tech-blue))] hover:bg-[hsl(var(--tech-blue)/0.1)] hover:text-[hsl(var(--tech-blue))]"
                              onClick={e => { e.stopPropagation(); markRead(notif.id); }}
                              aria-label={`Marquer comme lue : ${notif.title}`}
                            >
                              Marquer lu
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
