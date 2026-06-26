import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, X } from '@/lib/icons';
import { useEmployees } from '@/hooks/useEmployees';
import { QuickInviteCollaborator } from '@/components/tasks/QuickInviteCollaborator';
import { useToast } from '@/hooks/use-toast';
import { CurrencySelect } from '@/components/common/CurrencySelect';
import { useTranslation } from '@/hooks/useTranslation';
import { useProjectEditPermissions } from '@/hooks/useProjectEditPermissions';

interface ProjectCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (projectData: {
    name: string;
    description: string;
    manager: string;
    status: 'en_cours' | 'a_venir' | 'termine';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    skills_required: string[];
    budget?: number;
    currency?: string;
  }) => void;
}

export const ProjectCreationDialog: React.FC<ProjectCreationDialogProps> = ({
  open,
  onOpenChange,
  onCreateProject,
}) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { employees, refetch: refetchEmployees } = useEmployees();

  // 🔒 Seuls PM+, admins et tenant_admin peuvent inviter des collaborateurs
  const projectPermissions = useProjectEditPermissions();
  const canInviteCollaborator = projectPermissions.canManageTeam;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [manager, setManager] = useState('unassigned'); // ✅ Valeur par défaut valide pour Radix UI
  const [status, setStatus] = useState<'en_cours' | 'a_venir' | 'termine'>('a_venir');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [budget, setBudget] = useState<number | undefined>();
  const [currency, setCurrency] = useState('DJF');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickInvite, setShowQuickInvite] = useState(false);

  const commonSkills = [
    'React',
    'TypeScript',
    'Node.js',
    'Python',
    'Design',
    'Marketing',
    'DevOps',
  ];

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: t('projectsBloc.creation.errorTitle'), description: t('projectsBloc.creation.errorMissingName'), variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await onCreateProject({
        name: name.trim(),
        description: description.trim(),
        manager: manager === 'unassigned' ? null : manager, // ✅ Convertir "unassigned" en null
        status,
        priority,
        skills_required: skills,
        budget,
        currency,
      });

      // Reset form
      setName('');
      setDescription('');
      setManager('unassigned'); // ✅ Réinitialiser à une valeur valide
      setStatus('a_venir');
      setPriority('medium');
      setBudget(undefined);
      setSkills([]);

      onOpenChange(false);
    } catch (error) {
      toast({ title: t('projectsBloc.creation.createError'), description: t('projectsBloc.creation.createErrorDesc'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto p-4 sm:p-6">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">{t('projectsBloc.creation.title')}</span>
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label>{t('projectsBloc.creation.nameLabel')}</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('projectsBloc.creation.namePlaceholder')}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('projectsBloc.creation.descLabel')}</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('projectsBloc.creation.descPlaceholder')}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('projectsBloc.creation.managerLabel')}</Label>
              <Select value={manager} onValueChange={setManager}>
                <SelectTrigger>
                  <SelectValue placeholder={t('projectsBloc.creation.selectManager')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">{t('projectsBloc.creation.unassigned')}</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {canInviteCollaborator && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickInvite(true)}
                  className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  {t('projectsBloc.creation.inviteManager')}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('projectsBloc.creation.statusLabel')}</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a_venir">{t('gantt.status.todo')}</SelectItem>
                  <SelectItem value="en_cours">{t('gantt.status.inProgress')}</SelectItem>
                  <SelectItem value="termine">{t('gantt.status.completed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('projectsBloc.creation.priorityLabel')}</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 {t('gantt.priority.low')}</SelectItem>
                  <SelectItem value="medium">🟡 {t('gantt.priority.medium')}</SelectItem>
                  <SelectItem value="high">🟠 {t('gantt.priority.high')}</SelectItem>
                  <SelectItem value="urgent">🔴 {t('gantt.priority.urgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('projectsBloc.creation.budgetLabel')}</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={budget || ''}
                  onChange={e => setBudget(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder={t('projectsBloc.creation.budgetPlaceholder')}
                  className="flex-1"
                />
                <CurrencySelect
                  value={currency}
                  onValueChange={setCurrency}
                  className="w-[100px]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('projectsBloc.creation.skillsLabel')}</Label>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                placeholder={t('projectsBloc.creation.skillsPlaceholder')}
                onKeyPress={e => e.key === 'Enter' && addSkill()}
              />
              <Button type="button" onClick={addSkill} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {commonSkills.map(skill => (
                <Badge
                  key={skill}
                  variant={skills.includes(skill) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    if (skills.includes(skill)) {
                      removeSkill(skill);
                    } else {
                      setSkills([...skills, skill]);
                    }
                  }}
                >
                  {skill}
                </Badge>
              ))}
            </div>

            {skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {skills.map(skill => (
                  <Badge key={skill} className="cursor-pointer" onClick={() => removeSkill(skill)}>
                    {skill} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <ResponsiveModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            {t('projectsBloc.creation.cancelBtn')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? t('projectsBloc.creation.creating') : t('projectsBloc.creation.createBtn')}
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModalContent>

      {canInviteCollaborator && (
        <QuickInviteCollaborator
          open={showQuickInvite}
          onOpenChange={setShowQuickInvite}
          onSuccess={employeeId => {
            if (refetchEmployees) {
              refetchEmployees();
            }
            if (employeeId) {
              setManager(employeeId);
            }
            toast({
              title: t('projectsBloc.creation.managerInvited'),
              description: t('projectsBloc.creation.managerInvitedDesc'),
            });
          }}
        />
      )}
    </ResponsiveModal>
  );
};
