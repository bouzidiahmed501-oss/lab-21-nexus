import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Printer } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { DataTable, type Column } from "@/components/lab/DataTable";
import { StatusBadge, statutTone } from "@/components/lab/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { nextNumero } from "@/lib/numbering";
import { formatDateTime } from "@/lib/format";
import { printLabels } from "@/components/lab/PrintLabels";

export const Route = createFileRoute("/_authenticated/prelevements")({
  head: () => ({ meta: [{ title: "Prélèvements — BALIMS" }] }),
  component: PrelevementsPage,
});

const STATUTS = ["planifie", "effectue", "recu_labo", "rejete"] as const;
type Statut = (typeof STATUTS)[number];

interface Row {
  id: string;
  numero: string;
  code_barre: string | null;
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
    if (statutFilter === "all") return rows;
    return rows.filter((r) => r.statut === statutFilter);
  }, [rows, statutFilter]);

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

  const columns: Column<Row>[] = [
    { key: "numero", header: "N°", cell: (r) => <span className="text-numeric font-medium">{r.numero}</span>, width: "130px" },
    { key: "date_prelevement", header: "Date prélèv.", cell: (r) => <span className="text-numeric text-xs">{formatDateTime(r.date_prelevement)}</span>, accessor: (r) => r.date_prelevement, width: "150px" },
    { key: "client", header: "Client", accessor: (r) => r.clients?.raison_sociale ?? "", cell: (r) => r.clients?.raison_sociale ?? "—" },
    { key: "mission", header: "Mission", accessor: (r) => r.missions?.numero ?? "", cell: (r) => <span className="text-numeric text-xs text-muted-foreground">{r.missions?.numero ?? "—"}</span>, width: "120px" },
    { key: "preleveur", header: "Préleveur", accessor: (r) => r.preleveur_nom ?? "", cell: (r) => r.preleveur_nom ?? "—" },
    { key: "lieu", header: "Lieu", cell: (r) => <span className="text-muted-foreground">{r.lieu ?? "—"}</span> },
    { key: "temperature", header: "T° (°C)", align: "right", width: "80px", cell: (r) => r.temperature ?? "—", accessor: (r) => r.temperature ?? null },
    { key: "conformite", header: "Conf.", align: "center", width: "80px", cell: (r) => r.conformite === null ? "—" : <StatusBadge label={r.conformite ? "OK" : "NC"} tone={r.conformite ? "success" : "destructive"} dot={false} /> },
    {
      key: "statut", header: "Statut", align: "center", width: "150px",
      cell: (r) => (
        <Select value={r.statut} onValueChange={(v) => updateStatut.mutate({ id: r.id, statut: v as Statut })}>
          <SelectTrigger className="h-7 border-0 bg-transparent p-0 hover:bg-transparent" onClick={(e) => e.stopPropagation()}>
            <StatusBadge label={r.statut} tone={statutTone(r.statut)} />
          </SelectTrigger>
          <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      ),
    },
    {
      key: "actions", header: "", width: "60px", align: "center",
      cell: (r) => (
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => {
          e.stopPropagation();
          if (!r.code_barre) { toast.error("Code-barres manquant"); return; }
          printLabels([{ code_barre: r.code_barre, numero: r.numero, client: r.clients?.raison_sociale, date: r.date_prelevement }]);
        }}>
          <Printer className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];



  return (
    <div>
      <PageHeader
        title="Prélèvements & Réception"
        description="Traçabilité des échantillons : prélèvement, transport, réception au labo."
        badge={<StatusBadge label={`${rows.length}`} tone="info" dot={false} />}
        actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Nouveau prélèvement</Button>}
      />

      <div className="p-4">
        <DataTable
          data={filtered}
          columns={columns}
          loading={isLoading}
          rowKey={(r) => r.id}
          searchableKeys={["numero", "lieu", "preleveur_nom"]}
          searchPlaceholder="Rechercher (n°, lieu, préleveur…)"
          exportFilename="prelevements"
          emptyMessage="Aucun prélèvement enregistré."
          toolbarLeft={
            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          }
        />
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
  const [creerEch, setCreerEch] = useState(true);
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
      const { data, error } = await supabase.from("prelevements").insert({
        numero, client_id: clientId,
        mission_id: missionId === "none" ? null : missionId,
        date_prelevement: new Date(datePrelev).toISOString(),
        lieu: lieu || null, preleveur_nom: preleveur || null,
        temperature: temp ? Number(temp) : null,
        conformite, observations: observations || null,
        statut: "effectue",
      }).select("id, numero, code_barre, date_prelevement").single();
      if (error) throw error;

      if (creerEch) {
        const code = data.code_barre ?? data.numero;
        const clientNom = clients.find((c) => c.id === clientId)?.raison_sociale;
        const { error: e2 } = await (supabase.from("echantillons" as never) as any).insert({
          code_barre: code,
          designation: `Échantillon ${data.numero}${lieu ? ` — ${lieu}` : ""}`,
          prelevement_id: data.id,
          statut: "recu",
          temperature_stockage: temp ? Number(temp) : null,
        });
        if (e2) throw e2;
        printLabels([{ code_barre: code, numero: data.numero, client: clientNom, date: data.date_prelevement }]);
      }
    },
    onSuccess: () => {
      toast.success(creerEch ? "Prélèvement + échantillon créés, étiquette envoyée" : "Prélèvement enregistré");
      qc.invalidateQueries({ queryKey: ["prelevements"] });
      qc.invalidateQueries({ queryKey: ["echantillons"] });
      setClientId(""); setMissionId("none"); setLieu(""); setPreleveur(""); setTemp(""); setObservations("");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
