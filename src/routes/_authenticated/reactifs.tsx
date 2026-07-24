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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Search, FlaskConical, Loader2, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reactifs")({
  head: () => ({ meta: [{ title: "Réactifs & Consommables — BALIMS" }] }),
  component: ReactifsPage,
});

function ReactifsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["reactifs"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("reactifs" as never) as any)
        .select("*").order("nom");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => items.filter((r: any) =>
    !search || r.code?.toLowerCase().includes(search.toLowerCase()) ||
    r.nom?.toLowerCase().includes(search.toLowerCase()) ||
    r.numero_lot?.toLowerCase().includes(search.toLowerCase())
  ), [items, search]);

  const today = new Date();
  const alertes = items.filter((r: any) => {
    if (r.date_peremption && new Date(r.date_peremption) < today) return true;
    if (r.date_peremption) {
      const days = (new Date(r.date_peremption).getTime() - today.getTime()) / 86400000;
      if (days < 30) return true;
    }
    if (r.seuil_alerte > 0 && r.quantite_actuelle <= r.seuil_alerte) return true;
    return false;
  }).length;

  const [form, setForm] = useState({
    code: "", nom: "", fournisseur: "", numero_lot: "",
    date_reception: new Date().toISOString().slice(0, 10),
    date_ouverture: "", date_peremption: "",
    quantite_initiale: 0, quantite_actuelle: 0, unite: "ml",
    seuil_alerte: 0, emplacement: "", temperature_stockage: "",
    fds_url: "", notes: "",
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const code = form.code || `REA${Date.now().toString().slice(-6)}`;
      const payload = {
        ...form, code,
        date_ouverture: form.date_ouverture || null,
        date_peremption: form.date_peremption || null,
      };
      const { error } = await (supabase.from("reactifs" as never) as any).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Réactif enregistré");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["reactifs"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function statutPeremption(r: any) {
    if (!r.date_peremption) return null;
    const d = new Date(r.date_peremption);
    if (d < today) return <Badge className="bg-red-100 text-red-800">Périmé</Badge>;
    const days = Math.floor((d.getTime() - today.getTime()) / 86400000);
    if (days < 30) return <Badge className="bg-amber-100 text-amber-800">{days}j</Badge>;
    return <Badge variant="outline">{formatDate(r.date_peremption)}</Badge>;
  }

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Réactifs & Consommables"
        description="Stock, lots, péremption, seuils d'alerte, FDS"
        badge={alertes > 0 ? <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />{alertes} alerte{alertes > 1 ? "s" : ""}</Badge> : null}
        actions={<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Nouveau réactif</Button>}
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Recherche..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={FlaskConical} title="Aucun réactif" description="Ajoutez votre premier réactif." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Péremption</TableHead>
                  <TableHead>Emplacement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.code}</TableCell>
                    <TableCell className="font-medium">{r.nom}</TableCell>
                    <TableCell className="text-xs">{r.numero_lot ?? "—"}</TableCell>
                    <TableCell className="text-xs">{r.fournisseur ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {r.quantite_actuelle} / {r.quantite_initiale} {r.unite}
                      {r.seuil_alerte > 0 && r.quantite_actuelle <= r.seuil_alerte && (
                        <Badge className="ml-2 bg-red-100 text-red-800">Bas</Badge>
                      )}
                    </TableCell>
                    <TableCell>{statutPeremption(r)}</TableCell>
                    <TableCell className="text-xs">{r.emplacement ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nouveau réactif</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div><Label>Nom *</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
            <div><Label>Fournisseur</Label><Input value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} /></div>
            <div><Label>N° Lot</Label><Input value={form.numero_lot} onChange={(e) => setForm({ ...form, numero_lot: e.target.value })} /></div>
            <div><Label>Réception</Label><Input type="date" value={form.date_reception} onChange={(e) => setForm({ ...form, date_reception: e.target.value })} /></div>
            <div><Label>Ouverture</Label><Input type="date" value={form.date_ouverture} onChange={(e) => setForm({ ...form, date_ouverture: e.target.value })} /></div>
            <div><Label>Péremption</Label><Input type="date" value={form.date_peremption} onChange={(e) => setForm({ ...form, date_peremption: e.target.value })} /></div>
            <div><Label>Unité</Label><Input value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })} /></div>
            <div><Label>Quantité initiale</Label><Input type="number" step="0.01" value={form.quantite_initiale} onChange={(e) => setForm({ ...form, quantite_initiale: Number(e.target.value) })} /></div>
            <div><Label>Quantité actuelle</Label><Input type="number" step="0.01" value={form.quantite_actuelle} onChange={(e) => setForm({ ...form, quantite_actuelle: Number(e.target.value) })} /></div>
            <div><Label>Seuil alerte</Label><Input type="number" step="0.01" value={form.seuil_alerte} onChange={(e) => setForm({ ...form, seuil_alerte: Number(e.target.value) })} /></div>
            <div><Label>Emplacement</Label><Input value={form.emplacement} onChange={(e) => setForm({ ...form, emplacement: e.target.value })} /></div>
            <div><Label>Temp. stockage</Label><Input value={form.temperature_stockage} onChange={(e) => setForm({ ...form, temperature_stockage: e.target.value })} placeholder="+4°C / -20°C" /></div>
            <div><Label>FDS URL</Label><Input value={form.fds_url} onChange={(e) => setForm({ ...form, fds_url: e.target.value })} /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={() => createMut.mutate()} disabled={!form.nom || createMut.isPending}>
              {createMut.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
