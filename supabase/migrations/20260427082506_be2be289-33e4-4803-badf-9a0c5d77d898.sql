-- =======================
-- ENUMS
-- =======================
CREATE TYPE public.nc_source AS ENUM ('interne','client','audit','fournisseur','equipement','methode','autre');
CREATE TYPE public.nc_gravite AS ENUM ('mineure','majeure','critique');
CREATE TYPE public.nc_statut AS ENUM ('ouverte','en_traitement','en_verification','cloturee','annulee');

CREATE TYPE public.reclamation_canal AS ENUM ('email','telephone','courrier','visite','portail','autre');
CREATE TYPE public.reclamation_statut AS ENUM ('recue','en_traitement','en_attente_client','resolue','cloturee','rejetee');

CREATE TYPE public.capa_type AS ENUM ('corrective','preventive','immediate','amelioration');
CREATE TYPE public.capa_statut AS ENUM ('planifiee','en_cours','realisee','verifiee','cloturee','abandonnee');

CREATE TYPE public.audit_type AS ENUM ('interne','externe','fournisseur','accreditation','suivi');
CREATE TYPE public.audit_statut AS ENUM ('planifie','en_cours','realise','rapport_diffuse','cloture');
CREATE TYPE public.constat_type AS ENUM ('ecart_majeur','ecart_mineur','observation','opportunite','point_fort');

CREATE TYPE public.revue_statut AS ENUM ('planifiee','tenue','cloturee');

-- =======================
-- NON-CONFORMITES
-- =======================
CREATE TABLE public.non_conformites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  date_detection DATE NOT NULL DEFAULT CURRENT_DATE,
  source nc_source NOT NULL DEFAULT 'interne',
  gravite nc_gravite NOT NULL DEFAULT 'mineure',
  statut nc_statut NOT NULL DEFAULT 'ouverte',
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  origine TEXT,
  detectee_par UUID,
  service TEXT,
  client_id UUID,
  analyse_id UUID,
  prelevement_id UUID,
  equipement_ref TEXT,
  methode_id UUID,
  impact TEXT,
  action_immediate TEXT,
  cause_racine TEXT,
  responsable_id UUID,
  date_cloture DATE,
  efficacite_verifiee BOOLEAN DEFAULT FALSE,
  commentaire_cloture TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nc_statut ON public.non_conformites(statut);
CREATE INDEX idx_nc_date ON public.non_conformites(date_detection DESC);
CREATE INDEX idx_nc_client ON public.non_conformites(client_id);

