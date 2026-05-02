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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Search, BookOpen, Layers, FolderTree, FlaskConical, Loader2, ListTree, Target, Pencil } from "lucide-react";

export const Route = createFileRoute("/_authenticated/referentiels")({
  head: () => ({ meta: [{ title: "Référentiels — BALIMS" }] }),
  component: ReferentielsPage,
});

function ReferentielsPage() {
  const [tab, setTab] = useState("catalogue");

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Référentiels Analytiques" description="Catalogue d'analyses, familles, normes, critères et packs" />
      <div className="flex-1 overflow-y-auto p-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-3">
            <TabsTrigger value="catalogue"><FlaskConical className="h-3.5 w-3.5 mr-1" /> Catalogue</TabsTrigger>
            <TabsTrigger value="familles"><FolderTree className="h-3.5 w-3.5 mr-1" /> Familles</TabsTrigger>
            <TabsTrigger value="criteres"><Target className="h-3.5 w-3.5 mr-1" /> Critères</TabsTrigger>
            <TabsTrigger value="packs"><Layers className="h-3.5 w-3.5 mr-1" /> Packs</TabsTrigger>
            <TabsTrigger value="normes"><BookOpen className="h-3.5 w-3.5 mr-1" /> Normes</TabsTrigger>
          </TabsList>

          <TabsContent value="catalogue"><CatalogueTab /></TabsContent>
          <TabsContent value="familles"><FamillesTab /></TabsContent>
          <TabsContent value="criteres"><CriteresTab /></TabsContent>
          <TabsContent value="packs"><PacksTab /></TabsContent>
          <TabsContent value="normes"><NormesTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ========== CATALOGUE ========== */
function CatalogueTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["catalogue_analyses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("catalogue_analyses").select("*, type_analyses(libelle), referentiels(libelle)").order("code");
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return !q || [r.code, r.libelle, r.code_norme].filter(Boolean).some((s: string) => s.toLowerCase().includes(q));
  });

  const [form, setForm] = useState({ code: "", libelle: "", prix: "0", code_norme: "", accredite: false, incertitude: "" });
  const create = useMutation({
    mutationFn: async () => {
      if (!form.code || !form.libelle) throw new Error("Code et libellé requis");
      const { error } = await supabase.from("catalogue_analyses").insert({
        code: form.code, libelle: form.libelle, prix: Number(form.prix),
        code_norme: form.code_norme || null, accredite: form.accredite,
        incertitude: form.incertitude || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Analyse ajoutée"); qc.invalidateQueries({ queryKey: ["catalogue_analyses"] }); setOpen(false); setForm({ code: "", libelle: "", prix: "0", code_norme: "", accredite: false, incertitude: "" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8 h-8 text-xs" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Analyse</Button>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div> : filtered.length === 0 ? (
        <EmptyState icon={FlaskConical} title="Catalogue vide" description="Ajoutez vos analyses avec codes normes et prix." action={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Ajouter</Button>} />
      ) : (
        <div className="rounded-md border border-border/60 bg-card">
          <Table>
            <TableHeader><TableRow className="text-[10px]">
              <TableHead>Code</TableHead><TableHead>Libellé</TableHead><TableHead>Type</TableHead>
              <TableHead>Norme</TableHead><TableHead className="text-right">Prix (DT)</TableHead>
              <TableHead>Accr.</TableHead><TableHead>Incertitude</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id} className="text-xs">
                  <TableCell className="font-mono font-medium">{r.code}</TableCell>
                  <TableCell className="max-w-[250px] truncate">{r.libelle}</TableCell>
                  <TableCell className="text-muted-foreground">{r.type_analyses?.libelle || "—"}</TableCell>
                  <TableCell className="font-mono text-[10px]">{r.code_norme || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(r.prix).toFixed(3)}</TableCell>
                  <TableCell>{r.accredite ? <Badge variant="default" className="text-[9px]">COFRAC</Badge> : "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-[10px]">{r.incertitude || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle analyse au catalogue</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Code *</Label><Input className="h-8 text-xs" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
              <div><Label className="text-xs">Prix (DT)</Label><Input type="number" className="h-8 text-xs" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Libellé *</Label><Input className="h-8 text-xs" value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Code norme</Label><Input className="h-8 text-xs" value={form.code_norme} onChange={e => setForm({ ...form, code_norme: e.target.value })} /></div>
              <div><Label className="text-xs">Incertitude</Label><Input className="h-8 text-xs" value={form.incertitude} onChange={e => setForm({ ...form, incertitude: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.accredite} onCheckedChange={v => setForm({ ...form, accredite: v })} />
              <Label className="text-xs">Analyse accréditée (COFRAC)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>{create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />} Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ========== FAMILLES ========== */
function FamillesTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", libelle: "" });

  const { data: superFamilles = [] } = useQuery({
    queryKey: ["super_familles"],
    queryFn: async () => { const { data } = await supabase.from("super_familles").select("*").order("ordre"); return (data ?? []) as any[]; },
  });
  const { data: familles = [] } = useQuery({
    queryKey: ["familles"],
    queryFn: async () => { const { data } = await supabase.from("familles").select("*, super_familles(libelle)").order("code"); return (data ?? []) as any[]; },
  });

  const [sfForm, setSfForm] = useState({ code: "", libelle: "", prix_defaut: "0" });
  const [openSf, setOpenSf] = useState(false);

  const createSf = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("super_familles").insert({ code: sfForm.code, libelle: sfForm.libelle, prix_defaut: Number(sfForm.prix_defaut) });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Super-famille créée"); qc.invalidateQueries({ queryKey: ["super_familles"] }); setOpenSf(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const createFam = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("familles").insert({ code: form.code, libelle: form.libelle });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Famille créée"); qc.invalidateQueries({ queryKey: ["familles"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Super-Familles</h3>
          <Button size="sm" variant="outline" onClick={() => setOpenSf(true)}><Plus className="h-3 w-3 mr-1" /> Super-famille</Button>
        </div>
        {superFamilles.length === 0 ? <p className="text-xs text-muted-foreground">Aucune super-famille</p> : (
          <div className="rounded-md border border-border/60 bg-card">
            <Table><TableHeader><TableRow className="text-[10px]"><TableHead>Code</TableHead><TableHead>Libellé</TableHead><TableHead className="text-right">Prix défaut</TableHead></TableRow></TableHeader>
              <TableBody>{superFamilles.map((sf: any) => <TableRow key={sf.id} className="text-xs"><TableCell className="font-mono">{sf.code}</TableCell><TableCell>{sf.libelle}</TableCell><TableCell className="text-right tabular-nums">{Number(sf.prix_defaut || 0).toFixed(3)}</TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
        )}
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Familles</h3>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="h-3 w-3 mr-1" /> Famille</Button>
        </div>
        {familles.length === 0 ? <p className="text-xs text-muted-foreground">Aucune famille</p> : (
          <div className="rounded-md border border-border/60 bg-card">
            <Table><TableHeader><TableRow className="text-[10px]"><TableHead>Code</TableHead><TableHead>Libellé</TableHead><TableHead>Super-Famille</TableHead></TableRow></TableHeader>
              <TableBody>{familles.map((f: any) => <TableRow key={f.id} className="text-xs"><TableCell className="font-mono">{f.code}</TableCell><TableCell>{f.libelle}</TableCell><TableCell className="text-muted-foreground">{f.super_familles?.libelle || "—"}</TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={openSf} onOpenChange={setOpenSf}>
        <DialogContent><DialogHeader><DialogTitle>Nouvelle Super-Famille</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Code *</Label><Input className="h-8 text-xs" value={sfForm.code} onChange={e => setSfForm({ ...sfForm, code: e.target.value })} /></div>
            <div><Label className="text-xs">Libellé</Label><Input className="h-8 text-xs" value={sfForm.libelle} onChange={e => setSfForm({ ...sfForm, libelle: e.target.value })} /></div>
            <div><Label className="text-xs">Prix défaut (DT)</Label><Input type="number" className="h-8 text-xs" value={sfForm.prix_defaut} onChange={e => setSfForm({ ...sfForm, prix_defaut: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenSf(false)}>Annuler</Button><Button onClick={() => createSf.mutate()} disabled={createSf.isPending}>Créer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nouvelle Famille</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Code *</Label><Input className="h-8 text-xs" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
            <div><Label className="text-xs">Libellé</Label><Input className="h-8 text-xs" value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={() => createFam.mutate()} disabled={createFam.isPending}>Créer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ========== CRITERES ========== */
function CriteresTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["criteres"],
    queryFn: async () => { const { data, error } = await supabase.from("criteres").select("*").order("code"); if (error) throw error; return data as any[]; },
  });

  const filtered = rows.filter(r => !search || [r.code, r.libelle].filter(Boolean).some((s: string) => s.toLowerCase().includes(search.toLowerCase())));

  const [form, setForm] = useState({ code: "", libelle: "", valeur_min: "", valeur_max: "" });
  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("criteres").insert({
        code: form.code, libelle: form.libelle,
        valeur_min: form.valeur_min ? Number(form.valeur_min) : null,
        valeur_max: form.valeur_max ? Number(form.valeur_max) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Critère ajouté"); qc.invalidateQueries({ queryKey: ["criteres"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input className="pl-8 h-8 text-xs" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Critère</Button>
      </div>
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div> : filtered.length === 0 ? (
        <EmptyState icon={Target} title="Aucun critère" description="Définissez les seuils de conformité." />
      ) : (
        <div className="rounded-md border border-border/60 bg-card">
          <Table><TableHeader><TableRow className="text-[10px]"><TableHead>Code</TableHead><TableHead>Libellé</TableHead><TableHead className="text-right">Min</TableHead><TableHead className="text-right">Max</TableHead></TableRow></TableHeader>
            <TableBody>{filtered.map(r => (
              <TableRow key={r.id} className="text-xs"><TableCell className="font-mono">{r.code}</TableCell><TableCell>{r.libelle}</TableCell>
                <TableCell className="text-right tabular-nums">{r.valeur_min ?? "—"}</TableCell><TableCell className="text-right tabular-nums">{r.valeur_max ?? "—"}</TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nouveau critère</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Code *</Label><Input className="h-8 text-xs" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div><div><Label className="text-xs">Libellé</Label><Input className="h-8 text-xs" value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Seuil Min</Label><Input type="number" className="h-8 text-xs" value={form.valeur_min} onChange={e => setForm({ ...form, valeur_min: e.target.value })} /></div><div><Label className="text-xs">Seuil Max</Label><Input type="number" className="h-8 text-xs" value={form.valeur_max} onChange={e => setForm({ ...form, valeur_max: e.target.value })} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={() => create.mutate()} disabled={create.isPending}>Ajouter</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ========== PACKS ========== */
function PacksTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["pack_analyses"],
    queryFn: async () => { const { data, error } = await supabase.from("pack_analyses").select("*").order("code"); if (error) throw error; return data as any[]; },
  });

  const [form, setForm] = useState({ code: "", libelle: "", avec_declaration_conformite: false });
  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pack_analyses").insert({ code: form.code, libelle: form.libelle, avec_declaration_conformite: form.avec_declaration_conformite });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pack créé"); qc.invalidateQueries({ queryKey: ["pack_analyses"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Pack</Button></div>
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div> : rows.length === 0 ? (
        <EmptyState icon={Layers} title="Aucun pack" description="Les packs regroupent plusieurs analyses en forfait." />
      ) : (
        <div className="rounded-md border border-border/60 bg-card">
          <Table><TableHeader><TableRow className="text-[10px]"><TableHead>Code</TableHead><TableHead>Libellé</TableHead><TableHead>Décl. conformité</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map((r: any) => (
              <TableRow key={r.id} className="text-xs"><TableCell className="font-mono">{r.code}</TableCell><TableCell>{r.libelle}</TableCell><TableCell>{r.avec_declaration_conformite ? <Badge>Oui</Badge> : "Non"}</TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nouveau pack d'analyses</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Code *</Label><Input className="h-8 text-xs" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
            <div><Label className="text-xs">Libellé</Label><Input className="h-8 text-xs" value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.avec_declaration_conformite} onCheckedChange={v => setForm({ ...form, avec_declaration_conformite: v })} /><Label className="text-xs">Avec déclaration de conformité</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={() => create.mutate()} disabled={create.isPending}>Créer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ========== NORMES ========== */
function NormesTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["referentiels"],
    queryFn: async () => { const { data, error } = await supabase.from("referentiels").select("*").order("code"); if (error) throw error; return data as any[]; },
  });

  const [form, setForm] = useState({ code: "", libelle: "", organisme: "" });
  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("referentiels").insert({ code: form.code, libelle: form.libelle, organisme: form.organisme || null });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Référentiel ajouté"); qc.invalidateQueries({ queryKey: ["referentiels"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Référentiel</Button></div>
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div> : rows.length === 0 ? (
        <EmptyState icon={BookOpen} title="Aucun référentiel" description="Ajoutez les normes et organismes." />
      ) : (
        <div className="rounded-md border border-border/60 bg-card">
          <Table><TableHeader><TableRow className="text-[10px]"><TableHead>Code</TableHead><TableHead>Libellé</TableHead><TableHead>Organisme</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map((r: any) => (
              <TableRow key={r.id} className="text-xs"><TableCell className="font-mono">{r.code}</TableCell><TableCell>{r.libelle}</TableCell><TableCell className="text-muted-foreground">{r.organisme || "—"}</TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nouveau référentiel</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Code *</Label><Input className="h-8 text-xs" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
            <div><Label className="text-xs">Libellé</Label><Input className="h-8 text-xs" value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} /></div>
            <div><Label className="text-xs">Organisme</Label><Input className="h-8 text-xs" value={form.organisme} onChange={e => setForm({ ...form, organisme: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={() => create.mutate()} disabled={create.isPending}>Ajouter</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
