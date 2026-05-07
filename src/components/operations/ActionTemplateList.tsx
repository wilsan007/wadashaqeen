/**
 * Composant: ActionTemplateList
 * Liste drag & drop des templates d'actions
 * Pattern: Notion/Linear checklist
 */

import React from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, X, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface ActionTemplate {
  id?: string;
  title: string;
  description: string;
  position: number;
}

interface SortableActionItemProps {
  id: string;
  index: number;
  template: ActionTemplate;
  readonly: boolean;
  onChange: (index: number, field: keyof ActionTemplate, value: string) => void;
  onRemove: (index: number) => void;
}

const SortableActionItem: React.FC<SortableActionItemProps> = ({
  id,
  index,
  template,
  readonly,
  onChange,
  onRemove,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: readonly,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-shadow ${isDragging ? 'ring-primary shadow-lg ring-2' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {!readonly && (
            <div
              {...attributes}
              {...listeners}
              className="flex cursor-grab items-start pt-2 active:cursor-grabbing"
            >
              <GripVertical className="text-muted-foreground h-5 w-5" />
            </div>
          )}

          <div className="flex items-start pt-2">
            <Badge variant="secondary" className="text-xs">
              {index + 1}
            </Badge>
          </div>

          <div className="flex-1 space-y-3">
            {readonly ? (
              <div>
                <h4 className="font-medium">{template.title || '(Sans titre)'}</h4>
                {template.description && (
                  <p className="text-muted-foreground mt-1 text-sm">{template.description}</p>
                )}
              </div>
            ) : (
              <>
                <Input
                  value={template.title}
                  onChange={e => onChange(index, 'title', e.target.value)}
                  placeholder="Titre de l'action *"
                  className={template.title.trim() === '' ? 'border-destructive' : ''}
                />
                <Textarea
                  value={template.description}
                  onChange={e => onChange(index, 'description', e.target.value)}
                  placeholder="Description détaillée (optionnel)"
                  rows={2}
                />
              </>
            )}
          </div>

          {!readonly && (
            <Button
              onClick={() => onRemove(index)}
              size="sm"
              variant="ghost"
              className="hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface ActionTemplateListProps {
  templates: ActionTemplate[];
  onChange: (templates: ActionTemplate[]) => void;
  readonly?: boolean;
}

export const ActionTemplateList: React.FC<ActionTemplateListProps> = ({
  templates,
  onChange,
  readonly = false,
}) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const sortableIds = templates.map((_, i) => `action-${i}`);

  const handleAdd = () => {
    onChange([...templates, { title: '', description: '', position: templates.length }]);
  };

  const handleRemove = (index: number) => {
    const reindexed = templates
      .filter((_, i) => i !== index)
      .map((t, i) => ({ ...t, position: i }));
    onChange(reindexed);
  };

  const handleChange = (index: number, field: keyof ActionTemplate, value: string) => {
    const updated = [...templates];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortableIds.indexOf(active.id as string);
    const newIndex = sortableIds.indexOf(over.id as string);
    const reindexed = arrayMove(templates, oldIndex, newIndex).map((t, i) => ({
      ...t,
      position: i,
    }));
    onChange(reindexed);
  };

  if (readonly && templates.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        <CheckSquare className="mx-auto mb-2 h-12 w-12 opacity-50" />
        <p>Aucune action définie pour cette activité</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="text-muted-foreground h-5 w-5" />
          <Label className="text-base font-semibold">Actions templates ({templates.length})</Label>
        </div>
        {!readonly && (
          <Button onClick={handleAdd} size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une action
          </Button>
        )}
      </div>

      {!readonly && templates.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Les actions seront automatiquement clonées sur chaque tâche générée
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Vous pouvez les réorganiser par glisser-déposer
            </p>
          </CardContent>
        </Card>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {templates.map((template, index) => (
              <SortableActionItem
                key={sortableIds[index]}
                id={sortableIds[index]}
                index={index}
                template={template}
                readonly={readonly}
                onChange={handleChange}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {!readonly && templates.some(t => t.title.trim() === '') && (
        <p className="text-destructive text-sm">⚠️ Certaines actions n'ont pas de titre</p>
      )}
    </div>
  );
};
