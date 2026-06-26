/**
 * 🏠 Dialog Demande Télétravail - Pattern Notion/Linear
 */

import { useState } from 'react';
import { useHRSelfService } from '@/hooks/useHRSelfService';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from '@/components/ui/responsive-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Home, CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from '@/hooks/useTranslation';

// Note: Translations handle frequencies locally in component
// as they are static strings. We can also fetch them dynamically if needed.

interface RemoteWorkRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RemoteWorkRequestDialog({
  open,
  onOpenChange,
  onSuccess,
}: RemoteWorkRequestDialogProps) {
  const { createRemoteWorkRequest, loading } = useHRSelfService();
  const { t } = useTranslation();

  const FREQUENCIES = [
    { value: 'one_time', label: t('hrAdvanced.dialogs.remoteWork.freqOneTime') },
    { value: 'weekly', label: t('hrAdvanced.dialogs.remoteWork.freqWeekly') },
    { value: 'bi_weekly', label: t('hrAdvanced.dialogs.remoteWork.freqBiWeekly') },
    { value: 'monthly', label: t('hrAdvanced.dialogs.remoteWork.freqMonthly') },
  ];

  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [frequency, setFrequency] = useState('one_time');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !reason) {
      return;
    }

    await createRemoteWorkRequest({
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: endDate ? format(endDate, 'yyyy-MM-dd') : format(startDate, 'yyyy-MM-dd'),
      frequency,
      reason,
    });

    // Reset form
    setStartDate(new Date());
    setEndDate(undefined);
    setFrequency('one_time');
    setReason('');

    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="max-w-2xl">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            {t('hrAdvanced.dialogs.remoteWork.title')}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            {t('hrAdvanced.dialogs.remoteWork.desc')}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t('hrAdvanced.dialogs.remoteWork.alert')}
            </AlertDescription>
          </Alert>

          {/* Fréquence */}
          <div className="space-y-2">
            <Label>{t('hrAdvanced.dialogs.remoteWork.typeLabel')}</Label>
            <Select value={frequency} onValueChange={setFrequency} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map(freq => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Date début */}
            <div className="space-y-2">
              <Label>{t('hrAdvanced.dialogs.remoteWork.startDate')}</Label>
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
                    {startDate ? (
                      format(startDate, 'PPP', { locale: fr })
                    ) : (
                      <span>{t('hrAdvanced.dialogs.remoteWork.select')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date fin */}
            {frequency !== 'one_time' && (
              <div className="space-y-2">
                <Label>{t('hrAdvanced.dialogs.remoteWork.endDate')}</Label>
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
                      {endDate ? format(endDate, 'PPP', { locale: fr }) : <span>{t('hrAdvanced.dialogs.remoteWork.undetermined')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      locale={fr}
                      disabled={date => (startDate ? date < startDate : false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Raison */}
          <div className="space-y-2">
            <Label htmlFor="reason">{t('hrAdvanced.dialogs.remoteWork.reason')}</Label>
            <Textarea
              id="reason"
              placeholder={t('hrAdvanced.dialogs.remoteWork.reasonHolder')}
              rows={4}
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
            />
            <p className="text-muted-foreground text-xs">
              {t('hrAdvanced.dialogs.remoteWork.reasonHint')}
            </p>
          </div>

          {/* Informations complémentaires */}
          <div className="bg-muted/50 space-y-2 rounded-lg p-4 text-sm">
            <p className="font-medium">{t('hrAdvanced.dialogs.remoteWork.rulesTitle')}</p>
            <ul className="text-muted-foreground list-inside list-disc space-y-1">
              <li>{t('hrAdvanced.dialogs.remoteWork.rule1')}</li>
              <li>{t('hrAdvanced.dialogs.remoteWork.rule2')}</li>
              <li>{t('hrAdvanced.dialogs.remoteWork.rule3')}</li>
              <li>{t('hrAdvanced.dialogs.remoteWork.rule4')}</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('hrAdvanced.dialogs.remoteWork.cancelBtn')}
            </Button>
            <Button type="submit" disabled={loading || !startDate || !reason}>
              {loading ? t('hrAdvanced.dialogs.remoteWork.submittingBtn') : t('hrAdvanced.dialogs.remoteWork.submitBtn')}
            </Button>
          </div>
        </form>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
