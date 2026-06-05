import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { EmptyState } from "@/components/lab/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Search, CreditCard, Loader2, Trash2 } from "lucide-react";
import { nextNumero } from "@/lib/numbering";
import { formatCurrency, formatDate } from "@/lib/format";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/reglements")({
  head: () => ({ meta: [{ title: "Règlements — BALIMS" }] }),
  component: ReglementsPage,
});

function ReglementsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);

  const { data: reglements = [], isLoading } = useQuery({
    queryKey: ["reglements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reglements")
        .select("*, client:clients(raison_sociale), mode:modes_reglement(libelle)")
        .order("date_paiement", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-lite"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, raison_sociale").order("raison_sociale");
      return data ?? [];
    },
  });

  const { data: modes = [] } = useQuery({
    queryKey: ["modes-reglement"],
    queryFn: async () => {
      const { data } = await supabase.from("modes_reglement").select("id, libelle").order("libelle");
      return data ?? [];
    },
  });

  const filtered = useMemo(
    () =>
      reglements.filter((r: any) =>
        !search ||
        r.numero?.toLowerCase().includes(search.toLowerCase()) ||
        r.client?.raison_sociale?.toLowerCase().includes(search.toLowerCase()) ||
        r.reference?.toLowerCase().includes(search.toLowerCase()),
      ),
    [reglements, search],
  );

  const [form, setForm] = useState({
    client_id: "",
    mode_reglement_id: "",
    montant: 0,
    reference: "",
    etablissement_payeur: "",
    payeur: "",
    date_paiement: new Date().toISOString().slice(0, 10),
    date_versement: "",
    date_effective: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.client_id) throw new Error("Client obligatoire");
      if (!form.montant || form.montant <= 0) throw new Error("Montant requis");
      const numero = await nextNumero("REG");
      const { data, error } = await supabase
        .from("reglements")
        .insert({
          numero,
          client_id: form.client_id,
          mode_reglement_id: form.mode_reglement_id || null,
          montant: form.montant,
          reference: form.reference || null,
          etablissement_payeur: form.etablissement_payeur || null,
          payeur: form.payeur || null,
          date_paiement: form.date_paiement || null,
          date_versement: form.date_versement || null,
          date_effective: form.date_effective || null,
        } as never)
        .select("id")
        .single();
      if (error) throw error;
      await logAudit({ action: "create", entity_type: "reglement", entity_id: (data as any).id, details: { numero, montant: form.montant } });
      return numero;
    },
    onSuccess: (numero) => {
      toast.success(`Règlement ${numero} enregistré`);
      setOpenNew(false);
      setForm({ client_id: "", mode_reglement_id: "", montant: 0, reference: "", etablissement_payeur: "", payeur: "", date_paiement: new Date().toISOString().slice(0, 10), date_versement: "", date_effective: "" });
      qc.invalidateQueries({ queryKey: ["reglements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reglements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Règlement supprimé");
      qc.invalidateQueries({ queryKey: ["reglements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const totalEncaisse = filtered.reduce((s: number, r: any) => s + Number(r.montant ?? 0), 0);

  return (
    <div className="px-8 py-6">
      <PageHeader
        title="Règlements"
        description="Encaissements clients (chèque, virement, espèces, traite)."
        actions={
          <Button onClick={() => setOpenNew(true)} size="sm">
            <Plus className="mr-1 h-4 w-4" /> Nouveau règlement
          </Button>
        }
      />

      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="rounded-md bg-muted px-3 py-2 text-sm">
              Total : <span className="font-bold">{formatCurrency(totalEncaisse)}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={CreditCard} title="Aucun règlement" description="Enregistrez votre premier encaissement." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.numero}</TableCell>
                    <TableCell>{r.date_paiement ? formatDate(r.date_paiement) : "—"}</TableCell>
                    <TableCell>{r.client?.raison_sociale ?? "—"}</TableCell>
                    <TableCell>{r.mode?.libelle ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.reference ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(r.montant)}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Supprimer ${r.numero} ?`)) del.mutate(r.id); }}>
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

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nouveau règlement</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Client *</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.raison_sociale}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mode de règlement</Label>
              <Select value={form.mode_reglement_id} onValueChange={(v) => setForm({ ...form, mode_reglement_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {modes.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.libelle}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Montant *</Label>
              <Input type="number" step="0.001" value={form.montant} onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Référence (chèque/virement)</Label>
              <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            </div>
            <div>
              <Label>Payeur</Label>
              <Input value={form.payeur} onChange={(e) => setForm({ ...form, payeur: e.target.value })} />
            </div>
            <div>
              <Label>Établissement</Label>
              <Input value={form.etablissement_payeur} onChange={(e) => setForm({ ...form, etablissement_payeur: e.target.value })} />
            </div>
            <div>
              <Label>Date paiement</Label>
              <Input type="date" value={form.date_paiement} onChange={(e) => setForm({ ...form, date_paiement: e.target.value })} />
            </div>
            <div>
              <Label>Date versement</Label>
              <Input type="date" value={form.date_versement} onChange={(e) => setForm({ ...form, date_versement: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Date effective (encaissement réel)</Label>
              <Input type="date" value={form.date_effective} onChange={(e) => setForm({ ...form, date_effective: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Annuler</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
