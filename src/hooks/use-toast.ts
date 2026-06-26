/**
 * use-toast — thin compatibility wrapper around Sonner.
 *
 * All existing callers keep their `toast({ title, description, variant })` API.
 * Sonner handles rendering; <Toaster /> in ui/toaster.tsx provides the Sonner provider.
 */
import { toast as sonnerToast } from 'sonner';
import type React from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastVariant =
  | 'default'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'urgent'
  | 'destructive';

/** Structured action (Sonner-compatible). React elements are silently ignored. */
interface ActionOption {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  /** Override auto-duration (ms). */
  duration?: number;
  /** Prevent auto-dismiss. */
  persistent?: boolean;
  /** Pass { label, onClick } for a button. Legacy React-element actions are ignored. */
  action?: ActionOption | React.ReactElement;
}

// Legacy compat aliases used by error-toast.tsx and older code.
export type ToastProps = ToastOptions & { open?: boolean; onOpenChange?: (open: boolean) => void };
export type ToastActionElement = React.ReactElement;
export type ToasterToast = ToastOptions & { id: string };

// ── Durations per variant ─────────────────────────────────────────────────────

const VARIANT_DURATIONS: Record<ToastVariant, number> = {
  default: 5000,
  info: 4000,
  success: 3000,
  warning: 8000,
  error: 12000,
  urgent: Infinity,
  destructive: 12000,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveAction(action: ActionOption | React.ReactElement | undefined) {
  if (!action || typeof action !== 'object' || !('label' in action)) return undefined;
  return { label: (action as ActionOption).label, onClick: (action as ActionOption).onClick };
}

// ── Public API ────────────────────────────────────────────────────────────────

function toast(options: ToastOptions) {
  const { title = '', description, variant = 'default', duration, persistent, action } = options;

  const resolvedDuration = persistent ? Infinity : (duration ?? VARIANT_DURATIONS[variant]);
  const resolvedAction = resolveAction(action);

  const opts = {
    description: description as string | undefined,
    duration: resolvedDuration,
    ...(resolvedAction ? { action: resolvedAction } : {}),
  };

  const message = String(title ?? '');

  let id: string | number;
  switch (variant) {
    case 'destructive':
    case 'error':
      id = sonnerToast.error(message, opts);
      break;
    case 'success':
      id = sonnerToast.success(message, opts);
      break;
    case 'warning':
      id = sonnerToast.warning(message, opts);
      break;
    case 'info':
      id = sonnerToast.info(message, opts);
      break;
    case 'urgent':
      id = sonnerToast.error(message, { ...opts, important: true });
      break;
    default:
      id = sonnerToast(message, opts);
  }

  const toastId = String(id);
  return {
    id: toastId,
    dismiss: () => sonnerToast.dismiss(toastId),
    update: (updated: Partial<ToastOptions>) => toast({ ...options, ...updated }),
  };
}

function useToast() {
  return {
    toast,
    dismiss: (id?: string) => sonnerToast.dismiss(id),
    toasts: [] as ToasterToast[],
  };
}

// Legacy stub kept so existing test imports of `reducer` don't break.
export const reducer = (state: { toasts: ToasterToast[] }) => state;

export { useToast, toast };
