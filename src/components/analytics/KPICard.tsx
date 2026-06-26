/**
 * KPI Card - Carte de métrique avec tendance
 * Pattern: Linear/Stripe/Notion — premium, token-driven, WCAG AA compliant
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'accent';
  className?: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
  /**
   * Optional progress bar (0–100). Renders a thin bar below the value.
   * Pass undefined to hide the bar entirely.
   */
  progress?: number;
  /**
   * Optional secondary label rendered beneath the title.
   */
  subtitle?: string;
  /**
   * Optional unit override for the 'duration' format.
   * Defaults to 'j' (French). Pass 'd' for English, 'h' to force hours.
   */
  durationUnit?: string;
  /**
   * Optional click handler.
   */
  onClick?: () => void;
}

// ─── Color palette ────────────────────────────────────────────────────────────
// Semantic mapping: border accent | icon gradient | progress fill
// WCAG note: value text stays in text-foreground (adaptive dark/light).
// Only the icon background and progress bar carry chroma.

const colorConfig = {
  primary: {
    border: 'border-l-blue-500',
    iconGradient: 'from-blue-500 to-blue-700',
    progress: 'bg-blue-500',
    shadowHover: 'hover:shadow-blue-500/15',
  },
  success: {
    border: 'border-l-emerald-500',
    iconGradient: 'from-emerald-500 to-teal-600',
    progress: 'bg-emerald-500',
    shadowHover: 'hover:shadow-emerald-500/15',
  },
  warning: {
    border: 'border-l-amber-500',
    iconGradient: 'from-amber-500 to-orange-600',
    progress: 'bg-amber-500',
    shadowHover: 'hover:shadow-amber-500/15',
  },
  destructive: {
    border: 'border-l-rose-500',
    iconGradient: 'from-rose-500 to-red-600',
    progress: 'bg-rose-500',
    shadowHover: 'hover:shadow-rose-500/15',
  },
  accent: {
    border: 'border-l-cyan-500',
    iconGradient: 'from-cyan-500 to-sky-600',
    progress: 'bg-cyan-500',
    shadowHover: 'hover:shadow-cyan-500/15',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────

const formatValue = (
  val: number | string,
  format: KPICardProps['format'],
  durationUnit = 'j'
): string => {
  if (typeof val === 'string') return val;

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
      }).format(val);
    case 'percentage':
      return `${val}%`;
    case 'duration':
      if (val === 0) return `— ${durationUnit}`;
      if (val < 1) {
        // Sub-day: show hours
        const hours = Math.round(val * 24);
        return `${hours}h`;
      }
      return `${val}${durationUnit}`;
    default:
      return val.toLocaleString('fr-FR');
  }
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  className,
  format = 'number',
  progress,
  subtitle,
  durationUnit = 'j',
  onClick,
}) => {
  const palette = colorConfig[color];

  const TrendIcon =
    trend
      ? trend.value === 0
        ? Minus
        : trend.isPositive
          ? TrendingUp
          : TrendingDown
      : null;

  const showTrendBadge = trend && trend.value > 0 && TrendIcon;
  const clampedProgress =
    progress !== undefined ? Math.min(Math.max(Math.round(progress), 0), 100) : undefined;

  return (
    <Card
      onClick={onClick}
      className={cn(
        // Base structure
        'modern-card relative overflow-hidden border-l-4 transition-all duration-200',
        onClick ? 'cursor-pointer' : '',
        // Hover elevation — matches Stripe card micro-animation
        'hover:-translate-y-0.5 hover:shadow-xl',
        palette.border,
        palette.shadowHover,
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left: text content */}
          <div className="min-w-0 flex-1">
            {/* Title */}
            <p className="text-muted-foreground mb-0.5 text-xs font-semibold uppercase tracking-wider">
              {title}
            </p>

            {/* Optional subtitle */}
            {subtitle && (
              <p className="text-muted-foreground mb-2 text-xs">{subtitle}</p>
            )}

            {/* Value row */}
            <div className="mt-1 flex items-baseline gap-2">
              {/* Primary value — text-foreground for WCAG AA compliance on all themes */}
              <p className="text-foreground text-4xl font-black tabular-nums leading-none">
                {formatValue(value, format, durationUnit)}
              </p>

              {/* Trend pill — only shown when trend.value > 0 */}
              {showTrendBadge && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                    trend.isPositive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  )}
                  aria-label={`${trend.isPositive ? 'Hausse' : 'Baisse'} de ${Math.abs(trend.value)}%`}
                >
                  <TrendIcon className="h-3 w-3" aria-hidden="true" />
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>

            {/* Trend label */}
            {trend?.label && (
              <p className="text-muted-foreground mt-1.5 text-xs">{trend.label}</p>
            )}

            {/* Optional progress bar */}
            {clampedProgress !== undefined && (
              <div className="mt-3">
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
                      palette.progress
                    )}
                    style={{ width: `${clampedProgress}%` }}
                  />
                </div>
                <p className="text-muted-foreground mt-1 text-right text-xs tabular-nums">
                  {clampedProgress}%
                </p>
              </div>
            )}
          </div>

          {/* Right: icon container with gradient */}
          <div
            className={cn(
              'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm',
              palette.iconGradient
            )}
            aria-hidden="true"
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
