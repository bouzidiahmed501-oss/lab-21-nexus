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
import { Plus, Search, Workflow, Loader2, Trash2, Edit, ArrowUp, ArrowDown } from "lucide-react";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/chaines-analyse")({
  head: () => ({ meta: [{ title: "Chaînes d'analyse — BALIMS" }] }),
  component: ChainesPage,
});

type Etape = {
  id?: string;
  ordre: number;
  libelle: string;
  duree_minutes: number | null;
  technicien_role: string | null;
  equipement_id: string | null;
  instructions: string | null;
};

const ROLES = ["technicien", "chef_labo", "qualite"];

function ChainesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [etapes, setEtapes] = useState<Etape[]>([]);

  const { data: chaines = [], isLoading } = useQuery({
    queryKey: ["chaines-analyse"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chaines_analyse" as never)
        .select("*, etapes:chaine_etapes(*), catalogue:catalogue_analyses(code,libelle)")
        .order("code");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: catalogue = [] } = useQuery({
    queryKey: ["catalogue-lite-chain"],
    queryFn: async () => {
      const { data } = await supabase.from("catalogue_analyses").select("id, code, libelle").eq("is_active", true).order("code");
      return data ?? [];
    },
  });

  const { data: equipements = [] } = useQuery({
    queryKey: ["equip-lite-chain"],
    queryFn: async () => {
      const { data } = await supabase.from("equipements").select("id, code, libelle").order("code");
      return data ?? [];
    },
  });

  const filtered = useMemo(
    () => chaines.filter((c: any) => !search || (c.code + " " + c.libelle).toLowerCase().includes(search.toLowerCase())),
    [chaines, search],
  );

  const save = useMutation({
    mutationFn: async (form: any) => {
      let chaineId = editing?.id;
      if (editing) {
        const { error } = await supabase.from("chaines_analyse" as never).update({
          code: form.code, libelle: form.libelle, catalogue_analyse_id: form.catalogue_analyse_id || null,
          description: form.description || null, is_active: form.is_active,
        } as never).eq("id", editing.id);
        if (error) throw error;
        await supabase.from("chaine_etapes" as never).delete().eq("chaine_id", editing.id);
      } else {
        const { data, error } = await supabase.from("chaines_analyse" as never).insert({
          code: form.code, libelle: form.libelle, catalogue_analyse_id: form.catalogue_analyse_id || null,
          description: form.description || null, is_active: form.is_active,
        } as never).select().single();
        if (error) throw error;
        chaineId = (data as any).id;
      }
      if (etapes.length > 0) {
        const rows = etapes.map((e, idx) => ({
          chaine_id: chaineId, ordre: idx + 1, libelle: e.libelle,
          duree_minutes: e.duree_minutes, technicien_role: e.technicien_role,
          equipement_id: e.equipement_id, instructions: e.instructions,
        }));
        const { error } = await supabase.from("chaine_etapes" as never).insert(rows as never);
        if (error) throw error;
      }
      await logAudit({ action: editing ? "update" : "create", entity_type: "chaine_analyse", entity_id: chaineId });
    },
    onSuccess: () => {
      toast.success(editing ? "Chaîne mise à jour" : "Chaîne créée");
      qc.invalidateQueries({ queryKey: ["chaines-analyse"] });
      setOpen(false); setEditing(null); setEtapes([]);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chaines_analyse" as never).delete().eq("id", id);
      if (error) throw error;
      await logAudit({ action: "delete", entity_type: "chaine_analyse", entity_id: id });
    },
    onSuccess: () => { toast.success("Supprimée"); qc.invalidateQueries({ queryKey: ["chaines-analyse"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setEtapes([]); setOpen(true); };
  const openEdit = (c: any) => {
    setEditing(c);
    setEtapes((c.etapes ?? []).sort((a: any, b: any) => a.ordre - b.ordre).map((e: any) => ({
      id: e.id, ordre: e.ordre, libelle: e.libelle, duree_minutes: e.duree_minutes,
      technicien_role: e.technicien_role, equipement_id: e.equipement_id, instructions: e.instructions,
    })));
    setOpen(true);
  };

  const addEtape = () => setEtapes([...etapes, { ordre: etapes.length + 1, libelle: "", duree_minutes: null, technicien_role: null, equipement_id: null, instructions: null }]);
  const updEtape = (i: number, patch: Partial<Etape>) => setEtapes(etapes.map((e, idx) => idx === i ? { ...e, ...patch } : e));
  const delEtape = (i: number) => setEtapes(etapes.filter((_, idx) => idx !== i));
  const moveEtape = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= etapes.length) return;
    const next = [...etapes]; [next[i], next[j]] = [next[j], next[i]]; setEtapes(next);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Chaînes d'analyse" description="Workflow standardisé d'étapes par paramètre analytique"
        actions={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nouvelle chaîne</Button>}
      />

      <Card><CardContent className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Workflow} title="Aucune chaîne" description="Créez votre première chaîne d'analyse" />
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Code</TableHead><TableHead>Libellé</TableHead><TableHead>Analyse liée</TableHead>
              <TableHead className="text-center">Étapes</TableHead><TableHead className="text-center">Durée totale</TableHead>
              <TableHead className="text-center">Statut</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((c: any) => {
                const totalMin = (c.etapes ?? []).reduce((s: number, e: any) => s + (e.duree_minutes ?? 0), 0);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.code}</TableCell>
                    <TableCell className="font-medium">{c.libelle}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.catalogue ? `${c.catalogue.code} — ${c.catalogue.libelle}` : "—"}</TableCell>
                    <TableCell className="text-center">{c.etapes?.length ?? 0}</TableCell>
                    <TableCell className="text-center text-xs">{totalMin > 0 ? `${totalMin} min` : "—"}</TableCell>
                    <TableCell className="text-center">{c.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => confirm("Supprimer ?") && del.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <ChaineDialog
        open={open} onOpenChange={(v) => { if (!v) { setEditing(null); setEtapes([]); } setOpen(v); }}
        editing={editing} catalogue={catalogue as any[]} equipements={equipements as any[]}
        etapes={etapes} addEtape={addEtape} updEtape={updEtape} delEtape={delEtape} moveEtape={moveEtape}
        onSave={(f) => save.mutate(f)} saving={save.isPending}
      />
    </div>
  );
}

function ChaineDialog(props: {
  open: boolean; onOpenChange: (v: boolean) => void; editing: any;
  catalogue: any[]; equipements: any[]; etapes: Etape[];
  addEtape: () => void; updEtape: (i: number, p: Partial<Etape>) => void;
  delEtape: (i: number) => void; moveEtape: (i: number, dir: -1 | 1) => void;
  onSave: (f: any) => void; saving: boolean;
}) {
  const { open, onOpenChange, editing, catalogue, equipements, etapes } = props;
  const [form, setForm] = useState<any>({});
  useState(() => { setForm(editing ?? { code: "", libelle: "", catalogue_analyse_id: "", description: "", is_active: true }); return undefined; });
  // sync when editing changes
  useMemo(() => {
    setForm(editing ?? { code: "", libelle: "", catalogue_analyse_id: "", description: "", is_active: true });
  }, [editing, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouvelle"} chaîne d'analyse</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Code *</Label><Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div><Label>Libellé *</Label><Input value={form.libelle ?? ""} onChange={(e) => setForm({ ...form, libelle: e.target.value })} /></div>
          </div>
          <div>
            <Label>Analyse liée (optionnel)</Label>
            <Select value={form.catalogue_analyse_id ?? ""} onValueChange={(v) => setForm({ ...form, catalogue_analyse_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{catalogue.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} — {c.libelle}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
          <div className="flex items-center gap-2"><Switch checked={form.is_active ?? true} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>

          <div className="border-t pt-3">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-semibold">Étapes du workflow</Label>
              <Button size="sm" variant="outline" onClick={props.addEtape}><Plus className="mr-1 h-3 w-3" />Ajouter</Button>
            </div>
            {etapes.length === 0 ? (
              <p className="rounded border border-dashed py-6 text-center text-xs text-muted-foreground">Aucune étape — ajoutez-en pour définir le workflow</p>
            ) : (
              <div className="space-y-2">
                {etapes.map((e, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 rounded border p-2">
                    <div className="col-span-1 flex flex-col items-center justify-center text-xs">
                      <span className="font-mono">#{i + 1}</span>
                      <div className="flex flex-col">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => props.moveEtape(i, -1)}><ArrowUp className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => props.moveEtape(i, 1)}><ArrowDown className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <div className="col-span-4"><Input placeholder="Libellé étape *" value={e.libelle} onChange={(ev) => props.updEtape(i, { libelle: ev.target.value })} /></div>
                    <div className="col-span-2"><Input type="number" placeholder="Durée (min)" value={e.duree_minutes ?? ""} onChange={(ev) => props.updEtape(i, { duree_minutes: ev.target.value ? Number(ev.target.value) : null })} /></div>
                    <div className="col-span-2">
                      <Select value={e.technicien_role ?? ""} onValueChange={(v) => props.updEtape(i, { technicien_role: v || null })}>
                        <SelectTrigger><SelectValue placeholder="Rôle" /></SelectTrigger>
                        <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Select value={e.equipement_id ?? ""} onValueChange={(v) => props.updEtape(i, { equipement_id: v || null })}>
                        <SelectTrigger><SelectValue placeholder="Équipement" /></SelectTrigger>
                        <SelectContent>{equipements.map((eq) => <SelectItem key={eq.id} value={eq.id}>{eq.code}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <Button variant="ghost" size="icon" onClick={() => props.delEtape(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <div className="col-span-12"><Textarea placeholder="Instructions (optionnel)" value={e.instructions ?? ""} onChange={(ev) => props.updEtape(i, { instructions: ev.target.value || null })} rows={1} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => props.onSave(form)} disabled={props.saving || !form.code || !form.libelle}>
            {props.saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
