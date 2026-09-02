ALTER TABLE public.analyse_resultats
  ADD COLUMN IF NOT EXISTS equipement_id uuid REFERENCES public.equipements(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reactif_id uuid REFERENCES public.reactifs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lot_reactif text,
  ADD COLUMN IF NOT EXISTS operateur_id uuid,
  ADD COLUMN IF NOT EXISTS repetition integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS motif_reprise text;

CREATE INDEX IF NOT EXISTS idx_analyse_resultats_equipement ON public.analyse_resultats(equipement_id);
CREATE INDEX IF NOT EXISTS idx_analyse_resultats_reactif ON public.analyse_resultats(reactif_id);