-- Migration: Ajout de la Prime d'Ancienneté
-- Date: 2026-01-26
-- Description: Ajoute les tables et colonnes nécessaires pour gérer la prime d'ancienneté

-- ============================================================================
-- 1. MODIFICATIONS DE LA TABLE paie_employes
-- ============================================================================

-- Ajouter date_embauche et champs de suivi de la prime
ALTER TABLE paie_employes 
ADD COLUMN IF NOT EXISTS date_embauche DATE,
ADD COLUMN IF NOT EXISTS prime_anciennete_dernier_salaire DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS prime_anciennete_derniere_maj TIMESTAMP WITH TIME ZONE;

-- Index pour optimiser les requêtes sur date_embauche
CREATE INDEX IF NOT EXISTS idx_paie_employes_date_embauche 
ON paie_employes(date_embauche) WHERE date_embauche IS NOT NULL;

-- ============================================================================
-- 2. TABLE DE CONFIGURATION DE LA PRIME D'ANCIENNETÉ
-- ============================================================================

CREATE TABLE IF NOT EXISTS config_prime_anciennete (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Paramètres de calcul
    pourcentage_augmentation DECIMAL(5, 2) NOT NULL DEFAULT 2.00, -- 2% par défaut
    periode_augmentation_mois INT NOT NULL DEFAULT 24, -- 24 mois = 2 ans
    plafond_pourcentage DECIMAL(5, 2) NOT NULL DEFAULT 50.00, -- 50% du salaire de base
    
    -- Date de référence (mois anniversaire)
    utiliser_mois_embauche BOOLEAN DEFAULT true,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Une seule configuration par tenant
    CONSTRAINT unique_config_per_tenant UNIQUE(tenant_id)
);

-- Commentaires pour documentation
COMMENT ON TABLE config_prime_anciennete IS 'Configuration de la prime d''ancienneté par tenant';
COMMENT ON COLUMN config_prime_anciennete.pourcentage_augmentation IS 'Pourcentage d''augmentation de la prime (ex: 2.00 pour 2%)';
COMMENT ON COLUMN config_prime_anciennete.periode_augmentation_mois IS 'Nombre de mois entre chaque augmentation (ex: 24 pour 2 ans)';
COMMENT ON COLUMN config_prime_anciennete.plafond_pourcentage IS 'Plafond maximum de la prime en % du salaire de base (ex: 50.00 pour 50%)';

-- RLS Policy
ALTER TABLE config_prime_anciennete ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation for config_prime_anciennete" 
ON config_prime_anciennete
FOR ALL TO authenticated
USING (tenant_id = (current_setting('app.current_tenant_id', true)::uuid));

-- ============================================================================
-- 3. TABLE DES PÉRIODES DE GEL
-- ============================================================================

CREATE TABLE IF NOT EXISTS periodes_gel_anciennete (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Période de gel
    date_debut DATE NOT NULL,
    date_fin DATE, -- NULL = gel en cours
    motif TEXT,
    
    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes de recherche de périodes actives
CREATE INDEX IF NOT EXISTS idx_periodes_gel_dates 
ON periodes_gel_anciennete(tenant_id, date_debut, date_fin);

-- Commentaires
COMMENT ON TABLE periodes_gel_anciennete IS 'Périodes pendant lesquelles la prime d''ancienneté est gelée (n''augmente pas)';
COMMENT ON COLUMN periodes_gel_anciennete.date_fin IS 'NULL indique un gel toujours en cours';

-- RLS Policy
ALTER TABLE periodes_gel_anciennete ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation for periodes_gel_anciennete" 
ON periodes_gel_anciennete
FOR ALL TO authenticated
USING (tenant_id = (current_setting('app.current_tenant_id', true)::uuid));

-- ============================================================================
-- 4. MODIFICATION DE LA TABLE paie_bulletins
-- ============================================================================

-- Ajouter la colonne prime_anciennete
ALTER TABLE paie_bulletins
ADD COLUMN IF NOT EXISTS prime_anciennete DECIMAL(12, 2) DEFAULT 0;

-- Commentaire
COMMENT ON COLUMN paie_bulletins.prime_anciennete IS 'Montant de la prime d''ancienneté inclus dans ce bulletin';

-- ============================================================================
-- 5. FONCTION HELPER POUR CALCULER LES ANNÉES D'ANCIENNETÉ
-- ============================================================================

CREATE OR REPLACE FUNCTION calculer_anciennete_effective(
    p_date_embauche DATE,
    p_date_reference DATE,
    p_tenant_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
    v_mois_total INT;
    v_mois_geles INT := 0;
    v_periode RECORD;
BEGIN
    -- Calculer le nombre total de mois entre embauche et référence
    v_mois_total := EXTRACT(YEAR FROM AGE(p_date_reference, p_date_embauche)) * 12 + 
                    EXTRACT(MONTH FROM AGE(p_date_reference, p_date_embauche));
    
    -- Soustraire les mois gelés
    FOR v_periode IN 
        SELECT date_debut, COALESCE(date_fin, p_date_reference) as date_fin
        FROM periodes_gel_anciennete
        WHERE tenant_id = p_tenant_id
          AND date_debut <= p_date_reference
          AND (date_fin IS NULL OR date_fin >= p_date_embauche)
    LOOP
        -- Calculer l'intersection entre la période de gel et la période d'ancienneté
        v_mois_geles := v_mois_geles + (
            EXTRACT(YEAR FROM AGE(
                LEAST(v_periode.date_fin, p_date_reference),
                GREATEST(v_periode.date_debut, p_date_embauche)
            )) * 12 + 
            EXTRACT(MONTH FROM AGE(
                LEAST(v_periode.date_fin, p_date_reference),
                GREATEST(v_periode.date_debut, p_date_embauche)
            ))
        );
    END LOOP;
    
    -- Retourner l'ancienneté effective en mois
    RETURN GREATEST(0, v_mois_total - v_mois_geles);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculer_anciennete_effective IS 'Calcule l''ancienneté effective d''un employé en excluant les périodes de gel';

-- ============================================================================
-- 6. TRIGGER POUR METTRE À JOUR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur config_prime_anciennete
DROP TRIGGER IF EXISTS update_config_prime_anciennete_updated_at ON config_prime_anciennete;
CREATE TRIGGER update_config_prime_anciennete_updated_at
    BEFORE UPDATE ON config_prime_anciennete
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Appliquer le trigger sur periodes_gel_anciennete
DROP TRIGGER IF EXISTS update_periodes_gel_anciennete_updated_at ON periodes_gel_anciennete;
CREATE TRIGGER update_periodes_gel_anciennete_updated_at
    BEFORE UPDATE ON periodes_gel_anciennete
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. DONNÉES INITIALES (OPTIONNEL)
-- ============================================================================

-- Note: Les configurations par défaut seront créées automatiquement 
-- lors de la première utilisation par chaque tenant via l'application
-- Ceci évite de polluer la DB avec des configs inutiles

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
