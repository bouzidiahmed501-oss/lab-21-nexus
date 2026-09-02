import { Outlet, useLocation, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useUserRoles } from "@/hooks/useUserRoles";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { CommandPalette } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";
import { WorkflowTrail } from "./WorkflowTrail";



interface AppLayoutProps {
  user: User;
}

const ROUTE_LABELS: Record<string, string> = {
  "": "Tableau de bord",
  "devis": "Devis",
  "bons-commande": "Bons de commande",
  "missions": "Missions",
  "prelevements": "Prélèvements",
  "reception-scan": "Scan réception",
  "echantillons": "Échantillons",
  "stockage": "Plan de stockage",
  "feuilles-route": "Feuilles de route",
  "analyses": "Analyses",
  "paillasse": "Saisie paillasse",

  "pack-analyses": "Packs d'analyses",
  "chaines-analyse": "Chaînes d'analyse",
  "type-prelevements": "Types de prélèvement",
  "rapports": "Rapports",
  "validations": "Validations / Signature",
  "rapports-metier": "Rapports métier",
  "clients": "Clients",
  "produits": "Produits",
  "referentiels": "Catalogue Analyses",
  "milieux": "Milieux de culture",
  "reactifs": "Réactifs",
  "facturation": "Facturation",
  "avoirs": "Avoirs",
  "reglements": "Règlements",
  "comptes-clients": "Comptes clients",
  "recouvrement": "Recouvrement",
  "depenses": "Dépenses",
  "equipements": "Équipements",
  "reservations-equipement": "Réservations équipement",
  "sondes": "Sondes IoT",
  "rh": "RH & Paie",
  "formations": "Formations & habilitations",
  "projets": "Projets",
  "qualite": "Qualité",
  "controle-qualite": "Contrôle Qualité",
  "notifications": "Notifications",
  "parametres": "Paramètres",
  "societe": "Société",
};


function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  return (
    <nav className="flex items-center gap-1 text-xs text-muted-foreground">
      <Link to="/" className="hover:text-foreground">BALIMS</Link>
      {segments.length === 0 ? (
        <>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Tableau de bord</span>
        </>
      ) : (
        segments.map((seg, i) => {
          const last = i === segments.length - 1;
          return (
            <span key={seg} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              <span className={last ? "font-medium text-foreground" : ""}>
                {ROUTE_LABELS[seg] ?? seg}
              </span>
            </span>
          );
        })
      )}
    </nav>
  );
}

function NotificationsBell({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (mounted) setCount(count ?? 0);
    };
    load();
    const channel = supabase
      .channel("notif-bell")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, load)
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <Button variant="ghost" size="icon" asChild className="relative h-8 w-8">
      <Link to="/notifications">
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
            {count > 99 ? "99+" : count}
          </Badge>
        )}
      </Link>
    </Button>
  );
}

/** Mappe une route sur une étape du workflow LIMS. */
const WORKFLOW_ROUTE_KEYS: Record<string, string> = {
  devis: "devis",
  "bons-commande": "bon_commande",
  missions: "mission",
  prelevements: "prelevement",
  "feuilles-route": "prelevement",
  "reception-scan": "reception",
  echantillons: "reception",
  analyses: "analyse",
  paillasse: "analyse",
  validations: "validation",
  rapports: "rapport",
  facturation: "facture",
  reglements: "facture",
};

function WorkflowTrailBar() {
  const location = useLocation();
  const seg = location.pathname.split("/").filter(Boolean)[0] ?? "";
  const current = WORKFLOW_ROUTE_KEYS[seg];
  if (!current) return null;
  return (
    <div className="border-b border-border bg-card/60 px-4 py-1.5">
      <WorkflowTrail current={current} />
    </div>
  );
}



export function AppLayout({ user }: AppLayoutProps) {
  const { roles, primaryRole, loading } = useUserRoles(user.id);
  const { tenant } = useTenant();

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar roles={roles} primaryRole={primaryRole} userEmail={user.email ?? null} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-11 items-center gap-3 border-b border-border bg-card/95 px-3 backdrop-blur">
            <SidebarTrigger className="h-7 w-7" />
            <Breadcrumbs />
            {tenant && (
              <div className="hidden items-center gap-2 border-l border-border/60 pl-3 md:flex">
                {tenant.logo_url && <img src={tenant.logo_url} alt={tenant.nom} className="h-5 w-5 rounded object-contain" />}
                <span className="text-xs font-medium text-foreground">{tenant.nom}</span>
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <CommandPalette />
              <ThemeToggle />
              <NotificationsBell userId={user.id} />
            </div>

          </header>
          <main className="flex-1 overflow-x-hidden bg-background">
            {loading ? (
              <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
                Chargement…
              </div>
            ) : (
              <>
                <WorkflowTrailBar />
                <Outlet />
              </>
            )}
          </main>

        </div>
      </div>
    </SidebarProvider>
  );
}
