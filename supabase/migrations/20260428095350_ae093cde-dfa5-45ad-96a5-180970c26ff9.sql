-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE equipement_statut AS ENUM ('actif', 'maintenance', 'hors_service', 'reforme');
CREATE TYPE etalonnage_resultat AS ENUM ('conforme', 'non_conforme', 'avec_reserves');
CREATE TYPE maintenance_type AS ENUM ('preventive', 'corrective', 'verification');
CREATE TYPE contrat_type AS ENUM ('cdi', 'cdd', 'stage', 'freelance', 'interim');
CREATE TYPE conge_type AS ENUM ('annuel', 'maladie', 'maternite', 'paternite', 'sans_solde', 'special');
CREATE TYPE conge_statut AS ENUM ('demande', 'approuve', 'refuse', 'annule');
CREATE TYPE projet_statut AS ENUM ('planifie', 'en_cours', 'en_pause', 'termine', 'annule');
CREATE TYPE tache_statut AS ENUM ('a_faire', 'en_cours', 'bloquee', 'terminee');
CREATE TYPE tache_priorite AS ENUM ('basse', 'normale', 'haute', 'critique');

-- ============================================================
-- ÉQUIPEMENTS
-- ============================================================
CREATE TABLE public.equipements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  code TEXT,
  designation TEXT NOT NULL,
  marque TEXT,
  modele TEXT,
  numero_serie TEXT,
  localisation TEXT,
  service TEXT,
  statut equipement_statut NOT NULL DEFAULT 'actif',
  date_achat DATE,
  date_mise_service DATE,
  fournisseur TEXT,
  cout_achat NUMERIC,
  garantie_fin DATE,
  frequence_etalonnage_mois INTEGER,
  prochaine_etalonnage DATE,
  responsable_id UUID,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.equipements ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_read_equipements ON public.equipements FOR SELECT TO authenticated
  USING (NOT has_role(auth.uid(), 'client'));
CREATE POLICY write_equipements ON public.equipements FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'qualite') OR has_role(auth.uid(),'chef_labo'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'qualite') OR has_role(auth.uid(),'chef_labo'));

CREATE TRIGGER trg_equipements_updated BEFORE UPDATE ON public.equipements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.etalonnages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipement_id UUID NOT NULL REFERENCES public.equipements(id) ON DELETE CASCADE,
  date_etalonnage DATE NOT NULL,
  prochaine_date DATE,
  organisme TEXT,
  numero_certificat TEXT,
  resultat etalonnage_resultat NOT NULL DEFAULT 'conforme',
  cout NUMERIC,
  certificat_url TEXT,
  observations TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.etalonnages ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_read_etal ON public.etalonnages FOR SELECT TO authenticated
  USING (NOT has_role(auth.uid(),'client'));
CREATE POLICY write_etal ON public.etalonnages FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'qualite') OR has_role(auth.uid(),'chef_labo'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'qualite') OR has_role(auth.uid(),'chef_labo'));

CREATE TABLE public.maintenances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipement_id UUID NOT NULL REFERENCES public.equipements(id) ON DELETE CASCADE,
  type maintenance_type NOT NULL DEFAULT 'preventive',
  date_intervention DATE NOT NULL,
  intervenant TEXT,
  description TEXT NOT NULL,
  cout NUMERIC,
  duree_arret_h NUMERIC,
  observations TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maintenances ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_read_maint ON public.maintenances FOR SELECT TO authenticated
  USING (NOT has_role(auth.uid(),'client'));
CREATE POLICY write_maint ON public.maintenances FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'qualite') OR has_role(auth.uid(),'chef_labo'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'qualite') OR has_role(auth.uid(),'chef_labo'));

-- ============================================================
-- RH & PAIE
-- ============================================================
CREATE TABLE public.employes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  matricule TEXT,
  user_id UUID,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  cin TEXT,
  cnss TEXT,
  email TEXT,
  telephone TEXT,
  adresse TEXT,
  date_naissance DATE,
  fonction TEXT,
  service TEXT,
  contrat_type contrat_type NOT NULL DEFAULT 'cdi',
  date_embauche DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin_contrat DATE,
  date_sortie DATE,
  salaire_base NUMERIC NOT NULL DEFAULT 0,
  rib TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employes ENABLE ROW LEVEL SECURITY;
CREATE POLICY rh_read_employes ON public.employes FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'rh') OR user_id = auth.uid());
CREATE POLICY rh_write_employes ON public.employes FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'rh'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'rh'));

CREATE TRIGGER trg_employes_updated BEFORE UPDATE ON public.employes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.conges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  type conge_type NOT NULL DEFAULT 'annuel',
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  nb_jours NUMERIC NOT NULL DEFAULT 0,
  motif TEXT,
  statut conge_statut NOT NULL DEFAULT 'demande',
  validateur_id UUID,
  date_validation TIMESTAMPTZ,
  commentaire_validation TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conges ENABLE ROW LEVEL SECURITY;
