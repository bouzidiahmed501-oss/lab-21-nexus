import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, Pencil, Loader2, ShieldCheck, AlertTriangle, MessageSquareWarning,
  ListChecks, ClipboardCheck, Gauge, FileSignature,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { nextNumero } from "@/lib/numbering";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/lab/PageHeader";
import { EmptyState } from "@/components/lab/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/qualite")({
  head: () => ({ meta: [{ title: "Qualité — BALIMS" }] }),
  component: QualitePage,
});

/* ============================== */
/*           HELPERS              */
/* ============================== */

const todayISO = () => new Date().toISOString().slice(0, 10);

function StatutBadge({ value, map }: { value: string; map: Record<string, string> }) {
  const variant = map[value] ?? "bg-muted text-muted-foreground";
  return <Badge className={variant}>{value.replace(/_/g, " ")}</Badge>;
}

const NC_STATUT_COLOR: Record<string, string> = {
  ouverte: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  en_traitement: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  en_verification: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  cloturee: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  annulee: "bg-muted text-muted-foreground",
};
const REC_STATUT_COLOR: Record<string, string> = {
  recue: "bg-amber-500/15 text-amber-600",
  en_traitement: "bg-blue-500/15 text-blue-600",
  en_attente_client: "bg-orange-500/15 text-orange-600",
  resolue: "bg-emerald-500/15 text-emerald-600",
  cloturee: "bg-emerald-700/15 text-emerald-700",
  rejetee: "bg-red-500/15 text-red-600",
};
const CAPA_STATUT_COLOR: Record<string, string> = {
  planifiee: "bg-muted text-muted-foreground",
  en_cours: "bg-blue-500/15 text-blue-600",
  realisee: "bg-purple-500/15 text-purple-600",
  verifiee: "bg-emerald-500/15 text-emerald-600",
  cloturee: "bg-emerald-700/15 text-emerald-700",
  abandonnee: "bg-red-500/15 text-red-600",
};
const AUDIT_STATUT_COLOR: Record<string, string> = {
  planifie: "bg-muted text-muted-foreground",
  en_cours: "bg-blue-500/15 text-blue-600",
  realise: "bg-purple-500/15 text-purple-600",
  rapport_diffuse: "bg-amber-500/15 text-amber-600",
  cloture: "bg-emerald-500/15 text-emerald-600",
};

/* ============================== */
/*           PAGE SHELL           */
/* ============================== */

function QualitePage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Système de management Qualité"
        description="Non-conformités, réclamations, actions CAPA, audits, revues de direction et indicateurs ISO 17025."
      />
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="dashboard"><Gauge className="mr-2 h-4 w-4" />Tableau de bord</TabsTrigger>
            <TabsTrigger value="nc"><AlertTriangle className="mr-2 h-4 w-4" />Non-conformités</TabsTrigger>
            <TabsTrigger value="rec"><MessageSquareWarning className="mr-2 h-4 w-4" />Réclamations</TabsTrigger>
            <TabsTrigger value="capa"><ListChecks className="mr-2 h-4 w-4" />Actions CAPA</TabsTrigger>
            <TabsTrigger value="audits"><ClipboardCheck className="mr-2 h-4 w-4" />Audits</TabsTrigger>
            <TabsTrigger value="revues"><FileSignature className="mr-2 h-4 w-4" />Revues direction</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
          <TabsContent value="nc"><NonConformitesTab /></TabsContent>
          <TabsContent value="rec"><ReclamationsTab /></TabsContent>
          <TabsContent value="capa"><CapaTab /></TabsContent>
          <TabsContent value="audits"><AuditsTab /></TabsContent>
          <TabsContent value="revues"><RevuesTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ============================== */
/*          DASHBOARD             */
/* ============================== */

function DashboardTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["qualite-stats"],
    queryFn: async () => {
      const [nc, rec, capa, audits] = await Promise.all([
        supabase.from("non_conformites").select("statut, gravite, date_detection, source"),
        supabase.from("reclamations").select("statut, fondee, date_reception"),
        supabase.from("actions_capa").select("statut, type, efficace, date_planifiee"),
        supabase.from("audits").select("statut, type_audit"),
      ]);
      const ncRows = nc.data ?? [];
      const recRows = rec.data ?? [];
      const capaRows = capa.data ?? [];
      const audRows = audits.data ?? [];

      const ncClosed = ncRows.filter((r) => r.statut === "cloturee").length;
      const capaVerified = capaRows.filter((r) => r.statut === "verifiee" || r.statut === "cloturee").length;
      const capaEfficaces = capaRows.filter((r) => r.efficace === true).length;
      const capaEnRetard = capaRows.filter((r) => {
        if (!r.date_planifiee || r.statut === "cloturee" || r.statut === "abandonnee") return false;
        return new Date(r.date_planifiee) < new Date();
      }).length;

      return {
        nc_ouvertes: ncRows.filter((r) => r.statut !== "cloturee" && r.statut !== "annulee").length,
        nc_critiques: ncRows.filter((r) => r.gravite === "critique").length,
        nc_total: ncRows.length,
        nc_taux_cloture: ncRows.length > 0 ? Math.round((ncClosed / ncRows.length) * 100) : 0,
        nc_par_source: Object.entries(ncRows.reduce((acc: Record<string, number>, r) => {
          acc[r.source as string] = (acc[r.source as string] || 0) + 1; return acc;
        }, {})),
        rec_ouvertes: recRows.filter((r) => !["cloturee", "rejetee"].includes(r.statut as string)).length,
        rec_fondees: recRows.filter((r) => r.fondee === true).length,
        rec_total: recRows.length,
        capa_en_cours: capaRows.filter((r) => ["planifiee", "en_cours"].includes(r.statut as string)).length,
        capa_total: capaRows.length,
        capa_verified: capaVerified,
        capa_efficaces: capaEfficaces,
        capa_en_retard: capaEnRetard,
        capa_taux_efficacite: capaVerified > 0 ? Math.round((capaEfficaces / capaVerified) * 100) : 0,
        audits_en_cours: audRows.filter((r) => ["planifie", "en_cours"].includes(r.statut as string)).length,
        audits_total: audRows.length,
      };
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const cards = [
    { label: "NC ouvertes", value: stats?.nc_ouvertes ?? 0, sub: `${stats?.nc_critiques ?? 0} critiques · ${stats?.nc_taux_cloture ?? 0}% clôturées`, icon: AlertTriangle, color: "text-amber-600" },
    { label: "Réclamations en cours", value: stats?.rec_ouvertes ?? 0, sub: `${stats?.rec_fondees ?? 0} fondées sur ${stats?.rec_total ?? 0}`, icon: MessageSquareWarning, color: "text-orange-600" },
    { label: "Actions CAPA actives", value: stats?.capa_en_cours ?? 0, sub: `${stats?.capa_en_retard ?? 0} en retard · ${stats?.capa_taux_efficacite ?? 0}% efficaces`, icon: ListChecks, color: "text-blue-600" },
    { label: "Audits en cours", value: stats?.audits_en_cours ?? 0, sub: `${stats?.audits_total ?? 0} au total`, icon: ClipboardCheck, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">{c.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Indicateurs qualité ISO 17025 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Indicateurs clés ISO 17025</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Taux de clôture NC</span>
              <Badge className={`${(stats?.nc_taux_cloture ?? 0) >= 80 ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"}`}>
                {stats?.nc_taux_cloture ?? 0}%
              </Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Taux d'efficacité CAPA</span>
              <Badge className={`${(stats?.capa_taux_efficacite ?? 0) >= 75 ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600"}`}>
                {stats?.capa_taux_efficacite ?? 0}%
              </Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">CAPA en retard</span>
              <Badge className={`${(stats?.capa_en_retard ?? 0) === 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600"}`}>
                {stats?.capa_en_retard ?? 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">NC critiques actives</span>
              <Badge className={`${(stats?.nc_critiques ?? 0) === 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600"}`}>
                {stats?.nc_critiques ?? 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">NC par source</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(stats?.nc_par_source ?? []).map(([source, count]) => (
              <div key={source} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground capitalize">{source}</span>
                <span className="font-medium">{count as number}</span>
              </div>
            ))}
            {(stats?.nc_par_source ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground">Aucune NC enregistrée.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Exigences ISO/CEI 17025</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Ce module couvre les exigences clés de la norme <b>ISO/CEI 17025:2017</b> :
          § 7.10 Travaux non conformes · § 7.9 Réclamations · § 8.7 Actions correctives ·
          § 8.8 Audits internes · § 8.9 Revues de direction · § 8.6 Actions préventives.
          Les indicateurs ci-dessus alimentent directement la revue de direction.
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================== */
/*       NON-CONFORMITÉS          */
/* ============================== */

const ncSchema = z.object({
  date_detection: z.string().min(1, "Date requise"),
  source: z.enum(["interne","client","audit","fournisseur","equipement","methode","autre"]),
  gravite: z.enum(["mineure","majeure","critique"]),
  statut: z.enum(["ouverte","en_traitement","en_verification","cloturee","annulee"]),
  titre: z.string().trim().min(3, "Titre requis").max(200),
  description: z.string().trim().min(5, "Description requise").max(4000),
  origine: z.string().trim().max(200).optional().nullable(),
  service: z.string().trim().max(150).optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  impact: z.string().trim().max(2000).optional().nullable(),
  action_immediate: z.string().trim().max(2000).optional().nullable(),
  cause_racine: z.string().trim().max(2000).optional().nullable(),
  commentaire_cloture: z.string().trim().max(2000).optional().nullable(),
});
type NCForm = z.infer<typeof ncSchema>;
const NC_EMPTY: NCForm = {
  date_detection: todayISO(), source: "interne", gravite: "mineure", statut: "ouverte",
  titre: "", description: "", origine: "", service: "", client_id: null,
  impact: "", action_immediate: "", cause_racine: "", commentaire_cloture: "",
};

function NonConformitesTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string } | null>(null);
  const [form, setForm] = useState<NCForm>(NC_EMPTY);

  const { data: clients } = useQuery({
    queryKey: ["clients-min"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, raison_sociale").eq("is_active", true).order("raison_sociale");
      return data ?? [];
    },
  });

  const { data: rows, isLoading } = useQuery({
    queryKey: ["non_conformites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("non_conformites")
        .select("*, clients(raison_sociale)")
        .order("date_detection", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return (rows ?? []).filter((r: any) => {
      const matchS = statutFilter === "all" || r.statut === statutFilter;
      const t = `${r.numero} ${r.titre} ${r.description}`.toLowerCase();
      return matchS && (!search || t.includes(search.toLowerCase()));
    });
  }, [rows, search, statutFilter]);

  const upsert = useMutation({
    mutationFn: async (payload: NCForm & { id?: string }) => {
      const userRes = await supabase.auth.getUser();
      const uid = userRes.data.user?.id ?? null;
      const cleaned = {
        ...payload,
        client_id: payload.client_id || null,
        origine: payload.origine || null,
        service: payload.service || null,
      };
      if (payload.id) {
        const { error } = await supabase.from("non_conformites").update(cleaned).eq("id", payload.id);
        if (error) throw error;
      } else {
        const numero = await nextNumero("NC");
        const { error } = await supabase.from("non_conformites").insert({ ...cleaned, numero, created_by: uid });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["non_conformites"] });
      qc.invalidateQueries({ queryKey: ["qualite-stats"] });
      toast.success(editing ? "Non-conformité mise à jour" : "Non-conformité enregistrée");
      setOpen(false);
      setEditing(null);
      setForm(NC_EMPTY);
    },
    onError: (e: any) => toast.error(e.message ?? "Erreur"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = ncSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    upsert.mutate({ ...parsed.data, id: editing?.id });
  };

  const openNew = () => { setEditing(null); setForm(NC_EMPTY); setOpen(true); };
  const openEdit = (r: any) => {
    setEditing({ id: r.id });
    setForm({
      date_detection: r.date_detection, source: r.source, gravite: r.gravite, statut: r.statut,
      titre: r.titre, description: r.description, origine: r.origine ?? "", service: r.service ?? "",
      client_id: r.client_id, impact: r.impact ?? "", action_immediate: r.action_immediate ?? "",
      cause_racine: r.cause_racine ?? "", commentaire_cloture: r.commentaire_cloture ?? "",
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-9" />
        </div>
        <Select value={statutFilter} onValueChange={setStatutFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="ouverte">Ouverte</SelectItem>
            <SelectItem value="en_traitement">En traitement</SelectItem>
            <SelectItem value="en_verification">En vérification</SelectItem>
            <SelectItem value="cloturee">Clôturée</SelectItem>
            <SelectItem value="annulee">Annulée</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nouvelle NC</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="Aucune non-conformité" description="Déclarez la première NC." action={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nouvelle NC</Button>} />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead><TableHead>Date</TableHead><TableHead>Titre</TableHead>
                <TableHead>Source</TableHead><TableHead>Gravité</TableHead>
                <TableHead>Client</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.numero}</TableCell>
                  <TableCell>{formatDate(r.date_detection)}</TableCell>
                  <TableCell className="max-w-[280px] truncate">{r.titre}</TableCell>
                  <TableCell><Badge variant="outline">{r.source}</Badge></TableCell>
                  <TableCell>
                    <Badge className={r.gravite === "critique" ? "bg-red-500/15 text-red-600" : r.gravite === "majeure" ? "bg-orange-500/15 text-orange-600" : "bg-amber-500/15 text-amber-600"}>
                      {r.gravite}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.clients?.raison_sociale ?? "—"}</TableCell>
                  <TableCell><StatutBadge value={r.statut} map={NC_STATUT_COLOR} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la non-conformité" : "Nouvelle non-conformité"}</DialogTitle>
            <DialogDescription>Saisie complète conforme ISO 17025.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div><Label>Date détection *</Label><Input type="date" value={form.date_detection} onChange={(e) => setForm({ ...form, date_detection: e.target.value })} /></div>
            <div><Label>Service</Label><Input value={form.service ?? ""} onChange={(e) => setForm({ ...form, service: e.target.value })} /></div>
            <div>
              <Label>Source *</Label>
              <Select value={form.source} onValueChange={(v: any) => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["interne","client","audit","fournisseur","equipement","methode","autre"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gravité *</Label>
              <Select value={form.gravite} onValueChange={(v: any) => setForm({ ...form, gravite: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mineure">Mineure</SelectItem>
                  <SelectItem value="majeure">Majeure</SelectItem>
                  <SelectItem value="critique">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Statut *</Label>
              <Select value={form.statut} onValueChange={(v: any) => setForm({ ...form, statut: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["ouverte","en_traitement","en_verification","cloturee","annulee"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Client concerné</Label>
              <Select value={form.client_id ?? "none"} onValueChange={(v) => setForm({ ...form, client_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {(clients ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.raison_sociale}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2"><Label>Titre *</Label><Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Description *</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Impact</Label><Textarea rows={2} value={form.impact ?? ""} onChange={(e) => setForm({ ...form, impact: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Action immédiate</Label><Textarea rows={2} value={form.action_immediate ?? ""} onChange={(e) => setForm({ ...form, action_immediate: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Cause racine</Label><Textarea rows={2} value={form.cause_racine ?? ""} onChange={(e) => setForm({ ...form, cause_racine: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Commentaire de clôture</Label><Textarea rows={2} value={form.commentaire_cloture ?? ""} onChange={(e) => setForm({ ...form, commentaire_cloture: e.target.value })} /></div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={upsert.isPending}>{upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================== */
/*         RÉCLAMATIONS           */
/* ============================== */

const recSchema = z.object({
  date_reception: z.string().min(1),
  canal: z.enum(["email","telephone","courrier","visite","portail","autre"]),
  statut: z.enum(["recue","en_traitement","en_attente_client","resolue","cloturee","rejetee"]),
  client_id: z.string().uuid("Client requis"),
  contact_nom: z.string().trim().max(150).optional().nullable(),
  contact_email: z.string().trim().max(255).optional().nullable(),
  contact_telephone: z.string().trim().max(50).optional().nullable(),
  objet: z.string().trim().min(3).max(200),
  description: z.string().trim().min(5).max(4000),
  fondee: z.enum(["true","false","unknown"]),
  reponse: z.string().trim().max(4000).optional().nullable(),
  date_accuse: z.string().optional().nullable(),
  date_reponse: z.string().optional().nullable(),
  satisfaction_client: z.string().optional().nullable(),
});
type RecForm = z.infer<typeof recSchema>;
const REC_EMPTY: RecForm = {
  date_reception: todayISO(), canal: "email", statut: "recue", client_id: "",
  contact_nom: "", contact_email: "", contact_telephone: "",
  objet: "", description: "", fondee: "unknown", reponse: "",
  date_accuse: null, date_reponse: null, satisfaction_client: null,
};

function ReclamationsTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string } | null>(null);
  const [form, setForm] = useState<RecForm>(REC_EMPTY);

  const { data: clients } = useQuery({
    queryKey: ["clients-min"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, raison_sociale").eq("is_active", true).order("raison_sociale");
      return data ?? [];
    },
  });

  const { data: rows, isLoading } = useQuery({
    queryKey: ["reclamations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reclamations")
        .select("*, clients(raison_sociale)")
        .order("date_reception", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return (rows ?? []).filter((r: any) => {
      const matchS = statutFilter === "all" || r.statut === statutFilter;
      const t = `${r.numero} ${r.objet} ${r.description}`.toLowerCase();
      return matchS && (!search || t.includes(search.toLowerCase()));
    });
  }, [rows, search, statutFilter]);

  const upsert = useMutation({
    mutationFn: async (payload: RecForm & { id?: string }) => {
      const userRes = await supabase.auth.getUser();
      const uid = userRes.data.user?.id ?? null;
      const cleaned: any = {
        ...payload,
        contact_email: payload.contact_email || null,
        contact_nom: payload.contact_nom || null,
        contact_telephone: payload.contact_telephone || null,
        reponse: payload.reponse || null,
        date_accuse: payload.date_accuse || null,
        date_reponse: payload.date_reponse || null,
        satisfaction_client: payload.satisfaction_client ? Number(payload.satisfaction_client) : null,
        fondee: payload.fondee === "unknown" ? null : payload.fondee === "true",
      };
      if (payload.id) {
        const { error } = await supabase.from("reclamations").update(cleaned).eq("id", payload.id);
        if (error) throw error;
      } else {
        const numero = await nextNumero("REC");
        const { error } = await supabase.from("reclamations").insert({ ...cleaned, numero, created_by: uid });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reclamations"] });
      qc.invalidateQueries({ queryKey: ["qualite-stats"] });
      toast.success(editing ? "Réclamation mise à jour" : "Réclamation enregistrée");
      setOpen(false); setEditing(null); setForm(REC_EMPTY);
    },
    onError: (e: any) => toast.error(e.message ?? "Erreur"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = recSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    upsert.mutate({ ...parsed.data, id: editing?.id });
  };

  const openNew = () => { setEditing(null); setForm(REC_EMPTY); setOpen(true); };
  const openEdit = (r: any) => {
    setEditing({ id: r.id });
    setForm({
      date_reception: r.date_reception, canal: r.canal, statut: r.statut, client_id: r.client_id,
      contact_nom: r.contact_nom ?? "", contact_email: r.contact_email ?? "", contact_telephone: r.contact_telephone ?? "",
      objet: r.objet, description: r.description,
      fondee: r.fondee === null ? "unknown" : r.fondee ? "true" : "false",
      reponse: r.reponse ?? "", date_accuse: r.date_accuse, date_reponse: r.date_reponse,
      satisfaction_client: r.satisfaction_client?.toString() ?? null,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-9" />
        </div>
        <Select value={statutFilter} onValueChange={setStatutFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {Object.keys(REC_STATUT_COLOR).map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nouvelle réclamation</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={MessageSquareWarning} title="Aucune réclamation" description="Enregistrez la première plainte client." action={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nouvelle réclamation</Button>} />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead><TableHead>Date</TableHead><TableHead>Client</TableHead>
                <TableHead>Objet</TableHead><TableHead>Canal</TableHead>
                <TableHead>Fondée</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.numero}</TableCell>
                  <TableCell>{formatDate(r.date_reception)}</TableCell>
                  <TableCell className="text-sm">{r.clients?.raison_sociale ?? "—"}</TableCell>
                  <TableCell className="max-w-[260px] truncate">{r.objet}</TableCell>
                  <TableCell><Badge variant="outline">{r.canal}</Badge></TableCell>
                  <TableCell>{r.fondee === null ? <Badge variant="outline">à analyser</Badge> : r.fondee ? <Badge className="bg-red-500/15 text-red-600">Oui</Badge> : <Badge className="bg-emerald-500/15 text-emerald-600">Non</Badge>}</TableCell>
                  <TableCell><StatutBadge value={r.statut} map={REC_STATUT_COLOR} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Modifier la réclamation" : "Nouvelle réclamation"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div><Label>Date réception *</Label><Input type="date" value={form.date_reception} onChange={(e) => setForm({ ...form, date_reception: e.target.value })} /></div>
            <div>
              <Label>Canal *</Label>
              <Select value={form.canal} onValueChange={(v: any) => setForm({ ...form, canal: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["email","telephone","courrier","visite","portail","autre"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Client *</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                <SelectContent>
                  {(clients ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.raison_sociale}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Contact (nom)</Label><Input value={form.contact_nom ?? ""} onChange={(e) => setForm({ ...form, contact_nom: e.target.value })} /></div>
            <div><Label>Contact email</Label><Input value={form.contact_email ?? ""} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
            <div><Label>Contact téléphone</Label><Input value={form.contact_telephone ?? ""} onChange={(e) => setForm({ ...form, contact_telephone: e.target.value })} /></div>
            <div>
              <Label>Statut *</Label>
              <Select value={form.statut} onValueChange={(v: any) => setForm({ ...form, statut: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(REC_STATUT_COLOR).map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2"><Label>Objet *</Label><Input value={form.objet} onChange={(e) => setForm({ ...form, objet: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Description *</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <Label>Réclamation fondée</Label>
              <Select value={form.fondee} onValueChange={(v: any) => setForm({ ...form, fondee: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">À analyser</SelectItem>
                  <SelectItem value="true">Oui</SelectItem>
                  <SelectItem value="false">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Satisfaction (1-5)</Label>
              <Input type="number" min={1} max={5} value={form.satisfaction_client ?? ""} onChange={(e) => setForm({ ...form, satisfaction_client: e.target.value || null })} />
            </div>
            <div><Label>Date accusé</Label><Input type="date" value={form.date_accuse ?? ""} onChange={(e) => setForm({ ...form, date_accuse: e.target.value || null })} /></div>
            <div><Label>Date réponse</Label><Input type="date" value={form.date_reponse ?? ""} onChange={(e) => setForm({ ...form, date_reponse: e.target.value || null })} /></div>
            <div className="md:col-span-2"><Label>Réponse au client</Label><Textarea rows={3} value={form.reponse ?? ""} onChange={(e) => setForm({ ...form, reponse: e.target.value })} /></div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={upsert.isPending}>{upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================== */
/*           CAPA                 */
/* ============================== */

const capaSchema = z.object({
  type: z.enum(["corrective","preventive","immediate","amelioration"]),
  statut: z.enum(["planifiee","en_cours","realisee","verifiee","cloturee","abandonnee"]),
  titre: z.string().trim().min(3).max(200),
  description: z.string().trim().min(5).max(4000),
  nc_id: z.string().uuid().optional().nullable(),
  reclamation_id: z.string().uuid().optional().nullable(),
  date_planifiee: z.string().optional().nullable(),
  date_realisee: z.string().optional().nullable(),
  date_verification: z.string().optional().nullable(),
  efficace: z.enum(["true","false","unknown"]),
  commentaire_efficacite: z.string().trim().max(2000).optional().nullable(),
  preuves: z.string().trim().max(2000).optional().nullable(),
});
type CapaForm = z.infer<typeof capaSchema>;
const CAPA_EMPTY: CapaForm = {
  type: "corrective", statut: "planifiee", titre: "", description: "",
  nc_id: null, reclamation_id: null,
  date_planifiee: null, date_realisee: null, date_verification: null,
  efficace: "unknown", commentaire_efficacite: "", preuves: "",
};

function CapaTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string } | null>(null);
  const [form, setForm] = useState<CapaForm>(CAPA_EMPTY);

  const { data: ncs } = useQuery({
    queryKey: ["nc-min"],
    queryFn: async () => {
      const { data } = await supabase.from("non_conformites").select("id, numero, titre").order("date_detection", { ascending: false }).limit(200);
      return data ?? [];
    },
  });
  const { data: recs } = useQuery({
    queryKey: ["rec-min"],
    queryFn: async () => {
      const { data } = await supabase.from("reclamations").select("id, numero, objet").order("date_reception", { ascending: false }).limit(200);
      return data ?? [];
    },
  });

  const { data: rows, isLoading } = useQuery({
    queryKey: ["actions_capa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actions_capa")
        .select("*, non_conformites(numero), reclamations(numero)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return (rows ?? []).filter((r: any) => {
      const matchS = statutFilter === "all" || r.statut === statutFilter;
      const t = `${r.numero} ${r.titre} ${r.description}`.toLowerCase();
      return matchS && (!search || t.includes(search.toLowerCase()));
    });
  }, [rows, search, statutFilter]);

  const upsert = useMutation({
    mutationFn: async (payload: CapaForm & { id?: string }) => {
      const userRes = await supabase.auth.getUser();
      const uid = userRes.data.user?.id ?? null;
      const cleaned: any = {
        ...payload,
        nc_id: payload.nc_id || null,
        reclamation_id: payload.reclamation_id || null,
        date_planifiee: payload.date_planifiee || null,
        date_realisee: payload.date_realisee || null,
        date_verification: payload.date_verification || null,
        commentaire_efficacite: payload.commentaire_efficacite || null,
        preuves: payload.preuves || null,
        efficace: payload.efficace === "unknown" ? null : payload.efficace === "true",
      };
      if (payload.id) {
        const { error } = await supabase.from("actions_capa").update(cleaned).eq("id", payload.id);
        if (error) throw error;
      } else {
        const numero = await nextNumero("CAPA");
        const { error } = await supabase.from("actions_capa").insert({ ...cleaned, numero, created_by: uid });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["actions_capa"] });
      qc.invalidateQueries({ queryKey: ["qualite-stats"] });
      toast.success(editing ? "Action mise à jour" : "Action enregistrée");
      setOpen(false); setEditing(null); setForm(CAPA_EMPTY);
    },
    onError: (e: any) => toast.error(e.message ?? "Erreur"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = capaSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    upsert.mutate({ ...parsed.data, id: editing?.id });
  };

  const openNew = () => { setEditing(null); setForm(CAPA_EMPTY); setOpen(true); };
  const openEdit = (r: any) => {
    setEditing({ id: r.id });
    setForm({
      type: r.type, statut: r.statut, titre: r.titre, description: r.description,
      nc_id: r.nc_id, reclamation_id: r.reclamation_id,
      date_planifiee: r.date_planifiee, date_realisee: r.date_realisee, date_verification: r.date_verification,
      efficace: r.efficace === null ? "unknown" : r.efficace ? "true" : "false",
      commentaire_efficacite: r.commentaire_efficacite ?? "", preuves: r.preuves ?? "",
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-9" />
        </div>
        <Select value={statutFilter} onValueChange={setStatutFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {Object.keys(CAPA_STATUT_COLOR).map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nouvelle action</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ListChecks} title="Aucune action CAPA" description="Planifiez la première action corrective ou préventive." action={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nouvelle action</Button>} />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead><TableHead>Type</TableHead><TableHead>Titre</TableHead>
                <TableHead>NC liée</TableHead><TableHead>Récl. liée</TableHead>
                <TableHead>Échéance</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.numero}</TableCell>
                  <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                  <TableCell className="max-w-[260px] truncate">{r.titre}</TableCell>
                  <TableCell className="font-mono text-xs">{r.non_conformites?.numero ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{r.reclamations?.numero ?? "—"}</TableCell>
                  <TableCell>{formatDate(r.date_planifiee)}</TableCell>
                  <TableCell><StatutBadge value={r.statut} map={CAPA_STATUT_COLOR} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Modifier l'action" : "Nouvelle action CAPA"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrective">Corrective</SelectItem>
                  <SelectItem value="preventive">Préventive</SelectItem>
                  <SelectItem value="immediate">Immédiate</SelectItem>
                  <SelectItem value="amelioration">Amélioration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Statut *</Label>
              <Select value={form.statut} onValueChange={(v: any) => setForm({ ...form, statut: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(CAPA_STATUT_COLOR).map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>NC liée</Label>
              <Select value={form.nc_id ?? "none"} onValueChange={(v) => setForm({ ...form, nc_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {(ncs ?? []).map((n: any) => <SelectItem key={n.id} value={n.id}>{n.numero} — {n.titre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Réclamation liée</Label>
              <Select value={form.reclamation_id ?? "none"} onValueChange={(v) => setForm({ ...form, reclamation_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {(recs ?? []).map((n: any) => <SelectItem key={n.id} value={n.id}>{n.numero} — {n.objet}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2"><Label>Titre *</Label><Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Description *</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Date planifiée</Label><Input type="date" value={form.date_planifiee ?? ""} onChange={(e) => setForm({ ...form, date_planifiee: e.target.value || null })} /></div>
            <div><Label>Date réalisée</Label><Input type="date" value={form.date_realisee ?? ""} onChange={(e) => setForm({ ...form, date_realisee: e.target.value || null })} /></div>
            <div><Label>Date vérification</Label><Input type="date" value={form.date_verification ?? ""} onChange={(e) => setForm({ ...form, date_verification: e.target.value || null })} /></div>
            <div>
              <Label>Action efficace ?</Label>
              <Select value={form.efficace} onValueChange={(v: any) => setForm({ ...form, efficace: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Non vérifié</SelectItem>
                  <SelectItem value="true">Oui</SelectItem>
                  <SelectItem value="false">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2"><Label>Commentaire efficacité</Label><Textarea rows={2} value={form.commentaire_efficacite ?? ""} onChange={(e) => setForm({ ...form, commentaire_efficacite: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Preuves / pièces jointes (références)</Label><Textarea rows={2} value={form.preuves ?? ""} onChange={(e) => setForm({ ...form, preuves: e.target.value })} /></div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={upsert.isPending}>{upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================== */
/*           AUDITS               */
/* ============================== */

const auditSchema = z.object({
  type: z.enum(["interne","externe","fournisseur","accreditation","suivi"]),
  statut: z.enum(["planifie","en_cours","realise","rapport_diffuse","cloture"]),
  titre: z.string().trim().min(3).max(200),
  perimetre: z.string().trim().max(2000).optional().nullable(),
  referentiel: z.string().trim().max(200).optional().nullable(),
  date_debut: z.string().optional().nullable(),
  date_fin: z.string().optional().nullable(),
  auditeur_principal: z.string().trim().max(150).optional().nullable(),
  auditeurs: z.string().trim().max(500).optional().nullable(),
  audites: z.string().trim().max(500).optional().nullable(),
  organisme: z.string().trim().max(200).optional().nullable(),
  conclusion: z.string().trim().max(4000).optional().nullable(),
});
type AuditForm = z.infer<typeof auditSchema>;
const AUDIT_EMPTY: AuditForm = {
  type: "interne", statut: "planifie", titre: "", perimetre: "", referentiel: "ISO/CEI 17025:2017",
  date_debut: null, date_fin: null, auditeur_principal: "", auditeurs: "", audites: "",
  organisme: "", conclusion: "",
};

function AuditsTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string } | null>(null);
  const [form, setForm] = useState<AuditForm>(AUDIT_EMPTY);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["audits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("audits").select("*").order("date_debut", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return (rows ?? []).filter((r: any) => {
      const t = `${r.numero} ${r.titre} ${r.perimetre ?? ""}`.toLowerCase();
      return !search || t.includes(search.toLowerCase());
    });
  }, [rows, search]);

  const upsert = useMutation({
    mutationFn: async (payload: AuditForm & { id?: string }) => {
      const userRes = await supabase.auth.getUser();
      const uid = userRes.data.user?.id ?? null;
      const cleaned: any = {
        ...payload,
        date_debut: payload.date_debut || null,
        date_fin: payload.date_fin || null,
      };
      if (payload.id) {
        const { error } = await supabase.from("audits").update(cleaned).eq("id", payload.id);
        if (error) throw error;
      } else {
        const numero = await nextNumero("AUD");
        const { error } = await supabase.from("audits").insert({ ...cleaned, numero, created_by: uid });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["audits"] });
      qc.invalidateQueries({ queryKey: ["qualite-stats"] });
      toast.success(editing ? "Audit mis à jour" : "Audit enregistré");
      setOpen(false); setEditing(null); setForm(AUDIT_EMPTY);
    },
    onError: (e: any) => toast.error(e.message ?? "Erreur"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = auditSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    upsert.mutate({ ...parsed.data, id: editing?.id });
  };

  const openNew = () => { setEditing(null); setForm(AUDIT_EMPTY); setOpen(true); };
  const openEdit = (r: any) => {
    setEditing({ id: r.id });
    setForm({
      type: r.type, statut: r.statut, titre: r.titre, perimetre: r.perimetre ?? "",
      referentiel: r.referentiel ?? "", date_debut: r.date_debut, date_fin: r.date_fin,
      auditeur_principal: r.auditeur_principal ?? "", auditeurs: r.auditeurs ?? "", audites: r.audites ?? "",
      organisme: r.organisme ?? "", conclusion: r.conclusion ?? "",
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un audit…" className="pl-9" />
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nouvel audit</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Aucun audit" description="Planifiez votre premier audit (interne, externe, accréditation…)." action={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nouvel audit</Button>} />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead><TableHead>Type</TableHead><TableHead>Titre</TableHead>
                <TableHead>Référentiel</TableHead><TableHead>Période</TableHead>
                <TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.numero}</TableCell>
                  <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                  <TableCell className="max-w-[280px] truncate">{r.titre}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.referentiel ?? "—"}</TableCell>
                  <TableCell className="text-sm">{formatDate(r.date_debut)} → {formatDate(r.date_fin)}</TableCell>
                  <TableCell><StatutBadge value={r.statut} map={AUDIT_STATUT_COLOR} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Modifier l'audit" : "Nouvel audit"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["interne","externe","fournisseur","accreditation","suivi"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Statut *</Label>
              <Select value={form.statut} onValueChange={(v: any) => setForm({ ...form, statut: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(AUDIT_STATUT_COLOR).map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2"><Label>Titre *</Label><Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} /></div>
            <div><Label>Référentiel</Label><Input value={form.referentiel ?? ""} onChange={(e) => setForm({ ...form, referentiel: e.target.value })} /></div>
            <div><Label>Organisme (si externe)</Label><Input value={form.organisme ?? ""} onChange={(e) => setForm({ ...form, organisme: e.target.value })} /></div>
            <div><Label>Date début</Label><Input type="date" value={form.date_debut ?? ""} onChange={(e) => setForm({ ...form, date_debut: e.target.value || null })} /></div>
            <div><Label>Date fin</Label><Input type="date" value={form.date_fin ?? ""} onChange={(e) => setForm({ ...form, date_fin: e.target.value || null })} /></div>
            <div><Label>Auditeur principal</Label><Input value={form.auditeur_principal ?? ""} onChange={(e) => setForm({ ...form, auditeur_principal: e.target.value })} /></div>
            <div><Label>Autres auditeurs</Label><Input value={form.auditeurs ?? ""} onChange={(e) => setForm({ ...form, auditeurs: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Audités (services / personnes)</Label><Input value={form.audites ?? ""} onChange={(e) => setForm({ ...form, audites: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Périmètre</Label><Textarea rows={2} value={form.perimetre ?? ""} onChange={(e) => setForm({ ...form, perimetre: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Conclusion</Label><Textarea rows={3} value={form.conclusion ?? ""} onChange={(e) => setForm({ ...form, conclusion: e.target.value })} /></div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={upsert.isPending}>{upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================== */
/*       REVUES DIRECTION         */
/* ============================== */

const revueSchema = z.object({
  date_revue: z.string().min(1),
  statut: z.enum(["planifiee","tenue","cloturee"]),
  titre: z.string().trim().min(3).max(200),
  participants: z.string().trim().max(2000).optional().nullable(),
  ordre_du_jour: z.string().trim().max(4000).optional().nullable(),
  bilan_qualite: z.string().trim().max(4000).optional().nullable(),
  bilan_audits: z.string().trim().max(4000).optional().nullable(),
  bilan_nc: z.string().trim().max(4000).optional().nullable(),
  bilan_reclamations: z.string().trim().max(4000).optional().nullable(),
  bilan_satisfaction: z.string().trim().max(4000).optional().nullable(),
  decisions: z.string().trim().max(4000).optional().nullable(),
  axes_amelioration: z.string().trim().max(4000).optional().nullable(),
  ressources_necessaires: z.string().trim().max(4000).optional().nullable(),
});
type RevueForm = z.infer<typeof revueSchema>;
const REVUE_EMPTY: RevueForm = {
  date_revue: todayISO(), statut: "planifiee", titre: "", participants: "", ordre_du_jour: "",
  bilan_qualite: "", bilan_audits: "", bilan_nc: "", bilan_reclamations: "", bilan_satisfaction: "",
  decisions: "", axes_amelioration: "", ressources_necessaires: "",
};

const REVUE_STATUT_COLOR: Record<string,string> = {
  planifiee: "bg-muted text-muted-foreground",
  tenue: "bg-blue-500/15 text-blue-600",
  cloturee: "bg-emerald-500/15 text-emerald-600",
};

function RevuesTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string } | null>(null);
  const [form, setForm] = useState<RevueForm>(REVUE_EMPTY);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["revues_direction"],
    queryFn: async () => {
      const { data, error } = await supabase.from("revues_direction").select("*").order("date_revue", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: RevueForm & { id?: string }) => {
      const userRes = await supabase.auth.getUser();
      const uid = userRes.data.user?.id ?? null;
      if (payload.id) {
        const { error } = await supabase.from("revues_direction").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const numero = await nextNumero("REV");
        const { error } = await supabase.from("revues_direction").insert({ ...payload, numero, created_by: uid });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["revues_direction"] });
      toast.success(editing ? "Revue mise à jour" : "Revue enregistrée");
      setOpen(false); setEditing(null); setForm(REVUE_EMPTY);
    },
    onError: (e: any) => toast.error(e.message ?? "Erreur"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = revueSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    upsert.mutate({ ...parsed.data, id: editing?.id });
  };

  const openNew = () => { setEditing(null); setForm(REVUE_EMPTY); setOpen(true); };
  const openEdit = (r: any) => {
    setEditing({ id: r.id });
    setForm({
      date_revue: r.date_revue, statut: r.statut, titre: r.titre,
      participants: r.participants ?? "", ordre_du_jour: r.ordre_du_jour ?? "",
      bilan_qualite: r.bilan_qualite ?? "", bilan_audits: r.bilan_audits ?? "",
      bilan_nc: r.bilan_nc ?? "", bilan_reclamations: r.bilan_reclamations ?? "",
      bilan_satisfaction: r.bilan_satisfaction ?? "", decisions: r.decisions ?? "",
      axes_amelioration: r.axes_amelioration ?? "", ressources_necessaires: r.ressources_necessaires ?? "",
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nouvelle revue</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (rows ?? []).length === 0 ? (
        <EmptyState icon={FileSignature} title="Aucune revue de direction" description="Planifiez la première revue annuelle." action={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nouvelle revue</Button>} />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead><TableHead>Date</TableHead><TableHead>Titre</TableHead>
                <TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rows ?? []).map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.numero}</TableCell>
                  <TableCell>{formatDate(r.date_revue)}</TableCell>
                  <TableCell className="max-w-[400px] truncate">{r.titre}</TableCell>
                  <TableCell><StatutBadge value={r.statut} map={REVUE_STATUT_COLOR} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la revue" : "Nouvelle revue de direction"}</DialogTitle>
            <DialogDescription>Compte-rendu structuré conforme ISO 17025 § 8.9.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div><Label>Date *</Label><Input type="date" value={form.date_revue} onChange={(e) => setForm({ ...form, date_revue: e.target.value })} /></div>
            <div>
              <Label>Statut *</Label>
              <Select value={form.statut} onValueChange={(v: any) => setForm({ ...form, statut: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planifiee">Planifiée</SelectItem>
                  <SelectItem value="tenue">Tenue</SelectItem>
                  <SelectItem value="cloturee">Clôturée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2"><Label>Titre *</Label><Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Participants</Label><Textarea rows={2} value={form.participants ?? ""} onChange={(e) => setForm({ ...form, participants: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Ordre du jour</Label><Textarea rows={2} value={form.ordre_du_jour ?? ""} onChange={(e) => setForm({ ...form, ordre_du_jour: e.target.value })} /></div>
            <div><Label>Bilan qualité</Label><Textarea rows={3} value={form.bilan_qualite ?? ""} onChange={(e) => setForm({ ...form, bilan_qualite: e.target.value })} /></div>
            <div><Label>Bilan audits</Label><Textarea rows={3} value={form.bilan_audits ?? ""} onChange={(e) => setForm({ ...form, bilan_audits: e.target.value })} /></div>
            <div><Label>Bilan NC</Label><Textarea rows={3} value={form.bilan_nc ?? ""} onChange={(e) => setForm({ ...form, bilan_nc: e.target.value })} /></div>
            <div><Label>Bilan réclamations</Label><Textarea rows={3} value={form.bilan_reclamations ?? ""} onChange={(e) => setForm({ ...form, bilan_reclamations: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Bilan satisfaction client</Label><Textarea rows={2} value={form.bilan_satisfaction ?? ""} onChange={(e) => setForm({ ...form, bilan_satisfaction: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Décisions prises</Label><Textarea rows={3} value={form.decisions ?? ""} onChange={(e) => setForm({ ...form, decisions: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Axes d'amélioration</Label><Textarea rows={3} value={form.axes_amelioration ?? ""} onChange={(e) => setForm({ ...form, axes_amelioration: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Ressources nécessaires</Label><Textarea rows={2} value={form.ressources_necessaires ?? ""} onChange={(e) => setForm({ ...form, ressources_necessaires: e.target.value })} /></div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={upsert.isPending}>{upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
