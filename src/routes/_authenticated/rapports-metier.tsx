import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, BarChart3, TrendingUp, Clock, AlertTriangle, MapPin, TestTubes, Users as UsersIcon, CreditCard } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { exportCSV } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/rapports-metier")({
  head: () => ({ meta: [{ title: "Rapports métier — BALIMS" }] }),
  component: RapportsMetierPage,
});

function RapportsMetierPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(today);

  return (
    <div className="flex flex-col">
      <PageHeader title="Rapports métier" description="Bilan, CA, délais, impayés, prélèvements, règlements"
        actions={
          <div className="flex items-center gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36" />
            <span className="text-xs text-muted-foreground">→</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36" />
          </div>
        } />
      <div className="p-6">
        <Tabs defaultValue="bilan">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 h-auto">
            <TabsTrigger value="bilan" className="text-xs"><BarChart3 className="h-3 w-3 mr-1" />Bilan</TabsTrigger>
            <TabsTrigger value="ca" className="text-xs"><TrendingUp className="h-3 w-3 mr-1" />CA</TabsTrigger>
            <TabsTrigger value="delai" className="text-xs"><Clock className="h-3 w-3 mr-1" />Délais</TabsTrigger>
            <TabsTrigger value="impayes" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Impayés</TabsTrigger>
            <TabsTrigger value="km" className="text-xs"><MapPin className="h-3 w-3 mr-1" />Km</TabsTrigger>
            <TabsTrigger value="prelevements" className="text-xs"><TestTubes className="h-3 w-3 mr-1" />Prélèv.</TabsTrigger>
            <TabsTrigger value="preleveur" className="text-xs"><UsersIcon className="h-3 w-3 mr-1" />Préleveur</TabsTrigger>
            <TabsTrigger value="reglements" className="text-xs"><CreditCard className="h-3 w-3 mr-1" />Règl.</TabsTrigger>
          </TabsList>

          <TabsContent value="bilan"><BilanTab from={from} to={to} /></TabsContent>
          <TabsContent value="ca"><CaTab from={from} to={to} /></TabsContent>
          <TabsContent value="delai"><DelaiTab /></TabsContent>
          <TabsContent value="impayes"><ImpayesTab /></TabsContent>
          <TabsContent value="km"><KmTab from={from} to={to} /></TabsContent>
          <TabsContent value="prelevements"><PrelevementsTab from={from} to={to} /></TabsContent>
          <TabsContent value="preleveur"><PreleveurTab from={from} to={to} /></TabsContent>
          <TabsContent value="reglements"><ReglementsTab from={from} to={to} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card><CardContent className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </CardContent></Card>
  );
}

function BilanTab({ from, to }: { from: string; to: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["rap-bilan", from, to],
    queryFn: async () => {
      const [factures, prelevements, analyses, missions] = await Promise.all([
        supabase.from("factures").select("total_ht, total_ttc, statut").gte("date_facture", from).lte("date_facture", to),
        supabase.from("prelevements").select("id").gte("date_prelevement", from).lte("date_prelevement", to),
        supabase.from("analyses").select("id, statut").gte("created_at", from).lte("created_at", to),
        supabase.from("missions").select("id").gte("date_mission", from).lte("date_mission", to),
      ]);
      const fac = factures.data ?? [];
      return {
        nbFactures: fac.length,
        caHt: fac.reduce((s, f: any) => s + Number(f.total_ht ?? 0), 0),
        caTtc: fac.reduce((s, f: any) => s + Number(f.total_ttc ?? 0), 0),
        nbPrelev: (prelevements.data ?? []).length,
        nbAnalyses: (analyses.data ?? []).length,
        nbMissions: (missions.data ?? []).length,
      };
    },
  });
  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
      <Stat label="CA HT" value={formatCurrency(data?.caHt ?? 0)} />
      <Stat label="CA TTC" value={formatCurrency(data?.caTtc ?? 0)} />
      <Stat label="Factures" value={String(data?.nbFactures ?? 0)} />
      <Stat label="Missions" value={String(data?.nbMissions ?? 0)} />
      <Stat label="Prélèvements" value={String(data?.nbPrelev ?? 0)} />
      <Stat label="Analyses" value={String(data?.nbAnalyses ?? 0)} />
    </div>
  );
}

