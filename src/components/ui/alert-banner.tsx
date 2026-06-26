import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ── Severity → visual mapping ─────────────────────────────────────────────────

type Severity = 'info' | 'success' | 'warning' | 'error';

const SEVERITY_ICONS: Record<Severity, React.ReactNode> = {
  info: <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />,
  success: <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />,
  error: <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />,
};

// ── CVA variant definition ────────────────────────────────────────────────────

const alertBannerVariants = cva(
  [
    'relative flex w-full items-start gap-3 rounded-lg border p-4',
    // Entry transition — CSS-only, no external dep
    'transition-all duration-200 ease-out',
    '[&[data-entering]]:animate-in [&[data-entering]]:fade-in-0 [&[data-entering]]:slide-in-from-top-1',
  ],
  {
    variants: {
      severity: {
        info: [
          'border-[hsl(var(--notification-info))]/25',
          'bg-[hsl(var(--notification-info-bg))]',
          'text-[hsl(var(--notification-info-fg))]',
        ],
        success: [
          'border-[hsl(var(--notification-success))]/25',
          'bg-[hsl(var(--notification-success-bg))]',
          'text-[hsl(var(--notification-success-fg))]',
        ],
        warning: [
          'border-[hsl(var(--notification-warning))]/25',
          'bg-[hsl(var(--notification-warning-bg))]',
          'text-[hsl(var(--notification-warning-fg))]',
        ],
        error: [
          'border-[hsl(var(--notification-error))]/25',
          'bg-[hsl(var(--notification-error-bg))]',
          'text-[hsl(var(--notification-error-fg))]',
        ],
      },
    },
    defaultVariants: {
      severity: 'info',
    },
  }
);

// ── Props ─────────────────────────────────────────────────────────────────────

export interface AlertBannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertBannerVariants> {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  /** Override the automatic icon. Pass null to suppress the icon entirely. */
  icon?: React.ReactNode | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const AlertBanner = React.forwardRef<HTMLDivElement, AlertBannerProps>(
  (
    {
      className,
      severity = 'info',
      title,
      description,
      action,
      dismissible = false,
      onDismiss,
      icon,
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = React.useState(true);
    const [exiting, setExiting] = React.useState(false);

    const handleDismiss = React.useCallback(() => {
      setExiting(true);
      // Allow CSS fade-out to play before unmounting
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, 200);
      return () => clearTimeout(timer);
    }, [onDismiss]);

    if (!visible) return null;

    // Resolve icon: explicit null = no icon, undefined = auto
    const resolvedIcon = icon === undefined ? SEVERITY_ICONS[severity as Severity] : icon;

    // ARIA role: error/warning are assertive alerts, info/success are status
    const ariaRole = severity === 'error' || severity === 'warning' ? 'alert' : 'status';
    const ariaLive = severity === 'error' || severity === 'warning' ? 'assertive' : 'polite';

    return (
      <div
        ref={ref}
        role={ariaRole}
        aria-live={ariaLive}
        aria-atomic="true"
        data-severity={severity}
        className={cn(
          alertBannerVariants({ severity }),
          exiting && 'opacity-0 -translate-y-1 pointer-events-none',
          className
        )}
        {...props}
      >
        {resolvedIcon}

        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-semibold leading-tight">{title}</p>
          {description && (
            <p className="text-sm opacity-80 leading-relaxed">{description}</p>
          )}
          {action && (
            <div className="pt-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={action.onClick}
                className="h-7 px-2 text-xs font-medium hover:bg-current/10 text-current"
              >
                {action.label}
              </Button>
            </div>
          )}
        </div>

        {(dismissible || onDismiss) && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fermer"
            className={cn(
              'shrink-0 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40',
              'text-current'
            )}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);
AlertBanner.displayName = 'AlertBanner';
