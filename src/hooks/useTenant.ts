import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Tenant {
  id: string;
  nom: string;
  slug: string;
  logo_url: string | null;
  favicon_url: string | null;
  couleur_primaire: string | null;
  couleur_secondaire: string | null;
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  pays: string | null;
  telephone: string | null;
  email: string | null;
  site_web: string | null;
  matricule_fiscal: string | null;
  rib: string | null;
  tva_defaut: number | null;
  timbre_fiscal: number | null;
  retenue_source: number | null;
  monnaie: string | null;
  langue: string | null;
  fuseau: string | null;
  format_date: string | null;
  mentions_legales: string | null;
  signature_scan_url: string | null;
  is_active: boolean;
}

export function useTenant() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setTenant(null);
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles" as never)
      .select("tenant_id")
      .eq("id", userData.user.id)
      .maybeSingle();
    const tenantId = (profile as { tenant_id?: string } | null)?.tenant_id;
    if (!tenantId) {
      setTenant(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("tenants" as never)
      .select("*")
      .eq("id", tenantId)
      .maybeSingle();
    setTenant((data as unknown as Tenant) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { tenant, loading, reload };
}
