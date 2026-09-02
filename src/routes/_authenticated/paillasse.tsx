import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Grid3x3, Save, Search, X, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { EmptyState } from "@/components/lab/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/paillasse")({
  head: () => ({
    meta: [
      { title: "Saisie paillasse — BALIMS" },
      { name: "description", content: "Grille de saisie multi-échantillons pilotable au clavier avec contrôle des limites en temps réel." },
      { property: "og:title", content: "Saisie paillasse — BALIMS" },
      { property: "og:description", content: "Saisissez les résultats de plusieurs échantillons en une seule grille, avec verdict conforme / hors spécification immédiat." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaillassePage,
});

type Verdict = "conforme" | "hors_spec" | "neutre";

interface Param {
  id: string;
  libelle: string;
  seuil_min: number | null;
  seuil_max: number | null;
  symbole: string | null;
}

interface AnalyseRow {
  id: string;
  numero: string;
  statut: string;
  clients: { raison_sociale: string } | null;
  prelevements: { numero: string } | null;
}

interface Cell {
  resultatId?: string;
  valeur: string;
  dirty: boolean;
}

function verdictOf(p: Param, raw: string): Verdict {
  if (!raw.trim()) return "neutre";
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n)) return "neutre";
  const minOk = p.seuil_min == null || n >= p.seuil_min;
  const maxOk = p.seuil_max == null || n <= p.seuil_max;
  return minOk && maxOk ? "conforme" : "hors_spec";
}

const key = (analyseId: string, paramId: string) => `${analyseId}::${paramId}`;

function PaillassePage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("actives");
  const [selectedParams, setSelectedParams] = useState<string[]>([]);
  const [cells, setCells] = useState<Record<string, Cell>>({});
  const gridRef = useRef<HTMLDivElement>(null);

  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ["paillasse_analyses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select("id,numero,statut,clients(raison_sociale),prelevements(numero)")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data as unknown as AnalyseRow[];
    },
  });

  const { data: parametres = [] } = useQuery({
    queryKey: ["paillasse_parametres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parametres_analyse")
        .select("id,libelle,seuil_min,seuil_max,unite_id,unites:unite_id(symbole)")
        .eq("is_active", true)
        .order("libelle");
      if (error) throw error;
      return (data ?? []).map((p) => ({
        id: p.id,
        libelle: p.libelle,
        seuil_min: p.seuil_min != null ? Number(p.seuil_min) : null,
        seuil_max: p.seuil_max != null ? Number(p.seuil_max) : null,
        symbole: (p.unites as { symbole: string } | null)?.symbole ?? null,
      })) as Param[];
    },
  });

  // ANA-03 / ANA-04 : contexte de session rattaché à chaque résultat enregistré.
  const [sessMethode, setSessMethode] = useState("");
  const [sessEquipement, setSessEquipement] = useState("");
  const [sessReactif, setSessReactif] = useState("");
  const [sessLot, setSessLot] = useState("");
  const [sessIncertitude, setSessIncertitude] = useState("");

  const { data: methodes = [] } = useQuery({
    queryKey: ["paillasse_methodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("methodes_analyse").select("id,code,libelle").eq("is_active", true).order("libelle");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: equipements = [] } = useQuery({
    queryKey: ["paillasse_equipements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipements").select("id,code,designation,statut").eq("statut", "actif").order("designation");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: reactifs = [] } = useQuery({
    queryKey: ["paillasse_reactifs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reactifs").select("id,code,nom,numero_lot").order("nom").limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });


  const visibleAnalyses = useMemo(() => {
    const q = search.toLowerCase().trim();
    return analyses.filter((a) => {
      if (statutFilter === "actives" && !["a_faire", "en_cours"].includes(a.statut)) return false;
      if (statutFilter === "termine" && a.statut !== "termine") return false;
      if (!q) return true;
      return [a.numero, a.clients?.raison_sociale, a.prelevements?.numero]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [analyses, search, statutFilter]);

  const analyseIds = useMemo(() => visibleAnalyses.map((a) => a.id), [visibleAnalyses]);

  const { data: existing = [] } = useQuery({
    queryKey: ["paillasse_resultats", analyseIds],
    enabled: analyseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analyse_resultats")
        .select("id,analyse_id,parametre_id,valeur")
        .in("analyse_id", analyseIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Hydrate the grid with saved values (never clobber unsaved edits).
  useEffect(() => {
    setCells((prev) => {
      const next = { ...prev };
      for (const r of existing) {
        const k = key(r.analyse_id, r.parametre_id);
        if (next[k]?.dirty) continue;
        next[k] = { resultatId: r.id, valeur: r.valeur ?? "", dirty: false };
      }
      return next;
    });
  }, [existing]);

  const columns = useMemo(
    () => selectedParams.map((id) => parametres.find((p) => p.id === id)).filter(Boolean) as Param[],
    [selectedParams, parametres],
  );

  const setCell = useCallback((analyseId: string, paramId: string, valeur: string) => {
    const k = key(analyseId, paramId);
    setCells((prev) => ({ ...prev, [k]: { ...prev[k], valeur, dirty: true } }));
  }, []);

  const dirtyCount = useMemo(() => Object.values(cells).filter((c) => c.dirty).length, [cells]);

  const stats = useMemo(() => {
    let conforme = 0;
    let hors = 0;
    for (const a of visibleAnalyses) {
      for (const p of columns) {
        const v = cells[key(a.id, p.id)]?.valeur ?? "";
        const verdict = verdictOf(p, v);
        if (verdict === "conforme") conforme += 1;
        if (verdict === "hors_spec") hors += 1;
      }
    }
    return { conforme, hors };
  }, [visibleAnalyses, columns, cells]);

  // Keyboard: Enter / arrows walk the grid like a spreadsheet.
  const onCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, colIdx: number) => {
    const move = (dr: number, dc: number) => {
      e.preventDefault();
      const target = gridRef.current?.querySelector<HTMLInputElement>(
        `input[data-cell="${rowIdx + dr}-${colIdx + dc}"]`,
      );
      target?.focus();
      target?.select();
    };
    if (e.key === "Enter" || e.key === "ArrowDown") move(1, 0);
    else if (e.key === "ArrowUp") move(-1, 0);
    else if (e.key === "ArrowRight" && e.currentTarget.selectionStart === e.currentTarget.value.length) move(0, 1);
    else if (e.key === "ArrowLeft" && e.currentTarget.selectionStart === 0) move(0, -1);
  };

  const save = useMutation({
    mutationFn: async () => {
      const inserts: Record<string, unknown>[] = [];
      const updates: { id: string; payload: Record<string, unknown> }[] = [];
      const { data: auth } = await supabase.auth.getUser();
      const operateurId = auth.user?.id ?? null;


      for (const [k, cell] of Object.entries(cells)) {
        if (!cell.dirty) continue;
        const [analyseId, paramId] = k.split("::");
        const p = parametres.find((x) => x.id === paramId);
        if (!p) continue;
        const n = Number(cell.valeur.replace(",", "."));
        const numeric = cell.valeur.trim() && Number.isFinite(n) ? n : null;
        const verdict = verdictOf(p, cell.valeur);
        const incNum = Number(sessIncertitude.replace(",", "."));
        const payload = {
          valeur: cell.valeur.trim() || null,
          valeur_numerique: numeric,
          conformite: verdict === "neutre" ? null : verdict === "conforme",
          methode_id: sessMethode || null,
          equipement_id: sessEquipement || null,
          reactif_id: sessReactif || null,
          lot_reactif: sessLot.trim() || null,
          incertitude:
            numeric != null && sessIncertitude.trim() && Number.isFinite(incNum)
              ? Number(((numeric * incNum) / 100).toFixed(6))
              : null,
        };

        if (cell.resultatId) updates.push({ id: cell.resultatId, payload });
        else if (cell.valeur.trim()) {
          inserts.push({ analyse_id: analyseId, parametre_id: paramId, operateur_id: operateurId, ...payload });
        }
      }

      if (inserts.length) {
        const { error } = await supabase.from("analyse_resultats").insert(inserts as never);
        if (error) throw error;
      }
      for (const u of updates) {
        const { error } = await supabase.from("analyse_resultats").update(u.payload as never).eq("id", u.id);
        if (error) throw error;
      }

      // Any analysis that received a value moves out of "à faire".
      const touched = new Set(
        Object.entries(cells).filter(([, c]) => c.dirty && c.valeur.trim()).map(([k]) => k.split("::")[0]),
      );
      const toStart = visibleAnalyses.filter((a) => touched.has(a.id) && a.statut === "a_faire").map((a) => a.id);
      if (toStart.length) {
        await supabase.from("analyses").update({ statut: "en_cours" }).in("id", toStart);
      }
      return inserts.length + updates.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} résultat(s) enregistré(s)`);
      setCells((prev) => {
        const next: Record<string, Cell> = {};
        for (const [k, c] of Object.entries(prev)) next[k] = { ...c, dirty: false };
        return next;
      });
      qc.invalidateQueries({ queryKey: ["paillasse_resultats"] });
      qc.invalidateQueries({ queryKey: ["paillasse_analyses"] });
      qc.invalidateQueries({ queryKey: ["analyses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Ctrl+S saves the worksheet.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirtyCount > 0 && !save.isPending) save.mutate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dirtyCount, save]);

  const availableParams = parametres.filter((p) => !selectedParams.includes(p.id));

  return (
    <div>
      <PageHeader
        title="Saisie paillasse"
        description="Grille multi-échantillons pilotable au clavier : Entrée/flèches pour naviguer, Ctrl+S pour enregistrer."
        backTo="/analyses"
        actions={
          <Button onClick={() => save.mutate()} disabled={dirtyCount === 0 || save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer{dirtyCount > 0 ? ` (${dirtyCount})` : ""}
          </Button>
        }
      />

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Card className="border-l-4 border-l-muted-foreground shadow-none">
            <CardContent className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Échantillons</p>
              <p className="text-xl font-bold tabular-nums">{visibleAnalyses.length}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-info shadow-none">
            <CardContent className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Paramètres</p>
              <p className="text-xl font-bold tabular-nums text-info">{columns.length}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-success shadow-none">
            <CardContent className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Conformes</p>
              <p className="text-xl font-bold tabular-nums text-success">{stats.conforme}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive shadow-none">
            <CardContent className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Hors spécification</p>
              <p className="text-xl font-bold tabular-nums text-destructive">{stats.hors}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un échantillon…"
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statutFilter} onValueChange={setStatutFilter}>
            <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="actives">À faire + en cours</SelectItem>
              <SelectItem value="termine">Terminées</SelectItem>
              <SelectItem value="all">Toutes</SelectItem>
            </SelectContent>
          </Select>
          <Select value="" onValueChange={(v) => v && setSelectedParams((s) => [...s, v])}>
            <SelectTrigger className="w-64 h-9">
              <span className="flex items-center gap-2 text-sm">
                <Plus className="h-3.5 w-3.5" /> Ajouter un paramètre
              </span>
            </SelectTrigger>
            <SelectContent>
              {availableParams.length === 0 ? (
                <SelectItem value="__none" disabled>Aucun paramètre disponible</SelectItem>
              ) : (
                availableParams.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.libelle}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* ANA-03 / ANA-04 : traçabilité ISO 17025 appliquée aux résultats enregistrés */}
        <Card className="shadow-none">
          <CardContent className="grid gap-3 p-3 md:grid-cols-5">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Méthode</label>
              <Select value={sessMethode} onValueChange={setSessMethode}>
                <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {methodes.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.code ? `${m.code} — ` : ""}{m.libelle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Équipement</label>
              <Select value={sessEquipement} onValueChange={setSessEquipement}>
                <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {equipements.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.code ? `${e.code} — ` : ""}{e.designation}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Réactif</label>
              <Select
                value={sessReactif}
                onValueChange={(v) => {
                  setSessReactif(v);
                  const r = reactifs.find((x) => x.id === v);
                  if (r?.numero_lot) setSessLot(r.numero_lot);
                }}
              >
                <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {reactifs.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.code ? `${r.code} — ` : ""}{r.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Lot réactif</label>
              <Input className="h-9" value={sessLot} onChange={(e) => setSessLot(e.target.value)} placeholder="N° de lot" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Incertitude (%)</label>
              <Input
                className="h-9 tabular-nums"
                inputMode="decimal"
                value={sessIncertitude}
                onChange={(e) => setSessIncertitude(e.target.value)}
                placeholder="ex. 2,5"
              />
            </div>
          </CardContent>
        </Card>



        {columns.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {columns.map((p) => (
              <Badge key={p.id} variant="secondary" className="gap-1 py-1">
                {p.libelle}
                {(p.seuil_min != null || p.seuil_max != null) && (
                  <span className="text-[10px] text-muted-foreground">
                    [{p.seuil_min ?? "−∞"} ; {p.seuil_max ?? "+∞"}]
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`Retirer ${p.libelle}`}
                  className="ml-1 rounded-sm hover:text-destructive"
                  onClick={() => setSelectedParams((s) => s.filter((x) => x !== p.id))}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : columns.length === 0 ? (
          <EmptyState
            icon={Grid3x3}
            title="Choisissez les paramètres à saisir"
            description="Ajoutez une ou plusieurs colonnes (pH, conductivité, coliformes…) pour ouvrir la grille de saisie sur tous les échantillons filtrés."
          />
        ) : visibleAnalyses.length === 0 ? (
          <EmptyState
            icon={Grid3x3}
            title="Aucun échantillon dans ce filtre"
            description="Élargissez le filtre de statut ou effacez la recherche pour retrouver des analyses à saisir."
          />
        ) : (
          <div ref={gridRef} className="overflow-auto rounded-lg border border-border/60 bg-card max-h-[65vh]">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b border-border">
                  <th className="sticky left-0 z-20 bg-card px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground min-w-56">
                    Échantillon
                  </th>
                  {columns.map((p) => (
                    <th key={p.id} className="px-2 py-2 text-left text-[11px] font-semibold min-w-36 border-l border-border/60">
                      <div className="truncate">{p.libelle}</div>
                      <div className="text-[10px] font-normal text-muted-foreground">
                        {p.symbole ?? "—"} · [{p.seuil_min ?? "−∞"} ; {p.seuil_max ?? "+∞"}]
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleAnalyses.map((a, rowIdx) => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="sticky left-0 z-10 bg-card px-3 py-1.5">
                      <div className="font-mono text-xs font-medium">{a.numero}</div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {a.clients?.raison_sociale ?? "—"}
                        {a.prelevements?.numero ? ` · ${a.prelevements.numero}` : ""}
                      </div>
                    </td>
                    {columns.map((p, colIdx) => {
                      const cell = cells[key(a.id, p.id)];
                      const value = cell?.valeur ?? "";
                      const verdict = verdictOf(p, value);
                      return (
                        <td key={p.id} className="border-l border-border/60 p-0">
                          <div className="relative">
                            <Input
                              data-cell={`${rowIdx}-${colIdx}`}
                              value={value}
                              inputMode="decimal"
                              aria-label={`${p.libelle} pour ${a.numero}`}
                              onChange={(e) => setCell(a.id, p.id, e.target.value)}
                              onKeyDown={(e) => onCellKeyDown(e, rowIdx, colIdx)}
                              className={cn(
                                "h-9 rounded-none border-0 pr-7 tabular-nums shadow-none focus-visible:ring-1",
                                verdict === "conforme" && "bg-success/10 text-success-foreground",
                                verdict === "hors_spec" && "bg-destructive/10 font-semibold text-destructive",
                                cell?.dirty && "ring-1 ring-inset ring-primary/40",
                              )}
                            />
                            {verdict === "hors_spec" && (
                              <AlertTriangle className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-destructive" />
                            )}
                            {verdict === "conforme" && (
                              <CheckCircle2 className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-success" />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