-- =======================
-- RECLAMATIONS
-- =======================
CREATE TABLE public.reclamations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  date_reception DATE NOT NULL DEFAULT CURRENT_DATE,
  canal reclamation_canal NOT NULL DEFAULT 'email',
  statut reclamation_statut NOT NULL DEFAULT 'recue',
  client_id UUID NOT NULL,
  contact_nom TEXT,
  contact_email TEXT,
  contact_telephone TEXT,
  objet TEXT NOT NULL,
  description TEXT NOT NULL,
  rapport_id UUID,
  analyse_id UUID,
  bc_id UUID,
  fondee BOOLEAN,
  reponse TEXT,
  date_accuse DATE,
  date_reponse DATE,
  date_cloture DATE,
  satisfaction_client INTEGER CHECK (satisfaction_client BETWEEN 1 AND 5),
  responsable_id UUID,
  nc_id UUID REFERENCES public.non_conformites(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rec_statut ON public.reclamations(statut);
CREATE INDEX idx_rec_client ON public.reclamations(client_id);

-- =======================
-- ACTIONS CAPA
-- =======================
CREATE TABLE public.actions_capa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  type capa_type NOT NULL DEFAULT 'corrective',
  statut capa_statut NOT NULL DEFAULT 'planifiee',
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  nc_id UUID REFERENCES public.non_conformites(id) ON DELETE CASCADE,
  reclamation_id UUID REFERENCES public.reclamations(id) ON DELETE CASCADE,
  audit_id UUID,
  responsable_id UUID,
  date_planifiee DATE,
  date_realisee DATE,
  date_verification DATE,
  efficace BOOLEAN,
  commentaire_efficacite TEXT,
  preuves TEXT,
  cout_estime NUMERIC(12,2),
  cout_reel NUMERIC(12,2),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_capa_statut ON public.actions_capa(statut);
CREATE INDEX idx_capa_nc ON public.actions_capa(nc_id);
CREATE INDEX idx_capa_rec ON public.actions_capa(reclamation_id);

-- =======================
-- AUDITS
-- =======================
CREATE TABLE public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  type audit_type NOT NULL DEFAULT 'interne',
  statut audit_statut NOT NULL DEFAULT 'planifie',
  titre TEXT NOT NULL,
  perimetre TEXT,
  referentiel TEXT,
  date_debut DATE,
  date_fin DATE,
  auditeur_principal TEXT,
  auditeurs TEXT,
  audites TEXT,
  organisme TEXT,
  conclusion TEXT,
  rapport_url TEXT,
  responsable_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audits_statut ON public.audits(statut);
CREATE INDEX idx_audits_date ON public.audits(date_debut DESC);

-- =======================
-- CONSTATS D'AUDIT
-- =======================
CREATE TABLE public.audit_constats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  numero_constat TEXT,
  type constat_type NOT NULL DEFAULT 'observation',
  exigence TEXT,
  description TEXT NOT NULL,
  preuves TEXT,
  nc_id UUID REFERENCES public.non_conformites(id) ON DELETE SET NULL,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_constats_audit ON public.audit_constats(audit_id);

-- =======================
-- REVUES DE DIRECTION
-- =======================
CREATE TABLE public.revues_direction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  date_revue DATE NOT NULL DEFAULT CURRENT_DATE,
  statut revue_statut NOT NULL DEFAULT 'planifiee',
  titre TEXT NOT NULL,
  participants TEXT,
  ordre_du_jour TEXT,
  bilan_qualite TEXT,
  bilan_audits TEXT,
  bilan_nc TEXT,
  bilan_reclamations TEXT,
  bilan_satisfaction TEXT,
  decisions TEXT,
  axes_amelioration TEXT,
  ressources_necessaires TEXT,
  responsable_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_revues_date ON public.revues_direction(date_revue DESC);

-- =======================
-- INDICATEURS QUALITE (KPI mensuels)
-- =======================
CREATE TABLE public.indicateurs_qualite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annee INTEGER NOT NULL,
  mois INTEGER NOT NULL CHECK (mois BETWEEN 1 AND 12),
  nb_nc_ouvertes INTEGER NOT NULL DEFAULT 0,
  nb_nc_cloturees INTEGER NOT NULL DEFAULT 0,
  nb_reclamations INTEGER NOT NULL DEFAULT 0,
  nb_reclamations_fondees INTEGER NOT NULL DEFAULT 0,
  delai_moyen_traitement_nc NUMERIC(6,2),
  delai_moyen_traitement_rec NUMERIC(6,2),
  taux_satisfaction NUMERIC(5,2),
  taux_conformite NUMERIC(5,2),
  nb_rapports_emis INTEGER NOT NULL DEFAULT 0,
  nb_audits INTEGER NOT NULL DEFAULT 0,
  commentaire TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(annee, mois)
);

-- =======================
-- TRIGGERS updated_at
-- =======================
CREATE TRIGGER trg_nc_updated BEFORE UPDATE ON public.non_conformites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_rec_updated BEFORE UPDATE ON public.reclamations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_capa_updated BEFORE UPDATE ON public.actions_capa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_audits_updated BEFORE UPDATE ON public.audits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_revues_updated BEFORE UPDATE ON public.revues_direction
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_indic_updated BEFORE UPDATE ON public.indicateurs_qualite
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =======================
-- RLS
-- =======================
ALTER TABLE public.non_conformites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reclamations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions_capa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_constats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revues_direction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicateurs_qualite ENABLE ROW LEVEL SECURITY;

