ALTER TABLE public.echantillons
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.echantillons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS aliquot_index integer;
CREATE INDEX IF NOT EXISTS idx_echantillons_parent ON public.echantillons(parent_id);