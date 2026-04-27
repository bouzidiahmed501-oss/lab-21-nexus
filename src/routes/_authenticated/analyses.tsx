import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Loader2, FlaskConical, Eye, CheckCircle2 } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/analyses")({
  head: () => ({ meta: [{ title: "Analyses — BALIMS" }] }),
  component: AnalysesPage,
});

const STATUTS = ["a_faire", "en_cours", "termine", "valide_tech", "valide_chef", "valide_qualite", "rejete"] as const;
type Statut = (typeof STATUTS)[number];

const VAR: Record<Statut, "default" | "secondary" | "outline" | "destructive"> = {
  a_faire: "outline", en_cours: "outline", termine: "secondary",
  valide_tech: "secondary", valide_chef: "default", valide_qualite: "default", rejete: "destructive",
};

const STATUT_LABEL: Record<Statut, string> = {
  a_faire: "À faire", en_cours: "En cours", termine: "Terminé",
  valide_tech: "V. Tech", valide_chef: "V. Chef", valide_qualite: "V. Qualité", rejete: "Rejeté",
};

interface Row {
  id: string; numero: string; statut: Statut;
  client_id: string; prelevement_id: string;
  date_debut: string | null; date_fin: string | null;
  notes: string | null;
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

  return (
    <div>
      <PageHeader
        title="Analyses & Résultats"
        description="Saisie des résultats d'analyse, conformité aux seuils et validation multi-niveaux."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouvelle analyse</Button>}
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
                <TableRow>
                  <TableHead>N°</TableHead><TableHead>Client</TableHead>
                  <TableHead>Prélèvement</TableHead><TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead><TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm font-medium">{r.numero}</TableCell>
                    <TableCell>{r.clients?.raison_sociale ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{r.prelevements?.numero ?? "—"}</TableCell>
                    <TableCell>{formatDate(r.date_debut)}</TableCell>
                    <TableCell>{formatDate(r.date_fin)}</TableCell>
                    <TableCell><Badge variant={VAR[r.statut]}>{STATUT_LABEL[r.statut]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEditingId(r.id)}><Eye className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
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
      z.string().max(1000).parse(notes);
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
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Nouvelle analyse</DialogTitle></DialogHeader>
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

interface ResRow {
  id?: string;
  parametre_id: string;
  valeur: string;
  valeur_numerique?: number | null;
  unite_id?: string | null;
  methode_id?: string | null;
  conformite?: boolean | null;
  observations?: string;
}

function ResultsDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();

  const { data: analyse } = useQuery({
    queryKey: ["analyse", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("analyses").select("*, clients(raison_sociale), prelevements(numero)").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const { data: existing = [] } = useQuery({
    queryKey: ["analyse_resultats", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("analyse_resultats").select("*, parametres_analyse(libelle, seuil_min, seuil_max, unites:unite_id(symbole))").eq("analyse_id", id);
      if (error) throw error;
      return data;
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

  const [resultats, setResultats] = useState<ResRow[]>([]);
  // Init quand existing change
  useState(() => { setResultats(existing.map((e) => ({
    id: e.id, parametre_id: e.parametre_id, valeur: e.valeur ?? "",
    valeur_numerique: e.valeur_numerique, unite_id: e.unite_id, methode_id: e.methode_id,
    conformite: e.conformite, observations: e.observations ?? "",
  }))); });

  const addRow = () => setResultats((a) => [...a, { parametre_id: "", valeur: "", observations: "" }]);
  const removeRow = (i: number) => setResultats((a) => a.filter((_, idx) => idx !== i));
  const updateRow = (i: number, patch: Partial<ResRow>) => {
    setResultats((a) => a.map((r, idx) => {
      if (idx !== i) return r;
      const next = { ...r, ...patch };
      if (patch.valeur !== undefined) {
        const n = Number(patch.valeur);
        next.valeur_numerique = Number.isFinite(n) ? n : null;
        const p = parametres.find((p) => p.id === next.parametre_id);
        if (p && next.valeur_numerique !== null && next.valeur_numerique !== undefined) {
          const minOk = p.seuil_min === null || next.valeur_numerique >= Number(p.seuil_min);
          const maxOk = p.seuil_max === null || next.valeur_numerique <= Number(p.seuil_max);
          next.conformite = minOk && maxOk;
        }
      }
      if (patch.parametre_id) {
        const p = parametres.find((x) => x.id === patch.parametre_id);
        if (p) { next.unite_id = p.unite_id; next.methode_id = p.methode_id; }
      }
      return next;
    }));
  };

  const save = useMutation({
    mutationFn: async () => {
      const valid = resultats.filter((r) => r.parametre_id && r.valeur.trim());
      // Delete then insert all
      await supabase.from("analyse_resultats").delete().eq("analyse_id", id);
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
            observations: r.observations || null,
          })),
        );
        if (error) throw error;
      }
      // Update statut to termine if not already validated
      await supabase.from("analyses").update({
        statut: "termine",
        date_fin: new Date().toISOString().split("T")[0],
      }).eq("id", id);
    },
    onSuccess: () => {
      toast.success("Résultats enregistrés");
      qc.invalidateQueries({ queryKey: ["analyses"] });
      qc.invalidateQueries({ queryKey: ["analyse_resultats", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const validate = useMutation({
    mutationFn: async (niveau: "technicien" | "chef_labo" | "qualite") => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      const { error: e1 } = await supabase.from("validations").insert({
        entity_type: "analyse", entity_id: id, niveau, decision: "valide", validateur_id: user.id,
      });
      if (e1) throw e1;
      const newStatut: Statut = niveau === "technicien" ? "valide_tech" : niveau === "chef_labo" ? "valide_chef" : "valide_qualite";
      const { error: e2 } = await supabase.from("analyses").update({ statut: newStatut }).eq("id", id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Validation enregistrée");
      qc.invalidateQueries({ queryKey: ["analyses"] });
      qc.invalidateQueries({ queryKey: ["analyse", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Analyse {analyse?.numero} — {(analyse?.clients as { raison_sociale: string } | null)?.raison_sociale ?? ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Prélèvement : <span className="font-mono">{(analyse?.prelevements as { numero: string } | null)?.numero ?? "—"}</span>
              {analyse?.statut && (<> · Statut : <Badge variant={VAR[analyse.statut as Statut]}>{STATUT_LABEL[analyse.statut as Statut]}</Badge></>)}
            </p>
            <Button variant="outline" size="sm" onClick={addRow}><Plus className="h-3 w-3" /> Paramètre</Button>
          </div>

          <div className="rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-56">Paramètre</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead className="w-24">Seuils</TableHead>
                  <TableHead className="w-20">Unité</TableHead>
                  <TableHead className="w-24">Conformité</TableHead>
                  <TableHead>Observations</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultats.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                    Aucun résultat. Cliquez sur "Paramètre" pour en ajouter.
                  </TableCell></TableRow>
                ) : resultats.map((r, i) => {
                  const p = parametres.find((x) => x.id === r.parametre_id);
                  return (
                    <TableRow key={i}>
                      <TableCell>
                        <Select value={r.parametre_id} onValueChange={(v) => updateRow(i, { parametre_id: v })}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            {parametres.map((p) => <SelectItem key={p.id} value={p.id}>{p.libelle}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input className="h-8" value={r.valeur} onChange={(e) => updateRow(i, { valeur: e.target.value })} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p ? `${p.seuil_min ?? "—"} / ${p.seuil_max ?? "—"}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs">{(p?.unites as { symbole: string } | null)?.symbole ?? "—"}</TableCell>
                      <TableCell>
                        {r.conformite === null || r.conformite === undefined ? "—" : r.conformite ? <Badge>OK</Badge> : <Badge variant="destructive">NC</Badge>}
                      </TableCell>
                      <TableCell><Input className="h-8" value={r.observations ?? ""} onChange={(e) => updateRow(i, { observations: e.target.value })} /></TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => removeRow(i)}>×</Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => validate.mutate("technicien")} disabled={validate.isPending}>
                <CheckCircle2 className="h-3 w-3" /> Valider Technicien
              </Button>
              <Button size="sm" variant="outline" onClick={() => validate.mutate("chef_labo")} disabled={validate.isPending}>
                <CheckCircle2 className="h-3 w-3" /> Valider Chef Labo
              </Button>
              <Button size="sm" variant="outline" onClick={() => validate.mutate("qualite")} disabled={validate.isPending}>
                <CheckCircle2 className="h-3 w-3" /> Valider Qualité
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Fermer</Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
