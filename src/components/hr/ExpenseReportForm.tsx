/**
 * 💰 Formulaire Note de Frais - Pattern Expensify/SAP Concur
 */

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useHRSelfService } from '@/hooks/useHRSelfService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Receipt, CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const EXPENSE_CATEGORIES = [
  { value: 'transport', label: 'Transport' },
  { value: 'repas', label: 'Repas' },
  { value: 'hebergement', label: 'Hébergement' },
  { value: 'materiel', label: 'Matériel' },
  { value: 'formation', label: 'Formation' },
  { value: 'autres', label: 'Autres' },
];

const CURRENCIES = [
  { value: 'EUR', label: '€ Euro' },
  { value: 'USD', label: '$ Dollar' },
  { value: 'GBP', label: '£ Livre' },
];

const expenseReportSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  category: z.string().min(1, 'La catégorie est requise'),
  amount: z.coerce
    .number({ invalid_type_error: 'Montant invalide' })
    .positive('Le montant doit être supérieur à 0'),
  currency: z.string().min(1, 'La devise est requise'),
  expenseDate: z.date({ required_error: 'La date est requise' }),
  receiptUrl: z.string().url('URL invalide').optional().or(z.literal('')),
});

type ExpenseReportValues = z.infer<typeof expenseReportSchema>;

interface ExpenseReportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ExpenseReportForm({ onSuccess, onCancel }: ExpenseReportFormProps) {
  const { createExpenseReport, loading } = useHRSelfService();

  // UI-only state for calendar popover
  const [calendarOpen, setCalendarOpen] = useState(false);

  const form = useForm<ExpenseReportValues>({
    resolver: zodResolver(expenseReportSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      amount: undefined,
      currency: 'EUR',
      expenseDate: new Date(),
      receiptUrl: '',
    },
  });

  const onSubmit = form.handleSubmit(async (data: ExpenseReportValues) => {
    await createExpenseReport({
      title: data.title,
      description: data.description ?? '',
      category: data.category,
      amount: data.amount,
      currency: data.currency,
      expense_date: format(data.expenseDate, 'yyyy-MM-dd'),
      receipt_url: data.receiptUrl || null,
    });

    form.reset({
      title: '',
      description: '',
      category: '',
      amount: undefined,
      currency: 'EUR',
      expenseDate: new Date(),
      receiptUrl: '',
    });

    onSuccess?.();
  });

  const expenseDate = form.watch('expenseDate');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Nouvelle Note de Frais
        </CardTitle>
        <CardDescription>Soumettez vos frais professionnels pour remboursement</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Titre */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Déplacement client Paris" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Catégorie */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Montant et Devise */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Devise</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map(curr => (
                          <SelectItem key={curr.value} value={curr.value}>
                            {curr.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date */}
            <FormField
              control={form.control}
              name="expenseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de la dépense *</FormLabel>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, 'PPP', { locale: fr })
                          ) : (
                            <span>Sélectionner une date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={date => {
                          field.onChange(date);
                          setCalendarOpen(false);
                        }}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Détails de la dépense..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reçu/Facture */}
            <FormField
              control={form.control}
              name="receiptUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reçu / Facture (URL)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input type="url" placeholder="https://..." {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Téléchargez ou collez le lien du justificatif
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                  Annuler
                </Button>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Soumettre pour approbation'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
