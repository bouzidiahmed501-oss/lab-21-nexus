import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Loader2, Package, Power } from "lucide-react";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/produits")({
  head: () => ({ meta: [{ title: "Produits — BALIMS" }] }),
  component: ProduitsPage,
});

const MATRICES = [
  "eau", "sol", "air", "alimentaire", "cosmetique",
  "pharmaceutique", "industriel", "autre",
] as const;
type Matrice = (typeof MATRICES)[number];

const schema = z.object({
  libelle: z.string().trim().min(2, "Libellé requis").max(200),
  code: z.string().trim().max(50).optional().nullable(),
  matrice: z.enum(MATRICES),
  description: z.string().trim().max(2000).optional().nullable(),
  is_active: z.boolean().default(true),
});

type ProduitForm = z.infer<typeof schema>;
interface ProduitRow extends ProduitForm { id: string }

const EMPTY: ProduitForm = {
  libelle: "", code: "", matrice: "autre", description: "", is_active: true,
};

function ProduitsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterMatrice, setFilterMatrice] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProduitRow | null>(null);
  const [form, setForm] = useState<ProduitForm>(EMPTY);

  const { data = [], isLoading } = useQuery({
    queryKey: ["produits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produits").select("*").order("libelle");
      if (error) throw error;
      return data as ProduitRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter((p) => {
      if (filterMatrice !== "all" && p.matrice !== filterMatrice) return false;
      if (!q) return true;
      return [p.libelle, p.code].filter(Boolean).some((v) => v!.toLowerCase().includes(q));
    });
  }, [data, search, filterMatrice]);

  const save = useMutation({
    mutationFn: async (input: ProduitForm) => {
      const parsed = schema.parse(input);
      if (editing) {
        const { error } = await supabase.from("produits").update(parsed).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("produits").insert(parsed);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Produit mis à jour" : "Produit créé");
      qc.invalidateQueries({ queryKey: ["produits"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (p: ProduitRow) => {
      const { error } = await supabase.from("produits").update({ is_active: !p.is_active }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["produits"] }),
  });

  return (
    <div>
      <PageHeader
        title="Produits / Matrices"
        description="Catalogue des produits et matrices analysables."
        actions={
          <Button onClick={() => { setEditing(null); setForm(EMPTY); setOpen(true); }}>
            <Plus className="h-4 w-4" /> Nouveau produit
          </Button>
        }
      />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterMatrice} onValueChange={setFilterMatrice}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes matrices</SelectItem>
              {MATRICES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Package} title="Aucun produit" />
        ) : (
          <div className="rounded-lg border border-border/60 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Matrice</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.libelle}</TableCell>
                    <TableCell className="text-muted-foreground">{p.code || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{p.matrice}</Badge></TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{p.description || "—"}</TableCell>
                    <TableCell><Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Actif" : "Inactif"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setForm(p); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => toggle.mutate(p)}>
                        <Power className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier produit" : "Nouveau produit"}</DialogTitle>
          </DialogHeader>
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
                <Label>Matrice</Label>
                <Select value={form.matrice} onValueChange={(v) => setForm({ ...form, matrice: v as Matrice })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MATRICES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <span className="text-sm">Actif</span>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
