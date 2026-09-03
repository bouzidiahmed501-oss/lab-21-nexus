import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Loader2, FlaskConical, Eye, CheckCircle2, XCircle, Trash2, Download, ChevronDown, Grid3x3, RotateCcw, History } from "lucide-react";

import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { EmptyState } from "@/components/lab/EmptyState";
import { StatusBadge, statutTone } from "@/components/lab/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { nextNumero } from "@/lib/numbering";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/analyses")({
  head: () => ({ meta: [{ title: "Analyses — BALIMS" }] }),
  component: AnalysesPage,
});

const STATUTS = ["a_faire", "en_cours", "termine", "valide_tech", "valide_chef", "valide_qualite", "rejete"] as const;
type Statut = (typeof STATUTS)[number];

const STATUT_LABEL: Record<Statut, string> = {
  a_faire: "À faire", en_cours: "En cours", termine: "Terminé",
  valide_tech: "V. Technicien", valide_chef: "V. Chef labo", valide_qualite: "V. Qualité", rejete: "Rejeté",
};

const WORKFLOW_ORDER: Statut[] = ["a_faire", "en_cours", "termine", "valide_tech", "valide_chef", "valide_qualite"];

interface Row {
  id: string; numero: string; statut: Statut;
  client_id: string; prelevement_id: string;
  date_debut: string | null; date_fin: string | null;
  notes: string | null; technicien_id: string | null;
  clients: { raison_sociale: string } | null;
  prelevements: { numero: string } | null;
}

function AnalysesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["analyses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select("*, clients(raison_sociale), prelevements(numero)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((r) => {
      if (statutFilter !== "all" && r.statut !== statutFilter) return false;
      if (!q) return true;
      return [r.numero, r.clients?.raison_sociale, r.prelevements?.numero]
        .filter(Boolean).some((v) => v!.toLowerCase().includes(q));
    });
  }, [rows, search, statutFilter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const aFaire = rows.filter(r => r.statut === "a_faire").length;
    const enCours = rows.filter(r => r.statut === "en_cours").length;
    const termine = rows.filter(r => ["termine", "valide_tech", "valide_chef", "valide_qualite"].includes(r.statut)).length;
    return { total, aFaire, enCours, termine };
  }, [rows]);

  return (
    <div>
      <PageHeader
        title="Analyses & Résultats"
        description="Saisie des résultats, conformité temps réel et validation multi-niveaux (Tech → Chef → Qualité)."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/paillasse"><Grid3x3 className="h-4 w-4" /> Saisie paillasse</Link>
            </Button>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouvelle analyse</Button>
          </>
        }

      />

      <div className="space-y-4 p-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Card className="border-l-4 border-l-muted-foreground shadow-none">
            <CardContent className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total</p>
              <p className="text-xl font-bold tabular-nums">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-warning shadow-none">
            <CardContent className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">À faire</p>
              <p className="text-xl font-bold tabular-nums text-warning">{stats.aFaire}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-info shadow-none">
            <CardContent className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">En cours</p>
              <p className="text-xl font-bold tabular-nums text-info">{stats.enCours}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-success shadow-none">
            <CardContent className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Terminées / Validées</p>
              <p className="text-xl font-bold tabular-nums text-success">{stats.termine}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher…" className="pl-9 h-9"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statutFilter} onValueChange={setStatutFilter}>
            <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              {STATUTS.map((s) => <SelectItem key={s} value={s}>{STATUT_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FlaskConical} title="Aucune analyse"
            description="Créez une analyse depuis un prélèvement reçu au laboratoire."
            action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouvelle analyse</Button>} />
        ) : (
          <div className="rounded-lg border border-border/60 bg-card">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px]">
                  <TableHead>N°</TableHead><TableHead>Client</TableHead>
                  <TableHead>Prélèvement</TableHead><TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead><TableHead>Statut</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const currentIdx = WORKFLOW_ORDER.indexOf(r.statut);
                  return (
                    <TableRow key={r.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-sm font-medium">{r.numero}</TableCell>
                      <TableCell className="text-sm">{r.clients?.raison_sociale ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.prelevements?.numero ?? "—"}</TableCell>
                      <TableCell className="text-xs">{formatDate(r.date_debut)}</TableCell>
                      <TableCell className="text-xs">{formatDate(r.date_fin)}</TableCell>
                      <TableCell><StatusBadge label={STATUT_LABEL[r.statut]} tone={statutTone(r.statut)} /></TableCell>
                      <TableCell>
                        <div className="flex gap-0.5">
                          {WORKFLOW_ORDER.map((s, i) => (
                            <div key={s} className={cn(
                              "h-1.5 w-4 rounded-full transition-colors",
                              i <= currentIdx ? "bg-primary" : "bg-muted",
                              r.statut === "rejete" && "bg-destructive"
                            )} title={STATUT_LABEL[s]} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(r.id)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <NewDialog open={open} onClose={() => setOpen(false)} />
      {editingId && <ResultsDialog id={editingId} onClose={() => setEditingId(null)} />}
    </div>
  );
}

/* ========== NEW DIALOG ========== */
function NewDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [prelId, setPrelId] = useState("");
  const [notes, setNotes] = useState("");

  const { data: prelevements = [] } = useQuery({
    queryKey: ["prel_recus"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prelevements")
        .select("id,numero,client_id,clients(raison_sociale)")
        .in("statut", ["effectue", "recu_labo"])
        .order("date_prelevement", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!prelId) throw new Error("Sélectionnez un prélèvement");
      const prel = prelevements.find((p) => p.id === prelId);
      if (!prel) throw new Error("Prélèvement introuvable");
      const numero = await nextNumero("ANA");
      const { error } = await supabase.from("analyses").insert({
        numero, prelevement_id: prelId, client_id: prel.client_id,
        date_debut: new Date().toISOString().split("T")[0],
        notes: notes || null, statut: "a_faire",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Analyse créée");
      qc.invalidateQueries({ queryKey: ["analyses"] });
      setPrelId(""); setNotes("");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle analyse</DialogTitle>
          <DialogDescription>Créer une analyse à partir d'un prélèvement reçu.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <div className="space-y-2">
            <Label>Prélèvement *</Label>
            <Select value={prelId} onValueChange={setPrelId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
              <SelectContent>
                {prelevements.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.numero} — {(p.clients as { raison_sociale: string } | null)?.raison_sociale}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

/* ========== RESULTS DIALOG ========== */
interface ResRow {
  id?: string;
  parametre_id: string;
  parametre_label?: string;
  valeur: string;
  valeur_numerique?: number | null;
  unite_id?: string | null;
  unite_symbole?: string;
  methode_id?: string | null;
  conformite?: boolean | null;
  incertitude?: number | null;
  observations?: string;
  seuil_min?: number | null;
  seuil_max?: number | null;
}

function ResultsDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState("resultats");

  const { data: analyse } = useQuery({
    queryKey: ["analyse", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("analyses")
        .select("*, clients(raison_sociale), prelevements(numero)")
        .eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: existing = [] } = useQuery({
    queryKey: ["analyse_resultats", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("analyse_resultats")
        .select("*, parametres_analyse(libelle, seuil_min, seuil_max, unites:unite_id(symbole)), equipements(nom), reactifs(nom)")
        .eq("analyse_id", id);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: equipements = [] } = useQuery({
    queryKey: ["equipements_actifs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipements")
        .select("id,nom").eq("statut", "actif").order("nom");
      if (error) throw error;
      return data;
    },
  });

  const { data: reactifs = [] } = useQuery({
    queryKey: ["reactifs_dispo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reactifs")
        .select("id,nom,numero_lot").order("nom");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: parametres = [] } = useQuery({
    queryKey: ["parametres_active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parametres_analyse")
        .select("id,libelle,seuil_min,seuil_max,unite_id,methode_id,unites:unite_id(symbole)")
        .eq("is_active", true).order("libelle");
      if (error) throw error;
      return data;
    },
  });

  const { data: validations = [] } = useQuery({
    queryKey: ["validations", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("validations")
        .select("*, profiles:validateur_id(email)")
        .eq("entity_type", "analyse").eq("entity_id", id)
        .order("created_at");
      if (error) throw error;
      return data as any[];
    },
  });

  const [resultats, setResultats] = useState<ResRow[]>([]);
  const [repetition, setRepetition] = useState(1);
  const [motifReprise, setMotifReprise] = useState<string | null>(null);
  const [trEquipement, setTrEquipement] = useState<string>("none");
  const [trReactif, setTrReactif] = useState<string>("none");
  const [trLot, setTrLot] = useState("");
  const [reOpen, setReOpen] = useState(false);
  const [reMotif, setReMotif] = useState("");

  const maxRepetition = useMemo(
    () => existing.reduce((m: number, e: any) => Math.max(m, e.repetition ?? 1), 1),
    [existing],
  );
  const historique = useMemo(
    () => existing.filter((e: any) => (e.repetition ?? 1) < repetition),
    [existing, repetition],
  );

  useEffect(() => { setRepetition(maxRepetition); }, [maxRepetition]);

  useEffect(() => {
    const current = existing.filter((e: any) => (e.repetition ?? 1) === repetition);
    if (current.length > 0) {
      const first: any = current[0];
      setTrEquipement(first.equipement_id ?? "none");
      setTrReactif(first.reactif_id ?? "none");
      setTrLot(first.lot_reactif ?? "");
      setMotifReprise(first.motif_reprise ?? null);
      setResultats(current.map((e: any) => ({
        id: e.id, parametre_id: e.parametre_id, valeur: e.valeur ?? "",
        valeur_numerique: e.valeur_numerique, unite_id: e.unite_id, methode_id: e.methode_id,
        conformite: e.conformite, incertitude: e.incertitude, observations: e.observations ?? "",
        parametre_label: e.parametres_analyse?.libelle,
        unite_symbole: (e.parametres_analyse?.unites as any)?.symbole,
        seuil_min: e.parametres_analyse?.seuil_min,
        seuil_max: e.parametres_analyse?.seuil_max,
      })));
    }
  }, [existing, repetition]);

  const addRow = () => setResultats((a) => [...a, { parametre_id: "", valeur: "", observations: "" }]);
  const removeRow = (i: number) => setResultats((a) => a.filter((_, idx) => idx !== i));

  const updateRow = useCallback((i: number, patch: Partial<ResRow>) => {
    setResultats((a) => a.map((r, idx) => {
      if (idx !== i) return r;
      const next = { ...r, ...patch };
      if (patch.parametre_id) {
        const p = parametres.find((x) => x.id === patch.parametre_id);
        if (p) {
          next.unite_id = p.unite_id;
          next.methode_id = p.methode_id;
          next.parametre_label = p.libelle;
          next.unite_symbole = (p.unites as any)?.symbole;
          next.seuil_min = p.seuil_min != null ? Number(p.seuil_min) : null;
          next.seuil_max = p.seuil_max != null ? Number(p.seuil_max) : null;
        }
      }
      if (patch.valeur !== undefined) {
        const n = Number(patch.valeur);
        next.valeur_numerique = Number.isFinite(n) ? n : null;
        if (next.valeur_numerique !== null) {
          const minOk = next.seuil_min == null || next.valeur_numerique >= next.seuil_min;
          const maxOk = next.seuil_max == null || next.valeur_numerique <= next.seuil_max;
          next.conformite = minOk && maxOk;
        } else {
          next.conformite = null;
        }
      }
      return next;
    }));
  }, [parametres]);

  const allConforme = resultats.length > 0 && resultats.every(r => r.conformite === true);
  const hasNC = resultats.some(r => r.conformite === false);

  const setAllConforme = () => {
    setResultats(prev => prev.map(r => {
      if (!r.parametre_id) return r;
      const p = parametres.find(x => x.id === r.parametre_id);
      if (!p) return r;
      const min = p.seuil_min != null ? Number(p.seuil_min) : null;
      const max = p.seuil_max != null ? Number(p.seuil_max) : null;
      if (min != null && max != null) {
        const mid = ((min + max) / 2).toFixed(2);
        return { ...r, valeur: mid, valeur_numerique: Number(mid), conformite: true };
      }
      return r;
    }));
  };

  const save = useMutation({
    mutationFn: async () => {
      const valid = resultats.filter((r) => r.parametre_id && r.valeur.trim());
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("analyse_resultats").delete()
        .eq("analyse_id", id).eq("repetition", repetition);
      if (valid.length > 0) {
        const { error } = await supabase.from("analyse_resultats").insert(
          valid.map((r) => ({
            analyse_id: id,
            parametre_id: r.parametre_id,
            valeur: r.valeur,
            valeur_numerique: r.valeur_numerique ?? null,
            unite_id: r.unite_id || null,
            methode_id: r.methode_id || null,
            conformite: r.conformite ?? null,
            incertitude: r.incertitude ?? null,
            observations: r.observations || null,
            equipement_id: trEquipement === "none" ? null : trEquipement,
            reactif_id: trReactif === "none" ? null : trReactif,
            lot_reactif: trLot || null,
            operateur_id: user?.id ?? null,
            repetition,
            motif_reprise: motifReprise,
          })),
        );
        if (error) throw error;
      }
      if (analyse?.statut === "a_faire" || analyse?.statut === "en_cours") {
        await supabase.from("analyses").update({
          statut: "termine" as any,
          date_fin: new Date().toISOString().split("T")[0],
        }).eq("id", id);
      }
    },
    onSuccess: () => {
      toast.success("Résultats enregistrés");
      qc.invalidateQueries({ queryKey: ["analyses"] });
      qc.invalidateQueries({ queryKey: ["analyse_resultats", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ANA-05 — reprise / répétition tracée
  const startReprise = () => {
    if (!reMotif.trim()) { toast.error("Motif de reprise obligatoire"); return; }
    setMotifReprise(reMotif.trim());
    setRepetition(maxRepetition + 1);
    setResultats((prev) => prev.map((r) => ({
      ...r, id: undefined, valeur: "", valeur_numerique: null, conformite: null, observations: "",
    })));
    setReOpen(false);
    setReMotif("");
    toast.success(`Répétition n°${maxRepetition + 1} ouverte — saisissez les nouvelles valeurs`);
  };

  const validate = useMutation({
    mutationFn: async (niveau: "technicien" | "chef_labo" | "qualite") => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      const { error: e1 } = await supabase.from("validations").insert({
        entity_type: "analyse", entity_id: id, niveau, decision: "valide", validateur_id: user.id,
      });
      if (e1) throw e1;
      const newStatut: Statut = niveau === "technicien" ? "valide_tech" : niveau === "chef_labo" ? "valide_chef" : "valide_qualite";
      const { error: e2 } = await supabase.from("analyses").update({ statut: newStatut as any }).eq("id", id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Validation enregistrée");
      qc.invalidateQueries({ queryKey: ["analyses"] });
      qc.invalidateQueries({ queryKey: ["analyse", id] });
      qc.invalidateQueries({ queryKey: ["validations", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const currentStatut = (analyse?.statut as Statut) ?? "a_faire";
  const canValidate = (niveau: string) => {
    if (niveau === "technicien") return currentStatut === "termine";
    if (niveau === "chef_labo") return currentStatut === "valide_tech";
    if (niveau === "qualite") return currentStatut === "valide_chef";
    return false;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Analyse {analyse?.numero}</span>
            <StatusBadge label={STATUT_LABEL[currentStatut]} tone={statutTone(currentStatut)} />
          </DialogTitle>
          <DialogDescription className="flex gap-4 text-xs">
            <span>Client : <strong>{(analyse?.clients as any)?.raison_sociale ?? "—"}</strong></span>
            <span>Prélèvement : <strong className="font-mono">{(analyse?.prelevements as any)?.numero ?? "—"}</strong></span>
            {analyse?.date_debut && <span>Début : {formatDate(analyse.date_debut as string)}</span>}
            {analyse?.date_fin && <span>Fin : {formatDate(analyse.date_fin as string)}</span>}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="mx-0">
            <TabsTrigger value="resultats">Résultats ({resultats.length})</TabsTrigger>
            <TabsTrigger value="validations">Validations ({validations.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="resultats" className="flex-1 overflow-y-auto space-y-3 mt-2">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {allConforme && <Badge className="bg-success/20 text-success border-success/40">Tous conformes</Badge>}
                {hasNC && <Badge variant="destructive">Non-conformité détectée</Badge>}
                <span className="text-xs text-muted-foreground">{resultats.filter(r => r.parametre_id).length} paramètre(s)</span>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={setAllConforme} className="text-xs h-7">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Tout conforme
                </Button>
                <Button variant="outline" size="sm" onClick={addRow} className="text-xs h-7">
                  <Plus className="h-3 w-3 mr-1" /> Paramètre
                </Button>
              </div>
            </div>

            {/* Results table */}
            <div className="rounded-lg border border-border/60 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-[11px]">
                    <TableHead className="w-52">Paramètre</TableHead>
                    <TableHead className="w-28">Valeur</TableHead>
                    <TableHead className="w-20">Unité</TableHead>
                    <TableHead className="w-28">Seuils (min/max)</TableHead>
                    <TableHead className="w-20">Incertitude</TableHead>
                    <TableHead className="w-20 text-center">Conformité</TableHead>
                    <TableHead>Observations</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultats.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                      Aucun résultat. Cliquez "Paramètre" pour commencer la saisie.
                    </TableCell></TableRow>
                  ) : resultats.map((r, i) => (
                    <TableRow key={i} className={cn(
                      "transition-colors",
                      r.conformite === false && "bg-destructive/5",
                      r.conformite === true && "bg-success/5"
                    )}>
                      <TableCell>
                        <Select value={r.parametre_id} onValueChange={(v) => updateRow(i, { parametre_id: v })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                          <SelectContent>
                            {parametres.map((p) => <SelectItem key={p.id} value={p.id}>{p.libelle}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input className="h-8 text-xs tabular-nums" value={r.valeur}
                          onChange={(e) => updateRow(i, { valeur: e.target.value })}
                          placeholder="0.00" />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.unite_symbole ?? "—"}</TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">
                        {r.seuil_min ?? "—"} / {r.seuil_max ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Input className="h-8 text-xs tabular-nums w-16" type="number" step="0.01"
                          value={r.incertitude ?? ""} placeholder="±"
                          onChange={(e) => updateRow(i, { incertitude: e.target.value ? Number(e.target.value) : null } as any)} />
                      </TableCell>
                      <TableCell className="text-center">
                        {r.conformite === null || r.conformite === undefined ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : r.conformite ? (
                          <Badge className="bg-success/20 text-success border-success/40 text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-0.5" /> OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">
                            <XCircle className="h-3 w-3 mr-0.5" /> NC
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input className="h-8 text-xs" value={r.observations ?? ""}
                          onChange={(e) => updateRow(i, { observations: e.target.value })}
                          placeholder="Notes…" />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeRow(i)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="validations" className="flex-1 overflow-y-auto space-y-3 mt-2">
            {validations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucune validation enregistrée.</p>
            ) : (
              <div className="space-y-2">
                {validations.map((v: any) => (
                  <div key={v.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium capitalize">{v.niveau}</p>
                      <p className="text-xs text-muted-foreground">{(v.profiles as any)?.email ?? "—"} · {formatDate(v.created_at)}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{v.decision}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t pt-3 gap-2">
          <div className="flex-1 flex gap-1">
            {(["technicien", "chef_labo", "qualite"] as const).map(n => (
              <Button key={n} variant="outline" size="sm" className="text-xs"
                disabled={!canValidate(n) || validate.isPending}
                onClick={() => validate.mutate(n)}>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Valider {n === "technicien" ? "Tech." : n === "chef_labo" ? "Chef" : "Qualité"}
              </Button>
            ))}
          </div>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer les résultats
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
