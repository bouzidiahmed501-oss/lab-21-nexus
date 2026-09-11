ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS motif_refus text;

CREATE TABLE public.devis_suivi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id uuid NOT NULL REFERENCES public.devis(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('creation', 'revision', 'relance', 'envoi', 'refus', 'statut')),
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.devis_suivi TO authenticated;
GRANT ALL ON public.devis_suivi TO service_role;

ALTER TABLE public.devis_suivi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read quote follow-up"
ON public.devis_suivi FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create quote follow-up"
ON public.devis_suivi FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update own quote follow-up"
ON public.devis_suivi FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can delete own quote follow-up"
ON public.devis_suivi FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE INDEX devis_suivi_devis_created_idx ON public.devis_suivi(devis_id, created_at DESC);