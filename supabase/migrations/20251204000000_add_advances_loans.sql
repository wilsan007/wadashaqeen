-- Create table for advances and loans
CREATE TABLE IF NOT EXISTS public.paie_avances_prets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employe_id UUID NOT NULL REFERENCES public.paie_employes(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('avance', 'pret')),
    montant DECIMAL(12, 2) NOT NULL,
    date_demande DATE NOT NULL DEFAULT CURRENT_DATE,
    date_debut_remboursement DATE,
    mensualite DECIMAL(12, 2), -- For loans
    statut TEXT NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'rembourse', 'annule')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS
ALTER TABLE public.paie_avances_prets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.paie_avances_prets
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.paie_avances_prets
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON public.paie_avances_prets
    FOR UPDATE
    TO authenticated
    USING (true);

-- Add retenue_pret to paie_bulletins if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'paie_bulletins' AND column_name = 'retenue_pret') THEN
        ALTER TABLE public.paie_bulletins ADD COLUMN retenue_pret DECIMAL(12, 2) DEFAULT 0;
    END IF;
END $$;
