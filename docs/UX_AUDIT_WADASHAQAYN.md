# 🔍 Audit UX — Wadashaqayn
> Analyse réalisée le 2026-05-07 | React 18 + TypeScript + Vite + Supabase | 339 fichiers TSX, 141 fichiers TS

---

## Synthèse exécutive

L'application dispose d'une architecture solide (lazy loading, code splitting, cache TanStack Query, PWA, dark mode, realtime) mais présente **des lacunes UX structurelles** qui freinent l'adoption : la navigation manque de repères visuels (breadcrumbs jamais utilisés), 35 pages sur 39 n'ont pas de skeleton loader, la palette de commandes est installée mais non branchée, et le support offline/arabe est quasi inexistant malgré des connexions instables et une population majoritairement arabophone à Djibouti.

---

## 1. Navigation & Orientation

### 1.1 Breadcrumbs absents dans toutes les pages
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🔴 Critique | Faible | Fort |

**Problème :** `src/components/ui/breadcrumb.tsx` existe dans la bibliothèque shadcn mais n'est utilisé dans **aucune page**. L'utilisateur naviguant dans `/hr/absences/details` ne sait jamais où il se trouve.

**Solution :**
```tsx
// src/components/layout/AppLayoutWithSidebar.tsx
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

// Ajouter un hook de génération auto des breadcrumbs
const useBreadcrumbs = () => {
  const location = useLocation();
  const routeMap: Record<string, string> = {
    '/': 'Accueil', '/hr': 'RH', '/projects': 'Projets', ...
  };
  return location.pathname.split('/').filter(Boolean).map(...);
};
```
Intégrer dans `AppLayoutWithSidebar.tsx` dans la zone header, sous le titre de page.

**Contexte africain :** Les utilisateurs djiboutiens souvent peu familiarisés avec les SaaS ont besoin d'un repère constant de position dans l'application.

---

### 1.2 Palette de commandes globale non branchée (cmdk installé mais inutilisé)
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟠 Haute | Moyen | Fort |

**Problème :** `cmdk` est dans `package.json`, `src/components/ui/command.tsx` existe, mais **aucun `CommandDialog` global** n'est déclenché par `Ctrl+K`. La recherche multi-entités (employés, projets, tâches) est impossible en un seul geste.

**Solution :**
```tsx
// src/components/layout/GlobalCommandPalette.tsx
import { CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem } from '@/components/ui/command';
import { useEffect, useState } from 'react';

export function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') setOpen(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  // Brancher sur les hooks useTasksEnterprise, useProjects, etc.
  return <CommandDialog open={open} onOpenChange={setOpen}>...</CommandDialog>;
}
```
Intégrer dans `AppLayoutWithSidebar.tsx`. Ajouter un bouton `⌘K` visible dans le header.

---

### 1.3 Badge de notifications Inbox hardcodé
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🔴 Critique | Faible | Fort |

**Problème :** `src/components/layout/NotionStyleSidebar.tsx` ligne 99 : `badge: 3` — la valeur est **statique**, jamais reliée à `useRealtimeNotifications`.

**Solution :**
```tsx
// NotionStyleSidebar.tsx - remplacer badge: 3 par :
const { unreadCount } = useRealtimeNotifications();
// puis dans l'item Inbox :
badge: unreadCount > 0 ? unreadCount : undefined,
```

---

### 1.4 Pas de transitions entre routes
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟡 Moyenne | Faible | Moyen |

**Problème :** `framer-motion` est installé (v11), utilisé dans `BrandedLoadingScreen` et la landing page, mais **aucune transition de page** dans l'app. Chaque navigation produit un flash blanc brutal.

