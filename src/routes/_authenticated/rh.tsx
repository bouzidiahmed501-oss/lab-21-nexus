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
import { Plus, Search, Users, Calendar, Receipt, FileText } from "lucide-react";
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

// Tunisia payroll constants
const CNSS_SAL = 0.0918; // 9.18% salarié
const CNSS_PAT = 0.1657; // 16.57% patronal
function calcIRPP(brutAnnuel: number): number {
  // Barème simplifié Tunisie 2024 (annuel)
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
      <PageHeader title="RH & Paie" description="Employés, congés, pointages et bulletins de paie (Tunisie)" />
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

  const { data: employes = [] } = useQuery({
    queryKey: ["employes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employes" as never).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => employes.filter((e: any) =>
    !search || [e.numero, e.nom, e.prenom, e.matricule, e.fonction, e.service].filter(Boolean).some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
  ), [employes, search]);

  const actifs = employes.filter((e: any) => e.is_active).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total employés</p><p className="text-2xl font-semibold">{employes.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Actifs</p><p className="text-2xl font-semibold text-primary">{actifs}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Masse salariale base</p><p className="text-2xl font-semibold">{formatCurrency(employes.filter((e: any) => e.is_active).reduce((s: number, e: any) => s + Number(e.salaire_base || 0), 0))}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Liste des employés</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-8 w-64" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
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
                <TableHead>Matricule</TableHead><TableHead>Nom</TableHead><TableHead>Fonction</TableHead>
                <TableHead>Service</TableHead><TableHead>Contrat</TableHead><TableHead>Embauche</TableHead>
                <TableHead className="text-right">Salaire base</TableHead><TableHead>Statut</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">{e.matricule || e.numero}</TableCell>
                    <TableCell className="font-medium">{e.prenom} {e.nom}</TableCell>
                    <TableCell>{e.fonction || "—"}</TableCell>
                    <TableCell>{e.service || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{CONTRAT_LABEL[e.contrat_type]}</Badge></TableCell>
                    <TableCell>{formatDate(e.date_embauche)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(e.salaire_base)}</TableCell>
                    <TableCell>{e.is_active ? <Badge>Actif</Badge> : <Badge variant="secondary">Inactif</Badge>}</TableCell>
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

function EmployeForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    nom: "", prenom: "", matricule: "", cin: "", cnss: "", email: "", telephone: "",
    fonction: "", service: "", contrat_type: "cdi",
    date_embauche: new Date().toISOString().slice(0, 10), salaire_base: "",
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
      } as never);
      if (error) throw error;
      toast.success(`Employé ${numero} créé`);
      onSaved(); onClose();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const fields: { k: keyof typeof f; label: string; type?: string }[] = [
    { k: "nom", label: "Nom *" },
    { k: "prenom", label: "Prénom *" },
    { k: "matricule", label: "Matricule" },
    { k: "cin", label: "CIN" },
    { k: "cnss", label: "N° CNSS" },
    { k: "email", label: "Email", type: "email" },
    { k: "telephone", label: "Téléphone" },
    { k: "fonction", label: "Fonction" },
    { k: "service", label: "Service" },
  ];

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>Nouvel employé</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        {fields.map((fd) => (
          <div key={fd.k}>
            <Label>{fd.label}</Label>
            <Input
              type={fd.type ?? "text"}
              value={f[fd.k]}
              onChange={(e) => setF({ ...f, [fd.k]: e.target.value })}
            />
          </div>
        ))}
        <div>
          <Label>Type contrat</Label>
          <Select value={f.contrat_type} onValueChange={(v) => setF({ ...f, contrat_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CONTRAT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Date embauche</Label>
          <Input type="date" value={f.date_embauche} onChange={(e) => setF({ ...f, date_embauche: e.target.value })} />
        </div>
        <div>
          <Label>Salaire base (TND)</Label>
          <Input type="number" value={f.salaire_base} onChange={(e) => setF({ ...f, salaire_base: e.target.value })} />
        </div>
      </div>
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

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const { error } = await supabase.from("conges" as never).update({
        statut, date_validation: new Date().toISOString(),
      } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Statut mis à jour"); qc.invalidateQueries({ queryKey: ["conges"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Demandes de congés</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Nouvelle demande</Button></DialogTrigger>
              <CongeForm onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["conges"] })} />
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {conges.length === 0 ? (
            <EmptyState icon={Calendar} title="Aucune demande" description="Aucune demande de congé enregistrée." />
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Employé</TableHead><TableHead>Type</TableHead><TableHead>Du</TableHead>
                <TableHead>Au</TableHead><TableHead>Jours</TableHead><TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {conges.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.employes ? `${c.employes.prenom} ${c.employes.nom}` : "—"}</TableCell>
                    <TableCell><Badge variant="outline">{CONGE_TYPE[c.type]}</Badge></TableCell>
                    <TableCell>{formatDate(c.date_debut)}</TableCell>
                    <TableCell>{formatDate(c.date_fin)}</TableCell>
                    <TableCell className="font-medium">{c.nb_jours}</TableCell>
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
            <SelectContent>
              {employes.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type</Label>
          <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CONGE_TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
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

  const { data: bulletins = [] } = useQuery({
    queryKey: ["bulletins", annee, mois],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bulletins_paie" as never)
        .select("*, employes(nom, prenom, matricule)")
        .eq("annee", annee).eq("mois", mois)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const totalNet = bulletins.reduce((s: number, b: any) => s + Number(b.net_a_payer || 0), 0);
  const totalBrut = bulletins.reduce((s: number, b: any) => s + Number(b.brut || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Bulletins</p><p className="text-2xl font-semibold">{bulletins.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total brut</p><p className="text-2xl font-semibold">{formatCurrency(totalBrut)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total net</p><p className="text-2xl font-semibold text-primary">{formatCurrency(totalNet)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Bulletins {String(mois).padStart(2, "0")}/{annee}</CardTitle>
            <div className="flex gap-2">
              <Select value={String(mois)} onValueChange={(v) => setMois(Number(v))}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{String(i + 1).padStart(2, "0")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(annee)} onValueChange={(v) => setAnnee(Number(v))}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Générer bulletin</Button></DialogTrigger>
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
                <TableHead>Employé</TableHead><TableHead className="text-right">Brut</TableHead>
                <TableHead className="text-right">CNSS</TableHead><TableHead className="text-right">IRPP</TableHead>
                <TableHead className="text-right">Net</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {bulletins.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.employes ? `${b.employes.prenom} ${b.employes.nom}` : "—"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(b.brut)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(b.cnss_salarial)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(b.irpp)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(b.net_a_payer)}</TableCell>
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
  const [saving, setSaving] = useState(false);

  const emp = employes.find((e: any) => e.id === employeId);
  const calc = useMemo(() => {
    if (!emp) return null;
    const base = Number(emp.salaire_base) || 0;
    const p = Number(primes) || 0;
    const r = Number(retenues) || 0;
    const brut = base + p - r;
    const cnssSal = brut * CNSS_SAL;
    const cnssPat = brut * CNSS_PAT;
    const imposable = brut - cnssSal;
    const irppMensuel = calcIRPP(imposable * 12) / 12;
    const net = brut - cnssSal - irppMensuel;
    return { brut, cnssSal, cnssPat, irpp: irppMensuel, net };
  }, [emp, primes, retenues]);

  const submit = async () => {
    if (!employeId || !calc) { toast.error("Sélectionnez un employé"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("bulletins_paie" as never).insert({
        employe_id: employeId, annee, mois,
        salaire_base: emp.salaire_base, primes: Number(primes) || 0,
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
      <DialogHeader><DialogTitle>Bulletin {String(mois).padStart(2, "0")}/{annee}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Employé *</Label>
          <Select value={employeId} onValueChange={setEmployeId}>
            <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
            <SelectContent>
              {employes.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom} — {formatCurrency(e.salaire_base)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Primes (TND)</Label><Input type="number" value={primes} onChange={(e) => setPrimes(e.target.value)} /></div>
          <div><Label>Retenues (TND)</Label><Input type="number" value={retenues} onChange={(e) => setRetenues(e.target.value)} /></div>
        </div>
        {calc && (
          <Card>
            <CardContent className="p-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span>Salaire brut</span><span className="font-medium">{formatCurrency(calc.brut)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>CNSS salarial (9.18%)</span><span>−{formatCurrency(calc.cnssSal)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>IRPP</span><span>−{formatCurrency(calc.irpp)}</span></div>
              <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="font-semibold">Net à payer</span><span className="font-bold text-primary">{formatCurrency(calc.net)}</span></div>
              <div className="flex justify-between text-xs text-muted-foreground pt-1"><span>CNSS patronal (16.57%)</span><span>{formatCurrency(calc.cnssPat)}</span></div>
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