-- NC : staff lit, qualité/direction/admin/chef écrivent, technicien peut créer
CREATE POLICY staff_read_nc ON public.non_conformites FOR SELECT TO authenticated
  USING (NOT public.has_role(auth.uid(), 'client'));
CREATE POLICY qualite_write_nc ON public.non_conformites FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'direction') OR public.has_role(auth.uid(),'qualite') OR public.has_role(auth.uid(),'chef_labo'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'direction') OR public.has_role(auth.uid(),'qualite') OR public.has_role(auth.uid(),'chef_labo'));
CREATE POLICY tech_create_nc ON public.non_conformites FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'technicien') AND created_by = auth.uid());

-- Réclamations : staff lit, qualité/direction/admin/commercial écrivent
CREATE POLICY staff_read_rec ON public.reclamations FOR SELECT TO authenticated
  USING (NOT public.has_role(auth.uid(),'client'));
CREATE POLICY qualite_write_rec ON public.reclamations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'direction') OR public.has_role(auth.uid(),'qualite') OR public.has_role(auth.uid(),'commercial'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'direction') OR public.has_role(auth.uid(),'qualite') OR public.has_role(auth.uid(),'commercial'));

-- CAPA : staff lit, qualité/direction/admin/chef écrivent
CREATE POLICY staff_read_capa ON public.actions_capa FOR SELECT TO authenticated
  USING (NOT public.has_role(auth.uid(),'client'));
CREATE POLICY qualite_write_capa ON public.actions_capa FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'direction') OR public.has_role(auth.uid(),'qualite') OR public.has_role(auth.uid(),'chef_labo'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'direction') OR public.has_role(auth.uid(),'qualite') OR public.has_role(auth.uid(),'chef_labo'));

-- Audits : staff lit, qualité/direction/admin écrivent
CREATE POLICY staff_read_audits ON public.audits FOR SELECT TO authenticated
  USING (NOT public.has_role(auth.uid(),'client'));
CREATE POLICY qualite_write_audits ON public.audits FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'direction') OR public.has_role(auth.uid(),'qualite'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'direction') OR public.has_role(auth.uid(),'qualite'));

-- Constats audit
CREATE POLICY staff_read_constats ON public.audit_constats FOR SELECT TO authenticated
  USING (NOT public.has_role(auth.uid(),'client'));
CREATE POLICY qualite_write_constats ON public.audit_constats FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'direction') OR public.has_role(auth.uid(),'qualite'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'direction') OR public.has_role(auth.uid(),'qualite'));

-- Revues : direction/admin uniquement
CREATE POLICY direction_read_revues ON public.revues_direction FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'direction') OR public.has_role(auth.uid(),'qualite') OR public.has_role(auth.uid(),'chef_labo'));
CREATE POLICY direction_write_revues ON public.revues_direction FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'direction') OR public.has_role(auth.uid(),'qualite'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'direction') OR public.has_role(auth.uid(),'qualite'));

-- Indicateurs : staff lit, qualité/direction/admin écrivent
CREATE POLICY staff_read_indic ON public.indicateurs_qualite FOR SELECT TO authenticated
  USING (NOT public.has_role(auth.uid(),'client'));
CREATE POLICY qualite_write_indic ON public.indicateurs_qualite FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'direction') OR public.has_role(auth.uid(),'qualite'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'direction') OR public.has_role(auth.uid(),'qualite'));

-- =======================
-- Sequences numérotation
-- =======================
INSERT INTO public.numbering_sequences (code, label, prefix, padding, year_reset, format_template)
VALUES
  ('NC',  'Non-conformité',     'NC',   5, true, '{prefix}-{year}-{number}'),
  ('REC', 'Réclamation',        'REC',  5, true, '{prefix}-{year}-{number}'),
  ('CAPA','Action CAPA',        'CAPA', 5, true, '{prefix}-{year}-{number}'),
  ('AUD', 'Audit',              'AUD',  5, true, '{prefix}-{year}-{number}'),
  ('REV', 'Revue de direction', 'REV',  5, true, '{prefix}-{year}-{number}')
ON CONFLICT (code) DO NOTHING;