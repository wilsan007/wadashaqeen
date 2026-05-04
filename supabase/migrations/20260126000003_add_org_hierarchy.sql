-- Migration: Hiérarchie Organisationnelle
-- Description: Ajout de la table des niveaux hiérarchiques et mise à jour de la table employés

-- 1. Table des niveaux hiérarchiques
CREATE TABLE IF NOT EXISTS organization_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    name TEXT NOT NULL,          -- Ex: "Directeur Général", "Stagiaire"
    rank_order INTEGER NOT NULL, -- 0 (Le plus haut), 1, 2...
    color_code TEXT DEFAULT '#3b82f6', -- Couleur par défaut (bleu)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unicité du rang et du nom par tenant
    CONSTRAINT unique_rank_per_tenant UNIQUE(tenant_id, rank_order),
    CONSTRAINT unique_name_per_tenant UNIQUE(tenant_id, name)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_org_levels_tenant_rank ON organization_levels(tenant_id, rank_order);

-- Commentaires
COMMENT ON TABLE organization_levels IS 'Définition des niveaux hiérarchiques par tenant';
COMMENT ON COLUMN organization_levels.rank_order IS '0 est le niveau le plus élevé (ex: Ministre/PDG)';

-- RLS Policies
ALTER TABLE organization_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users"
ON organization_levels FOR SELECT
USING (
    tenant_id = (
        SELECT tenant_id 
        FROM user_roles 
        WHERE user_id = auth.uid() 
        AND is_active = true 
        LIMIT 1
    )
    OR 
    -- Permettre aussi la lecture si on est un utilisateur du client (cas public ou autre)
    -- Mais ici on restrein aux membres du tenant
    tenant_id IN (
        SELECT tenant_id FROM employees WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Enable write access for tenant admins"
ON organization_levels FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id 
        FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role_id IN (
            SELECT id FROM roles WHERE name IN ('tenant_admin', 'owner', 'super_admin', 'manager_hr')
        )
    )
);

-- 2. Liaison avec la table employés
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS organization_level_id UUID REFERENCES organization_levels(id);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_employees_org_level ON employees(organization_level_id);
