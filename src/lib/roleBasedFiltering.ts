/**
 * 🎯 Système de Filtrage Centralisé par Rôle - Option 3 (Hybride)
 *
 * Une seule source de vérité pour tous les filtres basés sur les rôles
 * Pattern: Stripe/Salesforce/Linear
 */

import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

export type RoleName =
  | 'super_admin'
  | 'tenant_admin'
  | 'hr_manager'
  | 'project_manager'
  | 'team_lead'
  | 'employee'
  | 'contractor'
  | 'intern'
  | 'viewer';

export interface UserContext {
  userId: string;
  role: RoleName;
  tenantId: string | null;
  projectIds?: string[];
}

/**
 * 🔒 APPLICATION CENTRALISÉE DES FILTRES PAR RÔLE
 *
 * Cette fonction unique gère TOUS les filtres pour TOUS les rôles
 * Utilisée par TOUS les hooks (tasks, projects, employees, etc.)
 */
export function applyRoleFilters<T>(
  query: any,
  context: UserContext,
  resource:
    | 'tasks'
    | 'projects'
    | 'employees'
    | 'leave_requests'
    | 'skills'
    | 'trainings'
    | 'training_enrollments'
    | 'development_plans'
    | 'expense_reports'
    | 'absence_justifications'
    | 'administrative_requests'
    | 'timesheets'
    | 'remote_work_requests'
    | 'attendances'
    | 'absence_types'
    | 'work_locations'
    | 'employee_skills'
    | 'skill_certifications'
    | 'operational_activities'
    | 'operational_schedules'
    | 'operational_action_templates'
    | 'operational_instances'
    | 'operational_actions'
    | 'alert_types'
    | 'alert_solutions'
    | 'alert_instances'
    | 'alert_instance_recommendations'
    | 'skill_assessments'
    | 'onboarding_processes'
    | 'offboarding_processes'
    | 'onboarding_tasks'
    | 'offboarding_tasks'
    | 'expense_items'
    | 'expense_categories'
    | 'health_safety_incidents'
    | 'payroll_runs'
    | 'payroll_items'
    | 'performance_reviews'
    | 'performance_goals'
    | 'notifications'
): any {
  const { userId, role, tenantId, projectIds = [] } = context;

  // 🔓 SUPER ADMIN : Aucun filtre (voit TOUT, cross-tenant)
  if (role === 'super_admin') {
    return query;
  }

  // ⚠️ Sécurité : Si pas de tenant_id, bloquer
  if (!tenantId) {
    console.warn('⚠️ Pas de tenant_id - Accès bloqué');
    return query.eq('id', '00000000-0000-0000-0000-000000000000'); // Filtre impossible
  }

  // 🏢 FILTRAGE PAR TENANT (tous les rôles sauf super_admin)
  query = query.eq('tenant_id', tenantId);

  // 🎯 FILTRAGE GRANULAIRE PAR RÔLE ET RESSOURCE
  return applyResourceSpecificFilters(query, context, resource);
}

/**
 * Filtres spécifiques selon la ressource et le rôle
 */
