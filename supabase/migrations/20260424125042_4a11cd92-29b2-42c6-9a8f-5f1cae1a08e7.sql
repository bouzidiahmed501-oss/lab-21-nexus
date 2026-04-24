-- =====================================================
-- BALIMS — Schéma complet workflow métier laboratoire
-- =====================================================

-- ---------- ENUMS ----------
CREATE TYPE public.bc_statut AS ENUM ('brouillon','envoye','accepte','refuse','en_cours','cloture','annule');
CREATE TYPE public.mission_statut AS ENUM ('planifiee','en_cours','terminee','annulee');
CREATE TYPE public.prelevement_statut AS ENUM ('planifie','effectue','recu_labo','rejete');
CREATE TYPE public.fr_statut AS ENUM ('planifiee','en_cours','terminee','annulee');
CREATE TYPE public.analyse_statut AS ENUM ('a_faire','en_cours','termine','valide_tech','valide_chef','valide_qualite','rejete');
CREATE TYPE public.rapport_statut AS ENUM ('brouillon','en_validation','valide','envoye','annule');
CREATE TYPE public.niveau_validation AS ENUM ('technicien','chef_labo','qualite');
CREATE TYPE public.type_matrice AS ENUM ('eau','sol','air','alimentaire','cosmetique','pharmaceutique','industriel','autre');

-- ---------- REFERENTIELS ----------

-- Unités de mesure
CREATE TABLE public.unites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  symbole TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  raison_sociale TEXT NOT NULL,
  type_client TEXT DEFAULT 'societe',
  matricule_fiscal TEXT,
  registre_commerce TEXT,
  email TEXT,
  telephone TEXT,
  adresse TEXT,
  ville TEXT,
  code_postal TEXT,
  pays TEXT DEFAULT 'Tunisie',
  contact_principal TEXT,
  contact_email TEXT,
  contact_telephone TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Produits / matrices
CREATE TABLE public.produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  libelle TEXT NOT NULL,
  matrice public.type_matrice NOT NULL DEFAULT 'autre',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Méthodes d'analyse
CREATE TABLE public.methodes_analyse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  libelle TEXT NOT NULL,
  norme TEXT,
  type_methode TEXT,
  accreditee BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Paramètres d'analyse
CREATE TABLE public.parametres_analyse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  libelle TEXT NOT NULL,
  unite_id UUID REFERENCES public.unites(id),
  methode_id UUID REFERENCES public.methodes_analyse(id),
  seuil_min NUMERIC,
  seuil_max NUMERIC,
  prix_unitaire NUMERIC NOT NULL DEFAULT 0,
  delai_jours INTEGER DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- WORKFLOW ----------

-- Bons de commande
CREATE TABLE public.bons_commande (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  date_bc DATE NOT NULL DEFAULT CURRENT_DATE,
  date_souhaitee DATE,
  statut public.bc_statut NOT NULL DEFAULT 'brouillon',
  reference_client TEXT,
  objet TEXT,
  conditions TEXT,
  remise_pct NUMERIC NOT NULL DEFAULT 0,
  total_ht NUMERIC NOT NULL DEFAULT 0,
  total_tva NUMERIC NOT NULL DEFAULT 0,
  total_ttc NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  validated_by UUID,
  validated_at TIMESTAMPTZ
);

CREATE TABLE public.bc_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bc_id UUID NOT NULL REFERENCES public.bons_commande(id) ON DELETE CASCADE,
  produit_id UUID REFERENCES public.produits(id),
  parametre_id UUID REFERENCES public.parametres_analyse(id),
  designation TEXT NOT NULL,
  quantite NUMERIC NOT NULL DEFAULT 1,
  prix_unitaire NUMERIC NOT NULL DEFAULT 0,
  remise_pct NUMERIC NOT NULL DEFAULT 0,
  tva_pct NUMERIC NOT NULL DEFAULT 19,
  total_ht NUMERIC NOT NULL DEFAULT 0,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Missions de prélèvement
CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  bc_id UUID REFERENCES public.bons_commande(id),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  date_mission DATE NOT NULL DEFAULT CURRENT_DATE,
  date_prevue DATE,
  lieu TEXT,
  preleveur_id UUID,
  statut public.mission_statut NOT NULL DEFAULT 'planifiee',
  objet TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE TABLE public.mission_echantillons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  code_echantillon TEXT NOT NULL,
  produit_id UUID REFERENCES public.produits(id),
  designation TEXT NOT NULL,
  quantite NUMERIC,
  unite_id UUID REFERENCES public.unites(id),
  conditions_prelevement TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prélèvements
