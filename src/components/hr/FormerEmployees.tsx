import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  UserX,
  Search,
  RotateCcw,
  Calendar,
  Briefcase,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTenant } from '@/hooks/useTenant';

/* ──────────────────────────────────────────────
   Types
────────────────────────────────────────────── */
interface TerminatedEmployee {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  job_title: string | null;
  department_name: string | null;
  hire_date: string | null;
  termination_date: string | null;
  termination_type: string | null;
  termination_reason: string | null;
  termination_notice_days: number | null;
  reintegration_eligible: boolean;
  reintegration_date: string | null;
  reintegration_notes: string | null;
  contract_type: string | null;
  status: string;
  avatar_url: string | null;
  tenure_days: number | null;
  tenant_id: string;
}

const TERMINATION_TYPES: Record<string, { label: string; color: string }> = {
  resigned:         { label: 'Démission',          color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  fired:            { label: 'Licenciement',        color: 'bg-red-500/15 text-red-600 border-red-500/30' },
  retired:          { label: 'Retraite',            color: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  contract_end:     { label: 'Fin de contrat',      color: 'bg-purple-500/15 text-purple-600 border-purple-500/30' },
  mutual_agreement: { label: 'Rupture convention.', color: 'bg-slate-500/15 text-slate-600 border-slate-500/30' },
};

function formatTenure(days: number | null): string {
  if (!days) return '—';
  const years  = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years > 0) return `${years} an${years > 1 ? 's' : ''} ${months > 0 ? `${months} mois` : ''}`.trim();
  if (months > 0) return `${months} mois`;
  return `${days} jours`;
}

/* ──────────────────────────────────────────────
   Composant Principal
────────────────────────────────────────────── */
export function FormerEmployees() {
  const { t } = useTranslation();
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const [search, setSearch]                     = useState('');
  const [filterType, setFilterType]             = useState<string>('all');
  const [reintegrateDialog, setReintegrateDialog] = useState<TerminatedEmployee | null>(null);
  const [reintegrationNotes, setReintegrationNotes] = useState('');

  /* ── Fetch des anciens employés ── */
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['terminated-employees', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('terminated_employees_summary')
        .select('*')
        .eq('tenant_id', tenantId!)
        .order('termination_date', { ascending: false });

      if (error) throw error;
      return data as TerminatedEmployee[];
    },
    enabled: !!tenantId,
  });

  /* ── Mutation réintégration ── */
  const reintegrateMutation = useMutation({
    mutationFn: async ({ employeeId, notes }: { employeeId: string; notes: string }) => {
      const { data, error } = await supabase.rpc('reintegrate_employee', {
        p_employee_id:       employeeId,
        p_reintegration_date: new Date().toISOString().split('T')[0],
        p_notes:             notes || null,
      });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, { employeeId }) => {
      const emp = employees.find(e => e.id === employeeId);
      toast.success(`${emp?.full_name ?? 'Employé'} réintégré avec succès`);
      queryClient.invalidateQueries({ queryKey: ['terminated-employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setReintegrateDialog(null);
      setReintegrationNotes('');
    },
    onError: (err: Error) => {
      toast.error(`Erreur lors de la réintégration : ${err.message}`);
    },
  });

  /* ── Filtres ── */
  const filtered = employees.filter(e => {
    const matchesSearch =
      !search ||
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_id.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      filterType === 'all' || e.termination_type === filterType;

    return matchesSearch && matchesType;
  });

  /* ── Stats ── */
  const stats = {
    total:      employees.length,
    eligible:   employees.filter(e => e.reintegration_eligible).length,
    reintegrated: employees.filter(e => e.reintegration_date).length,
    thisYear:   employees.filter(e => {
      if (!e.termination_date) return false;
      return new Date(e.termination_date).getFullYear() === new Date().getFullYear();
    }).length,
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
            <UserX className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Anciens Employés</h2>
            <p className="text-sm text-muted-foreground">
              Historique des départs et gestion des réintégrations
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total départs',     value: stats.total,        icon: UserX,        color: 'text-red-500' },
          { label: 'Éligibles retour',  value: stats.eligible,     icon: CheckCircle,  color: 'text-emerald-500' },
          { label: 'Réintégrés',        value: stats.reintegrated, icon: RotateCcw,    color: 'text-blue-500' },
          { label: 'Cette année',       value: stats.thisYear,     icon: Calendar,     color: 'text-amber-500' },
        ].map(s => (
          <Card key={s.label} className="modern-card border-border/50">
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className={`h-8 w-8 shrink-0 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, matricule..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-52">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Type de départ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(TERMINATION_TYPES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="modern-card">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <UserX className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              {search || filterType !== 'all'
                ? 'Aucun résultat pour ces filtres'
                : 'Aucun ancien employé enregistré'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(emp => {
            const termType = emp.termination_type
              ? TERMINATION_TYPES[emp.termination_type]
              : null;

            return (
              <Card
                key={emp.id}
                className="modern-card border-border/50 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Info principale */}
                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase text-muted-foreground">
                        {emp.full_name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{emp.full_name}</p>
                          {termType && (
                            <Badge variant="outline" className={`text-xs ${termType.color}`}>
                              {termType.label}
                            </Badge>
                          )}
                          {emp.reintegration_date && (
                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-600">
                              ✓ Réintégré
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{emp.email}</p>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {emp.job_title && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {emp.job_title}
                            </span>
                          )}
                          {emp.department_name && (
                            <span className="flex items-center gap-1">
                              <Filter className="h-3 w-3" />
                              {emp.department_name}
                            </span>
                          )}
                          {emp.tenure_days && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Ancienneté&nbsp;: {formatTenure(emp.tenure_days)}
                            </span>
                          )}
                          {emp.termination_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Départ&nbsp;: {new Date(emp.termination_date).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                        {emp.termination_reason && (
                          <p className="mt-1 rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                            💬 {emp.termination_reason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      {emp.reintegration_eligible && !emp.reintegration_date && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                          onClick={() => setReintegrateDialog(emp)}
                        >
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                          Réintégrer
                        </Button>
                      )}
                      {!emp.reintegration_eligible && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          Non éligible
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Réintégration */}
      <Dialog
        open={!!reintegrateDialog}
        onOpenChange={open => {
          if (!open) {
            setReintegrateDialog(null);
            setReintegrationNotes('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-emerald-500" />
              Réintégrer {reintegrateDialog?.full_name}
            </DialogTitle>
            <DialogDescription>
              L'employé sera réactivé avec son historique complet intact. Son compte Supabase sera
              réactivé s'il existe.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>Ancien poste :</span>
                <span className="font-medium text-foreground">{reintegrateDialog?.job_title ?? '—'}</span>
                <span>Date de départ :</span>
                <span className="font-medium text-foreground">
                  {reintegrateDialog?.termination_date
                    ? new Date(reintegrateDialog.termination_date).toLocaleDateString('fr-FR')
                    : '—'}
                </span>
                <span>Type de départ :</span>
                <span className="font-medium text-foreground">
                  {reintegrateDialog?.termination_type
                    ? TERMINATION_TYPES[reintegrateDialog.termination_type]?.label ?? '—'
                    : '—'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reintegration-notes">Notes de réintégration (optionnel)</Label>
              <Textarea
                id="reintegration-notes"
                placeholder="Ex : Retour suite à un projet spécifique, nouveau poste..."
                value={reintegrationNotes}
                onChange={e => setReintegrationNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setReintegrateDialog(null);
                setReintegrationNotes('');
              }}
            >
              Annuler
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={reintegrateMutation.isPending}
              onClick={() => {
                if (reintegrateDialog) {
                  reintegrateMutation.mutate({
                    employeeId: reintegrateDialog.id,
                    notes:      reintegrationNotes,
                  });
                }
              }}
            >
              {reintegrateMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Confirmer la réintégration
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
