import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Loader2, MapPin, Eye, Trash2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { EmptyState } from "@/components/lab/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/_authenticated/missions")({
  head: () => ({ meta: [{ title: "Missions — BALIMS" }] }),
  component: MissionsPage,
});

const STATUTS = ["planifiee", "en_cours", "terminee", "annulee"] as const;
type Statut = (typeof STATUTS)[number];

const STATUT_VARIANT: Record<Statut, "default" | "secondary" | "outline" | "destructive"> = {
  planifiee: "outline", en_cours: "default", terminee: "secondary", annulee: "destructive",
};

interface Echantillon {
  code_echantillon: string;
  designation: string;
  produit_id?: string | null;
  quantite?: number | null;
  unite_id?: string | null;
  conditions_prelevement?: string;
  notes?: string;
}

interface MissionRow {
  id: string;
  numero: string;
  client_id: string;
  bc_id: string | null;
  date_mission: string;
  date_prevue: string | null;
  lieu: string | null;
  statut: Statut;
  objet: string | null;
  clients: { raison_sociale: string } | null;
  bons_commande: { numero: string } | null;
}

function MissionsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ["missions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missions")
        .select("*, clients(raison_sociale), bons_commande:bc_id(numero)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as MissionRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return missions.filter((m) => {
      if (statutFilter !== "all" && m.statut !== statutFilter) return false;
      if (!q) return true;
      return [m.numero, m.clients?.raison_sociale, m.lieu, m.objet]
        .filter(Boolean).some((v) => v!.toLowerCase().includes(q));
    });
  }, [missions, search, statutFilter]);

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: Statut }) => {
      const { error } = await supabase.from("missions").update({ statut }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Statut mis à jour"); qc.invalidateQueries({ queryKey: ["missions"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Missions de prélèvement"
        description="Planification des sorties terrain et échantillons à collecter."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouvelle mission</Button>}
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher (n°, client, lieu…)" className="pl-9"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statutFilter} onValueChange={setStatutFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              {STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={MapPin} title="Aucune mission"
            description="Planifiez une mission de prélèvement pour démarrer."
            action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouvelle mission</Button>} />
        ) : (
          <div className="rounded-lg border border-border/60 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead><TableHead>Date prévue</TableHead><TableHead>Client</TableHead>
                  <TableHead>BC lié</TableHead><TableHead>Lieu</TableHead>
                  <TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-sm font-medium">{m.numero}</TableCell>
                    <TableCell>{formatDate(m.date_prevue ?? m.date_mission)}</TableCell>
                    <TableCell>{m.clients?.raison_sociale ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{m.bons_commande?.numero ?? "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{m.lieu || "—"}</TableCell>
                    <TableCell>
                      <Select value={m.statut} onValueChange={(v) => updateStatut.mutate({ id: m.id, statut: v as Statut })}>
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <Badge variant={STATUT_VARIANT[m.statut]}>{m.statut}</Badge>
                        </SelectTrigger>
                        <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setViewingId(m.id)} title="Voir échantillons"><Eye className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <NewMissionDialog open={open} onClose={() => setOpen(false)} />
      {viewingId && <ViewMissionDialog id={viewingId} onClose={() => setViewingId(null)} />}
    </div>
  );
}

function NewMissionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [bcId, setBcId] = useState<string>("none");
  const [datePrevue, setDatePrevue] = useState(() => new Date().toISOString().split("T")[0]);
  const [lieu, setLieu] = useState("");
  const [objet, setObjet] = useState("");
  const [notes, setNotes] = useState("");
  const [echantillons, setEchantillons] = useState<Echantillon[]>([
    { code_echantillon: "", designation: "" },
  ]);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients_active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id,raison_sociale").eq("is_active", true).order("raison_sociale");
      if (error) throw error;
      return data;
    },
  });
  const { data: bcs = [] } = useQuery({
    queryKey: ["bcs_active", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase.from("bons_commande").select("id,numero,objet")
        .eq("client_id", clientId).in("statut", ["accepte", "en_cours"]).order("date_bc", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: produits = [] } = useQuery({
    queryKey: ["produits_active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produits").select("id,libelle").eq("is_active", true).order("libelle");
      if (error) throw error;
      return data;
    },
  });

  const addEch = () => setEchantillons((a) => [...a, { code_echantillon: "", designation: "" }]);
  const removeEch = (i: number) => setEchantillons((a) => a.filter((_, idx) => idx !== i));
  const updateEch = (i: number, patch: Partial<Echantillon>) =>
    setEchantillons((a) => a.map((e, idx) => idx === i ? { ...e, ...patch } : e));

  const create = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error("Sélectionnez un client");
      z.string().max(200).parse(lieu);
      z.string().max(500).parse(objet);
      const validEch = echantillons.filter((e) => e.code_echantillon.trim() && e.designation.trim());

      const numero = await nextNumero("MIS");
      const { data: m, error: e1 } = await supabase.from("missions").insert({
        numero, client_id: clientId, bc_id: bcId === "none" ? null : bcId,
        date_mission: new Date().toISOString().split("T")[0],
        date_prevue: datePrevue || null, lieu: lieu || null, objet: objet || null, notes: notes || null,
        statut: "planifiee",
      }).select("id").single();
      if (e1) throw e1;

      if (validEch.length > 0) {
        const { error: e2 } = await supabase.from("mission_echantillons").insert(
          validEch.map((e) => ({
            mission_id: m.id,
            code_echantillon: e.code_echantillon,
            designation: e.designation,
            produit_id: e.produit_id || null,
            quantite: e.quantite || null,
            conditions_prelevement: e.conditions_prelevement || null,
            notes: e.notes || null,
          })),
        );
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      toast.success("Mission créée");
      qc.invalidateQueries({ queryKey: ["missions"] });
      setClientId(""); setBcId("none"); setLieu(""); setObjet(""); setNotes("");
      setEchantillons([{ code_echantillon: "", designation: "" }]);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nouvelle mission</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={clientId} onValueChange={(v) => { setClientId(v); setBcId("none"); }}>
                <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.raison_sociale}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bon de commande lié</Label>
              <Select value={bcId} onValueChange={setBcId} disabled={!clientId}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Aucun —</SelectItem>
                  {bcs.map((b) => <SelectItem key={b.id} value={b.id}>{b.numero} {b.objet ? `— ${b.objet}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date prévue</Label>
              <Input type="date" value={datePrevue} onChange={(e) => setDatePrevue(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input value={lieu} onChange={(e) => setLieu(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Objet</Label>
              <Input value={objet} onChange={(e) => setObjet(e.target.value)} maxLength={500} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Échantillons à prélever</Label>
              <Button type="button" variant="outline" size="sm" onClick={addEch}><Plus className="h-3 w-3" /> Échantillon</Button>
            </div>
            <div className="rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Code</TableHead>
                    <TableHead>Désignation</TableHead>
                    <TableHead className="w-44">Produit</TableHead>
                    <TableHead className="w-24">Qté</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {echantillons.map((e, i) => (
                    <TableRow key={i}>
                      <TableCell><Input className="h-8" value={e.code_echantillon} onChange={(ev) => updateEch(i, { code_echantillon: ev.target.value })} /></TableCell>
                      <TableCell><Input className="h-8" value={e.designation} onChange={(ev) => updateEch(i, { designation: ev.target.value })} /></TableCell>
                      <TableCell>
                        <Select value={e.produit_id ?? "none"} onValueChange={(v) => updateEch(i, { produit_id: v === "none" ? null : v })}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">—</SelectItem>
                            {produits.map((p) => <SelectItem key={p.id} value={p.id}>{p.libelle}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input className="h-8" type="number" step="0.01" value={e.quantite ?? ""} onChange={(ev) => updateEch(i, { quantite: ev.target.value ? Number(ev.target.value) : null })} /></TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeEch(i)}><Trash2 className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={1000} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ViewMissionDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: ech = [], isLoading } = useQuery({
    queryKey: ["mission_ech", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("mission_echantillons").select("*, produits(libelle)").eq("mission_id", id);
      if (error) throw error;
      return data;
    },
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Échantillons de la mission</DialogTitle></DialogHeader>
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Code</TableHead><TableHead>Désignation</TableHead><TableHead>Produit</TableHead><TableHead>Qté</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {ech.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.code_echantillon}</TableCell>
                  <TableCell>{e.designation}</TableCell>
                  <TableCell className="text-muted-foreground">{(e.produits as { libelle: string } | null)?.libelle ?? "—"}</TableCell>
                  <TableCell>{e.quantite ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