CREATE TABLE public.prelevements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  mission_id UUID REFERENCES public.missions(id),
  echantillon_id UUID REFERENCES public.mission_echantillons(id),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  date_prelevement TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_reception TIMESTAMPTZ,
  lieu TEXT,
  preleveur_nom TEXT,
  conditions TEXT,
  temperature NUMERIC,
  conformite BOOLEAN DEFAULT true,
  observations TEXT,
  statut public.prelevement_statut NOT NULL DEFAULT 'planifie',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Feuilles de route (planning labo)
CREATE TABLE public.feuilles_route (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  date_fr DATE NOT NULL DEFAULT CURRENT_DATE,
  technicien_id UUID,
  laboratoire TEXT,
  statut public.fr_statut NOT NULL DEFAULT 'planifiee',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE TABLE public.fr_taches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fr_id UUID NOT NULL REFERENCES public.feuilles_route(id) ON DELETE CASCADE,
  prelevement_id UUID REFERENCES public.prelevements(id),
  parametre_id UUID REFERENCES public.parametres_analyse(id),
  ordre INTEGER NOT NULL DEFAULT 0,
  statut TEXT DEFAULT 'a_faire',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analyses
CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  prelevement_id UUID NOT NULL REFERENCES public.prelevements(id),
  bc_id UUID REFERENCES public.bons_commande(id),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  fr_id UUID REFERENCES public.feuilles_route(id),
  date_debut DATE,
  date_fin DATE,
  technicien_id UUID,
  statut public.analyse_statut NOT NULL DEFAULT 'a_faire',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE TABLE public.analyse_resultats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analyse_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  parametre_id UUID NOT NULL REFERENCES public.parametres_analyse(id),
  valeur TEXT,
  valeur_numerique NUMERIC,
  unite_id UUID REFERENCES public.unites(id),
  methode_id UUID REFERENCES public.methodes_analyse(id),
  conformite BOOLEAN,
  incertitude NUMERIC,
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validations (multi-niveaux)
CREATE TABLE public.validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  niveau public.niveau_validation NOT NULL,
  validateur_id UUID NOT NULL,
  decision TEXT NOT NULL,
  commentaire TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_validations_entity ON public.validations(entity_type, entity_id);

-- Rapports
CREATE TABLE public.rapports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  bc_id UUID REFERENCES public.bons_commande(id),
  date_rapport DATE NOT NULL DEFAULT CURRENT_DATE,
  titre TEXT NOT NULL,
  statut public.rapport_statut NOT NULL DEFAULT 'brouillon',
  conclusion TEXT,
  pdf_path TEXT,
  envoye_at TIMESTAMPTZ,
  envoye_par UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  validated_by UUID,
  validated_at TIMESTAMPTZ
);

CREATE TABLE public.rapport_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rapport_id UUID NOT NULL REFERENCES public.rapports(id) ON DELETE CASCADE,
  analyse_id UUID NOT NULL REFERENCES public.analyses(id),
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- INDEX ----------
CREATE INDEX idx_bc_client ON public.bons_commande(client_id);
CREATE INDEX idx_bc_statut ON public.bons_commande(statut);
CREATE INDEX idx_missions_client ON public.missions(client_id);
CREATE INDEX idx_missions_bc ON public.missions(bc_id);
CREATE INDEX idx_prelevements_mission ON public.prelevements(mission_id);
CREATE INDEX idx_prelevements_client ON public.prelevements(client_id);
CREATE INDEX idx_analyses_prelevement ON public.analyses(prelevement_id);
CREATE INDEX idx_analyses_client ON public.analyses(client_id);
CREATE INDEX idx_analyses_statut ON public.analyses(statut);
CREATE INDEX idx_resultats_analyse ON public.analyse_resultats(analyse_id);
CREATE INDEX idx_rapports_client ON public.rapports(client_id);

-- ---------- TRIGGERS updated_at ----------
DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'clients','produits','methodes_analyse','parametres_analyse',
    'bons_commande','missions','prelevements','feuilles_route',
    'analyses','analyse_resultats','rapports'
  ])
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
  END LOOP;
END $$;