function CaTab({ from, to }: { from: string; to: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["rap-ca", from, to],
    queryFn: async () => {
      const { data } = await supabase.from("factures")
        .select("total_ht, total_ttc, date_facture, client:clients(raison_sociale)")
        .gte("date_facture", from).lte("date_facture", to);
      const byClient: Record<string, { client: string; ht: number; ttc: number; nb: number }> = {};
      (data ?? []).forEach((f: any) => {
        const k = f.client?.raison_sociale ?? "—";
        byClient[k] = byClient[k] ?? { client: k, ht: 0, ttc: 0, nb: 0 };
        byClient[k].ht += Number(f.total_ht ?? 0);
        byClient[k].ttc += Number(f.total_ttc ?? 0);
        byClient[k].nb += 1;
      });
      return Object.values(byClient).sort((a, b) => b.ttc - a.ttc);
    },
  });
  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  return <ReportCard title="CA par client" rows={data} columns={[
    { key: "client", label: "Client" }, { key: "nb", label: "Nb", align: "right" },
    { key: "ht", label: "HT", align: "right", format: (v: number) => formatCurrency(v) },
    { key: "ttc", label: "TTC", align: "right", format: (v: number) => formatCurrency(v) },
  ]} filename="ca-par-client" />;
}

function DelaiTab() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["rap-delai"],
    queryFn: async () => {
      const { data } = await supabase.from("factures").select("date_facture, date_paiement, client:clients(raison_sociale)").not("date_paiement", "is", null);
      const byClient: Record<string, { client: string; total: number; nb: number }> = {};
      (data ?? []).forEach((f: any) => {
        if (!f.date_facture || !f.date_paiement) return;
        const k = f.client?.raison_sociale ?? "—";
        const d = Math.floor((new Date(f.date_paiement).getTime() - new Date(f.date_facture).getTime()) / 86400000);
        byClient[k] = byClient[k] ?? { client: k, total: 0, nb: 0 };
        byClient[k].total += d; byClient[k].nb += 1;
      });
      return Object.values(byClient).map(r => ({ client: r.client, nb: r.nb, moyenne: Math.round(r.total / r.nb) })).sort((a, b) => b.moyenne - a.moyenne);
    },
  });
  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  return <ReportCard title="Délai de paiement moyen par client" rows={data} columns={[
    { key: "client", label: "Client" }, { key: "nb", label: "Factures", align: "right" },
    { key: "moyenne", label: "Délai moyen (j)", align: "right" },
  ]} filename="delai-paiement" />;
}

function ImpayesTab() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["rap-impayes"],
    queryFn: async () => {
      const { data } = await supabase.from("factures")
        .select("numero, date_facture, date_echeance, total_ttc, montant_paye, client:clients(raison_sociale)")
        .neq("statut", "annulee");
      return (data ?? []).map((f: any) => ({
        numero: f.numero, client: f.client?.raison_sociale ?? "—",
        date: formatDate(f.date_facture), echeance: formatDate(f.date_echeance),
        reste: Number(f.total_ttc) - Number(f.montant_paye ?? 0),
        anciennete: f.date_echeance ? Math.max(0, Math.floor((Date.now() - new Date(f.date_echeance).getTime()) / 86400000)) : 0,
      })).filter(r => r.reste > 0.01).sort((a, b) => b.anciennete - a.anciennete);
    },
  });
  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  return <ReportCard title="Factures impayées" rows={data} columns={[
    { key: "numero", label: "N°" }, { key: "client", label: "Client" },
    { key: "date", label: "Date" }, { key: "echeance", label: "Échéance" },
    { key: "anciennete", label: "Ancienneté (j)", align: "right", render: (v: number) => v > 0 ? <Badge variant="destructive">{v}j</Badge> : <Badge variant="outline">0</Badge> },
    { key: "reste", label: "Restant dû", align: "right", format: (v: number) => formatCurrency(v) },
  ]} filename="impayes" />;
}

function KmTab({ from, to }: { from: string; to: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["rap-km", from, to],
    queryFn: async () => {
      const { data } = await supabase.from("feuilles_route")
        .select("date_depart, km_depart, km_retour, vehicule, conducteur:employes(nom, prenom)")
        .gte("date_depart", from).lte("date_depart", to);
      const byCond: Record<string, { conducteur: string; km: number; nb: number }> = {};
      (data ?? []).forEach((f: any) => {
        const k = f.conducteur ? `${f.conducteur.prenom ?? ""} ${f.conducteur.nom ?? ""}`.trim() : "—";
        const km = Math.max(0, Number(f.km_retour ?? 0) - Number(f.km_depart ?? 0));
        byCond[k] = byCond[k] ?? { conducteur: k, km: 0, nb: 0 };
        byCond[k].km += km; byCond[k].nb += 1;
      });
      return Object.values(byCond).sort((a, b) => b.km - a.km);
    },
  });
  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  return <ReportCard title="Kilométrage par conducteur" rows={data} columns={[
    { key: "conducteur", label: "Conducteur" }, { key: "nb", label: "Tournées", align: "right" },
    { key: "km", label: "Km parcourus", align: "right" },
  ]} filename="kilometrage" />;
}

