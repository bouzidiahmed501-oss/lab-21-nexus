import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, Trash2, ScanLine, AlertTriangle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, statutTone } from "@/components/lab/StatusBadge";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reception-scan")({
  head: () => ({ meta: [{ title: "Réception — Scan code-barres" }] }),
  component: ReceptionScanPage,
});

interface Found {
  id: string;
  numero: string;
  code_barre: string | null;
  statut: string;
  date_prelevement: string | null;
  date_reception: string | null;
  lieu: string | null;
  temperature: number | null;
  conformite: boolean | null;
  denomination: string | null;
  lot: string | null;
  clients: { raison_sociale: string } | null;
  missions: { numero: string } | null;
}

const SELECT =
  "id,numero,code_barre,statut,date_prelevement,date_reception,lieu,temperature,conformite,denomination,lot,clients(raison_sociale),missions(numero)";

/** Retour sonore : bip aigu = OK, bip grave répété = code inconnu (SCA-03). */
function beep(ok: boolean) {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const play = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "square";
      gain.gain.value = 0.05;
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    if (ok) play(1200, 0, 0.09);
    else {
      play(240, 0, 0.16);
      play(240, 0.22, 0.16);
    }
    setTimeout(() => void ctx.close(), 700);
  } catch {
    /* audio indisponible */
  }
}

async function lookupCode(raw: string): Promise<Found | null> {
  const c = raw.trim();
  if (!c) return null;
  const { data } = await supabase
    .from("prelevements")
    .select(SELECT)
    .or(`code_barre.eq.${c},numero.eq.${c}`)
    .maybeSingle();
  return (data as unknown as Found) ?? null;
}

function ReceptionScanPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Réception — Scan code-barres"
        description="Scannez l'étiquette avec une douchette USB : identification, contrôle de conformité et validation, à l'unité ou en lot."
        backTo="/prelevements"
      />
      <Tabs defaultValue="unitaire">
        <TabsList>
          <TabsTrigger value="unitaire">Réception unitaire</TabsTrigger>
          <TabsTrigger value="lot">Réception en lot</TabsTrigger>
        </TabsList>
        <TabsContent value="unitaire" className="mt-4">
          <ScanUnitaire />
        </TabsContent>
        <TabsContent value="lot" className="mt-4">
          <ScanLot />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Réception unitaire                                                  */
/* ------------------------------------------------------------------ */

