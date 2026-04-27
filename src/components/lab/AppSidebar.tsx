import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Package,
  FlaskConical,
  ClipboardList,
  FileText,
  Receipt,
  Wrench,
  UserCog,
  Briefcase,
  Settings,
  LogOut,
  Bell,
  MapPin,
  TestTubes,
  CalendarRange,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/useUserRoles";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: AppRole[]; // si vide -> visible par tous les internes
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Vue d'ensemble",
    items: [
      { label: "Tableau de bord", to: "/", icon: LayoutDashboard },
      { label: "Notifications", to: "/notifications", icon: Bell },
    ],
  },
  {
    label: "Activité laboratoire",
    items: [
      { label: "Bons de commande", to: "/bons-commande", icon: ClipboardList },
      { label: "Missions", to: "/missions", icon: MapPin },
      { label: "Prélèvements", to: "/prelevements", icon: TestTubes },
      { label: "Feuilles de route", to: "/feuilles-route", icon: CalendarRange },
      { label: "Analyses", to: "/analyses", icon: FlaskConical },
      { label: "Rapports", to: "/rapports", icon: FileText },
    ],
  },
  {
    label: "Référentiels",
    items: [
      { label: "Clients", to: "/clients", icon: Users },
      { label: "Produits", to: "/produits", icon: Package },
    ],
  },
  {
    label: "Gestion",
    items: [
      {
        label: "Facturation",
        to: "/facturation",
        icon: Receipt,
        roles: ["admin", "direction", "comptable"],
      },
      {
        label: "Équipements",
        to: "/equipements",
        icon: Wrench,
        roles: ["admin", "direction", "chef_labo", "technicien", "qualite"],
      },
      {
        label: "RH & Paie",
        to: "/rh",
        icon: UserCog,
        roles: ["admin", "direction", "rh"],
      },
      {
        label: "Projets",
        to: "/projets",
        icon: Briefcase,
        roles: ["admin", "direction", "chef_labo"],
      },
      {
        label: "Qualité",
        to: "/qualite",
        icon: ShieldCheck,
        roles: ["admin", "direction", "qualite", "chef_labo", "technicien", "commercial"],
      },
    ],
  },
];

interface AppSidebarProps {
  roles: AppRole[];
  userEmail: string | null;
  primaryRole: AppRole | null;
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrateur",
  direction: "Direction",
  commercial: "Commercial",
  chef_labo: "Chef de laboratoire",
  technicien: "Technicien",
  qualite: "Qualité",
  comptable: "Comptable",
  rh: "Ressources humaines",
  client: "Client",
};

export function AppSidebar({ roles, userEmail, primaryRole }: AppSidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const canSee = (item: NavItem) => {
    if (!item.roles || item.roles.length === 0) return true;
    if (roles.includes("admin")) return true;
    return item.roles.some((r) => roles.includes(r));
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Logo variant="light" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(canSee);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className="mb-6">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.to ||
                    (item.to !== "/" && pathname.startsWith(item.to));
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 rounded-md bg-sidebar-accent/40 px-3 py-2">
          <p className="truncate text-xs font-medium text-sidebar-foreground">
            {userEmail ?? "Utilisateur"}
          </p>
          {primaryRole && (
            <p className="truncate text-[10px] text-sidebar-foreground/60">
              {ROLE_LABELS[primaryRole]}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex-1 justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Link to="/parametres">
              <Settings className="h-4 w-4" />
              Paramètres
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-sidebar-foreground/80 hover:bg-destructive/20 hover:text-destructive"
            aria-label="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