-- ---------- HELPER : profil → client_id (pour clients du portail) ----------
CREATE OR REPLACE FUNCTION public.current_user_client_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT client_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ---------- ENABLE RLS ----------
ALTER TABLE public.unites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.methodes_analyse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_analyse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bons_commande ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bc_lignes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_echantillons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prelevements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feuilles_route ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fr_taches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyse_resultats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapport_analyses ENABLE ROW LEVEL SECURITY;

-- ---------- POLICIES : référentiels (lecture pour tout le staff, écriture admin/direction/chef_labo) ----------
-- Helper macro : staff = tous sauf 'client'
-- Lecture pour tout authentifié (staff voit tout, client voit ses données via tables métier)
CREATE POLICY "staff_read_unites" ON public.unites FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_write_unites" ON public.unites FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo'));

CREATE POLICY "staff_read_produits" ON public.produits FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_write_produits" ON public.produits FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo'));

CREATE POLICY "staff_read_methodes" ON public.methodes_analyse FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_write_methodes" ON public.methodes_analyse FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'qualite'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'qualite'));

CREATE POLICY "staff_read_parametres" ON public.parametres_analyse FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_write_parametres" ON public.parametres_analyse FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo'));

-- ---------- POLICIES : clients ----------
CREATE POLICY "staff_read_clients" ON public.clients FOR SELECT TO authenticated
  USING (NOT has_role(auth.uid(),'client') OR id = current_user_client_id());
CREATE POLICY "commercial_write_clients" ON public.clients FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'commercial'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'commercial'));

-- ---------- POLICIES : BC ----------
CREATE POLICY "read_bc" ON public.bons_commande FOR SELECT TO authenticated
  USING (NOT has_role(auth.uid(),'client') OR client_id = current_user_client_id());
CREATE POLICY "write_bc" ON public.bons_commande FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'commercial'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'commercial'));

CREATE POLICY "read_bc_lignes" ON public.bc_lignes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bons_commande b WHERE b.id = bc_lignes.bc_id
    AND (NOT has_role(auth.uid(),'client') OR b.client_id = current_user_client_id())));
CREATE POLICY "write_bc_lignes" ON public.bc_lignes FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'commercial'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'commercial'));

-- ---------- POLICIES : Missions / Échantillons / Prélèvements ----------
CREATE POLICY "read_missions" ON public.missions FOR SELECT TO authenticated
  USING (NOT has_role(auth.uid(),'client') OR client_id = current_user_client_id());
CREATE POLICY "write_missions" ON public.missions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'technicien'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'technicien'));

CREATE POLICY "read_echantillons" ON public.mission_echantillons FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.missions m WHERE m.id = mission_echantillons.mission_id
    AND (NOT has_role(auth.uid(),'client') OR m.client_id = current_user_client_id())));
CREATE POLICY "write_echantillons" ON public.mission_echantillons FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'technicien'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'technicien'));

CREATE POLICY "read_prelevements" ON public.prelevements FOR SELECT TO authenticated
  USING (NOT has_role(auth.uid(),'client') OR client_id = current_user_client_id());
CREATE POLICY "write_prelevements" ON public.prelevements FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'technicien'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'technicien'));

-- ---------- POLICIES : Feuilles de route ----------
CREATE POLICY "staff_read_fr" ON public.feuilles_route FOR SELECT TO authenticated
  USING (NOT has_role(auth.uid(),'client'));
CREATE POLICY "labo_write_fr" ON public.feuilles_route FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'technicien'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'technicien'));

CREATE POLICY "staff_read_fr_taches" ON public.fr_taches FOR SELECT TO authenticated
  USING (NOT has_role(auth.uid(),'client'));
CREATE POLICY "labo_write_fr_taches" ON public.fr_taches FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'technicien'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'technicien'));

-- ---------- POLICIES : Analyses ----------
CREATE POLICY "read_analyses" ON public.analyses FOR SELECT TO authenticated
  USING (NOT has_role(auth.uid(),'client') OR client_id = current_user_client_id());
CREATE POLICY "write_analyses" ON public.analyses FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'technicien') OR has_role(auth.uid(),'qualite'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'technicien') OR has_role(auth.uid(),'qualite'));

CREATE POLICY "read_resultats" ON public.analyse_resultats FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.analyses a WHERE a.id = analyse_resultats.analyse_id
    AND (NOT has_role(auth.uid(),'client') OR a.client_id = current_user_client_id())));
