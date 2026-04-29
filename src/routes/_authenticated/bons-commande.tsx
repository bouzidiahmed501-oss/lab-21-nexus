import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, FileText, Trash2, Download, Eye } from "lucide-react";
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

// ============== VIEW DIALOG ==============
function ViewBcDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: lignes = [] } = useQuery({
    queryKey: ["bc_lignes", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("bc_lignes").select("*").eq("bc_id", id).order("ordre");
      if (error) throw error;
      return data;
    },
  });
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle><FileText className="inline h-4 w-4" /> Lignes du BC</DialogTitle></DialogHeader>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Désignation</TableHead><TableHead className="text-right">Qté</TableHead><TableHead className="text-right">PU</TableHead><TableHead className="text-right">Total HT</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {lignes.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{l.designation}</TableCell>
                <TableCell className="text-right">{Number(l.quantite)}</TableCell>
                <TableCell className="text-right">{Number(l.prix_unitaire).toFixed(3)}</TableCell>
                <TableCell className="text-right font-medium">{Number(l.total_ht).toFixed(3)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
