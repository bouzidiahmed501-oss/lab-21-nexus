import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { EmptyState } from "@/components/lab/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Search, Briefcase, ListChecks, AlertCircle } from "lucide-react";
import { nextNumero } from "@/lib/numbering";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/projets")({
  head: () => ({ meta: [{ title: "Projets — BALIMS" }] }),
  component: ProjetsPage,
});

const STATUT_LABEL: Record<string, string> = {
  planifie: "Planifié", en_cours: "En cours", en_pause: "En pause", termine: "Terminé", annule: "Annulé",
};
const STATUT_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  planifie: "outline", en_cours: "default", en_pause: "secondary", termine: "secondary", annule: "destructive",
};
const TACHE_STATUT: Record<string, string> = {
  a_faire: "À faire", en_cours: "En cours", bloquee: "Bloquée", terminee: "Terminée",
};
const PRIORITE_LABEL: Record<string, string> = { basse: "Basse", normale: "Normale", haute: "Haute", critique: "Critique" };
const PRIORITE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  basse: "outline", normale: "secondary", haute: "default", critique: "destructive",
};

function ProjetsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const { data: projets = [] } = useQuery({
    queryKey: ["projets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projets" as never).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => projets.filter((p: any) => {
    const ms = !search || [p.numero, p.nom].filter(Boolean).some((s: string) => s.toLowerCase().includes(search.toLowerCase()));
    const mst = statutFilter === "all" || p.statut === statutFilter;
    return ms && mst;
  }), [projets, search, statutFilter]);

  const stats = {
    total: projets.length,
    enCours: projets.filter((p: any) => p.statut === "en_cours").length,
    termines: projets.filter((p: any) => p.statut === "termine").length,
    budget: projets.reduce((s: number, p: any) => s + Number(p.budget || 0), 0),
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Projets"
        description="Gestion de projets, tâches et avancement"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Nouveau projet</Button></DialogTrigger>
            <ProjetForm onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["projets"] })} />
          </Dialog>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-semibold">{stats.total}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">En cours</p><p className="text-2xl font-semibold text-primary">{stats.enCours}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Terminés</p><p className="text-2xl font-semibold">{stats.termines}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Budget total</p><p className="text-xl font-semibold">{formatCurrency(stats.budget)}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center gap-2">
              <CardTitle>Liste des projets</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-8 w-64" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={statutFilter} onValueChange={setStatutFilter}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    {Object.entries(STATUT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <EmptyState icon={Briefcase} title="Aucun projet" description="Démarrez votre premier projet." />
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Numéro</TableHead><TableHead>Nom</TableHead><TableHead>Statut</TableHead>
                  <TableHead>Avancement</TableHead><TableHead>Échéance</TableHead>
                  <TableHead className="text-right">Budget</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.numero}</TableCell>
                      <TableCell className="font-medium">{p.nom}</TableCell>
                      <TableCell><Badge variant={STATUT_VARIANT[p.statut]}>{STATUT_LABEL[p.statut]}</Badge></TableCell>
                      <TableCell><div className="flex items-center gap-2"><Progress value={p.avancement_pct} className="w-24" /><span className="text-xs text-muted-foreground">{p.avancement_pct}%</span></div></TableCell>
                      <TableCell>{formatDate(p.date_fin_prevue)}</TableCell>
                      <TableCell className="text-right">{p.budget ? formatCurrency(p.budget) : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelected(p)}>Ouvrir</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {selected && (
        <ProjetDetail projet={selected} onClose={() => setSelected(null)} onChanged={() => qc.invalidateQueries({ queryKey: ["projets"] })} />
      )}
    </div>
  );
}

function ProjetForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    nom: "", description: "", date_debut: "", date_fin_prevue: "",
    budget: "", statut: "planifie",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!f.nom) { toast.error("Nom requis"); return; }
    setSaving(true);
    try {
      const numero = await nextNumero("PRJ");
      const { error } = await supabase.from("projets" as never).insert({
        numero, nom: f.nom, description: f.description || null,
        date_debut: f.date_debut || null, date_fin_prevue: f.date_fin_prevue || null,
        budget: f.budget ? Number(f.budget) : null, statut: f.statut,
      } as never);
      if (error) throw error;
      toast.success(`Projet ${numero} créé`); onSaved(); onClose();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nouveau projet</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Nom *</Label><Input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} /></div>
        <div><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Date début</Label><Input type="date" value={f.date_debut} onChange={(e) => setF({ ...f, date_debut: e.target.value })} /></div>
          <div><Label>Date fin prévue</Label><Input type="date" value={f.date_fin_prevue} onChange={(e) => setF({ ...f, date_fin_prevue: e.target.value })} /></div>
          <div><Label>Budget (TND)</Label><Input type="number" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} /></div>
          <div>
            <Label>Statut</Label>
            <Select value={f.statut} onValueChange={(v) => setF({ ...f, statut: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "…" : "Créer"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ProjetDetail({ projet, onClose, onChanged }: { projet: any; onClose: () => void; onChanged: () => void }) {
  const qc = useQueryClient();
  const [avancement, setAvancement] = useState(projet.avancement_pct);
  const [statut, setStatut] = useState(projet.statut);

  const { data: taches = [] } = useQuery({
    queryKey: ["taches", projet.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projet_taches" as never)
        .select("*").eq("projet_id", projet.id).order("ordre");
      if (error) throw error;
      return data as any[];
    },
  });

  const updateProjet = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projets" as never).update({
        avancement_pct: avancement, statut,
      } as never).eq("id", projet.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Projet mis à jour"); onChanged(); },
    onError: (e: any) => toast.error(e.message),
  });

  const addTache = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from("projet_taches" as never).insert({
        projet_id: projet.id, ...payload,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Tâche ajoutée"); qc.invalidateQueries({ queryKey: ["taches", projet.id] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateTacheStatut = useMutation({
    mutationFn: async ({ id, st }: { id: string; st: string }) => {
      const { error } = await supabase.from("projet_taches" as never).update({ statut: st } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["taches", projet.id] }),
  });

  const tachesTerminees = taches.filter((t: any) => t.statut === "terminee").length;
  const tauxAuto = taches.length > 0 ? Math.round((tachesTerminees / taches.length) * 100) : 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>{projet.numero} — {projet.nom}</DialogTitle></DialogHeader>
        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="taches"><ListChecks className="mr-1 h-3.5 w-3.5" /> Tâches ({taches.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="info" className="space-y-3">
            {projet.description && <p className="text-sm text-muted-foreground">{projet.description}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Statut</Label>
                <Select value={statut} onValueChange={setStatut}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Avancement (%)</Label>
                <Input type="number" min={0} max={100} value={avancement} onChange={(e) => setAvancement(Number(e.target.value))} />
              </div>
            </div>
            <Progress value={avancement} />
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5" />
              Avancement automatique selon tâches : {tauxAuto}% ({tachesTerminees}/{taches.length})
              {taches.length > 0 && (
                <Button size="sm" variant="link" className="h-auto p-0" onClick={() => setAvancement(tauxAuto)}>Synchroniser</Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm pt-2">
              <div className="flex justify-between border-b border-border/50 py-1.5"><span className="text-muted-foreground">Début</span><span>{formatDate(projet.date_debut)}</span></div>
              <div className="flex justify-between border-b border-border/50 py-1.5"><span className="text-muted-foreground">Échéance</span><span>{formatDate(projet.date_fin_prevue)}</span></div>
              <div className="flex justify-between border-b border-border/50 py-1.5"><span className="text-muted-foreground">Budget</span><span>{projet.budget ? formatCurrency(projet.budget) : "—"}</span></div>
              <div className="flex justify-between border-b border-border/50 py-1.5"><span className="text-muted-foreground">Coût réel</span><span>{formatCurrency(projet.cout_reel || 0)}</span></div>
            </div>
            <Button onClick={() => updateProjet.mutate()} disabled={updateProjet.isPending}>Enregistrer modifications</Button>
          </TabsContent>

          <TabsContent value="taches" className="space-y-3">
            <TacheForm onSubmit={(p) => addTache.mutate(p)} />
            {taches.length === 0 ? (
              <EmptyState icon={ListChecks} title="Aucune tâche" description="Ajoutez la première tâche du projet." />
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Tâche</TableHead><TableHead>Priorité</TableHead>
                  <TableHead>Échéance</TableHead><TableHead>Statut</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {taches.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.titre}</TableCell>
                      <TableCell><Badge variant={PRIORITE_VARIANT[t.priorite]}>{PRIORITE_LABEL[t.priorite]}</Badge></TableCell>
                      <TableCell>{formatDate(t.date_echeance)}</TableCell>
                      <TableCell>
                        <Select value={t.statut} onValueChange={(v) => updateTacheStatut.mutate({ id: t.id, st: v })}>
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(TACHE_STATUT).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function TacheForm({ onSubmit }: { onSubmit: (p: any) => void }) {
  const [f, setF] = useState({ titre: "", description: "", priorite: "normale", date_echeance: "" });
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Nouvelle tâche</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>Titre</Label><Input value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} /></div>
        <div>
          <Label>Priorité</Label>
          <Select value={f.priorite} onValueChange={(v) => setF({ ...f, priorite: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PRIORITE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Échéance</Label><Input type="date" value={f.date_echeance} onChange={(e) => setF({ ...f, date_echeance: e.target.value })} /></div>
        <div className="col-span-2">
          <Button size="sm" onClick={() => {
            if (!f.titre) { toast.error("Titre requis"); return; }
            onSubmit({ titre: f.titre, description: f.description || null, priorite: f.priorite, date_echeance: f.date_echeance || null });
            setF({ titre: "", description: "", priorite: "normale", date_echeance: "" });
          }}><Plus className="mr-2 h-4 w-4" /> Ajouter</Button>
        </div>
      </CardContent>
    </Card>
  );
}
