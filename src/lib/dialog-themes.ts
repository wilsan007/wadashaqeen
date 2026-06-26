/**
 * SYSTEME DE THEMES POUR DIALOGS
 *
 * Thèmes modernes et élégants par module.
 * Inspirés de Linear, Notion, Monday.com, Slack.
 *
 * Toutes les couleurs `primary`, `primaryLight`, `primaryDark` utilisent
 * les tokens CSS définis dans index.css via var(--tech-*) ou var(--badge-*).
 * Cela garantit la cohérence avec le thème clair/sombre et évite les
 * valeurs RGB/hex codées en dur.
 *
 * Usage:
 * import { getDialogTheme } from '@/lib/dialog-themes';
 * const theme = getDialogTheme('tasks');
 */

export type DialogModule =
  | 'tasks' // Tâches
  | 'projects' // Projets
  | 'hr' // Ressources Humaines
  | 'operations' // Opérations
  | 'admin' // Administration
  | 'training' // Formation
  | 'analytics' // Analytics
  | 'settings'; // Paramètres

export interface DialogTheme {
  /**
   * Couleur principale du module — référence une variable CSS du design system.
   * Ex: 'hsl(var(--tech-blue))'. NE PAS utiliser de valeurs rgb() / hex directes.
   */
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Gradients (classes Tailwind)
  gradient: string;
  gradientHover: string;

  // Backgrounds (classes Tailwind)
  headerBg: string;
  bodyBg: string;

  // Borders & Shadows (classes Tailwind)
  border: string;
  shadow: string;

  // Icons & Badges (classes Tailwind)
  iconColor: string;
  badgeBg: string;

  // États (classes Tailwind)
  success: string;
  warning: string;
  error: string;

  // Animations (classes Tailwind)
  transition: string;
}

/**
 * 🎨 Thèmes par Module
 * Pattern: Chaque module a sa propre identité visuelle
 */