**Solution :** Ajouter dans `AppLayoutWithSidebar.tsx` :
```tsx
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

---

## 2. Feedback & États

### 2.1 Skeleton loaders absents dans 35 pages sur 39
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🔴 Critique | Moyen | Fort |

**Problème :** Seules 4 pages (`Analytics`, `Calendar`, `Dashboard`, `Inbox`) ont des squelettes. Les pages suivantes s'affichent avec un écran blanc lors du chargement via `lazy()` :
`ApprovalsPage`, `CalendarPage`, `HRPage` (principal), `ProjectPage`, `TaskManagementPage`, `SuperAdminPage`, `MySkillsPage`, etc.

**Solution :** Créer un composant générique réutilisable :
```tsx
// src/components/ui/page-skeleton.tsx
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}
```
L'utiliser comme `fallback` dans chaque `Suspense` dans `App.tsx` à la place du spinner générique.

**Contexte africain :** Les connexions 3G/4G à Djibouti peuvent être lentes (100-500 ms de latence). Un skeleton donne une perception de rapidité même sur réseau lent.

---

### 2.2 États vides incohérents entre les modules
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟠 Haute | Moyen | Moyen |

**Problème :** `EmptyStateWithTemplates` n'existe que pour les tâches. `OperationsEmptyState` pour les opérations. La plupart des vues RH (absences, congés, formations) affichent simplement une liste vide sans guidage.

**Solution :** Créer un composant `<UniversalEmptyState>` avec des props `icon`, `title`, `description`, `cta` et l'utiliser systématiquement dans tous les modules (HR, Analytics, Gantt, Projets).

---

### 2.3 Aucune gestion d'erreur réseau pour les mutations
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟠 Haute | Moyen | Fort |

**Problème :** Les toasts d'erreur existent mais les mutations TanStack Query en échec (ex : soumission de congé sans réseau) ne sont pas gérées avec retry visuel ni mode optimiste visible.

**Solution :** Configurer le `QueryClient` global avec :
```ts
new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => toast.error(`Erreur : ${error.message}. Vérifiez votre connexion.`),
      retry: 2,
    },
  },
});
```
Ajouter un indicateur de statut en ligne/hors ligne dans le header.

---

## 3. Mobile & Responsive

### 3.1 LandscapeWrapper force la rotation plutôt qu'adapter l'UI
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🔴 Critique | Élevé | Fort |

**Problème :** `src/components/layout/LandscapeWrapper.tsx` bloque les vues Gantt, Table et Kanban en mode portrait et demande à l'utilisateur de **tourner son téléphone**. `MobileGanttChart.tsx` existe mais est commenté ligne 11 de `GanttChart.tsx`.

**Solution :**
1. Décommenter `MobileGanttChart` dans `GanttChart.tsx`.
2. Finir le composant `MobileGanttChart` (`src/components/vues/responsive/MobileGanttChart.tsx`) pour afficher une vue liste/timeline simplifiée en portrait.
3. Réserver `LandscapeWrapper` uniquement en dernier recours pour tablettes.

```tsx
// GanttChart.tsx - remplacer le commentaire par :
const { isMobile } = useIsMobileLayout();
if (isMobile && !isLandscape) return <MobileGanttChart tasks={tasks} />;
```

**Contexte africain :** En Afrique, plus de 70 % du trafic web est sur mobile. Bloquer l'accès au Gantt en portrait exclut la majorité des utilisateurs mobiles.

---

### 3.2 Tables de données non adaptées au mobile
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟠 Haute | Moyen | Fort |

**Problème :** Les composants `EmployeeManagement`, `TimesheetManagement`, `AttendanceManagement` utilisent `useMediaQuery` mais les tables ont simplement moins de colonnes — pas de vue "carte" ou "liste" pour mobile.

**Solution :** Pour chaque module HR critique, implémenter un pattern `<Table>` sur desktop / `<CardList>` sur mobile :
```tsx
const isMobile = useIsMobileLayout();
return isMobile ? <EmployeeCardList data={employees} /> : <EmployeeTable data={employees} />;
```

---

### 3.3 Taille des zones tactiles non vérifiée
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟡 Moyenne | Faible | Moyen |

**Problème :** Plusieurs icônes d'action (favoris dans la sidebar, boutons de filtre) sont de taille `h-4 w-4` sans padding suffisant — en dessous du minimum WCAG de 44×44px pour les cibles tactiles.

**Solution :** Appliquer `min-h-[44px] min-w-[44px] flex items-center justify-center` sur tous les éléments interactifs accessibles uniquement via tap.

---

## 4. Performance

### 4.1 Virtualization non utilisée malgré @tanstack/react-virtual installé
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🔴 Critique | Moyen | Fort |

**Problème :** `@tanstack/react-virtual ^3.13.24` est dans `package.json` mais **aucune ligne** `useVirtualizer` n'est présente dans le code source. Les tables `EmployeeManagement`, `TimesheetManagement`, `TaskManagementPage` rendent tous les éléments en DOM.

**Solution :** Pour tout composant pouvant afficher > 50 lignes :
```tsx
// Exemple pour la table des tâches (src/components/tasks/)
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: tasks.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 56,
  overscan: 5,
});
```

**Contexte africain :** Les appareils Android d'entrée de gamme (Tecno, Itel, Samsung A-series) dominent le marché djiboutien. Rendre 500 lignes sans virtualisation peut geler l'interface sur ces appareils.

---

### 4.2 PWA offline trop limité (5 minutes de cache, 50 entrées seulement)
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🔴 Critique | Moyen | Fort |

**Problème :** La stratégie Workbox dans `vite.config.ts` :
- `handler: 'NetworkFirst'` uniquement — toujours un aller-réseau avant le cache
- `maxEntries: 50` et `maxAgeSeconds: 5 * 60` — seulement 5 minutes, 50 requêtes Supabase
- Pas de stratégie `CacheFirst` pour les données semi-statiques (employés, projets, listes de référence)
- Pas de `offline.html` fallback
- Icônes PWA uniquement en SVG — certains OS n'acceptent pas SVG pour l'icône de l'appli

**Solution :**
```ts
// vite.config.ts - workbox section enrichie
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  navigateFallback: '/index.html',
  runtimeCaching: [
    // Données temps-réel : NetworkFirst inchangé
    { urlPattern: /supabase\.co\/rest\/v1\/(notifications|tasks)/, handler: 'NetworkFirst',
      options: { cacheName: 'realtime-cache', expiration: { maxEntries: 100, maxAgeSeconds: 60 } }
    },
    // Données semi-statiques : StaleWhileRevalidate
    { urlPattern: /supabase\.co\/rest\/v1\/(employees|projects|departments|roles)/, 
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'semi-static-cache', expiration: { maxEntries: 200, maxAgeSeconds: 30 * 60 } }
    },
    // Assets statiques (fonts Google) : CacheFirst
    { urlPattern: /fonts\.googleapis\.com/, handler: 'CacheFirst',
      options: { cacheName: 'fonts-cache', expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 } }
    },
  ],
}
```
Créer `public/offline.html` comme fallback de navigation offline.

**Contexte africain :** Les coupures de réseau à Djibouti sont fréquentes (délestages, saturation de bande passante). Un utilisateur doit pouvoir consulter ses congés, ses tâches, son planning même sans connexion.

---

### 4.3 Pas de stratégie stale-while-revalidate pour les listes RH
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟡 Moyenne | Faible | Moyen |

**Problème :** `src/lib/queryConfig.ts` définit de bons TTL mais ne les utilise pas avec `staleWhileRevalidate` — les listes HR (potentiellement 100+ employés) sont rechargées entièrement à chaque visite.

**Solution :** Utiliser `placeholderData: keepPreviousData` de TanStack Query v5 sur toutes les listes paginées pour afficher l'ancienne data pendant le rechargement.

---

## 5. Accessibilité

### 5.1 Couverture ARIA quasi nulle (21 attributs pour 339 fichiers)
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🔴 Critique | Élevé | Fort |

**Problème :** Seulement **21 attributs ARIA** (`aria-label`, `aria-describedby`, etc.) sur 339 fichiers TSX. À peine 2 usages de `role="dialog"` ou `role="alert"`. Les composants Radix UI ont de l'ARIA natif mais les composants custom en sont totalement dépourvus.

**Fichiers les plus impactés :**
- `NotionStyleSidebar.tsx` — liens de navigation sans `aria-current="page"`
- `GanttChart` — aucun rôle sur le canvas SVG de la timeline
- Formulaires HR — labels non liés aux inputs via `htmlFor`/`id`

**Solution minimale immédiate :**
```tsx
// Dans NotionStyleSidebar.tsx
<Link aria-current={isActivePath(item.to) ? 'page' : undefined} ...>

