import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "admin"
  | "direction"
  | "commercial"
  | "chef_labo"
  | "technicien"
  | "qualite"
  | "comptable"
  | "rh"
  | "client";

export interface UseUserRolesResult {
  roles: AppRole[];
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  primaryRole: AppRole | null;
}

const ROLE_PRIORITY: AppRole[] = [
  "admin",
  "direction",
  "chef_labo",
  "qualite",
  "commercial",
  "comptable",
  "rh",
  "technicien",
  "client",
];

export function useUserRoles(userId: string | undefined): UseUserRolesResult {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRoles([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load roles", error);
          setRoles([]);
        } else {
          setRoles((data ?? []).map((r) => r.role as AppRole));
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const hasAnyRole = (target: AppRole[]) => target.some((r) => roles.includes(r));
  const primaryRole = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? null;

  return { roles, loading, hasRole, hasAnyRole, primaryRole };
}
