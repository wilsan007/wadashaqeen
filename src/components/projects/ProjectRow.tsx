import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, Users } from 'lucide-react';
import { EditableProjectNameCell } from './cells/EditableProjectNameCell';
import { EditableProjectStatusCell } from './cells/EditableProjectStatusCell';
import { EditableProjectBudgetCell } from './cells/EditableProjectBudgetCell';
import { EditableProjectManagerCell } from './cells/EditableProjectManagerCell';
import { EditableDateCell } from '../vues/table/cells/EditableDateCell';
import { useProjectEditPermissions } from '@/hooks/useProjectEditPermissions';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface Project {
  id: string;
  name: string;
  status: string;
  progress?: number;
  manager: string | { id: string; full_name: string } | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  created_by?: string;
  manager_id?: string;
  tenant_id?: string; // 🔒 CRITIQUE : Nécessaire pour filtrage sécurité
  [key: string]: any;
}

interface ProjectRowProps {
  project: Project;
  onUpdateProject?: (projectId: string, updates: Partial<Project>) => Promise<void> | void;
  onProjectClick?: (project: Project) => void;
  isSelected: boolean;
  compactMode?: boolean;
  currency?: string;
}

export const ProjectRow: React.FC<ProjectRowProps> = ({
  project,
  onUpdateProject,
  onProjectClick,
  isSelected,
  compactMode,
}) => {
  // 🔒 Hook de permissions pour ce projet
  const permissions = useProjectEditPermissions({ project });
  const { t } = useTranslation();

  const getManagerName = (manager: string | { id: string; full_name: string } | null): string => {
    if (!manager) return t('projectsBloc.creation.unassigned');
    if (typeof manager === 'string') return manager;
    return manager.full_name || t('projectsBloc.creation.unassigned');
  };

  return (
    <TableRow
      className={cn(
        'hover:bg-muted/50 cursor-pointer transition-colors',
        isSelected && 'bg-primary/10'
      )}
      onClick={() => onProjectClick?.(project)}
    >
      {/* Nom du projet - Éditable avec permissions */}
      <EditableProjectNameCell
        value={project.name}
        onChange={async value => onUpdateProject?.(project.id, { name: value })}
        readOnly={!permissions.canEditName}
      />

      {/* Statut - Éditable avec permissions */}
      <EditableProjectStatusCell
        value={project.status}
        onChange={async value => onUpdateProject?.(project.id, { status: value })}
        readOnly={!permissions.canEditStatus}
      />

      {/* Progression - Lecture seule pour l'instant */}
      <TableCell className="py-2">
        <div className="flex items-center gap-2">
          <Progress value={project.progress || 0} className="h-2 w-full" />
          <span className="text-muted-foreground min-w-[40px] text-right text-xs">
            {project.progress || 0}%
          </span>
        </div>
      </TableCell>

      {/* Chef de projet - Éditable avec dropdown employés FILTRÉS PAR TENANT */}
      <EditableProjectManagerCell
        value={project.manager}
        onChange={async value => onUpdateProject?.(project.id, { manager_id: value })}
        readOnly={!permissions.canEditManager}
        projectTenantId={project.tenant_id} // 🔒 SÉCURITÉ CRITIQUE : Filtrage par tenant
      />

      {/* Budget - Éditable avec permissions */}
      <EditableProjectBudgetCell
        value={project.budget}
        onChange={async value => onUpdateProject?.(project.id, { budget: value })}
        readOnly={!permissions.canEditBudget}
        currency={project.currency || 'DJF'}
      />

      {/* Dates - Éditables avec permissions */}
      {!compactMode && (
        <>
          <EditableDateCell
            value={project.start_date}
            onChange={async value => onUpdateProject?.(project.id, { start_date: value })}
            readOnly={!permissions.canEditDates}
          />

          <EditableDateCell
            value={project.end_date}
            onChange={async value => onUpdateProject?.(project.id, { end_date: value })}
            readOnly={!permissions.canEditDates}
          />
        </>
      )}

      {/* Actions */}
      <TableCell className="py-2" onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
