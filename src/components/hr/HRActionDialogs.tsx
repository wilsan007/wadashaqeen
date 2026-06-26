import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { useOnboardingOffboarding } from '@/hooks/useOnboardingOffboarding';
import { useExpenseManagement } from '@/hooks/useExpenseManagement';
import { usePayrollManagement } from '@/hooks/usePayrollManagement';
import { useSkillsTraining } from '@/hooks/useSkillsTraining';
import { useHealthSafety } from '@/hooks/useHealthSafety';
import { usePerformance } from '@/hooks/usePerformance';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Upload, Lock, FileSpreadsheet } from 'lucide-react';
import { CurrencySelect } from '@/components/common/CurrencySelect';
import { useTranslation } from '@/hooks/useTranslation';

// === ONBOARDING DIALOG ===
export const CreateOnboardingDialog = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const { createOnboardingProcess } = useOnboardingOffboarding();
  const { t } = useTranslation();
  // We would ideally use useEmployees here, but let's keep it simple for now or import it if needed.
  // Assuming the user wants to enter data manually or select from a list.
  // Let's add the fields from the JSON: employee_name, position, department, start_date.

  const [formData, setFormData] = useState({
    employee_name: '',
    employee_id: '',
    position: '',
    department: '',
    start_date: new Date().toISOString().split('T')[0],
    status: 'pending' as const, // Default from JSON example
    progress: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createOnboardingProcess(formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-panel max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('hrAdvanced.dialogs.onboarding.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee_name">{t('hrAdvanced.dialogs.onboarding.empName')}</Label>
            <Input
              id="employee_name"
              value={formData.employee_name}
              onChange={e => setFormData({ ...formData, employee_name: e.target.value })}
              placeholder={t('hrAdvanced.dialogs.onboarding.empNameHolder')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">{t('hrAdvanced.dialogs.onboarding.position')}</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={e => setFormData({ ...formData, position: e.target.value })}
              placeholder={t('hrAdvanced.dialogs.onboarding.positionHolder')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">{t('hrAdvanced.dialogs.onboarding.department')}</Label>
            <Select
              value={formData.department}
              onValueChange={val => setFormData({ ...formData, department: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operations">{t('hrAdvanced.dialogs.onboarding.deptOps')}</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="RH">{t('hrAdvanced.dialogs.onboarding.deptHR')}</SelectItem>
                <SelectItem value="Sales">{t('hrAdvanced.dialogs.onboarding.deptSales')}</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="start_date">{t('hrAdvanced.dialogs.onboarding.startDate')}</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={e => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit">{t('hrAdvanced.dialogs.onboarding.createBtn')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// === EXPENSE DIALOG ===
export const CreateExpenseReportDialog = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const { createExpenseReport } = useExpenseManagement();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '', // Maps to description in JSON example
    expense_date: new Date().toISOString().split('T')[0],
    category_name: '',
    amount: '', // String to handle decimals better in input
    currency: 'DJF',
    status: 'draft' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Adapt to hook expectation
    await createExpenseReport({
      title: formData.title,
      total_amount: parseFloat(formData.amount) || 0,
      currency: formData.currency,
      status: formData.status,
      employee_id: profile?.employeeId || '',
      employee_name: profile?.fullName || 'Unknown',
      // Additional fields would need to be handled by the hook or backend
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-panel max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('hrAdvanced.dialogs.expense.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense_date">{t('hrAdvanced.dialogs.expense.date')}</Label>
            <Input
              id="expense_date"
              type="date"
              value={formData.expense_date}
              onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">{t('hrAdvanced.dialogs.expense.desc')}</Label>
            <Input
              id="title"
              placeholder={t('hrAdvanced.dialogs.expense.descHolder')}
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">{t('hrAdvanced.dialogs.expense.category')}</Label>
            <Select
              value={formData.category_name}
              onValueChange={val => setFormData({ ...formData, category_name: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Repas">{t('hrAdvanced.dialogs.expense.catMeal')}</SelectItem>
                <SelectItem value="Transport">{t('hrAdvanced.dialogs.expense.catTransport')}</SelectItem>
                <SelectItem value="Hébergement">{t('hrAdvanced.dialogs.expense.catHotel')}</SelectItem>
                <SelectItem value="Fournitures">{t('hrAdvanced.dialogs.expense.catSupplies')}</SelectItem>
                <SelectItem value="Autre">{t('hrAdvanced.dialogs.expense.catOther')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t('hrAdvanced.dialogs.expense.amount')}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{t('hrAdvanced.dialogs.expense.currency')}</Label>
              <CurrencySelect
                value={formData.currency}
                onValueChange={val => setFormData({ ...formData, currency: val })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{t('hrAdvanced.dialogs.expense.createBtn')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// === PAYROLL DIALOGS ===
export const CreatePayrollPeriodDialog = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const { createPayrollPeriod } = usePayrollManagement();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    status: 'draft' as const,
    totalGross: 0,
    totalNet: 0,
    totalEmployees: 0,
    totalCharges: 0,
    currency: 'DJF',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPayrollPeriod(formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-panel max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('hrAdvanced.dialogs.payrollPeriod.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">{t('hrAdvanced.dialogs.payrollPeriod.month')}</Label>
              <Select
                value={formData.month.toString()}
                onValueChange={val => setFormData({ ...formData, month: parseInt(val) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <SelectItem key={m} value={m.toString()}>
                      {new Date(2024, m - 1).toLocaleDateString('fr-FR', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">{t('hrAdvanced.dialogs.payrollPeriod.year')}</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">{t('hrAdvanced.dialogs.payrollPeriod.currency')}</Label>
            <CurrencySelect
              value={formData.currency}
              onValueChange={val => setFormData({ ...formData, currency: val })}
            />
          </div>
          <DialogFooter>
            <Button type="submit">{t('hrAdvanced.dialogs.payrollPeriod.initBtn')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// === SKILLS & TRAINING DIALOGS ===
export const CreateSkillDialog = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const { createSkill } = useSkillsTraining();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSkill({
      ...formData,
      updated_at: new Date().toISOString(),
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-panel max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('hrAdvanced.dialogs.skill.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('hrAdvanced.dialogs.skill.name')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('hrAdvanced.dialogs.skill.nameHolder')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">{t('hrAdvanced.dialogs.skill.category')}</Label>
            <Select
              value={formData.category}
              onValueChange={val => setFormData({ ...formData, category: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technique">{t('hrAdvanced.dialogs.skill.catTech')}</SelectItem>
                <SelectItem value="Soft Skill">{t('hrAdvanced.dialogs.skill.catSoft')}</SelectItem>
                <SelectItem value="Langue">{t('hrAdvanced.dialogs.skill.catLang')}</SelectItem>
                <SelectItem value="Gestion">{t('hrAdvanced.dialogs.skill.catMgmt')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('hrAdvanced.dialogs.skill.desc')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('hrAdvanced.dialogs.skill.descHolder')}
            />
          </div>
          <DialogFooter>
            <Button type="submit">{t('hrAdvanced.dialogs.skill.createBtn')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const CreateSkillAssessmentDialog = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const { createEvaluation } = usePerformance();
  const { employees } = useEmployees();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    employee_id: '',
    period: '',
    type: 'annual' as const,
    overall_score: 5,
    strengths: '',
    areas_for_improvement: '',
    status: 'draft' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEvaluation({
      ...formData,
      evaluator_id: profile?.id ?? 'unknown',
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-panel max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('hrAdvanced.dialogs.evaluation.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">{t('hrAdvanced.dialogs.evaluation.employee')}</Label>
              <Select
                onValueChange={val => setFormData({ ...formData, employee_id: val })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.length === 0 && (
                    <SelectItem value="_none" disabled>{t('hrAdvanced.dialogs.evaluation.noEmp')}</SelectItem>
                  )}
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">{t('hrAdvanced.dialogs.evaluation.period')}</Label>
              <Input
                id="period"
                value={formData.period}
                onChange={e => setFormData({ ...formData, period: e.target.value })}
                placeholder={t('hrAdvanced.dialogs.evaluation.periodHolder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">{t('hrAdvanced.dialogs.evaluation.type')}</Label>
              <Select
                value={formData.type}
                onValueChange={(val: any) => setFormData({ ...formData, type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">{t('hrAdvanced.dialogs.evaluation.typeAnnual')}</SelectItem>
                  <SelectItem value="quarterly">{t('hrAdvanced.dialogs.evaluation.typeQuarterly')}</SelectItem>
                  <SelectItem value="360">360°</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="overall_score">{t('hrAdvanced.dialogs.evaluation.score')}</Label>
              <Input
                id="overall_score"
                type="number"
                min="1"
                max="10"
                value={formData.overall_score}
                onChange={e =>
                  setFormData({ ...formData, overall_score: parseInt(e.target.value) })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strengths">{t('hrAdvanced.dialogs.evaluation.strengths')}</Label>
              <Textarea
                id="strengths"
                value={formData.strengths}
                onChange={e => setFormData({ ...formData, strengths: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="areas_for_improvement">{t('hrAdvanced.dialogs.evaluation.areas')}</Label>
              <Textarea
                id="areas_for_improvement"
                value={formData.areas_for_improvement}
                onChange={e => setFormData({ ...formData, areas_for_improvement: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{t('hrAdvanced.dialogs.evaluation.closeBtn')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// === HEALTH & SAFETY DIALOGS ===
export const CreateIncidentDialog = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const { createIncident } = useHealthSafety();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    type: '',
    severity: 'low' as const,
    description: '',
    location: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createIncident({
      ...formData,
      reportedBy: profile?.fullName || 'Unknown',
      reportedDate: formData.date,
      affectedEmployee: undefined, // Optional
    } as any); // Type cast to avoid strict check issues for now
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-panel max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('hrAdvanced.dialogs.incident.declareTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('hrAdvanced.dialogs.incident.title')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">{t('hrAdvanced.dialogs.incident.date')}</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">{t('hrAdvanced.dialogs.incident.severity')}</Label>
              <Select
                value={formData.severity}
                onValueChange={(val: any) => setFormData({ ...formData, severity: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('hrAdvanced.dialogs.incident.sevLow')}</SelectItem>
                  <SelectItem value="medium">{t('hrAdvanced.dialogs.incident.sevMed')}</SelectItem>
                  <SelectItem value="high">{t('hrAdvanced.dialogs.incident.sevHigh')}</SelectItem>
                  <SelectItem value="critical">{t('hrAdvanced.dialogs.incident.sevCrit')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">{t('hrAdvanced.dialogs.incident.type')}</Label>
            <Select
              value={formData.type}
              onValueChange={val => setFormData({ ...formData, type: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Accident">{t('hrAdvanced.dialogs.incident.typeAcc')}</SelectItem>
                <SelectItem value="Incident">{t('hrAdvanced.dialogs.incident.typeInc')}</SelectItem>
                <SelectItem value="Near Miss">{t('hrAdvanced.dialogs.incident.typeNear')}</SelectItem>
                <SelectItem value="Hazard">{t('hrAdvanced.dialogs.incident.typeHaz')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">{t('hrAdvanced.dialogs.incident.location')}</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('hrAdvanced.dialogs.incident.desc')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="submit">{t('hrAdvanced.dialogs.incident.declareBtn')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const CreateSafetyDocumentDialog = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const { uploadDocument } = useHealthSafety();
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'policy' as const,
    category: '',
    version: '1.0',
    publishedDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    status: 'active' as const,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('safety-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('safety-documents').getPublicUrl(filePath);

      await uploadDocument({
        ...formData,
        downloadUrl: publicUrl,
        expiryDate: formData.expiryDate || undefined,
      });

      setOpen(false);
      setFile(null);
      setFormData({
        title: '',
        type: 'policy',
        category: '',
        version: '1.0',
        publishedDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        status: 'active',
      });
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-panel max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('hrAdvanced.dialogs.safetyDoc.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('hrAdvanced.dialogs.safetyDoc.docTitle')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">{t('hrAdvanced.dialogs.safetyDoc.type')}</Label>
              <Select
                value={formData.type}
                onValueChange={(val: any) => setFormData({ ...formData, type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="policy">{t('hrAdvanced.dialogs.safetyDoc.typePol')}</SelectItem>
                  <SelectItem value="procedure">{t('hrAdvanced.dialogs.safetyDoc.typeProc')}</SelectItem>
                  <SelectItem value="training">{t('hrAdvanced.dialogs.safetyDoc.typeTrain')}</SelectItem>
                  <SelectItem value="certificate">{t('hrAdvanced.dialogs.safetyDoc.typeCert')}</SelectItem>
                  <SelectItem value="inspection">{t('hrAdvanced.dialogs.safetyDoc.typeInsp')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{t('hrAdvanced.dialogs.safetyDoc.category')}</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                placeholder={t('hrAdvanced.dialogs.safetyDoc.catHolder')}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">{t('hrAdvanced.dialogs.safetyDoc.version')}</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={e => setFormData({ ...formData, version: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{t('hrAdvanced.dialogs.safetyDoc.status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(val: any) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('hrAdvanced.dialogs.safetyDoc.statusActive')}</SelectItem>
                  <SelectItem value="draft">{t('hrAdvanced.dialogs.safetyDoc.statusDraft')}</SelectItem>
                  <SelectItem value="expired">{t('hrAdvanced.dialogs.safetyDoc.statusExp')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="publishedDate">{t('hrAdvanced.dialogs.safetyDoc.pubDate')}</Label>
              <Input
                id="publishedDate"
                type="date"
                value={formData.publishedDate}
                onChange={e => setFormData({ ...formData, publishedDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">{t('hrAdvanced.dialogs.safetyDoc.expDate')}</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">{t('hrAdvanced.dialogs.safetyDoc.file')}</Label>
            <Input id="file" type="file" onChange={handleFileChange} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={uploading}>
              {uploading ? t('hrAdvanced.dialogs.safetyDoc.uploadingBtn') : (
                <><Upload className="mr-2 h-4 w-4" />{t('hrAdvanced.dialogs.safetyDoc.uploadBtn')}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};