function applyResourceSpecificFilters(
  query: any,
  context: UserContext,
  resource:
    | 'tasks'
    | 'projects'
    | 'employees'
    | 'leave_requests'
    | 'skills'
    | 'trainings'
    | 'training_enrollments'
    | 'development_plans'
    | 'expense_reports'
    | 'absence_justifications'
    | 'administrative_requests'
    | 'timesheets'
    | 'remote_work_requests'
    | 'attendances'
    | 'absence_types'
    | 'work_locations'
    | 'employee_skills'
    | 'skill_certifications'
    | 'operational_activities'
    | 'operational_schedules'
    | 'operational_action_templates'
    | 'operational_instances'
    | 'operational_actions'
    | 'alert_types'
    | 'alert_solutions'
    | 'alert_instances'
    | 'alert_instance_recommendations'
    | 'skill_assessments'
    | 'onboarding_processes'
    | 'offboarding_processes'
    | 'onboarding_tasks'
    | 'offboarding_tasks'
    | 'expense_items'
    | 'expense_categories'
    | 'health_safety_incidents'
    | 'payroll_runs'
    | 'payroll_items'
    | 'performance_reviews'
    | 'performance_goals'
    | 'notifications'
): any {
  const { userId, role, projectIds = [] } = context;

  // === TÂCHES ===
  if (resource === 'tasks') {
    const taskFilters: Record<RoleName, () => any> = {
      super_admin: () => query,
      tenant_admin: () => query,
      hr_manager: () => query,

      project_manager: () => {
        // Tâches des projets qu'il gère OU assignées à lui
        if (projectIds.length > 0) {
          return query.or(`assignee_id.eq.${userId},project_id.in.(${projectIds.join(',')})`);
        }
        return query.eq('assignee_id', userId);
      },

      team_lead: () => {
        // Tâches des projets assignés
        if (projectIds.length > 0) {
          return query.in('project_id', projectIds);
        }
        return query.eq('assignee_id', userId);
      },

      employee: () => query.eq('assignee_id', userId),
      contractor: () => query.eq('assignee_id', userId),
      intern: () => query.eq('assignee_id', userId),
      viewer: () => query.eq('assignee_id', userId),
    };

    return taskFilters[role]?.() || query.eq('assignee_id', userId);
  }

  // === PROJETS ===
  if (resource === 'projects') {
    const projectFilters: Record<RoleName, () => any> = {
      super_admin: () => query,
      tenant_admin: () => query,
      hr_manager: () => query,
      project_manager: () => query, // Voit tous les projets du tenant

      team_lead: () => {
        // Uniquement projets assignés
        if (projectIds.length > 0) {
          return query.in('id', projectIds);
        }
        return query.eq('id', '00000000-0000-0000-0000-000000000000'); // Aucun
      },

      employee: () => {
        // Uniquement projets dont il est membre
        if (projectIds.length > 0) {
          return query.in('id', projectIds);
        }
        return query.eq('id', '00000000-0000-0000-0000-000000000000');
      },

      contractor: () => {
        if (projectIds.length > 0) {
          return query.in('id', projectIds);
        }
        return query.eq('id', '00000000-0000-0000-0000-000000000000');
      },

      intern: () => {
        if (projectIds.length > 0) {
          return query.in('id', projectIds);
        }
        return query.eq('id', '00000000-0000-0000-0000-000000000000');
      },

      viewer: () => {
        if (projectIds.length > 0) {
          return query.in('id', projectIds);
        }
        return query.eq('id', '00000000-0000-0000-0000-000000000000');
      },
    };

    return projectFilters[role]?.() || query;
  }

  // === EMPLOYÉS / RH ===
  if (resource === 'employees' || resource === 'leave_requests') {
    const hrFilters: Record<RoleName, () => any> = {
      super_admin: () => query,
      tenant_admin: () => query,
      hr_manager: () => query,

      // Project Manager : Voit tous les employés du tenant (pour filtres/assignations)
      project_manager: () => {
        if (resource === 'leave_requests') {
          return query.eq('employee_id', userId); // Ses propres congés seulement
        }
        // Pour employees : Voit tous les employés du tenant (déjà filtré par tenant_id)
        return query;
      },

      // Team Lead : Voit tous les employés du tenant (pour filtres/assignations)
      team_lead: () => {
        if (resource === 'leave_requests') {
          return query.eq('employee_id', userId); // Ses propres congés seulement
        }
        // Pour employees : Voit tous les employés du tenant (déjà filtré par tenant_id)
        return query;
      },

      // Employee : Voit tous les employés du tenant (pour filtres)
      employee: () => {
        if (resource === 'leave_requests') {
          return query.eq('employee_id', userId); // Ses propres congés seulement
        }
        // Pour employees : Voit tous les employés du tenant (pour filtres de sélection)
        return query;
      },

      contractor: () => {
        if (resource === 'leave_requests') {
          return query.eq('employee_id', userId);
        }
        return query; // Voit tous les employés (pour filtres)
      },

      intern: () => {
        if (resource === 'leave_requests') {
          return query.eq('employee_id', userId);
        }
        return query; // Voit tous les employés (pour filtres)
      },

      viewer: () => {
        if (resource === 'leave_requests') {
          return query.eq('employee_id', userId);
        }
        return query; // Voit tous les employés (pour filtres)
      },
    };

    return hrFilters[role]?.() || query;
  }

  // === COMPÉTENCES (SKILLS) ===
  if (resource === 'skills') {
    // Tous les rôles peuvent voir les compétences du tenant (lecture seule pour la plupart)
    // HR/Tenant Admin peuvent les gérer
    return query; // Déjà filtré par tenant_id en amont
  }

  // === FORMATIONS (TRAININGS) ===
  if (resource === 'trainings') {
    // Catalogue accessible à tous les employés du tenant
    return query; // Déjà filtré par tenant_id
  }

  // === INSCRIPTIONS FORMATIONS (TRAINING_ENROLLMENTS) ===
  if (resource === 'training_enrollments') {
    const enrollmentFilters: Record<RoleName, () => any> = {
      super_admin: () => query,
      tenant_admin: () => query,
      hr_manager: () => query,

      // Managers peuvent voir inscriptions de leur équipe
      project_manager: () =>
        query.or(
          `employee_id.eq.${userId},employee_id.in.(SELECT id FROM employees WHERE manager_id='${userId}')`
        ),
      team_lead: () =>
        query.or(
          `employee_id.eq.${userId},employee_id.in.(SELECT id FROM employees WHERE manager_id='${userId}')`
        ),

      // Employés voient uniquement leurs inscriptions
      employee: () => query.eq('employee_id', userId),
      contractor: () => query.eq('employee_id', userId),
      intern: () => query.eq('employee_id', userId),
      viewer: () => query.eq('employee_id', userId),
    };

    return enrollmentFilters[role]?.() || query.eq('employee_id', userId);
  }

  // === PLANS DE DÉVELOPPEMENT (DEVELOPMENT_PLANS) ===
  if (resource === 'development_plans') {
    const planFilters: Record<RoleName, () => any> = {
      super_admin: () => query,
      tenant_admin: () => query,
      hr_manager: () => query,

      // Managers peuvent voir plans de leur équipe + ceux qu'ils ont créés
      project_manager: () => query.or(`employee_id.eq.${userId},created_by.eq.${userId}`),
      team_lead: () => query.or(`employee_id.eq.${userId},created_by.eq.${userId}`),

      // Employés voient uniquement leur plan
      employee: () => query.eq('employee_id', userId),
      contractor: () => query.eq('employee_id', userId),
      intern: () => query.eq('employee_id', userId),
      viewer: () => query.eq('employee_id', userId),
    };

    return planFilters[role]?.() || query.eq('employee_id', userId);
  }

  // === NOTES DE FRAIS (EXPENSE_REPORTS) ===
  if (resource === 'expense_reports') {
    const expenseFilters: Record<RoleName, () => any> = {
      super_admin: () => query,
      tenant_admin: () => query,
      hr_manager: () => query,

      // Managers peuvent voir/approuver frais de leur équipe
      project_manager: () =>
        query.or(
          `employee_id.eq.${userId},employee_id.in.(SELECT id FROM employees WHERE manager_id='${userId}')`
        ),
      team_lead: () =>
        query.or(
          `employee_id.eq.${userId},employee_id.in.(SELECT id FROM employees WHERE manager_id='${userId}')`
        ),

      // Employés voient uniquement leurs frais
      employee: () => query.eq('employee_id', userId),
      contractor: () => query.eq('employee_id', userId),
      intern: () => query.eq('employee_id', userId),
      viewer: () => query.eq('employee_id', userId),
    };

    return expenseFilters[role]?.() || query.eq('employee_id', userId);
  }

  // === JUSTIFICATIFS D'ABSENCE (ABSENCE_JUSTIFICATIONS) ===
  if (resource === 'absence_justifications') {
    const justificationFilters: Record<RoleName, () => any> = {
      super_admin: () => query,
      tenant_admin: () => query,
      hr_manager: () => query,

      // Managers peuvent voir justificatifs de leur équipe
      project_manager: () =>
        query.or(
          `employee_id.eq.${userId},employee_id.in.(SELECT id FROM employees WHERE manager_id='${userId}')`
        ),
      team_lead: () =>
        query.or(
          `employee_id.eq.${userId},employee_id.in.(SELECT id FROM employees WHERE manager_id='${userId}')`
        ),

      // Employés voient uniquement leurs justificatifs
      employee: () => query.eq('employee_id', userId),
      contractor: () => query.eq('employee_id', userId),
      intern: () => query.eq('employee_id', userId),
      viewer: () => query.eq('employee_id', userId),
    };

    return justificationFilters[role]?.() || query.eq('employee_id', userId);
  }

  // === DEMANDES ADMINISTRATIVES (ADMINISTRATIVE_REQUESTS) ===
  if (resource === 'administrative_requests') {
    const adminRequestFilters: Record<RoleName, () => any> = {
      super_admin: () => query,
      tenant_admin: () => query,
      hr_manager: () => query, // HR traite toutes les demandes

      // Autres rôles voient uniquement leurs demandes
      project_manager: () => query.eq('employee_id', userId),
      team_lead: () => query.eq('employee_id', userId),
      employee: () => query.eq('employee_id', userId),
      contractor: () => query.eq('employee_id', userId),
      intern: () => query.eq('employee_id', userId),
      viewer: () => query.eq('employee_id', userId),
    };

    return adminRequestFilters[role]?.() || query.eq('employee_id', userId);
  }

  // === FEUILLES DE TEMPS (TIMESHEETS) ===
  if (resource === 'timesheets') {
    const timesheetFilters: Record<RoleName, () => any> = {
      super_admin: () => query,
      tenant_admin: () => query,
      hr_manager: () => query,

      // Managers peuvent voir/approuver timesheets de leur équipe
      project_manager: () =>
        query.or(
          `employee_id.eq.${userId},employee_id.in.(SELECT id FROM employees WHERE manager_id='${userId}')`
        ),
      team_lead: () =>
        query.or(
          `employee_id.eq.${userId},employee_id.in.(SELECT id FROM employees WHERE manager_id='${userId}')`
        ),

      // Employés voient uniquement leurs timesheets
      employee: () => query.eq('employee_id', userId),
      contractor: () => query.eq('employee_id', userId),
      intern: () => query.eq('employee_id', userId),
      viewer: () => query.eq('employee_id', userId),
    };

    return timesheetFilters[role]?.() || query.eq('employee_id', userId);
  }

  // === DEMANDES TÉLÉTRAVAIL (REMOTE_WORK_REQUESTS) ===
  if (resource === 'remote_work_requests') {
    const remoteWorkFilters: Record<RoleName, () => any> = {
      super_admin: () => query,
      tenant_admin: () => query,
      hr_manager: () => query,

      // Managers peuvent voir/approuver demandes de leur équipe
      project_manager: () =>
        query.or(
          `employee_id.eq.${userId},employee_id.in.(SELECT id FROM employees WHERE manager_id='${userId}')`
        ),
      team_lead: () =>
        query.or(
          `employee_id.eq.${userId},employee_id.in.(SELECT id FROM employees WHERE manager_id='${userId}')`
        ),

      // Employés voient uniquement leurs demandes
      employee: () => query.eq('employee_id', userId),
      contractor: () => query.eq('employee_id', userId),
      intern: () => query.eq('employee_id', userId),
      viewer: () => query.eq('employee_id', userId),
    };

    return remoteWorkFilters[role]?.() || query.eq('employee_id', userId);
  }

  // === PRÉSENCES (ATTENDANCES) ===
  if (resource === 'attendances') {
    // Admins et HR Manager voient tout
    if (['tenant_admin', 'hr_manager'].includes(role)) {
      return query;
    }
    // Autres: uniquement leurs présences
    return query.eq('employee_id', userId);
  }

  // === TYPES D'ABSENCE (ABSENCE_TYPES) ===
  if (resource === 'absence_types') {
    // Tous peuvent voir les types d'absence (données de référence)
    return query;
  }

  // === LIEUX DE TRAVAIL (WORK_LOCATIONS) ===
  if (resource === 'work_locations') {
    // Tous peuvent voir les lieux de travail (données de référence)
    return query;
  }

  // === COMPÉTENCES EMPLOYÉS (EMPLOYEE_SKILLS) ===
  if (resource === 'employee_skills') {
    // Admins et HR Manager voient tout
    if (['tenant_admin', 'hr_manager'].includes(role)) {
      return query;
    }
    // Autres: uniquement leurs compétences
    return query.eq('employee_id', userId);
  }

  // === CERTIFICATIONS COMPÉTENCES (SKILL_CERTIFICATIONS) ===
  if (resource === 'skill_certifications') {
    // Admins et HR Manager voient tout
    if (['tenant_admin', 'hr_manager'].includes(role)) {
      return query;
    }
    // Autres: uniquement leurs certifications
    return query.eq('employee_id', userId);
  }

  // === ACTIVITÉS OPÉRATIONNELLES (OPERATIONAL_ACTIVITIES) ===
  if (resource === 'operational_activities') {
    // Admins et managers voient tout
    if (['tenant_admin', 'hr_manager', 'project_manager', 'team_lead'].includes(role)) {
      return query;
    }
    // Employés voient uniquement celles dont ils sont owner
    return query.eq('owner_id', userId);
  }

  // === PLANNINGS OPÉRATIONNELS (OPERATIONAL_SCHEDULES) ===
  if (resource === 'operational_schedules') {
    // Admins et managers voient tout
    if (['tenant_admin', 'hr_manager', 'project_manager', 'team_lead'].includes(role)) {
      return query;
    }
    // Employés: filtrage via activity_id (nécessite join)
    return query;
  }

  // === TEMPLATES ACTIONS OPÉRATIONNELLES (OPERATIONAL_ACTION_TEMPLATES) ===
  if (resource === 'operational_action_templates') {
    // Admins et managers voient tout
    if (['tenant_admin', 'hr_manager', 'project_manager', 'team_lead'].includes(role)) {
      return query;
    }
    // Employés: tous peuvent voir les templates
    return query;
  }

  // === INSTANCES OPÉRATIONNELLES (OPERATIONAL_INSTANCES) ===
  if (resource === 'operational_instances') {
    // Admins et managers voient tout
    if (['tenant_admin', 'hr_manager', 'project_manager', 'team_lead'].includes(role)) {
      return query;
    }
    // Employés voient uniquement celles assignées à eux
    return query.eq('assigned_to_id', userId);
  }

  // === ACTIONS OPÉRATIONNELLES (OPERATIONAL_ACTIONS) ===
  if (resource === 'operational_actions') {
    // Admins et managers voient tout
    if (['tenant_admin', 'hr_manager', 'project_manager', 'team_lead'].includes(role)) {
      return query;
    }
    // Employés voient uniquement leurs actions
    return query.eq('assigned_to_id', userId);
  }

  // === TYPES D'ALERTES (ALERT_TYPES) ===
  if (resource === 'alert_types') {
    // Tous peuvent voir les types d'alertes (données de référence)
    return query;
  }

  // === SOLUTIONS D'ALERTES (ALERT_SOLUTIONS) ===
  if (resource === 'alert_solutions') {
    // Tous peuvent voir les solutions (données de référence)
    return query;
  }

  // === INSTANCES D'ALERTES (ALERT_INSTANCES) ===
  if (resource === 'alert_instances') {
    // Admins et HR Manager voient tout
    if (['tenant_admin', 'hr_manager'].includes(role)) {
      return query;
    }
    // Managers voient les alertes de leur scope
    if (['project_manager', 'team_lead'].includes(role)) {
      return query.or(
        `resolved_by.eq.${userId},entity_id.in.(SELECT id FROM employees WHERE manager_id='${userId}')`
      );
    }
    // Employés voient uniquement celles qui les concernent
    return query.eq('entity_id', userId);
  }

  // === RECOMMANDATIONS D'ALERTES (ALERT_INSTANCE_RECOMMENDATIONS) ===
  if (resource === 'alert_instance_recommendations') {
    // Tous peuvent voir (liées aux instances déjà filtrées)
    return query;
  }

  // === ÉVALUATIONS COMPÉTENCES (SKILL_ASSESSMENTS) ===
  if (resource === 'skill_assessments') {
    // Admins et HR Manager voient tout
    if (['tenant_admin', 'hr_manager'].includes(role)) {
      return query;
    }
    // Managers voient leurs équipes
    if (['project_manager', 'team_lead'].includes(role)) {
      return query.or(
        `employee_id.eq.${userId},employee_id.in.(SELECT id FROM employees WHERE manager_id='${userId}')`
      );
    }
    // Employés voient uniquement les leurs
    return query.eq('employee_id', userId);
  }

  // === PROCESSUS ONBOARDING (ONBOARDING_PROCESSES) ===
  if (resource === 'onboarding_processes') {
    // Admins et HR Manager voient tout
    if (['tenant_admin', 'hr_manager'].includes(role)) {
      return query;
    }
    // Managers voient leurs nouvelles recrues
    if (['project_manager', 'team_lead'].includes(role)) {
      return query.or(
        `employee_id.eq.${userId},employee_id.in.(SELECT id FROM employees WHERE manager_id='${userId}')`
      );
    }
    // Employés voient uniquement leur propre onboarding
    return query.eq('employee_id', userId);
  }

  // === PROCESSUS OFFBOARDING (OFFBOARDING_PROCESSES) ===
  if (resource === 'offboarding_processes') {
    // Admins et HR Manager voient tout
    if (['tenant_admin', 'hr_manager'].includes(role)) {
      return query;
    }
    // Managers voient leurs départs
    if (['project_manager', 'team_lead'].includes(role)) {
      return query.or(
        `employee_id.eq.${userId},employee_id.in.(SELECT id FROM employees WHERE manager_id='${userId}')`
      );
    }
    // Employés voient uniquement leur propre offboarding
    return query.eq('employee_id', userId);
  }

  // === TÂCHES ONBOARDING (ONBOARDING_TASKS) ===
  if (resource === 'onboarding_tasks') {
    // Admins et HR Manager voient tout
    if (['tenant_admin', 'hr_manager'].includes(role)) {
      return query;
    }
    // Autres: via le process_id (nécessite join avec onboarding_processes)
    return query;
  }

  // === TÂCHES OFFBOARDING (OFFBOARDING_TASKS) ===
  if (resource === 'offboarding_tasks') {
    // Admins et HR Manager voient tout
    if (['tenant_admin', 'hr_manager'].includes(role)) {
      return query;
    }
    // Autres: via le process_id (nécessite join avec offboarding_processes)
    return query;
  }

  // === ITEMS NOTES DE FRAIS (EXPENSE_ITEMS) ===
  if (resource === 'expense_items') {
    // Admins et HR Manager voient tout
    if (['tenant_admin', 'hr_manager'].includes(role)) {
      return query;
    }
    // Managers peuvent voir/approuver items de leur équipe
    if (['project_manager', 'team_lead'].includes(role)) {
      return query.or(
        `employee_id.eq.${userId},employee_id.in.(SELECT id FROM employees WHERE manager_id='${userId}')`
      );
    }
    // Employés voient uniquement leurs items
    return query.eq('employee_id', userId);
  }

  // === CATÉGORIES NOTES DE FRAIS (EXPENSE_CATEGORIES) ===
  if (resource === 'expense_categories') {
    // Tous peuvent voir les catégories (données de référence)
    return query;
  }

  // === INCIDENTS SANTÉ/SÉCURITÉ (HEALTH_SAFETY_INCIDENTS) ===
  if (resource === 'health_safety_incidents') {
    // Admins et HR Manager voient tout
    if (['tenant_admin', 'hr_manager'].includes(role)) {
      return query;
    }
    // Managers voient incidents de leur équipe
    if (['project_manager', 'team_lead'].includes(role)) {
      return query.or(
        `reported_by.eq.${userId},employee_id.in.(SELECT id FROM employees WHERE manager_id='${userId}')`
      );
    }
    // Employés voient ceux qu'ils ont rapportés
    return query.eq('reported_by', userId);
  }

  // === PAIE - RUNS (PAYROLL_RUNS) ===
  if (resource === 'payroll_runs') {
    // Seulement Admins et HR Manager
    if (['tenant_admin', 'hr_manager'].includes(role)) {
      return query;
    }
    // Autres: accès refusé
    return query.eq('id', '00000000-0000-0000-0000-000000000000');
  }

  // === PAIE - ITEMS (PAYROLL_ITEMS) ===
  if (resource === 'payroll_items') {
    // Admins et HR Manager voient tout
    if (['tenant_admin', 'hr_manager'].includes(role)) {
      return query;
    }
    // Employés voient uniquement leurs propres bulletins
    return query.eq('employee_id', userId);
  }

  // === ÉVALUATIONS PERFORMANCE (PERFORMANCE_REVIEWS) ===
  if (resource === 'performance_reviews') {
    // Admins et HR Manager voient tout
    if (['tenant_admin', 'hr_manager'].includes(role)) {
      return query;
    }
    // Managers voient évaluations de leur équipe + les leurs
    if (['project_manager', 'team_lead'].includes(role)) {
      return query.or(
        `employee_id.eq.${userId},reviewer_id.eq.${userId},employee_id.in.(SELECT id FROM employees WHERE manager_id='${userId}')`
      );
    }
    // Employés voient uniquement leurs évaluations
    return query.eq('employee_id', userId);
  }

  // === OBJECTIFS PERFORMANCE (PERFORMANCE_GOALS) ===
  if (resource === 'performance_goals') {
    // Admins et HR Manager voient tout
    if (['tenant_admin', 'hr_manager'].includes(role)) {
      return query;
    }
    // Managers voient objectifs de leur équipe + les leurs
    if (['project_manager', 'team_lead'].includes(role)) {
      return query.or(
        `employee_id.eq.${userId},employee_id.in.(SELECT id FROM employees WHERE manager_id='${userId}')`
      );
    }
    // Employés voient uniquement leurs objectifs
    return query.eq('employee_id', userId);
  }

  // === NOTIFICATIONS ===
  if (resource === 'notifications') {
    // Chacun voit uniquement ses notifications
    return query.eq('user_id', userId);
  }

  return query;
}