function PrelevementsTab({ from, to }: { from: string; to: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["rap-prelev", from, to],
    queryFn: async () => {
      const { data } = await supabase.from("prelevements")
        .select("type_milieu, date_prelevement, region")
        .gte("date_prelevement", from).lte("date_prelevement", to);
      const byType: Record<string, number> = {};
      (data ?? []).forEach((p: any) => {
        const k = p.type_milieu ?? "Non spécifié";
        byType[k] = (byType[k] ?? 0) + 1;
      });
      return Object.entries(byType).map(([type, nb]) => ({ type, nb })).sort((a, b) => b.nb - a.nb);
    },
  });
  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  return <ReportCard title="Prélèvements par type" rows={data} columns={[
    { key: "type", label: "Type de milieu" }, { key: "nb", label: "Nombre", align: "right" },
  ]} filename="prelevements" />;
}

function PreleveurTab({ from, to }: { from: string; to: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["rap-preleveur", from, to],
    queryFn: async () => {
      const { data } = await supabase.from("prelevements")
        .select("preleveur:employes(nom, prenom)")
        .gte("date_prelevement", from).lte("date_prelevement", to);
      const byP: Record<string, number> = {};
      (data ?? []).forEach((p: any) => {
        const k = p.preleveur ? `${p.preleveur.prenom ?? ""} ${p.preleveur.nom ?? ""}`.trim() : "—";
        byP[k] = (byP[k] ?? 0) + 1;
      });
      return Object.entries(byP).map(([preleveur, nb]) => ({ preleveur, nb })).sort((a, b) => b.nb - a.nb);
    },
  });
  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  return <ReportCard title="Productivité préleveurs" rows={data} columns={[
    { key: "preleveur", label: "Préleveur" }, { key: "nb", label: "Prélèvements", align: "right" },
  ]} filename="preleveurs" />;
}

function ReglementsTab({ from, to }: { from: string; to: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["rap-regl", from, to],
    queryFn: async () => {
      const { data } = await supabase.from("reglements")
        .select("montant, date_paiement, mode:modes_reglement(libelle)")
        .gte("date_paiement", from).lte("date_paiement", to);
      const byMode: Record<string, { mode: string; total: number; nb: number }> = {};
      (data ?? []).forEach((r: any) => {
        const k = r.mode?.libelle ?? "—";
        byMode[k] = byMode[k] ?? { mode: k, total: 0, nb: 0 };
        byMode[k].total += Number(r.montant ?? 0); byMode[k].nb += 1;
      });
      return Object.values(byMode).sort((a, b) => b.total - a.total);
    },
  });
  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  return <ReportCard title="Règlements par mode" rows={data} columns={[
    { key: "mode", label: "Mode" }, { key: "nb", label: "Nb", align: "right" },
    { key: "total", label: "Total", align: "right", format: (v: number) => formatCurrency(v) },
  ]} filename="reglements" />;
}

interface Col { key: string; label: string; align?: "right" | "left"; format?: (v: any) => string; render?: (v: any) => any }
function ReportCard({ title, rows, columns, filename }: { title: string; rows: any[]; columns: Col[]; filename: string }) {
  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button size="sm" variant="outline" onClick={() => exportCSV(filename, rows)}><Download className="h-3 w-3 mr-1" />Exporter CSV</Button>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée sur cette période.</p>
          : <Table>
            <TableHeader><TableRow>{columns.map(c => <TableHead key={c.key} className={c.align === "right" ? "text-right" : ""}>{c.label}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>{columns.map(c => (
                  <TableCell key={c.key} className={c.align === "right" ? "text-right" : ""}>
                    {c.render ? c.render(r[c.key]) : c.format ? c.format(r[c.key]) : r[c.key]}
                  </TableCell>
                ))}</TableRow>
              ))}
            </TableBody>
          </Table>}
      </CardContent>
    </Card>
  );
}