// Dans tous les dialogs custom :
<div role="dialog" aria-labelledby="dialog-title" aria-modal="true">
  <h2 id="dialog-title">...</h2>
```

**Contexte africain :** Les lecteurs d'écran sont rares mais la navigation au clavier est essentielle pour les utilisateurs sur des appareils Bluetooth/dockés dans les bureaux djiboutiens.

---

### 5.2 Aucun raccourci clavier applicatif
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟠 Haute | Faible | Moyen |

**Problème :** Seuls 2 raccourcis existent : `Ctrl+B` (sidebar) dans `ui/sidebar.tsx` et `Ctrl+Shift+P` (monitor dev) dans `PerformanceMonitor.tsx`. Pas de raccourcis pour créer une tâche, approuver une demande, naviguer entre modules.

**Solution :**
```tsx
// src/hooks/useAppShortcuts.ts
export function useAppShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'k': navigate('/search'); break;          // Recherche
          case 'n': openCreateTaskDialog(); break;       // Nouvelle tâche
          case '/': focusSidebar(); break;               // Navigation
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
```
Afficher les raccourcis dans une modale `?` accessible depuis le header.

---

### 5.3 Contraste insuffisant en dark mode (à vérifier)
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟡 Moyenne | Faible | Moyen |

**Problème :** Le `theme_color: '#0f172a'` (slate-900) dans le manifest PWA est très sombre. Les classes `text-muted-foreground` sur fond sombre dans la sidebar peuvent tomber sous le ratio 4.5:1 WCAG AA.

**Solution :** Utiliser l'outil [Who Can Use](https://www.whocanuse.com/) ou Storybook a11y addon pour vérifier chaque couleur de texte. Augmenter le contraste de `text-muted-foreground` d'un palier dans `tailwind.config.ts`.

---

## 6. Onboarding & Aide contextuelle

### 6.1 Onboarding limité aux tâches, absent dans 80 % des modules
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟠 Haute | Moyen | Fort |

**Problème :** `EmptyStateWithTemplates` (`src/components/onboarding/`) n'est utilisé que dans `TaskTableWithOnboarding`. Les modules RH, Projets, Opérations, Analytics n'ont **aucun guidage** pour un nouvel utilisateur.

**Solution :** Créer des templates pour chaque module :
```tsx
// src/data/onboardingTemplates.ts
export const HR_TEMPLATES = [
  { title: 'Configurer les types de congés', steps: [...], cta: 'Ajouter un type de congé' },
  { title: 'Inviter votre équipe', steps: [...], cta: 'Inviter des collaborateurs' },
];
```
Puis utiliser `<EmptyStateWithTemplates templates={HR_TEMPLATES}>` dans `HRDashboardMinimal.tsx`.

---

### 6.2 Pas de tour guidé (aucun Shepherd.js / Joyride)
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟡 Moyenne | Élevé | Moyen |

**Problème :** Aucune librairie de tour guidé (Shepherd.js, react-joyride, intro.js) n'est installée ni référencée. Un nouveau tenant owner ne sait pas par où commencer après `SetupAccount`.

**Solution :** Implémenter un tour Shepherd.js déclenché **une seule fois** après la configuration du compte :
```tsx
// src/hooks/useOnboardingTour.ts
import Shepherd from 'shepherd.js';

