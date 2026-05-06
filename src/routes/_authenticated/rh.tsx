import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { EmptyState } from "@/components/lab/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Search, Users, Calendar, Receipt, Eye, Download } from "lucide-react";
import { nextNumero } from "@/lib/numbering";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/rh")({
  head: () => ({ meta: [{ title: "RH & Paie — BALIMS" }] }),
  component: RHPage,
});

const CONTRAT_LABEL: Record<string, string> = {
  cdi: "CDI", cdd: "CDD", stage: "Stage", freelance: "Freelance", interim: "Intérim",
};
const CONGE_TYPE: Record<string, string> = {
  annuel: "Annuel", maladie: "Maladie", maternite: "Maternité",
  paternite: "Paternité", sans_solde: "Sans solde", special: "Spécial",
};
const CONGE_STATUT: Record<string, string> = {
  demande: "Demandé", approuve: "Approuvé", refuse: "Refusé", annule: "Annulé",
};
const MOIS_LABELS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

// Tunisia payroll constants 2026
const CNSS_SAL = 0.0918;
const CNSS_PAT = 0.1657;
function calcIRPP(brutAnnuel: number): number {
  let tax = 0;
  const tranches = [
    { max: 5000, rate: 0 },
    { max: 20000, rate: 0.26 },
    { max: 30000, rate: 0.28 },
    { max: 50000, rate: 0.32 },
    { max: Infinity, rate: 0.35 },
  ];
  let prev = 0;
  for (const t of tranches) {
    if (brutAnnuel <= t.max) { tax += (brutAnnuel - prev) * t.rate; break; }
    tax += (t.max - prev) * t.rate; prev = t.max;
  }
  return Math.max(0, tax);
}

function RHPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="RH & Paie" description="Employés, congés, pointages et bulletins de paie — Législation tunisienne 2026" />
      <div className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="employes">
          <TabsList>
            <TabsTrigger value="employes"><Users className="mr-1 h-4 w-4" /> Employés</TabsTrigger>
            <TabsTrigger value="conges"><Calendar className="mr-1 h-4 w-4" /> Congés</TabsTrigger>
            <TabsTrigger value="paie"><Receipt className="mr-1 h-4 w-4" /> Bulletins de paie</TabsTrigger>
          </TabsList>
          <TabsContent value="employes"><EmployesTab /></TabsContent>
          <TabsContent value="conges"><CongesTab /></TabsContent>
          <TabsContent value="paie"><PaieTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============== EMPLOYES ==============
function EmployesTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);

  const { data: employes = [] } = useQuery({
    queryKey: ["employes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employes" as never).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => employes.filter((e: any) =>
    !search || [e.numero, e.nom, e.prenom, e.matricule, e.fonction, e.service, e.cin].filter(Boolean).some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
  ), [employes, search]);

  const actifs = employes.filter((e: any) => e.is_active).length;
  const masseSalariale = employes.filter((e: any) => e.is_active).reduce((s: number, e: any) => s + Number(e.salaire_base || 0), 0);
  const byContrat = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of employes.filter((e: any) => e.is_active)) { map[e.contrat_type] = (map[e.contrat_type] || 0) + 1; }
    return map;
  }, [employes]);

  const exportCSV = () => {
    const header = "matricule;nom;prenom;cin;cnss;fonction;service;contrat;salaire_base;email";
    const lines = employes.map((e: any) => `${e.matricule || e.numero};${e.nom};${e.prenom};${e.cin || ""};${e.cnss || ""};${e.fonction || ""};${e.service || ""};${e.contrat_type};${e.salaire_base};${e.email || ""}`);
    const blob = new Blob([header + "\n" + lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "employes.csv"; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total employés</p><p className="text-2xl font-semibold">{employes.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Actifs</p><p className="text-2xl font-semibold text-primary">{actifs}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Masse salariale</p><p className="text-lg font-semibold">{formatCurrency(masseSalariale)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Par contrat</p><div className="flex flex-wrap gap-1 mt-1">{Object.entries(byContrat).map(([k, v]) => <Badge key={k} variant="outline" className="text-[9px]">{CONTRAT_LABEL[k] || k}: {v}</Badge>)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <CardTitle>Liste des employés</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-8 w-64" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-3.5 w-3.5 mr-1" /> CSV</Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Nouvel employé</Button></DialogTrigger>
                <EmployeForm onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["employes"] })} />
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState icon={Users} title="Aucun employé" description="Créez votre premier employé." />
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Matricule</TableHead><TableHead>Nom</TableHead><TableHead>CIN</TableHead>
                <TableHead>Fonction</TableHead><TableHead>Service</TableHead><TableHead>Contrat</TableHead>
                <TableHead>Embauche</TableHead><TableHead className="text-right">Salaire base</TableHead>
                <TableHead>Statut</TableHead><TableHead className="w-10" />
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">{e.matricule || e.numero}</TableCell>
                    <TableCell className="font-medium">{e.prenom} {e.nom}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.cin || "—"}</TableCell>
                    <TableCell>{e.fonction || "—"}</TableCell>
                    <TableCell>{e.service || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{CONTRAT_LABEL[e.contrat_type]}</Badge></TableCell>
                    <TableCell>{formatDate(e.date_embauche)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(e.salaire_base)}</TableCell>
                    <TableCell>{e.is_active ? <Badge>Actif</Badge> : <Badge variant="secondary">Inactif</Badge>}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetail(e)}><Eye className="h-3.5 w-3.5" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {detail && <EmployeDetail employe={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function EmployeDetail({ employe, onClose }: { employe: any; onClose: () => void }) {
  const anciennete = useMemo(() => {
    const d = new Date(employe.date_embauche);
    const now = new Date();
    const years = now.getFullYear() - d.getFullYear();
    const months = now.getMonth() - d.getMonth();
    return `${years} ans ${months >= 0 ? months : 12 + months} mois`;
  }, [employe.date_embauche]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Fiche employé — {employe.prenom} {employe.nom}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <InfoRow label="Matricule" value={employe.matricule || employe.numero} />
          <InfoRow label="CIN" value={employe.cin || "—"} />
          <InfoRow label="N° CNSS" value={employe.cnss || "—"} />
          <InfoRow label="Email" value={employe.email || "—"} />
          <InfoRow label="Téléphone" value={employe.telephone || "—"} />
          <InfoRow label="Adresse" value={employe.adresse || "—"} />
          <InfoRow label="Date de naissance" value={formatDate(employe.date_naissance)} />
          <InfoRow label="Fonction" value={employe.fonction || "—"} />
          <InfoRow label="Service" value={employe.service || "—"} />
          <InfoRow label="Type contrat" value={CONTRAT_LABEL[employe.contrat_type] || employe.contrat_type} />
          <InfoRow label="Date embauche" value={formatDate(employe.date_embauche)} />
          <InfoRow label="Ancienneté" value={anciennete} />
          <InfoRow label="RIB" value={employe.rib || "—"} />
          <InfoRow label="Salaire de base" value={formatCurrency(employe.salaire_base)} />
          {employe.date_fin_contrat && <InfoRow label="Fin contrat" value={formatDate(employe.date_fin_contrat)} />}
          {employe.notes && <div className="pt-2 border-t"><p className="text-xs text-muted-foreground">{employe.notes}</p></div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (<div className="flex justify-between text-sm border-b border-border/30 py-1.5"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>);
}

function EmployeForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    nom: "", prenom: "", matricule: "", cin: "", cnss: "", email: "", telephone: "",
    fonction: "", service: "", contrat_type: "cdi", adresse: "", date_naissance: "", rib: "",
    date_embauche: new Date().toISOString().slice(0, 10), date_fin_contrat: "", salaire_base: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!f.nom || !f.prenom) { toast.error("Nom et prénom requis"); return; }
    setSaving(true);
    try {
      const numero = await nextNumero("EMP");
      const { error } = await supabase.from("employes" as never).insert({
        numero, nom: f.nom, prenom: f.prenom,
        matricule: f.matricule || null, cin: f.cin || null, cnss: f.cnss || null,
        email: f.email || null, telephone: f.telephone || null,
        fonction: f.fonction || null, service: f.service || null,
        contrat_type: f.contrat_type, date_embauche: f.date_embauche,
        salaire_base: Number(f.salaire_base) || 0,
        adresse: f.adresse || null, date_naissance: f.date_naissance || null,
        rib: f.rib || null, date_fin_contrat: f.date_fin_contrat || null,
        notes: f.notes || null,
      } as never);
      if (error) throw error;
      toast.success(`Employé ${numero} créé`);
      onSaved(); onClose();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Nouvel employé</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Nom *</Label><Input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} /></div>
        <div><Label>Prénom *</Label><Input value={f.prenom} onChange={(e) => setF({ ...f, prenom: e.target.value })} /></div>
        <div><Label>Matricule</Label><Input value={f.matricule} onChange={(e) => setF({ ...f, matricule: e.target.value })} /></div>
        <div><Label>CIN</Label><Input value={f.cin} onChange={(e) => setF({ ...f, cin: e.target.value })} /></div>
        <div><Label>N° CNSS</Label><Input value={f.cnss} onChange={(e) => setF({ ...f, cnss: e.target.value })} /></div>
        <div><Label>RIB</Label><Input value={f.rib} onChange={(e) => setF({ ...f, rib: e.target.value })} placeholder="XX XXX XXXXXXXXXXXXX XX" /></div>
        <div><Label>Email</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><Label>Téléphone</Label><Input value={f.telephone} onChange={(e) => setF({ ...f, telephone: e.target.value })} /></div>
        <div className="col-span-2"><Label>Adresse</Label><Input value={f.adresse} onChange={(e) => setF({ ...f, adresse: e.target.value })} /></div>
        <div><Label>Date de naissance</Label><Input type="date" value={f.date_naissance} onChange={(e) => setF({ ...f, date_naissance: e.target.value })} /></div>
        <div><Label>Fonction</Label><Input value={f.fonction} onChange={(e) => setF({ ...f, fonction: e.target.value })} /></div>
        <div><Label>Service</Label><Input value={f.service} onChange={(e) => setF({ ...f, service: e.target.value })} /></div>
        <div>
          <Label>Type contrat</Label>
          <Select value={f.contrat_type} onValueChange={(v) => setF({ ...f, contrat_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(CONTRAT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Date embauche</Label><Input type="date" value={f.date_embauche} onChange={(e) => setF({ ...f, date_embauche: e.target.value })} /></div>
        <div><Label>Fin contrat (CDD)</Label><Input type="date" value={f.date_fin_contrat} onChange={(e) => setF({ ...f, date_fin_contrat: e.target.value })} /></div>
        <div><Label>Salaire base (TND)</Label><Input type="number" value={f.salaire_base} onChange={(e) => setF({ ...f, salaire_base: e.target.value })} /></div>
      </div>
      <div><Label>Notes</Label><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "…" : "Créer"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ============== CONGES ==============
function CongesTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [statutFilter, setStatutFilter] = useState("all");

  const { data: conges = [] } = useQuery({
    queryKey: ["conges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conges" as never).select("*, employes(nom, prenom, numero)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => conges.filter((c: any) => statutFilter === "all" || c.statut === statutFilter), [conges, statutFilter]);

  const stats = useMemo(() => ({
    total: conges.length,
    pending: conges.filter((c: any) => c.statut === "demande").length,
    approved: conges.filter((c: any) => c.statut === "approuve").length,
    totalJours: conges.filter((c: any) => c.statut === "approuve").reduce((s: number, c: any) => s + Number(c.nb_jours || 0), 0),
  }), [conges]);

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const { error } = await supabase.from("conges" as never).update({ statut, date_validation: new Date().toISOString() } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Statut mis à jour"); qc.invalidateQueries({ queryKey: ["conges"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Demandes</p><p className="text-2xl font-semibold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">En attente</p><p className="text-2xl font-semibold text-orange-500">{stats.pending}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Approuvés</p><p className="text-2xl font-semibold text-primary">{stats.approved}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Jours approuvés</p><p className="text-2xl font-semibold">{stats.totalJours}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Demandes de congés</CardTitle>
            <div className="flex gap-2">
              <Select value={statutFilter} onValueChange={setStatutFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {Object.entries(CONGE_STATUT).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Nouvelle demande</Button></DialogTrigger>
                <CongeForm onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["conges"] })} />
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState icon={Calendar} title="Aucune demande" description="Aucune demande de congé enregistrée." />
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Employé</TableHead><TableHead>Type</TableHead><TableHead>Du</TableHead>
                <TableHead>Au</TableHead><TableHead>Jours</TableHead><TableHead>Motif</TableHead>
                <TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.employes ? `${c.employes.prenom} ${c.employes.nom}` : "—"}</TableCell>
                    <TableCell><Badge variant="outline">{CONGE_TYPE[c.type]}</Badge></TableCell>
                    <TableCell>{formatDate(c.date_debut)}</TableCell>
                    <TableCell>{formatDate(c.date_fin)}</TableCell>
                    <TableCell className="font-medium">{c.nb_jours}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{c.motif || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={c.statut === "approuve" ? "default" : c.statut === "refuse" ? "destructive" : "secondary"}>
                        {CONGE_STATUT[c.statut]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {c.statut === "demande" && (
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="outline" onClick={() => updateStatut.mutate({ id: c.id, statut: "approuve" })}>Approuver</Button>
                          <Button size="sm" variant="ghost" onClick={() => updateStatut.mutate({ id: c.id, statut: "refuse" })}>Refuser</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CongeForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { data: employes = [] } = useQuery({
    queryKey: ["employes-active"],
    queryFn: async () => {
      const { data } = await supabase.from("employes" as never).select("id, nom, prenom").eq("is_active", true).order("nom");
      return data as any[];
    },
  });
  const [f, setF] = useState({ employe_id: "", type: "annuel", date_debut: "", date_fin: "", motif: "" });
  const [saving, setSaving] = useState(false);

  const nbJours = useMemo(() => {
    if (!f.date_debut || !f.date_fin) return 0;
    const d1 = new Date(f.date_debut); const d2 = new Date(f.date_fin);
    return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1);
  }, [f.date_debut, f.date_fin]);

  const submit = async () => {
    if (!f.employe_id || !f.date_debut || !f.date_fin) { toast.error("Champs requis"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("conges" as never).insert({
        employe_id: f.employe_id, type: f.type, date_debut: f.date_debut,
        date_fin: f.date_fin, nb_jours: nbJours, motif: f.motif || null,
      } as never);
      if (error) throw error;
      toast.success("Demande créée"); onSaved(); onClose();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nouvelle demande de congé</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Employé *</Label>
          <Select value={f.employe_id} onValueChange={(v) => setF({ ...f, employe_id: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
            <SelectContent>{employes.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type</Label>
          <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(CONGE_TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Date début *</Label><Input type="date" value={f.date_debut} onChange={(e) => setF({ ...f, date_debut: e.target.value })} /></div>
          <div><Label>Date fin *</Label><Input type="date" value={f.date_fin} onChange={(e) => setF({ ...f, date_fin: e.target.value })} /></div>
        </div>
        <p className="text-sm text-muted-foreground">Nombre de jours : <strong>{nbJours}</strong></p>
        <div><Label>Motif</Label><Textarea value={f.motif} onChange={(e) => setF({ ...f, motif: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "…" : "Créer"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ============== PAIE ==============
function PaieTab() {
  const qc = useQueryClient();
  const now = new Date();
  const [annee, setAnnee] = useState(now.getFullYear());
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [open, setOpen] = useState(false);
  const [genAllOpen, setGenAllOpen] = useState(false);

  const { data: bulletins = [] } = useQuery({
    queryKey: ["bulletins", annee, mois],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bulletins_paie" as never)
        .select("*, employes(nom, prenom, matricule, salaire_base)")
        .eq("annee", annee).eq("mois", mois)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const totalNet = bulletins.reduce((s: number, b: any) => s + Number(b.net_a_payer || 0), 0);
  const totalBrut = bulletins.reduce((s: number, b: any) => s + Number(b.brut || 0), 0);
  const totalCnss = bulletins.reduce((s: number, b: any) => s + Number(b.cnss_salarial || 0) + Number(b.cnss_patronal || 0), 0);

  const exportCSV = () => {
    const header = "employe;brut;cnss_salarial;cnss_patronal;irpp;net_a_payer";
    const lines = bulletins.map((b: any) => `${b.employes?.prenom || ""} ${b.employes?.nom || ""};${b.brut};${b.cnss_salarial};${b.cnss_patronal};${b.irpp};${b.net_a_payer}`);
    const blob = new Blob([header + "\n" + lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `paie_${annee}_${String(mois).padStart(2, "0")}.csv`; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Bulletins {MOIS_LABELS[mois - 1]}</p><p className="text-2xl font-semibold">{bulletins.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total brut</p><p className="text-lg font-semibold">{formatCurrency(totalBrut)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total charges</p><p className="text-lg font-semibold text-muted-foreground">{formatCurrency(totalCnss)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total net</p><p className="text-lg font-semibold text-primary">{formatCurrency(totalNet)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <CardTitle>Bulletins {MOIS_LABELS[mois - 1]} {annee}</CardTitle>
            <div className="flex gap-2">
              <Select value={String(mois)} onValueChange={(v) => setMois(Number(v))}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>{MOIS_LABELS.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={String(annee)} onValueChange={(v) => setAnnee(Number(v))}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>{[2024, 2025, 2026, 2027].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-3.5 w-3.5 mr-1" /> CSV</Button>
              <GenerateAllButton annee={annee} mois={mois} onDone={() => qc.invalidateQueries({ queryKey: ["bulletins"] })} />
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Bulletin individuel</Button></DialogTrigger>
                <BulletinForm annee={annee} mois={mois} onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["bulletins"] })} />
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {bulletins.length === 0 ? (
            <EmptyState icon={Receipt} title="Aucun bulletin" description="Générez les bulletins pour cette période." />
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Employé</TableHead><TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">Primes</TableHead><TableHead className="text-right">Brut</TableHead>
                <TableHead className="text-right">CNSS sal.</TableHead><TableHead className="text-right">CNSS pat.</TableHead>
                <TableHead className="text-right">IRPP</TableHead><TableHead className="text-right">Net</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {bulletins.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.employes ? `${b.employes.prenom} ${b.employes.nom}` : "—"}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(b.salaire_base)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(b.primes)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(b.brut)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(b.cnss_salarial)}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">{formatCurrency(b.cnss_patronal)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(b.irpp)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(b.net_a_payer)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 font-bold">
                  <TableCell>Totaux</TableCell>
                  <TableCell className="text-right">{formatCurrency(bulletins.reduce((s: number, b: any) => s + Number(b.salaire_base || 0), 0))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(bulletins.reduce((s: number, b: any) => s + Number(b.primes || 0), 0))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalBrut)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(bulletins.reduce((s: number, b: any) => s + Number(b.cnss_salarial || 0), 0))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(bulletins.reduce((s: number, b: any) => s + Number(b.cnss_patronal || 0), 0))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(bulletins.reduce((s: number, b: any) => s + Number(b.irpp || 0), 0))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalNet)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GenerateAllButton({ annee, mois, onDone }: { annee: number; mois: number; onDone: () => void }) {
  const [loading, setLoading] = useState(false);

  const generateAll = async () => {
    setLoading(true);
    try {
      const { data: employes } = await supabase.from("employes" as never).select("id, salaire_base").eq("is_active", true);
      if (!employes || employes.length === 0) { toast.error("Aucun employé actif"); return; }

      // Check existing
      const { data: existing } = await supabase.from("bulletins_paie" as never).select("employe_id").eq("annee", annee).eq("mois", mois);
      const existingIds = new Set((existing ?? []).map((e: any) => e.employe_id));

      const toInsert = (employes as any[]).filter(e => !existingIds.has(e.id)).map(e => {
        const base = Number(e.salaire_base) || 0;
        const brut = base;
        const cnssSal = brut * CNSS_SAL;
        const cnssPat = brut * CNSS_PAT;
        const imposable = brut - cnssSal;
        const irpp = calcIRPP(imposable * 12) / 12;
        const net = brut - cnssSal - irpp;
        return {
          employe_id: e.id, annee, mois, salaire_base: base,
          primes: 0, retenues: 0, brut, cnss_salarial: cnssSal,
          cnss_patronal: cnssPat, irpp, net_a_payer: net,
        };
      });

      if (toInsert.length === 0) { toast.info("Tous les bulletins existent déjà"); return; }
      const { error } = await supabase.from("bulletins_paie" as never).insert(toInsert as never);
      if (error) throw error;
      toast.success(`${toInsert.length} bulletins générés`);
      onDone();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

  return (
    <Button variant="outline" onClick={generateAll} disabled={loading}>
      {loading ? "Génération…" : "Générer tout"}
    </Button>
  );
}

function BulletinForm({ annee, mois, onClose, onSaved }: { annee: number; mois: number; onClose: () => void; onSaved: () => void }) {
  const { data: employes = [] } = useQuery({
    queryKey: ["employes-active"],
    queryFn: async () => {
      const { data } = await supabase.from("employes" as never).select("id, nom, prenom, salaire_base").eq("is_active", true).order("nom");
      return data as any[];
    },
  });
  const [employeId, setEmployeId] = useState("");
  const [primes, setPrimes] = useState("0");
  const [retenues, setRetenues] = useState("0");
  const [heuresSupMontant, setHeuresSupMontant] = useState("0");
  const [saving, setSaving] = useState(false);

  const emp = employes.find((e: any) => e.id === employeId);
  const calc = useMemo(() => {
    if (!emp) return null;
    const base = Number(emp.salaire_base) || 0;
    const p = Number(primes) || 0;
    const r = Number(retenues) || 0;
    const hs = Number(heuresSupMontant) || 0;
    const brut = base + p + hs - r;
    const cnssSal = brut * CNSS_SAL;
    const cnssPat = brut * CNSS_PAT;
    const imposable = brut - cnssSal;
    const irppMensuel = calcIRPP(imposable * 12) / 12;
    const net = brut - cnssSal - irppMensuel;
    return { base, brut, cnssSal, cnssPat, irpp: irppMensuel, net };
  }, [emp, primes, retenues, heuresSupMontant]);

  const submit = async () => {
    if (!employeId || !calc) { toast.error("Sélectionnez un employé"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("bulletins_paie" as never).insert({
        employe_id: employeId, annee, mois,
        salaire_base: calc.base, primes: Number(primes) || 0,
        heures_supp_montant: Number(heuresSupMontant) || 0,
        retenues: Number(retenues) || 0, brut: calc.brut,
        cnss_salarial: calc.cnssSal, cnss_patronal: calc.cnssPat,
        irpp: calc.irpp, net_a_payer: calc.net,
      } as never);
      if (error) throw error;
      toast.success("Bulletin généré"); onSaved(); onClose();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Bulletin {MOIS_LABELS[mois - 1]} {annee}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Employé *</Label>
          <Select value={employeId} onValueChange={setEmployeId}>
            <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
            <SelectContent>{employes.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom} — {formatCurrency(e.salaire_base)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Primes (TND)</Label><Input type="number" value={primes} onChange={(e) => setPrimes(e.target.value)} /></div>
          <div><Label>Heures sup (TND)</Label><Input type="number" value={heuresSupMontant} onChange={(e) => setHeuresSupMontant(e.target.value)} /></div>
          <div><Label>Retenues (TND)</Label><Input type="number" value={retenues} onChange={(e) => setRetenues(e.target.value)} /></div>
        </div>
        {calc && (
          <Card>
            <CardContent className="p-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span>Salaire de base</span><span>{formatCurrency(calc.base)}</span></div>
              <div className="flex justify-between font-medium"><span>Salaire brut</span><span>{formatCurrency(calc.brut)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>CNSS salarial (9.18%)</span><span>−{formatCurrency(calc.cnssSal)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>IRPP mensuel</span><span>−{formatCurrency(calc.irpp)}</span></div>
              <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="font-semibold">Net à payer</span><span className="font-bold text-primary">{formatCurrency(calc.net)}</span></div>
              <div className="flex justify-between text-xs text-muted-foreground pt-1"><span>CNSS patronal (16.57%)</span><span>{formatCurrency(calc.cnssPat)}</span></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Coût employeur total</span><span className="font-medium">{formatCurrency(calc.brut + calc.cnssPat)}</span></div>
            </CardContent>
          </Card>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={submit} disabled={saving || !calc}>{saving ? "…" : "Générer"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
