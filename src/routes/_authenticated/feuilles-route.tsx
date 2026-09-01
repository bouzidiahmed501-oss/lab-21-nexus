import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Loader2, CalendarRange, Eye, UserPlus, CheckCircle2, Printer } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { EmptyState } from "@/components/lab/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { nextNumero } from "@/lib/numbering";
import { formatDate } from "@/lib/format";
import { printFeuilleRoute } from "@/lib/print/feuilleRoute";

export const Route = createFileRoute("/_authenticated/feuilles-route")({
  head: () => ({ meta: [{ title: "Feuilles de route — BALIMS" }] }),
  component: FRPage,
});

const STATUTS = ["planifiee", "en_cours", "terminee", "annulee"] as const;
type Statut = (typeof STATUTS)[number];
const STATUT_LABEL: Record<Statut, string> = {
  planifiee: "Planifiée", en_cours: "En cours", terminee: "Terminée", annulee: "Annulée",
};
const VAR: Record<Statut, "default" | "secondary" | "outline" | "destructive"> = {
  planifiee: "outline", en_cours: "default", terminee: "secondary", annulee: "destructive",
};

const TACHE_STATUTS = ["a_faire", "en_cours", "terminee"] as const;
const TACHE_LABEL: Record<string, string> = {
  a_faire: "À faire", en_cours: "En cours", terminee: "Terminée",
};

function FRPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["feuilles_route"],
    queryFn: async () => {
      const { data, error } = await supabase.from("feuilles_route").select("*").order("date_fr", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((r: any) => {
      if (statutFilter !== "all" && r.statut !== statutFilter) return false;
      if (!q) return true;
      return [r.numero, r.laboratoire].filter(Boolean).some((v: string) => v.toLowerCase().includes(q));
    });
  }, [rows, search, statutFilter]);

  const stats = useMemo(() => ({
    total: rows.length,
    planifiees: rows.filter((r: any) => r.statut === "planifiee").length,
    enCours: rows.filter((r: any) => r.statut === "en_cours").length,
    terminees: rows.filter((r: any) => r.statut === "terminee").length,
  }), [rows]);

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: Statut }) => {
      const { error } = await supabase.from("feuilles_route").update({ statut }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Statut mis à jour"); qc.invalidateQueries({ queryKey: ["feuilles_route"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const printFr = async (fr: any) => {
    const { data, error } = await supabase.from("fr_taches")
      .select("*, prelevements(numero), parametres_analyse(libelle)")
      .eq("fr_id", fr.id).order("ordre");
    if (error) { toast.error(error.message); return; }
    printFeuilleRoute({
      numero: fr.numero,
      date_fr: fr.date_fr,
      laboratoire: fr.laboratoire,
      notes: fr.notes,
      taches: (data ?? []).map((t: any) => ({
        designation: t.designation,
        prelevement: t.prelevements?.numero ?? null,
        parametre: t.parametres_analyse?.libelle ?? null,
        technicien: t.technicien,
        priorite: t.priorite,
      })),
    });
  };

  return (
    <div>
      <PageHeader
        title="Feuilles de route"
        description="Planning quotidien — affectation des analyses aux techniciens avec suivi d'avancement."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouvelle FR</Button>}
      />

      <div className="space-y-4 p-6">
        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-[10px] text-muted-foreground">Total</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-blue-600">{stats.planifiees}</p><p className="text-[10px] text-muted-foreground">Planifiées</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-primary">{stats.enCours}</p><p className="text-[10px] text-muted-foreground">En cours</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-emerald-600">{stats.terminees}</p><p className="text-[10px] text-muted-foreground">Terminées</p></CardContent></Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher…" className="pl-9"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statutFilter} onValueChange={setStatutFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              {STATUTS.map((s) => <SelectItem key={s} value={s}>{STATUT_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={CalendarRange} title="Aucune feuille de route"
            description="Créez le planning du jour pour vos techniciens."
            action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouvelle FR</Button>} />
        ) : (
          <div className="rounded-lg border border-border/60 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead><TableHead>Date</TableHead>
                  <TableHead>Laboratoire</TableHead><TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm font-medium">{r.numero}</TableCell>
                    <TableCell>{formatDate(r.date_fr)}</TableCell>
                    <TableCell>{r.laboratoire || "—"}</TableCell>
                    <TableCell>
                      <Select value={r.statut} onValueChange={(v) => updateStatut.mutate({ id: r.id, statut: v as Statut })}>
                        <SelectTrigger className="h-7 w-32 text-xs"><Badge variant={VAR[r.statut as Statut]}>{STATUT_LABEL[r.statut as Statut]}</Badge></SelectTrigger>
                        <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{STATUT_LABEL[s]}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setViewing(r.id)}><Eye className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <NewDialog open={open} onClose={() => setOpen(false)} />
      {viewing && <ViewDialog id={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function NewDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [dateFr, setDateFr] = useState(() => new Date().toISOString().split("T")[0]);
  const [labo, setLabo] = useState("");
  const [notes, setNotes] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const numero = await nextNumero("FR");
      const { error } = await supabase.from("feuilles_route").insert({
        numero, date_fr: dateFr, laboratoire: labo || null, notes: notes || null, statut: "planifiee",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feuille de route créée");
      qc.invalidateQueries({ queryKey: ["feuilles_route"] });
      setLabo(""); setNotes("");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nouvelle feuille de route</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <div className="space-y-2"><Label>Date *</Label><Input type="date" value={dateFr} onChange={(e) => setDateFr(e.target.value)} /></div>
          <div className="space-y-2"><Label>Laboratoire</Label><Input value={labo} onChange={(e) => setLabo(e.target.value)} placeholder="Microbiologie, Physico-chimie…" /></div>
          <div className="space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Créer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ViewDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [newTache, setNewTache] = useState({ designation: "", technicien: "", priorite: "normale" });

  const { data: taches = [], isLoading } = useQuery({
    queryKey: ["fr_taches", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("fr_taches")
        .select("*, prelevements(numero), parametres_analyse(libelle)")
        .eq("fr_id", id).order("ordre");
      if (error) throw error;
      return data;
    },
  });

  const updateTacheStatut = useMutation({
    mutationFn: async ({ tacheId, statut }: { tacheId: string; statut: string }) => {
      const { error } = await supabase.from("fr_taches").update({ statut } as any).eq("id", tacheId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tâche mise à jour");
      qc.invalidateQueries({ queryKey: ["fr_taches", id] });
    },
  });

  const addTache = useMutation({
    mutationFn: async () => {
      if (!newTache.designation) throw new Error("Désignation requise");
      const { error } = await supabase.from("fr_taches").insert({
        fr_id: id,
        designation: newTache.designation,
        technicien: newTache.technicien || null,
        priorite: newTache.priorite,
        statut: "a_faire",
        ordre: taches.length + 1,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tâche ajoutée");
      setNewTache({ designation: "", technicien: "", priorite: "normale" });
      setAddOpen(false);
      qc.invalidateQueries({ queryKey: ["fr_taches", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const done = taches.filter((t: any) => t.statut === "terminee").length;
  const pct = taches.length > 0 ? Math.round((done / taches.length) * 100) : 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Tâches de la feuille de route</DialogTitle></DialogHeader>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-2">
          <Progress value={pct} className="flex-1" />
          <span className="text-sm font-medium">{pct}%</span>
          <span className="text-xs text-muted-foreground">({done}/{taches.length})</span>
        </div>

        <div className="flex justify-end mb-2">
          <Button size="sm" variant="outline" onClick={() => setAddOpen(!addOpen)}>
            <UserPlus className="h-3 w-3 mr-1" /> Ajouter tâche
          </Button>
        </div>

        {addOpen && (
          <Card className="mb-3">
            <CardContent className="p-3 grid grid-cols-3 gap-2">
              <Input placeholder="Désignation *" value={newTache.designation} onChange={(e) => setNewTache({ ...newTache, designation: e.target.value })} />
              <Input placeholder="Technicien" value={newTache.technicien} onChange={(e) => setNewTache({ ...newTache, technicien: e.target.value })} />
              <div className="flex gap-2">
                <Select value={newTache.priorite} onValueChange={(v) => setNewTache({ ...newTache, priorite: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basse">Basse</SelectItem>
                    <SelectItem value="normale">Normale</SelectItem>
                    <SelectItem value="haute">Haute</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => addTache.mutate()} disabled={addTache.isPending}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : taches.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Aucune tâche affectée. Utilisez le bouton ci-dessus pour ajouter.</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Désignation</TableHead>
              <TableHead>Prélèvement</TableHead>
              <TableHead>Paramètre</TableHead>
              <TableHead>Technicien</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {taches.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.designation || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{(t.prelevements as any)?.numero ?? "—"}</TableCell>
                  <TableCell>{(t.parametres_analyse as any)?.libelle ?? "—"}</TableCell>
                  <TableCell className="text-sm">{t.technicien || "—"}</TableCell>
                  <TableCell>
                    <Select value={t.statut} onValueChange={(v) => updateTacheStatut.mutate({ tacheId: t.id, statut: v })}>
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <Badge variant={t.statut === "terminee" ? "secondary" : t.statut === "en_cours" ? "default" : "outline"}>
                          {TACHE_LABEL[t.statut] || t.statut}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {TACHE_STATUTS.map((s) => <SelectItem key={s} value={s}>{TACHE_LABEL[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
