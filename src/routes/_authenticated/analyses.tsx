import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Loader2, FlaskConical, Power, BookOpen, Beaker, Settings2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { EmptyState } from "@/components/lab/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/analyses")({
  head: () => ({ meta: [{ title: "Analyses — BALIMS" }] }),
  component: AnalysesHub,
});

function AnalysesHub() {
  return (
    <div>
      <PageHeader
        title="Analyses"
        description="Référentiel des méthodes, paramètres et accès rapide aux analyses en cours."
        actions={
          <Button asChild variant="outline">
            <Link to="/feuilles-route">Feuilles de route</Link>
          </Button>
        }
      />
      <div className="p-6">
        <Tabs defaultValue="parametres">
          <TabsList>
            <TabsTrigger value="parametres"><Beaker className="h-4 w-4" /> Paramètres</TabsTrigger>
            <TabsTrigger value="methodes"><BookOpen className="h-4 w-4" /> Méthodes</TabsTrigger>
            <TabsTrigger value="encours"><FlaskConical className="h-4 w-4" /> En cours</TabsTrigger>
            <TabsTrigger value="unites"><Settings2 className="h-4 w-4" /> Unités</TabsTrigger>
          </TabsList>
          <TabsContent value="parametres" className="mt-4"><ParametresTab /></TabsContent>
          <TabsContent value="methodes" className="mt-4"><MethodesTab /></TabsContent>
          <TabsContent value="encours" className="mt-4"><EnCoursTab /></TabsContent>
          <TabsContent value="unites" className="mt-4"><UnitesTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============== PARAMÈTRES ==============
const paramSchema = z.object({
  libelle: z.string().trim().min(2).max(200),
  code: z.string().trim().max(50).optional().nullable(),
  unite_id: z.string().uuid().optional().nullable(),
  methode_id: z.string().uuid().optional().nullable(),
  seuil_min: z.coerce.number().optional().nullable(),
  seuil_max: z.coerce.number().optional().nullable(),
  prix_unitaire: z.coerce.number().min(0).default(0),
  delai_jours: z.coerce.number().int().min(0).default(5),
  is_active: z.boolean().default(true),
});
type ParamForm = z.infer<typeof paramSchema>;
interface ParamRow extends ParamForm { id: string }

const EMPTY_PARAM: ParamForm = {
  libelle: "", code: "", unite_id: null, methode_id: null,
  seuil_min: null, seuil_max: null, prix_unitaire: 0, delai_jours: 5, is_active: true,
};

function ParametresTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ParamRow | null>(null);
  const [form, setForm] = useState<ParamForm>(EMPTY_PARAM);

  const { data = [] } = useQuery({
    queryKey: ["parametres_analyse"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parametres_analyse").select("*").order("libelle");
      if (error) throw error;
      return data as ParamRow[];
    },
  });
  const { data: unites = [] } = useQuery({
    queryKey: ["unites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("unites").select("id,libelle,symbole").order("libelle");
      if (error) throw error;
      return data;
    },
  });
  const { data: methodes = [] } = useQuery({
    queryKey: ["methodes_analyse"],
    queryFn: async () => {
      const { data, error } = await supabase.from("methodes_analyse").select("id,libelle,code").order("libelle");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return data;
    return data.filter((p) => [p.libelle, p.code].filter(Boolean).some((v) => v!.toLowerCase().includes(q)));
  }, [data, search]);

  const save = useMutation({
    mutationFn: async (input: ParamForm) => {
      const parsed = paramSchema.parse(input);
      const payload = {
        ...parsed,
        unite_id: parsed.unite_id || null,
        methode_id: parsed.methode_id || null,
      };
      if (editing) {
        const { error } = await supabase.from("parametres_analyse").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("parametres_analyse").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Paramètre enregistré");
      qc.invalidateQueries({ queryKey: ["parametres_analyse"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (p: ParamRow) => {
      const { error } = await supabase.from("parametres_analyse").update({ is_active: !p.is_active }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parametres_analyse"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => { setEditing(null); setForm(EMPTY_PARAM); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Nouveau paramètre
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Beaker} title="Aucun paramètre" />
      ) : (
        <div className="rounded-lg border border-border/60 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libellé</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Seuils</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead>Délai</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const u = unites.find((x) => x.id === p.unite_id);
                const m = methodes.find((x) => x.id === p.methode_id);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.libelle}</TableCell>
                    <TableCell className="text-muted-foreground">{p.code || "—"}</TableCell>
                    <TableCell>{u?.symbole || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m?.code || m?.libelle || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.seuil_min ?? "—"} / {p.seuil_max ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">{Number(p.prix_unitaire).toFixed(3)}</TableCell>
                    <TableCell>{p.delai_jours}j</TableCell>
                    <TableCell><Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Actif" : "Inactif"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setForm({ ...EMPTY_PARAM, ...p }); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => toggle.mutate(p)}>
                        <Power className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouveau"} paramètre</DialogTitle></DialogHeader>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(form); }}>
            <div className="space-y-2 md:col-span-2">
              <Label>Libellé *</Label>
              <Input required value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Unité</Label>
              <Select value={form.unite_id ?? "none"} onValueChange={(v) => setForm({ ...form, unite_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— aucune —</SelectItem>
                  {unites.map((u) => <SelectItem key={u.id} value={u.id}>{u.libelle} ({u.symbole})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Méthode</Label>
              <Select value={form.methode_id ?? "none"} onValueChange={(v) => setForm({ ...form, methode_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— aucune —</SelectItem>
                  {methodes.map((m) => <SelectItem key={m.id} value={m.id}>{m.code ? `${m.code} — ` : ""}{m.libelle}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Seuil min</Label>
              <Input type="number" step="0.001" value={form.seuil_min ?? ""} onChange={(e) => setForm({ ...form, seuil_min: e.target.value === "" ? null : Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Seuil max</Label>
              <Input type="number" step="0.001" value={form.seuil_max ?? ""} onChange={(e) => setForm({ ...form, seuil_max: e.target.value === "" ? null : Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Prix unitaire (TND)</Label>
              <Input type="number" step="0.001" value={form.prix_unitaire} onChange={(e) => setForm({ ...form, prix_unitaire: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Délai (jours)</Label>
              <Input type="number" min="0" value={form.delai_jours} onChange={(e) => setForm({ ...form, delai_jours: Number(e.target.value) })} />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <span className="text-sm">Actif</span>
            </div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============== MÉTHODES ==============
const methodeSchema = z.object({
  libelle: z.string().trim().min(2).max(200),
  code: z.string().trim().max(50).optional().nullable(),
  norme: z.string().trim().max(100).optional().nullable(),
  type_methode: z.string().trim().max(100).optional().nullable(),
  accreditee: z.boolean().default(false),
  description: z.string().trim().max(2000).optional().nullable(),
  is_active: z.boolean().default(true),
});
type MethodeForm = z.infer<typeof methodeSchema>;
interface MethodeRow extends MethodeForm { id: string }

const EMPTY_METHODE: MethodeForm = {
  libelle: "", code: "", norme: "", type_methode: "", accreditee: false, description: "", is_active: true,
};

function MethodesTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MethodeRow | null>(null);
  const [form, setForm] = useState<MethodeForm>(EMPTY_METHODE);

  const { data = [] } = useQuery({
    queryKey: ["methodes_analyse"],
    queryFn: async () => {
      const { data, error } = await supabase.from("methodes_analyse").select("*").order("libelle");
      if (error) throw error;
      return data as MethodeRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return data;
    return data.filter((m) => [m.libelle, m.code, m.norme].filter(Boolean).some((v) => v!.toLowerCase().includes(q)));
  }, [data, search]);

  const save = useMutation({
    mutationFn: async (input: MethodeForm) => {
      const parsed = methodeSchema.parse(input);
      if (editing) {
        const { error } = await supabase.from("methodes_analyse").update(parsed).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("methodes_analyse").insert(parsed);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Méthode enregistrée");
      qc.invalidateQueries({ queryKey: ["methodes_analyse"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => { setEditing(null); setForm(EMPTY_METHODE); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Nouvelle méthode
        </Button>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="Aucune méthode" />
      ) : (
        <div className="rounded-lg border border-border/60 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libellé</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Norme</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Accréditée</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.libelle}</TableCell>
                  <TableCell className="text-muted-foreground">{m.code || "—"}</TableCell>
                  <TableCell>{m.norme || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{m.type_methode || "—"}</TableCell>
                  <TableCell>{m.accreditee && <Badge>Accréditée</Badge>}</TableCell>
                  <TableCell><Badge variant={m.is_active ? "default" : "secondary"}>{m.is_active ? "Actif" : "Inactif"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(m); setForm({ ...EMPTY_METHODE, ...m }); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouvelle"} méthode</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(form); }}>
            <div className="space-y-2">
              <Label>Libellé *</Label>
              <Input required value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Norme</Label>
                <Input value={form.norme ?? ""} onChange={(e) => setForm({ ...form, norme: e.target.value })} placeholder="ISO 17025…" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Input value={form.type_methode ?? ""} onChange={(e) => setForm({ ...form, type_methode: e.target.value })} placeholder="chimique / microbio / physique…" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.accreditee} onCheckedChange={(v) => setForm({ ...form, accreditee: v })} />
                <span className="text-sm">Accréditée</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <span className="text-sm">Active</span>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============== UNITÉS ==============
function UnitesTab() {
  const qc = useQueryClient();
  const [code, setCode] = useState(""); const [libelle, setLibelle] = useState(""); const [symbole, setSymbole] = useState("");

  const { data = [] } = useQuery({
    queryKey: ["unites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("unites").select("*").order("libelle");
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!code || !libelle || !symbole) throw new Error("Tous les champs sont requis");
      const { error } = await supabase.from("unites").insert({ code, libelle, symbole });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Unité ajoutée");
      setCode(""); setLibelle(""); setSymbole("");
      qc.invalidateQueries({ queryKey: ["unites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border/60 bg-card p-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Code</Label>
          <Input className="w-32" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Libellé</Label>
          <Input className="w-64" value={libelle} onChange={(e) => setLibelle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Symbole</Label>
          <Input className="w-32" value={symbole} onChange={(e) => setSymbole(e.target.value)} />
        </div>
        <Button onClick={() => add.mutate()} disabled={add.isPending}>
          {add.isPending && <Loader2 className="h-4 w-4 animate-spin" />}<Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>
      <div className="rounded-lg border border-border/60 bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Libellé</TableHead><TableHead>Symbole</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-mono text-sm">{u.code}</TableCell>
                <TableCell>{u.libelle}</TableCell>
                <TableCell>{u.symbole}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ============== EN COURS ==============
function EnCoursTab() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["analyses_encours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select("id,numero,statut,date_debut,client_id,clients(raison_sociale)")
        .neq("statut", "valide_qualite")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Array<{ id: string; numero: string; statut: string; date_debut: string | null; client_id: string; clients: { raison_sociale: string } | null }>;
    },
  });

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
  if (data.length === 0) return <EmptyState icon={FlaskConical} title="Aucune analyse en cours" description="Les analyses créées depuis les feuilles de route apparaîtront ici." />;

  return (
    <div className="rounded-lg border border-border/60 bg-card">
      <Table>
        <TableHeader>
          <TableRow><TableHead>N° analyse</TableHead><TableHead>Client</TableHead><TableHead>Date début</TableHead><TableHead>Statut</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {data.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-mono text-sm">{a.numero}</TableCell>
              <TableCell>{a.clients?.raison_sociale ?? "—"}</TableCell>
              <TableCell>{a.date_debut ?? "—"}</TableCell>
              <TableCell><Badge variant="outline">{a.statut}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
