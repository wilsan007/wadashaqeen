/**
 * Composants de Badges - Système de Design Enterprise
 * Inspiré de Linear, Monday.com, Notion, Asana
 */

import React from 'react';
import { cn } from '@/lib/utils';

// ============================================
// PRIORITY BADGE (Linear/Monday.com style)
// ============================================

type Priority = 'critical' | 'high' | 'medium' | 'low';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  className,
  showIcon = false,
}) => {
  const styles: Record<Priority, string> = {
    critical: 'bg-priority-critical text-white',
    high: 'bg-priority-high text-white',
    medium: 'bg-priority-medium text-white',
    low: 'bg-priority-low text-white',
  };

  const labels: Record<Priority, string> = {
    critical: showIcon ? '🔥 Critical' : 'Critical',
    high: showIcon ? '⚠️ High' : 'High',
    medium: showIcon ? '➡️ Medium' : 'Medium',
    low: showIcon ? '⬇️ Low' : 'Low',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
        styles[priority],
        className
      )}
    >
      {labels[priority]}
    </span>
  );
};

// ============================================
// STATUS BADGE (Monday.com style)
// ============================================

type Status = 'todo' | 'doing' | 'blocked' | 'done' | 'review' | 'backlog';

interface StatusBadgeProps {
  status: Status;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, showIcon = true }) => {
  const styles: Record<Status, string> = {
    todo: 'bg-status-todo text-gray-700 dark:text-gray-200',
    doing: 'bg-status-doing text-white',
    blocked: 'bg-status-blocked text-white',
    done: 'bg-status-done text-white',
    review: 'bg-status-review text-white',
    backlog: 'bg-status-backlog text-gray-600 dark:text-gray-300',
  };

  const labels: Record<Status, string> = {
    todo: showIcon ? '📋 À faire' : 'À faire',
    doing: showIcon ? '⚡ En cours' : 'En cours',
    blocked: showIcon ? '🚫 Bloqué' : 'Bloqué',
    done: showIcon ? '✅ Terminé' : 'Terminé',
    review: showIcon ? '👀 En révision' : 'En révision',
    backlog: showIcon ? '📦 Backlog' : 'Backlog',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-3 py-1 text-sm font-medium',
        styles[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
};

// ============================================
// LABEL/TAG (Notion style)
// ============================================

type BadgeColor = 'blue' | 'purple' | 'pink' | 'green' | 'yellow' | 'orange' | 'red' | 'gray';

interface LabelProps {
  color: BadgeColor;
  children: React.ReactNode;
  className?: string;
  variant?: 'solid' | 'outline' | 'light';
}

export const Label: React.FC<LabelProps> = ({ color, children, className, variant = 'light' }) => {
  const variantStyles: Record<string, Record<BadgeColor, string>> = {
    light: {
      blue: 'bg-badge-blue/10 text-badge-blue border-badge-blue/20',
      purple: 'bg-badge-purple/10 text-badge-purple border-badge-purple/20',
      pink: 'bg-badge-pink/10 text-badge-pink border-badge-pink/20',
      green: 'bg-badge-green/10 text-badge-green border-badge-green/20',
      yellow: 'bg-badge-yellow/10 text-badge-yellow border-badge-yellow/20',
      orange: 'bg-badge-orange/10 text-badge-orange border-badge-orange/20',
      red: 'bg-badge-red/10 text-badge-red border-badge-red/20',
      gray: 'bg-badge-gray/10 text-badge-gray border-badge-gray/20',
    },
    solid: {
      blue: 'bg-badge-blue text-white',
      purple: 'bg-badge-purple text-white',
      pink: 'bg-badge-pink text-white',
      green: 'bg-badge-green text-white',
      yellow: 'bg-badge-yellow text-white',
      orange: 'bg-badge-orange text-white',
      red: 'bg-badge-red text-white',
      gray: 'bg-badge-gray text-white',
    },
    outline: {
      blue: 'border-2 border-badge-blue text-badge-blue bg-transparent',
      purple: 'border-2 border-badge-purple text-badge-purple bg-transparent',
      pink: 'border-2 border-badge-pink text-badge-pink bg-transparent',
      green: 'border-2 border-badge-green text-badge-green bg-transparent',
      yellow: 'border-2 border-badge-yellow text-badge-yellow bg-transparent',
      orange: 'border-2 border-badge-orange text-badge-orange bg-transparent',
      red: 'border-2 border-badge-red text-badge-red bg-transparent',
      gray: 'border-2 border-badge-gray text-badge-gray bg-transparent',
    },
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium',
        variant === 'light' && 'border',
        variantStyles[variant][color],
        className
      )}
    >
      {children}
    </span>
  );
};

