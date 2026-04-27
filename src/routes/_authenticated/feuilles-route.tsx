import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Loader2, CalendarRange, Eye } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { EmptyState } from "@/components/lab/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { nextNumero } from "@/lib/numbering";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/feuilles-route")({
  head: () => ({ meta: [{ title: "Feuilles de route — BALIMS" }] }),
  component: FRPage,
});

const STATUTS = ["planifiee", "en_cours", "terminee", "annulee"] as const;
type Statut = (typeof STATUTS)[number];
const VAR: Record<Statut, "default" | "secondary" | "outline" | "destructive"> = {
  planifiee: "outline", en_cours: "default", terminee: "secondary", annulee: "destructive",
};

interface Row {
  id: string; numero: string; date_fr: string; statut: Statut;
  laboratoire: string | null; technicien_id: string | null; notes: string | null;
}

function FRPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["feuilles_route"],
    queryFn: async () => {
      const { data, error } = await supabase.from("feuilles_route").select("*").order("date_fr", { ascending: false });
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((r) => {
      if (statutFilter !== "all" && r.statut !== statutFilter) return false;
      if (!q) return true;
      return [r.numero, r.laboratoire].filter(Boolean).some((v) => v!.toLowerCase().includes(q));
    });
  }, [rows, search, statutFilter]);

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: Statut }) => {
      const { error } = await supabase.from("feuilles_route").update({ statut }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Statut mis à jour"); qc.invalidateQueries({ queryKey: ["feuilles_route"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Feuilles de route"
        description="Planning quotidien du laboratoire — affectation des analyses aux techniciens."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouvelle FR</Button>}
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher…" className="pl-9"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statutFilter} onValueChange={setStatutFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              {STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={CalendarRange} title="Aucune feuille de route"
            description="Créez le planning du jour pour vos techniciens."
            action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouvelle FR</Button>} />
        ) : (
          <div className="rounded-lg border border-border/60 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead><TableHead>Date</TableHead>
                  <TableHead>Laboratoire</TableHead><TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm font-medium">{r.numero}</TableCell>
                    <TableCell>{formatDate(r.date_fr)}</TableCell>
                    <TableCell>{r.laboratoire || "—"}</TableCell>
                    <TableCell>
                      <Select value={r.statut} onValueChange={(v) => updateStatut.mutate({ id: r.id, statut: v as Statut })}>
                        <SelectTrigger className="h-7 w-32 text-xs"><Badge variant={VAR[r.statut]}>{r.statut}</Badge></SelectTrigger>
                        <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setViewing(r.id)}><Eye className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <NewDialog open={open} onClose={() => setOpen(false)} />
      {viewing && <ViewDialog id={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function NewDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [dateFr, setDateFr] = useState(() => new Date().toISOString().split("T")[0]);
  const [labo, setLabo] = useState("");
  const [notes, setNotes] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      z.string().max(100).parse(labo);
      z.string().max(1000).parse(notes);
      const numero = await nextNumero("FR");
      const { error } = await supabase.from("feuilles_route").insert({
        numero, date_fr: dateFr, laboratoire: labo || null, notes: notes || null, statut: "planifiee",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feuille de route créée");
      qc.invalidateQueries({ queryKey: ["feuilles_route"] });
      setLabo(""); setNotes("");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nouvelle feuille de route</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <div className="space-y-2">
            <Label>Date *</Label>
            <Input type="date" value={dateFr} onChange={(e) => setDateFr(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Laboratoire</Label>
            <Input value={labo} onChange={(e) => setLabo(e.target.value)} placeholder="Microbiologie, Physico-chimie…" maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={1000} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ViewDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: taches = [], isLoading } = useQuery({
    queryKey: ["fr_taches", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("fr_taches")
        .select("*, prelevements(numero), parametres_analyse(libelle)")
        .eq("fr_id", id).order("ordre");
      if (error) throw error;
      return data;
    },
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Tâches planifiées</DialogTitle></DialogHeader>
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : taches.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Aucune tâche affectée. Créez-les depuis le module Analyses.</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Prélèvement</TableHead><TableHead>Paramètre</TableHead><TableHead>Statut</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {taches.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{(t.prelevements as { numero: string } | null)?.numero ?? "—"}</TableCell>
                  <TableCell>{(t.parametres_analyse as { libelle: string } | null)?.libelle ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{t.statut}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
