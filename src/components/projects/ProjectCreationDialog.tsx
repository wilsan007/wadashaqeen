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
  const { employees, refetch: refetchEmployees } = useEmployees();
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
      toast({ title: 'Champ obligatoire', description: 'Le nom du projet est obligatoire.', variant: 'destructive' });
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
      toast({ title: 'Erreur', description: 'Erreur lors de la création du projet.', variant: 'destructive' });
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
            <span className="truncate">Créer un Nouveau Projet</span>
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label>Nom du projet *</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nom du projet..."
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description du projet..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Manager / Chef de projet</Label>
              <Select value={manager} onValueChange={setManager}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Non assigné</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowQuickInvite(true)}
                className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                ➕ Inviter un manager
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a_venir">À venir</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Faible</SelectItem>
                  <SelectItem value="medium">🟡 Moyenne</SelectItem>
                  <SelectItem value="high">🟠 Élevée</SelectItem>
                  <SelectItem value="urgent">🔴 Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Budget</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={budget || ''}
                  onChange={e => setBudget(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Budget estimé..."
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
            <Label>Compétences requises</Label>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                placeholder="Ajouter une compétence..."
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
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Création...' : 'Créer le Projet'}
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModalContent>

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
            title: '✅ Manager invité',
            description: 'La personne a été automatiquement assignée comme manager du projet.',
          });
        }}
      />
    </ResponsiveModal>
  );
};
