import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Boxes, ChevronRight, Loader2, Plus, Thermometer, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/stockage")({
  head: () => ({
    meta: [
      { title: "Stockage échantillons — BALIMS" },
      { name: "description", content: "Plan de stockage du laboratoire : chambres froides, congélateurs, racks et boîtes avec suivi de température et d'occupation." },
      { property: "og:title", content: "Stockage échantillons — BALIMS" },
      { property: "og:description", content: "Gérez l'arborescence de stockage et l'emplacement précis de chaque échantillon." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StockagePage,
});

const TYPES = [
  { value: "chambre_froide", label: "Chambre froide" },
  { value: "congelateur", label: "Congélateur" },
  { value: "refrigerateur", label: "Réfrigérateur" },
  { value: "armoire", label: "Armoire" },
  { value: "etagere", label: "Étagère" },
  { value: "rack", label: "Rack" },
  { value: "boite", label: "Boîte" },
];

interface Emplacement {
  id: string;
  parent_id: string | null;
  code: string;
  libelle: string;
  type_emplacement: string;
  temperature_cible: number | null;
  capacite: number | null;
  occupation: number;
  is_active: boolean;
  notes: string | null;
}

const emptyForm = {
  code: "",
  libelle: "",
  type_emplacement: "etagere",
  parent_id: "none",
  temperature_cible: "",
  capacite: "",
  notes: "",
};

function StockagePage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [selected, setSelected] = useState<string | null>(null);

  const { data: emplacements = [], isLoading } = useQuery<Emplacement[]>({
    queryKey: ["emplacements_stockage"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("emplacements_stockage" as never) as any)
        .select("*")
        .order("code");
      if (error) throw error;
      return (data ?? []) as Emplacement[];
    },
  });

  const { data: echantillons = [] } = useQuery<any[]>({
    queryKey: ["echantillons_stockes"],
    queryFn: async () => {
      const { data } = await (supabase.from("echantillons" as never) as any)
        .select("id, code_barre, designation, statut, emplacement_id")
        .not("emplacement_id", "is", null);
      return data ?? [];
    },
  });

  const children = useMemo(() => {
    const map = new Map<string, Emplacement[]>();
    for (const e of emplacements) {
      const key = e.parent_id ?? "root";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [emplacements]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.code.trim() || !form.libelle.trim()) throw new Error("Code et libellé obligatoires");
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await (supabase.from("emplacements_stockage" as never) as any).insert({
        code: form.code.trim(),
        libelle: form.libelle.trim(),
        type_emplacement: form.type_emplacement,
        parent_id: form.parent_id === "none" ? null : form.parent_id,
        temperature_cible: form.temperature_cible === "" ? null : Number(form.temperature_cible),
        capacite: form.capacite === "" ? null : Number(form.capacite),
        notes: form.notes || null,
        created_by: userData.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Emplacement créé");
      setOpen(false);
      setForm({ ...emptyForm });
      qc.invalidateQueries({ queryKey: ["emplacements_stockage"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("emplacements_stockage" as never) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Emplacement supprimé");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["emplacements_stockage"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const selectedNode = emplacements.find((e) => e.id === selected) ?? null;
  const selectedSamples = echantillons.filter((s) => s.emplacement_id === selected);

  function Node({ node, depth }: { node: Emplacement; depth: number }) {
    const kids = children.get(node.id) ?? [];
    const taux = node.capacite ? Math.min(100, Math.round((node.occupation / node.capacite) * 100)) : null;
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelected(node.id)}
          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted ${
            selected === node.id ? "bg-muted font-medium" : ""
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-muted-foreground ${kids.length ? "" : "opacity-0"}`} />
          <Boxes className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{node.code} — {node.libelle}</span>
          {node.temperature_cible !== null && (
            <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
              <Thermometer className="mr-1 h-3 w-3" />{node.temperature_cible}°C
            </Badge>
          )}
          {taux !== null && (
            <Badge variant={taux >= 90 ? "destructive" : "secondary"} className="shrink-0 text-[10px]">{taux}%</Badge>
          )}
        </button>
        {kids.map((k) => <Node key={k.id} node={k} depth={depth + 1} />)}
      </div>
    );
  }

  const roots = children.get("root") ?? [];

  return (
    <div className="space-y-4 pb-6">
      <PageHeader
        title="Plan de stockage"
        description="Arborescence chambres froides / congélateurs / racks / boîtes avec température et taux d'occupation"
        backTo="/echantillons"
        backLabel="Échantillons"
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nouvel emplacement
          </Button>
        }
      />

      <div className="grid gap-4 px-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="p-3">
            {isLoading ? (
              <Loader2 className="mx-auto my-8 h-6 w-6 animate-spin" />
            ) : roots.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title="Aucun emplacement"
                description="Créez votre première chambre froide ou congélateur, puis ajoutez racks et boîtes à l'intérieur."
              />
            ) : (
              <div className="space-y-0.5">
                {roots.map((r) => <Node key={r.id} node={r} depth={0} />)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            {!selectedNode ? (
              <p className="text-sm text-muted-foreground">Sélectionnez un emplacement pour voir son détail.</p>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-semibold">{selectedNode.libelle}</h3>
                  <p className="font-mono text-xs text-muted-foreground">{selectedNode.code}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Type</span>
                    <p>{TYPES.find((t) => t.value === selectedNode.type_emplacement)?.label ?? selectedNode.type_emplacement}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Température cible</span>
                    <p>{selectedNode.temperature_cible !== null ? `${selectedNode.temperature_cible} °C` : "—"}</p>
                  </div>
                </div>
                {selectedNode.capacite ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Occupation</span>
                      <span>{selectedNode.occupation} / {selectedNode.capacite}</span>
                    </div>
                    <Progress value={Math.min(100, (selectedNode.occupation / selectedNode.capacite) * 100)} />
                  </div>
                ) : null}
                {selectedNode.notes && <p className="text-xs text-muted-foreground">{selectedNode.notes}</p>}
                <div>
                  <p className="mb-1 text-xs font-medium">Échantillons rangés ({selectedSamples.length})</p>
                  <div className="max-h-52 space-y-1 overflow-y-auto">
                    {selectedSamples.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Aucun échantillon dans cet emplacement.</p>
                    ) : (
                      selectedSamples.map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded border border-border px-2 py-1 text-xs">
                          <span className="font-mono">{s.code_barre}</span>
                          <span className="truncate pl-2 text-muted-foreground">{s.designation}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => deleteMut.mutate(selectedNode.id)}
                  disabled={deleteMut.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer l'emplacement
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nouvel emplacement</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Code *</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CF-01" />
            </div>
            <div>
              <Label>Libellé *</Label>
              <Input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} placeholder="Chambre froide 4°C" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type_emplacement} onValueChange={(v) => setForm({ ...form, type_emplacement: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Emplacement parent</Label>
              <Select value={form.parent_id} onValueChange={(v) => setForm({ ...form, parent_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Racine</SelectItem>
                  {emplacements.map((e) => <SelectItem key={e.id} value={e.id}>{e.code} — {e.libelle}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Température cible (°C)</Label>
              <Input type="number" value={form.temperature_cible} onChange={(e) => setForm({ ...form, temperature_cible: e.target.value })} />
            </div>
            <div>
              <Label>Capacité (nb positions)</Label>
              <Input type="number" value={form.capacite} onChange={(e) => setForm({ ...form, capacite: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
