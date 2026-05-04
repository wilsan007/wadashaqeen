-- Synchronisation des dates d'embauche
-- Copie hire_date de employees vers date_embauche de paie_employes

-- 1. Mise à jour massive des employés existants
UPDATE paie_employes pe
SET date_embauche = e.hire_date
FROM employees e
WHERE pe.user_id = e.id
AND pe.date_embauche IS NULL
AND e.hire_date IS NOT NULL;

-- 2. Mise à jour de la fonction de synchronisation (si elle existe)
-- Nous devons nous assurer que lors de la création d'un employé dans paie_employes,
-- la date d'embauche est bien récupérée depuis employees

CREATE OR REPLACE FUNCTION sync_employee_hire_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Si date_embauche est null, essayer de la récupérer depuis employees
    IF NEW.date_embauche IS NULL AND NEW.user_id IS NOT NULL THEN
        SELECT hire_date INTO NEW.date_embauche
        FROM employees
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour l'insertion/mise à jour
DROP TRIGGER IF EXISTS ensure_hire_date_monitor_trigger ON paie_employes;
CREATE TRIGGER ensure_hire_date_monitor_trigger
    BEFORE INSERT OR UPDATE ON paie_employes
    FOR EACH ROW
    EXECUTE FUNCTION sync_employee_hire_date();
