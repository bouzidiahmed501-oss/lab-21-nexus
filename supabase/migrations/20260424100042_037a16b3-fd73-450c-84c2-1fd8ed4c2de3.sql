-- ============================================================
-- BALIMS — Tables de configuration globale
-- ============================================================

-- 1. Table app_settings : configuration par catégorie (JSON)
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL UNIQUE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read settings"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and direction can insert settings"
  ON public.app_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'direction'::app_role)
  );

CREATE POLICY "Admins and direction can update settings"
  ON public.app_settings
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'direction'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'direction'::app_role)
  );

CREATE POLICY "Admins can delete settings"
  ON public.app_settings
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed des catégories par défaut (vides - admin remplira)
INSERT INTO public.app_settings (category, settings) VALUES
  ('societe', '{
    "nom_commercial": "BALIMS",
    "raison_sociale": "",
    "adresse": "",
    "ville": "",
    "code_postal": "",
    "pays": "Tunisie",
    "telephone": "",
    "fax": "",
    "email": "",
    "site_web": "",
    "matricule_fiscal": "",
    "registre_commerce": "",
    "code_tva": "",
    "rib": "",
    "iban": "",
    "swift": "",
    "logo_url": "",
    "signature_url": "",
    "cachet_url": "",
    "directeur_nom": "",
    "directeur_signature_url": ""
  }'::jsonb),
  ('workflow', '{
    "validation_bc_obligatoire": true,
    "double_validation_rapport": true,
    "feuille_route_auto": true,
    "delai_alerte_analyse_jours": 3,
    "delai_relance_client_jours": 7,
    "auto_assign_technicien": false,
    "exiger_prelevement_avant_analyse": true,
    "exiger_validation_qualite": true
  }'::jsonb),
  ('facturation', '{
    "tva_defaut": 19,
    "devise": "TND",
    "delai_paiement_jours": 30,
    "elfatoora_actif": false,
    "elfatoora_endpoint": "",
    "elfatoora_certificate": "",
    "mention_legale_facture": "",
    "conditions_paiement": "",
    "penalite_retard_pct": 0
  }'::jsonb),
  ('notifications', '{
    "email_actif": true,
    "sms_actif": false,
    "notif_nouveau_bc": true,
    "notif_analyse_terminee": true,
    "notif_rapport_pret": true,
    "notif_facture_emise": true,
    "notif_equipement_etalonnage": true,
    "smtp_host": "",
    "smtp_port": 587,
    "smtp_user": ""
  }'::jsonb),
  ('securite', '{
    "longueur_mdp_min": 12,
    "exiger_majuscule": true,
    "exiger_chiffre": true,
    "exiger_special": true,
    "duree_session_minutes": 480,
    "verrouillage_apres_echecs": 5,
    "force_2fa_admin": false,
    "audit_log_retention_jours": 365
  }'::jsonb),
  ('integrations', '{
    "elfatoora_actif": false,
    "google_calendar_actif": false,
    "outlook_actif": false,
    "iso_17025_actif": false,
    "labguard_actif": false,
    "api_externe_actif": false
  }'::jsonb),
  ('sauvegardes', '{
    "auto_backup_actif": true,
    "frequence_jours": 1,
    "retention_jours": 30,
    "destination": "cloud",
    "derniere_sauvegarde": null
  }'::jsonb)
ON CONFLICT (category) DO NOTHING;

-- 2. Table numbering_sequences : compteurs documents
CREATE TABLE public.numbering_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  prefix text NOT NULL DEFAULT '',
  suffix text NOT NULL DEFAULT '',
  padding integer NOT NULL DEFAULT 5,
  current_value integer NOT NULL DEFAULT 0,
  year_reset boolean NOT NULL DEFAULT true,
  current_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now())::int,
  format_template text NOT NULL DEFAULT '{prefix}-{year}-{number}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.numbering_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sequences"
  ON public.numbering_sequences
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage sequences"
  ON public.numbering_sequences
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_numbering_sequences_updated_at
  BEFORE UPDATE ON public.numbering_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed des séquences par défaut
INSERT INTO public.numbering_sequences (code, label, prefix, padding, format_template) VALUES
  ('mission', 'Missions', 'MIS', 5, '{prefix}-{year}-{number}'),
  ('bon_commande', 'Bons de commande', 'BC', 5, '{prefix}-{year}-{number}'),
  ('feuille_route', 'Feuilles de route', 'FR', 5, '{prefix}-{year}-{number}'),
  ('prelevement', 'Prélèvements', 'PRL', 5, '{prefix}-{year}-{number}'),
  ('analyse', 'Analyses', 'AN', 6, '{prefix}-{year}-{number}'),
  ('rapport', 'Rapports d''essai', 'RAP', 5, '{prefix}-{year}-{number}'),
  ('devis', 'Devis', 'DEV', 5, '{prefix}-{year}-{number}'),
  ('facture', 'Factures', 'FAC', 5, '{prefix}-{year}-{number}'),
  ('avoir', 'Avoirs', 'AV', 5, '{prefix}-{year}-{number}'),
  ('client', 'Clients', 'CLI', 5, '{prefix}-{number}'),
  ('equipement', 'Équipements', 'EQ', 4, '{prefix}-{number}')
ON CONFLICT (code) DO NOTHING;