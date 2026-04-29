import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ClipboardList,
  FlaskConical,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Clock,
  Wrench,
  Users,
  ShieldAlert,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, statutTone } from "@/components/lab/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { formatTND, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Tableau de bord — BALIMS" }] }),
  component: DashboardPage,
});

interface Kpi {
  label: string;
  value: string;
  delta?: string;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
  tone?: "default" | "warning" | "success" | "destructive";
}

function KpiTile({ k }: { k: Kpi }) {
  const Icon = k.icon;
  const accent = {
    default: "text-primary border-l-primary",
    warning: "text-warning border-l-warning",
    success: "text-success border-l-success",
    destructive: "text-destructive border-l-destructive",
  }[k.tone ?? "default"];
  return (
    <Card className={cn("border-l-4 shadow-none transition-colors hover:bg-muted/30", accent)}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</p>
            <p className="mt-1 text-xl font-bold leading-none text-numeric text-foreground">{k.value}</p>
            {k.delta && <p className="mt-1 text-[11px] text-muted-foreground">{k.delta}</p>}
          </div>
          <Icon className={cn("h-4 w-4 opacity-70", accent.split(" ")[0])} />
        </div>
        {k.to && (
          <Link to={k.to} className="mt-2 flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
            Voir détails <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const [stats, setStats] = useState({
    bcEnCours: 0,
    bcTotal: 0,
    analysesAttente: 0,
    facturesImpayees: 0,
    caMois: 0,
    clients: 0,
    ncOuvertes: 0,
    equipementsAlerte: 0,
    missionsPlanifiees: 0,
  });
  const [recentBC, setRecentBC] = useState<any[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<{ titre: string; sub: string; tone: "warning" | "destructive" }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const [
        bcEnCours, bcTotal, analyses, factures, caData, clients, ncOuv, equipAlerte, missions,
        recBC, recAna, ncList, etalProches,
      ] = await Promise.all([
        supabase.from("bons_commande").select("*", { count: "exact", head: true }).in("statut", ["validee", "en_cours"] as any),
        supabase.from("bons_commande").select("*", { count: "exact", head: true }),
        supabase.from("analyses").select("*", { count: "exact", head: true }).in("statut", ["a_faire", "en_cours"] as any),
        Promise.resolve({ count: 0 }),
        supabase.from("bons_commande").select("total_ttc").gte("created_at", monthStart),
        supabase.from("clients").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("non_conformites").select("*", { count: "exact", head: true }).neq("statut", "cloturee" as any),
        supabase.from("equipements").select("*", { count: "exact", head: true }).lte("prochaine_etalonnage", new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)),
        supabase.from("missions").select("*", { count: "exact", head: true }).eq("statut", "planifiee" as any),
        supabase.from("bons_commande").select("id, numero, date_bc, statut, total_ttc, client_id, clients(raison_sociale)").order("created_at", { ascending: false }).limit(6),
        supabase.from("analyses").select("id, numero, statut, date_debut, date_fin, clients(raison_sociale)").order("created_at", { ascending: false }).limit(6),
        supabase.from("non_conformites").select("titre, gravite, date_detection").neq("statut", "cloturee" as any).order("date_detection", { ascending: false }).limit(3),
        supabase.from("equipements").select("designation, prochaine_etalonnage").lte("prochaine_etalonnage", new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)).order("prochaine_etalonnage").limit(3),
      ]);

      const ca = (caData.data ?? []).reduce((s: number, r: any) => s + Number(r.total_ttc ?? 0), 0);

      setStats({
        bcEnCours: bcEnCours.count ?? 0,
        bcTotal: bcTotal.count ?? 0,
        analysesAttente: analyses.count ?? 0,
        facturesImpayees: 0,
        caMois: ca,
        clients: clients.count ?? 0,
        ncOuvertes: ncOuv.count ?? 0,
        equipementsAlerte: equipAlerte.count ?? 0,
        missionsPlanifiees: missions.count ?? 0,
      });
      setRecentBC(recBC.data ?? []);
      setRecentAnalyses(recAna.data ?? []);

      const al: typeof alerts = [];
      (ncList.data ?? []).forEach((nc: any) => al.push({
        titre: `NC ${nc.gravite}: ${nc.titre}`,
        sub: `Détectée le ${formatDate(nc.date_detection)}`,
        tone: nc.gravite === "majeure" || nc.gravite === "critique" ? "destructive" : "warning",
      }));
      (etalProches.data ?? []).forEach((e: any) => al.push({
        titre: `Étalonnage à prévoir : ${e.designation}`,
        sub: `Échéance ${formatDate(e.prochaine_etalonnage)}`,
        tone: "warning",
      }));
      setAlerts(al);
      setLoading(false);
    };
    load().catch((e) => { console.error(e); setLoading(false); });
  }, []);

  const kpis: Kpi[] = [
    { label: "BC en cours", value: String(stats.bcEnCours), delta: `${stats.bcTotal} au total`, icon: ClipboardList, to: "/bons-commande" },
    { label: "Analyses en attente", value: String(stats.analysesAttente), icon: FlaskConical, to: "/analyses", tone: "warning" },
    { label: "Missions planifiées", value: String(stats.missionsPlanifiees), icon: Activity, to: "/missions" },
    { label: "CA du mois", value: formatTND(stats.caMois), icon: TrendingUp, tone: "success" },
    { label: "Clients actifs", value: String(stats.clients), icon: Users, to: "/clients" },
    { label: "NC ouvertes", value: String(stats.ncOuvertes), icon: ShieldAlert, to: "/qualite", tone: stats.ncOuvertes > 0 ? "destructive" : "default" },
    { label: "Équip. à étalonner", value: String(stats.equipementsAlerte), icon: Wrench, to: "/equipements", tone: stats.equipementsAlerte > 0 ? "warning" : "default" },
    { label: "Factures impayées", value: String(stats.facturesImpayees), icon: Receipt, to: "/facturation" },
  ];

  return (
    <div className="px-4 py-4">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vue consolidée</p>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Tableau de bord</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild className="h-8 text-xs"><Link to="/bons-commande">+ Bon de commande</Link></Button>
          <Button size="sm" variant="outline" asChild className="h-8 text-xs"><Link to="/missions">+ Mission</Link></Button>
          <Button size="sm" variant="outline" asChild className="h-8 text-xs"><Link to="/qualite">+ Non-conformité</Link></Button>
        </div>
      </div>

      <section className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {kpis.map((k) => <KpiTile key={k.label} k={k} />)}
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-none">
          <CardHeader className="border-b border-border py-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Bons de commande récents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-1.5 text-left">N°</th>
                  <th className="px-3 py-1.5 text-left">Client</th>
                  <th className="px-3 py-1.5 text-left">Date</th>
                  <th className="px-3 py-1.5 text-left">Statut</th>
                  <th className="px-3 py-1.5 text-right">Montant TTC</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({length: 5}).map((_, i) => (
                    <tr key={i} className="border-b border-border/40">
                      {Array.from({length: 5}).map((_, j) => (
                        <td key={j} className="px-3 py-2"><div className="h-3 w-full animate-pulse rounded bg-muted" /></td>
                      ))}
                    </tr>
                  ))
                ) : recentBC.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-xs text-muted-foreground">Aucun bon de commande</td></tr>
                ) : recentBC.map((b: any) => (
                  <tr key={b.id} className="border-b border-border/40 hover:bg-muted/40">
                    <td className="px-3 py-1.5 text-mono text-xs font-medium">{b.numero}</td>
                    <td className="px-3 py-1.5 text-xs">{b.clients?.raison_sociale ?? "—"}</td>
                    <td className="px-3 py-1.5 text-xs text-muted-foreground">{formatDate(b.date_bc)}</td>
                    <td className="px-3 py-1.5"><StatusBadge label={b.statut} tone={statutTone(b.statut)} /></td>
                    <td className="px-3 py-1.5 text-right text-numeric text-xs font-semibold">{formatTND(Number(b.total_ttc ?? 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="border-b border-border py-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" /> Alertes système
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 p-2">
            {loading ? (
              <div className="py-6 text-center text-xs text-muted-foreground">Chargement…</div>
            ) : alerts.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">Aucune alerte active</div>
            ) : alerts.map((a, i) => (
              <div key={i} className={cn(
                "rounded-sm border-l-2 bg-card px-2 py-1.5 text-xs",
                a.tone === "destructive" ? "border-l-destructive bg-destructive/5" : "border-l-warning bg-warning/5"
              )}>
                <p className="font-medium text-foreground">{a.titre}</p>
                <p className="text-[11px] text-muted-foreground">{a.sub}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-none">
          <CardHeader className="border-b border-border py-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <FlaskConical className="h-3.5 w-3.5" /> Analyses récentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-1.5 text-left">N°</th>
                  <th className="px-3 py-1.5 text-left">Client</th>
                  <th className="px-3 py-1.5 text-left">Début</th>
                  <th className="px-3 py-1.5 text-left">Fin</th>
                  <th className="px-3 py-1.5 text-left">Statut</th>
                </tr>
              </thead>
              <tbody>
                {loading ? null : recentAnalyses.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-xs text-muted-foreground">Aucune analyse</td></tr>
                ) : recentAnalyses.map((a: any) => (
                  <tr key={a.id} className="border-b border-border/40 hover:bg-muted/40">
                    <td className="px-3 py-1.5 text-mono text-xs font-medium">{a.numero}</td>
                    <td className="px-3 py-1.5 text-xs">{a.clients?.raison_sociale ?? "—"}</td>
                    <td className="px-3 py-1.5 text-xs text-muted-foreground">{a.date_debut ? formatDate(a.date_debut) : "—"}</td>
                    <td className="px-3 py-1.5 text-xs text-muted-foreground">{a.date_fin ? formatDate(a.date_fin) : "—"}</td>
                    <td className="px-3 py-1.5"><StatusBadge label={a.statut} tone={statutTone(a.statut)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
