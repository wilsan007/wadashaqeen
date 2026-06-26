import React from 'react';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type Task } from '@/hooks/optimized';
import { TaskTableBody } from './TaskTableBody';
import { TaskDialogManager } from './TaskDialogManager';

interface TaskFixedColumnsProps {
  tasks: Task[];
  onDuplicate: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onCreateSubtask: (
    parentId: string,
    linkedActionId?: string,
    customData?: {
      title: string;
      start_date: string;
      due_date: string;
      effort_estimate_h: number;
    }
  ) => void;
  onCreateSubtaskWithActions?: (
    parentId: string,
    customData: {
      title: string;
      start_date: string;
      due_date: string;
      effort_estimate_h: number;
    },
    actions: Array<{
      id: string;
      title: string;
      weight_percentage: number;
      due_date?: string;
      notes?: string;
    }>
  ) => void;
  onUpdateAssignee: (taskId: string, assignee: string) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  selectedTaskId?: string;
  onSelectTask: (taskId: string) => void;
  scrollRef?: React.RefObject<HTMLDivElement>;
  onScroll?: () => void;
  projectColorMap?: Record<string, string>;
  totalProjects?: number;
}

export const TaskFixedColumns = ({
  tasks,
  onDuplicate,
  onDelete,
  onEdit,
  onCreateSubtask,
  onCreateSubtaskWithActions,
  onUpdateAssignee,
  onUpdateTask,
  selectedTaskId,
  onSelectTask,
  scrollRef,
  onScroll,
  projectColorMap,
  totalProjects,
}: TaskFixedColumnsProps) => {
  return (
    <>
      <div ref={scrollRef} className="h-[600px] overflow-auto" onScroll={onScroll}>
        <Table>
          <TableHeader className="sticky top-0 z-20 border-b border-border/60 bg-gradient-to-r from-primary to-violet-600 shadow-md">
            <TableRow className="h-16 border-0 hover:bg-transparent">
              <TableHead className="h-16 min-w-[200px] font-bold text-white">Tâche</TableHead>
              <TableHead className="h-16 min-w-[150px] font-bold text-white">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/80 h-2 w-2 animate-pulse rounded-full shadow-sm"></span>
                  <span className="text-white/90">
                    Projet
                  </span>
                </div>
              </TableHead>
              <TableHead className="h-16 min-w-[150px] font-bold text-white">Responsable</TableHead>
              <TableHead className="h-16 min-w-[80px] font-bold text-white">Début</TableHead>
              <TableHead className="h-16 min-w-[80px] font-bold text-white">Échéance</TableHead>
              <TableHead className="h-16 min-w-[80px] font-bold text-white">Priorité</TableHead>
              <TableHead className="h-16 min-w-[80px] font-bold text-white">Statut</TableHead>
              <TableHead className="h-16 min-w-[80px] font-bold text-white">Charge (h)</TableHead>
              <TableHead className="h-16 min-w-[100px] font-bold text-white">Progression</TableHead>
              <TableHead className="h-16 min-w-[100px] font-bold text-white">Documents</TableHead>
              <TableHead className="h-16 min-w-[100px] font-bold text-white">
                Commentaires
              </TableHead>
              <TableHead className="h-16 w-[50px] font-bold text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TaskTableBody
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={onSelectTask}
            onRowDoubleClick={task => onEdit(task.id)}
            onCreateSubtask={onCreateSubtask}
            onCreateSubtaskWithActions={onCreateSubtaskWithActions}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onEdit={onEdit}
            onUpdateAssignee={onUpdateAssignee}
            onUpdateTask={onUpdateTask}
            projectColorMap={projectColorMap}
            totalProjects={totalProjects}
          />
        </Table>
      </div>
    </>
  );
};
