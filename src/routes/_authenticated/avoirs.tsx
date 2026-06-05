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
import { Plus, Search, FileMinus, Loader2, Trash2 } from "lucide-react";
import { nextNumero } from "@/lib/numbering";
import { formatCurrency, formatDate } from "@/lib/format";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/avoirs")({
  head: () => ({ meta: [{ title: "Avoirs — BALIMS" }] }),
  component: AvoirsPage,
});

interface LigneAvoir {
  designation: string;
  quantite: number;
  prix_unitaire: number;
  tva: number;
}
const emptyLigne = (): LigneAvoir => ({ designation: "", quantite: 1, prix_unitaire: 0, tva: 19 });

function AvoirsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);

  const { data: avoirs = [], isLoading } = useQuery({
    queryKey: ["avoirs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avoirs")
        .select("*, client:clients(raison_sociale)")
        .order("date_avoir", { ascending: false });
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

  const filtered = useMemo(
    () =>
      avoirs.filter((a: any) =>
        !search ||
        a.numero?.toLowerCase().includes(search.toLowerCase()) ||
        a.client?.raison_sociale?.toLowerCase().includes(search.toLowerCase()),
      ),
    [avoirs, search],
  );

  const [form, setForm] = useState({
    client_id: "",
    date_avoir: new Date().toISOString().slice(0, 10),
    mode_reglement: "",
    timbre: 1,
    retenue_source: 0,
    lignes: [emptyLigne()] as LigneAvoir[],
  });

  const totals = useMemo(() => {
    const ht = form.lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);
    const tva = form.lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire * (l.tva / 100), 0);
    const ttc = ht + tva;
    const net = ttc + Number(form.timbre || 0) - Number(form.retenue_source || 0);
    return { ht, tva, ttc, net };
  }, [form.lignes, form.timbre, form.retenue_source]);

  const create = useMutation({
    mutationFn: async () => {
      if (!form.client_id) throw new Error("Client obligatoire");
      if (form.lignes.length === 0) throw new Error("Au moins une ligne");
      const numero = await nextNumero("AVR");
      const { data: avoir, error } = await supabase
        .from("avoirs")
        .insert({
          numero,
          client_id: form.client_id,
          date_avoir: form.date_avoir,
          mode_reglement: form.mode_reglement || null,
          timbre: Number(form.timbre || 0),
          retenue_source: Number(form.retenue_source || 0),
          total_ht: totals.ht,
          total_tva: totals.tva,
          total_ttc: totals.ttc,
          net_a_payer: totals.net,
        } as never)
        .select("id")
        .single();
      if (error) throw error;
      const lignes = form.lignes.map((l, i) => ({
        avoir_id: (avoir as any).id,
        ordre: i + 1,
        designation: l.designation,
        quantite: l.quantite,
        prix_unitaire: l.prix_unitaire,
        tva_pct: l.tva,
        total_ht: l.quantite * l.prix_unitaire,
      }));
      const { error: e2 } = await supabase.from("lignes_avoir").insert(lignes as never);
      if (e2) throw e2;
      await logAudit({ action: "create", entity_type: "avoir", entity_id: (avoir as any).id, details: { numero } });
      return numero;
    },
    onSuccess: (numero) => {
      toast.success(`Avoir ${numero} créé`);
      setOpenNew(false);
      setForm({ client_id: "", date_avoir: new Date().toISOString().slice(0, 10), mode_reglement: "", timbre: 1, retenue_source: 0, lignes: [emptyLigne()] });
      qc.invalidateQueries({ queryKey: ["avoirs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("avoirs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avoir supprimé");
      qc.invalidateQueries({ queryKey: ["avoirs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="px-8 py-6">
      <PageHeader
        title="Avoirs"
        description="Avoirs commerciaux émis aux clients."
        icon={FileMinus}
        action={
          <Button onClick={() => setOpenNew(true)} size="sm">
            <Plus className="mr-1 h-4 w-4" /> Nouvel avoir
          </Button>
        }
      />

      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={FileMinus} title="Aucun avoir" description="Créez votre premier avoir." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Total HT</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.numero}</TableCell>
                    <TableCell>{formatDate(a.date_avoir)}</TableCell>
                    <TableCell>{a.client?.raison_sociale ?? "—"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(a.total_ht)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(a.net_a_payer)}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Supprimer ${a.numero} ?`)) del.mutate(a.id); }}>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Nouvel avoir</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
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
                <Label>Date</Label>
                <Input type="date" value={form.date_avoir} onChange={(e) => setForm({ ...form, date_avoir: e.target.value })} />
              </div>
              <div>
                <Label>Mode règlement</Label>
                <Input value={form.mode_reglement} onChange={(e) => setForm({ ...form, mode_reglement: e.target.value })} />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Lignes</Label>
                <Button size="sm" variant="outline" onClick={() => setForm({ ...form, lignes: [...form.lignes, emptyLigne()] })}>
                  <Plus className="mr-1 h-3 w-3" /> Ligne
                </Button>
              </div>
              <div className="space-y-2">
                {form.lignes.map((l, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <Input className="col-span-5" placeholder="Désignation" value={l.designation} onChange={(e) => { const ls = [...form.lignes]; ls[i] = { ...l, designation: e.target.value }; setForm({ ...form, lignes: ls }); }} />
                    <Input className="col-span-2" type="number" placeholder="Qté" value={l.quantite} onChange={(e) => { const ls = [...form.lignes]; ls[i] = { ...l, quantite: Number(e.target.value) }; setForm({ ...form, lignes: ls }); }} />
                    <Input className="col-span-2" type="number" placeholder="PU" value={l.prix_unitaire} onChange={(e) => { const ls = [...form.lignes]; ls[i] = { ...l, prix_unitaire: Number(e.target.value) }; setForm({ ...form, lignes: ls }); }} />
                    <Input className="col-span-2" type="number" placeholder="TVA%" value={l.tva} onChange={(e) => { const ls = [...form.lignes]; ls[i] = { ...l, tva: Number(e.target.value) }; setForm({ ...form, lignes: ls }); }} />
                    <Button className="col-span-1" size="icon" variant="ghost" onClick={() => setForm({ ...form, lignes: form.lignes.filter((_, j) => j !== i) })}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Timbre</Label>
                <Input type="number" value={form.timbre} onChange={(e) => setForm({ ...form, timbre: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Retenue à la source</Label>
                <Input type="number" value={form.retenue_source} onChange={(e) => setForm({ ...form, retenue_source: Number(e.target.value) })} />
              </div>
            </div>

            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="flex justify-between"><span>Total HT :</span><span>{formatCurrency(totals.ht)}</span></div>
              <div className="flex justify-between"><span>TVA :</span><span>{formatCurrency(totals.tva)}</span></div>
              <div className="flex justify-between"><span>TTC :</span><span>{formatCurrency(totals.ttc)}</span></div>
              <div className="flex justify-between font-bold"><span>Net à payer :</span><span>{formatCurrency(totals.net)}</span></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Annuler</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
