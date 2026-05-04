import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, FileText, Trash2, Download, Eye, Clock, CheckCircle2, XCircle, Thermometer, MapPin } from "lucide-react";
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
import { formatCurrency, formatDate } from "@/lib/format";
import { generateBcPdf } from "@/lib/pdf/bonCommande";

export const Route = createFileRoute("/_authenticated/bons-commande")({
  head: () => ({ meta: [{ title: "Bons de commande — BALIMS" }] }),
  component: BCPage,
});

const STATUTS = ["brouillon", "envoye", "accepte", "refuse", "en_cours", "cloture", "annule"] as const;
type BCStatut = (typeof STATUTS)[number];

interface Ligne {
  id?: string;
  parametre_id?: string | null;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  remise_pct: number;
  tva_pct: number;
  total_ht: number;
}

interface BCRow {
  id: string;
  numero: string;
  client_id: string;
  date_bc: string;
  statut: BCStatut;
  reference_client: string | null;
  objet: string | null;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  clients: { raison_sociale: string; matricule_fiscal: string | null; adresse: string | null } | null;
}

function BCPage() {
  const qc = useQueryClient();
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const { data: bcs = [], isLoading } = useQuery({
    queryKey: ["bons_commande"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bons_commande")
        .select("*, clients(raison_sociale, matricule_fiscal, adresse)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as BCRow[];
    },
  });

  const filtered = useMemo(() => {
    if (statutFilter === "all") return bcs;
    return bcs.filter((b) => b.statut === statutFilter);
  }, [bcs, statutFilter]);

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: BCStatut }) => {
      const { error } = await supabase.from("bons_commande").update({ statut }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Statut mis à jour"); qc.invalidateQueries({ queryKey: ["bons_commande"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const handlePdf = async (bc: BCRow) => {
    try {
      const { data: lignes, error } = await supabase
        .from("bc_lignes").select("*").eq("bc_id", bc.id).order("ordre");
      if (error) throw error;
      const blob = await generateBcPdf({
        numero: bc.numero,
        date_bc: bc.date_bc,
        client: {
          raison_sociale: bc.clients?.raison_sociale ?? "",
          adresse: bc.clients?.adresse ?? undefined,
          matricule_fiscal: bc.clients?.matricule_fiscal ?? undefined,
        },
        reference_client: bc.reference_client,
        objet: bc.objet,
        lignes: (lignes ?? []).map((l) => ({
          designation: l.designation, quantite: Number(l.quantite),
          prix_unitaire: Number(l.prix_unitaire), remise_pct: Number(l.remise_pct),
          tva_pct: Number(l.tva_pct), total_ht: Number(l.total_ht),
        })),
        total_ht: Number(bc.total_ht), total_tva: Number(bc.total_tva), total_ttc: Number(bc.total_ttc),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${bc.numero}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur PDF");
    }
  };

  const columns: Column<BCRow>[] = [
    { key: "numero", header: "N°", cell: (r) => <span className="text-numeric font-medium">{r.numero}</span>, width: "130px" },
    { key: "date_bc", header: "Date", cell: (r) => <span className="text-numeric">{formatDate(r.date_bc)}</span>, accessor: (r) => r.date_bc, width: "110px" },
    { key: "client", header: "Client", accessor: (r) => r.clients?.raison_sociale ?? "", cell: (r) => r.clients?.raison_sociale ?? "—" },
    { key: "reference_client", header: "Réf. client", cell: (r) => <span className="text-muted-foreground">{r.reference_client || "—"}</span> },
    { key: "objet", header: "Objet", cell: (r) => <span className="truncate text-muted-foreground">{r.objet || "—"}</span> },
    { key: "total_ttc", header: "Total TTC", align: "right", cell: (r) => <span className="font-medium">{formatCurrency(r.total_ttc)}</span>, accessor: (r) => Number(r.total_ttc), width: "130px" },
    {
      key: "statut", header: "Statut", align: "center", width: "150px",
      cell: (r) => (
        <Select value={r.statut} onValueChange={(v) => updateStatut.mutate({ id: r.id, statut: v as BCStatut })}>
          <SelectTrigger className="h-7 border-0 bg-transparent p-0 hover:bg-transparent" onClick={(e) => e.stopPropagation()}>
            <StatusBadge label={r.statut} tone={statutTone(r.statut)} />
          </SelectTrigger>
          <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      ),
    },
    {
      key: "actions", header: "", align: "right", sortable: false, width: "90px",
      cell: (r) => (
        <div className="flex justify-end gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setViewingId(r.id); }} title="Voir lignes">
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handlePdf(r); }} title="Télécharger PDF">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Bons de commande"
        description="Création, suivi et validation des BC clients."
        badge={<StatusBadge label={`${bcs.length}`} tone="info" dot={false} />}
        actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Nouveau BC</Button>}
      />

      <div className="space-y-3 p-4">
        <DataTable
          data={filtered}
          columns={columns}
          loading={isLoading}
          rowKey={(r) => r.id}
          searchableKeys={["numero", "reference_client", "objet"]}
          searchPlaceholder="Rechercher (n°, réf, objet…)"
          exportFilename="bons_commande"
          emptyMessage="Aucun bon de commande."
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

        <p className="text-xs text-muted-foreground">
          Les missions de prélèvement et analyses se créent depuis un BC accepté. <Link to="/analyses" className="text-primary hover:underline">Voir les analyses</Link>.
        </p>
      </div>

      <NewBcDialog open={open} onClose={() => setOpen(false)} />
      {viewingId && <ViewBcDialog id={viewingId} onClose={() => setViewingId(null)} />}
    </div>
  );
}

// ============== NEW BC DIALOG ==============
function NewBcDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [clientId, setClientId] = useState<string>("");
  const [refClient, setRefClient] = useState("");
  const [objet, setObjet] = useState("");
  const [conditions, setConditions] = useState("");
  const [dateBc, setDateBc] = useState(() => new Date().toISOString().split("T")[0]);
  const [lignes, setLignes] = useState<Ligne[]>([
    { designation: "", quantite: 1, prix_unitaire: 0, remise_pct: 0, tva_pct: 19, total_ht: 0 },
  ]);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients_active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id,raison_sociale").eq("is_active", true).order("raison_sociale");
      if (error) throw error;
      return data;
    },
  });
  const { data: parametres = [] } = useQuery({
    queryKey: ["parametres_active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parametres_analyse").select("id,libelle,prix_unitaire").eq("is_active", true).order("libelle");
      if (error) throw error;
      return data;
    },
  });

  const recalc = (l: Ligne): Ligne => {
    const ht = l.quantite * l.prix_unitaire * (1 - l.remise_pct / 100);
    return { ...l, total_ht: Math.round(ht * 1000) / 1000 };
  };

  const totals = useMemo(() => {
    const ht = lignes.reduce((s, l) => s + l.total_ht, 0);
    const tva = lignes.reduce((s, l) => s + l.total_ht * (l.tva_pct / 100), 0);
    return { ht, tva, ttc: ht + tva };
  }, [lignes]);

  const updateLigne = (i: number, patch: Partial<Ligne>) => {
    setLignes((arr) => arr.map((l, idx) => (idx === i ? recalc({ ...l, ...patch }) : l)));
  };
  const addLigne = () => setLignes((a) => [...a, { designation: "", quantite: 1, prix_unitaire: 0, remise_pct: 0, tva_pct: 19, total_ht: 0 }]);
  const removeLigne = (i: number) => setLignes((a) => a.filter((_, idx) => idx !== i));
  const pickParam = (i: number, paramId: string) => {
    const p = parametres.find((x) => x.id === paramId);
    if (!p) return;
    updateLigne(i, { parametre_id: paramId, designation: p.libelle, prix_unitaire: Number(p.prix_unitaire) });
  };

  const create = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error("Sélectionnez un client");
      const validLignes = lignes.filter((l) => l.designation.trim() && l.quantite > 0);
      if (validLignes.length === 0) throw new Error("Ajoutez au moins une ligne");
      z.string().max(200).parse(refClient);
      z.string().max(500).parse(objet);

      const numero = await nextNumero("BC");
      const { data: bc, error: e1 } = await supabase
        .from("bons_commande")
        .insert({
          numero, client_id: clientId, date_bc: dateBc, statut: "brouillon",
          reference_client: refClient || null, objet: objet || null, conditions: conditions || null,
          total_ht: totals.ht, total_tva: totals.tva, total_ttc: totals.ttc,
        })
        .select("id").single();
      if (e1) throw e1;

      const { error: e2 } = await supabase.from("bc_lignes").insert(
        validLignes.map((l, idx) => ({
          bc_id: bc.id,
          parametre_id: l.parametre_id || null,
          designation: l.designation,
          quantite: l.quantite, prix_unitaire: l.prix_unitaire,
          remise_pct: l.remise_pct, tva_pct: l.tva_pct, total_ht: l.total_ht,
          ordre: idx,
        })),
      );
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Bon de commande créé");
      qc.invalidateQueries({ queryKey: ["bons_commande"] });
      setClientId(""); setRefClient(""); setObjet(""); setConditions("");
      setLignes([{ designation: "", quantite: 1, prix_unitaire: 0, remise_pct: 0, tva_pct: 19, total_ht: 0 }]);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nouveau bon de commande</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.raison_sociale}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date BC</Label>
              <Input type="date" value={dateBc} onChange={(e) => setDateBc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Référence client</Label>
              <Input value={refClient} onChange={(e) => setRefClient(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label>Objet</Label>
              <Input value={objet} onChange={(e) => setObjet(e.target.value)} maxLength={500} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Lignes</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLigne}>
                <Plus className="h-3 w-3" /> Ligne
              </Button>
            </div>
            <div className="rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-56">Paramètre</TableHead>
                    <TableHead>Désignation</TableHead>
                    <TableHead className="w-20">Qté</TableHead>
                    <TableHead className="w-28">PU HT</TableHead>
                    <TableHead className="w-20">Rem %</TableHead>
                    <TableHead className="w-20">TVA %</TableHead>
                    <TableHead className="w-28 text-right">Total HT</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Select value={l.parametre_id ?? "free"} onValueChange={(v) => v === "free" ? updateLigne(i, { parametre_id: null }) : pickParam(i, v)}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">— ligne libre —</SelectItem>
                            {parametres.map((p) => <SelectItem key={p.id} value={p.id}>{p.libelle}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input className="h-8" value={l.designation} onChange={(e) => updateLigne(i, { designation: e.target.value })} />
                      </TableCell>
                      <TableCell><Input className="h-8" type="number" step="0.01" value={l.quantite} onChange={(e) => updateLigne(i, { quantite: Number(e.target.value) || 0 })} /></TableCell>
                      <TableCell><Input className="h-8" type="number" step="0.001" value={l.prix_unitaire} onChange={(e) => updateLigne(i, { prix_unitaire: Number(e.target.value) || 0 })} /></TableCell>
                      <TableCell><Input className="h-8" type="number" step="0.01" value={l.remise_pct} onChange={(e) => updateLigne(i, { remise_pct: Number(e.target.value) || 0 })} /></TableCell>
                      <TableCell><Input className="h-8" type="number" step="0.01" value={l.tva_pct} onChange={(e) => updateLigne(i, { tva_pct: Number(e.target.value) || 0 })} /></TableCell>
                      <TableCell className="text-right font-medium">{l.total_ht.toFixed(3)}</TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLigne(i)}><Trash2 className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Conditions</Label>
              <Textarea rows={3} value={conditions} onChange={(e) => setConditions(e.target.value)} maxLength={2000} />
            </div>
            <div className="space-y-1 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
              <div className="flex justify-between"><span>Total HT</span><span className="font-mono">{formatCurrency(totals.ht)}</span></div>
              <div className="flex justify-between"><span>Total TVA</span><span className="font-mono">{formatCurrency(totals.tva)}</span></div>
              <div className="flex justify-between border-t pt-1 font-semibold"><span>Total TTC</span><span className="font-mono">{formatCurrency(totals.ttc)}</span></div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Créer le BC
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============== WORKFLOW STEPS ==============
const WORKFLOW_STEPS: { key: BCStatut; label: string; icon: typeof CheckCircle2 }[] = [
  { key: "brouillon", label: "Brouillon", icon: Clock },
  { key: "envoye", label: "Envoyé", icon: FileText },
  { key: "accepte", label: "Accepté", icon: CheckCircle2 },
  { key: "en_cours", label: "En cours", icon: Loader2 },
  { key: "cloture", label: "Clôturé", icon: CheckCircle2 },
];

function WorkflowTimeline({ statut }: { statut: BCStatut }) {
  const currentIdx = WORKFLOW_STEPS.findIndex((s) => s.key === statut);
  const isRefused = statut === "refuse";
  const isCancelled = statut === "annule";

  if (isRefused || isCancelled) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        <XCircle className="h-4 w-4" />
        {isRefused ? "BC refusé par le client" : "BC annulé"}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {WORKFLOW_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-center">
            {i > 0 && (
              <div className={`mx-1 h-0.5 w-6 ${done ? "bg-primary" : "bg-border"}`} />
            )}
            <div className="flex flex-col items-center gap-0.5">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground"
              } ${active ? "ring-2 ring-primary/30" : ""}`}>
                <Icon className="h-3 w-3" />
              </div>
              <span className={`text-[9px] leading-none ${done ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============== VIEW DIALOG ==============
function ViewBcDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: bc } = useQuery({
    queryKey: ["bc_detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bons_commande")
        .select("*, clients(raison_sociale, matricule_fiscal, adresse, telephone, email)")
        .eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: lignes = [] } = useQuery({
    queryKey: ["bc_lignes", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("bc_lignes").select("*").eq("bc_id", id).order("ordre");
      if (error) throw error;
      return data;
    },
  });

  const { data: prelevements = [] } = useQuery({
    queryKey: ["bc_prelevements", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prelevements")
        .select("id, numero, statut, denomination, date_prelevement, temperature")
        .eq("client_id", bc?.client_id ?? "")
        .order("date_prelevement", { ascending: false })
        .limit(20);
      if (error) return [];
      return data ?? [];
    },
    enabled: !!bc?.client_id,
  });

  const { data: missions = [] } = useQuery({
    queryKey: ["bc_missions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missions")
        .select("id, numero, date_mission, statut, lieu")
        .eq("bc_id", id)
        .order("date_mission", { ascending: false });
      if (error) return [];
      return data ?? [];
    },
  });

  if (!bc) return null;

  const client = bc.clients as { raison_sociale: string; matricule_fiscal: string | null; adresse: string | null; telephone: string | null; email: string | null } | null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {bc.numero}
            <StatusBadge label={bc.statut as string} tone={statutTone(bc.statut as string)} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Workflow Timeline */}
          <div className="flex justify-center">
            <WorkflowTimeline statut={bc.statut as BCStatut} />
          </div>

          {/* Info Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-md border border-border/60 p-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</h4>
              <p className="text-sm font-medium">{client?.raison_sociale ?? "—"}</p>
              {client?.matricule_fiscal && <p className="text-xs text-muted-foreground">MF: {client.matricule_fiscal}</p>}
              {client?.adresse && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{client.adresse}</p>}
              {client?.telephone && <p className="text-xs text-muted-foreground">Tél: {client.telephone}</p>}
            </div>
            <div className="space-y-2 rounded-md border border-border/60 p-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Détails BC</h4>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="text-muted-foreground">Date BC:</span><span>{formatDate(bc.date_bc)}</span>
                <span className="text-muted-foreground">Réf. client:</span><span>{bc.reference_client || "—"}</span>
                <span className="text-muted-foreground">Code externe:</span><span>{bc.code_externe || "—"}</span>
                {bc.temperature_reception && (
                  <><span className="text-muted-foreground flex items-center gap-1"><Thermometer className="h-3 w-3" />Temp.:</span><span>{bc.temperature_reception}</span></>
                )}
                {bc.date_souhaitee && (
                  <><span className="text-muted-foreground">Date souhaitée:</span><span>{formatDate(bc.date_souhaitee)}</span></>
                )}
              </div>
              {bc.objet && <p className="mt-1 text-xs italic text-muted-foreground">{bc.objet}</p>}
            </div>
          </div>

          {/* Lignes */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lignes ({lignes.length})</h4>
            <div className="rounded-md border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Désignation</TableHead>
                    <TableHead className="w-16 text-right">Qté</TableHead>
                    <TableHead className="w-24 text-right">PU HT</TableHead>
                    <TableHead className="w-16 text-right">Rem%</TableHead>
                    <TableHead className="w-24 text-right">Total HT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm">{l.designation}</TableCell>
                      <TableCell className="text-right tabular-nums">{Number(l.quantite)}</TableCell>
                      <TableCell className="text-right tabular-nums">{Number(l.prix_unitaire).toFixed(3)}</TableCell>
                      <TableCell className="text-right tabular-nums">{Number(l.remise_pct)}%</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{Number(l.total_ht).toFixed(3)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-2 flex justify-end">
              <div className="space-y-0.5 text-right text-xs">
                <div>Total HT: <span className="font-medium tabular-nums">{formatCurrency(bc.total_ht)}</span></div>
                <div>TVA: <span className="tabular-nums">{formatCurrency(bc.total_tva)}</span></div>
                <div className="border-t pt-0.5 text-sm font-semibold">TTC: <span className="tabular-nums">{formatCurrency(bc.total_ttc)}</span></div>
              </div>
            </div>
          </div>

          {/* Missions liées */}
          {missions.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Missions liées ({missions.length})</h4>
              <div className="space-y-1">
                {missions.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-sm border border-border/40 px-3 py-1.5 text-xs">
                    <span className="font-mono font-medium">{m.numero}</span>
                    <span className="text-muted-foreground">{formatDate(m.date_mission)}</span>
                    {m.lieu && <span className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{m.lieu}</span>}
                    <StatusBadge label={m.statut as string} tone={statutTone(m.statut as string)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {bc.notes && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{bc.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