CREATE POLICY rh_read_conges ON public.conges FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'rh')
         OR EXISTS (SELECT 1 FROM public.employes e WHERE e.id = conges.employe_id AND e.user_id = auth.uid()));
CREATE POLICY rh_write_conges ON public.conges FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'rh'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'rh'));

CREATE TRIGGER trg_conges_updated BEFORE UPDATE ON public.conges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.pointages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  date_pointage DATE NOT NULL,
  heure_arrivee TIME,
  heure_depart TIME,
  heures_travaillees NUMERIC,
  heures_supp NUMERIC DEFAULT 0,
  absent BOOLEAN NOT NULL DEFAULT false,
  motif_absence TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employe_id, date_pointage)
);
ALTER TABLE public.pointages ENABLE ROW LEVEL SECURITY;
CREATE POLICY rh_read_pointages ON public.pointages FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'rh')
         OR EXISTS (SELECT 1 FROM public.employes e WHERE e.id = pointages.employe_id AND e.user_id = auth.uid()));
CREATE POLICY rh_write_pointages ON public.pointages FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'rh'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'rh'));

CREATE TABLE public.bulletins_paie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  annee INTEGER NOT NULL,
  mois INTEGER NOT NULL CHECK (mois BETWEEN 1 AND 12),
  salaire_base NUMERIC NOT NULL DEFAULT 0,
  primes NUMERIC NOT NULL DEFAULT 0,
  heures_supp_montant NUMERIC NOT NULL DEFAULT 0,
  retenues NUMERIC NOT NULL DEFAULT 0,
  brut NUMERIC NOT NULL DEFAULT 0,
  cnss_salarial NUMERIC NOT NULL DEFAULT 0,
  cnss_patronal NUMERIC NOT NULL DEFAULT 0,
  irpp NUMERIC NOT NULL DEFAULT 0,
  net_a_payer NUMERIC NOT NULL DEFAULT 0,
  jours_travailles NUMERIC,
  jours_conges NUMERIC,
  observations TEXT,
  pdf_path TEXT,
  validated_by UUID,
  validated_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employe_id, annee, mois)
);
ALTER TABLE public.bulletins_paie ENABLE ROW LEVEL SECURITY;
CREATE POLICY rh_read_bulletins ON public.bulletins_paie FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'rh') OR has_role(auth.uid(),'comptable')
         OR EXISTS (SELECT 1 FROM public.employes e WHERE e.id = bulletins_paie.employe_id AND e.user_id = auth.uid()));
CREATE POLICY rh_write_bulletins ON public.bulletins_paie FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'rh'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'rh'));

CREATE TRIGGER trg_bulletins_updated BEFORE UPDATE ON public.bulletins_paie
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- PROJETS
-- ============================================================
CREATE TABLE public.projets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  description TEXT,
  responsable_id UUID,
  client_id UUID,
  date_debut DATE,
  date_fin_prevue DATE,
  date_fin_reelle DATE,
  budget NUMERIC,
  cout_reel NUMERIC DEFAULT 0,
  avancement_pct INTEGER NOT NULL DEFAULT 0 CHECK (avancement_pct BETWEEN 0 AND 100),
  statut projet_statut NOT NULL DEFAULT 'planifie',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projets ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_read_projets ON public.projets FOR SELECT TO authenticated
  USING (NOT has_role(auth.uid(),'client'));
CREATE POLICY write_projets ON public.projets FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo'));

CREATE TRIGGER trg_projets_updated BEFORE UPDATE ON public.projets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.projet_taches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projet_id UUID NOT NULL REFERENCES public.projets(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT,
  assigne_id UUID,
  date_debut DATE,
  date_echeance DATE,
  date_fin DATE,
  priorite tache_priorite NOT NULL DEFAULT 'normale',
  statut tache_statut NOT NULL DEFAULT 'a_faire',
  ordre INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projet_taches ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_read_taches ON public.projet_taches FOR SELECT TO authenticated
  USING (NOT has_role(auth.uid(),'client'));
CREATE POLICY write_taches ON public.projet_taches FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'direction') OR has_role(auth.uid(),'chef_labo'));

CREATE TRIGGER trg_taches_updated BEFORE UPDATE ON public.projet_taches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- NUMBERING SEQUENCES
-- ============================================================
INSERT INTO public.numbering_sequences (code, label, prefix, padding, year_reset) VALUES
  ('EQP', 'Équipements', 'EQP', 5, false),
  ('EMP', 'Employés', 'EMP', 5, false),
  ('PRJ', 'Projets', 'PRJ', 5, true)
ON CONFLICT (code) DO NOTHING;