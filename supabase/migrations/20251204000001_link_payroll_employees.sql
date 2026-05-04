-- Add user_id to paie_employes to link with system employees
ALTER TABLE public.paie_employes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.employees(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_paie_employes_user_id ON public.paie_employes(user_id);