export function useOnboardingTour() {
  const { data: profile } = useProfile();
  const [tourCompleted] = useLocalStorage('tour_v1', false);
  
  useEffect(() => {
    if (!tourCompleted && profile?.is_new_tenant) launchTour();
  }, [profile]);
}
```
5 étapes max : tableau de bord → inviter équipe → créer premier projet → première tâche → congés.

---

### 6.3 Pas d'aide contextuelle inline
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟡 Moyenne | Faible | Faible |

**Problème :** Les champs complexes (hiérarchie RH, permissions, configuration des rôles) n'ont pas d'icône `?` avec tooltip explicatif.

**Solution :** Ajouter systématiquement un `<Tooltip>` sur les libellés complexes :
```tsx
<Label>
  Niveau hiérarchique
  <Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 ml-1" /></TooltipTrigger>
    <TooltipContent>Définit qui peut approuver les demandes de ce collaborateur</TooltipContent>
  </Tooltip>
</Label>
```

---

## 7. Personnalisation & Préférences

### 7.1 Préférences utilisateur non persistées (densité, langue active)
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟡 Moyenne | Moyen | Moyen |

**Problème :** La langue (`src/i18n/index.ts`) est bien persistée en `localStorage`, mais d'autres préférences essentielles (densité d'affichage compact/normal, vue par défaut sur la page tâches) ne sont pas sauvegardées.

**Solution :** Créer un store de préférences persisté :
```ts
// src/stores/userPreferencesStore.ts
interface UserPreferences {
  density: 'compact' | 'comfortable' | 'spacious';
  defaultTaskView: 'list' | 'kanban' | 'gantt';
  language: 'fr' | 'en' | 'ar';
  sidebarCollapsed: boolean;
}
```
Persister via `localStorage` avec un hook `useUserPreferences`.

---

### 7.2 Dark mode non synchronisé avec l'heure locale
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟢 Basse | Faible | Faible |

**Problème :** Le `ThemeToggle` est manuel uniquement. Pas de détection `prefers-color-scheme` ni de basculement automatique jour/nuit.

**Solution :** Dans `ThemeToggle.tsx`, ajouter l'option `'system'` dans le setter de thème :
```tsx
// Proposer trois états : light | dark | system
<Button onClick={() => setTheme('system')}>Automatique</Button>
```
`next-themes` supporte déjà nativement `'system'`.

---

## 8. Temps réel & Collaboration

### 8.1 Indicateur de présence utilisateur absent
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟡 Moyenne | Élevé | Moyen |

**Problème :** Supabase Realtime est bien configuré pour les notifications (`useRealtimeNotifications`), mais **aucun indicateur de présence** (qui est en ligne, qui édite quelle tâche) n'est implémenté.

**Solution :** Utiliser Supabase Presence :
```ts
const channel = supabase.channel('room:tasks');
channel.track({ user_id: user.id, page: location.pathname });
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  // Afficher avatars des utilisateurs actifs sur la même page
});
```

---

### 8.2 Notifications realtime limitées à 6 types fixes
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟡 Moyenne | Moyen | Moyen |

**Problème :** `useRealtimeNotifications.ts` gère uniquement : `leave_request`, `leave_approval`, `task_assigned`, `task_completed`, `mention`, `system`. Les événements projet (assignation, commentaire, deadline), dépenses et formations ne génèrent pas de notifications.

**Solution :** Étendre l'union type et les triggers Supabase :
```ts
type: '...' | 'expense_approved' | 'project_update' | 'training_reminder' | 'task_overdue'
```

---

## 9. Mode Hors-ligne

### 9.1 Aucun indicateur visuel de statut réseau
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🔴 Critique | Faible | Fort |

**Problème :** Quand la connexion tombe, l'utilisateur ne reçoit aucun feedback. Les requêtes échouent silencieusement ou affichent des toasts d'erreur génériques sans distinguer "problème réseau" de "erreur serveur".

**Solution :**
```tsx
// src/components/layout/NetworkStatusBanner.tsx
export function NetworkStatusBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    window.addEventListener('online', () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));
  }, []);
  
  if (online) return null;
  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-sm text-center">
      ⚠️ Connexion perdue — les données affichées peuvent ne pas être à jour
    </div>
  );
}
```
Ajouter en haut de `AppLayoutWithSidebar.tsx`.

**Contexte africain :** Essentiel à Djibouti où les coupures réseau sont courantes. L'utilisateur doit savoir qu'il travaille sur des données potentiellement en cache.

---

### 9.2 Mutations en file d'attente offline (optimistic updates manquants)
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟠 Haute | Élevé | Fort |

**Problème :** Quand l'utilisateur crée une tâche ou soumet un congé sans réseau, l'action est perdue. TanStack Query v5 supporte les mutations persistées mais aucune implémentation de `persistQueryClient` ou queue offline n'est présente.

**Solution :**
```ts
// src/lib/offlineQueue.ts
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const persister = createSyncStoragePersister({ storage: window.localStorage });
persistQueryClient({ queryClient, persister, maxAge: 24 * 60 * 60 * 1000 });
```
Combiner avec `useMutation` + `onMutate` pour les updates optimistes sur les tâches et les absences.

---

## 10. Internationalisation

### 10.1 Aucun support arabe (RTL) — manque critique pour le marché djiboutien
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🔴 Critique | Élevé | Fort |

**Problème :** L'i18n supporte uniquement `fr` et `en`. **Aucun fichier `ar.json`**, aucune gestion du `dir="rtl"`. Djibouti est un pays où l'arabe est langue officielle et 60 % de la population est arabophone. De nombreuses entreprises djiboutiennes opèrent en arabe.

**Solution :**
1. Ajouter `src/i18n/ar.json` (commencer par les clés critiques : navigation, actions, labels de formulaires)
2. Modifier `src/i18n/index.ts` :
```ts
export type Locale = 'fr' | 'en' | 'ar';
```
3. Modifier `index.html` :
```html
<html lang="fr" dir="ltr"> → géré dynamiquement via JS
```
4. Gérer le RTL avec Tailwind :
```tsx
// tailwind.config.ts
plugins: [require('tailwindcss-rtl')],
// Usage : rtl:mr-0 rtl:ml-4
```
5. Modifier `AppLayoutWithSidebar.tsx` :
```tsx
useEffect(() => {
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = locale;
}, [locale]);
```

**Contexte africain :** L'absence d'arabe est probablement le frein d'adoption le plus important pour les entreprises djiboutiennes. Même une traduction partielle (navigation + actions principales) multiplierait l'accessibilité du produit.

---

### 10.2 Système i18n custom sous-utilisé (242 t() pour ~3000+ strings)
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟠 Haute | Élevé | Moyen |

**Problème :** `fr.json` ne contient que **5 clés top-level** (`dashboard`, `nav`, `common`, `tasks`, `auth`). Les modules HR, Opérations, Projets, Settings sont entièrement en dur en français. 242 appels `t()` pour 339 fichiers TSX = la majorité des strings ne passe pas par le système i18n.

**Solution :** Migration progressive par module, en priorité les modules les plus utilisés :
```json
// fr.json - étendre avec :
{
  "hr": { "absences": { "title": "Gestion des absences", "submit": "Soumettre" } },
  "projects": { "create": "Créer un projet", "status": { "active": "Actif" } },
  "operations": { ... }
}
```
Utiliser `eslint-plugin-i18n-text` pour détecter les strings hardcodées restantes.

---

### 10.3 Sélecteur de langue absent dans l'interface
| Priorité | Effort | Impact |
|----------|--------|--------|
| 🟠 Haute | Faible | Fort |

**Problème :** `setLocale()` et `getLocale()` sont bien implémentés dans `src/i18n/index.ts`, mais **aucun composant UI** ne permet à l'utilisateur de changer de langue depuis l'application.

**Solution :** Ajouter dans `Settings.tsx` ou dans `UserMenu.tsx` :
```tsx
<Select value={getLocale()} onValueChange={(v) => { setLocale(v as Locale); window.location.reload(); }}>
  <SelectItem value="fr">🇫🇷 Français</SelectItem>
  <SelectItem value="en">🇬🇧 English</SelectItem>
  <SelectItem value="ar">🇸🇦 العربية</SelectItem>
