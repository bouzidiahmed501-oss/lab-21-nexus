
-- =========================================================================
-- PHASE A.1 — Fondations Tenant (paramétrage société)
-- =========================================================================

-- 1. Table tenants (sociétés SaaS)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  favicon_url TEXT,
  couleur_primaire TEXT DEFAULT '#0c2340',
  couleur_secondaire TEXT DEFAULT '#2d8a9e',
  adresse TEXT,
  ville TEXT,
  code_postal TEXT,
  pays TEXT DEFAULT 'Tunisie',
  telephone TEXT,
  email TEXT,
  site_web TEXT,
  matricule_fiscal TEXT,
  rib TEXT,
  tva_defaut NUMERIC(5,2) DEFAULT 19.00,
  timbre_fiscal NUMERIC(10,2) DEFAULT 1.000,
  retenue_source NUMERIC(5,2) DEFAULT 0,
  monnaie TEXT DEFAULT 'TND',
  langue TEXT DEFAULT 'fr',
  fuseau TEXT DEFAULT 'Africa/Tunis',
  format_date TEXT DEFAULT 'dd/MM/yyyy',
  mentions_legales TEXT,
  signature_scan_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 2. Tenant par défaut « BALIMS Origine »
INSERT INTO public.tenants (id, nom, slug, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'BALIMS Origine', 'balims-origine', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Colonne tenant_id sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

UPDATE public.profiles
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);

-- 4. Fonction current_tenant_id (SDF)
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$;

-- 5. Mise à jour handle_new_user pour affecter tenant par défaut
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(
      (NEW.raw_user_meta_data ->> 'tenant_id')::UUID,
      '00000000-0000-0000-0000-000000000001'::UUID
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 6. Policies tenants
CREATE POLICY "Users can view their tenant"
  ON public.tenants FOR SELECT TO authenticated
  USING (id = public.current_tenant_id() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tenant"
  ON public.tenants FOR UPDATE TO authenticated
  USING (id = public.current_tenant_id() AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = public.current_tenant_id() AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Superadmins can insert tenants"
  ON public.tenants FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Table tenant_settings (clé/valeur JSON)
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_settings TO authenticated;
GRANT ALL ON public.tenant_settings TO service_role;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their tenant settings"
  ON public.tenant_settings FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Admins manage their tenant settings"
  ON public.tenant_settings FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_tenant_settings_updated_at
  BEFORE UPDATE ON public.tenant_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant ON public.tenant_settings(tenant_id);

-- 8. Table notification_rules
CREATE TABLE IF NOT EXISTS public.notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  evenement TEXT NOT NULL, -- ex: facture_impayee, seuil_iot, echeance_etalonnage, nc_ouverte, devis_valide, rapport_signe
  libelle TEXT NOT NULL,
  canal_in_app BOOLEAN NOT NULL DEFAULT true,
  canal_email BOOLEAN NOT NULL DEFAULT false,
  destinataires_roles TEXT[] DEFAULT '{}',
  destinataires_users UUID[] DEFAULT '{}',
  delai_minutes INTEGER DEFAULT 0,
  actif BOOLEAN NOT NULL DEFAULT true,
  conditions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_rules TO authenticated;
GRANT ALL ON public.notification_rules TO service_role;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their tenant notification rules"
  ON public.notification_rules FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Admins manage tenant notification rules"
  ON public.notification_rules FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_notification_rules_updated_at
  BEFORE UPDATE ON public.notification_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_notification_rules_tenant ON public.notification_rules(tenant_id);

-- 9. Extension numbering_sequences avec tenant_id
ALTER TABLE public.numbering_sequences
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

UPDATE public.numbering_sequences
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_numbering_sequences_tenant ON public.numbering_sequences(tenant_id);
