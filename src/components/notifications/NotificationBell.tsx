import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NotificationStats } from '@/hooks/useNotificationSystem';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface NotificationBellProps {
  stats: NotificationStats;
  onClick: () => void;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const NotificationBell: React.FC<NotificationBellProps> = ({
  stats,
  onClick,
  className,
}) => {
  const { unread, urgent, total } = stats;
  const prevUnreadRef = useRef(unread);
  const [shaking, setShaking] = useState(false);

  // Trigger shake animation on new urgent notifications
  useEffect(() => {
    if (urgent > 0 && unread > prevUnreadRef.current) {
      setShaking(true);
      const timer = setTimeout(() => setShaking(false), 700);
      return () => clearTimeout(timer);
    }
    prevUnreadRef.current = unread;
  }, [unread, urgent]);

  // Badge display: show unread count, cap at 99+
  const badgeLabel = unread > 99 ? '99+' : unread.toString();

  // Tooltip text
  const tooltipText =
    unread === 0
      ? 'Notifications'
      : unread === 1
        ? '1 notification non lue'
        : `${unread} notifications non lues`;

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('relative h-9 w-9 p-0', className)}
      onClick={onClick}
      aria-label={tooltipText}
      title={tooltipText}
    >
      {/* Bell icon — shakes on new urgent notification */}
      <Bell
        className={cn(
          'h-5 w-5 text-muted-foreground transition-colors',
          unread > 0 && 'text-foreground',
          shaking && 'animate-bell-shake'
        )}
        aria-hidden="true"
      />

      {/* Badge — pulse ring for urgent, static for normal unread */}
      {unread > 0 && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute -top-0.5 -right-0.5',
            'flex h-[18px] min-w-[18px] items-center justify-center',
            'rounded-full px-1',
            'text-[10px] font-bold leading-none text-white',
            'pointer-events-none select-none',
            urgent > 0
              ? 'bg-[hsl(var(--notification-urgent))] animate-badge-pulse'
              : 'bg-[hsl(var(--notification-error))]'
          )}
        >
          {badgeLabel}
        </span>
      )}

      {/* Dot indicator for non-urgent unread (small, no count) when badge would be redundant */}
      {unread === 0 && total > 0 && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-1 right-1',
            'h-2 w-2 rounded-full',
            'bg-[hsl(var(--notification-info))]',
            'pointer-events-none'
          )}
        />
      )}
    </Button>
  );
};
