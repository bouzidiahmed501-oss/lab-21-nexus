import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { EmptyState } from "@/components/lab/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Search, Wallet, Loader2, Trash2 } from "lucide-react";
import { nextNumero } from "@/lib/numbering";
import { formatCurrency, formatDate } from "@/lib/format";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/depenses")({
  head: () => ({ meta: [{ title: "Dépenses — BALIMS" }] }),
  component: DepensesPage,
});

const CATEGORIES = ["Achats consommables", "Carburant", "Loyer", "Salaires", "Maintenance", "Honoraires", "Frais bancaires", "Télécommunications", "Fournitures bureau", "Transport", "Hébergement", "Autres"];
const MODES = ["Espèces", "Chèque", "Virement", "Carte bancaire", "Traite", "Prélèvement"];

function DepensesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["depenses"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("depenses" as never) as any)
        .select("*").order("date_depense", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => items.filter((d: any) =>
    !search || d.numero?.toLowerCase().includes(search.toLowerCase()) ||
    d.libelle?.toLowerCase().includes(search.toLowerCase()) ||
    d.categorie?.toLowerCase().includes(search.toLowerCase())
  ), [items, search]);

  const [form, setForm] = useState({
    date_depense: new Date().toISOString().slice(0, 10),
    categorie: "Achats consommables",
    libelle: "",
    montant_ht: 0,
    tva_pct: 19,
    beneficiaire: "",
    mode_paiement: "Espèces",
    reference_piece: "",
    notes: "",
  });

  const totalTTC = useMemo(() => form.montant_ht * (1 + form.tva_pct / 100), [form.montant_ht, form.tva_pct]);

  const createMut = useMutation({
    mutationFn: async () => {
      const numero = await nextNumero("DEP");
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        ...form,
        numero,
        montant_ttc: totalTTC,
        created_by: user?.id ?? null,
      };
      const { data, error } = await (supabase.from("depenses" as never) as any).insert(payload).select().single();
      if (error) throw error;
      await logAudit({ action: "create", entity_type: "depense", entity_id: data.id, details: { numero, montant: totalTTC } });
      return data;
    },
    onSuccess: () => {
      toast.success("Dépense enregistrée");
      qc.invalidateQueries({ queryKey: ["depenses"] });
      setOpen(false);
      setForm({ ...form, libelle: "", montant_ht: 0, beneficiaire: "", reference_piece: "", notes: "" });
    },
    onError: (e: any) => toast.error(e.message ?? "Erreur"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("depenses" as never) as any).delete().eq("id", id);
      if (error) throw error;
      await logAudit({ action: "delete", entity_type: "depense", entity_id: id });
    },
    onSuccess: () => { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["depenses"] }); },
    onError: (e: any) => toast.error(e.message ?? "Erreur"),
  });

  const totalPeriode = useMemo(() => filtered.reduce((s: number, d: any) => s + Number(d.montant_ttc ?? 0), 0), [filtered]);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Dépenses"
        description={`${filtered.length} dépense(s) — Total : ${formatCurrency(totalPeriode)}`}
        actions={<Button onClick={() => setOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" />Nouvelle dépense</Button>}
      />
      <div className="p-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
            </div>
            {isLoading ? (
              <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
            ) : filtered.length === 0 ? (
              <EmptyState icon={Wallet} title="Aucune dépense" description="Commencez par enregistrer une dépense." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead><TableHead>Date</TableHead><TableHead>Catégorie</TableHead>
                    <TableHead>Libellé</TableHead><TableHead>Bénéficiaire</TableHead>
                    <TableHead className="text-right">HT</TableHead><TableHead className="text-right">TTC</TableHead>
                    <TableHead>Mode</TableHead><TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.numero}</TableCell>
                      <TableCell>{formatDate(d.date_depense)}</TableCell>
                      <TableCell>{d.categorie}</TableCell>
                      <TableCell className="max-w-xs truncate">{d.libelle}</TableCell>
                      <TableCell>{d.beneficiaire}</TableCell>
                      <TableCell className="text-right">{formatCurrency(d.montant_ht)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(d.montant_ttc)}</TableCell>
                      <TableCell className="text-xs">{d.mode_paiement}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Supprimer ?")) deleteMut.mutate(d.id); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouvelle dépense</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date</Label><Input type="date" value={form.date_depense} onChange={(e) => setForm({ ...form, date_depense: e.target.value })} /></div>
            <div><Label>Catégorie</Label>
              <Select value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Libellé *</Label><Input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} /></div>
            <div><Label>Bénéficiaire</Label><Input value={form.beneficiaire} onChange={(e) => setForm({ ...form, beneficiaire: e.target.value })} /></div>
            <div><Label>Référence pièce</Label><Input value={form.reference_piece} onChange={(e) => setForm({ ...form, reference_piece: e.target.value })} /></div>
            <div><Label>Montant HT</Label><Input type="number" step="0.001" value={form.montant_ht} onChange={(e) => setForm({ ...form, montant_ht: Number(e.target.value) })} /></div>
            <div><Label>TVA %</Label><Input type="number" step="0.1" value={form.tva_pct} onChange={(e) => setForm({ ...form, tva_pct: Number(e.target.value) })} /></div>
            <div><Label>Mode de paiement</Label>
              <Select value={form.mode_paiement} onValueChange={(v) => setForm({ ...form, mode_paiement: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Montant TTC (calculé)</Label><Input value={formatCurrency(totalTTC)} disabled /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={() => createMut.mutate()} disabled={!form.libelle || createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
