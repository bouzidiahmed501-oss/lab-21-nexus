
-- ============ ÉCHANTILLONS (cycle de vie) ============
CREATE TABLE IF NOT EXISTS public.echantillons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  code_barre TEXT UNIQUE NOT NULL,
  prelevement_id UUID REFERENCES public.prelevements(id) ON DELETE SET NULL,
  designation TEXT NOT NULL,
  type_echantillon TEXT,
  statut TEXT NOT NULL DEFAULT 'recu' CHECK (statut IN ('recu','en_attente','en_analyse','analyse','archive','detruit')),
  emplacement TEXT,
  temperature_stockage NUMERIC,
  date_reception TIMESTAMPTZ DEFAULT now(),
  date_conservation_fin DATE,
  date_destruction DATE,
  volume_quantite TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.echantillons TO authenticated;
GRANT ALL ON public.echantillons TO service_role;
ALTER TABLE public.echantillons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage echantillons" ON public.echantillons FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_echantillons_updated BEFORE UPDATE ON public.echantillons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.echantillon_historique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  echantillon_id UUID NOT NULL REFERENCES public.echantillons(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  ancien_statut TEXT,
  nouveau_statut TEXT,
  emplacement TEXT,
  user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT ON public.echantillon_historique TO authenticated;
GRANT ALL ON public.echantillon_historique TO service_role;
ALTER TABLE public.echantillon_historique ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read historique" ON public.echantillon_historique FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert historique" ON public.echantillon_historique FOR INSERT TO authenticated WITH CHECK (true);

-- ============ RÉACTIFS ============
CREATE TABLE IF NOT EXISTS public.reactifs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  code TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  fournisseur TEXT,
  numero_lot TEXT,
  date_reception DATE,
  date_ouverture DATE,
  date_peremption DATE,
  quantite_initiale NUMERIC,
  quantite_actuelle NUMERIC,
  unite TEXT DEFAULT 'ml',
  seuil_alerte NUMERIC DEFAULT 0,
  emplacement TEXT,
  temperature_stockage TEXT,
  fds_url TEXT,
  is_actif BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reactifs TO authenticated;
GRANT ALL ON public.reactifs TO service_role;
ALTER TABLE public.reactifs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage reactifs" ON public.reactifs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_reactifs_updated BEFORE UPDATE ON public.reactifs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.reactif_mouvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reactif_id UUID NOT NULL REFERENCES public.reactifs(id) ON DELETE CASCADE,
  type_mouvement TEXT NOT NULL CHECK (type_mouvement IN ('entree','sortie','ajustement','destruction')),
  quantite NUMERIC NOT NULL,
  analyse_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT ON public.reactif_mouvements TO authenticated;
GRANT ALL ON public.reactif_mouvements TO service_role;
ALTER TABLE public.reactif_mouvements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage mouvements" ON public.reactif_mouvements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ CONTRÔLE QUALITÉ ANALYTIQUE ============
CREATE TABLE IF NOT EXISTS public.cq_cartes_controle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  code TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  parametre_id UUID REFERENCES public.parametres_analyse(id) ON DELETE SET NULL,
  methode_id UUID REFERENCES public.methodes_analyse(id) ON DELETE SET NULL,
  type_carte TEXT DEFAULT 'X_barre' CHECK (type_carte IN ('X_barre','R','X_R','individuel')),
  valeur_cible NUMERIC,
  ecart_type NUMERIC,
  limite_sup_avert NUMERIC,
  limite_inf_avert NUMERIC,
  limite_sup_action NUMERIC,
  limite_inf_action NUMERIC,
  is_actif BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cq_cartes_controle TO authenticated;
GRANT ALL ON public.cq_cartes_controle TO service_role;
ALTER TABLE public.cq_cartes_controle ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage cq_cartes" ON public.cq_cartes_controle FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_cq_cartes_updated BEFORE UPDATE ON public.cq_cartes_controle FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.cq_mesures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carte_id UUID NOT NULL REFERENCES public.cq_cartes_controle(id) ON DELETE CASCADE,
  date_mesure TIMESTAMPTZ NOT NULL DEFAULT now(),
  valeur NUMERIC NOT NULL,
  type_echantillon_cq TEXT CHECK (type_echantillon_cq IN ('blanc','duplicata','mrc','eil','routine')),
  reactif_lot TEXT,
  equipement_id UUID REFERENCES public.equipements(id) ON DELETE SET NULL,
  technicien_id UUID REFERENCES auth.users(id),
  hors_limite BOOLEAN DEFAULT false,
  regle_violee TEXT,
  commentaire TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cq_mesures TO authenticated;
GRANT ALL ON public.cq_mesures TO service_role;
ALTER TABLE public.cq_mesures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage cq_mesures" ON public.cq_mesures FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.eil_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  organisme TEXT NOT NULL,
  reference TEXT,
  parametre TEXT,
  date_participation DATE,
  date_resultat DATE,
  valeur_labo NUMERIC,
  valeur_assignee NUMERIC,
  z_score NUMERIC,
  resultat TEXT CHECK (resultat IN ('satisfaisant','douteux','non_satisfaisant','en_attente')),
  actions_correctives TEXT,
  rapport_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eil_participations TO authenticated;
GRANT ALL ON public.eil_participations TO service_role;
ALTER TABLE public.eil_participations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage eil" ON public.eil_participations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_eil_updated BEFORE UPDATE ON public.eil_participations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ VALIDATION / SIGNATURE RAPPORT ============
CREATE TABLE IF NOT EXISTS public.validations_rapport (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rapport_id UUID NOT NULL REFERENCES public.rapports(id) ON DELETE CASCADE,
  niveau TEXT NOT NULL CHECK (niveau IN ('technicien','superviseur','qualite')),
  user_id UUID REFERENCES auth.users(id),
  statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente','valide','rejete')),
  commentaire TEXT,
  signature_hash TEXT,
  signature_ip TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.validations_rapport TO authenticated;
GRANT ALL ON public.validations_rapport TO service_role;
ALTER TABLE public.validations_rapport ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage validations_rapport" ON public.validations_rapport FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_val_rap_updated BEFORE UPDATE ON public.validations_rapport FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_echantillons_statut ON public.echantillons(statut);
CREATE INDEX IF NOT EXISTS idx_echantillons_code ON public.echantillons(code_barre);
CREATE INDEX IF NOT EXISTS idx_reactifs_peremption ON public.reactifs(date_peremption);
CREATE INDEX IF NOT EXISTS idx_cq_mesures_carte ON public.cq_mesures(carte_id, date_mesure);
CREATE INDEX IF NOT EXISTS idx_val_rap ON public.validations_rapport(rapport_id, niveau);
