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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, AlertTriangle, MailWarning, Loader2 } from "lucide-react";
import { nextNumero } from "@/lib/numbering";
import { formatCurrency, formatDate } from "@/lib/format";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/recouvrement")({
  head: () => ({ meta: [{ title: "Recouvrement — BALIMS" }] }),
  component: RecouvrementPage,
});

function ageDays(date: string | null) {
  if (!date) return 0;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function RecouvrementPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: factures = [], isLoading: lf } = useQuery({
    queryKey: ["recouvrement-factures"],
    queryFn: async () => {
      const { data, error } = await supabase.from("factures")
        .select("id, numero, date_facture, date_echeance, total_ttc, montant_paye, statut, client:clients(id, raison_sociale)")
        .neq("statut", "annulee")
        .order("date_echeance", { ascending: true });
      if (error) throw error;
      return (data ?? []).filter((f: any) => Number(f.total_ttc ?? 0) - Number(f.montant_paye ?? 0) > 0.01);
    },
  });

  const { data: relances = [], isLoading: lr } = useQuery({
    queryKey: ["relances"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("relances" as never) as any)
        .select("*, client:clients(raison_sociale), facture:factures(numero)").order("date_envoi", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const totalImpaye = useMemo(() => factures.reduce((s: number, f: any) => s + (Number(f.total_ttc) - Number(f.montant_paye ?? 0)), 0), [factures]);
  const enRetard = useMemo(() => factures.filter((f: any) => f.date_echeance && new Date(f.date_echeance) < new Date()), [factures]);

  const [form, setForm] = useState<any>({ facture_id: "", client_id: "", niveau: 1, mode: "email", contenu: "", montant_relance: 0 });

  const openRelance = (f: any) => {
    const reste = Number(f.total_ttc) - Number(f.montant_paye ?? 0);
    const existant = relances.filter((r: any) => r.facture_id === f.id).length;
    setForm({
      facture_id: f.id, client_id: f.client?.id ?? "",
      niveau: Math.min(3, existant + 1), mode: "email",
      contenu: `Madame, Monsieur,\n\nNous vous rappelons que la facture ${f.numero} d'un montant de ${reste.toFixed(3)} DT échue le ${formatDate(f.date_echeance)} reste impayée.\n\nMerci de procéder au règlement dans les meilleurs délais.\n\nCordialement.`,
      montant_relance: reste,
    });
    setOpen(true);
  };

  const createMut = useMutation({
    mutationFn: async () => {
      const numero = await nextNumero("REL");
      const { data: { user } } = await supabase.auth.getUser();
      const payload = { ...form, numero, created_by: user?.id ?? null };
      const { data, error } = await (supabase.from("relances" as never) as any).insert(payload).select().single();
      if (error) throw error;
      await logAudit({ action: "create", entity_type: "relance", entity_id: data.id, details: { niveau: form.niveau } });
    },
    onSuccess: () => { toast.success("Relance enregistrée"); qc.invalidateQueries({ queryKey: ["relances"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="flex flex-col">
      <PageHeader title="Recouvrement" description={`${factures.length} facture(s) impayée(s) — Total : ${formatCurrency(totalImpaye)}`}
        badge={enRetard.length > 0 ? <Badge variant="destructive">{enRetard.length} en retard</Badge> : undefined} />
      <div className="p-6">
        <Tabs defaultValue="creances">
          <TabsList><TabsTrigger value="creances">Créances impayées</TabsTrigger><TabsTrigger value="relances">Historique relances</TabsTrigger></TabsList>

          <TabsContent value="creances">
            <Card><CardContent className="p-4">
              {lf ? <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                : factures.length === 0 ? <EmptyState icon={AlertTriangle} title="Aucune créance" description="Toutes les factures sont soldées." />
                : <Table>
                  <TableHeader><TableRow><TableHead>Facture</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead><TableHead>Échéance</TableHead><TableHead>Âge</TableHead><TableHead className="text-right">Restant dû</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {factures.map((f: any) => {
                      const reste = Number(f.total_ttc) - Number(f.montant_paye ?? 0);
                      const age = ageDays(f.date_echeance);
                      const enretard = age > 0;
                      return (
                        <TableRow key={f.id} className={enretard ? "bg-destructive/5" : ""}>
                          <TableCell className="font-mono text-xs">{f.numero}</TableCell>
                          <TableCell>{f.client?.raison_sociale ?? "-"}</TableCell>
                          <TableCell className="text-xs">{formatDate(f.date_facture)}</TableCell>
                          <TableCell className="text-xs">{formatDate(f.date_echeance)}</TableCell>
                          <TableCell>{enretard ? <Badge variant="destructive">{age}j</Badge> : <Badge variant="outline">{-age}j</Badge>}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(reste)}</TableCell>
                          <TableCell><Button size="sm" variant="outline" onClick={() => openRelance(f)}><MailWarning className="h-3 w-3 mr-1" />Relancer</Button></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="relances">
            <Card><CardContent className="p-4">
              {lr ? <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                : relances.length === 0 ? <EmptyState icon={MailWarning} title="Aucune relance" description="Aucune relance envoyée pour le moment." />
                : <Table>
                  <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Date</TableHead><TableHead>Client</TableHead><TableHead>Facture</TableHead><TableHead>Niveau</TableHead><TableHead>Mode</TableHead><TableHead className="text-right">Montant</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {relances.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.numero}</TableCell>
                        <TableCell className="text-xs">{formatDate(r.date_envoi)}</TableCell>
                        <TableCell>{r.client?.raison_sociale ?? "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{r.facture?.numero ?? "-"}</TableCell>
                        <TableCell><Badge>{r.niveau}</Badge></TableCell>
                        <TableCell className="text-xs">{r.mode}</TableCell>
                        <TableCell className="text-right">{formatCurrency(r.montant_relance ?? 0)}</TableCell>
                        <TableCell><Badge variant="secondary">{r.statut}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>}
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouvelle relance (niveau {form.niveau})</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Niveau</Label>
              <Select value={String(form.niveau)} onValueChange={(v) => setForm({ ...form, niveau: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 — Rappel amiable (J+15)</SelectItem>
                  <SelectItem value="2">2 — Relance ferme (J+30)</SelectItem>
                  <SelectItem value="3">3 — Mise en demeure (J+60)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Mode</Label>
              <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="telephone">Téléphone</SelectItem>
                  <SelectItem value="courrier">Courrier</SelectItem>
                  <SelectItem value="recommande">Recommandé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Montant relancé</Label><Input type="number" step="0.001" value={form.montant_relance} onChange={(e) => setForm({ ...form, montant_relance: Number(e.target.value) })} /></div>
            <div className="col-span-2"><Label>Contenu</Label><Textarea rows={8} value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Enregistrer la relance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
