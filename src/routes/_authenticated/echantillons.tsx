import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { EmptyState } from "@/components/lab/EmptyState";
import { EchantillonDetailSheet } from "@/components/lab/EchantillonDetailSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Search, TestTubes, Loader2, History, Split } from "lucide-react";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/echantillons")({
  head: () => ({ meta: [{ title: "Échantillons — BALIMS" }] }),
  component: EchantillonsPage,
});

const STATUTS = [
  { value: "recu", label: "Reçu", color: "bg-blue-100 text-blue-800" },
  { value: "en_attente", label: "En attente", color: "bg-amber-100 text-amber-800" },
  { value: "en_analyse", label: "En analyse", color: "bg-purple-100 text-purple-800" },
  { value: "analyse", label: "Analysé", color: "bg-green-100 text-green-800" },
  { value: "archive", label: "Archivé", color: "bg-slate-100 text-slate-700" },
  { value: "detruit", label: "Détruit", color: "bg-red-100 text-red-800" },
];

function statusBadge(s: string) {
  const st = STATUTS.find((x) => x.value === s);
  return <Badge className={st?.color ?? ""}>{st?.label ?? s}</Badge>;
}

function EchantillonsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [histOpen, setHistOpen] = useState<string | null>(null);
  const [aliquotFor, setAliquotFor] = useState<any | null>(null);
  const [aliquotNb, setAliquotNb] = useState("2");
  const [aliquotVol, setAliquotVol] = useState("");
  const [detail, setDetail] = useState<any | null>(null);


  const { data: items = [], isLoading } = useQuery({
    queryKey: ["echantillons"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("echantillons" as never) as any)
        .select("*").order("date_reception", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const aliquotCount = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of items as any[]) if (e.parent_id) m[e.parent_id] = (m[e.parent_id] ?? 0) + 1;
    return m;
  }, [items]);

  const filtered = useMemo(

    () => items.filter((e: any) =>
      !search || e.code_barre?.toLowerCase().includes(search.toLowerCase()) ||
      e.designation?.toLowerCase().includes(search.toLowerCase())
    ),
    [items, search]
  );

  const [form, setForm] = useState({
    code_barre: "",
    designation: "",
    type_echantillon: "",
    statut: "recu",
    emplacement: "",
    temperature_stockage: "",
    date_conservation_fin: "",
    volume_quantite: "",
    notes: "",
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const code = form.code_barre || `ECH${Date.now().toString().slice(-8)}`;
      const payload = {
        ...form,
        code_barre: code,
        temperature_stockage: form.temperature_stockage ? Number(form.temperature_stockage) : null,
        date_conservation_fin: form.date_conservation_fin || null,
        created_by: userData.user?.id,
      };
      const { data, error } = await (supabase.from("echantillons" as never) as any).insert(payload).select().single();
      if (error) throw error;
      await (supabase.from("echantillon_historique" as never) as any).insert({
        echantillon_id: data.id, action: "creation", nouveau_statut: form.statut,
        emplacement: form.emplacement, user_id: userData.user?.id,
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Échantillon enregistré");
      setOpen(false);
      setForm({ code_barre: "", designation: "", type_echantillon: "", statut: "recu", emplacement: "", temperature_stockage: "", date_conservation_fin: "", volume_quantite: "", notes: "" });
      qc.invalidateQueries({ queryKey: ["echantillons"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut, ancien }: { id: string; statut: string; ancien: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await (supabase.from("echantillons" as never) as any).update({ statut }).eq("id", id);
      if (error) throw error;
      await (supabase.from("echantillon_historique" as never) as any).insert({
        echantillon_id: id, action: "changement_statut",
        ancien_statut: ancien, nouveau_statut: statut, user_id: userData.user?.id,
      });
    },
    onSuccess: () => {
      toast.success("Statut mis à jour");
      qc.invalidateQueries({ queryKey: ["echantillons"] });
    },
  });

  const { data: histo = [] } = useQuery({
    queryKey: ["echantillon_historique", histOpen],
    queryFn: async () => {
      if (!histOpen) return [];
      const { data } = await (supabase.from("echantillon_historique" as never) as any)
        .select("*").eq("echantillon_id", histOpen).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!histOpen,
  });

  const createAliquots = useMutation({
    mutationFn: async ({ parent, nb, volume }: { parent: any; nb: number; volume: string }) => {
      if (nb < 1 || nb > 20) throw new Error("Nombre d'aliquots invalide (1 à 20)");
      const { data: userData } = await supabase.auth.getUser();
      const { data: existing } = await (supabase.from("echantillons" as never) as any)
        .select("aliquot_index").eq("parent_id", parent.id);
      const start = (existing ?? []).reduce((m: number, r: any) => Math.max(m, r.aliquot_index ?? 0), 0);
      const rows = Array.from({ length: nb }, (_, i) => {
        const idx = start + i + 1;
        return {
          code_barre: `${parent.code_barre}-A${idx}`,
          designation: `${parent.designation} — aliquot ${idx}`,
          type_echantillon: parent.type_echantillon,
          prelevement_id: parent.prelevement_id,
          parent_id: parent.id,
          aliquot_index: idx,
          statut: "recu",
          emplacement: parent.emplacement,
          emplacement_id: parent.emplacement_id,
          temperature_stockage: parent.temperature_stockage,
          date_conservation_fin: parent.date_conservation_fin,
          volume_quantite: volume || null,
          created_by: userData.user?.id,
        };
      });
      const { data, error } = await (supabase.from("echantillons" as never) as any).insert(rows).select("id, code_barre");
      if (error) throw error;
      await (supabase.from("echantillon_historique" as never) as any).insert(
        (data ?? []).map((d: any) => ({
          echantillon_id: d.id, action: "creation_aliquot", nouveau_statut: "recu", user_id: userData.user?.id,
        })),
      );
      return data ?? [];
    },
    onSuccess: (created: any[]) => {
      toast.success(`${created.length} aliquot(s) créé(s)`);
      setAliquotFor(null);
      qc.invalidateQueries({ queryKey: ["echantillons"] });
    },
    onError: (e: any) => toast.error(e.message),
  });


  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Échantillons"
        description="Cycle de vie complet : réception, analyse, archivage, destruction (ISO 17025 §7.4)"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nouvel échantillon
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Recherche code / désignation..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={TestTubes} title="Aucun échantillon" description="Enregistrez un échantillon à la réception ou scannez son code-barres depuis l\u2019écran Scan réception." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Désignation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Emplacement</TableHead>
                  <TableHead>Réception</TableHead>
                  <TableHead>Fin conservation</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e: any) => (
                  <TableRow key={e.id} className="cursor-pointer" onClick={() => setDetail(e)}>
                    <TableCell className="font-mono text-xs">{e.code_barre}</TableCell>
                    <TableCell className="font-medium">
                      <span className={e.parent_id ? "pl-3 text-muted-foreground" : ""}>{e.designation}</span>
                      {e.parent_id && <Badge variant="outline" className="ml-2 text-[10px]">aliquot</Badge>}
                      {!e.parent_id && aliquotCount[e.id] > 0 && (
                        <Badge variant="outline" className="ml-2 text-[10px]">{aliquotCount[e.id]} aliquots</Badge>
                      )}
                    </TableCell>
                    <TableCell>{e.type_echantillon ?? "—"}</TableCell>
                    <TableCell onClick={(ev) => ev.stopPropagation()}>
                      <Select value={e.statut} onValueChange={(v) => updateStatut.mutate({ id: e.id, statut: v, ancien: e.statut })}>
                        <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs">{e.emplacement ?? "—"}{e.temperature_stockage != null ? ` (${e.temperature_stockage}°C)` : ""}</TableCell>
                    <TableCell className="text-xs">{formatDate(e.date_reception)}</TableCell>
                    <TableCell className="text-xs">{e.date_conservation_fin ? formatDate(e.date_conservation_fin) : "—"}</TableCell>
                    <TableCell onClick={(ev) => ev.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" title="Historique" onClick={() => setHistOpen(e.id)}>
                          <History className="h-3.5 w-3.5" />
                        </Button>
                        {!e.parent_id && (
                          <Button variant="ghost" size="sm" title="Créer des aliquots" onClick={() => { setAliquotNb("2"); setAliquotVol(""); setAliquotFor(e); }}>
                            <Split className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EchantillonDetailSheet
        echantillon={detail}
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nouvel échantillon</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Code barre (auto si vide)</Label><Input value={form.code_barre} onChange={(e) => setForm({ ...form, code_barre: e.target.value })} /></div>
            <div><Label>Désignation *</Label><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
            <div><Label>Type</Label><Input value={form.type_echantillon} onChange={(e) => setForm({ ...form, type_echantillon: e.target.value })} placeholder="Eau, alimentaire..." /></div>
            <div>
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Emplacement</Label><Input value={form.emplacement} onChange={(e) => setForm({ ...form, emplacement: e.target.value })} placeholder="Frigo A / Étagère 3" /></div>
            <div><Label>Température (°C)</Label><Input type="number" step="0.1" value={form.temperature_stockage} onChange={(e) => setForm({ ...form, temperature_stockage: e.target.value })} /></div>
            <div><Label>Volume / quantité</Label><Input value={form.volume_quantite} onChange={(e) => setForm({ ...form, volume_quantite: e.target.value })} /></div>
            <div><Label>Fin conservation</Label><Input type="date" value={form.date_conservation_fin} onChange={(e) => setForm({ ...form, date_conservation_fin: e.target.value })} /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={() => createMut.mutate()} disabled={!form.designation || createMut.isPending}>
              {createMut.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!histOpen} onOpenChange={(o) => !o && setHistOpen(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Historique (chain of custody)</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {histo.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun mouvement.</p>
            ) : histo.map((h: any) => (
              <div key={h.id} className="border-l-2 border-primary/40 pl-3 py-1 text-xs">
                <div className="font-medium">{h.action}</div>
                <div className="text-muted-foreground">
                  {h.ancien_statut && `${h.ancien_statut} → `}{h.nouveau_statut}
                  {h.emplacement && ` — ${h.emplacement}`}
                </div>
                <div className="text-muted-foreground">{formatDate(h.created_at)}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
