import React, { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EmployeePayrollFormProps {
  employeeId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const employeePayrollSchema = z.object({
  nom_complet: z.string().min(1, 'Le nom complet est requis'),
  fonction: z.string().min(1, 'La fonction est requise'),
  date_embauche: z.string().optional(),
  salaire_base: z.coerce.number({ invalid_type_error: 'Valeur invalide' }).min(0, 'Doit être ≥ 0'),
  prime_fonction_fixe: z.coerce.number({ invalid_type_error: 'Valeur invalide' }).min(0, 'Doit être ≥ 0'),
  prime_responsabilite_fixe: z.coerce.number({ invalid_type_error: 'Valeur invalide' }).min(0, 'Doit être ≥ 0'),
  prime_transport_fixe: z.coerce.number({ invalid_type_error: 'Valeur invalide' }).min(0, 'Doit être ≥ 0'),
  prime_logement_fixe: z.coerce.number({ invalid_type_error: 'Valeur invalide' }).min(0, 'Doit être ≥ 0'),
  retenue_waqf_fixe: z.coerce.number({ invalid_type_error: 'Valeur invalide' }).min(0, 'Doit être ≥ 0'),
});

type EmployeePayrollValues = z.infer<typeof employeePayrollSchema>;

const DEFAULT_VALUES: EmployeePayrollValues = {
  nom_complet: '',
  fonction: '',
  date_embauche: '',
  salaire_base: 0,
  prime_fonction_fixe: 0,
  prime_responsabilite_fixe: 0,
  prime_transport_fixe: 0,
  prime_logement_fixe: 0,
  retenue_waqf_fixe: 400,
};

export const EmployeePayrollForm: React.FC<EmployeePayrollFormProps> = ({
  employeeId,
  onClose,
  onSuccess,
}) => {
  const form = useForm<EmployeePayrollValues>({
    resolver: zodResolver(employeePayrollSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { formState: { isSubmitting } } = form;

  useEffect(() => {
    if (employeeId) {
      loadEmployee();
    }
  }, [employeeId]);

  const loadEmployee = async () => {
    const { data } = await supabase.from('paie_employes').select('*').eq('id', employeeId).single();

    if (data) {
      form.reset({
        nom_complet: data.nom_complet ?? '',
        fonction: data.fonction ?? '',
        date_embauche: data.date_embauche ?? '',
        salaire_base: data.salaire_base ?? 0,
        prime_fonction_fixe: data.prime_fonction_fixe ?? 0,
        prime_responsabilite_fixe: data.prime_responsabilite_fixe ?? 0,
        prime_transport_fixe: data.prime_transport_fixe ?? 0,
        prime_logement_fixe: data.prime_logement_fixe ?? 0,
        retenue_waqf_fixe: data.retenue_waqf_fixe ?? 400,
      });
    }
  };

  const onSubmit = form.handleSubmit(async (data: EmployeePayrollValues) => {
    try {
      const payload = {
        ...data,
        date_embauche: data.date_embauche || null,
      };

      if (employeeId) {
        const { error } = await supabase
          .from('paie_employes')
          .update(payload)
          .eq('id', employeeId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('paie_employes').insert([payload as any]);
        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast({ title: 'Erreur', description: 'Erreur lors de la sauvegarde.', variant: 'destructive' });
    }
  });

  type FieldName = keyof EmployeePayrollValues;

  const InputField = ({
    label,
    name,
    type = 'text',
    required = false,
  }: {
    label: string;
    name: FieldName;
    type?: string;
    required?: boolean;
  }) => {
    const { register, formState: { errors } } = form;
    const error = errors[name];

    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={type}
          {...register(name)}
          className="w-full rounded-md border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        {error && (
          <p className="mt-1 text-xs text-red-500">{error.message as string}</p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {employeeId ? "Modifier l'employé" : 'Nouvel employé'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 p-6">
          {/* Section: Informations Générales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Informations Générales
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField label="Nom Complet" name="nom_complet" required />
              <InputField label="Fonction" name="fonction" required />
              <InputField label="Date d'embauche" name="date_embauche" type="date" />
            </div>
          </div>

          {/* Section: Salaire et Primes Fixes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Salaire et Primes Fixes
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="Salaire de Base (FDJ)"
                name="salaire_base"
                type="number"
                required
              />
              <InputField
                label="Prime de Fonction (FDJ)"
                name="prime_fonction_fixe"
                type="number"
              />
              <InputField
                label="Prime de Responsabilité (FDJ)"
                name="prime_responsabilite_fixe"
                type="number"
              />
              <InputField
                label="Prime de Transport (FDJ)"
                name="prime_transport_fixe"
                type="number"
              />
              <InputField
                label="Prime de Logement (FDJ)"
                name="prime_logement_fixe"
                type="number"
              />
              <InputField label="Retenue Waqf (FDJ)" name="retenue_waqf_fixe" type="number" />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
