import React, { useMemo, useState } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHRMinimal, Employee } from '@/hooks/useHRMinimal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ZoomIn,
  ZoomOut,
  Move,
  Layers,
  Building,
  Edit,
  Plus,
  Link as LinkIcon,
  Trash2,
  Check,
  X,
  UserPlus,
  ArrowRightLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { OrganizationLevel } from '@/services/HierarchyService';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
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

interface OrgNodeProps {
  employee: Employee;
  level?: OrganizationLevel;
  departmentName?: string;
  isEditMode: boolean;
  isLinking: boolean;
  onStartLink: (id: string) => void;
  onCompleteLink: (targetId: string) => void;
  onAdd: (id: string) => void;
  onDelete: (id: string) => void;
}

const OrgNode: React.FC<OrgNodeProps> = ({
  employee,
  level,
  departmentName,
  isEditMode,
  isLinking,
  onStartLink,
  onCompleteLink,
  onAdd,
  onDelete,
}) => {
  return (
    <div
      className={`bg-card group relative inline-flex min-w-[200px] flex-col items-center overflow-hidden rounded-xl border-2 p-3 shadow-sm transition-all ${isLinking ? 'hover:ring-primary hover:bg-primary/5 cursor-pointer hover:ring-2' : ''} ${isEditMode && !isLinking ? 'hover:shadow-md' : ''} `}
      style={{ borderColor: level?.color_code || 'transparent' }}
      onClick={() => isLinking && onCompleteLink(employee.id)}
    >
      {/* Rank Color Strip */}
      {level && (
        <div
          className="absolute top-0 left-0 h-1.5 w-full"
          style={{ backgroundColor: level.color_code }}
        />
      )}

      {/* Action Overlay for Edit Mode */}
      {isEditMode && !isLinking && (
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="outline"
            size="icon"
            className="bg-background h-6 w-6 shadow-sm"
            onClick={e => {
              e.stopPropagation();
              onAdd(employee.id);
            }}
            title="Ajouter un subordonné"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-background h-6 w-6 shadow-sm"
            onClick={e => {
              e.stopPropagation();
              onStartLink(employee.id);
            }}
            title="Changer de manager (Lier)"
          >
            <LinkIcon className="h-3 w-3" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-6 w-6 shadow-sm"
            onClick={e => {
              e.stopPropagation();
              onDelete(employee.id);
            }}
            title="Détacher / Supprimer"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      <Avatar className="z-10 mb-2 h-14 w-14 border-4 border-white shadow-sm dark:border-gray-800">
        <AvatarImage src={employee.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary font-bold">
          {employee.full_name
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="text-foreground mt-1 text-sm font-bold">{employee.full_name}</div>

      {/* Job Title / Rank Name */}
      <div className="text-primary mb-1 text-xs font-medium">
        {level ? level.name : employee.job_title || 'Employé'}
      </div>

      {/* Department Badge */}
      {departmentName && (
        <Badge
          variant="secondary"
          className="mt-1 h-5 gap-1 bg-slate-100 px-2 text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <Building className="h-3 w-3" />
          {departmentName}
        </Badge>
      )}

      {/* Linking Indicator */}
      {isLinking && (
        <div className="bg-primary/10 pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs font-bold">
            Cible ?
          </span>
        </div>
      )}
    </div>
  );
};

export const OrganizationChart: React.FC = () => {
  const {
    employees,
    loading: employeesLoading,
    refresh: refetch,
  } = useHRMinimal({
    enabled: { employees: true, departments: true },
    limits: { employees: 1000 }, // Load all employees for hierarchical view
  });
  const [zoom, setZoom] = React.useState(0.8);
  const [pendingDetach, setPendingDetach] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [linkingNodeId, setLinkingNodeId] = useState<string | null>(null);

  // Add Dialog State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [parentNodeId, setParentNodeId] = useState<string | null>(null);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeJob, setNewEmployeeJob] = useState('');

  // useQuery for organization levels
  const { data: levels = [], isLoading: levelsLoading } = useQuery<OrganizationLevel[]>({
    queryKey: ['organization_levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_levels' as any)
        .select('*')
        .order('rank_order');
      if (error) throw error;
      return data || [];
    },
  });

  // useQuery for departments
  const { data: departments = [], isLoading: deptsLoading } = useQuery<any[]>({
    queryKey: ['departments-org'],
    queryFn: async () => {
      const { data, error } = await supabase.from('departments').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const loading = levelsLoading || deptsLoading;

  // useMutation: update manager link
  const updateManagerMutation = useMutation({
    mutationFn: async ({ employeeId, managerId }: { employeeId: string; managerId: string }) => {
      const { error } = await supabase
        .from('employees')
        .update({ manager_id: managerId })
        .eq('id', employeeId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Hiérarchie mise à jour !');
      refetch();
    },
    onError: (error) => {
      console.error('Error updating manager:', error);
      toast.error('Erreur lors de la mise à jour.');
    },
  });

  // useMutation: add employee
  const addEmployeeMutation = useMutation({
    mutationFn: async ({ name, job, parentId }: { name: string; job: string; parentId: string }) => {
      const fakeEmail = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
      const { error } = await supabase.from('employees').insert({
        full_name: name,
        job_title: job,
        manager_id: parentId,
        email: fakeEmail,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Employé ajouté !');
      refetch();
      setShowAddDialog(false);
    },
    onError: (error: any) => {
      console.error('Error adding employee:', error);
      toast.error("Erreur lors de l'ajout: " + error.message);
    },
  });

  // useMutation: detach employee
  const detachEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').update({ manager_id: null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Employé détaché !');
      refetch();
    },
    onError: (error) => {
      console.error('Error detaching employee:', error);
      toast.error('Erreur lors du détachement.');
    },
  });

  // Handlers
  const handleStartLink = (id: string) => {
    setLinkingNodeId(id);
    toast.info('Sélectionnez le nouveau manager pour cet employé.');
  };

  const handleCompleteLink = (targetId: string) => {
    if (!linkingNodeId) return;
    if (linkingNodeId === targetId) {
      toast.error('Un employé ne peut pas être son propre manager.');
      setLinkingNodeId(null);
      return;
    }
    updateManagerMutation.mutate({ employeeId: linkingNodeId, managerId: targetId });
    setLinkingNodeId(null);
  };

  const handleAddStart = (parentId: string) => {
    setParentNodeId(parentId);
    setNewEmployeeName('');
    setNewEmployeeJob('');
    setShowAddDialog(true);
  };

  const handleAddConfirm = () => {
    if (!newEmployeeName || !parentNodeId) return;
    addEmployeeMutation.mutate({ name: newEmployeeName, job: newEmployeeJob, parentId: parentNodeId });
  };

  const handleDelete = (id: string) => {
    setPendingDetach(id);
  };

  const confirmDetach = () => {
    if (!pendingDetach) return;
    const id = pendingDetach;
    setPendingDetach(null);
    detachEmployeeMutation.mutate(id);
  };

  const hierarchy = useMemo(() => {
    if (!employees.length) return null;

    // Maps for quick lookup
    const levelMap = new Map(levels.map(l => [l.id, l]));
    const deptMap = new Map(departments.map(d => [d.id, d]));

    // Enrich employees with level data (if job_title matches level name OR if we had org_level_id linked)
    // Since we established organization_level_id in employees table:
    const enrichedEmployees = employees.map(e => ({
      ...e,
      level: (e as any).organization_level_id
        ? levelMap.get((e as any).organization_level_id)
        : undefined,
      departmentName: e.department_id ? deptMap.get(e.department_id)?.name : undefined,
    }));

    // Find roots (Employees whose manager is missing or is not in the list)
    // OR Employees who have Rank 0 (Top level) if manager check fails?
    // Let's stick to manager_id for strict tree, but fallback to Rank 0 if no manager_id found.
    const employeeMap = new Map(enrichedEmployees.map(e => [e.id, e]));
    const roots = enrichedEmployees.filter(e => !e.manager_id || !employeeMap.has(e.manager_id));

    // Sort roots by Rank (Highest rank first)
    roots.sort((a, b) => (a.level?.rank_order || 999) - (b.level?.rank_order || 999));

    const renderTree = (node: any) => {
      // Find children
      const children = enrichedEmployees.filter(e => e.manager_id === node.id);
      // Sort children by Rank then Name
      children.sort((a, b) => {
        const rankA = a.level?.rank_order || 999;
        const rankB = b.level?.rank_order || 999;
        if (rankA !== rankB) return rankA - rankB;
        return a.full_name.localeCompare(b.full_name);
      });

      return (
        <TreeNode
          label={
            <OrgNode
              employee={node}
              level={node.level}
              departmentName={node.departmentName}
              isEditMode={isEditMode}
              isLinking={!!linkingNodeId && linkingNodeId !== node.id}
              onStartLink={handleStartLink}
              onCompleteLink={handleCompleteLink}
              onAdd={handleAddStart}
              onDelete={handleDelete}
            />
          }
          key={node.id}
        >
          {children.map(child => renderTree(child))}
        </TreeNode>
      );
    };

    return roots.map(root => renderTree(root));
  }, [employees, levels, departments, isEditMode, linkingNodeId]);

  if (employeesLoading || loading) {
    return <Skeleton className="h-[600px] w-full rounded-xl" />;
  }

  return (
    <Card className="h-full border-none bg-transparent shadow-none">
      {/* Confirm detach dialog */}
      <AlertDialog open={!!pendingDetach} onOpenChange={open => { if (!open) setPendingDetach(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Détacher cet employé ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ceci supprimera le lien manager de cet employé dans l'organigramme. Pour supprimer définitivement l'employé, utilisez la gestion du personnel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDetach} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Détacher
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <CardHeader className="flex flex-col items-start justify-between gap-4 px-0 pt-0 pb-4 md:flex-row md:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent">
            <Layers className="h-6 w-6 text-blue-600" />
            Organigramme Hiérarchique
          </CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Vue structurelle basée sur les niveaux décisionnels.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-card flex items-center gap-2 rounded-lg border p-2 shadow-sm">
            <Switch id="edit-mode" checked={isEditMode} onCheckedChange={setIsEditMode} />
            <Label
              htmlFor="edit-mode"
              className="flex cursor-pointer items-center gap-1 text-sm font-medium"
            >
              <Edit className="h-3 w-3" /> Note d'Édition
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center font-mono text-xs">{Math.round(zoom * 100)}%</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative h-[700px] cursor-move overflow-hidden rounded-xl border bg-slate-50/50 p-0 backdrop-blur-sm dark:bg-slate-950/50">
        {linkingNodeId && (
          <div className="bg-primary text-primary-foreground absolute top-4 left-1/2 z-50 flex -translate-x-1/2 animate-pulse items-center gap-2 rounded-full px-4 py-2 font-bold shadow-lg">
            <LinkIcon className="h-4 w-4" />
            Sélectionnez le nouveau manager...
            <Button
              size="sm"
              variant="secondary"
              className="ml-2 h-6 px-2 text-xs"
              onClick={() => setLinkingNodeId(null)}
            >
              Annuler
            </Button>
          </div>
        )}

        <div className="flex h-full w-full items-start justify-center overflow-auto pt-10">
          <div
            className="origin-top transition-transform duration-200 ease-out"
            style={{ transform: `scale(${zoom})` }}
          >
            {hierarchy && hierarchy.length > 0 ? (
              <Tree
                lineWidth={'2px'}
                lineColor={'#94a3b8'}
                lineBorderRadius={'12px'}
                label={<div className="hidden">Root</div>}
              >
                {hierarchy}
              </Tree>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center justify-center pt-20">
                <Layers className="mb-4 h-12 w-12 opacity-20" />
                <p>Aucune donnée hiérarchique structurée.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un subordonné</DialogTitle>
            <DialogDescription>
              Création rapide d'un nouvel employé sous la supervision du manager sélectionné.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom complet</Label>
              <Input
                value={newEmployeeName}
                onChange={e => setNewEmployeeName(e.target.value)}
                placeholder="Ex: Jean Dupont"
              />
            </div>
            <div className="space-y-2">
              <Label>Intitulé du poste</Label>
              <Input
                value={newEmployeeJob}
                onChange={e => setNewEmployeeJob(e.target.value)}
                placeholder="Ex: Assistant"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddConfirm}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
