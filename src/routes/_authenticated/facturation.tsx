import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { EmptyState } from "@/components/lab/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Search, Receipt, FileCode, Loader2, Eye, Trash2, CreditCard, Banknote, Download } from "lucide-react";
import { nextNumero } from "@/lib/numbering";
import { formatCurrency, formatDate } from "@/lib/format";
import { generateFacturePdf } from "@/lib/pdf/facture";
import { generateElfatooraXml, type ElfatooraInvoice } from "@/lib/elfatoora";

export const Route = createFileRoute("/_authenticated/facturation")({
  head: () => ({ meta: [{ title: "Facturation — BALIMS" }] }),
  component: FacturationPage,
});

const STATUT_LABEL: Record<string, string> = {
  brouillon: "Brouillon", emise: "Émise", payee: "Payée", partielle: "Partielle", impayee: "Impayée", annulee: "Annulée",
};
const STATUT_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  brouillon: "outline", emise: "secondary", payee: "default", partielle: "secondary", impayee: "destructive", annulee: "destructive",
};

/* ========== LIGNE FACTURE ========== */
interface LigneFacture {
  reference: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  remise: number;
  tva: number;
}
const emptyLigne = (): LigneFacture => ({ reference: "", designation: "", quantite: 1, prix_unitaire: 0, remise: 0, tva: 19 });
const ligneTotalHT = (l: LigneFacture) => l.quantite * l.prix_unitaire * (1 - l.remise / 100);

function FacturationPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("all");
  const [openNew, setOpenNew] = useState(false);
  const [openReg, setOpenReg] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [tab, setTab] = useState("factures");

  /* ---- Factures ---- */
  const { data: factures = [], isLoading } = useQuery({
    queryKey: ["factures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factures")
        .select("*, clients(raison_sociale, matricule_fiscal, adresse, ville, code_postal)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  /* ---- Règlements ---- */
  const { data: reglements = [] } = useQuery({
    queryKey: ["reglements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reglements")
        .select("*, clients(raison_sociale)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  /* ---- Avoirs ---- */
  const { data: avoirs = [] } = useQuery({
    queryKey: ["avoirs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avoirs")
        .select("*, clients(raison_sociale)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => factures.filter((f: any) => {
    const q = search.toLowerCase();
    const ms = !q || [f.numero, f.clients?.raison_sociale].filter(Boolean).some((s: string) => s.toLowerCase().includes(q));
    return ms && (statutFilter === "all" || f.statut === statutFilter);
  }), [factures, search, statutFilter]);

  const stats = useMemo(() => {
    const ca = factures.filter((f: any) => f.statut === "payee").reduce((s: number, f: any) => s + Number(f.net_a_payer || 0), 0);
    const impayes = factures.filter((f: any) => ["emise", "partielle", "impayee"].includes(f.statut)).reduce((s: number, f: any) => s + Number(f.net_a_payer || 0), 0);
    const totalReglements = reglements.reduce((s: number, r: any) => s + Number(r.montant || 0), 0);
    return { nbFactures: factures.length, ca, impayes, totalReglements };
  }, [factures, reglements]);

  const handlePdfFacture = async (f: any) => {
    try {
      const { data: lignes } = await supabase.from("lignes_facture").select("*").eq("facture_id", f.id).order("ordre");
      const blob = await generateFacturePdf({
        numero: f.numero, date_facture: f.date_facture, date_echeance: f.date_echeance,
        client: { raison_sociale: f.clients?.raison_sociale ?? "", adresse: f.clients?.adresse, matricule_fiscal: f.clients?.matricule_fiscal, code_tva: f.code_tva },
        lignes: (lignes ?? []).map((l: any) => ({ reference: l.reference || "", designation: l.designation || "", quantite: l.quantite, prix_unitaire: Number(l.prix_unitaire), remise: Number(l.remise), tva: Number(l.tva), total_ht: Number(l.total_ht) })),
        total_ht: Number(f.total_ht), total_tva: Number(f.total_tva), total_ttc: Number(f.total_ttc),
        timbre: Number(f.timbre || 1), retenue_source: Number(f.retenue_source || 0), net_a_payer: Number(f.net_a_payer),
        net_a_payer_texte: f.net_a_payer_texte, mode_reglement: f.mode_reglement,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${f.numero}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleElfatoora = async (f: any) => {
    try {
      const { data: soc } = await supabase.from("app_settings").select("settings").eq("category", "societe").maybeSingle();
      const societe = (soc?.settings ?? {}) as any;
      const { data: lignes } = await supabase.from("lignes_facture").select("*").eq("facture_id", f.id).order("ordre");
      const inv: ElfatooraInvoice = {
        numero: f.numero, date_facture: f.date_facture, devise: "TND",
        fournisseur: { raison_sociale: societe.raison_sociale || "BALIMS", matricule_fiscal: societe.matricule_fiscal || "", adresse: societe.adresse, ville: societe.ville },
        client: { raison_sociale: f.clients?.raison_sociale ?? "", matricule_fiscal: f.clients?.matricule_fiscal ?? "", adresse: f.clients?.adresse },
        lignes: (lignes ?? []).map((l: any) => ({ designation: l.designation || "", quantite: l.quantite, prix_unitaire: Number(l.prix_unitaire), tva_pct: Number(l.tva || 19), total_ht: Number(l.total_ht) })),
        total_ht: Number(f.total_ht), total_tva: Number(f.total_tva), total_ttc: Number(f.total_ttc),
        timbre: Number(f.timbre || 1), net_a_payer: Number(f.net_a_payer),
      };
      const xml = generateElfatooraXml(inv);
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${f.numero}-elfatoora.xml`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`XML Elfatoora UBL 2.1 — ${f.numero}`);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Facturation & Finances" description="Factures, règlements, avoirs — TVA 19% / Timbre 1,000 DT" />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-3"><p className="text-[10px] uppercase text-muted-foreground tracking-wider">Factures</p><p className="text-xl font-bold tabular-nums">{stats.nbFactures}</p></CardContent></Card>
          <Card><CardContent className="p-3"><p className="text-[10px] uppercase text-muted-foreground tracking-wider">CA encaissé</p><p className="text-lg font-bold text-primary tabular-nums">{formatCurrency(stats.ca)}</p></CardContent></Card>
          <Card><CardContent className="p-3"><p className="text-[10px] uppercase text-muted-foreground tracking-wider">Impayés</p><p className="text-lg font-bold text-destructive tabular-nums">{formatCurrency(stats.impayes)}</p></CardContent></Card>
          <Card><CardContent className="p-3"><p className="text-[10px] uppercase text-muted-foreground tracking-wider">Règlements</p><p className="text-lg font-bold tabular-nums">{formatCurrency(stats.totalReglements)}</p></CardContent></Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="factures"><Receipt className="h-3.5 w-3.5 mr-1" /> Factures ({factures.length})</TabsTrigger>
            <TabsTrigger value="reglements"><Banknote className="h-3.5 w-3.5 mr-1" /> Règlements ({reglements.length})</TabsTrigger>
            <TabsTrigger value="avoirs"><CreditCard className="h-3.5 w-3.5 mr-1" /> Avoirs ({avoirs.length})</TabsTrigger>
          </TabsList>

          {/* ==== FACTURES ==== */}
          <TabsContent value="factures" className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-8 h-8 text-xs" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={statutFilter} onValueChange={setStatutFilter}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  {Object.entries(STATUT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => setOpenNew(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Nouvelle facture</Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <EmptyState icon={Receipt} title="Aucune facture" description="Créez une facture avec lignes détaillées." action={<Button size="sm" onClick={() => setOpenNew(true)}><Plus className="h-3.5 w-3.5" /> Nouvelle facture</Button>} />
            ) : (
              <div className="rounded-md border border-border/60 bg-card">
                <Table>
                  <TableHeader><TableRow className="text-[11px]">
                    <TableHead>N°</TableHead><TableHead>Date</TableHead><TableHead>Client</TableHead>
                    <TableHead className="text-right">HT</TableHead><TableHead className="text-right">TVA</TableHead>
                    <TableHead className="text-right">Timbre</TableHead><TableHead className="text-right">Net TTC</TableHead>
                    <TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filtered.map((f: any) => (
                      <TableRow key={f.id} className="text-xs">
                        <TableCell className="font-mono font-medium">{f.numero}</TableCell>
                        <TableCell>{formatDate(f.date_facture)}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">{f.clients?.raison_sociale || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(f.total_ht)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(f.total_tva)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{Number(f.timbre || 0).toFixed(3)}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(f.net_a_payer)}</TableCell>
                        <TableCell><Badge variant={STATUT_VARIANT[f.statut] ?? "outline"}>{STATUT_LABEL[f.statut] ?? f.statut}</Badge></TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setViewId(f.id)}><Eye className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => generateXML(f)}><FileCode className="h-3 w-3" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* ==== REGLEMENTS ==== */}
          <TabsContent value="reglements" className="space-y-3">
            <div className="flex justify-end"><Button size="sm" onClick={() => setOpenReg(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Nouveau règlement</Button></div>
            {reglements.length === 0 ? (
              <EmptyState icon={Banknote} title="Aucun règlement" description="Les règlements apparaîtront ici." />
            ) : (
              <div className="rounded-md border border-border/60 bg-card">
                <Table>
                  <TableHeader><TableRow className="text-[11px]">
                    <TableHead>N°</TableHead><TableHead>Date</TableHead><TableHead>Client</TableHead>
                    <TableHead className="text-right">Montant</TableHead><TableHead>Référence</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {reglements.map((r: any) => (
                      <TableRow key={r.id} className="text-xs">
                        <TableCell className="font-mono">{r.numero}</TableCell>
                        <TableCell>{formatDate(r.date_paiement)}</TableCell>
                        <TableCell>{r.clients?.raison_sociale || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(r.montant)}</TableCell>
                        <TableCell className="text-muted-foreground">{r.reference || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* ==== AVOIRS ==== */}
          <TabsContent value="avoirs" className="space-y-3">
            <div className="flex justify-end"><Button size="sm" onClick={() => toast.info("Formulaire avoir — prochainement")}><Plus className="h-3.5 w-3.5 mr-1" /> Nouvel avoir</Button></div>
            {avoirs.length === 0 ? (
              <EmptyState icon={CreditCard} title="Aucun avoir" description="Les notes de crédit apparaîtront ici." />
            ) : (
              <div className="rounded-md border border-border/60 bg-card">
                <Table>
                  <TableHeader><TableRow className="text-[11px]">
                    <TableHead>N°</TableHead><TableHead>Date</TableHead><TableHead>Client</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {avoirs.map((a: any) => (
                      <TableRow key={a.id} className="text-xs">
                        <TableCell className="font-mono">{a.numero}</TableCell>
                        <TableCell>{formatDate(a.date_avoir)}</TableCell>
                        <TableCell>{a.clients?.raison_sociale || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(a.net_a_payer)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {openNew && <NewFactureDialog open={openNew} onClose={() => setOpenNew(false)} />}
      {openReg && <NewReglementDialog open={openReg} onClose={() => setOpenReg(false)} />}
      {viewId && <ViewFactureDialog id={viewId} onClose={() => setViewId(null)} />}
    </div>
  );
}

/* ========== NEW FACTURE ========== */
function NewFactureDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [lignes, setLignes] = useState<LigneFacture[]>([emptyLigne()]);
  const [timbre, setTimbre] = useState(1);
  const [rs, setRs] = useState(0);
  const [saving, setSaving] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-fac"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, raison_sociale, matricule_fiscal, adresse, code_tva").eq("is_active", true).order("raison_sociale");
      return (data ?? []) as any[];
    },
  });

  const addLine = () => setLignes(l => [...l, emptyLigne()]);
  const removeLine = (i: number) => setLignes(l => l.filter((_, idx) => idx !== i));
  const updateLine = (i: number, patch: Partial<LigneFacture>) => setLignes(l => l.map((ln, idx) => idx === i ? { ...ln, ...patch } : ln));

  const totalHT = lignes.reduce((s, l) => s + ligneTotalHT(l), 0);
  const totalTVA = lignes.reduce((s, l) => s + ligneTotalHT(l) * (l.tva / 100), 0);
  const totalTTC = totalHT + totalTVA;
  const netAPayer = totalTTC - rs + timbre;

  const submit = async () => {
    if (!clientId) { toast.error("Sélectionnez un client"); return; }
    if (lignes.every(l => !l.designation.trim())) { toast.error("Ajoutez au moins une ligne"); return; }
    setSaving(true);
    try {
      const numero = await nextNumero("FAC");
      const client = clients.find((c: any) => c.id === clientId);
      const { data: fac, error: e1 } = await supabase.from("factures").insert({
        numero, client_id: clientId,
        adresse: client?.adresse || null,
        code_tva: client?.code_tva || client?.matricule_fiscal || null,
        date_facture: new Date().toISOString().slice(0, 10),
        total_ht: totalHT, total_tva: totalTVA, total_ttc: totalTTC,
        retenue_source: rs, timbre, net_a_payer: netAPayer,
        statut: "brouillon",
      }).select("id").single();
      if (e1) throw e1;

      const validLines = lignes.filter(l => l.designation.trim());
      if (validLines.length > 0) {
        const { error: e2 } = await supabase.from("lignes_facture").insert(
          validLines.map((l, i) => ({
            facture_id: fac.id, ordre: i,
            reference: l.reference || null, designation: l.designation,
            quantite: l.quantite, prix_unitaire: l.prix_unitaire,
            remise: l.remise, tva: l.tva, total_ht: ligneTotalHT(l),
          }))
        );
        if (e2) throw e2;
      }
      toast.success(`Facture ${numero} créée`);
      qc.invalidateQueries({ queryKey: ["factures"] });
      onClose();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nouvelle facture</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.raison_sociale}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Timbre (DT)</Label><Input type="number" className="h-8 text-xs" value={timbre} onChange={e => setTimbre(Number(e.target.value))} /></div>
              <div><Label className="text-xs">Ret. Source (DT)</Label><Input type="number" className="h-8 text-xs" value={rs} onChange={e => setRs(Number(e.target.value))} /></div>
            </div>
          </div>

          {/* Lignes */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs font-semibold">Lignes de facture</Label>
              <Button size="sm" variant="outline" onClick={addLine}><Plus className="h-3 w-3 mr-1" /> Ligne</Button>
            </div>
            <div className="rounded-md border border-border/60">
              <Table>
                <TableHeader><TableRow className="text-[10px]">
                  <TableHead className="w-20">Réf.</TableHead><TableHead>Désignation</TableHead>
                  <TableHead className="w-16">Qté</TableHead><TableHead className="w-24">P.U. (DT)</TableHead>
                  <TableHead className="w-16">Rem.%</TableHead><TableHead className="w-16">TVA%</TableHead>
                  <TableHead className="w-24 text-right">Total HT</TableHead><TableHead className="w-8"></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {lignes.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell><Input className="h-7 text-xs" value={l.reference} onChange={e => updateLine(i, { reference: e.target.value })} /></TableCell>
                      <TableCell><Input className="h-7 text-xs" value={l.designation} onChange={e => updateLine(i, { designation: e.target.value })} /></TableCell>
                      <TableCell><Input type="number" className="h-7 text-xs" value={l.quantite} onChange={e => updateLine(i, { quantite: Number(e.target.value) })} /></TableCell>
                      <TableCell><Input type="number" className="h-7 text-xs" value={l.prix_unitaire} onChange={e => updateLine(i, { prix_unitaire: Number(e.target.value) })} /></TableCell>
                      <TableCell><Input type="number" className="h-7 text-xs" value={l.remise} onChange={e => updateLine(i, { remise: Number(e.target.value) })} /></TableCell>
                      <TableCell><Input type="number" className="h-7 text-xs" value={l.tva} onChange={e => updateLine(i, { tva: Number(e.target.value) })} /></TableCell>
                      <TableCell className="text-right tabular-nums text-xs font-medium">{ligneTotalHT(l).toFixed(3)}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLine(i)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Totaux */}
          <div className="ml-auto w-64 space-y-1 text-xs border-t border-border/60 pt-2">
            <div className="flex justify-between"><span>Total HT</span><span className="tabular-nums font-medium">{totalHT.toFixed(3)} DT</span></div>
            <div className="flex justify-between"><span>TVA</span><span className="tabular-nums">{totalTVA.toFixed(3)} DT</span></div>
            <div className="flex justify-between"><span>Total TTC</span><span className="tabular-nums">{totalTTC.toFixed(3)} DT</span></div>
            <div className="flex justify-between text-muted-foreground"><span>- Ret. Source</span><span className="tabular-nums">{rs.toFixed(3)} DT</span></div>
            <div className="flex justify-between text-muted-foreground"><span>+ Timbre</span><span className="tabular-nums">{timbre.toFixed(3)} DT</span></div>
            <div className="flex justify-between font-bold border-t border-border pt-1"><span>Net à payer</span><span className="tabular-nums">{netAPayer.toFixed(3)} DT</span></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />} Créer la facture</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ========== VIEW FACTURE ========== */
function ViewFactureDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: facture } = useQuery({
    queryKey: ["facture", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("factures").select("*, clients(raison_sociale, matricule_fiscal, adresse)").eq("id", id).single();
      if (error) throw error;
      return data as any;
    },
  });
  const { data: lignes = [] } = useQuery({
    queryKey: ["lignes_facture", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("lignes_facture").select("*").eq("facture_id", id).order("ordre");
      if (error) throw error;
      return data as any[];
    },
  });

  if (!facture) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Facture {facture.numero}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-muted-foreground">Client :</span> <span className="font-medium">{facture.clients?.raison_sociale}</span></div>
            <div><span className="text-muted-foreground">Date :</span> {formatDate(facture.date_facture)}</div>
            <div><span className="text-muted-foreground">Code TVA :</span> {facture.code_tva || "—"}</div>
            <div><span className="text-muted-foreground">Statut :</span> <Badge variant={STATUT_VARIANT[facture.statut]}>{STATUT_LABEL[facture.statut]}</Badge></div>
          </div>
          <div className="rounded-md border border-border/60">
            <Table>
              <TableHeader><TableRow className="text-[10px]">
                <TableHead>Réf.</TableHead><TableHead>Désignation</TableHead><TableHead className="text-right">Qté</TableHead>
                <TableHead className="text-right">P.U.</TableHead><TableHead className="text-right">Rem.%</TableHead>
                <TableHead className="text-right">TVA%</TableHead><TableHead className="text-right">Total HT</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {lignes.map((l: any) => (
                  <TableRow key={l.id} className="text-xs">
                    <TableCell>{l.reference || "—"}</TableCell>
                    <TableCell>{l.designation}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.quantite}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(l.prix_unitaire).toFixed(3)}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(l.remise).toFixed(1)}%</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(l.tva).toFixed(0)}%</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{Number(l.total_ht).toFixed(3)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="ml-auto w-56 space-y-1 text-xs">
            <div className="flex justify-between"><span>Total HT</span><span className="tabular-nums">{Number(facture.total_ht).toFixed(3)}</span></div>
            <div className="flex justify-between"><span>TVA</span><span className="tabular-nums">{Number(facture.total_tva).toFixed(3)}</span></div>
            <div className="flex justify-between"><span>TTC</span><span className="tabular-nums">{Number(facture.total_ttc).toFixed(3)}</span></div>
            <div className="flex justify-between"><span>Timbre</span><span className="tabular-nums">{Number(facture.timbre).toFixed(3)}</span></div>
            <div className="flex justify-between font-bold border-t pt-1"><span>Net à payer</span><span className="tabular-nums">{Number(facture.net_a_payer).toFixed(3)} DT</span></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Fermer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ========== NEW REGLEMENT ========== */
function NewReglementDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [montant, setMontant] = useState<number>(0);
  const [modeReglement, setModeReglement] = useState("virement");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-reg"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, raison_sociale").eq("is_active", true).order("raison_sociale");
      return (data ?? []) as any[];
    },
  });

  const { data: facturesClient = [] } = useQuery({
    queryKey: ["factures-client-reg", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase.from("factures")
        .select("id, numero, net_a_payer, date_facture, statut")
        .eq("client_id", clientId)
        .in("statut", ["emise", "partielle", "impayee"])
        .order("date_facture");
      return (data ?? []) as any[];
    },
  });

  const [selectedFactures, setSelectedFactures] = useState<Set<string>>(new Set());

  const toggleFac = (id: string) => {
    setSelectedFactures(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const submit = async () => {
    if (!clientId) { toast.error("Sélectionnez un client"); return; }
    if (montant <= 0) { toast.error("Montant invalide"); return; }
    setSaving(true);
    try {
      const numero = await nextNumero("REG");
      const { data: reg, error: e1 } = await supabase.from("reglements").insert({
        numero, client_id: clientId, montant,
        reference: reference || null,
        date_paiement: new Date().toISOString().split("T")[0],
      } as any).select("id").single();
      if (e1) throw e1;

      // Link to selected factures
      if (selectedFactures.size > 0) {
        const links = Array.from(selectedFactures).map((facture_id, i) => {
          const fac = facturesClient.find((f: any) => f.id === facture_id);
          return {
            reglement_id: reg.id, facture_id, ordre: i,
            net_a_payer: fac?.net_a_payer ?? 0,
            date_facture: fac?.date_facture ?? null,
          };
        });
        await supabase.from("lignes_reglement").insert(links);

        // Update facture payment status
        for (const fid of selectedFactures) {
          await supabase.from("factures").update({
            payment_status: "paye", statut: "payee",
            date_reglement: new Date().toISOString().split("T")[0],
          }).eq("id", fid);
        }
      }

      toast.success(`Règlement ${numero} enregistré`);
      qc.invalidateQueries({ queryKey: ["reglements"] });
      qc.invalidateQueries({ queryKey: ["factures"] });
      onClose();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nouveau règlement</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Client *</Label>
              <Select value={clientId} onValueChange={(v) => { setClientId(v); setSelectedFactures(new Set()); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.raison_sociale}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Mode de règlement</Label>
              <Select value={modeReglement} onValueChange={setModeReglement}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="virement">Virement</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="traite">Traite</SelectItem>
                  <SelectItem value="carte">Carte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Montant (DT) *</Label>
              <Input type="number" step="0.001" className="h-8 text-xs" value={montant} onChange={e => setMontant(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs">Référence (chèque/virement)</Label>
              <Input className="h-8 text-xs" value={reference} onChange={e => setReference(e.target.value)} maxLength={100} />
            </div>
          </div>

          {clientId && facturesClient.length > 0 && (
            <div>
              <Label className="text-xs font-semibold">Factures à régler</Label>
              <div className="mt-1 rounded-md border border-border/60 max-h-48 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow className="text-[10px]">
                    <TableHead className="w-10"></TableHead><TableHead>N°</TableHead>
                    <TableHead>Date</TableHead><TableHead className="text-right">Net à payer</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {facturesClient.map((f: any) => (
                      <TableRow key={f.id} className="text-xs cursor-pointer hover:bg-muted/30" onClick={() => toggleFac(f.id)}>
                        <TableCell>
                          <input type="checkbox" checked={selectedFactures.has(f.id)} onChange={() => toggleFac(f.id)} className="accent-primary" />
                        </TableCell>
                        <TableCell className="font-mono">{f.numero}</TableCell>
                        <TableCell>{formatDate(f.date_facture)}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{Number(f.net_a_payer).toFixed(3)} DT</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />} Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