/**
 * Vérifier si un rôle a accès à une ressource
 */
export function canAccessResource(role: RoleName, resource: string): boolean {
  const accessMatrix: Record<string, RoleName[]> = {
    tasks: [
      'super_admin',
      'tenant_admin',
      'hr_manager',
      'project_manager',
      'team_lead',
      'employee',
      'contractor',
      'intern',
      'viewer',
    ],
    projects: [
      'super_admin',
      'tenant_admin',
      'hr_manager',
      'project_manager',
      'team_lead',
      'employee',
      'contractor',
      'intern',
      'viewer',
    ],
    employees: ['super_admin', 'tenant_admin', 'hr_manager', 'employee'], // Employee peut voir SON profil
    leave_requests: [
      'super_admin',
      'tenant_admin',
      'hr_manager',
      'project_manager',
      'team_lead',
      'employee',
    ],
    payroll: ['super_admin', 'tenant_admin', 'hr_manager'],
    super_admin_page: ['super_admin'],
    hr_page: ['super_admin', 'tenant_admin', 'hr_manager', 'employee'], // Accès page HR (filtré par rôle)

    // Nouvelles ressources Formations & Compétences
    skills: [
      'super_admin',
      'tenant_admin',
      'hr_manager',
      'project_manager',
      'team_lead',
      'employee',
      'contractor',
      'intern',
      'viewer',
    ],
    trainings: [
      'super_admin',
      'tenant_admin',
      'hr_manager',
      'project_manager',
      'team_lead',
      'employee',
      'contractor',
      'intern',
      'viewer',
    ],
    training_enrollments: [
      'super_admin',
      'tenant_admin',
      'hr_manager',
      'project_manager',
      'team_lead',
      'employee',
      'contractor',
      'intern',
    ],
    development_plans: [
      'super_admin',
      'tenant_admin',
      'hr_manager',
      'project_manager',
      'team_lead',
      'employee',
      'contractor',
      'intern',
    ],
    training_catalog: [
      'super_admin',
      'tenant_admin',
      'hr_manager',
      'project_manager',
      'team_lead',
      'employee',
      'contractor',
      'intern',
      'viewer',
    ],

    // Ressources RH Self-Service
    expense_reports: [
      'super_admin',
      'tenant_admin',
      'hr_manager',
      'project_manager',
      'team_lead',
      'employee',
      'contractor',
      'intern',
    ],
    absence_justifications: [
      'super_admin',
      'tenant_admin',
      'hr_manager',
      'project_manager',
      'team_lead',
      'employee',
      'contractor',
      'intern',
    ],
    administrative_requests: [
      'super_admin',
      'tenant_admin',
      'hr_manager',
      'project_manager',
      'team_lead',
      'employee',
      'contractor',
      'intern',
    ],
    timesheets: [
      'super_admin',
      'tenant_admin',
      'hr_manager',
      'project_manager',
      'team_lead',
      'employee',
      'contractor',
      'intern',
    ],
    remote_work_requests: [
      'super_admin',
      'tenant_admin',
      'hr_manager',
      'project_manager',
      'team_lead',
      'employee',
      'contractor',
      'intern',
    ],
  };

  return accessMatrix[resource]?.includes(role) || false;
}

/**
 * Obtenir une description lisible du filtrage appliqué
 */
export function getFilterDescription(context: UserContext, resource: string): string {
  const { role, tenantId, projectIds = [] } = context;

  if (role === 'super_admin') {
    return 'Tous les tenants (accès complet)';
  }

  const descriptions: Record<RoleName, string> = {
    super_admin: 'Tous les tenants',
    tenant_admin: `Tenant ${tenantId}`,
    hr_manager: `Tenant ${tenantId} (tous les ${resource})`,
    project_manager:
      resource === 'tasks'
        ? `Tenant ${tenantId} (ses projets + assignées)`
        : `Tenant ${tenantId} (tous les projets)`,
    team_lead: `Tenant ${tenantId} (${projectIds.length} projets assignés)`,
    employee: `Tenant ${tenantId} (assignées uniquement)`,
    contractor: `Tenant ${tenantId} (assignées uniquement)`,
    intern: `Tenant ${tenantId} (lecture seule)`,
    viewer: `Tenant ${tenantId} (lecture seule)`,
  };

  return descriptions[role] || `Tenant ${tenantId} (accès limité)`;
}