</Select>
```

---

## Récapitulatif priorisé

| # | Recommandation | Priorité | Effort | Impact |
|---|---------------|----------|--------|--------|
| 1 | Badge inbox relié à useRealtimeNotifications | 🔴 Critique | Faible | Fort |
| 2 | Skeleton loaders dans les 35 pages manquantes | 🔴 Critique | Moyen | Fort |
| 3 | NetworkStatusBanner (indicateur offline) | 🔴 Critique | Faible | Fort |
| 4 | Breadcrumbs dans AppLayoutWithSidebar | 🔴 Critique | Faible | Fort |
| 5 | Débloquer MobileGanttChart (commenté) | 🔴 Critique | Moyen | Fort |
| 6 | PWA offline : StaleWhileRevalidate + CacheFirst + offline.html | 🔴 Critique | Moyen | Fort |
| 7 | Support arabe (ar.json + RTL) | 🔴 Critique | Élevé | Fort |
| 8 | Virtualisation des listes (@tanstack/react-virtual déjà installé!) | 🔴 Critique | Moyen | Fort |
| 9 | Couverture ARIA minimale (aria-current, role, htmlFor) | 🔴 Critique | Élevé | Fort |
| 10 | Brancher la Command Palette globale (cmdk déjà installé!) | 🟠 Haute | Moyen | Fort |
| 11 | Raccourcis clavier applicatifs (Ctrl+K, Ctrl+N) | 🟠 Haute | Faible | Moyen |
| 12 | Sélecteur de langue dans l'UI | 🟠 Haute | Faible | Fort |
| 13 | Mutations optimistes + offline queue | 🟠 Haute | Élevé | Fort |
| 14 | États vides cohérents pour tous les modules | 🟠 Haute | Moyen | Moyen |
| 15 | Onboarding templates pour HR et Projets | 🟠 Haute | Moyen | Fort |
| 16 | Transitions de route avec framer-motion (déjà installé!) | 🟡 Moyenne | Faible | Moyen |
| 17 | Tables → vue Carte sur mobile (HR) | 🟠 Haute | Moyen | Fort |
| 18 | Tailles de cibles tactiles ≥ 44px | 🟡 Moyenne | Faible | Moyen |
| 19 | Tour guidé Shepherd.js (first-time tenant) | 🟡 Moyenne | Élevé | Moyen |
| 20 | Aide contextuelle (tooltips HelpCircle) | 🟡 Moyenne | Faible | Faible |
| 21 | Préférences utilisateur persistées (densité, vue défaut) | 🟡 Moyenne | Moyen | Moyen |
| 22 | Indicateur de présence (Supabase Presence) | 🟡 Moyenne | Élevé | Moyen |
| 23 | Étendre les types de notifications realtime | 🟡 Moyenne | Moyen | Moyen |
| 24 | Dark mode automatique (system) | 🟢 Basse | Faible | Faible |
| 25 | Contraste dark mode audit WCAG | 🟡 Moyenne | Faible | Moyen |

---

## 🎯 Quick Wins — À faire cette semaine (effort faible, impact fort)

Ces 5 recommandations peuvent être implémentées en **moins d'une journée** chacune :

1. **Badge inbox dynamique** — relier `badge: 3` à `useRealtimeNotifications().unreadCount` (1h)
2. **NetworkStatusBanner** — 20 lignes de code, impact immédiat sur connexions instables (2h)
3. **PageSkeleton générique + App.tsx fallbacks** — réutiliser dans tous les `Suspense` (3h)
4. **Sélecteur de langue dans UserMenu** — i18n déjà prêt, il manque juste le composant (2h)
5. **Transitions de route framer-motion** — 10 lignes dans AppLayoutWithSidebar (1h)

---

*Rapport généré par analyse statique du code source — 339 fichiers TSX, 141 fichiers TS analysés.*
