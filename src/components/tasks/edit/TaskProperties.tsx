import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Clock, User, Flag, Building2, FolderKanban } from '@/lib/icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TaskPropertiesProps {
  status: string;
  onStatusChange: (status: string) => void;
  startDate?: Date;
  onStartDateChange: (date?: Date) => void;
  endDate?: Date;
  onEndDateChange: (date?: Date) => void;
  effortEstimate: number;
  onEffortChange: (effort: number) => void;
  assignee: string;
  onAssigneeChange: (assignee: string) => void;
  priority: string;
  onPriorityChange: (priority: string) => void;
  department?: string;
  onDepartmentChange: (department: string) => void;
  project?: string;
  onProjectChange: (project: string) => void;
  employees: Array<{ id: string; full_name: string }>;
  departments: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
  statusIcons: Record<string, string>;
  priorityIcons: Record<string, string>;
}

export const TaskProperties: React.FC<TaskPropertiesProps> = ({
  status,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  effortEstimate,
  onEffortChange,
  assignee,
  onAssigneeChange,
  priority,
  onPriorityChange,
  department,
  onDepartmentChange,
  project,
  onProjectChange,
  employees,
  departments,
  projects,
  statusIcons,
  priorityIcons,
}) => {
  return (
    <div className="space-y-4">
      {/* Statut */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Label className="text-muted-foreground flex shrink-0 items-center gap-2 text-sm sm:w-40">
          Statut
        </Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">{statusIcons.todo} À faire</SelectItem>
            <SelectItem value="doing">{statusIcons.doing} En cours</SelectItem>
            <SelectItem value="blocked">{statusIcons.blocked} Bloqué</SelectItem>
            <SelectItem value="done">{statusIcons.done} Terminé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Responsable */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Label className="text-muted-foreground flex shrink-0 items-center gap-2 text-sm sm:w-40">
          <User className="h-4 w-4" />
          Responsable
        </Label>
        <Select value={assignee} onValueChange={onAssigneeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Assigné à" />
          </SelectTrigger>
          <SelectContent>
            {employees.map(emp => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date de début */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Label className="text-muted-foreground flex shrink-0 items-center gap-2 text-sm sm:w-40">
          <CalendarIcon className="h-4 w-4" />
          Début
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !startDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, 'PPP', { locale: fr }) : 'Sélectionner'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={onStartDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Date de fin */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Label className="text-muted-foreground flex shrink-0 items-center gap-2 text-sm sm:w-40">
          <CalendarIcon className="h-4 w-4" />
          Échéance
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !endDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, 'PPP', { locale: fr }) : 'Sélectionner'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={endDate} onSelect={onEndDateChange} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      {/* Priorité */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Label className="text-muted-foreground flex shrink-0 items-center gap-2 text-sm sm:w-40">
          <Flag className="h-4 w-4" />
          Priorité
        </Label>
        <Select value={priority} onValueChange={onPriorityChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">{priorityIcons.low} Basse</SelectItem>
            <SelectItem value="medium">{priorityIcons.medium} Moyenne</SelectItem>
            <SelectItem value="high">{priorityIcons.high} Haute</SelectItem>
            <SelectItem value="urgent">{priorityIcons.urgent} Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Effort estimé */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Label className="text-muted-foreground flex shrink-0 items-center gap-2 text-sm sm:w-40">
          <Clock className="h-4 w-4" />
          Effort (h)
        </Label>
        <input
          type="number"
          value={effortEstimate}
          onChange={e => onEffortChange(parseFloat(e.target.value) || 0)}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          min="0"
          step="0.5"
        />
      </div>

      {/* Département */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Label className="text-muted-foreground flex shrink-0 items-center gap-2 text-sm sm:w-40">
          <Building2 className="h-4 w-4" />
          Département
        </Label>
        <Select value={department} onValueChange={onDepartmentChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choisir" />
          </SelectTrigger>
          <SelectContent>
            {departments.map(dept => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Projet */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Label className="text-muted-foreground flex shrink-0 items-center gap-2 text-sm sm:w-40">
          <FolderKanban className="h-4 w-4" />
          Projet
        </Label>
        <Select value={project} onValueChange={onProjectChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choisir" />
          </SelectTrigger>
          <SelectContent>
            {projects.map(proj => (
              <SelectItem key={proj.id} value={proj.id}>
                {proj.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
