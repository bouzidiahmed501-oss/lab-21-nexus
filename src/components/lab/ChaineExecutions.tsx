import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/lab/EmptyState";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Play, Check, Loader2, Workflow, AlertTriangle, Square } from "lucide-react";
import { logAudit } from "@/lib/audit";

type ExecEtape = {
  id: string;
  ordre: number;
  libelle: string;
  duree_prevue_minutes: number | null;
  instructions: string | null;
  statut: string;
  started_at: string | null;
  ended_at: string | null;
  commentaire: string | null;
};

type Exec = {
  id: string;
  statut: string;
  started_at: string;
  ended_at: string | null;
  commentaire: string | null;
  chaines_analyse: { code: string; libelle: string } | null;
  echantillons: { code_barre: string; designation: string } | null;
  etapes: ExecEtape[];
};

function minutesSince(iso: string | null) {
  if (!iso) return 0;
  return Math.round((Date.now() - new Date(iso).getTime()) / 60000);
}

function etapeRetard(e: ExecEtape) {
  if (!e.duree_prevue_minutes || !e.started_at) return false;
  const fin = e.ended_at ? new Date(e.ended_at).getTime() : Date.now();
  const ecoule = Math.round((fin - new Date(e.started_at).getTime()) / 60000);
  return ecoule > e.duree_prevue_minutes;
}

