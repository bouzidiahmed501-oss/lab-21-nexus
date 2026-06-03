
DO $$ BEGIN
  CREATE TYPE devis_statut AS ENUM ('brouillon','envoye','accepte','refuse','expire','converti');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.devis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  client_id uuid NOT NULL,
  date_devis date NOT NULL DEFAULT CURRENT_DATE,
  validite_jours integer NOT NULL DEFAULT 30,
  statut devis_statut NOT NULL DEFAULT 'brouillon',
  objet text,
  reference_client text,
  conditions text,
  notes text,
  total_ht numeric NOT NULL DEFAULT 0,
  total_tva numeric NOT NULL DEFAULT 0,
  total_ttc numeric NOT NULL DEFAULT 0,
  remise_pct numeric NOT NULL DEFAULT 0,
  bc_id uuid,
  envoye_at timestamptz,
  accepte_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devis TO authenticated;
GRANT ALL ON public.devis TO service_role;
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_devis ON public.devis;
CREATE POLICY read_devis ON public.devis FOR SELECT TO authenticated
USING ((NOT has_role(auth.uid(),'client'::app_role)) OR client_id = current_user_client_id());

DROP POLICY IF EXISTS write_devis ON public.devis;
CREATE POLICY write_devis ON public.devis FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'direction'::app_role) OR has_role(auth.uid(),'commercial'::app_role))
WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'direction'::app_role) OR has_role(auth.uid(),'commercial'::app_role));

DROP TRIGGER IF EXISTS trg_devis_updated ON public.devis;
CREATE TRIGGER trg_devis_updated BEFORE UPDATE ON public.devis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.devis_lignes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id uuid NOT NULL REFERENCES public.devis(id) ON DELETE CASCADE,
  ordre integer NOT NULL DEFAULT 0,
  designation text NOT NULL,
  parametre_id uuid,
  produit_id uuid,
  quantite numeric NOT NULL DEFAULT 1,
  prix_unitaire numeric NOT NULL DEFAULT 0,
  remise_pct numeric NOT NULL DEFAULT 0,
  tva_pct numeric NOT NULL DEFAULT 19,
  total_ht numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devis_lignes TO authenticated;
GRANT ALL ON public.devis_lignes TO service_role;
ALTER TABLE public.devis_lignes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_devis_lignes ON public.devis_lignes;
CREATE POLICY read_devis_lignes ON public.devis_lignes FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.devis d WHERE d.id = devis_lignes.devis_id
  AND ((NOT has_role(auth.uid(),'client'::app_role)) OR d.client_id = current_user_client_id())));

DROP POLICY IF EXISTS write_devis_lignes ON public.devis_lignes;
CREATE POLICY write_devis_lignes ON public.devis_lignes FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'direction'::app_role) OR has_role(auth.uid(),'commercial'::app_role))
WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'direction'::app_role) OR has_role(auth.uid(),'commercial'::app_role));

ALTER TABLE public.bons_commande ADD COLUMN IF NOT EXISTS devis_id uuid;

INSERT INTO public.numbering_sequences (code, label, prefix, format_template, padding, current_value, current_year, year_reset)
VALUES ('DEV','Devis','DEV','{prefix}-{year}-{number}',5,0,EXTRACT(YEAR FROM now())::int,true)
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.convert_devis_to_bc(_devis_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  d RECORD;
  new_bc_id uuid;
  new_numero text;
BEGIN
  SELECT * INTO d FROM public.devis WHERE id = _devis_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Devis introuvable'; END IF;
  IF d.bc_id IS NOT NULL THEN RAISE EXCEPTION 'Devis déjà converti'; END IF;
  new_numero := public.next_numero('BC');
  INSERT INTO public.bons_commande
    (numero, client_id, date_bc, statut, conditions, notes, objet, reference_client,
     total_ht, total_tva, total_ttc, remise_pct, devis_id, created_by)
  VALUES
    (new_numero, d.client_id, CURRENT_DATE, 'brouillon', d.conditions, d.notes, d.objet, d.reference_client,
     d.total_ht, d.total_tva, d.total_ttc, d.remise_pct, d.id, auth.uid())
  RETURNING id INTO new_bc_id;
  INSERT INTO public.bc_lignes (bc_id, ordre, designation, parametre_id, produit_id,
                                 quantite, prix_unitaire, remise_pct, tva_pct, total_ht)
  SELECT new_bc_id, ordre, designation, parametre_id, produit_id,
         quantite, prix_unitaire, remise_pct, tva_pct, total_ht
  FROM public.devis_lignes WHERE devis_id = d.id ORDER BY ordre;
  UPDATE public.devis SET bc_id = new_bc_id, statut = 'converti', updated_at = now() WHERE id = d.id;
  RETURN new_bc_id;
END $$;

GRANT EXECUTE ON FUNCTION public.convert_devis_to_bc(uuid) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_devis_client ON public.devis(client_id);
CREATE INDEX IF NOT EXISTS idx_devis_statut ON public.devis(statut);
CREATE INDEX IF NOT EXISTS idx_devis_lignes_devis ON public.devis_lignes(devis_id);
