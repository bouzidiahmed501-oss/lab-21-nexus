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
import { Plus, Search, Wrench, ShieldCheck, AlertTriangle, Calendar, BarChart3, Download } from "lucide-react";
import { nextNumero } from "@/lib/numbering";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/equipements")({
  head: () => ({ meta: [{ title: "Équipements — BALIMS" }] }),
  component: EquipementsPage,
});

type Statut = "actif" | "maintenance" | "hors_service" | "reforme";
const STATUT_LABEL: Record<Statut, string> = {
  actif: "Actif", maintenance: "Maintenance", hors_service: "Hors service", reforme: "Réformé",
};
const STATUT_VARIANT: Record<Statut, "default" | "secondary" | "destructive" | "outline"> = {
  actif: "default", maintenance: "secondary", hors_service: "destructive", reforme: "outline",
};

function EquipementsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [tab, setTab] = useState("liste");

  const { data: equipements = [], isLoading } = useQuery({
    queryKey: ["equipements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipements" as never)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: allMaintenances = [] } = useQuery({
    queryKey: ["all_maintenances"],
    queryFn: async () => {
      const { data, error } = await supabase.from("maintenances" as never).select("*, equipements(designation, numero)").order("date_intervention", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => {
    return equipements.filter((e: any) => {
      const matchSearch =
        !search ||
        [e.numero, e.designation, e.marque, e.modele, e.numero_serie, e.localisation]
          .filter(Boolean)
          .some((s: string) => s.toLowerCase().includes(search.toLowerCase()));
      const matchStatut = statutFilter === "all" || e.statut === statutFilter;
      return matchSearch && matchStatut;
    });
  }, [equipements, search, statutFilter]);

  const today = new Date().toISOString().slice(0, 10);
  const stats = useMemo(() => {
    const total = equipements.length;
    const actifs = equipements.filter((e: any) => e.statut === "actif").length;
    const maint = equipements.filter((e: any) => e.statut === "maintenance").length;
    const etalRetard = equipements.filter(
      (e: any) => e.prochaine_etalonnage && e.prochaine_etalonnage < today,
    ).length;
    const etalJ30 = equipements.filter((e: any) => {
      if (!e.prochaine_etalonnage) return false;
      const d = new Date(e.prochaine_etalonnage);
      const diff = (d.getTime() - Date.now()) / 86400000;
      return diff > 0 && diff <= 30;
    }).length;
    const coutTotal = allMaintenances.reduce((s: number, m: any) => s + Number(m.cout || 0), 0);
    return { total, actifs, maint, etalRetard, etalJ30, coutTotal };
  }, [equipements, allMaintenances, today]);

  // Alertes étalonnage J-30
  const alertesEtal = useMemo(() => {
    return equipements.filter((e: any) => {
      if (!e.prochaine_etalonnage) return false;
      const d = new Date(e.prochaine_etalonnage);
      const diff = (d.getTime() - Date.now()) / 86400000;
      return diff <= 30;
    }).sort((a: any, b: any) => (a.prochaine_etalonnage > b.prochaine_etalonnage ? 1 : -1));
  }, [equipements]);

  // Coût par équipement
  const coutParEquipement = useMemo(() => {
    const map: Record<string, { designation: string; numero: string; cout: number; count: number }> = {};
    for (const m of allMaintenances) {
      const eqId = (m as any).equipement_id;
      if (!map[eqId]) map[eqId] = { designation: (m as any).equipements?.designation || "?", numero: (m as any).equipements?.numero || "", cout: 0, count: 0 };
      map[eqId].cout += Number(m.cout || 0);
      map[eqId].count += 1;
    }
    return Object.entries(map).sort(([, a], [, b]) => b.cout - a.cout);
  }, [allMaintenances]);

  const exportCSV = () => {
    const header = "numero;designation;marque;modele;statut;localisation;prochaine_etalonnage";
    const lines = equipements.map((e: any) => `${e.numero};${e.designation};${e.marque || ""};${e.modele || ""};${e.statut};${e.localisation || ""};${e.prochaine_etalonnage || ""}`);
    const blob = new Blob([header + "\n" + lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "equipements.csv"; a.click();
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Équipements & GMAO"
        description="Inventaire, étalonnage, maintenance et coûts — ISO 17025"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-3.5 w-3.5 mr-1" /> CSV</Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Nouvel équipement</Button>
              </DialogTrigger>
              <EquipementForm onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["equipements"] })} />
            </Dialog>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-6">
          <StatCard icon={<Wrench className="h-4 w-4" />} label="Total" value={stats.total} />
          <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="Actifs" value={stats.actifs} />
          <StatCard icon={<Wrench className="h-4 w-4" />} label="En maintenance" value={stats.maint} />
          <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Étal. en retard" value={stats.etalRetard} variant="destructive" />
          <StatCard icon={<Calendar className="h-4 w-4" />} label="Étal. J-30" value={stats.etalJ30} variant={stats.etalJ30 > 0 ? "warning" : undefined} />
          <StatCard icon={<BarChart3 className="h-4 w-4" />} label="Coût maint. total" value={formatCurrency(stats.coutTotal)} isText />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="liste">Liste</TabsTrigger>
            <TabsTrigger value="alertes"><AlertTriangle className="h-3.5 w-3.5 mr-1" /> Alertes ({alertesEtal.length})</TabsTrigger>
            <TabsTrigger value="couts"><BarChart3 className="h-3.5 w-3.5 mr-1" /> Coûts maintenance</TabsTrigger>
            <TabsTrigger value="calendrier"><Calendar className="h-3.5 w-3.5 mr-1" /> Calendrier</TabsTrigger>
          </TabsList>

          <TabsContent value="liste">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle>Liste des équipements</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Rechercher…" className="pl-8 md:w-72" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <Select value={statutFilter} onValueChange={setStatutFilter}>
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous statuts</SelectItem>
                        {Object.entries(STATUT_LABEL).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Chargement…</p>
                ) : filtered.length === 0 ? (
                  <EmptyState icon={Wrench} title="Aucun équipement" description="Ajoutez votre premier équipement." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numéro</TableHead><TableHead>Désignation</TableHead>
                        <TableHead>Marque/Modèle</TableHead><TableHead>Localisation</TableHead>
                        <TableHead>Statut</TableHead><TableHead>Prochain étalonnage</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((e: any) => {
                        const enRetard = e.prochaine_etalonnage && e.prochaine_etalonnage < today;
                        const j30 = e.prochaine_etalonnage && !enRetard && ((new Date(e.prochaine_etalonnage).getTime() - Date.now()) / 86400000) <= 30;
                        return (
                          <TableRow key={e.id}>
                            <TableCell className="font-mono text-xs">{e.numero}</TableCell>
                            <TableCell className="font-medium">{e.designation}</TableCell>
                            <TableCell className="text-sm">{[e.marque, e.modele].filter(Boolean).join(" / ") || "—"}</TableCell>
                            <TableCell className="text-sm">{e.localisation || "—"}</TableCell>
                            <TableCell><Badge variant={STATUT_VARIANT[e.statut as Statut]}>{STATUT_LABEL[e.statut as Statut]}</Badge></TableCell>
                            <TableCell className={enRetard ? "text-destructive font-medium" : j30 ? "text-orange-500 font-medium" : ""}>
                              {formatDate(e.prochaine_etalonnage)}
                              {enRetard && <span className="ml-1 text-[9px]">⚠ RETARD</span>}
                              {j30 && <span className="ml-1 text-[9px]">⏰ J-30</span>}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => setSelected(e)}>Détails</Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alertes">
            <Card>
              <CardHeader><CardTitle className="text-destructive">Alertes étalonnage</CardTitle></CardHeader>
              <CardContent>
                {alertesEtal.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Aucune alerte — tous les étalonnages sont à jour ✓</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Numéro</TableHead><TableHead>Désignation</TableHead><TableHead>Prochain étal.</TableHead><TableHead>Jours restants</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {alertesEtal.map((e: any) => {
                        const diff = Math.round((new Date(e.prochaine_etalonnage).getTime() - Date.now()) / 86400000);
                        return (
                          <TableRow key={e.id}>
                            <TableCell className="font-mono text-xs">{e.numero}</TableCell>
                            <TableCell>{e.designation}</TableCell>
                            <TableCell>{formatDate(e.prochaine_etalonnage)}</TableCell>
                            <TableCell className={diff < 0 ? "text-destructive font-bold" : "text-orange-500 font-medium"}>
                              {diff < 0 ? `${Math.abs(diff)}j en retard` : `${diff}j restants`}
                            </TableCell>
                            <TableCell>{diff < 0 ? <Badge variant="destructive">EN RETARD</Badge> : <Badge variant="secondary">À planifier</Badge>}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="couts">
            <Card>
              <CardHeader><CardTitle>Coûts de maintenance par équipement</CardTitle></CardHeader>
              <CardContent>
                {coutParEquipement.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Aucune donnée de maintenance</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Équipement</TableHead><TableHead>Numéro</TableHead><TableHead className="text-right">Interventions</TableHead><TableHead className="text-right">Coût total (TND)</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {coutParEquipement.map(([id, d]) => (
                        <TableRow key={id}>
                          <TableCell className="font-medium">{d.designation}</TableCell>
                          <TableCell className="font-mono text-xs">{d.numero}</TableCell>
                          <TableCell className="text-right">{d.count}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(d.cout)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2">
                        <TableCell colSpan={2}>Total</TableCell>
                        <TableCell className="text-right">{coutParEquipement.reduce((s, [, d]) => s + d.count, 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(coutParEquipement.reduce((s, [, d]) => s + d.cout, 0))}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendrier">
            <Card>
              <CardHeader><CardTitle>Calendrier des maintenances (dernières 20)</CardTitle></CardHeader>
              <CardContent>
                {allMaintenances.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Aucune maintenance enregistrée</p>
                ) : (
                  <div className="space-y-2">
                    {allMaintenances.slice(0, 20).map((m: any) => (
                      <div key={m.id} className="flex items-center gap-3 rounded-md border border-border/40 bg-muted/20 px-3 py-2">
                        <div className="text-xs font-mono w-20">{formatDate(m.date_intervention)}</div>
                        <Badge variant={m.type === "corrective" ? "destructive" : "secondary"} className="text-[9px]">{m.type}</Badge>
                        <span className="text-xs font-medium">{(m as any).equipements?.designation || "?"}</span>
                        <span className="text-xs text-muted-foreground flex-1 truncate">{m.description}</span>
                        {m.cout ? <span className="text-xs tabular-nums font-medium">{formatCurrency(m.cout)}</span> : null}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selected && (
        <EquipementDetail
          equipement={selected}
          onClose={() => setSelected(null)}
          onChanged={() => qc.invalidateQueries({ queryKey: ["equipements", "all_maintenances"] })}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, variant, isText }: { icon: React.ReactNode; label: string; value: number | string; variant?: "destructive" | "warning"; isText?: boolean }) {
  const bg = variant === "destructive" ? "bg-destructive/10 text-destructive" : variant === "warning" ? "bg-orange-500/10 text-orange-600" : "bg-primary/10 text-primary";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-md p-2 ${bg}`}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={isText ? "text-sm font-semibold" : "text-xl font-semibold"}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EquipementForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    designation: "", code: "", marque: "", modele: "", numero_serie: "",
    localisation: "", service: "", statut: "actif" as Statut,
    date_achat: "", date_mise_service: "", fournisseur: "", cout_achat: "",
    frequence_etalonnage_mois: "", prochaine_etalonnage: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.designation) { toast.error("Désignation requise"); return; }
    setSaving(true);
    try {
      const numero = await nextNumero("EQP");
      const { error } = await supabase.from("equipements" as never).insert({
        numero, designation: form.designation, code: form.code || null,
        marque: form.marque || null, modele: form.modele || null,
        numero_serie: form.numero_serie || null, localisation: form.localisation || null,
        service: form.service || null, statut: form.statut,
        date_achat: form.date_achat || null, date_mise_service: form.date_mise_service || null,
        fournisseur: form.fournisseur || null,
        cout_achat: form.cout_achat ? Number(form.cout_achat) : null,
        frequence_etalonnage_mois: form.frequence_etalonnage_mois ? Number(form.frequence_etalonnage_mois) : null,
        prochaine_etalonnage: form.prochaine_etalonnage || null,
        notes: form.notes || null,
      } as never);
      if (error) throw error;
      toast.success(`Équipement ${numero} créé`);
      onSaved(); onClose();
    } catch (e: any) { toast.error(e.message ?? "Erreur"); } finally { setSaving(false); }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Nouvel équipement</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Désignation *" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} />
        <Field label="Code interne" value={form.code} onChange={(v) => setForm({ ...form, code: v })} />
        <Field label="Marque" value={form.marque} onChange={(v) => setForm({ ...form, marque: v })} />
        <Field label="Modèle" value={form.modele} onChange={(v) => setForm({ ...form, modele: v })} />
        <Field label="N° série" value={form.numero_serie} onChange={(v) => setForm({ ...form, numero_serie: v })} />
        <Field label="Localisation" value={form.localisation} onChange={(v) => setForm({ ...form, localisation: v })} />
        <Field label="Service" value={form.service} onChange={(v) => setForm({ ...form, service: v })} />
        <div>
          <Label>Statut</Label>
          <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v as Statut })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(STATUT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Field label="Date achat" type="date" value={form.date_achat} onChange={(v) => setForm({ ...form, date_achat: v })} />
        <Field label="Date mise en service" type="date" value={form.date_mise_service} onChange={(v) => setForm({ ...form, date_mise_service: v })} />
        <Field label="Fournisseur" value={form.fournisseur} onChange={(v) => setForm({ ...form, fournisseur: v })} />
        <Field label="Coût achat (TND)" type="number" value={form.cout_achat} onChange={(v) => setForm({ ...form, cout_achat: v })} />
        <Field label="Fréquence étalonnage (mois)" type="number" value={form.frequence_etalonnage_mois} onChange={(v) => setForm({ ...form, frequence_etalonnage_mois: v })} />
        <Field label="Prochain étalonnage" type="date" value={form.prochaine_etalonnage} onChange={(v) => setForm({ ...form, prochaine_etalonnage: v })} />
      </div>
      <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "Enregistrement…" : "Créer"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (<div><Label>{label}</Label><Input type={type} value={value} onChange={(e) => onChange(e.target.value)} /></div>);
}

function EquipementDetail({ equipement, onClose, onChanged }: { equipement: any; onClose: () => void; onChanged: () => void }) {
  const qc = useQueryClient();

  const { data: etalonnages = [] } = useQuery({
    queryKey: ["etalonnages", equipement.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("etalonnages" as never).select("*").eq("equipement_id", equipement.id).order("date_etalonnage", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: maintenances = [] } = useQuery({
    queryKey: ["maintenances", equipement.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("maintenances" as never).select("*").eq("equipement_id", equipement.id).order("date_intervention", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const coutMaintTotal = maintenances.reduce((s: number, m: any) => s + Number(m.cout || 0), 0);
  const coutEtalTotal = etalonnages.reduce((s: number, e: any) => s + Number(e.cout || 0), 0);

  const addEtalonnage = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from("etalonnages" as never).insert({ equipement_id: equipement.id, ...payload } as never);
      if (error) throw error;
      if (payload.prochaine_date) {
        await supabase.from("equipements" as never).update({ prochaine_etalonnage: payload.prochaine_date } as never).eq("id", equipement.id);
      }
    },
    onSuccess: () => { toast.success("Étalonnage ajouté"); qc.invalidateQueries({ queryKey: ["etalonnages", equipement.id] }); onChanged(); },
    onError: (e: any) => toast.error(e.message),
  });

  const addMaintenance = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from("maintenances" as never).insert({ equipement_id: equipement.id, ...payload } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Maintenance enregistrée"); qc.invalidateQueries({ queryKey: ["maintenances", equipement.id, "all_maintenances"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{equipement.numero} — {equipement.designation}</DialogTitle></DialogHeader>
        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="etalonnage"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Étalonnages ({etalonnages.length})</TabsTrigger>
            <TabsTrigger value="maintenance"><Wrench className="mr-1 h-3.5 w-3.5" /> Maintenances ({maintenances.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-2">
            <InfoRow label="Marque / Modèle" value={[equipement.marque, equipement.modele].filter(Boolean).join(" / ") || "—"} />
            <InfoRow label="N° série" value={equipement.numero_serie || "—"} />
            <InfoRow label="Localisation" value={equipement.localisation || "—"} />
            <InfoRow label="Service" value={equipement.service || "—"} />
            <InfoRow label="Date achat" value={formatDate(equipement.date_achat)} />
            <InfoRow label="Mise en service" value={formatDate(equipement.date_mise_service)} />
            <InfoRow label="Coût achat" value={equipement.cout_achat ? formatCurrency(equipement.cout_achat) : "—"} />
            <InfoRow label="Fréquence étalonnage" value={equipement.frequence_etalonnage_mois ? `${equipement.frequence_etalonnage_mois} mois` : "—"} />
            <InfoRow label="Prochain étalonnage" value={formatDate(equipement.prochaine_etalonnage)} />
            <InfoRow label="Coût total maintenance" value={formatCurrency(coutMaintTotal)} />
            <InfoRow label="Coût total étalonnage" value={formatCurrency(coutEtalTotal)} />
            {equipement.notes && <p className="text-sm text-muted-foreground pt-2">{equipement.notes}</p>}
          </TabsContent>

          <TabsContent value="etalonnage">
            <EtalonnageForm onSubmit={(p) => addEtalonnage.mutate(p)} />
            <Table className="mt-4">
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Organisme</TableHead><TableHead>Certificat</TableHead><TableHead>Résultat</TableHead><TableHead>Prochaine</TableHead><TableHead className="text-right">Coût</TableHead></TableRow></TableHeader>
              <TableBody>
                {etalonnages.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.date_etalonnage)}</TableCell>
                    <TableCell>{e.organisme || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{e.numero_certificat || "—"}</TableCell>
                    <TableCell><Badge variant={e.resultat === "conforme" ? "default" : "destructive"}>{e.resultat}</Badge></TableCell>
                    <TableCell>{formatDate(e.prochaine_date)}</TableCell>
                    <TableCell className="text-right tabular-nums">{e.cout ? formatCurrency(e.cout) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="maintenance">
            <MaintenanceForm onSubmit={(p) => addMaintenance.mutate(p)} />
            <Table className="mt-4">
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead>Intervenant</TableHead><TableHead>Durée</TableHead><TableHead className="text-right">Coût</TableHead></TableRow></TableHeader>
              <TableBody>
                {maintenances.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell>{formatDate(m.date_intervention)}</TableCell>
                    <TableCell><Badge variant={m.type === "corrective" ? "destructive" : "secondary"}>{m.type}</Badge></TableCell>
                    <TableCell className="max-w-xs truncate">{m.description}</TableCell>
                    <TableCell>{m.intervenant || "—"}</TableCell>
                    <TableCell>{m.duree_arret_h ? `${m.duree_arret_h}h` : "—"}</TableCell>
                    <TableCell className="text-right">{m.cout ? formatCurrency(m.cout) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (<div className="flex justify-between border-b border-border/50 py-2 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>);
}

function EtalonnageForm({ onSubmit }: { onSubmit: (p: any) => void }) {
  const [f, setF] = useState({ date_etalonnage: new Date().toISOString().slice(0, 10), prochaine_date: "", organisme: "", numero_certificat: "", resultat: "conforme", cout: "", observations: "" });
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Nouvel étalonnage</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Field label="Date" type="date" value={f.date_etalonnage} onChange={(v) => setF({ ...f, date_etalonnage: v })} />
        <Field label="Prochaine date" type="date" value={f.prochaine_date} onChange={(v) => setF({ ...f, prochaine_date: v })} />
        <Field label="Organisme" value={f.organisme} onChange={(v) => setF({ ...f, organisme: v })} />
        <Field label="N° certificat" value={f.numero_certificat} onChange={(v) => setF({ ...f, numero_certificat: v })} />
        <div>
          <Label>Résultat</Label>
          <Select value={f.resultat} onValueChange={(v) => setF({ ...f, resultat: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="conforme">Conforme</SelectItem>
              <SelectItem value="non_conforme">Non conforme</SelectItem>
              <SelectItem value="avec_reserves">Avec réserves</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Field label="Coût (TND)" type="number" value={f.cout} onChange={(v) => setF({ ...f, cout: v })} />
        <div className="col-span-2">
          <Button size="sm" onClick={() => onSubmit({
            date_etalonnage: f.date_etalonnage, prochaine_date: f.prochaine_date || null,
            organisme: f.organisme || null, numero_certificat: f.numero_certificat || null,
            resultat: f.resultat, cout: f.cout ? Number(f.cout) : null, observations: f.observations || null,
          })}><Calendar className="mr-2 h-4 w-4" /> Enregistrer</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MaintenanceForm({ onSubmit }: { onSubmit: (p: any) => void }) {
  const [f, setF] = useState({ date_intervention: new Date().toISOString().slice(0, 10), type: "preventive", description: "", intervenant: "", cout: "", duree_arret_h: "" });
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Nouvelle intervention</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Field label="Date" type="date" value={f.date_intervention} onChange={(v) => setF({ ...f, date_intervention: v })} />
        <div>
          <Label>Type</Label>
          <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="preventive">Préventive</SelectItem>
              <SelectItem value="corrective">Corrective</SelectItem>
              <SelectItem value="verification">Vérification</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Field label="Intervenant" value={f.intervenant} onChange={(v) => setF({ ...f, intervenant: v })} />
        <Field label="Coût (TND)" type="number" value={f.cout} onChange={(v) => setF({ ...f, cout: v })} />
        <Field label="Durée arrêt (h)" type="number" value={f.duree_arret_h} onChange={(v) => setF({ ...f, duree_arret_h: v })} />
        <div className="col-span-2"><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="col-span-2">
          <Button size="sm" onClick={() => {
            if (!f.description) { toast.error("Description requise"); return; }
            onSubmit({
              date_intervention: f.date_intervention, type: f.type, description: f.description,
              intervenant: f.intervenant || null, cout: f.cout ? Number(f.cout) : null,
              duree_arret_h: f.duree_arret_h ? Number(f.duree_arret_h) : null,
            });
          }}><Wrench className="mr-2 h-4 w-4" /> Enregistrer</Button>
        </div>
      </CardContent>
    </Card>
  );
}
