-- Types de prélèvement
CREATE TABLE public.type_prelevements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  libelle text NOT NULL,
  description text,
  categorie text,
  champs_specifiques jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.type_prelevements TO authenticated;
GRANT ALL ON public.type_prelevements TO service_role;
ALTER TABLE public.type_prelevements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_type_prelevements_all" ON public.type_prelevements TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_type_prelevements_updated_at BEFORE UPDATE ON public.type_prelevements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Chaînes d'analyse
CREATE TABLE public.chaines_analyse (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  libelle text NOT NULL,
  catalogue_analyse_id uuid REFERENCES public.catalogue_analyses(id),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chaines_analyse TO authenticated;
GRANT ALL ON public.chaines_analyse TO service_role;
ALTER TABLE public.chaines_analyse ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_chaines_all" ON public.chaines_analyse TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_chaines_updated_at BEFORE UPDATE ON public.chaines_analyse FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.chaine_etapes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chaine_id uuid NOT NULL REFERENCES public.chaines_analyse(id) ON DELETE CASCADE,
  ordre int NOT NULL DEFAULT 0,
  libelle text NOT NULL,
  duree_minutes int,
  technicien_role text,
  equipement_id uuid REFERENCES public.equipements(id),
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chaine_etapes TO authenticated;
GRANT ALL ON public.chaine_etapes TO service_role;
ALTER TABLE public.chaine_etapes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_chaine_etapes_all" ON public.chaine_etapes TO authenticated USING (true) WITH CHECK (true);

-- Dépenses
CREATE TABLE public.depenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  date_depense date NOT NULL DEFAULT CURRENT_DATE,
  categorie text NOT NULL,
  libelle text NOT NULL,
  montant_ht numeric(12,3) NOT NULL DEFAULT 0,
  tva_pct numeric(5,2) NOT NULL DEFAULT 19,
  montant_ttc numeric(12,3) NOT NULL DEFAULT 0,
  beneficiaire text,
  mode_paiement text,
  reference_piece text,
  projet_id uuid REFERENCES public.projets(id),
  mission_id uuid REFERENCES public.missions(id),
  employe_id uuid REFERENCES public.employes(id),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.depenses TO authenticated;
GRANT ALL ON public.depenses TO service_role;
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_depenses_all" ON public.depenses TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_depenses_updated_at BEFORE UPDATE ON public.depenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Réservations d'équipement
CREATE TABLE public.reservations_equipement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  equipement_id uuid NOT NULL REFERENCES public.equipements(id),
  date_debut timestamptz NOT NULL,
  date_fin timestamptz NOT NULL,
  utilisateur_id uuid REFERENCES auth.users(id),
  motif text,
  statut text NOT NULL DEFAULT 'planifiee',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations_equipement TO authenticated;
GRANT ALL ON public.reservations_equipement TO service_role;
ALTER TABLE public.reservations_equipement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_reservations_all" ON public.reservations_equipement TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations_equipement FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Relances (recouvrement)
CREATE TABLE public.relances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  facture_id uuid REFERENCES public.factures(id),
  client_id uuid REFERENCES public.clients(id),
  niveau int NOT NULL DEFAULT 1,
  date_envoi date NOT NULL DEFAULT CURRENT_DATE,
  mode text NOT NULL DEFAULT 'email',
  contenu text,
  montant_relance numeric(12,3),
  statut text NOT NULL DEFAULT 'envoyee',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.relances TO authenticated;
GRANT ALL ON public.relances TO service_role;
ALTER TABLE public.relances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_relances_all" ON public.relances TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_relances_updated_at BEFORE UPDATE ON public.relances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Séquences de numérotation
INSERT INTO public.numbering_sequences (code, label, prefix, padding, format_template) VALUES
  ('DEP', 'Dépenses', 'DEP', 5, '{prefix}-{year}-{number}'),
  ('RES', 'Réservations équipement', 'RES', 5, '{prefix}-{year}-{number}'),
  ('REL', 'Relances', 'REL', 5, '{prefix}-{year}-{number}')
ON CONFLICT (code) DO NOTHING;