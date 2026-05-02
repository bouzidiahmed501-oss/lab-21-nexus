
-- ============================================================
-- REFERENTIELS ANALYTIQUES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.referentiels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT,
  organisme TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.referentiels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_referentiels_all" ON public.referentiels FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.nature_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nature_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_nature_analyses_all" ON public.nature_analyses FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.type_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT,
  nature_analyse_id UUID REFERENCES public.nature_analyses(id),
  ordre INT NOT NULL DEFAULT 0,
  nombre_decimales INT DEFAULT 2,
  format_texte_rapport TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.type_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_type_analyses_all" ON public.type_analyses FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.super_familles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT,
  prix_defaut NUMERIC(11,3),
  ordre INT NOT NULL DEFAULT 0,
  groupe_date_analyse TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.super_familles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_super_familles_all" ON public.super_familles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.region_criteres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT,
  referentiel_id UUID REFERENCES public.referentiels(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.region_criteres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_region_criteres_all" ON public.region_criteres FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.familles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT,
  super_famille_id UUID REFERENCES public.super_familles(id),
  region_critere_id UUID REFERENCES public.region_criteres(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.familles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_familles_all" ON public.familles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.catalogue_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT,
  indice INT NOT NULL DEFAULT 0,
  prix NUMERIC(10,3) NOT NULL DEFAULT 0,
  type_analyse_id UUID REFERENCES public.type_analyses(id),
  code_norme TEXT,
  code_norme_reference TEXT,
  version_norme TEXT,
  date_version DATE,
  titre_norme TEXT,
  referentiel_id UUID REFERENCES public.referentiels(id),
  accredite BOOLEAN DEFAULT false,
  organisme_accrediteur TEXT,
  date_accreditation DATE,
  num_dossier_accreditation TEXT,
  incertitude TEXT,
  avec_temperature BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  ordre INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.catalogue_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_catalogue_analyses_all" ON public.catalogue_analyses FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.nature_criteres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT,
  has_min BOOLEAN DEFAULT false,
  has_max BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nature_criteres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_nature_criteres_all" ON public.nature_criteres FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.criteres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT,
  region_critere_id UUID REFERENCES public.region_criteres(id),
  origine TEXT,
  quantite_testee TEXT,
  type_analyse_id UUID REFERENCES public.type_analyses(id),
  famille_id UUID REFERENCES public.familles(id),
  nature_critere_id UUID REFERENCES public.nature_criteres(id),
  valeur_min NUMERIC(19,3),
  valeur_max NUMERIC(19,3),
  commentaire TEXT,
  note TEXT,
  valeurs TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.criteres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_criteres_all" ON public.criteres FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.pack_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT,
  origine TEXT,
  tableau_resultats TEXT,
  note_pour_criteres TEXT,
  reference_critere TEXT,
  avec_declaration_conformite BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pack_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_pack_analyses_all" ON public.pack_analyses FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.lignes_pack_analyse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_analyse_id UUID NOT NULL REFERENCES public.pack_analyses(id) ON DELETE CASCADE,
  ordre INT NOT NULL DEFAULT 0,
  catalogue_analyse_id UUID REFERENCES public.catalogue_analyses(id),
  critere_id UUID REFERENCES public.criteres(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lignes_pack_analyse ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_lignes_pack_all" ON public.lignes_pack_analyse FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- MILIEUX DE CULTURE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.type_milieux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.type_milieux ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_type_milieux_all" ON public.type_milieux FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.milieu_origines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type_milieu_id UUID REFERENCES public.type_milieux(id),
  lot_fabricant TEXT,
  dlc DATE,
  date_reception DATE,
  quantite_base INT,
  quantite_restante INT,
  date_sortie DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.milieu_origines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_milieu_origines_all" ON public.milieu_origines FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.milieux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  milieu_origine_id UUID REFERENCES public.milieu_origines(id),
  date_preparation DATE,
  preparateur_id UUID,
  quantite NUMERIC(11,3),
  volume NUMERIC(11,3),
  ph NUMERIC(11,3),
  appareil_id UUID,
  test_sterilite BOOLEAN,
  test_negativite BOOLEAN,
  test_positivite BOOLEAN,
  dlc DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.milieux ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_milieux_all" ON public.milieux FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- FACTURATION COMPLETE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.modes_reglement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.modes_reglement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_modes_reglement_all" ON public.modes_reglement FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  adresse TEXT,
  telephone TEXT,
  fax TEXT,
  code_tva TEXT,
  date_facture DATE NOT NULL DEFAULT CURRENT_DATE,
  total_ht NUMERIC(11,3) DEFAULT 0,
  total_tva NUMERIC(11,3) DEFAULT 0,
  total_ttc NUMERIC(11,3) DEFAULT 0,
  retenue_source NUMERIC(11,3) DEFAULT 0,
  timbre NUMERIC(11,3) DEFAULT 1.000,
  net_a_payer NUMERIC(11,3) DEFAULT 0,
  net_a_payer_texte TEXT,
  mode_reglement_id UUID REFERENCES public.modes_reglement(id),
  date_reglement DATE,
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon','emise','payee','partielle','impayee','annulee')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_factures_all" ON public.factures FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.lignes_facture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  ordre INT NOT NULL DEFAULT 0,
  reference TEXT,
  designation TEXT,
  quantite INT DEFAULT 1,
  prix_unitaire NUMERIC(11,3) DEFAULT 0,
  remise NUMERIC(11,3) DEFAULT 0,
  tva NUMERIC(5,2) DEFAULT 19.00,
  total_ht NUMERIC(11,3) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lignes_facture ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_lignes_facture_all" ON public.lignes_facture FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.facture_bons_commande (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  bon_commande_id UUID NOT NULL REFERENCES public.bons_commande(id),
  ordre INT DEFAULT 0,
  UNIQUE(facture_id, bon_commande_id)
);
ALTER TABLE public.facture_bons_commande ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_fbc_all" ON public.facture_bons_commande FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.reglements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  payeur TEXT,
  mode_reglement_id UUID REFERENCES public.modes_reglement(id),
  montant NUMERIC(11,3) NOT NULL DEFAULT 0,
  etablissement_payeur TEXT,
  reference TEXT,
  date_paiement DATE,
  date_versement DATE,
  date_effective DATE,
  solde_precedent NUMERIC(11,3),
  solde_actuel NUMERIC(11,3),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reglements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_reglements_all" ON public.reglements FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.lignes_reglement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reglement_id UUID NOT NULL REFERENCES public.reglements(id) ON DELETE CASCADE,
  ordre INT NOT NULL DEFAULT 0,
  facture_id UUID NOT NULL REFERENCES public.factures(id),
  date_facture DATE,
  net_a_payer NUMERIC(11,3),
  fraction_reglee NUMERIC(11,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lignes_reglement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_lignes_reglement_all" ON public.lignes_reglement FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.avoirs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  adresse TEXT,
  telephone TEXT,
  fax TEXT,
  code_tva TEXT,
  date_avoir DATE NOT NULL DEFAULT CURRENT_DATE,
  total_ht NUMERIC(11,3) DEFAULT 0,
  total_tva NUMERIC(11,3) DEFAULT 0,
  total_ttc NUMERIC(11,3) DEFAULT 0,
  retenue_source NUMERIC(11,3) DEFAULT 0,
  timbre NUMERIC(11,3) DEFAULT 1.000,
  net_a_payer NUMERIC(11,3) DEFAULT 0,
  net_a_payer_texte TEXT,
  mode_reglement TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.avoirs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_avoirs_all" ON public.avoirs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.lignes_avoir (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avoir_id UUID NOT NULL REFERENCES public.avoirs(id) ON DELETE CASCADE,
  ordre INT NOT NULL DEFAULT 0,
  reference TEXT,
  designation TEXT,
  quantite INT DEFAULT 1,
  prix_unitaire NUMERIC(11,3) DEFAULT 0,
  remise NUMERIC(11,3) DEFAULT 0,
  tva NUMERIC(5,2) DEFAULT 19.00,
  total_ht NUMERIC(11,3) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lignes_avoir ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_lignes_avoir_all" ON public.lignes_avoir FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- DOCUMENTS QUALITE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.documents_qualite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  version TEXT,
  date_realisation DATE,
  libelle TEXT,
  description TEXT,
  fichier_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents_qualite ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_documents_qualite_all" ON public.documents_qualite FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- MOYENS DE LOCOMOTION
-- ============================================================

CREATE TABLE IF NOT EXISTS public.moyens_locomotion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT,
  immatriculation TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.moyens_locomotion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_moyens_locomotion_all" ON public.moyens_locomotion FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- COLONNES MANQUANTES SUR TABLES EXISTANTES
-- ============================================================

ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS moyen_locomotion_id UUID REFERENCES public.moyens_locomotion(id);
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS kilometrage_depart INT;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS kilometrage_arrivee INT;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS frais NUMERIC(11,3);
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS bon NUMERIC(11,3);

ALTER TABLE public.prelevements ADD COLUMN IF NOT EXISTS denomination TEXT;
ALTER TABLE public.prelevements ADD COLUMN IF NOT EXISTS secteur TEXT;
ALTER TABLE public.prelevements ADD COLUMN IF NOT EXISTS tp_produit NUMERIC(5,1);
ALTER TABLE public.prelevements ADD COLUMN IF NOT EXISTS tp_ambiante NUMERIC(5,1);
ALTER TABLE public.prelevements ADD COLUMN IF NOT EXISTS fournisseur TEXT;
ALTER TABLE public.prelevements ADD COLUMN IF NOT EXISTS lot TEXT;
ALTER TABLE public.prelevements ADD COLUMN IF NOT EXISTS df DATE;
ALTER TABLE public.prelevements ADD COLUMN IF NOT EXISTS dlc DATE;
ALTER TABLE public.prelevements ADD COLUMN IF NOT EXISTS version TEXT;
ALTER TABLE public.prelevements ADD COLUMN IF NOT EXISTS validateur_id UUID;
ALTER TABLE public.prelevements ADD COLUMN IF NOT EXISTS conclusion TEXT;
ALTER TABLE public.prelevements ADD COLUMN IF NOT EXISTS region_critere_id UUID REFERENCES public.region_criteres(id);
ALTER TABLE public.prelevements ADD COLUMN IF NOT EXISTS referentiel_id UUID REFERENCES public.referentiels(id);
ALTER TABLE public.prelevements ADD COLUMN IF NOT EXISTS pack_analyse_id UUID REFERENCES public.pack_analyses(id);
ALTER TABLE public.prelevements ADD COLUMN IF NOT EXISTS mode_acheminement TEXT;
ALTER TABLE public.prelevements ADD COLUMN IF NOT EXISTS mode_conservation TEXT;
ALTER TABLE public.prelevements ADD COLUMN IF NOT EXISTS remarque_non_conformite TEXT;
ALTER TABLE public.prelevements ADD COLUMN IF NOT EXISTS famille_id UUID REFERENCES public.familles(id);

ALTER TABLE public.bons_commande ADD COLUMN IF NOT EXISTS temperature_reception TEXT;
ALTER TABLE public.bons_commande ADD COLUMN IF NOT EXISTS code_externe TEXT;
ALTER TABLE public.bons_commande ADD COLUMN IF NOT EXISTS responsable_rencontre TEXT;
ALTER TABLE public.bons_commande ADD COLUMN IF NOT EXISTS region_critere_id UUID REFERENCES public.region_criteres(id);
ALTER TABLE public.bons_commande ADD COLUMN IF NOT EXISTS referentiel_id UUID REFERENCES public.referentiels(id);

-- Séquences de numérotation
INSERT INTO public.numbering_sequences (code, label, prefix, format_template, padding, current_value, current_year, year_reset, suffix)
VALUES
  ('FAC', 'Factures', 'FAC', '{prefix}-{year}-{number}', 5, 0, 2026, true, ''),
  ('REG', 'Règlements', 'REG', '{prefix}-{year}-{number}', 5, 0, 2026, true, ''),
  ('AVR', 'Avoirs', 'AVR', '{prefix}-{year}-{number}', 5, 0, 2026, true, '')
ON CONFLICT (code) DO NOTHING;

-- Triggers updated_at
CREATE TRIGGER update_referentiels_updated_at BEFORE UPDATE ON public.referentiels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_catalogue_analyses_updated_at BEFORE UPDATE ON public.catalogue_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_criteres_updated_at BEFORE UPDATE ON public.criteres FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pack_analyses_updated_at BEFORE UPDATE ON public.pack_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_milieux_updated_at BEFORE UPDATE ON public.milieux FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_factures_updated_at BEFORE UPDATE ON public.factures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reglements_updated_at BEFORE UPDATE ON public.reglements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_avoirs_updated_at BEFORE UPDATE ON public.avoirs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_qualite_updated_at BEFORE UPDATE ON public.documents_qualite FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
