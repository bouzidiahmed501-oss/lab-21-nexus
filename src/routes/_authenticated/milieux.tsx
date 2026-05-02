import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { EmptyState } from "@/components/lab/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Beaker, Loader2, Droplets, Package } from "lucide-react";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/milieux")({
  head: () => ({ meta: [{ title: "Milieux de culture — BALIMS" }] }),
  component: MilieuxPage,
});

function MilieuxPage() {
  const [tab, setTab] = useState("milieux");

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Milieux de culture" description="Gestion des milieux, origines et types — Contrôle qualité microbiologique" />
      <div className="flex-1 overflow-y-auto p-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-3">
            <TabsTrigger value="milieux"><Beaker className="h-3.5 w-3.5 mr-1" /> Préparations</TabsTrigger>
            <TabsTrigger value="origines"><Package className="h-3.5 w-3.5 mr-1" /> Lots fournisseur</TabsTrigger>
            <TabsTrigger value="types"><Droplets className="h-3.5 w-3.5 mr-1" /> Types</TabsTrigger>
          </TabsList>

          <TabsContent value="milieux"><MilieuxTab /></TabsContent>
          <TabsContent value="origines"><OriginesTab /></TabsContent>
          <TabsContent value="types"><TypesTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MilieuxTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["milieux"],
    queryFn: async () => { const { data, error } = await supabase.from("milieux").select("*, milieu_origines(code)").order("created_at", { ascending: false }); if (error) throw error; return data as any[]; },
  });

  const [form, setForm] = useState({ code: "", ph: "", quantite: "", volume: "", test_sterilite: false, test_negativite: false, test_positivite: false });
  const create = useMutation({
    mutationFn: async () => {
      if (!form.code) throw new Error("Code requis");
      const { error } = await supabase.from("milieux").insert({
        code: form.code, ph: form.ph ? Number(form.ph) : null,
        quantite: form.quantite ? Number(form.quantite) : null,
        volume: form.volume ? Number(form.volume) : null,
        date_preparation: new Date().toISOString().slice(0, 10),
        test_sterilite: form.test_sterilite, test_negativite: form.test_negativite, test_positivite: form.test_positivite,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Milieu créé"); qc.invalidateQueries({ queryKey: ["milieux"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Préparation</Button></div>
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div> : rows.length === 0 ? (
        <EmptyState icon={Beaker} title="Aucune préparation" description="Enregistrez vos préparations de milieux de culture." />
      ) : (
        <div className="rounded-md border border-border/60 bg-card">
          <Table><TableHeader><TableRow className="text-[10px]">
            <TableHead>Code</TableHead><TableHead>Date prép.</TableHead><TableHead>pH</TableHead>
            <TableHead>Qté</TableHead><TableHead>Vol.</TableHead>
            <TableHead>Stérilité</TableHead><TableHead>Négativité</TableHead><TableHead>Positivité</TableHead>
          </TableRow></TableHeader>
            <TableBody>{rows.map((r: any) => (
              <TableRow key={r.id} className="text-xs">
                <TableCell className="font-mono">{r.code}</TableCell>
                <TableCell>{formatDate(r.date_preparation)}</TableCell>
                <TableCell className="tabular-nums">{r.ph ?? "—"}</TableCell>
                <TableCell className="tabular-nums">{r.quantite ?? "—"}</TableCell>
                <TableCell className="tabular-nums">{r.volume ?? "—"}</TableCell>
                <TableCell>{r.test_sterilite ? <Badge>OK</Badge> : "—"}</TableCell>
                <TableCell>{r.test_negativite ? <Badge>OK</Badge> : "—"}</TableCell>
                <TableCell>{r.test_positivite ? <Badge>OK</Badge> : "—"}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nouvelle préparation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Code *</Label><Input className="h-8 text-xs" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-xs">pH</Label><Input type="number" step="0.01" className="h-8 text-xs" value={form.ph} onChange={e => setForm({ ...form, ph: e.target.value })} /></div>
              <div><Label className="text-xs">Quantité</Label><Input type="number" className="h-8 text-xs" value={form.quantite} onChange={e => setForm({ ...form, quantite: e.target.value })} /></div>
              <div><Label className="text-xs">Volume (ml)</Label><Input type="number" className="h-8 text-xs" value={form.volume} onChange={e => setForm({ ...form, volume: e.target.value })} /></div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5"><Switch checked={form.test_sterilite} onCheckedChange={v => setForm({ ...form, test_sterilite: v })} /><Label className="text-xs">Stérilité</Label></div>
              <div className="flex items-center gap-1.5"><Switch checked={form.test_negativite} onCheckedChange={v => setForm({ ...form, test_negativite: v })} /><Label className="text-xs">Négativité</Label></div>
              <div className="flex items-center gap-1.5"><Switch checked={form.test_positivite} onCheckedChange={v => setForm({ ...form, test_positivite: v })} /><Label className="text-xs">Positivité</Label></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={() => create.mutate()} disabled={create.isPending}>Créer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OriginesTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: rows = [] } = useQuery({
    queryKey: ["milieu_origines"],
    queryFn: async () => { const { data } = await supabase.from("milieu_origines").select("*, type_milieux(libelle)").order("code"); return (data ?? []) as any[]; },
  });
  const { data: types = [] } = useQuery({
    queryKey: ["type_milieux"],
    queryFn: async () => { const { data } = await supabase.from("type_milieux").select("*").order("code"); return (data ?? []) as any[]; },
  });

  const [form, setForm] = useState({ code: "", type_milieu_id: "", lot_fabricant: "", quantite_base: "" });
  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("milieu_origines").insert({
        code: form.code, type_milieu_id: form.type_milieu_id || null,
        lot_fabricant: form.lot_fabricant || null,
        quantite_base: form.quantite_base ? Number(form.quantite_base) : null,
        quantite_restante: form.quantite_base ? Number(form.quantite_base) : null,
        date_reception: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Lot ajouté"); qc.invalidateQueries({ queryKey: ["milieu_origines"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Lot</Button></div>
      {rows.length === 0 ? <EmptyState icon={Package} title="Aucun lot" description="Enregistrez les lots fournisseur de milieux." /> : (
        <div className="rounded-md border border-border/60 bg-card">
          <Table><TableHeader><TableRow className="text-[10px]"><TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead>Lot fabricant</TableHead><TableHead>Réception</TableHead><TableHead className="text-right">Qté base</TableHead><TableHead className="text-right">Restante</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map((r: any) => (
              <TableRow key={r.id} className="text-xs"><TableCell className="font-mono">{r.code}</TableCell><TableCell>{r.type_milieux?.libelle || "—"}</TableCell><TableCell>{r.lot_fabricant || "—"}</TableCell><TableCell>{formatDate(r.date_reception)}</TableCell><TableCell className="text-right tabular-nums">{r.quantite_base ?? "—"}</TableCell><TableCell className="text-right tabular-nums">{r.quantite_restante ?? "—"}</TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nouveau lot fournisseur</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Code *</Label><Input className="h-8 text-xs" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
            <div><Label className="text-xs">Type milieu</Label>
              <Select value={form.type_milieu_id} onValueChange={v => setForm({ ...form, type_milieu_id: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{types.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.libelle || t.code}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Lot fabricant</Label><Input className="h-8 text-xs" value={form.lot_fabricant} onChange={e => setForm({ ...form, lot_fabricant: e.target.value })} /></div>
              <div><Label className="text-xs">Quantité</Label><Input type="number" className="h-8 text-xs" value={form.quantite_base} onChange={e => setForm({ ...form, quantite_base: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={() => create.mutate()} disabled={create.isPending}>Ajouter</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TypesTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: rows = [] } = useQuery({
    queryKey: ["type_milieux"],
    queryFn: async () => { const { data } = await supabase.from("type_milieux").select("*").order("code"); return (data ?? []) as any[]; },
  });
  const [form, setForm] = useState({ code: "", libelle: "" });
  const create = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("type_milieux").insert({ code: form.code, libelle: form.libelle }); if (error) throw error; },
    onSuccess: () => { toast.success("Type ajouté"); qc.invalidateQueries({ queryKey: ["type_milieux"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Type</Button></div>
      {rows.length === 0 ? <EmptyState icon={Droplets} title="Aucun type" description="Créez vos types de milieux (gélose, bouillon…)." /> : (
        <div className="rounded-md border border-border/60 bg-card">
          <Table><TableHeader><TableRow className="text-[10px]"><TableHead>Code</TableHead><TableHead>Libellé</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map((r: any) => <TableRow key={r.id} className="text-xs"><TableCell className="font-mono">{r.code}</TableCell><TableCell>{r.libelle}</TableCell></TableRow>)}</TableBody>
          </Table>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nouveau type de milieu</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Code *</Label><Input className="h-8 text-xs" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
            <div><Label className="text-xs">Libellé</Label><Input className="h-8 text-xs" value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={() => create.mutate()} disabled={create.isPending}>Ajouter</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
