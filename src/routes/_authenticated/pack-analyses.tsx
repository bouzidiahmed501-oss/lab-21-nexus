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
import { Plus, Search, Package, Loader2, Trash2, Edit } from "lucide-react";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/pack-analyses")({
  head: () => ({ meta: [{ title: "Packs d'analyses — BALIMS" }] }),
  component: PackAnalysesPage,
});

function PackAnalysesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [lignes, setLignes] = useState<any[]>([]);

  const { data: packs = [], isLoading } = useQuery({
    queryKey: ["pack-analyses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pack_analyses").select("*, lignes:lignes_pack_analyse(id, ordre, catalogue_analyse_id, critere_id, catalogue:catalogue_analyses(code,libelle,prix))").order("code");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: catalogue = [] } = useQuery({
    queryKey: ["catalogue-lite"],
    queryFn: async () => {
      const { data } = await supabase.from("catalogue_analyses").select("id, code, libelle, prix").eq("is_active", true).order("code");
      return data ?? [];
    },
  });

  const filtered = useMemo(() => packs.filter((p: any) =>
    !search || p.code?.toLowerCase().includes(search.toLowerCase()) ||
    p.libelle?.toLowerCase().includes(search.toLowerCase())
  ), [packs, search]);

  const empty = { code: "", libelle: "", origine: "", note_pour_criteres: "", reference_critere: "", avec_declaration_conformite: false, is_active: true };
  const [form, setForm] = useState<any>(empty);

  const openNew = () => { setEditing(null); setForm(empty); setLignes([]); setOpen(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ code: p.code, libelle: p.libelle ?? "", origine: p.origine ?? "", note_pour_criteres: p.note_pour_criteres ?? "", reference_critere: p.reference_critere ?? "", avec_declaration_conformite: !!p.avec_declaration_conformite, is_active: !!p.is_active });
    setLignes((p.lignes ?? []).sort((a: any, b: any) => a.ordre - b.ordre));
    setOpen(true);
  };

  const addLigne = () => setLignes([...lignes, { ordre: lignes.length + 1, catalogue_analyse_id: "", _new: true }]);
  const updateLigne = (i: number, patch: any) => setLignes(lignes.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  const removeLigne = (i: number) => setLignes(lignes.filter((_, idx) => idx !== i));

  const totalPrix = useMemo(() => lignes.reduce((s, l) => {
    const cat = catalogue.find((c: any) => c.id === l.catalogue_analyse_id);
    return s + Number(cat?.prix ?? 0);
  }, 0), [lignes, catalogue]);

  const saveMut = useMutation({
    mutationFn: async () => {
      let packId: string;
      if (editing) {
        const { error } = await supabase.from("pack_analyses").update(form).eq("id", editing.id);
        if (error) throw error;
        packId = editing.id;
        await supabase.from("lignes_pack_analyse").delete().eq("pack_analyse_id", packId);
      } else {
        const { data, error } = await supabase.from("pack_analyses").insert(form).select().single();
        if (error) throw error;
        packId = data.id;
      }
      const validLignes = lignes.filter(l => l.catalogue_analyse_id);
      if (validLignes.length > 0) {
        const { error } = await supabase.from("lignes_pack_analyse").insert(
          validLignes.map((l, i) => ({ pack_analyse_id: packId, ordre: i + 1, catalogue_analyse_id: l.catalogue_analyse_id, critere_id: l.critere_id || null }))
        );
        if (error) throw error;
      }
      await logAudit({ action: editing ? "update" : "create", entity_type: "pack_analyse", entity_id: packId });
    },
    onSuccess: () => { toast.success("Pack enregistré"); qc.invalidateQueries({ queryKey: ["pack-analyses"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("pack_analyses").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["pack-analyses"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="flex flex-col">
      <PageHeader title="Packs d'analyses" description="Groupes prédéfinis d'analyses à appliquer en 1 clic"
        actions={<Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" />Nouveau pack</Button>} />
      <div className="p-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
            </div>
            {isLoading ? <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
              : filtered.length === 0 ? <EmptyState icon={Package} title="Aucun pack" description="Créez votre premier pack d'analyses." />
              : <Table>
                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Libellé</TableHead><TableHead>Origine</TableHead><TableHead>Analyses</TableHead><TableHead>Actif</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.code}</TableCell>
                      <TableCell className="font-medium">{p.libelle}</TableCell>
                      <TableCell className="text-xs">{p.origine}</TableCell>
                      <TableCell><Badge variant="secondary">{(p.lignes ?? []).length}</Badge></TableCell>
                      <TableCell>{p.is_active ? <Badge>Actif</Badge> : <Badge variant="outline">Inactif</Badge>}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Supprimer ?")) deleteMut.mutate(p.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouveau"} pack d'analyses</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Code *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div><Label>Libellé</Label><Input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} /></div>
            <div><Label>Origine / domaine</Label><Input value={form.origine} onChange={(e) => setForm({ ...form, origine: e.target.value })} /></div>
            <div><Label>Référence critère</Label><Input value={form.reference_critere} onChange={(e) => setForm({ ...form, reference_critere: e.target.value })} /></div>
            <div className="col-span-2"><Label>Note pour les critères</Label><Textarea rows={2} value={form.note_pour_criteres} onChange={(e) => setForm({ ...form, note_pour_criteres: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.avec_declaration_conformite} onCheckedChange={(v) => setForm({ ...form, avec_declaration_conformite: v })} /><Label>Avec déclaration de conformité</Label></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Actif</Label></div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-semibold">Analyses du pack ({lignes.length}) — Total: {totalPrix.toFixed(3)} DT</Label>
              <Button size="sm" variant="outline" onClick={addLigne}><Plus className="h-3 w-3 mr-1" />Ajouter</Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-2">
              {lignes.map((l, i) => {
                const cat = catalogue.find((c: any) => c.id === l.catalogue_analyse_id);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-8 text-xs text-muted-foreground">{i + 1}</span>
                    <Select value={l.catalogue_analyse_id} onValueChange={(v) => updateLigne(i, { catalogue_analyse_id: v })}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Choisir une analyse..." /></SelectTrigger>
                      <SelectContent>
                        {catalogue.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.code} — {c.libelle} ({Number(c.prix).toFixed(3)})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <span className="w-20 text-right text-xs">{cat ? Number(cat.prix).toFixed(3) : "-"}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeLigne(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                );
              })}
              {lignes.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">Aucune analyse. Cliquez sur Ajouter.</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={() => saveMut.mutate()} disabled={!form.code || saveMut.isPending}>
              {saveMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
