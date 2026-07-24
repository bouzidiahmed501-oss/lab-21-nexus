import { supabase } from "@/integrations/supabase/client";

export interface Societe {
  raison_sociale?: string;
  adresse?: string;
  ville?: string;
  matricule_fiscal?: string;
  telephone?: string;
  email?: string;
  site_web?: string;
  rib?: string;
  banque?: string;
  accreditation?: string;
  logo_url?: string;
  mentions_legales?: string;
  couleur_primaire?: string;
}

/**
 * Load the branding info of the current user's tenant.
 * Falls back to legacy app_settings.societe for backward compat.
 */
export async function getSociete(): Promise<Societe> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: profile } = await supabase
        .from("profiles" as never)
        .select("tenant_id")
        .eq("id", userData.user.id)
        .maybeSingle();
      const tenantId = (profile as { tenant_id?: string } | null)?.tenant_id;
      if (tenantId) {
        const { data: t } = await supabase
          .from("tenants" as never)
          .select("*")
          .eq("id", tenantId)
          .maybeSingle();
        if (t) {
          const row = t as Record<string, unknown>;
          return {
            raison_sociale: (row.nom as string) ?? undefined,
            adresse: (row.adresse as string) ?? undefined,
            ville: [row.code_postal, row.ville].filter(Boolean).join(" ") || undefined,
            matricule_fiscal: (row.matricule_fiscal as string) ?? undefined,
            telephone: (row.telephone as string) ?? undefined,
            email: (row.email as string) ?? undefined,
            site_web: (row.site_web as string) ?? undefined,
            rib: (row.rib as string) ?? undefined,
            logo_url: (row.logo_url as string) ?? undefined,
            mentions_legales: (row.mentions_legales as string) ?? undefined,
            couleur_primaire: (row.couleur_primaire as string) ?? undefined,
          };
        }
      }
    }
  } catch {
    // fall through to legacy
  }
  const { data } = await supabase
    .from("app_settings")
    .select("settings")
    .eq("category", "societe")
    .maybeSingle();
  return ((data?.settings as Societe) ?? {}) as Societe;
}

/** Convert #rrggbb → [r,g,b]. Returns default navy on failure. */
export function hexToRgb(hex?: string): [number, number, number] {
  if (!hex) return [40, 60, 100];
  const m = /^#?([a-f0-9]{6})$/i.exec(hex.trim());
  if (!m) return [40, 60, 100];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
