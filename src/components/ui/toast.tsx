import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, Info, CheckCircle2, AlertTriangle, AlertCircle, Zap } from 'lucide-react';

import { cn } from '@/lib/utils';

// ── Provider & Viewport ──────────────────────────────────────────────────────

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      // Mobile: top-center. Desktop: bottom-right.
      'fixed top-0 left-1/2 z-[100] flex max-h-screen w-full -translate-x-1/2 flex-col-reverse gap-2 p-4',
      'sm:top-auto sm:right-0 sm:bottom-0 sm:left-auto sm:translate-x-0 sm:flex-col sm:gap-2 sm:p-4 md:max-w-[420px]',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

// ── Variant definitions ───────────────────────────────────────────────────────

const toastVariants = cva(
  [
    'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 shadow-lg',
    'transition-all duration-200',
    // Swipe gestures
    'data-[swipe=cancel]:translate-x-0',
    'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
    'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
    // Animations — mobile slides from top, desktop from bottom-right
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-80 data-[state=open]:fade-in-0',
    'data-[state=closed]:slide-out-to-right-full',
    'data-[state=open]:slide-in-from-top-full sm:data-[state=open]:slide-in-from-bottom-full',
  ],
  {
    variants: {
      variant: {
        default:
          'border-border bg-card text-card-foreground',
        destructive:
          'destructive group border-[hsl(var(--notification-error))]/30 bg-[hsl(var(--notification-error-bg))] text-[hsl(var(--notification-error))]',
        info:
          'border-[hsl(var(--notification-info))]/30 bg-[hsl(var(--notification-info-bg))] text-[hsl(var(--notification-info-fg))]',
        success:
          'border-[hsl(var(--notification-success))]/30 bg-[hsl(var(--notification-success-bg))] text-[hsl(var(--notification-success-fg))]',
        warning:
          'border-[hsl(var(--notification-warning))]/30 bg-[hsl(var(--notification-warning-bg))] text-[hsl(var(--notification-warning-fg))]',
        error:
          'border-[hsl(var(--notification-error))]/30 bg-[hsl(var(--notification-error-bg))] text-[hsl(var(--notification-error-fg))]',
        urgent:
          'border-[hsl(var(--notification-urgent))]/40 bg-[hsl(var(--notification-urgent-bg))] text-[hsl(var(--notification-urgent-fg))] ring-1 ring-[hsl(var(--notification-urgent))]/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// ── Auto-icon per variant ─────────────────────────────────────────────────────

type ToastVariantKey = NonNullable<VariantProps<typeof toastVariants>['variant']>;

const VARIANT_ICONS: Record<ToastVariantKey, React.ReactNode> = {
  default: null,
  destructive: <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />,
  info: <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />,
  success: <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />,
  warning: <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />,
  error: <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />,
  urgent: <Zap className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />,
};

// ARIA roles: status for informational, alert for actionable severities
const VARIANT_ARIA_ROLE: Record<ToastVariantKey, 'status' | 'alert'> = {
  default: 'status',
  info: 'status',
  success: 'status',
  warning: 'alert',
  error: 'alert',
  destructive: 'alert',
  urgent: 'alert',
};

// ── Toast root ────────────────────────────────────────────────────────────────

export interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>,
    VariantProps<typeof toastVariants> {
  /** When provided, renders a progress bar counting down to auto-dismiss */
  duration?: number;
  /** When true, the toast will not auto-dismiss */
  persistent?: boolean;
}

const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Root>, ToastProps>(
  ({ className, variant = 'default', duration, persistent, children, ...props }, ref) => {
    const safeVariant: ToastVariantKey = (variant as ToastVariantKey) ?? 'default';
    const ariaRole = VARIANT_ARIA_ROLE[safeVariant];
    const icon = VARIANT_ICONS[safeVariant];
    const showProgress = !persistent && duration && duration > 0;

    return (
      <ToastPrimitives.Root
        ref={ref}
        role={ariaRole}
        aria-live={ariaRole === 'alert' ? 'assertive' : 'polite'}
        aria-atomic="true"
        className={cn(toastVariants({ variant }), 'flex-col', className)}
        {...props}
      >
        <div className="flex w-full items-start gap-3">
          {icon}
          <div className="flex-1 space-y-1 overflow-hidden">{children}</div>
        </div>

        {showProgress && (
          <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-current/10">
            <div
              className="h-full bg-current/30 rounded-full"
              style={{
                animation: `toast-progress ${duration}ms linear forwards`,
              }}
            />
          </div>
        )}
      </ToastPrimitives.Root>
    );
  }
);
Toast.displayName = ToastPrimitives.Root.displayName;

// ── Action ────────────────────────────────────────────────────────────────────

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'ring-offset-background hover:bg-secondary focus:ring-ring',
      'group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30',
      'group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground',
      'group-[.destructive]:focus:ring-destructive',
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent',
      'px-3 text-sm font-medium transition-colors',
      'focus:ring-2 focus:ring-offset-2 focus:outline-none',
      'disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

// ── Close button ──────────────────────────────────────────────────────────────

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute top-2 right-2 rounded-md p-1 opacity-0 transition-opacity',
      'text-current/40 hover:text-current/80',
      'focus:opacity-100 focus:ring-2 focus:outline-none group-hover:opacity-100',
      'group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50',
      'group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
      className
    )}
    toast-close=""
    aria-label="Fermer la notification"
    {...props}
  >
    <X className="h-4 w-4" aria-hidden="true" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

// ── Title & Description ───────────────────────────────────────────────────────

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold leading-tight', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm opacity-80 leading-relaxed', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

// ── Re-exports ────────────────────────────────────────────────────────────────

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