CREATE POLICY "write_resultats" ON public.analyse_resultats FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'technicien') OR has_role(auth.uid(),'qualite'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'technicien') OR has_role(auth.uid(),'qualite'));

-- ---------- POLICIES : Validations ----------
CREATE POLICY "staff_read_validations" ON public.validations FOR SELECT TO authenticated
  USING (NOT has_role(auth.uid(),'client'));
CREATE POLICY "staff_insert_validations" ON public.validations FOR INSERT TO authenticated
  WITH CHECK (
    validateur_id = auth.uid() AND (
      (niveau = 'technicien' AND (has_role(auth.uid(),'technicien') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'admin'))) OR
      (niveau = 'chef_labo' AND (has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction'))) OR
      (niveau = 'qualite' AND (has_role(auth.uid(),'qualite') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction')))
    )
  );

-- ---------- POLICIES : Rapports ----------
CREATE POLICY "read_rapports" ON public.rapports FOR SELECT TO authenticated
  USING (
    (NOT has_role(auth.uid(),'client') OR (client_id = current_user_client_id() AND statut IN ('valide','envoye')))
  );
CREATE POLICY "write_rapports" ON public.rapports FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'qualite'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'qualite'));

CREATE POLICY "read_rapport_analyses" ON public.rapport_analyses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rapports r WHERE r.id = rapport_analyses.rapport_id
    AND (NOT has_role(auth.uid(),'client') OR (r.client_id = current_user_client_id() AND r.statut IN ('valide','envoye')))));
CREATE POLICY "write_rapport_analyses" ON public.rapport_analyses FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'qualite'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo') OR has_role(auth.uid(),'qualite'));

-- ---------- FONCTION DE NUMÉROTATION AUTO ----------
CREATE OR REPLACE FUNCTION public.next_numero(_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  seq RECORD;
  current_yr INT := EXTRACT(YEAR FROM now())::INT;
  new_val INT;
  result TEXT;
BEGIN
  SELECT * INTO seq FROM public.numbering_sequences WHERE code = _code FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sequence % not found', _code; END IF;

  IF seq.year_reset AND seq.current_year <> current_yr THEN
    new_val := 1;
    UPDATE public.numbering_sequences
      SET current_value = new_val, current_year = current_yr, updated_at = now()
      WHERE id = seq.id;
  ELSE
    new_val := seq.current_value + 1;
    UPDATE public.numbering_sequences
      SET current_value = new_val, updated_at = now()
      WHERE id = seq.id;
  END IF;

  result := replace(seq.format_template, '{prefix}', seq.prefix);
  result := replace(result, '{year}', current_yr::TEXT);
  result := replace(result, '{number}', lpad(new_val::TEXT, seq.padding, '0'));
  result := replace(result, '{suffix}', seq.suffix);
  RETURN result;
END $$;

-- ---------- PRÉ-REMPLISSAGE NUMÉROTATIONS BALIMS ----------
INSERT INTO public.numbering_sequences (code, label, prefix, padding, format_template, year_reset)
VALUES
  ('BC','Bons de commande','BC',5,'{prefix}-{year}-{number}',true),
  ('MIS','Missions de prélèvement','MIS',5,'{prefix}-{year}-{number}',true),
  ('PRL','Prélèvements','PRL',5,'{prefix}-{year}-{number}',true),
  ('FR','Feuilles de route','FR',5,'{prefix}-{year}-{number}',true),
  ('ANA','Analyses','ANA',5,'{prefix}-{year}-{number}',true),
  ('RAP','Rapports','RAP',5,'{prefix}-{year}-{number}',true),
  ('FAC','Factures','FAC',5,'{prefix}-{year}-{number}',true)
ON CONFLICT (code) DO NOTHING;

-- ---------- UNITÉS COURANTES ----------
INSERT INTO public.unites (code, libelle, symbole) VALUES
  ('MGL','Milligramme par litre','mg/L'),
  ('UGL','Microgramme par litre','µg/L'),
  ('GL','Gramme par litre','g/L'),
  ('PCT','Pourcentage','%'),
  ('PH','pH','pH'),
  ('UFC','Unité formant colonie','UFC/mL'),
  ('NTU','Turbidité','NTU'),
  ('MGKG','Milligramme par kilogramme','mg/kg'),
  ('CELS','Degré Celsius','°C')
ON CONFLICT (code) DO NOTHING;