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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Search, TestTubes, Loader2, Trash2, Edit } from "lucide-react";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/type-prelevements")({
  head: () => ({ meta: [{ title: "Types de prélèvement — BALIMS" }] }),
  component: TypePrelevementsPage,
});

const CATEGORIES = ["Eau", "Surface", "Air", "Aliment", "Sol", "Effluent", "Produit fini", "Matière première", "Autre"];

function TypePrelevementsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["type-prelevements"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("type_prelevements" as never) as any)
        .select("*").order("libelle");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => items.filter((t: any) =>
    !search || t.libelle?.toLowerCase().includes(search.toLowerCase()) ||
    t.code?.toLowerCase().includes(search.toLowerCase())
  ), [items, search]);

  const empty = { code: "", libelle: "", description: "", categorie: "Eau", champs_specifiques: "[]", is_active: true };
  const [form, setForm] = useState<any>(empty);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (t: any) => {
    setEditing(t);
    setForm({ ...t, champs_specifiques: JSON.stringify(t.champs_specifiques ?? [], null, 2) });
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      let champs: any[] = [];
      try { champs = JSON.parse(form.champs_specifiques || "[]"); } catch { throw new Error("JSON invalide pour champs spécifiques"); }
      const payload = { code: form.code, libelle: form.libelle, description: form.description, categorie: form.categorie, champs_specifiques: champs, is_active: form.is_active };
      if (editing) {
        const { error } = await (supabase.from("type_prelevements" as never) as any).update(payload).eq("id", editing.id);
        if (error) throw error;
        await logAudit({ action: "update", entity_type: "type_prelevement", entity_id: editing.id });
      } else {
        const { data, error } = await (supabase.from("type_prelevements" as never) as any).insert(payload).select().single();
        if (error) throw error;
        await logAudit({ action: "create", entity_type: "type_prelevement", entity_id: data.id });
      }
    },
    onSuccess: () => { toast.success("Enregistré"); qc.invalidateQueries({ queryKey: ["type-prelevements"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("type_prelevements" as never) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["type-prelevements"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="flex flex-col">
      <PageHeader title="Types de prélèvement" description="Catalogue des natures d'échantillon avec champs spécifiques"
        actions={<Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" />Nouveau type</Button>} />
      <div className="p-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
            </div>
            {isLoading ? <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
              : filtered.length === 0 ? <EmptyState icon={TestTubes} title="Aucun type" description="Créez votre premier type de prélèvement." />
              : <Table>
                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Libellé</TableHead><TableHead>Catégorie</TableHead><TableHead>Champs</TableHead><TableHead>Actif</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.code}</TableCell>
                      <TableCell className="font-medium">{t.libelle}</TableCell>
                      <TableCell><Badge variant="secondary">{t.categorie}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{(t.champs_specifiques ?? []).length} champ(s)</TableCell>
                      <TableCell>{t.is_active ? <Badge>Actif</Badge> : <Badge variant="outline">Inactif</Badge>}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Supprimer ?")) deleteMut.mutate(t.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouveau"} type de prélèvement</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Code *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div><Label>Catégorie</Label>
              <Select value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Libellé *</Label><Input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} /></div>
            <div className="col-span-2"><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="col-span-2">
              <Label>Champs spécifiques (JSON)</Label>
              <Textarea rows={6} className="font-mono text-xs"
                placeholder='[{"name":"temperature","label":"Température","type":"number","unit":"°C"}]'
                value={form.champs_specifiques} onChange={(e) => setForm({ ...form, champs_specifiques: e.target.value })} />
              <p className="text-xs text-muted-foreground mt-1">Format : tableau d'objets avec name, label, type (text/number/select/date), unit, options.</p>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Actif</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={() => saveMut.mutate()} disabled={!form.code || !form.libelle || saveMut.isPending}>
              {saveMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
