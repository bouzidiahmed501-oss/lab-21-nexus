import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Beaker,
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
  FlaskConical as Flask,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/useUserRoles";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: AppRole[];
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Pilotage",
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
      { label: "Scan réception", to: "/reception-scan", icon: ScanLine },
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
      { label: "Catalogue Analyses", to: "/referentiels", icon: BookOpen },
      { label: "Milieux de culture", to: "/milieux", icon: Beaker },
    ],
  },
  {
    label: "Gestion",
    items: [
      { label: "Facturation", to: "/facturation", icon: Receipt },
      { label: "Équipements", to: "/equipements", icon: Wrench },
      { label: "RH & Paie", to: "/rh", icon: UserCog },
      { label: "Projets", to: "/projets", icon: Briefcase },
      { label: "Qualité", to: "/qualite", icon: ShieldCheck },
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
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
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

  const isActive = (to: string) =>
    pathname === to || (to !== "/" && pathname.startsWith(to));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={cn("flex items-center gap-2 px-2 py-2", collapsed && "justify-center px-0")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Flask className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">BALIMS</span>
              <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">LIMS Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1 py-2">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(canSee);
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              {!collapsed && (
                <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.to);
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={collapsed ? item.label : undefined}
                          className={cn(
                            "h-8 gap-2 text-[13px] text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            active && "bg-sidebar-primary/15 text-sidebar-foreground border-l-2 border-sidebar-primary rounded-l-none",
                          )}
                        >
                          <Link to={item.to}>
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        {!collapsed && (
          <div className="mb-2 rounded-sm bg-sidebar-accent/40 px-2 py-1.5">
            <p className="truncate text-[11px] font-medium text-sidebar-foreground">
              {userEmail ?? "Utilisateur"}
            </p>
            {primaryRole && (
              <p className="truncate text-[10px] text-sidebar-foreground/60">
                {ROLE_LABELS[primaryRole]}
              </p>
            )}
          </div>
        )}
        <div className={cn("flex gap-1", collapsed && "flex-col")}>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-7 flex-1 justify-start px-2 text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Link to="/parametres">
              <Settings className="h-3.5 w-3.5" />
              {!collapsed && <span className="ml-1.5">Paramètres</span>}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-7 w-7 text-sidebar-foreground/80 hover:bg-destructive/20 hover:text-destructive"
            aria-label="Se déconnecter"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
