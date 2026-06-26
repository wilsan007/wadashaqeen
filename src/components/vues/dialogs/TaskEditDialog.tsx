import React, { useState, useEffect } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Save, X } from '@/lib/icons';
import { type Task } from '@/hooks/optimized';
import { useTranslation } from '@/hooks/useTranslation';
import { useTaskEditPermissions } from '@/hooks/useTaskEditPermissions';

interface TaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSave?: () => void;
}

export const TaskEditDialog: React.FC<TaskEditDialogProps> = ({
  open,
  onOpenChange,
  task,
  onSave,
}) => {
  const { t } = useTranslation();
  const permissions = useTaskEditPermissions({ task });
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [status, setStatus] = useState<'todo' | 'doing' | 'blocked' | 'done'>('todo');
  const [loading, setLoading] = useState(false);

  const availableAssignees = [
    'Ahmed Waleh',
    'Sarah Martin',
    'Jean Dupont',
    'Marie Dubois',
    'Pierre Moreau',
  ];

  useEffect(() => {
    if (task && open) {
      setTitle(task.title || '');
      setAssignee(
        task.assignee && task.assignee !== 'Non assigné'
          ? typeof task.assignee === 'string'
            ? task.assignee
            : (task.assignee as any).full_name
          : 'Ahmed Waleh'
      );
      setPriority((task.priority as any) || 'medium');
      setStatus((task.status as any) || 'todo');
    }
  }, [task, open]);

  const handleSave = async () => {
    if (!task) return;
    if (!assignee || assignee === 'Non assigné') {
      alert('Un responsable doit être assigné à la tâche');
      return;
    }
    setLoading(true);
    try {
      onSave?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  // Bloquer l'ouverture si l'utilisateur n'a aucune permission d'édition
  if (!permissions.canEdit) {
    return (
      <ResponsiveModal open={open} onOpenChange={onOpenChange}>
        <ResponsiveModalContent className="max-w-md">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Modification non autorisée
            </ResponsiveModalTitle>
          </ResponsiveModalHeader>
          <div className="px-1 py-4">
            <p className="text-muted-foreground text-sm">
              {permissions.reason || 'Vous ne disposez pas des droits nécessaires pour modifier cette tâche.'}
            </p>
          </div>
          <ResponsiveModalFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" />
              Fermer
            </Button>
          </ResponsiveModalFooter>
        </ResponsiveModalContent>
      </ResponsiveModal>
    );
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="max-w-2xl">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modifier la tâche
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Titre de la tâche"
              maxLength={80}
              disabled={!permissions.canEditTitle}
              readOnly={!permissions.canEditTitle}
            />
            <p className="text-muted-foreground text-xs">
              {title.length}/80 caractères (limite pour préserver la mise en page)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Responsable *</Label>
              <Select
                value={assignee}
                onValueChange={setAssignee}
                disabled={!permissions.canEditAssignee}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableAssignees.map(person => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select
                value={priority}
                onValueChange={(value: any) => setPriority(value)}
                disabled={!permissions.canEditPriority}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('tasks.priority.low')}</SelectItem>
                  <SelectItem value="medium">{t('tasks.priority.medium')}</SelectItem>
                  <SelectItem value="high">{t('tasks.priority.high')}</SelectItem>
                  <SelectItem value="urgent">{t('tasks.priority.urgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Statut</Label>
            <Select
              value={status}
              onValueChange={(value: any) => setStatus(value)}
              disabled={!permissions.canEditStatus}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">{t('tasks.status.todo')}</SelectItem>
                <SelectItem value="doing">{t('tasks.status.in_progress')}</SelectItem>
                <SelectItem value="blocked">{t('tasks.status.blocked')}</SelectItem>
                <SelectItem value="done">{t('tasks.status.done')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ResponsiveModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !title.trim() || !assignee || assignee === 'Non assigné'}
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
