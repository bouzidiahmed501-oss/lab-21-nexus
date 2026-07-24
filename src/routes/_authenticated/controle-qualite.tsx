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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, LineChart, Loader2, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/controle-qualite")({
  head: () => ({ meta: [{ title: "Contrôle Qualité — BALIMS" }] }),
  component: CQPage,
});

const TYPES_CQ = [
  { value: "blanc", label: "Blanc" },
  { value: "duplicata", label: "Duplicata" },
  { value: "mrc", label: "Matériau réf. certifié" },
  { value: "eil", label: "EIL" },
  { value: "routine", label: "Routine" },
];

const RESULTATS_EIL = [
  { value: "satisfaisant", label: "Satisfaisant", color: "bg-green-100 text-green-800" },
  { value: "douteux", label: "Douteux", color: "bg-amber-100 text-amber-800" },
  { value: "non_satisfaisant", label: "Non satisfaisant", color: "bg-red-100 text-red-800" },
  { value: "en_attente", label: "En attente", color: "bg-slate-100 text-slate-700" },
];

function CQPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("cartes");

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Contrôle Qualité analytique"
        description="Cartes Shewhart, blancs, duplicatas, MRC, essais inter-laboratoires (ISO 17025 §7.7)"
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="cartes">Cartes de contrôle</TabsTrigger>
          <TabsTrigger value="mesures">Mesures CQ</TabsTrigger>
          <TabsTrigger value="eil">EIL / CIL</TabsTrigger>
        </TabsList>

        <TabsContent value="cartes"><CartesTab qc={qc} /></TabsContent>
        <TabsContent value="mesures"><MesuresTab qc={qc} /></TabsContent>
        <TabsContent value="eil"><EilTab qc={qc} /></TabsContent>
      </Tabs>
    </div>
  );
}

