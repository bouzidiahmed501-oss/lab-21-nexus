import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
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
import {
  Plus, Search, BookOpen, Layers, FolderTree, FlaskConical, Loader2,
  Target, Pencil, Trash2, Upload, Download, ChevronRight,
} from "lucide-react";

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
  const [editing, setEditing] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const blankForm = { code: "", libelle: "", prix: "0", code_norme: "", accredite: false, incertitude: "", code_norme_reference: "", titre_norme: "" };
  const [form, setForm] = useState(blankForm);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.code || !form.libelle) throw new Error("Code et libellé requis");
      const payload = {
        code: form.code, libelle: form.libelle, prix: Number(form.prix),
        code_norme: form.code_norme || null, accredite: form.accredite,
        incertitude: form.incertitude || null,
        code_norme_reference: form.code_norme_reference || null,
        titre_norme: form.titre_norme || null,
      };
      if (editing) {
        const { error } = await supabase.from("catalogue_analyses").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("catalogue_analyses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Analyse modifiée" : "Analyse ajoutée");
      qc.invalidateQueries({ queryKey: ["catalogue_analyses"] });
      setOpen(false); setEditing(null); setForm(blankForm);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("catalogue_analyses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["catalogue_analyses"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (r: any) => {
    setEditing(r);
    setForm({
      code: r.code, libelle: r.libelle || "", prix: String(r.prix || 0),
      code_norme: r.code_norme || "", accredite: !!r.accredite,
      incertitude: r.incertitude || "", code_norme_reference: r.code_norme_reference || "",
      titre_norme: r.titre_norme || "",
    });
    setOpen(true);
  };

  const exportCSV = () => {
    const header = "code;libelle;prix;code_norme;accredite;incertitude";
    const lines = rows.map(r => `${r.code};${r.libelle};${r.prix};${r.code_norme || ""};${r.accredite ? "1" : "0"};${r.incertitude || ""}`);
    const blob = new Blob([header + "\n" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "catalogue_analyses.csv"; a.click();
  };

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim()).slice(1);
    let count = 0;
    for (const line of lines) {
      const [code, libelle, prix, code_norme, accredite, incertitude] = line.split(";").map(s => s.trim());
      if (!code) continue;
      const { error } = await supabase.from("catalogue_analyses").upsert({
        code, libelle: libelle || code, prix: Number(prix) || 0,
        code_norme: code_norme || null, accredite: accredite === "1",
        incertitude: incertitude || null,
      }, { onConflict: "code" });
      if (!error) count++;
    }
    toast.success(`${count} analyses importées`);
    qc.invalidateQueries({ queryKey: ["catalogue_analyses"] });
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8 h-8 text-xs" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Badge variant="outline" className="text-[10px]">{filtered.length} / {rows.length}</Badge>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={exportCSV}><Download className="h-3.5 w-3.5 mr-1" /> CSV</Button>
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload className="h-3.5 w-3.5 mr-1" /> Importer
        </Button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importCSV} />
        <Button size="sm" onClick={() => { setEditing(null); setForm(blankForm); setOpen(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Analyse
        </Button>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div> : filtered.length === 0 ? (
        <EmptyState icon={FlaskConical} title="Catalogue vide" description="Ajoutez vos analyses avec codes normes et prix." action={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Ajouter</Button>} />
      ) : (
        <div className="rounded-md border border-border/60 bg-card">
          <Table>
            <TableHeader><TableRow className="text-[10px]">
              <TableHead>Code</TableHead><TableHead>Libellé</TableHead><TableHead>Type</TableHead>
              <TableHead>Norme</TableHead><TableHead className="text-right">Prix (DT)</TableHead>
              <TableHead>Accr.</TableHead><TableHead>Incertitude</TableHead><TableHead className="w-16" />
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
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(r)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => remove.mutate(r.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(blankForm); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Modifier l'analyse" : "Nouvelle analyse au catalogue"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Code *</Label><Input className="h-8 text-xs" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
              <div><Label className="text-xs">Prix (DT)</Label><Input type="number" className="h-8 text-xs" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Libellé *</Label><Input className="h-8 text-xs" value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Code norme</Label><Input className="h-8 text-xs" value={form.code_norme} onChange={e => setForm({ ...form, code_norme: e.target.value })} /></div>
              <div><Label className="text-xs">Réf. norme</Label><Input className="h-8 text-xs" value={form.code_norme_reference} onChange={e => setForm({ ...form, code_norme_reference: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Titre norme</Label><Input className="h-8 text-xs" value={form.titre_norme} onChange={e => setForm({ ...form, titre_norme: e.target.value })} /></div>
            <div><Label className="text-xs">Incertitude</Label><Input className="h-8 text-xs" value={form.incertitude} onChange={e => setForm({ ...form, incertitude: e.target.value })} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.accredite} onCheckedChange={v => setForm({ ...form, accredite: v })} />
              <Label className="text-xs">Analyse accréditée (COFRAC / TUNAC)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              {editing ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ========== FAMILLES (arborescence) ========== */
function FamillesTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", libelle: "", super_famille_id: "" });

  const { data: superFamilles = [] } = useQuery({
    queryKey: ["super_familles"],
    queryFn: async () => { const { data } = await supabase.from("super_familles").select("*").order("ordre"); return (data ?? []) as any[]; },
  });
  const { data: familles = [] } = useQuery({
    queryKey: ["familles"],
    queryFn: async () => { const { data } = await supabase.from("familles").select("*, super_familles(libelle)").order("code"); return (data ?? []) as any[]; },
  });
  const { data: criteres = [] } = useQuery({
    queryKey: ["criteres"],
    queryFn: async () => { const { data } = await supabase.from("criteres").select("code, libelle, famille_id").order("code"); return (data ?? []) as any[]; },
  });

  const [sfForm, setSfForm] = useState({ code: "", libelle: "", prix_defaut: "0" });
  const [openSf, setOpenSf] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const createSf = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("super_familles").insert({ code: sfForm.code, libelle: sfForm.libelle, prix_defaut: Number(sfForm.prix_defaut) });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Super-famille créée"); qc.invalidateQueries({ queryKey: ["super_familles"] }); setOpenSf(false); setSfForm({ code: "", libelle: "", prix_defaut: "0" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const createFam = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("familles").insert({
        code: form.code, libelle: form.libelle,
        super_famille_id: form.super_famille_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Famille créée"); qc.invalidateQueries({ queryKey: ["familles"] }); setOpen(false); setForm({ code: "", libelle: "", super_famille_id: "" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeSf = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("super_familles").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["super_familles"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeFam = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("familles").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["familles"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {/* Arborescence visuelle */}
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Arborescence Super-Familles → Familles → Critères</h3>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => setOpenSf(true)}><Plus className="h-3 w-3 mr-1" /> Super-famille</Button>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="h-3 w-3 mr-1" /> Famille</Button>
        </div>
      </div>

      {superFamilles.length === 0 && familles.length === 0 ? (
        <EmptyState icon={FolderTree} title="Aucune hiérarchie" description="Créez des super-familles puis des familles." />
      ) : (
        <div className="rounded-md border border-border/60 bg-card divide-y divide-border/40">
          {superFamilles.map((sf: any) => {
            const sfFamilles = familles.filter((f: any) => f.super_famille_id === sf.id);
            const isExp = expanded === sf.id;
            return (
              <div key={sf.id}>
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 cursor-pointer" onClick={() => setExpanded(isExp ? null : sf.id)}>
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExp ? "rotate-90" : ""}`} />
                  <span className="font-mono text-xs font-medium text-primary">{sf.code}</span>
                  <span className="text-xs flex-1">{sf.libelle}</span>
                  <Badge variant="outline" className="text-[9px]">{sfFamilles.length} fam.</Badge>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{Number(sf.prix_defaut || 0).toFixed(3)} DT</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={(e) => { e.stopPropagation(); removeSf.mutate(sf.id); }}><Trash2 className="h-3 w-3" /></Button>
                </div>
                {isExp && sfFamilles.length > 0 && (
                  <div className="ml-6 border-l border-border/40">
                    {sfFamilles.map((f: any) => {
                      const fCriteres = criteres.filter((c: any) => c.famille_id === f.id);
                      return (
                        <div key={f.id} className="pl-3 py-1.5 border-b border-border/20 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-muted-foreground">{f.code}</span>
                            <span className="text-xs flex-1">{f.libelle}</span>
                            <Badge variant="secondary" className="text-[9px]">{fCriteres.length} crit.</Badge>
                            <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeFam.mutate(f.id)}><Trash2 className="h-2.5 w-2.5" /></Button>
                          </div>
                          {fCriteres.length > 0 && (
                            <div className="ml-4 mt-1 space-y-0.5">
                              {fCriteres.slice(0, 5).map((c: any) => (
                                <span key={c.code} className="inline-block mr-2 text-[10px] text-muted-foreground">{c.code} {c.libelle ? `(${c.libelle})` : ""}</span>
                              ))}
                              {fCriteres.length > 5 && <span className="text-[10px] text-muted-foreground">+{fCriteres.length - 5} de plus…</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {/* Orphan familles (no super_famille) */}
          {familles.filter((f: any) => !f.super_famille_id).length > 0 && (
            <div>
              <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sans super-famille</div>
              {familles.filter((f: any) => !f.super_famille_id).map((f: any) => (
                <div key={f.id} className="flex items-center gap-2 px-6 py-1.5">
                  <span className="font-mono text-[10px]">{f.code}</span>
                  <span className="text-xs flex-1">{f.libelle}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeFam.mutate(f.id)}><Trash2 className="h-2.5 w-2.5" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
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
            <div>
              <Label className="text-xs">Super-Famille</Label>
              <Select value={form.super_famille_id} onValueChange={v => setForm({ ...form, super_famille_id: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Aucune" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune</SelectItem>
                  {superFamilles.map((sf: any) => <SelectItem key={sf.id} value={sf.id}>{sf.code} — {sf.libelle}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
  const [editing, setEditing] = useState<any | null>(null);
  const [familleFilter, setFamilleFilter] = useState("all");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["criteres"],
    queryFn: async () => { const { data, error } = await supabase.from("criteres").select("*, familles(code, libelle)").order("code"); if (error) throw error; return data as any[]; },
  });
  const { data: familles = [] } = useQuery({
    queryKey: ["familles"],
    queryFn: async () => { const { data } = await supabase.from("familles").select("id, code, libelle").order("code"); return (data ?? []) as any[]; },
  });

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || [r.code, r.libelle].filter(Boolean).some((s: string) => s.toLowerCase().includes(q));
    const matchFam = familleFilter === "all" || r.famille_id === familleFilter;
    return matchSearch && matchFam;
  });

  const blankForm = { code: "", libelle: "", valeur_min: "", valeur_max: "", famille_id: "", valeurs: "", origine: "", quantite_testee: "" };
  const [form, setForm] = useState(blankForm);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.code) throw new Error("Code requis");
      const payload = {
        code: form.code, libelle: form.libelle || null,
        valeur_min: form.valeur_min ? Number(form.valeur_min) : null,
        valeur_max: form.valeur_max ? Number(form.valeur_max) : null,
        famille_id: form.famille_id || null,
        valeurs: form.valeurs || null,
        origine: form.origine || null,
        quantite_testee: form.quantite_testee || null,
      };
      if (editing) {
        const { error } = await supabase.from("criteres").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("criteres").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Critère modifié" : "Critère ajouté");
      qc.invalidateQueries({ queryKey: ["criteres"] });
      setOpen(false); setEditing(null); setForm(blankForm);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("criteres").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["criteres"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (r: any) => {
    setEditing(r);
    setForm({
      code: r.code, libelle: r.libelle || "", valeur_min: r.valeur_min != null ? String(r.valeur_min) : "",
      valeur_max: r.valeur_max != null ? String(r.valeur_max) : "", famille_id: r.famille_id || "",
      valeurs: r.valeurs || "", origine: r.origine || "", quantite_testee: r.quantite_testee || "",
    });
    setOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input className="pl-8 h-8 text-xs" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={familleFilter} onValueChange={setFamilleFilter}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Famille" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes familles</SelectItem>
            {familles.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.code} — {f.libelle}</SelectItem>)}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-[10px]">{filtered.length}</Badge>
        <div className="flex-1" />
        <Button size="sm" onClick={() => { setEditing(null); setForm(blankForm); setOpen(true); }}><Plus className="h-3.5 w-3.5 mr-1" /> Critère</Button>
      </div>
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div> : filtered.length === 0 ? (
        <EmptyState icon={Target} title="Aucun critère" description="Définissez les seuils de conformité." />
      ) : (
        <div className="rounded-md border border-border/60 bg-card">
          <Table><TableHeader><TableRow className="text-[10px]">
            <TableHead>Code</TableHead><TableHead>Libellé</TableHead><TableHead>Famille</TableHead>
            <TableHead className="text-right">Min</TableHead><TableHead className="text-right">Max</TableHead>
            <TableHead>Valeurs</TableHead><TableHead className="w-16" />
          </TableRow></TableHeader>
            <TableBody>{filtered.map(r => (
              <TableRow key={r.id} className="text-xs">
                <TableCell className="font-mono">{r.code}</TableCell>
                <TableCell>{r.libelle || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-[10px]">{r.familles?.code || "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{r.valeur_min ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{r.valeur_max ?? "—"}</TableCell>
                <TableCell className="text-[10px] text-muted-foreground max-w-[120px] truncate">{r.valeurs || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(r)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => remove.mutate(r.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </div>
      )}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(blankForm); } }}>
        <DialogContent><DialogHeader><DialogTitle>{editing ? "Modifier le critère" : "Nouveau critère"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Code *</Label><Input className="h-8 text-xs" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
              <div><Label className="text-xs">Libellé</Label><Input className="h-8 text-xs" value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} /></div>
            </div>
            <div>
              <Label className="text-xs">Famille</Label>
              <Select value={form.famille_id} onValueChange={v => setForm({ ...form, famille_id: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Aucune" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune</SelectItem>
                  {familles.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.code} — {f.libelle}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Seuil Min</Label><Input type="number" className="h-8 text-xs" value={form.valeur_min} onChange={e => setForm({ ...form, valeur_min: e.target.value })} /></div>
              <div><Label className="text-xs">Seuil Max</Label><Input type="number" className="h-8 text-xs" value={form.valeur_max} onChange={e => setForm({ ...form, valeur_max: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Valeurs textuelles (séparées par ;)</Label><Input className="h-8 text-xs" value={form.valeurs} onChange={e => setForm({ ...form, valeurs: e.target.value })} placeholder="Conforme;Non conforme;Absence;Présence" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Origine</Label><Input className="h-8 text-xs" value={form.origine} onChange={e => setForm({ ...form, origine: e.target.value })} /></div>
              <div><Label className="text-xs">Quantité testée</Label><Input className="h-8 text-xs" value={form.quantite_testee} onChange={e => setForm({ ...form, quantite_testee: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={() => save.mutate()} disabled={save.isPending}>{editing ? "Enregistrer" : "Ajouter"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ========== PACKS (with composition) ========== */
function PacksTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<any | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["pack_analyses"],
    queryFn: async () => { const { data, error } = await supabase.from("pack_analyses").select("*").order("code"); if (error) throw error; return data as any[]; },
  });

  const { data: lignes = [] } = useQuery({
    queryKey: ["lignes_pack_analyse"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lignes_pack_analyse").select("*, catalogue_analyses(code, libelle), criteres(code, libelle)").order("ordre");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: catalogue = [] } = useQuery({
    queryKey: ["catalogue_analyses"],
    queryFn: async () => { const { data } = await supabase.from("catalogue_analyses").select("id, code, libelle").order("code"); return (data ?? []) as any[]; },
  });

  const [form, setForm] = useState({ code: "", libelle: "", avec_declaration_conformite: false });
  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pack_analyses").insert({ code: form.code, libelle: form.libelle, avec_declaration_conformite: form.avec_declaration_conformite });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pack créé"); qc.invalidateQueries({ queryKey: ["pack_analyses"] }); setOpen(false); setForm({ code: "", libelle: "", avec_declaration_conformite: false }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addLigne = useMutation({
    mutationFn: async ({ packId, catalogueId }: { packId: string; catalogueId: string }) => {
      const { error } = await supabase.from("lignes_pack_analyse").insert({ pack_analyse_id: packId, catalogue_analyse_id: catalogueId });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Analyse ajoutée au pack"); qc.invalidateQueries({ queryKey: ["lignes_pack_analyse"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeLigne = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("lignes_pack_analyse").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Retiré"); qc.invalidateQueries({ queryKey: ["lignes_pack_analyse"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removePack = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("pack_analyses").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Pack supprimé"); qc.invalidateQueries({ queryKey: ["pack_analyses"] }); setSelectedPack(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [addAnalyseId, setAddAnalyseId] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Pack</Button></div>
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div> : rows.length === 0 ? (
        <EmptyState icon={Layers} title="Aucun pack" description="Les packs regroupent plusieurs analyses en forfait." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pack list */}
          <div className="rounded-md border border-border/60 bg-card divide-y divide-border/40">
            {rows.map((r: any) => {
              const packLignes = lignes.filter((l: any) => l.pack_analyse_id === r.id);
              const active = selectedPack?.id === r.id;
              return (
                <div key={r.id} className={`px-3 py-2 cursor-pointer hover:bg-muted/30 ${active ? "bg-primary/5 border-l-2 border-primary" : ""}`} onClick={() => setSelectedPack(r)}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium">{r.code}</span>
                    <span className="text-xs flex-1 truncate">{r.libelle}</span>
                    <Badge variant="secondary" className="text-[9px]">{packLignes.length}</Badge>
                  </div>
                  {r.avec_declaration_conformite && <span className="text-[9px] text-muted-foreground">✓ Décl. conformité</span>}
                </div>
              );
            })}
          </div>

          {/* Pack detail */}
          <div className="md:col-span-2">
            {selectedPack ? (
              <div className="rounded-md border border-border/60 bg-card p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-semibold">{selectedPack.code} — {selectedPack.libelle}</h4>
                    {selectedPack.avec_declaration_conformite && <Badge className="text-[9px] mt-1">Décl. conformité</Badge>}
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => removePack.mutate(selectedPack.id)}><Trash2 className="h-3 w-3 mr-1" /> Supprimer</Button>
                </div>

                <div className="flex gap-2 items-center">
                  <Select value={addAnalyseId} onValueChange={setAddAnalyseId}>
                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Ajouter une analyse…" /></SelectTrigger>
                    <SelectContent>
                      {catalogue.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.code} — {c.libelle}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" disabled={!addAnalyseId} onClick={() => { addLigne.mutate({ packId: selectedPack.id, catalogueId: addAnalyseId }); setAddAnalyseId(""); }}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {lignes.filter((l: any) => l.pack_analyse_id === selectedPack.id).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune analyse dans ce pack</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow className="text-[10px]"><TableHead>#</TableHead><TableHead>Code</TableHead><TableHead>Libellé</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
                    <TableBody>
                      {lignes.filter((l: any) => l.pack_analyse_id === selectedPack.id).map((l: any, i: number) => (
                        <TableRow key={l.id} className="text-xs">
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="font-mono">{l.catalogue_analyses?.code || l.criteres?.code || "—"}</TableCell>
                          <TableCell>{l.catalogue_analyses?.libelle || l.criteres?.libelle || "—"}</TableCell>
                          <TableCell><Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeLigne.mutate(l.id)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">Sélectionnez un pack pour voir sa composition</div>
            )}
          </div>
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
  const [editing, setEditing] = useState<any | null>(null);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["referentiels"],
    queryFn: async () => { const { data, error } = await supabase.from("referentiels").select("*").order("code"); if (error) throw error; return data as any[]; },
  });

  const blankForm = { code: "", libelle: "", organisme: "" };
  const [form, setForm] = useState(blankForm);

  const save = useMutation({
    mutationFn: async () => {
      const payload = { code: form.code, libelle: form.libelle, organisme: form.organisme || null };
      if (editing) {
        const { error } = await supabase.from("referentiels").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("referentiels").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? "Modifié" : "Référentiel ajouté"); qc.invalidateQueries({ queryKey: ["referentiels"] }); setOpen(false); setEditing(null); setForm(blankForm); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("referentiels").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["referentiels"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button size="sm" onClick={() => { setEditing(null); setForm(blankForm); setOpen(true); }}><Plus className="h-3.5 w-3.5 mr-1" /> Référentiel</Button></div>
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div> : rows.length === 0 ? (
        <EmptyState icon={BookOpen} title="Aucun référentiel" description="Ajoutez les normes et organismes." />
      ) : (
        <div className="rounded-md border border-border/60 bg-card">
          <Table><TableHeader><TableRow className="text-[10px]"><TableHead>Code</TableHead><TableHead>Libellé</TableHead><TableHead>Organisme</TableHead><TableHead className="w-16" /></TableRow></TableHeader>
            <TableBody>{rows.map((r: any) => (
              <TableRow key={r.id} className="text-xs">
                <TableCell className="font-mono">{r.code}</TableCell>
                <TableCell>{r.libelle}</TableCell>
                <TableCell className="text-muted-foreground">{r.organisme || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditing(r); setForm({ code: r.code, libelle: r.libelle || "", organisme: r.organisme || "" }); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => remove.mutate(r.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </div>
      )}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(blankForm); } }}>
        <DialogContent><DialogHeader><DialogTitle>{editing ? "Modifier le référentiel" : "Nouveau référentiel"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Code *</Label><Input className="h-8 text-xs" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
            <div><Label className="text-xs">Libellé</Label><Input className="h-8 text-xs" value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} /></div>
            <div><Label className="text-xs">Organisme</Label><Input className="h-8 text-xs" value={form.organisme} onChange={e => setForm({ ...form, organisme: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={() => save.mutate()} disabled={save.isPending}>{editing ? "Enregistrer" : "Ajouter"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
