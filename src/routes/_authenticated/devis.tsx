import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Download, Eye, ArrowRightLeft, Copy } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { nextNumero } from "@/lib/numbering";
import { formatCurrency, formatDate } from "@/lib/format";
import { generateDevisPdf } from "@/lib/pdf/devis";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/devis")({
  head: () => ({ meta: [{ title: "Devis — BALIMS" }] }),
  component: DevisPage,
});

const STATUTS = ["brouillon", "envoye", "accepte", "refuse", "expire", "converti"] as const;
type DevisStatut = (typeof STATUTS)[number];

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

interface DevisRow {
  id: string;
  numero: string;
  client_id: string;
  date_devis: string;
  validite_jours: number;
  statut: DevisStatut;
  reference_client: string | null;
  objet: string | null;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  bc_id: string | null;
  clients: { raison_sociale: string; matricule_fiscal: string | null; adresse: string | null } | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

function DevisPage() {
  const qc = useQueryClient();
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["devis"],
    queryFn: async () => {
      const { data, error } = await sb.from("devis")
        .select("*, clients(raison_sociale, matricule_fiscal, adresse)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as DevisRow[];
    },
  });

  const filtered = useMemo(
    () => (statutFilter === "all" ? rows : rows.filter((r) => r.statut === statutFilter)),
    [rows, statutFilter],
  );

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: DevisStatut }) => {
      const { error } = await sb.from("devis").update({ statut }).eq("id", id);
      if (error) throw error;
      await logAudit({ action: "status_change", entity_type: "devis", entity_id: id, details: { statut } });
    },
    onSuccess: () => { toast.success("Statut mis à jour"); qc.invalidateQueries({ queryKey: ["devis"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const convertToBc = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await sb.rpc("convert_devis_to_bc", { _devis_id: id });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (bcId) => {
      toast.success("Devis converti en bon de commande");
      qc.invalidateQueries({ queryKey: ["devis"] });
      qc.invalidateQueries({ queryKey: ["bons_commande"] });
      logAudit({ action: "create", entity_type: "bons_commande", entity_id: bcId, details: { source: "devis" } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("devis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Devis supprimé"); qc.invalidateQueries({ queryKey: ["devis"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicate = useMutation({
    mutationFn: async (id: string) => {
      const { data: src, error: e1 } = await sb.from("devis")
        .select("*").eq("id", id).single();
      if (e1) throw e1;
      const { data: lignes, error: e2 } = await sb.from("devis_lignes")
        .select("*").eq("devis_id", id).order("ordre");
      if (e2) throw e2;
      const numero = await nextNumero("DEV");
      const { data: nd, error: e3 } = await sb.from("devis").insert({
        numero, client_id: src.client_id, date_devis: new Date().toISOString().slice(0, 10),
        validite_jours: src.validite_jours, statut: "brouillon",
        objet: src.objet, reference_client: src.reference_client, conditions: src.conditions, notes: src.notes,
        total_ht: src.total_ht, total_tva: src.total_tva, total_ttc: src.total_ttc, remise_pct: src.remise_pct,
      }).select("id").single();
      if (e3) throw e3;
      if ((lignes ?? []).length) {
        const { error: e4 } = await sb.from("devis_lignes").insert(
          (lignes as never[]).map((l: never) => {
            const x = l as { ordre: number; designation: string; parametre_id: string | null; produit_id: string | null; quantite: number; prix_unitaire: number; remise_pct: number; tva_pct: number; total_ht: number };
            return { devis_id: (nd as { id: string }).id, ordre: x.ordre, designation: x.designation, parametre_id: x.parametre_id, produit_id: x.produit_id, quantite: x.quantite, prix_unitaire: x.prix_unitaire, remise_pct: x.remise_pct, tva_pct: x.tva_pct, total_ht: x.total_ht };
          }),
        );
        if (e4) throw e4;
      }
    },
    onSuccess: () => { toast.success("Devis dupliqué"); qc.invalidateQueries({ queryKey: ["devis"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const handlePdf = async (d: DevisRow) => {
    try {
      const { data: lignes, error } = await sb.from("devis_lignes")
        .select("*").eq("devis_id", d.id).order("ordre");
      if (error) throw error;
      const blob = await generateDevisPdf({
        numero: d.numero, date_devis: d.date_devis, validite_jours: d.validite_jours,
        client: {
          raison_sociale: d.clients?.raison_sociale ?? "",
          adresse: d.clients?.adresse ?? undefined,
          matricule_fiscal: d.clients?.matricule_fiscal ?? undefined,
        },
        reference_client: d.reference_client, objet: d.objet,
        lignes: ((lignes ?? []) as never[]).map((l: never) => {
          const x = l as { designation: string; quantite: number; prix_unitaire: number; remise_pct: number; tva_pct: number; total_ht: number };
          return { designation: x.designation, quantite: Number(x.quantite), prix_unitaire: Number(x.prix_unitaire), remise_pct: Number(x.remise_pct), tva_pct: Number(x.tva_pct), total_ht: Number(x.total_ht) };
        }),
        total_ht: Number(d.total_ht), total_tva: Number(d.total_tva), total_ttc: Number(d.total_ttc),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${d.numero}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur PDF");
    }
  };

  const columns: Column<DevisRow>[] = [
    { key: "numero", header: "N°", cell: (r) => <span className="text-numeric font-medium">{r.numero}</span>, width: "140px" },
    { key: "date_devis", header: "Date", cell: (r) => <span className="text-numeric">{formatDate(r.date_devis)}</span>, accessor: (r) => r.date_devis, width: "110px" },
    { key: "validite", header: "Validité", accessor: (r) => r.validite_jours, cell: (r) => <span className="text-xs">{r.validite_jours}j</span>, width: "80px" },
    { key: "client", header: "Client", accessor: (r) => r.clients?.raison_sociale ?? "", cell: (r) => r.clients?.raison_sociale ?? "—" },
    { key: "objet", header: "Objet", cell: (r) => <span className="truncate text-muted-foreground">{r.objet || "—"}</span> },
    { key: "total_ttc", header: "Total TTC", align: "right", cell: (r) => <span className="font-medium">{formatCurrency(r.total_ttc)}</span>, accessor: (r) => Number(r.total_ttc), width: "130px" },
    {
      key: "statut", header: "Statut", align: "center", width: "150px",
      cell: (r) => (
        <Select value={r.statut} onValueChange={(v) => updateStatut.mutate({ id: r.id, statut: v as DevisStatut })}>
          <SelectTrigger className="h-7 border-0 bg-transparent p-0 hover:bg-transparent" onClick={(e) => e.stopPropagation()}>
            <StatusBadge label={r.statut} tone={statutTone(r.statut)} />
          </SelectTrigger>
          <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      ),
    },
    {
      key: "actions", header: "", align: "right", sortable: false, width: "170px",
      cell: (r) => (
        <div className="flex justify-end gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setViewingId(r.id); }} title="Voir">
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handlePdf(r); }} title="PDF">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); duplicate.mutate(r.id); }} title="Dupliquer">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            disabled={!!r.bc_id || r.statut === "refuse" || r.statut === "expire"}
            onClick={(e) => { e.stopPropagation(); if (confirm("Convertir ce devis en bon de commande ?")) convertToBc.mutate(r.id); }}
            title={r.bc_id ? "Déjà converti" : "Convertir en BC"}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm("Supprimer ce devis ?")) remove.mutate(r.id); }} title="Supprimer">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Devis"
        description="Création et suivi des devis commerciaux. Conversion en bon de commande en un clic."
        badge={<StatusBadge label={`${rows.length}`} tone="info" dot={false} />}
        actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Nouveau devis</Button>}
      />

      <div className="space-y-3 p-4">
        <DataTable
          data={filtered}
          columns={columns}
          loading={isLoading}
          rowKey={(r) => r.id}
          searchableKeys={["numero", "reference_client", "objet"]}
          searchPlaceholder="Rechercher (n°, réf, objet…)"
          exportFilename="devis"
          emptyMessage="Aucun devis."
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

      <NewDevisDialog open={open} onClose={() => setOpen(false)} />
      {viewingId && <ViewDevisDialog id={viewingId} onClose={() => setViewingId(null)} />}
    </div>
  );
}

function NewDevisDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [refClient, setRefClient] = useState("");
  const [objet, setObjet] = useState("");
  const [conditions, setConditions] = useState("");
  const [dateDevis, setDateDevis] = useState(() => new Date().toISOString().split("T")[0]);
  const [validite, setValidite] = useState(30);
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

  const updateLigne = (i: number, patch: Partial<Ligne>) =>
    setLignes((arr) => arr.map((l, idx) => (idx === i ? recalc({ ...l, ...patch }) : l)));
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
      const numero = await nextNumero("DEV");
      const { data: d, error: e1 } = await sb.from("devis").insert({
        numero, client_id: clientId, date_devis: dateDevis, validite_jours: validite, statut: "brouillon",
        reference_client: refClient || null, objet: objet || null, conditions: conditions || null,
        total_ht: totals.ht, total_tva: totals.tva, total_ttc: totals.ttc,
      }).select("id").single();
      if (e1) throw e1;
      const { error: e2 } = await sb.from("devis_lignes").insert(
        validLignes.map((l, idx) => ({
          devis_id: (d as { id: string }).id, parametre_id: l.parametre_id || null,
          designation: l.designation, quantite: l.quantite, prix_unitaire: l.prix_unitaire,
          remise_pct: l.remise_pct, tva_pct: l.tva_pct, total_ht: l.total_ht, ordre: idx,
        })),
      );
      if (e2) throw e2;
      await logAudit({ action: "create", entity_type: "devis", entity_id: (d as { id: string }).id });
    },
    onSuccess: () => {
      toast.success("Devis créé");
      qc.invalidateQueries({ queryKey: ["devis"] });
      setClientId(""); setRefClient(""); setObjet(""); setConditions("");
      setLignes([{ designation: "", quantite: 1, prix_unitaire: 0, remise_pct: 0, tva_pct: 19, total_ht: 0 }]);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader><DialogTitle>Nouveau devis</DialogTitle></DialogHeader>
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
              <Label>Date</Label>
              <Input type="date" value={dateDevis} onChange={(e) => setDateDevis(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Validité (jours)</Label>
              <Input type="number" min={1} value={validite} onChange={(e) => setValidite(Number(e.target.value) || 30)} />
            </div>
            <div className="space-y-2">
              <Label>Référence client</Label>
              <Input value={refClient} onChange={(e) => setRefClient(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-2 md:col-span-2">
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
                      <TableCell><Input className="h-8" value={l.designation} onChange={(e) => updateLigne(i, { designation: e.target.value })} /></TableCell>
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
            <div className="flex justify-end gap-6 pt-2 text-sm">
              <span>HT : <strong>{totals.ht.toFixed(3)}</strong></span>
              <span>TVA : <strong>{totals.tva.toFixed(3)}</strong></span>
              <span className="text-base">TTC : <strong>{totals.ttc.toFixed(3)} TND</strong></span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Conditions / notes</Label>
            <Textarea value={conditions} onChange={(e) => setConditions(e.target.value)} rows={3} maxLength={2000} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={create.isPending}>{create.isPending ? "Création…" : "Créer le devis"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ViewDevisDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["devis", id],
    queryFn: async () => {
      const { data: d, error } = await sb.from("devis")
        .select("*, clients(raison_sociale, adresse, matricule_fiscal)")
        .eq("id", id).single();
      if (error) throw error;
      const { data: lignes } = await sb.from("devis_lignes")
        .select("*").eq("devis_id", id).order("ordre");
      return { devis: d as DevisRow, lignes: (lignes ?? []) as Ligne[] };
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Devis {data?.devis?.numero ?? ""}</DialogTitle></DialogHeader>
        {isLoading || !data ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Chargement…</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Client : </span>{data.devis.clients?.raison_sociale ?? "—"}</div>
              <div><span className="text-muted-foreground">Date : </span>{formatDate(data.devis.date_devis)}</div>
              <div><span className="text-muted-foreground">Validité : </span>{data.devis.validite_jours} jours</div>
              <div><span className="text-muted-foreground">Statut : </span><StatusBadge label={data.devis.statut} tone={statutTone(data.devis.statut)} /></div>
              {data.devis.objet && <div className="col-span-2"><span className="text-muted-foreground">Objet : </span>{data.devis.objet}</div>}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Désignation</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead className="text-right">PU HT</TableHead>
                  <TableHead className="text-right">Total HT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.lignes.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell>{l.designation}</TableCell>
                    <TableCell className="text-right">{Number(l.quantite)}</TableCell>
                    <TableCell className="text-right">{Number(l.prix_unitaire).toFixed(3)}</TableCell>
                    <TableCell className="text-right font-medium">{Number(l.total_ht).toFixed(3)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end gap-6 text-sm">
              <span>HT : <strong>{Number(data.devis.total_ht).toFixed(3)}</strong></span>
              <span>TVA : <strong>{Number(data.devis.total_tva).toFixed(3)}</strong></span>
              <span className="text-base">TTC : <strong>{formatCurrency(data.devis.total_ttc)}</strong></span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
