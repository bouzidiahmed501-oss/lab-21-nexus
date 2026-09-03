import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Loader2, FileText, Download, Eye, Send } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { generateRapportPdf } from "@/lib/pdf/rapport";

export const Route = createFileRoute("/_authenticated/rapports")({
  head: () => ({ meta: [{ title: "Rapports — BALIMS" }] }),
  component: RapportsPage,
});

const STATUTS = ["brouillon", "en_validation", "valide", "envoye", "annule"] as const;
type Statut = (typeof STATUTS)[number];
const VAR: Record<Statut, "default" | "secondary" | "outline" | "destructive"> = {
  brouillon: "secondary", en_validation: "outline", valide: "default", envoye: "default", annule: "destructive",
};

interface Row {
  id: string; numero: string; titre: string; date_rapport: string;
  client_id: string; bc_id: string | null; statut: Statut; conclusion: string | null;
  clients: { raison_sociale: string; adresse: string | null; matricule_fiscal: string | null } | null;
  bons_commande: { numero: string } | null;
}

function RapportsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["rapports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rapports")
        .select("*, clients(raison_sociale,adresse,matricule_fiscal), bons_commande:bc_id(numero)")
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
      return [r.numero, r.titre, r.clients?.raison_sociale].filter(Boolean).some((v) => v!.toLowerCase().includes(q));
    });
  }, [rows, search, statutFilter]);

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: Statut }) => {
      const patch: { statut: Statut; validated_at?: string; envoye_at?: string } = { statut };
      if (statut === "valide") patch.validated_at = new Date().toISOString();
      if (statut === "envoye") patch.envoye_at = new Date().toISOString();
      const { error } = await supabase.from("rapports").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Statut mis à jour"); qc.invalidateQueries({ queryKey: ["rapports"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const handlePdf = async (rap: Row) => {
    try {
      const { data: links, error } = await supabase.from("rapport_analyses")
        .select("analyse_id, ordre, analyses(id,numero,date_debut,prelevements(numero))")
        .eq("rapport_id", rap.id).order("ordre");
      if (error) throw error;
      const analyses = await Promise.all((links ?? []).map(async (l) => {
        type Anly = { id: string; numero: string; date_debut: string | null; prelevements: { numero: string } | null };
        const a = l.analyses as unknown as Anly;
        const { data: res, error: e2 } = await supabase.from("analyse_resultats")
          .select("valeur, conformite, incertitude, lot_reactif, parametres_analyse(libelle,seuil_min,seuil_max), unites:unite_id(symbole), methodes_analyse:methode_id(libelle), equipements(designation), reactifs(nom)")
          .eq("analyse_id", a.id);
        if (e2) throw e2;
        type ResR = {
          valeur: string | null;
          conformite: boolean | null;
          incertitude: number | null;
          lot_reactif: string | null;
          equipements: { designation: string } | null;
          reactifs: { nom: string } | null;
          parametres_analyse: { libelle: string; seuil_min: number | null; seuil_max: number | null } | null;
          unites: { symbole: string } | null;
          methodes_analyse: { libelle: string } | null;
        };
        const rows = ((res ?? []) as unknown as ResR[]);
        const trParts = Array.from(new Set(rows.flatMap((r) => [
          r.equipements?.designation ? `Équip. ${r.equipements.designation}` : null,
          r.reactifs?.nom ? `Réactif ${r.reactifs.nom}${r.lot_reactif ? ` (lot ${r.lot_reactif})` : ""}` : null,
        ].filter(Boolean) as string[])));
        return {
          numero: a.numero,
          prelevement: a.prelevements?.numero ?? null,
          date_debut: a.date_debut,
          tracabilite: trParts.length > 0 ? trParts.join(" · ") : null,
          resultats: rows.map((r) => ({
            parametre: r.parametres_analyse?.libelle ?? "—",
            valeur: r.valeur ?? "—",
            unite: r.unites?.symbole ?? null,
            methode: r.methodes_analyse?.libelle ?? null,
            seuil_min: r.parametres_analyse?.seuil_min ?? null,
            seuil_max: r.parametres_analyse?.seuil_max ?? null,
            conformite: r.conformite,
            incertitude: r.incertitude,
          })),
        };
      }));

      const blob = await generateRapportPdf({
        numero: rap.numero, titre: rap.titre, date_rapport: rap.date_rapport,
        client: {
          raison_sociale: rap.clients?.raison_sociale ?? "",
          adresse: rap.clients?.adresse ?? undefined,
          matricule_fiscal: rap.clients?.matricule_fiscal ?? undefined,
        },
        bc_numero: rap.bons_commande?.numero ?? null,
        conclusion: rap.conclusion,
        analyses,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${rap.numero}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur PDF");
    }
  };

  return (
    <div>
      <PageHeader
        title="Rapports d'essai"
        description="Génération, validation et envoi des rapports aux clients."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouveau rapport</Button>}
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
          <EmptyState icon={FileText} title="Aucun rapport"
            description="Compilez les analyses validées en rapport d'essai officiel."
            action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouveau rapport</Button>} />
        ) : (
          <div className="rounded-lg border border-border/60 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead><TableHead>Date</TableHead>
                  <TableHead>Client</TableHead><TableHead>Titre</TableHead>
                  <TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm font-medium">{r.numero}</TableCell>
                    <TableCell>{formatDate(r.date_rapport)}</TableCell>
                    <TableCell>{r.clients?.raison_sociale ?? "—"}</TableCell>
                    <TableCell className="max-w-[260px] truncate">{r.titre}</TableCell>
                    <TableCell>
                      <Select value={r.statut} onValueChange={(v) => updateStatut.mutate({ id: r.id, statut: v as Statut })}>
                        <SelectTrigger className="h-7 w-36 text-xs"><Badge variant={VAR[r.statut]}>{r.statut}</Badge></SelectTrigger>
                        <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handlePdf(r)} title="Télécharger PDF"><Download className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <NewDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function NewDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [bcId, setBcId] = useState<string>("none");
  const [titre, setTitre] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: clients = [] } = useQuery({
    queryKey: ["clients_active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id,raison_sociale").eq("is_active", true).order("raison_sociale");
      if (error) throw error;
      return data;
    },
  });
  const { data: bcs = [] } = useQuery({
    queryKey: ["bcs_for_rap", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase.from("bons_commande").select("id,numero").eq("client_id", clientId).order("date_bc", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: analysesAvail = [] } = useQuery({
    queryKey: ["analyses_for_rap", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase.from("analyses")
        .select("id,numero,statut,date_debut,prelevements(numero)")
        .eq("client_id", clientId)
        .in("statut", ["termine", "valide_tech", "valide_chef", "valide_qualite"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const create = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error("Sélectionnez un client");
      if (!titre.trim()) throw new Error("Titre obligatoire");
      if (selected.size === 0) throw new Error("Sélectionnez au moins une analyse");
      z.string().max(300).parse(titre);
      z.string().max(2000).parse(conclusion);
      const numero = await nextNumero("RAP");
      const { data: rap, error: e1 } = await supabase.from("rapports").insert({
        numero, titre, client_id: clientId,
        bc_id: bcId === "none" ? null : bcId,
        date_rapport: new Date().toISOString().split("T")[0],
        conclusion: conclusion || null, statut: "brouillon",
      }).select("id").single();
      if (e1) throw e1;
      const links = Array.from(selected).map((analyse_id, i) => ({ rapport_id: rap.id, analyse_id, ordre: i }));
      const { error: e2 } = await supabase.from("rapport_analyses").insert(links);
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Rapport créé");
      qc.invalidateQueries({ queryKey: ["rapports"] });
      setClientId(""); setBcId("none"); setTitre(""); setConclusion(""); setSelected(new Set());
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nouveau rapport d'essai</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={clientId} onValueChange={(v) => { setClientId(v); setSelected(new Set()); setBcId("none"); }}>
                <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.raison_sociale}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bon de commande lié</Label>
              <Select value={bcId} onValueChange={setBcId} disabled={!clientId}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Aucun —</SelectItem>
                  {bcs.map((b) => <SelectItem key={b.id} value={b.id}>{b.numero}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Titre / Objet *</Label>
              <Input value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={300} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Analyses à inclure</Label>
            {!clientId ? (
              <p className="text-sm text-muted-foreground">Sélectionnez d'abord un client.</p>
            ) : analysesAvail.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune analyse terminée pour ce client.</p>
            ) : (
              <div className="rounded-lg border border-border/60 max-h-72 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="w-10"></TableHead><TableHead>N°</TableHead>
                    <TableHead>Prélèvement</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {analysesAvail.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell><Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggle(a.id)} /></TableCell>
                        <TableCell className="font-mono text-xs">{a.numero}</TableCell>
                        <TableCell className="font-mono text-xs">{(a.prelevements as { numero: string } | null)?.numero ?? "—"}</TableCell>
                        <TableCell>{formatDate(a.date_debut)}</TableCell>
                        <TableCell><Badge variant="outline">{a.statut}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Conclusion</Label>
            <Textarea value={conclusion} onChange={(e) => setConclusion(e.target.value)} rows={4} maxLength={2000} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Créer le rapport
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