export const dialogThemes: Record<DialogModule, DialogTheme> = {
  // TACHES - Bleu/Indigo (Productivité)
  // primary = var(--tech-blue) = hsl(214 100% 50%) light / hsl(214 100% 80%) dark
  tasks: {
    primary: 'hsl(var(--tech-blue))',
    primaryLight: 'hsl(var(--badge-blue))',
    primaryDark: 'hsl(var(--info))',
    gradient: 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600',
    gradientHover: 'hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700',
    headerBg:
      'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50',
    bodyBg: 'bg-background',
    border: 'border-blue-200 dark:border-blue-800',
    shadow: 'shadow-blue-500/20',
    iconColor: 'text-blue-700 dark:text-blue-300',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-danger',
    transition: 'transition-all duration-300 ease-in-out',
  },

  // PROJETS - Violet/Purple (Innovation)
  // primary = var(--tech-purple) = hsl(262 100% 58%) light / hsl(262 100% 80%) dark
  projects: {
    primary: 'hsl(var(--tech-purple))',
    primaryLight: 'hsl(var(--badge-purple))',
    primaryDark: 'hsl(var(--primary))',
    gradient: 'bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-600',
    gradientHover: 'hover:from-purple-600 hover:via-violet-600 hover:to-fuchsia-700',
    headerBg:
      'bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50',
    bodyBg: 'bg-background',
    border: 'border-purple-200 dark:border-purple-800',
    shadow: 'shadow-purple-500/20',
    iconColor: 'text-purple-700 dark:text-purple-300',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/30',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-danger',
    transition: 'transition-all duration-300 ease-in-out',
  },

  // RH - Vert/Emerald (Croissance)
  // primary = var(--tech-green) = hsl(142 76% 36%) light / hsl(142 84% 65%) dark
  hr: {
    primary: 'hsl(var(--tech-green))',
    primaryLight: 'hsl(var(--badge-green))',
    primaryDark: 'hsl(var(--success))',
    gradient: 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600',
    gradientHover: 'hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700',
    headerBg:
      'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50',
    bodyBg: 'bg-background',
    border: 'border-emerald-200 dark:border-emerald-800',
    shadow: 'shadow-emerald-500/20',
    iconColor: 'text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-danger',
    transition: 'transition-all duration-300 ease-in-out',
  },

  // OPERATIONS - Orange/Amber (Action)
  // primary = var(--tech-orange) = hsl(25 95% 50%) light / hsl(25 100% 75%) dark
  operations: {
    primary: 'hsl(var(--tech-orange))',
    primaryLight: 'hsl(var(--badge-orange))',
    primaryDark: 'hsl(var(--warning))',
    gradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500',
    gradientHover: 'hover:from-amber-600 hover:via-orange-600 hover:to-red-600',
    headerBg:
      'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50',
    bodyBg: 'bg-background',
    border: 'border-amber-200 dark:border-amber-800',
    shadow: 'shadow-amber-500/20',
    iconColor: 'text-amber-700 dark:text-amber-300',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-danger',
    transition: 'transition-all duration-300 ease-in-out',
  },

  // ADMIN - Rouge/Rose (Pouvoir)
  // primary = var(--tech-red) = hsl(0 84% 55%) light / hsl(0 84% 75%) dark
  admin: {
    primary: 'hsl(var(--tech-red))',
    primaryLight: 'hsl(var(--badge-red))',
    primaryDark: 'hsl(var(--destructive))',
    gradient: 'bg-gradient-to-br from-red-500 via-rose-500 to-pink-600',
    gradientHover: 'hover:from-red-600 hover:via-rose-600 hover:to-pink-700',
    headerBg: 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50',
    bodyBg: 'bg-background',
    border: 'border-red-200 dark:border-red-800',
    shadow: 'shadow-red-500/20',
    iconColor: 'text-red-700 dark:text-red-300',
    badgeBg: 'bg-red-100 dark:bg-red-900/30',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-danger',
    transition: 'transition-all duration-300 ease-in-out',
  },

  // FORMATION - Cyan/Sky (Apprentissage)
  // primary = var(--tech-cyan) = hsl(176 85% 45%) light / hsl(180 100% 75%) dark
  training: {
    primary: 'hsl(var(--tech-cyan))',
    primaryLight: 'hsl(var(--accent))',
    primaryDark: 'hsl(var(--accent))',
    gradient: 'bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600',
    gradientHover: 'hover:from-cyan-600 hover:via-sky-600 hover:to-blue-700',
    headerBg: 'bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-cyan-950/50 dark:to-sky-950/50',
    bodyBg: 'bg-background',
    border: 'border-cyan-200 dark:border-cyan-800',
    shadow: 'shadow-cyan-500/20',
    iconColor: 'text-cyan-700 dark:text-cyan-300',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-danger',
    transition: 'transition-all duration-300 ease-in-out',
  },

  // ANALYTICS - Slate/Gray (Données)
  // primary = token secondaire neutre — on utilise muted-foreground comme proxy
  analytics: {
    primary: 'hsl(var(--muted-foreground))',
    primaryLight: 'hsl(var(--badge-gray))',
    primaryDark: 'hsl(var(--foreground))',
    gradient: 'bg-gradient-to-br from-slate-500 via-gray-500 to-zinc-600',
    gradientHover: 'hover:from-slate-600 hover:via-gray-600 hover:to-zinc-700',
    headerBg:
      'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50',
    bodyBg: 'bg-background',
    border: 'border-slate-200 dark:border-slate-800',
    shadow: 'shadow-slate-500/20',
    iconColor: 'text-slate-700 dark:text-slate-300',
    badgeBg: 'bg-slate-100 dark:bg-slate-900/30',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-danger',
    transition: 'transition-all duration-300 ease-in-out',
  },

  // SETTINGS - Zinc/Neutral (Neutre)
  // primary = secondary token du design system
  settings: {
    primary: 'hsl(var(--secondary-foreground))',
    primaryLight: 'hsl(var(--muted-foreground))',
    primaryDark: 'hsl(var(--foreground))',
    gradient: 'bg-gradient-to-br from-zinc-500 via-neutral-500 to-stone-600',
    gradientHover: 'hover:from-zinc-600 hover:via-neutral-600 hover:to-stone-700',
    headerBg:
      'bg-gradient-to-r from-zinc-50 to-neutral-50 dark:from-zinc-950/50 dark:to-neutral-950/50',
    bodyBg: 'bg-background',
    border: 'border-zinc-200 dark:border-zinc-800',
    shadow: 'shadow-zinc-500/20',
    iconColor: 'text-zinc-700 dark:text-zinc-300',
    badgeBg: 'bg-zinc-100 dark:bg-zinc-900/30',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-danger',
    transition: 'transition-all duration-300 ease-in-out',
  },
};

/**
 * Récupère le thème pour un module donné
 */
export const getDialogTheme = (module: DialogModule): DialogTheme => {
  return dialogThemes[module];
};

/**
 * Classe utilitaire pour appliquer un thème
 */
export const applyDialogTheme = (module: DialogModule) => {
  const theme = getDialogTheme(module);
  return {
    header: `${theme.headerBg} ${theme.border} border-b`,
    body: theme.bodyBg,
    button: `${theme.gradient} ${theme.gradientHover} text-white ${theme.transition}`,
    icon: theme.iconColor,
    badge: theme.badgeBg,
    shadow: theme.shadow,
  };
};