export function ChaineExecutions({ chaines }: { chaines: any[] }) {
  const qc = useQueryClient();
  const [launchOpen, setLaunchOpen] = useState(false);
  const [chaineId, setChaineId] = useState("");
  const [echantillonId, setEchantillonId] = useState("");

  const { data: executions = [], isLoading } = useQuery({
    queryKey: ["chaine-executions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chaine_executions" as never)
        .select(
          "*, chaines_analyse(code,libelle), echantillons(code_barre,designation), etapes:chaine_execution_etapes(*)",
        )
        .order("started_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as Exec[];
    },
  });

  const { data: echantillons = [] } = useQuery({
    queryKey: ["ech-lite-chain-exec"],
    queryFn: async () => {
      const { data } = await supabase
        .from("echantillons")
        .select("id, code_barre, designation")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const launch = useMutation({
    mutationFn: async () => {
      const chaine = chaines.find((c) => c.id === chaineId);
      if (!chaine) throw new Error("Chaîne introuvable");
      const etapes = [...(chaine.etapes ?? [])].sort((a: any, b: any) => a.ordre - b.ordre);
      if (etapes.length === 0) throw new Error("Cette chaîne n'a aucune étape définie");
      const { data: userRes } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("chaine_executions" as never)
        .insert({
          chaine_id: chaineId,
          echantillon_id: echantillonId || null,
          statut: "en_cours",
          created_by: userRes.user?.id ?? null,
        } as never)
        .select()
        .single();
      if (error) throw error;
      const execId = (data as any).id;
      const rows = etapes.map((e: any, i: number) => ({
        execution_id: execId,
        etape_id: e.id,
        ordre: i + 1,
        libelle: e.libelle,
        duree_prevue_minutes: e.duree_minutes,
        instructions: e.instructions,
        equipement_id: e.equipement_id,
        statut: "a_faire",
      }));
      const { error: e2 } = await supabase.from("chaine_execution_etapes" as never).insert(rows as never);
      if (e2) throw e2;
      await logAudit({ action: "create", entity_type: "chaine_execution", entity_id: execId });
    },
    onSuccess: () => {
      toast.success("Chaîne lancée");
      qc.invalidateQueries({ queryKey: ["chaine-executions"] });
      setLaunchOpen(false);
      setChaineId("");
      setEchantillonId("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateEtape = useMutation({
    mutationFn: async ({ etape, action, exec }: { etape: ExecEtape; action: "start" | "done"; exec: Exec }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const patch =
        action === "start"
          ? { statut: "en_cours", started_at: new Date().toISOString(), operateur_id: userRes.user?.id ?? null }
          : { statut: "termine", ended_at: new Date().toISOString(), operateur_id: userRes.user?.id ?? null };
      const { error } = await supabase.from("chaine_execution_etapes" as never).update(patch as never).eq("id", etape.id);
      if (error) throw error;
      if (action === "done") {
        const reste = exec.etapes.filter((e) => e.id !== etape.id && e.statut !== "termine");
        if (reste.length === 0) {
          await supabase
            .from("chaine_executions" as never)
            .update({ statut: "termine", ended_at: new Date().toISOString() } as never)
            .eq("id", exec.id);
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chaine-executions"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const abort = useMutation({
    mutationFn: async (exec: Exec) => {
      const { error } = await supabase
        .from("chaine_executions" as never)
        .update({ statut: "annule", ended_at: new Date().toISOString() } as never)
        .eq("id", exec.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Exécution annulée");
      qc.invalidateQueries({ queryKey: ["chaine-executions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const chainesAvecEtapes = useMemo(() => chaines.filter((c) => (c.etapes ?? []).length > 0), [chaines]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setLaunchOpen(true)}>
          <Play className="mr-2 h-4 w-4" />
          Lancer une chaîne
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : executions.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Workflow}
              title="Aucune exécution"
              description="Lancez une chaîne sur un échantillon pour suivre l'avancement étape par étape"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {executions.map((exec) => {
            const etapes = [...(exec.etapes ?? [])].sort((a, b) => a.ordre - b.ordre);
            const done = etapes.filter((e) => e.statut === "termine").length;
            const pct = etapes.length ? Math.round((done / etapes.length) * 100) : 0;
            const enRetard = etapes.some(etapeRetard);
            return (
              <Card key={exec.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {exec.chaines_analyse?.code} — {exec.chaines_analyse?.libelle}
                        </span>
                        {exec.statut === "termine" ? (
                          <Badge>Terminée</Badge>
                        ) : exec.statut === "annule" ? (
                          <Badge variant="secondary">Annulée</Badge>
                        ) : (
                          <Badge variant="outline">En cours</Badge>
                        )}
                        {enRetard && exec.statut === "en_cours" && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Délai dépassé
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {exec.echantillons
                          ? `${exec.echantillons.code_barre} — ${exec.echantillons.designation}`
                          : "Sans échantillon"}{" "}
                        · démarrée il y a {minutesSince(exec.started_at)} min
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32">
                        <Progress value={pct} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {done}/{etapes.length}
                      </span>
                      {exec.statut === "en_cours" && (
                        <Button variant="ghost" size="icon" onClick={() => abort.mutate(exec)} title="Annuler">
                          <Square className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    {etapes.map((e) => {
                      const retard = etapeRetard(e);
                      return (
                        <div
                          key={e.id}
                          className="flex flex-wrap items-center gap-2 rounded border p-2 text-sm"
                        >
                          <span className="font-mono text-xs text-muted-foreground">#{e.ordre}</span>
                          <span className={e.statut === "termine" ? "line-through text-muted-foreground" : ""}>
                            {e.libelle}
                          </span>
                          {e.duree_prevue_minutes && (
                            <span className="text-xs text-muted-foreground">({e.duree_prevue_minutes} min prévues)</span>
                          )}
                          {e.statut === "en_cours" && (
                            <Badge variant="outline" className="text-xs">
                              {minutesSince(e.started_at)} min écoulées
                            </Badge>
                          )}
                          {retard && (
                            <Badge variant="destructive" className="gap-1 text-xs">
                              <AlertTriangle className="h-3 w-3" />
                              Dépassement
                            </Badge>
                          )}
                          <div className="ml-auto flex gap-1">
                            {exec.statut === "en_cours" && e.statut === "a_faire" && (
                              <Button size="sm" variant="outline" onClick={() => updateEtape.mutate({ etape: e, action: "start", exec })}>
                                <Play className="mr-1 h-3 w-3" />
                                Démarrer
                              </Button>
                            )}
                            {exec.statut === "en_cours" && e.statut === "en_cours" && (
                              <Button size="sm" onClick={() => updateEtape.mutate({ etape: e, action: "done", exec })}>
                                <Check className="mr-1 h-3 w-3" />
                                Terminer
                              </Button>
                            )}
                            {e.statut === "termine" && (
                              <Badge variant="secondary" className="text-xs">
                                Terminée
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {exec.commentaire && <p className="text-xs text-muted-foreground">{exec.commentaire}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={launchOpen} onOpenChange={setLaunchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lancer une chaîne d'analyse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Chaîne *</Label>
              <Select value={chaineId} onValueChange={setChaineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {chainesAvecEtapes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.libelle} ({c.etapes.length} étapes)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Échantillon</Label>
              <Select value={echantillonId} onValueChange={setEchantillonId}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {(echantillons as any[]).map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.code_barre} — {e.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLaunchOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => launch.mutate()} disabled={!chaineId || launch.isPending}>
              {launch.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lancer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