// ============================================
// EMPLOYEE BADGE (Avatar + CDI/CDD)
// ============================================

interface EmployeeBadgeProps {
  name: string;
  contractType?: 'CDI' | 'CDD' | 'Temporaire';
  avatarUrl?: string;
  className?: string;
}

export const EmployeeBadge: React.FC<EmployeeBadgeProps> = ({
  name,
  contractType,
  avatarUrl,
  className,
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const contractColors: Record<string, string> = {
    CDI: 'bg-badge-green/10 text-badge-green',
    CDD: 'bg-badge-orange/10 text-badge-orange',
    Temporaire: 'bg-badge-blue/10 text-badge-blue',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Avatar */}
      <div className="from-badge-blue to-badge-purple flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-full w-full rounded-full object-cover" />
        ) : (
          initials
        )}
      </div>

      {/* Name + Contract */}
      <div className="flex flex-col">
        <span className="text-sm font-medium">{name}</span>
        {contractType && (
          <span className={cn('w-fit rounded px-1.5 py-0.5 text-xs', contractColors[contractType])}>
            {contractType}
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================
// METRIC CARD (Dashboard Analytics style)
// ============================================

// Icon gradient palette — mirrors KPICard's colorConfig for visual coherence
const metricCardGradients: Record<BadgeColor, string> = {
  blue: 'from-blue-500 to-indigo-600',
  green: 'from-emerald-500 to-teal-600',
  orange: 'from-orange-500 to-amber-600',
  red: 'from-rose-500 to-red-600',
  purple: 'from-violet-500 to-purple-700',
  yellow: 'from-yellow-500 to-amber-500',
  gray: 'from-slate-400 to-slate-500',
  pink: 'from-pink-500 to-rose-600',
};

const metricCardProgressColors: Record<BadgeColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  orange: 'bg-orange-500',
  red: 'bg-rose-500',
  purple: 'bg-violet-500',
  yellow: 'bg-yellow-500',
  gray: 'bg-slate-400',
  pink: 'bg-pink-500',
};

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: BadgeColor;
  trend?: 'up' | 'down' | 'neutral';
  /**
   * Optional progress bar (0–100).
   */
  progress?: number;
  /**
   * Optional delta pill: e.g. { value: 12, isPositive: true } renders "+12%"
   */
  delta?: { value: number; isPositive: boolean };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  color = 'blue',
  trend,
  progress,
  delta,
  className,
}) => {
  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→',
  };

  const clampedProgress =
    progress !== undefined ? Math.min(Math.max(Math.round(progress), 0), 100) : undefined;

  return (
    <div className={cn('modern-card rounded-lg p-4', className)}>
      <div className="flex items-start gap-3">
        {/* Gradient icon container */}
        {icon && (
          <div
            className={cn(
              'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm',
              metricCardGradients[color]
            )}
            aria-hidden="true"
          >
            <span className="[&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-white">{icon}</span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs">{label}</p>

          {/* Value + delta pill */}
          <div className="mt-0.5 flex items-baseline gap-2">
            <p className="text-3xl font-bold tabular-nums">{value}</p>
            {delta && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold',
                  delta.isPositive
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                )}
                aria-label={`${delta.isPositive ? 'Hausse' : 'Baisse'} de ${delta.value}%`}
              >
                {delta.isPositive ? '+' : '-'}{delta.value}%
              </span>
            )}
          </div>

          {/* Subtitle with trend arrow */}
          {subtitle && (
            <p className="text-muted-foreground mt-1 text-xs">
              {trend && trendIcons[trend]} {subtitle}
            </p>
          )}

          {/* Optional progress bar */}
          {clampedProgress !== undefined && (
            <div className="mt-2">
              <div
                className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
                role="progressbar"
                aria-valuenow={clampedProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progression : ${clampedProgress}%`}
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    metricCardProgressColors[color]
                  )}
                  style={{ width: `${clampedProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// PROGRESS BAR (Linear style)
// ============================================

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: BadgeColor;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'blue',
  showLabel = true,
  size = 'md',
  className,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const colorStyles: Record<BadgeColor, string> = {
    blue: 'bg-status-doing',
    purple: 'bg-badge-purple',
    pink: 'bg-badge-pink',
    green: 'bg-status-done',
    yellow: 'bg-status-review',
    orange: 'bg-badge-orange',
    red: 'bg-status-blocked',
    gray: 'bg-badge-gray',
  };

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="text-muted-foreground mb-1 flex justify-between text-xs">
          <span>Progression</span>
          <span className="font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('bg-muted overflow-hidden rounded-full', sizeStyles[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', colorStyles[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
