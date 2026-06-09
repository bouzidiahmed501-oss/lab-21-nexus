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
import { toast } from "sonner";
import { Plus, Search, CalendarClock, Loader2, Trash2 } from "lucide-react";
import { nextNumero } from "@/lib/numbering";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/reservations-equipement")({
  head: () => ({ meta: [{ title: "Réservations équipement — BALIMS" }] }),
  component: ReservationsPage,
});

const STATUTS = [
  { v: "planifiee", label: "Planifiée", variant: "secondary" as const },
  { v: "en_cours", label: "En cours", variant: "default" as const },
  { v: "terminee", label: "Terminée", variant: "outline" as const },
  { v: "annulee", label: "Annulée", variant: "destructive" as const },
];

function ReservationsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["reservations-eq"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("reservations_equipement" as never) as any)
        .select("*, equipement:equipements(designation, numero)").order("date_debut", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: equipements = [] } = useQuery({
    queryKey: ["equipements-lite"],
    queryFn: async () => {
      const { data } = await supabase.from("equipements").select("id, designation, numero").order("designation");
      return data ?? [];
    },
  });

  const filtered = useMemo(() => items.filter((r: any) =>
    !search || r.numero?.toLowerCase().includes(search.toLowerCase()) ||
    r.equipement?.designation?.toLowerCase().includes(search.toLowerCase()) ||
    r.motif?.toLowerCase().includes(search.toLowerCase())
  ), [items, search]);

  const [form, setForm] = useState({
    equipement_id: "",
    date_debut: new Date().toISOString().slice(0, 16),
    date_fin: new Date(Date.now() + 3600_000).toISOString().slice(0, 16),
    motif: "",
    statut: "planifiee",
    notes: "",
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const numero = await nextNumero("RES");
      const { data: { user } } = await supabase.auth.getUser();
      const payload = { ...form, numero, utilisateur_id: user?.id ?? null, created_by: user?.id ?? null };
      const { data, error } = await (supabase.from("reservations_equipement" as never) as any).insert(payload).select().single();
      if (error) throw error;
      await logAudit({ action: "create", entity_type: "reservation_equipement", entity_id: data.id });
    },
    onSuccess: () => {
      toast.success("Réservation créée");
      qc.invalidateQueries({ queryKey: ["reservations-eq"] });
      setOpen(false);
      setForm({ ...form, equipement_id: "", motif: "", notes: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await (supabase.from("reservations_equipement" as never) as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["reservations-eq"] }); },
  });

  return (
    <div className="flex flex-col">
      <PageHeader title="Réservations d'équipement" description="Planning d'utilisation des équipements du laboratoire"
        actions={<Button onClick={() => setOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" />Nouvelle réservation</Button>} />
      <div className="p-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
            </div>
            {isLoading ? <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
              : filtered.length === 0 ? <EmptyState icon={CalendarClock} title="Aucune réservation" description="Planifiez l'utilisation d'un équipement." />
              : <Table>
                <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Équipement</TableHead><TableHead>Début</TableHead><TableHead>Fin</TableHead><TableHead>Motif</TableHead><TableHead>Statut</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((r: any) => {
                    const st = STATUTS.find(s => s.v === r.statut);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.numero}</TableCell>
                        <TableCell>{r.equipement?.designation ?? "-"}</TableCell>
                        <TableCell className="text-xs">{new Date(r.date_debut).toLocaleString("fr-FR")}</TableCell>
                        <TableCell className="text-xs">{new Date(r.date_fin).toLocaleString("fr-FR")}</TableCell>
                        <TableCell className="max-w-xs truncate">{r.motif}</TableCell>
                        <TableCell><Badge variant={st?.variant ?? "secondary"}>{st?.label ?? r.statut}</Badge></TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => { if (confirm("Supprimer ?")) deleteMut.mutate(r.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouvelle réservation</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Équipement *</Label>
              <Select value={form.equipement_id} onValueChange={(v) => setForm({ ...form, equipement_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>{equipements.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.numero} — {e.designation}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Début</Label><Input type="datetime-local" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} /></div>
            <div><Label>Fin</Label><Input type="datetime-local" value={form.date_fin} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} /></div>
            <div className="col-span-2"><Label>Motif</Label><Input value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} /></div>
            <div><Label>Statut</Label>
              <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUTS.map(s => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={() => createMut.mutate()} disabled={!form.equipement_id || createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
