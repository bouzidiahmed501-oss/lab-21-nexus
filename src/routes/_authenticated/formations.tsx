import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { GraduationCap, Loader2, Plus, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/formations")({
  head: () => ({
    meta: [
      { title: "Formations & habilitations — BALIMS" },
      { name: "description", content: "Suivi ISO 17025 des formations du personnel et des habilitations techniques par méthode, paramètre et équipement." },
      { property: "og:title", content: "Formations & habilitations — BALIMS" },
      { property: "og:description", content: "Compétences du personnel : formations, évaluations et habilitations avec dates d'expiration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FormationsPage,
});

const RESULTATS = [
  { value: "planifiee", label: "Planifiée" },
  { value: "en_cours", label: "En cours" },
  { value: "reussie", label: "Réussie" },
  { value: "echouee", label: "Échouée" },
];
const NIVEAUX = [
  { value: "observation", label: "En observation" },
  { value: "supervise", label: "Supervisé" },
  { value: "autonome", label: "Autonome" },
  { value: "formateur", label: "Formateur" },
];

function daysUntil(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}

function FormationsPage() {
  const qc = useQueryClient();
  const [openF, setOpenF] = useState(false);
  const [openH, setOpenH] = useState(false);
  const [fForm, setFForm] = useState({ employe_id: "", intitule: "", organisme: "", type_formation: "interne", date_debut: "", date_fin: "", duree_heures: "", resultat: "planifiee", notes: "" });
  const [hForm, setHForm] = useState({ employe_id: "", intitule: "", parametre_id: "none", niveau: "autonome", date_habilitation: new Date().toISOString().slice(0, 10), date_expiration: "", commentaire: "" });

  const { data: employes = [] } = useQuery<any[]>({
    queryKey: ["employes_light"],
    queryFn: async () => {
      const { data } = await (supabase.from("employes" as never) as any)
        .select("id, nom, prenom, fonction").eq("is_active", true).order("nom");
      return data ?? [];
    },
  });

  const { data: parametres = [] } = useQuery<any[]>({
    queryKey: ["parametres_light"],
    queryFn: async () => {
      const { data } = await (supabase.from("parametres_analyse" as never) as any)
        .select("id, designation").order("designation").limit(500);
      return data ?? [];
    },
  });

  const { data: formations = [], isLoading: loadF } = useQuery<any[]>({
    queryKey: ["formations"],
    queryFn: async () => {
      const { data } = await (supabase.from("formations" as never) as any)
        .select("*").order("date_debut", { ascending: false });
      return data ?? [];
    },
  });

  const { data: habilitations = [], isLoading: loadH } = useQuery<any[]>({
    queryKey: ["habilitations"],
    queryFn: async () => {
      const { data } = await (supabase.from("habilitations" as never) as any)
        .select("*").order("date_habilitation", { ascending: false });
      return data ?? [];
    },
  });

  const nomEmploye = (id: string) => {
    const e = employes.find((x) => x.id === id);
    return e ? `${e.prenom ?? ""} ${e.nom}`.trim() : "—";
  };

  const addFormation = useMutation({
    mutationFn: async () => {
      if (!fForm.employe_id || !fForm.intitule.trim()) throw new Error("Employé et intitulé obligatoires");
      const { data: u } = await supabase.auth.getUser();
      const { error } = await (supabase.from("formations" as never) as any).insert({
        employe_id: fForm.employe_id,
        intitule: fForm.intitule.trim(),
        organisme: fForm.organisme || null,
        type_formation: fForm.type_formation,
        date_debut: fForm.date_debut || null,
        date_fin: fForm.date_fin || null,
        duree_heures: fForm.duree_heures === "" ? null : Number(fForm.duree_heures),
        resultat: fForm.resultat,
        notes: fForm.notes || null,
        created_by: u.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Formation enregistrée");
      setOpenF(false);
      qc.invalidateQueries({ queryKey: ["formations"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addHabilitation = useMutation({
    mutationFn: async () => {
      if (!hForm.employe_id || !hForm.intitule.trim()) throw new Error("Employé et intitulé obligatoires");
      const { data: u } = await supabase.auth.getUser();
      const { error } = await (supabase.from("habilitations" as never) as any).insert({
        employe_id: hForm.employe_id,
        intitule: hForm.intitule.trim(),
        parametre_id: hForm.parametre_id === "none" ? null : hForm.parametre_id,
        niveau: hForm.niveau,
        date_habilitation: hForm.date_habilitation,
        date_expiration: hForm.date_expiration || null,
        evaluateur_id: u.user?.id ?? null,
        commentaire: hForm.commentaire || null,
        created_by: u.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Habilitation enregistrée");
      setOpenH(false);
      qc.invalidateQueries({ queryKey: ["habilitations"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const expirantes = habilitations.filter((h) => {
    const d = daysUntil(h.date_expiration);
    return d !== null && d <= 60;
  });

  return (
    <div className="space-y-4 pb-6">
      <PageHeader
        title="Formations & habilitations"
        description="Compétences du personnel — exigence ISO 17025 §6.2 : formation, évaluation, autorisation"
        backTo="/rh"
        backLabel="RH & Paie"
      />

      <div className="px-6">
        {expirantes.length > 0 && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {expirantes.length} habilitation(s) arrivent à expiration sous 60 jours — planifiez la réévaluation.
          </div>
        )}

        <Tabs defaultValue="habilitations">
          <TabsList>
            <TabsTrigger value="habilitations"><ShieldCheck className="mr-2 h-4 w-4" />Habilitations</TabsTrigger>
            <TabsTrigger value="formations"><GraduationCap className="mr-2 h-4 w-4" />Formations</TabsTrigger>
          </TabsList>

          <TabsContent value="habilitations" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setOpenH(true)}><Plus className="mr-2 h-4 w-4" />Nouvelle habilitation</Button>
            </div>
            <Card><CardContent className="p-4">
              {loadH ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> :
                habilitations.length === 0 ? (
                  <EmptyState icon={ShieldCheck} title="Aucune habilitation" description="Habilitez vos techniciens par méthode ou paramètre d'analyse." />
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Employé</TableHead><TableHead>Habilitation</TableHead><TableHead>Niveau</TableHead>
                      <TableHead>Depuis</TableHead><TableHead>Expiration</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {habilitations.map((h) => {
                        const d = daysUntil(h.date_expiration);
                        return (
                          <TableRow key={h.id}>
                            <TableCell className="text-xs font-medium">{nomEmploye(h.employe_id)}</TableCell>
                            <TableCell className="text-xs">{h.intitule}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px]">{NIVEAUX.find((n) => n.value === h.niveau)?.label ?? h.niveau}</Badge></TableCell>
                            <TableCell className="text-xs">{formatDate(h.date_habilitation)}</TableCell>
                            <TableCell className="text-xs">
                              {h.date_expiration ? (
                                <Badge variant={d !== null && d <= 0 ? "destructive" : d !== null && d <= 60 ? "secondary" : "outline"} className="text-[10px]">
                                  {formatDate(h.date_expiration)}
                                </Badge>
                              ) : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="formations" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setOpenF(true)}><Plus className="mr-2 h-4 w-4" />Nouvelle formation</Button>
            </div>
            <Card><CardContent className="p-4">
              {loadF ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> :
                formations.length === 0 ? (
                  <EmptyState icon={GraduationCap} title="Aucune formation" description="Consignez les formations internes et externes de votre personnel." />
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Employé</TableHead><TableHead>Intitulé</TableHead><TableHead>Organisme</TableHead>
                      <TableHead>Période</TableHead><TableHead>Heures</TableHead><TableHead>Résultat</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {formations.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="text-xs font-medium">{nomEmploye(f.employe_id)}</TableCell>
                          <TableCell className="text-xs">{f.intitule}</TableCell>
                          <TableCell className="text-xs">{f.organisme ?? "—"}</TableCell>
                          <TableCell className="text-xs">
                            {f.date_debut ? formatDate(f.date_debut) : "—"}{f.date_fin ? ` → ${formatDate(f.date_fin)}` : ""}
                          </TableCell>
                          <TableCell className="text-xs">{f.duree_heures ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant={f.resultat === "reussie" ? "default" : f.resultat === "echouee" ? "destructive" : "outline"} className="text-[10px]">
                              {RESULTATS.find((r) => r.value === f.resultat)?.label ?? f.resultat}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={openH} onOpenChange={setOpenH}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nouvelle habilitation</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Employé *</Label>
              <Select value={hForm.employe_id} onValueChange={(v) => setHForm({ ...hForm, employe_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{employes.map((e) => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Intitulé *</Label>
              <Input value={hForm.intitule} onChange={(e) => setHForm({ ...hForm, intitule: e.target.value })} placeholder="Dénombrement E. coli — NF EN ISO 16649-2" />
            </div>
            <div className="sm:col-span-2">
              <Label>Paramètre lié</Label>
              <Select value={hForm.parametre_id} onValueChange={(v) => setHForm({ ...hForm, parametre_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {parametres.map((p) => <SelectItem key={p.id} value={p.id}>{p.designation}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Niveau</Label>
              <Select value={hForm.niveau} onValueChange={(v) => setHForm({ ...hForm, niveau: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{NIVEAUX.map((n) => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date habilitation</Label>
              <Input type="date" value={hForm.date_habilitation} onChange={(e) => setHForm({ ...hForm, date_habilitation: e.target.value })} />
            </div>
            <div>
              <Label>Date d'expiration</Label>
              <Input type="date" value={hForm.date_expiration} onChange={(e) => setHForm({ ...hForm, date_expiration: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Commentaire</Label>
              <Textarea rows={2} value={hForm.commentaire} onChange={(e) => setHForm({ ...hForm, commentaire: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenH(false)}>Annuler</Button>
            <Button onClick={() => addHabilitation.mutate()} disabled={addHabilitation.isPending}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openF} onOpenChange={setOpenF}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nouvelle formation</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Employé *</Label>
              <Select value={fForm.employe_id} onValueChange={(v) => setFForm({ ...fForm, employe_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{employes.map((e) => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Intitulé *</Label>
              <Input value={fForm.intitule} onChange={(e) => setFForm({ ...fForm, intitule: e.target.value })} />
            </div>
            <div>
              <Label>Organisme</Label>
              <Input value={fForm.organisme} onChange={(e) => setFForm({ ...fForm, organisme: e.target.value })} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={fForm.type_formation} onValueChange={(v) => setFForm({ ...fForm, type_formation: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="interne">Interne</SelectItem>
                  <SelectItem value="externe">Externe</SelectItem>
                  <SelectItem value="en_ligne">En ligne</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Début</Label>
              <Input type="date" value={fForm.date_debut} onChange={(e) => setFForm({ ...fForm, date_debut: e.target.value })} />
            </div>
            <div>
              <Label>Fin</Label>
              <Input type="date" value={fForm.date_fin} onChange={(e) => setFForm({ ...fForm, date_fin: e.target.value })} />
            </div>
            <div>
              <Label>Durée (heures)</Label>
              <Input type="number" value={fForm.duree_heures} onChange={(e) => setFForm({ ...fForm, duree_heures: e.target.value })} />
            </div>
            <div>
              <Label>Résultat</Label>
              <Select value={fForm.resultat} onValueChange={(v) => setFForm({ ...fForm, resultat: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RESULTATS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={2} value={fForm.notes} onChange={(e) => setFForm({ ...fForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenF(false)}>Annuler</Button>
            <Button onClick={() => addFormation.mutate()} disabled={addFormation.isPending}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
