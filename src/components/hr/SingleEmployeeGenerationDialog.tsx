import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { payrollService } from '../../services/payrollService';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SingleEmployeeGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  periodeId: string;
  onSuccess: () => void;
}

export const SingleEmployeeGenerationDialog = ({
  isOpen,
  onClose,
  tenantId,
  periodeId,
  onSuccess,
}: SingleEmployeeGenerationDialogProps) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isOpen && tenantId) {
      fetchEmployees();
    }
  }, [isOpen, tenantId]);

  const fetchEmployees = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('paie_employes')
      .select('id, nom_complet, fonction')
      .eq('tenant_id', tenantId)
      .order('nom_complet');

    if (error) {
      console.error('Error fetching employees:', error);
    } else {
      setEmployees(data || []);
    }
    setFetching(false);
  };

  const handleGenerate = async () => {
    if (!selectedEmployeeId) return;

    setLoading(true);
    try {
      await payrollService.genererBulletin(selectedEmployeeId, periodeId);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error generating bulletin:', error);
      toast({ title: 'Erreur de génération', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Générer un bulletin individuel</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="employee">Employé</Label>
            {fetching ? (
              <div className="text-muted-foreground flex items-center text-sm">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement des employés...
              </div>
            ) : (
              <select
                id="employee"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedEmployeeId}
                onChange={e => setSelectedEmployeeId(e.target.value)}
              >
                <option value="">Sélectionner un employé</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nom_complet} - {emp.fonction}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleGenerate} disabled={loading || !selectedEmployeeId}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Générer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
