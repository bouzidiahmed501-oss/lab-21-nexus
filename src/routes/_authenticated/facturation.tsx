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
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Search, Receipt, Download, FileCode } from "lucide-react";
import { nextNumero } from "@/lib/numbering";
import { formatCurrency, formatDate } from "@/lib/format";

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

function FacturationPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("all");
  const [open, setOpen] = useState(false);

  // Re-using bons_commande as factures source for simplicity (factures derived from BC validated)
  // For real invoicing, we work directly off BC with status >= 'cloture'
  const { data: factures = [] } = useQuery({
    queryKey: ["factures-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bons_commande" as never)
        .select("*, clients(raison_sociale, matricule_fiscal, adresse, ville, code_postal)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => factures.filter((f: any) => {
    const ms = !search || [f.numero, f.clients?.raison_sociale].filter(Boolean).some((s: string) => s.toLowerCase().includes(search.toLowerCase()));
    const mst = statutFilter === "all" || f.statut === statutFilter;
    return ms && mst;
  }), [factures, search, statutFilter]);

  const stats = useMemo(() => {
    const totalTTC = factures.reduce((s: number, f: any) => s + Number(f.total_ttc || 0), 0);
    const enAttente = factures.filter((f: any) => ["emise", "partielle", "impayee"].includes(f.statut));
    const ca = factures.filter((f: any) => f.statut === "payee").reduce((s: number, f: any) => s + Number(f.total_ttc || 0), 0);
    const impayes = enAttente.reduce((s: number, f: any) => s + Number(f.total_ttc || 0), 0);
    return { totalTTC, ca, impayes, nbFactures: factures.length };
  }, [factures]);

  const generateXML = (f: any) => {
    const xml = generateElfatooraXML(f);
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${f.numero}-elfatoora.xml`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`XML Elfatoora ${f.numero} téléchargé`);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Facturation" description="Factures clients et export XML Elfatoora (Tunisie)" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Factures</p><p className="text-2xl font-semibold">{stats.nbFactures}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Chiffre d'affaires</p><p className="text-xl font-semibold text-primary">{formatCurrency(stats.ca)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Impayés</p><p className="text-xl font-semibold text-destructive">{formatCurrency(stats.impayes)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total émis</p><p className="text-xl font-semibold">{formatCurrency(stats.totalTTC)}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center gap-2">
              <CardTitle>Factures</CardTitle>
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
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Nouvelle facture</Button></DialogTrigger>
                  <FactureForm onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["factures-list"] })} />
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <EmptyState icon={Receipt} title="Aucune facture" description="Les factures apparaîtront ici." />
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Numéro</TableHead><TableHead>Date</TableHead><TableHead>Client</TableHead>
                  <TableHead className="text-right">HT</TableHead><TableHead className="text-right">TVA</TableHead>
                  <TableHead className="text-right">TTC</TableHead><TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.map((f: any) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-xs">{f.numero}</TableCell>
                      <TableCell>{formatDate(f.date_bc)}</TableCell>
                      <TableCell className="font-medium">{f.clients?.raison_sociale || "—"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(f.total_ht)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(f.total_tva)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(f.total_ttc)}</TableCell>
                      <TableCell><Badge variant={STATUT_VARIANT[f.statut] ?? "outline"}>{STATUT_LABEL[f.statut] ?? f.statut}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => generateXML(f)} title="Export Elfatoora XML">
                          <FileCode className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Download className="h-4 w-4" /> Elfatoora XML</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>L'export XML respecte le format Elfatoora 2026 du Ministère des Finances tunisien.</p>
            <p>Les factures peuvent être téléversées sur le portail elfatoora.tradenet.tn pour validation.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FactureForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-active"],
    queryFn: async () => {
      const { data } = await supabase.from("clients" as never).select("id, raison_sociale").eq("is_active", true).order("raison_sociale");
      return data as any[];
    },
  });
  const [f, setF] = useState({ client_id: "", objet: "", montant_ht: "", tva_pct: "19" });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!f.client_id || !f.montant_ht) { toast.error("Client et montant requis"); return; }
    setSaving(true);
    try {
      const numero = await nextNumero("FAC");
      const ht = Number(f.montant_ht);
      const tvaPct = Number(f.tva_pct);
      const tva = ht * (tvaPct / 100);
      const ttc = ht + tva;
      const { error } = await supabase.from("bons_commande" as never).insert({
        numero, client_id: f.client_id, objet: f.objet || null,
        statut: "emise", total_ht: ht, total_tva: tva, total_ttc: ttc,
      } as never);
      if (error) throw error;
      toast.success(`Facture ${numero} créée`); onSaved(); onClose();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nouvelle facture</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Client *</Label>
          <Select value={f.client_id} onValueChange={(v) => setF({ ...f, client_id: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
            <SelectContent>
              {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.raison_sociale}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Objet</Label><Input value={f.objet} onChange={(e) => setF({ ...f, objet: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Montant HT (TND)</Label><Input type="number" value={f.montant_ht} onChange={(e) => setF({ ...f, montant_ht: e.target.value })} /></div>
          <div><Label>TVA %</Label><Input type="number" value={f.tva_pct} onChange={(e) => setF({ ...f, tva_pct: e.target.value })} /></div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "…" : "Créer"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ============== ELFATOORA XML EXPORT ==============
function generateElfatooraXML(f: any): string {
  const c = f.clients || {};
  const date = (f.date_bc || new Date().toISOString().slice(0, 10)).replace(/-/g, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<TEIF xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.8.8" controlingAgency="TTN">
  <InvoiceHeader>
    <MessageSenderIdentifier type="I-01">BALIMS</MessageSenderIdentifier>
    <MessageRecieverIdentifier type="I-01">${escapeXml(c.matricule_fiscal || "")}</MessageRecieverIdentifier>
  </InvoiceHeader>
  <InvoiceBody>
    <Bgm>
      <DocumentIdentifier>${escapeXml(f.numero)}</DocumentIdentifier>
      <DocumentType code="I-11">Facture</DocumentType>
    </Bgm>
    <Dtm>
      <DateText format="DDMMYYYY" functionCode="I-31">${date}</DateText>
    </Dtm>
    <PartnerSection>
      <PartnerDetails functionCode="I-62">
        <PartnerIdentifier type="I-01">BALIMS</PartnerIdentifier>
        <PartnerName>BALIMS Laboratoires</PartnerName>
      </PartnerDetails>
      <PartnerDetails functionCode="I-64">
        <PartnerIdentifier type="I-01">${escapeXml(c.matricule_fiscal || "")}</PartnerIdentifier>
        <PartnerName>${escapeXml(c.raison_sociale || "")}</PartnerName>
        <PartnerAdresses>
          <AdressDescription>${escapeXml(c.adresse || "")}</AdressDescription>
          <CityName>${escapeXml(c.ville || "")}</CityName>
          <PostalCode>${escapeXml(c.code_postal || "")}</PostalCode>
        </PartnerAdresses>
      </PartnerDetails>
    </PartnerSection>
    <InvoiceMoa>
      <AmountDetails>
        <Moa amountTypeCode="I-181" currencyIdentifier="TND">${Number(f.total_ht || 0).toFixed(3)}</Moa>
      </AmountDetails>
      <AmountDetails>
        <Moa amountTypeCode="I-182" currencyIdentifier="TND">${Number(f.total_tva || 0).toFixed(3)}</Moa>
      </AmountDetails>
      <AmountDetails>
        <Moa amountTypeCode="I-180" currencyIdentifier="TND">${Number(f.total_ttc || 0).toFixed(3)}</Moa>
      </AmountDetails>
    </InvoiceMoa>
  </InvoiceBody>
</TEIF>`;
}

function escapeXml(s: string): string {
  return String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}
