-- Migration: Ajout de la hiérarchie des départements et colonne manager_id
-- Permet de définir des sous-services (ex: Service IT sous Département Support)

-- 1. Ajout de parent_id à la table departments
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES departments(id),
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES employees(id); -- Chef de département

-- 2. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager ON departments(manager_id);

-- 3. Vue récursive pour voir toute la descendance d'un département
-- Utile pour les permissions : "Est-ce que Dept B est sous Dept A ?"
CREATE OR REPLACE VIEW department_hierarchy AS
WITH RECURSIVE dept_tree AS (
    -- Base : tous les départements
    SELECT 
        id, 
        name, 
        parent_id, 
        id as root_id, 
        1 as level,
        ARRAY[id] as path
    FROM departments
    
    UNION ALL
    
    -- Récursion : trouver les enfants
    SELECT 
        d.id, 
        d.name, 
        d.parent_id, 
        dt.root_id, 
        dt.level + 1,
        dt.path || d.id
    FROM departments d
    JOIN dept_tree dt ON d.parent_id = dt.id
)
SELECT * FROM dept_tree;

-- 4. Fonction pour vérifier si un employé a le pouvoir sur un autre
-- Basé sur : (Rank A < Rank B) AND (Dept B est descendant de Dept A)
CREATE OR REPLACE FUNCTION check_hierarchical_power(
    manager_user_id UUID, 
    target_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    manager_rank INTEGER;
    target_rank INTEGER;
    manager_dept_id UUID;
    target_dept_id UUID;
BEGIN
    -- Récupérer infos Manager
    SELECT 
        ol.rank_order, e.department_id 
    INTO 
        manager_rank, manager_dept_id
    FROM employees e
    LEFT JOIN organization_levels ol ON e.organization_level_id = ol.id
    WHERE e.user_id = manager_user_id;

    -- Récupérer infos Cible
    SELECT 
        ol.rank_order, e.department_id 
    INTO 
        target_rank, target_dept_id
    FROM employees e
    LEFT JOIN organization_levels ol ON e.organization_level_id = ol.id
    WHERE e.user_id = target_user_id;

    -- Si l'un des deux n'a pas de rang défini, pas de pouvoir (ou logique par défaut)
    IF manager_rank IS NULL OR target_rank IS NULL THEN
        RETURN FALSE;
    END IF;

    -- 1. Vérifier le rang (Le manager doit avoir un rang INFÉRIEUR, donc plus haut gradé)
    -- Ex: Ministre (0) < Directeur (1) -> TRUE
    IF manager_rank >= target_rank THEN
        RETURN FALSE;
    END IF;

    -- 2. Vérifier la portée (Scope)
    -- Si Manager est Rank 0 ou 1 (Ex: SG ou Ministre), il a pouvoir GLOBAL sur le tenant
    IF manager_rank <= 1 THEN
        RETURN TRUE;
    END IF;

    -- Sinon, il ne peut gérer que SA propre branche départementale
    -- On vérifie si le department cible est un descendant du department manager
    RETURN EXISTS (
        SELECT 1 
        FROM department_hierarchy 
        WHERE id = target_dept_id 
        AND root_id = manager_dept_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
