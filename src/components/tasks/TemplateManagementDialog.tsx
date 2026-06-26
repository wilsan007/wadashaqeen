/**
 * 🎯 TemplateManagementDialog - Gestion des Templates de Tâches
 * Pattern: Notion, Linear, ClickUp
 *
 * Fonctionnalités:
 * - Liste des templates avec catégories
 * - Création/Édition/Suppression
 * - Templates personnels vs publics
 * - Compteur d'utilisation
 * - Recherche et filtrage
 */

import { useState } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';
import { DialogTrigger } from '@/components/ui/dialog'; // Keep DialogTrigger if needed or replace with Button
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
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BookTemplate, Plus, Trash2, Edit, Search, Globe, Lock, TrendingUp } from '@/lib/icons';
import { useTaskTemplates, TaskTemplate, TaskTemplateData } from '@/hooks/useTaskTemplates';
import { useTranslation } from '@/hooks/useTranslation';

const CATEGORIES = [
  { value: 'onboarding', label: '👋 Onboarding', color: 'bg-blue-100 text-blue-700' },
  { value: 'bug_fix', label: '🐛 Bug Fix', color: 'bg-red-100 text-red-700' },
  { value: 'feature', label: '✨ Feature', color: 'bg-purple-100 text-purple-700' },
  { value: 'meeting', label: '📅 Meeting', color: 'bg-green-100 text-green-700' },
  { value: 'documentation', label: '📝 Documentation', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'other', label: '📦 Autre', color: 'bg-gray-100 text-gray-700' },
];



interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  is_public: boolean;
  template_data: TaskTemplateData;
}

