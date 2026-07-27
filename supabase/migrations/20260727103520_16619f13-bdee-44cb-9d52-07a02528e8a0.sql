-- 1. Emplacements de stockage
CREATE TABLE public.emplacements_stockage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  parent_id UUID REFERENCES public.emplacements_stockage(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  type_emplacement TEXT NOT NULL DEFAULT 'etagere',
  temperature_cible NUMERIC,
  temperature_min NUMERIC,
  temperature_max NUMERIC,
  capacite INTEGER,
  occupation INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emplacements_stockage TO authenticated;
GRANT ALL ON public.emplacements_stockage TO service_role;
ALTER TABLE public.emplacements_stockage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lab users manage emplacements" ON public.emplacements_stockage
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_emplacements_updated BEFORE UPDATE ON public.emplacements_stockage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_emplacements_parent ON public.emplacements_stockage(parent_id);

ALTER TABLE public.echantillons ADD COLUMN IF NOT EXISTS emplacement_id UUID REFERENCES public.emplacements_stockage(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_echantillons_emplacement ON public.echantillons(emplacement_id);

-- 2. Formations
CREATE TABLE public.formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  intitule TEXT NOT NULL,
  organisme TEXT,
  type_formation TEXT NOT NULL DEFAULT 'interne',
  date_debut DATE,
  date_fin DATE,
  duree_heures NUMERIC,
  resultat TEXT NOT NULL DEFAULT 'planifiee',
  score NUMERIC,
  attestation_url TEXT,
  cout NUMERIC,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.formations TO authenticated;
GRANT ALL ON public.formations TO service_role;
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lab users manage formations" ON public.formations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_formations_updated BEFORE UPDATE ON public.formations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_formations_employe ON public.formations(employe_id);

-- 3. Habilitations techniques
CREATE TABLE public.habilitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  parametre_id UUID REFERENCES public.parametres_analyse(id) ON DELETE SET NULL,
  methode_id UUID REFERENCES public.methodes_analyse(id) ON DELETE SET NULL,
  equipement_id UUID REFERENCES public.equipements(id) ON DELETE SET NULL,
  intitule TEXT NOT NULL,
  niveau TEXT NOT NULL DEFAULT 'autonome',
  statut TEXT NOT NULL DEFAULT 'valide',
  date_habilitation DATE NOT NULL DEFAULT CURRENT_DATE,
  date_expiration DATE,
  evaluateur_id UUID,
  preuve_url TEXT,
  commentaire TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habilitations TO authenticated;
GRANT ALL ON public.habilitations TO service_role;
ALTER TABLE public.habilitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lab users manage habilitations" ON public.habilitations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_habilitations_updated BEFORE UPDATE ON public.habilitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_habilitations_employe ON public.habilitations(employe_id);