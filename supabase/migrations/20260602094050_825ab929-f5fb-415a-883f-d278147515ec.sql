
-- ============================================================
-- LOT 1: Codes-barres sur prélèvements
-- ============================================================
ALTER TABLE public.prelevements
  ADD COLUMN IF NOT EXISTS code_barre text UNIQUE,
  ADD COLUMN IF NOT EXISTS scanne_at timestamptz,
  ADD COLUMN IF NOT EXISTS scanne_by uuid,
  ADD COLUMN IF NOT EXISTS verifie_at timestamptz,
  ADD COLUMN IF NOT EXISTS verifie_by uuid;

CREATE OR REPLACE FUNCTION public.set_prelevement_code_barre()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.code_barre IS NULL OR NEW.code_barre = '' THEN
    NEW.code_barre := 'PRL' || to_char(now(), 'YYMMDD') || upper(substring(replace(gen_random_uuid()::text,'-',''),1,6));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_prelevement_code_barre ON public.prelevements;
CREATE TRIGGER trg_prelevement_code_barre
  BEFORE INSERT ON public.prelevements
  FOR EACH ROW EXECUTE FUNCTION public.set_prelevement_code_barre();

-- Backfill existing rows
UPDATE public.prelevements
SET code_barre = 'PRL' || to_char(coalesce(created_at, now()), 'YYMMDD') || upper(substring(replace(gen_random_uuid()::text,'-',''),1,6))
WHERE code_barre IS NULL OR code_barre = '';

CREATE INDEX IF NOT EXISTS idx_prelevements_code_barre ON public.prelevements(code_barre);

-- ============================================================
-- LOT 2: Sondes IoT
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.sonde_type AS ENUM ('temperature','humidite','pression','co2','o2','ph','autre');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.alerte_sonde_type AS ENUM ('hors_seuil_haut','hors_seuil_bas','hors_ligne','batterie_faible');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.sondes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  libelle text NOT NULL,
  equipement_id uuid,
  localisation text,
  type sonde_type NOT NULL DEFAULT 'temperature',
  unite text NOT NULL DEFAULT '°C',
  seuil_min numeric,
  seuil_max numeric,
  intervalle_minutes int NOT NULL DEFAULT 15,
  api_key_hash text,
  fournisseur text,
  modele text,
  is_active boolean NOT NULL DEFAULT true,
  last_releve_at timestamptz,
  last_mesure numeric,
  last_batterie int,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sondes TO authenticated;
GRANT ALL ON public.sondes TO service_role;
ALTER TABLE public.sondes ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_read_sondes ON public.sondes FOR SELECT TO authenticated
  USING (NOT has_role(auth.uid(), 'client'::app_role));
CREATE POLICY write_sondes ON public.sondes FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'direction'::app_role) OR has_role(auth.uid(),'qualite'::app_role) OR has_role(auth.uid(),'chef_labo'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'direction'::app_role) OR has_role(auth.uid(),'qualite'::app_role) OR has_role(auth.uid(),'chef_labo'::app_role));

CREATE TABLE IF NOT EXISTS public.releves_sonde (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sonde_id uuid NOT NULL REFERENCES public.sondes(id) ON DELETE CASCADE,
  mesure numeric NOT NULL,
  mesuree_at timestamptz NOT NULL DEFAULT now(),
  batterie_pct int,
  signal_pct int,
  conformite boolean,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_releves_sonde_sonde_date ON public.releves_sonde(sonde_id, mesuree_at DESC);

GRANT SELECT, INSERT ON public.releves_sonde TO authenticated;
GRANT ALL ON public.releves_sonde TO service_role;
ALTER TABLE public.releves_sonde ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_read_releves_sonde ON public.releves_sonde FOR SELECT TO authenticated
  USING (NOT has_role(auth.uid(), 'client'::app_role));
CREATE POLICY staff_write_releves_sonde ON public.releves_sonde FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.alertes_sonde (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sonde_id uuid NOT NULL REFERENCES public.sondes(id) ON DELETE CASCADE,
  releve_id uuid REFERENCES public.releves_sonde(id) ON DELETE SET NULL,
  type alerte_sonde_type NOT NULL,
  severite text NOT NULL DEFAULT 'warning',
  message text,
  mesure numeric,
  acquittee_at timestamptz,
  acquittee_by uuid,
  commentaire text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alertes_sonde_open ON public.alertes_sonde(sonde_id) WHERE acquittee_at IS NULL;

GRANT SELECT, INSERT, UPDATE ON public.alertes_sonde TO authenticated;
GRANT ALL ON public.alertes_sonde TO service_role;
ALTER TABLE public.alertes_sonde ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_read_alertes ON public.alertes_sonde FOR SELECT TO authenticated
  USING (NOT has_role(auth.uid(), 'client'::app_role));
CREATE POLICY staff_write_alertes ON public.alertes_sonde FOR ALL TO authenticated
  USING (NOT has_role(auth.uid(), 'client'::app_role))
  WITH CHECK (NOT has_role(auth.uid(), 'client'::app_role));

-- Update trigger
DROP TRIGGER IF EXISTS trg_sondes_updated_at ON public.sondes;
CREATE TRIGGER trg_sondes_updated_at BEFORE UPDATE ON public.sondes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