export const TemplateManagementDialog = () => {
  const { t } = useTranslation();
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useTaskTemplates();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const PRIORITIES = [
    { value: 'low', label: t('tasks.priority.low') },
    { value: 'medium', label: t('tasks.priority.medium') },
    { value: 'high', label: t('tasks.priority.high') },
    { value: 'urgent', label: t('tasks.priority.urgent') },
  ];

  const STATUS_OPTIONS = [
    { value: 'todo', label: t('tasks.status.todo') },
    { value: 'doing', label: t('tasks.status.in_progress') },
    { value: 'blocked', label: t('tasks.status.blocked') },
    { value: 'done', label: t('tasks.status.done') },
  ];

  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    category: 'other',
    is_public: false,
    template_data: {
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      effort_estimate_h: 0,
      actions: [],
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'other',
      is_public: false,
      template_data: {
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        effort_estimate_h: 0,
        actions: [],
      },
    });
    setIsCreating(false);
    setEditingTemplate(null);
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.name.trim() || !formData.template_data.title.trim()) {
      return;
    }

    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, formData);
    } else {
      await createTemplate(formData);
    }

    resetForm();
  };

  const handleEdit = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category || 'other',
      is_public: template.is_public,
      template_data: template.template_data,
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
    setDeleteConfirmId(null);
  };

  const filteredTemplates = templates.filter(
    t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryInfo = (category?: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
  };

  return (
    <>
      <ResponsiveModal open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <BookTemplate className="mr-2 h-4 w-4" />
            Templates
          </Button>
        </DialogTrigger>
        <ResponsiveModalContent className="max-h-[85vh] max-w-4xl">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="flex items-center gap-2">
              <BookTemplate className="h-5 w-5" />
              Gestion des Templates de Tâches
            </ResponsiveModalTitle>
            <ResponsiveModalDescription>
              Créez des templates réutilisables pour gagner du temps
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Liste des templates */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Mes Templates ({templates.length})</h3>
                <Button
                  size="sm"
                  onClick={() => {
                    resetForm();
                    setIsCreating(true);
                  }}
                  disabled={isCreating}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Nouveau
                </Button>
              </div>

              {/* Recherche */}
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Liste scrollable */}
              <ScrollArea className="h-[450px] pr-4">
                {loading ? (
                  <div className="text-muted-foreground py-8 text-center">Chargement...</div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center">
                    {searchQuery ? 'Aucun template trouvé' : 'Aucun template créé'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTemplates.map(template => {
                      const categoryInfo = getCategoryInfo(template.category);
                      return (
                        <div
                          key={template.id}
                          className="hover:bg-accent/50 cursor-pointer rounded-lg border p-3 transition-colors"
                          onClick={() => handleEdit(template)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <span className="truncate text-sm font-medium">
                                  {template.name}
                                </span>
                                {template.is_public ? (
                                  <Globe className="h-3 w-3 text-blue-500" />
                                ) : (
                                  <Lock className="h-3 w-3 text-gray-400" />
                                )}
                              </div>
                              {template.description && (
                                <p className="text-muted-foreground line-clamp-1 text-xs">
                                  {template.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-2">
                                <Badge className={`text-xs ${categoryInfo.color}`}>
                                  {categoryInfo.label}
                                </Badge>
                                {template.usage_count > 0 && (
                                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                    <TrendingUp className="h-3 w-3" />
                                    {template.usage_count}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              onClick={e => {
                                e.stopPropagation();
                                setDeleteConfirmId(template.id);
                              }}
                            >
                              <Trash2 className="text-destructive h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Formulaire création/édition */}
            {isCreating && (
              <div className="space-y-4 border-l pl-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    {editingTemplate ? 'Modifier' : 'Nouveau'} Template
                  </h3>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    Annuler
                  </Button>
                </div>

                <ScrollArea className="h-[450px] pr-4">
                  <div className="space-y-4">
                    {/* Nom du template */}
                    <div>
                      <Label>Nom du template *</Label>
                      <Input
                        placeholder="Ex: Nouvelle feature standard"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        placeholder="À quoi sert ce template ?"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                      />
                    </div>

                    {/* Catégorie */}
                    <div>
                      <Label>Catégorie</Label>
                      <Select
                        value={formData.category}
                        onValueChange={value => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Template public */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Template public</Label>
                        <p className="text-muted-foreground text-xs">
                          Visible par tous les membres du tenant
                        </p>
                      </div>
                      <Switch
                        checked={formData.is_public}
                        onCheckedChange={checked =>
                          setFormData({ ...formData, is_public: checked })
                        }
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="mb-3 text-sm font-medium">Données de la tâche</h4>

                      {/* Titre de la tâche */}
                      <div className="mb-3 space-y-2">
                        <Label>Titre de la tâche *</Label>
                        <Input
                          placeholder="Ex: Implémenter [feature]"
                          value={formData.template_data.title}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              template_data: {
                                ...formData.template_data,
                                title: e.target.value,
                              },
                            })
                          }
                        />
                      </div>

                      {/* Description de la tâche */}
                      <div className="mb-3 space-y-2">
                        <Label>Description de la tâche</Label>
                        <Textarea
                          placeholder="Description détaillée..."
                          value={formData.template_data.description}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              template_data: {
                                ...formData.template_data,
                                description: e.target.value,
                              },
                            })
                          }
                          rows={3}
                        />
                      </div>

                      {/* Priorité */}
                      <div className="mb-3 space-y-2">
                        <Label>Priorité</Label>
                        <Select
                          value={formData.template_data.priority}
                          onValueChange={(value: any) =>
                            setFormData({
                              ...formData,
                              template_data: {
                                ...formData.template_data,
                                priority: value,
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITIES.map(p => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Statut */}
                      <div className="mb-3 space-y-2">
                        <Label>Statut initial</Label>
                        <Select
                          value={formData.template_data.status}
                          onValueChange={(value: any) =>
                            setFormData({
                              ...formData,
                              template_data: {
                                ...formData.template_data,
                                status: value,
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(s => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Effort estimé */}
                      <div className="space-y-2">
                        <Label>Effort estimé (heures)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={formData.template_data.effort_estimate_h || ''}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              template_data: {
                                ...formData.template_data,
                                effort_estimate_h: parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleCreateOrUpdate} className="flex-1">
                        {editingTemplate ? 'Mettre à jour' : 'Créer'}
                      </Button>
                      <Button variant="outline" onClick={resetForm}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce template ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le template sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
