-- Add missing columns to paie_periodes
ALTER TABLE public.paie_periodes 
ADD COLUMN IF NOT EXISTS date_debut DATE,
ADD COLUMN IF NOT EXISTS date_fin DATE,
ADD COLUMN IF NOT EXISTS est_paye BOOLEAN DEFAULT false;

-- Update existing periods (if any) to have default dates based on month/year
UPDATE public.paie_periodes
SET 
    date_debut = make_date(annee, mois, 1),
    date_fin = (make_date(annee, mois, 1) + INTERVAL '1 month' - INTERVAL '1 day')::DATE
WHERE date_debut IS NULL;

-- Make columns not null after population
ALTER TABLE public.paie_periodes 
ALTER COLUMN date_debut SET NOT NULL,
ALTER COLUMN date_fin SET NOT NULL;
