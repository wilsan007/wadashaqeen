import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PaieEmploye } from '../../types/payroll';

interface EmployeePayrollFormProps {
  employeeId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmployeePayrollForm: React.FC<EmployeePayrollFormProps> = ({
  employeeId,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Partial<PaieEmploye>>({
    nom_complet: '',
    fonction: '',
    salaire_base: 0,
    prime_fonction_fixe: 0,
    prime_responsabilite_fixe: 0,
    prime_transport_fixe: 0,
    prime_logement_fixe: 0,
    retenue_waqf_fixe: 400, // Default value
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employeeId) {
      loadEmployee();
    }
  }, [employeeId]);

  const loadEmployee = async () => {
    const { data } = await supabase.from('paie_employes').select('*').eq('id', employeeId).single();

    if (data) {
      setFormData(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (employeeId) {
        // Update
        const { error } = await supabase
          .from('paie_employes')
          .update(formData)
          .eq('id', employeeId);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('paie_employes').insert([formData as any]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({
    label,
    name,
    type = 'text',
    required = false,
  }: {
    label: string;
    name: keyof PaieEmploye;
    type?: string;
    required?: boolean;
  }) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name] || ''}
        onChange={e =>
          setFormData({
            ...formData,
            [name]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
          })
        }
        required={required}
        className="w-full rounded-md border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      />
    </div>
  );

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

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
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
              disabled={loading}
              className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