function CartesTab({ qc }: { qc: any }) {
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["cq_cartes"],
    queryFn: async () => {
      const { data } = await (supabase.from("cq_cartes_controle" as never) as any).select("*").order("code");
      return data ?? [];
    },
  });
  const [form, setForm] = useState({
    code: "", nom: "", type_carte: "X_barre",
    valeur_cible: 0, ecart_type: 0,
    limite_sup_avert: 0, limite_inf_avert: 0,
    limite_sup_action: 0, limite_inf_action: 0,
    notes: "",
  });
  const mut = useMutation({
    mutationFn: async () => {
      const code = form.code || `CQ${Date.now().toString().slice(-6)}`;
      const { error } = await (supabase.from("cq_cartes_controle" as never) as any).insert({ ...form, code });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Carte créée"); setOpen(false); qc.invalidateQueries({ queryKey: ["cq_cartes"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Nouvelle carte</Button>
        </div>
        {isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> :
         data.length === 0 ? <EmptyState icon={LineChart} title="Aucune carte" description="Créez votre première carte de contrôle." /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Code</TableHead><TableHead>Nom</TableHead><TableHead>Type</TableHead>
              <TableHead>Cible</TableHead><TableHead>σ</TableHead><TableHead>Limites action</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.code}</TableCell>
                  <TableCell className="font-medium">{c.nom}</TableCell>
                  <TableCell>{c.type_carte}</TableCell>
                  <TableCell>{c.valeur_cible}</TableCell>
                  <TableCell>{c.ecart_type}</TableCell>
                  <TableCell className="text-xs">[{c.limite_inf_action} ; {c.limite_sup_action}]</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Nouvelle carte de contrôle</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div><Label>Nom *</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
              <div><Label>Type</Label>
                <Select value={form.type_carte} onValueChange={(v) => setForm({ ...form, type_carte: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="X_barre">X̄ (moyenne)</SelectItem>
                    <SelectItem value="R">R (étendue)</SelectItem>
                    <SelectItem value="X_R">X̄ - R</SelectItem>
                    <SelectItem value="individuel">Individuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Valeur cible</Label><Input type="number" step="0.001" value={form.valeur_cible} onChange={(e) => setForm({ ...form, valeur_cible: Number(e.target.value) })} /></div>
              <div><Label>Écart-type σ</Label><Input type="number" step="0.001" value={form.ecart_type} onChange={(e) => setForm({ ...form, ecart_type: Number(e.target.value) })} /></div>
              <div><Label>LSA (avert. sup ±2σ)</Label><Input type="number" step="0.001" value={form.limite_sup_avert} onChange={(e) => setForm({ ...form, limite_sup_avert: Number(e.target.value) })} /></div>
              <div><Label>LIA (avert. inf −2σ)</Label><Input type="number" step="0.001" value={form.limite_inf_avert} onChange={(e) => setForm({ ...form, limite_inf_avert: Number(e.target.value) })} /></div>
              <div><Label>LSC (action sup ±3σ)</Label><Input type="number" step="0.001" value={form.limite_sup_action} onChange={(e) => setForm({ ...form, limite_sup_action: Number(e.target.value) })} /></div>
              <div><Label>LIC (action inf −3σ)</Label><Input type="number" step="0.001" value={form.limite_inf_action} onChange={(e) => setForm({ ...form, limite_inf_action: Number(e.target.value) })} /></div>
              <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={() => mut.mutate()} disabled={!form.nom || mut.isPending}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function MesuresTab({ qc }: { qc: any }) {
  const [open, setOpen] = useState(false);
  const { data: cartes = [] } = useQuery({
    queryKey: ["cq_cartes_list"],
    queryFn: async () => (await (supabase.from("cq_cartes_controle" as never) as any).select("id,code,nom,limite_sup_action,limite_inf_action")).data ?? [],
  });
  const { data: mesures = [], isLoading } = useQuery({
    queryKey: ["cq_mesures"],
    queryFn: async () => (await (supabase.from("cq_mesures" as never) as any).select("*, cq_cartes_controle(code,nom)").order("date_mesure", { ascending: false }).limit(200)).data ?? [],
  });
  const [form, setForm] = useState({ carte_id: "", valeur: 0, type_echantillon_cq: "routine", reactif_lot: "", commentaire: "" });

  const mut = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const carte = cartes.find((c: any) => c.id === form.carte_id);
      const hors = carte && (form.valeur > (carte.limite_sup_action ?? Infinity) || form.valeur < (carte.limite_inf_action ?? -Infinity));
      const { error } = await (supabase.from("cq_mesures" as never) as any).insert({
        ...form, technicien_id: userData.user?.id, hors_limite: hors,
        regle_violee: hors ? "Hors limite action ±3σ" : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Mesure enregistrée"); setOpen(false); qc.invalidateQueries({ queryKey: ["cq_mesures"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Nouvelle mesure</Button>
        </div>
        {isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> :
         mesures.length === 0 ? <EmptyState icon={LineChart} title="Aucune mesure" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Carte</TableHead><TableHead>Type</TableHead>
              <TableHead>Valeur</TableHead><TableHead>Statut</TableHead><TableHead>Commentaire</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {mesures.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs">{formatDate(m.date_mesure)}</TableCell>
                  <TableCell className="text-xs">{m.cq_cartes_controle?.code} — {m.cq_cartes_controle?.nom}</TableCell>
                  <TableCell>{TYPES_CQ.find((t) => t.value === m.type_echantillon_cq)?.label ?? m.type_echantillon_cq}</TableCell>
                  <TableCell className="font-mono">{m.valeur}</TableCell>
                  <TableCell>{m.hors_limite ? <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Hors limite</Badge> : <Badge variant="outline">OK</Badge>}</TableCell>
                  <TableCell className="text-xs">{m.commentaire ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvelle mesure CQ</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Carte *</Label>
                <Select value={form.carte_id} onValueChange={(v) => setForm({ ...form, carte_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>{cartes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.code} — {c.nom}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Type</Label>
                <Select value={form.type_echantillon_cq} onValueChange={(v) => setForm({ ...form, type_echantillon_cq: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES_CQ.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Valeur mesurée *</Label><Input type="number" step="0.001" value={form.valeur} onChange={(e) => setForm({ ...form, valeur: Number(e.target.value) })} /></div>
              <div><Label>Lot réactif</Label><Input value={form.reactif_lot} onChange={(e) => setForm({ ...form, reactif_lot: e.target.value })} /></div>
              <div><Label>Commentaire</Label><Textarea value={form.commentaire} onChange={(e) => setForm({ ...form, commentaire: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={() => mut.mutate()} disabled={!form.carte_id || mut.isPending}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function EilTab({ qc }: { qc: any }) {
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["eil"],
    queryFn: async () => (await (supabase.from("eil_participations" as never) as any).select("*").order("date_participation", { ascending: false })).data ?? [],
  });
  const [form, setForm] = useState({
    organisme: "", reference: "", parametre: "",
    date_participation: new Date().toISOString().slice(0, 10),
    date_resultat: "", valeur_labo: 0, valeur_assignee: 0, z_score: 0,
    resultat: "en_attente", actions_correctives: "",
  });

  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from("eil_participations" as never) as any).insert({
        ...form, date_resultat: form.date_resultat || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("EIL enregistré"); setOpen(false); qc.invalidateQueries({ queryKey: ["eil"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Nouvelle participation</Button>
        </div>
        {isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> :
         data.length === 0 ? <EmptyState icon={LineChart} title="Aucune participation EIL" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Organisme</TableHead><TableHead>Réf.</TableHead><TableHead>Paramètre</TableHead>
              <TableHead>Date</TableHead><TableHead>Z-score</TableHead><TableHead>Résultat</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.map((e: any) => {
                const r = RESULTATS_EIL.find((x) => x.value === e.resultat);
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.organisme}</TableCell>
                    <TableCell className="text-xs">{e.reference}</TableCell>
                    <TableCell>{e.parametre}</TableCell>
                    <TableCell className="text-xs">{e.date_participation ? formatDate(e.date_participation) : "—"}</TableCell>
                    <TableCell className="font-mono">{e.z_score}</TableCell>
                    <TableCell><Badge className={r?.color}>{r?.label}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Nouvelle participation EIL</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Organisme *</Label><Input value={form.organisme} onChange={(e) => setForm({ ...form, organisme: e.target.value })} /></div>
              <div><Label>Référence</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
              <div><Label>Paramètre</Label><Input value={form.parametre} onChange={(e) => setForm({ ...form, parametre: e.target.value })} /></div>
              <div><Label>Date participation</Label><Input type="date" value={form.date_participation} onChange={(e) => setForm({ ...form, date_participation: e.target.value })} /></div>
              <div><Label>Date résultat</Label><Input type="date" value={form.date_resultat} onChange={(e) => setForm({ ...form, date_resultat: e.target.value })} /></div>
              <div><Label>Valeur labo</Label><Input type="number" step="0.001" value={form.valeur_labo} onChange={(e) => setForm({ ...form, valeur_labo: Number(e.target.value) })} /></div>
              <div><Label>Valeur assignée</Label><Input type="number" step="0.001" value={form.valeur_assignee} onChange={(e) => setForm({ ...form, valeur_assignee: Number(e.target.value) })} /></div>
              <div><Label>Z-score</Label><Input type="number" step="0.01" value={form.z_score} onChange={(e) => setForm({ ...form, z_score: Number(e.target.value) })} /></div>
              <div><Label>Résultat</Label>
                <Select value={form.resultat} onValueChange={(v) => setForm({ ...form, resultat: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RESULTATS_EIL.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Actions correctives</Label><Textarea value={form.actions_correctives} onChange={(e) => setForm({ ...form, actions_correctives: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={() => mut.mutate()} disabled={!form.organisme || mut.isPending}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
