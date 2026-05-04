import { supabase } from '@/integrations/supabase/client';

export interface OrganizationLevel {
  id: string;
  tenant_id: string;
  name: string;
  rank_order: number;
  color_code: string;
  description?: string;
}

export type NewOrganizationLevel = Omit<OrganizationLevel, 'id' | 'tenant_id'>;

export const HierarchyService = {
  /**
   * Fetch all hierarchy levels for the current tenant, sorted by rank (highest to lowest)
   */
  async getLevels(tenantId: string): Promise<OrganizationLevel[]> {
    const { data, error } = await supabase
      .from('organization_levels' as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('rank_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new hierarchy level
   */
  async createLevel(tenantId: string, level: NewOrganizationLevel): Promise<OrganizationLevel> {
    const { data, error } = await supabase
      .from('organization_levels' as any)
      .insert({ ...level, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing level
   */
  async updateLevel(id: string, updates: Partial<OrganizationLevel>): Promise<OrganizationLevel> {
    const { data, error } = await supabase
      .from('organization_levels' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a level
   */
  async deleteLevel(id: string): Promise<void> {
    const { error } = await supabase
      .from('organization_levels' as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Apply a preset template (deletes existing and inserts new)
   * WARNING: This effectively resets the hierarchy configuration
   */
  async applyTemplate(
    tenantId: string,
    templateType: 'ministry' | 'corporate' | 'startup'
  ): Promise<void> {
    // 1. Delete existing levels (Optional: check if used by employees first?)
    // For now, we assume this is a setup action.
    const { error: deleteError } = await supabase
      .from('organization_levels' as any)
      .delete()
      .eq('tenant_id', tenantId);

    if (deleteError) throw deleteError;

    // 2. Define templates
    let levels: NewOrganizationLevel[] = [];

    if (templateType === 'ministry') {
      levels = [
        { name: 'Ministre', rank_order: 0, color_code: '#dc2626' }, // Rouge
        { name: 'Secrétaire Général', rank_order: 1, color_code: '#ea580c' }, // Orange
        { name: 'Directeur', rank_order: 2, color_code: '#d97706' }, // Ambre
        { name: 'Chef de Service', rank_order: 3, color_code: '#65a30d' }, // Lime
        { name: 'Chef de Bureau', rank_order: 4, color_code: '#059669' }, // Emerald
        { name: 'Cadre', rank_order: 5, color_code: '#0284c7' }, // Sky
        { name: 'Agent Administratif', rank_order: 6, color_code: '#4f46e5' }, // Indigo
        { name: 'Stagiaire', rank_order: 7, color_code: '#9333ea' }, // Purple
      ];
    } else if (templateType === 'corporate') {
      levels = [
        { name: 'Président Directeur Général (PDG)', rank_order: 0, color_code: '#1e3a8a' },
        { name: 'Directeur Général Adjoint', rank_order: 1, color_code: '#1e40af' },
        { name: 'Directeur', rank_order: 2, color_code: '#1d4ed8' },
        { name: 'Manager', rank_order: 3, color_code: '#2563eb' },
        { name: 'Chef de Projet', rank_order: 4, color_code: '#3b82f6' },
        { name: 'Employé', rank_order: 5, color_code: '#60a5fa' },
        { name: 'Stagiaire', rank_order: 6, color_code: '#93c5fd' },
      ];
    } else if (templateType === 'startup') {
      levels = [
        { name: 'Co-Founder / CEO', rank_order: 0, color_code: '#000000' },
        { name: 'CTO / COO', rank_order: 1, color_code: '#374151' },
        { name: 'Lead / Head of', rank_order: 2, color_code: '#4b5563' },
        { name: 'Senior', rank_order: 3, color_code: '#6b7280' },
        { name: 'Junior', rank_order: 4, color_code: '#9ca3af' },
        { name: 'Intern', rank_order: 5, color_code: '#d1d5db' },
      ];
    }

    // 3. Insert new levels
    const levelsWithTenant = levels.map(l => ({ ...l, tenant_id: tenantId }));
    const { error: insertError } = await supabase
      .from('organization_levels' as any)
      .insert(levelsWithTenant);

    if (insertError) throw insertError;
  },
};