function ScanUnitaire() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Found[]>([]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [found]);

  const lookup = async (raw: string) => {
    setError(null);
    const row = await lookupCode(raw);
    if (!row) {
      beep(false);
      setError(`Code inconnu : « ${raw.trim()} » — aucun prélèvement correspondant.`);
      setFound(null);
      return;
    }
    beep(true);
    setFound(row);
    setHistory((h) => [row, ...h.filter((x) => x.id !== row.id)].slice(0, 10));
    await supabase.from("prelevements").update({ scanne_at: new Date().toISOString() }).eq("id", row.id);
  };

  const validate = useMutation({
    mutationFn: async (v: {
      id: string;
      temperature: number | null;
      conforme: boolean;
      remarque: string;
    }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const patch: {
        statut: "recu_labo" | "rejete";
        date_reception: string;
        verifie_at: string;
        verifie_by: string | null;
        conformite: boolean;
        remarque_non_conformite: string | null;
        temperature?: number;
      } = {
        statut: v.conforme ? "recu_labo" : "rejete",
        date_reception: new Date().toISOString(),
        verifie_at: new Date().toISOString(),
        verifie_by: userRes.user?.id ?? null,
        conformite: v.conforme,
        remarque_non_conformite: v.conforme ? null : v.remarque || "Non conforme à réception",
      };
      if (v.temperature !== null && !Number.isNaN(v.temperature)) patch.temperature = v.temperature;
      const { error: err } = await supabase.from("prelevements").update(patch).eq("id", v.id);
      if (err) throw err;
      return v.conforme;
    },
    onSuccess: (conforme) => {
      toast[conforme ? "success" : "warning"](conforme ? "Réception validée" : "Prélèvement refusé à réception");
      qc.invalidateQueries({ queryKey: ["prelevements"] });
      setFound(null);
      setCode("");
      inputRef.current?.focus();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Code-barres</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void lookup(code);
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Scannez ou saisissez le code…"
              className="font-mono text-lg"
            />
            <Button type="submit">Vérifier</Button>
          </form>
          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              <XCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {found && (
        <FoundCard
          found={found}
          pending={validate.isPending}
          onValidate={(t, conforme, remarque) =>
            validate.mutate({ id: found.id, temperature: t, conforme, remarque })
          }
        />
      )}

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Derniers scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0">
                  <div>
                    <div className="font-medium">{h.numero}</div>
                    <div className="text-muted-foreground">{h.clients?.raison_sociale}</div>
                  </div>
                  <StatusBadge tone={statutTone(h.statut)} label={h.statut} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FoundCard({
  found,
  onValidate,
  pending,
}: {
  found: Found;
  onValidate: (t: number | null, conforme: boolean, remarque: string) => void;
  pending: boolean;
}) {
  const [temp, setTemp] = useState<string>(found.temperature?.toString() ?? "");
  const [contenantOk, setContenantOk] = useState(true);
  const [quantiteOk, setQuantiteOk] = useState(true);
  const [delaiOk, setDelaiOk] = useState(true);
  const [remarque, setRemarque] = useState("");
  const isReceived = found.statut === "recu_labo";

  const tempNum = temp === "" ? null : parseFloat(temp);
  const tempOk = tempNum === null || (tempNum >= 0 && tempNum <= 8);
  const conforme = contenantOk && quantiteOk && delaiOk && tempOk;

  return (
    <Card className={conforme ? "border-primary" : "border-destructive"}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>{found.numero}</span>
          <StatusBadge tone={statutTone(found.statut)} label={found.statut} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Client" value={found.clients?.raison_sociale} />
          <Field label="Mission" value={found.missions?.numero} />
          <Field label="Dénomination" value={found.denomination} />
          <Field label="Lot" value={found.lot} />
          <Field label="Lieu" value={found.lieu} />
          <Field label="Date prélèvement" value={formatDateTime(found.date_prelevement)} />
        </div>

        <div className="rounded-md border p-3">
          <div className="mb-3 text-sm font-medium">Contrôle de conformité à réception</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="temp">Température réception (°C) — attendu 0 à 8</Label>
              <Input id="temp" type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} />
              {!tempOk && <p className="mt-1 text-xs text-destructive">Température hors plage de conservation.</p>}
            </div>
            <div className="space-y-2 pt-6">
              <Check label="Contenant intact et correctement identifié" checked={contenantOk} onChange={setContenantOk} />
              <Check label="Quantité suffisante pour les analyses" checked={quantiteOk} onChange={setQuantiteOk} />
              <Check label="Délai d'acheminement respecté" checked={delaiOk} onChange={setDelaiOk} />
            </div>
          </div>
          {!conforme && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" /> Non-conformité détectée : le prélèvement sera refusé.
              </div>
              <Textarea
                placeholder="Motif de non-conformité / observations…"
                value={remarque}
                onChange={(e) => setRemarque(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            disabled={pending || isReceived}
            variant={conforme ? "default" : "destructive"}
            onClick={() => onValidate(tempNum, conforme, remarque)}
            className="gap-2"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : conforme ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {isReceived ? "Déjà reçu" : conforme ? "Valider la réception" : "Refuser le prélèvement"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div>{value ?? "—"}</div>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      {label}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Réception en lot (SCA-01)                                           */
/* ------------------------------------------------------------------ */

interface LotItem {
  key: string;
  code: string;
  row: Found | null;
  conforme: boolean;
}

function ScanLot() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [items, setItems] = useState<LotItem[]>([]);
  const [temp, setTemp] = useState("");
  const [remarque, setRemarque] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const add = useCallback(
    async (raw: string) => {
      const c = raw.trim();
      if (!c) return;
      setBusy(true);
      const row = await lookupCode(c);
      beep(!!row);
      if (!row) toast.error(`Code inconnu : ${c}`);
      setItems((list) => {
        if (row && list.some((i) => i.row?.id === row.id)) {
          toast.info(`${row.numero} déjà dans le lot`);
          return list;
        }
        return [{ key: `${c}-${Date.now()}`, code: c, row, conforme: true }, ...list];
      });
      setCode("");
      setBusy(false);
      inputRef.current?.focus();
    },
    [],
  );

  const known = items.filter((i) => i.row);
  const unknown = items.filter((i) => !i.row);
  const nbConformes = known.filter((i) => i.conforme).length;
  const nbRefus = known.length - nbConformes;

  const receive = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const now = new Date().toISOString();
      const t = temp === "" ? null : parseFloat(temp);
      for (const item of known) {
        const patch: {
          statut: "recu_labo" | "rejete";
          date_reception: string;
          scanne_at: string;
          verifie_at: string;
          verifie_by: string | null;
          conformite: boolean;
          remarque_non_conformite: string | null;
          temperature?: number;
        } = {
          statut: item.conforme ? "recu_labo" : "rejete",
          date_reception: now,
          scanne_at: now,
          verifie_at: now,
          verifie_by: userRes.user?.id ?? null,
          conformite: item.conforme,
          remarque_non_conformite: item.conforme ? null : remarque || "Non conforme à réception",
        };
        if (t !== null && !Number.isNaN(t)) patch.temperature = t;
        const { error: err } = await supabase.from("prelevements").update(patch).eq("id", item.row!.id);
        if (err) throw err;
      }
    },
    onSuccess: () => {
      toast.success(`Lot réceptionné : ${nbConformes} conforme(s), ${nbRefus} refusé(s)`);
      qc.invalidateQueries({ queryKey: ["prelevements"] });
      setItems([]);
      setTemp("");
      setRemarque("");
      inputRef.current?.focus();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="h-4 w-4" /> Scan en continu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void add(code);
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Scannez les codes les uns après les autres…"
              className="font-mono text-lg"
            />
            <Button type="submit" disabled={busy}>
              Ajouter
            </Button>
          </form>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{known.length} identifié(s)</span>
            <span className="text-success">{nbConformes} conforme(s)</span>
            <span className="text-destructive">{nbRefus} refus</span>
            {unknown.length > 0 && <span className="text-destructive">{unknown.length} code(s) inconnu(s)</span>}
          </div>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Récapitulatif du lot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[45vh] overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/50">
                  <tr className="text-left">
                    <th className="p-2">Code</th>
                    <th className="p-2">Prélèvement</th>
                    <th className="p-2">Client</th>
                    <th className="p-2">Statut</th>
                    <th className="p-2">Conforme</th>
                    <th className="p-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.key} className={`border-t ${i.row ? "" : "bg-destructive/10"}`}>
                      <td className="p-2 font-mono">{i.code}</td>
                      <td className="p-2">{i.row?.numero ?? <span className="text-destructive">Code inconnu</span>}</td>
                      <td className="p-2">{i.row?.clients?.raison_sociale ?? "—"}</td>
                      <td className="p-2">{i.row && <StatusBadge tone={statutTone(i.row.statut)} label={i.row.statut} />}</td>
                      <td className="p-2">
                        {i.row && (
                          <Checkbox
                            checked={i.conforme}
                            onCheckedChange={(v) =>
                              setItems((list) => list.map((x) => (x.key === i.key ? { ...x, conforme: v === true } : x)))
                            }
                          />
                        )}
                      </td>
                      <td className="p-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setItems((list) => list.filter((x) => x.key !== i.key))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="temp-lot">Température du lot à réception (°C)</Label>
                <Input id="temp-lot" type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="rem-lot">Motif de non-conformité (appliqué aux refus)</Label>
                <Input id="rem-lot" value={remarque} onChange={(e) => setRemarque(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setItems([])}>
                Vider
              </Button>
              <Button disabled={known.length === 0 || receive.isPending} onClick={() => receive.mutate()} className="gap-2">
                {receive.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Réceptionner le lot ({known.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
