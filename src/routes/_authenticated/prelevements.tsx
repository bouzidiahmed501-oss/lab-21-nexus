import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Loader2, TestTubes } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
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
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/prelevements")({
  head: () => ({ meta: [{ title: "Prélèvements — BALIMS" }] }),
  component: PrelevementsPage,
});

const STATUTS = ["planifie", "effectue", "recu_labo", "rejete"] as const;
type Statut = (typeof STATUTS)[number];

const VAR: Record<Statut, "default" | "secondary" | "outline" | "destructive"> = {
  planifie: "outline", effectue: "default", recu_labo: "secondary", rejete: "destructive",
};

interface Row {
  id: string;
  numero: string;
  client_id: string;
  mission_id: string | null;
  date_prelevement: string;
  date_reception: string | null;
  lieu: string | null;
  preleveur_nom: string | null;
  conformite: boolean | null;
  temperature: number | null;
  statut: Statut;
  observations: string | null;
  clients: { raison_sociale: string } | null;
  missions: { numero: string } | null;
}

function PrelevementsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["prelevements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prelevements")
        .select("*, clients(raison_sociale), missions(numero)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((r) => {
      if (statutFilter !== "all" && r.statut !== statutFilter) return false;
      if (!q) return true;
      return [r.numero, r.clients?.raison_sociale, r.lieu, r.preleveur_nom]
        .filter(Boolean).some((v) => v!.toLowerCase().includes(q));
    });
  }, [rows, search, statutFilter]);

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: Statut }) => {
      const patch: { statut: Statut; date_reception?: string } = { statut };
      if (statut === "recu_labo") patch.date_reception = new Date().toISOString();
      const { error } = await supabase.from("prelevements").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Statut mis à jour"); qc.invalidateQueries({ queryKey: ["prelevements"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Prélèvements & Réception"
        description="Traçabilité des échantillons : prélèvement, transport, réception au labo."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouveau prélèvement</Button>}
      />

      <div className="space-y-4 p-6">
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
              {STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={TestTubes} title="Aucun prélèvement"
            description="Enregistrez un prélèvement (lié ou non à une mission)."
            action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouveau</Button>} />
        ) : (
          <div className="rounded-lg border border-border/60 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead><TableHead>Date prélèvement</TableHead>
                  <TableHead>Client</TableHead><TableHead>Mission</TableHead>
                  <TableHead>Préleveur</TableHead><TableHead>T° (°C)</TableHead>
                  <TableHead>Conf.</TableHead><TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm font-medium">{r.numero}</TableCell>
                    <TableCell>{formatDateTime(r.date_prelevement)}</TableCell>
                    <TableCell>{r.clients?.raison_sociale ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.missions?.numero ?? "—"}</TableCell>
                    <TableCell>{r.preleveur_nom ?? "—"}</TableCell>
                    <TableCell>{r.temperature ?? "—"}</TableCell>
                    <TableCell>
                      {r.conformite === null ? "—" : r.conformite ? <Badge variant="default">OK</Badge> : <Badge variant="destructive">NC</Badge>}
                    </TableCell>
                    <TableCell>
                      <Select value={r.statut} onValueChange={(v) => updateStatut.mutate({ id: r.id, statut: v as Statut })}>
                        <SelectTrigger className="h-7 w-32 text-xs"><Badge variant={VAR[r.statut]}>{r.statut}</Badge></SelectTrigger>
                        <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <NewDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function NewDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [missionId, setMissionId] = useState<string>("none");
  const [datePrelev, setDatePrelev] = useState(() => new Date().toISOString().slice(0, 16));
  const [lieu, setLieu] = useState("");
  const [preleveur, setPreleveur] = useState("");
  const [temp, setTemp] = useState<string>("");
  const [conformite, setConformite] = useState(true);
  const [observations, setObservations] = useState("");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients_active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id,raison_sociale").eq("is_active", true).order("raison_sociale");
      if (error) throw error;
      return data;
    },
  });
  const { data: missions = [] } = useQuery({
    queryKey: ["missions_active", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase.from("missions").select("id,numero").eq("client_id", clientId).in("statut", ["planifiee", "en_cours"]).order("date_mission", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error("Sélectionnez un client");
      z.string().max(200).parse(lieu);
      z.string().max(100).parse(preleveur);
      z.string().max(1000).parse(observations);
      const numero = await nextNumero("PRL");
      const { error } = await supabase.from("prelevements").insert({
        numero, client_id: clientId,
        mission_id: missionId === "none" ? null : missionId,
        date_prelevement: new Date(datePrelev).toISOString(),
        lieu: lieu || null, preleveur_nom: preleveur || null,
        temperature: temp ? Number(temp) : null,
        conformite, observations: observations || null,
        statut: "preleve",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Prélèvement enregistré");
      qc.invalidateQueries({ queryKey: ["prelevements"] });
      setClientId(""); setMissionId("none"); setLieu(""); setPreleveur(""); setTemp(""); setObservations("");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Nouveau prélèvement</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={clientId} onValueChange={(v) => { setClientId(v); setMissionId("none"); }}>
                <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.raison_sociale}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mission liée</Label>
              <Select value={missionId} onValueChange={setMissionId} disabled={!clientId}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Aucune —</SelectItem>
                  {missions.map((m) => <SelectItem key={m.id} value={m.id}>{m.numero}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date & heure prélèvement</Label>
              <Input type="datetime-local" value={datePrelev} onChange={(e) => setDatePrelev(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Préleveur</Label>
              <Input value={preleveur} onChange={(e) => setPreleveur(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Lieu</Label>
              <Input value={lieu} onChange={(e) => setLieu(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label>Température (°C)</Label>
              <Input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} />
            </div>
            <div className="flex items-center gap-3 pt-7">
              <Switch checked={conformite} onCheckedChange={setConformite} />
              <Label>Échantillon conforme</Label>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observations</Label>
              <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} rows={2} maxLength={1000} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
