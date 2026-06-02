import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ScanLine, CheckCircle2, XCircle, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge, statutTone } from "@/components/lab/StatusBadge";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reception-scan")({
  head: () => ({ meta: [{ title: "Réception — Scan code-barres" }] }),
  component: ReceptionScanPage,
});

interface Found {
  id: string;
  numero: string;
  code_barre: string;
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

function ReceptionScanPage() {
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
    const c = raw.trim();
    if (!c) return;
    setError(null);
    const { data, error: err } = await supabase
      .from("prelevements")
      .select("id,numero,code_barre,statut,date_prelevement,date_reception,lieu,temperature,conformite,denomination,lot,clients(raison_sociale),missions(numero)")
      .or(`code_barre.eq.${c},numero.eq.${c}`)
      .maybeSingle();
    if (err || !data) {
      setError("Aucun prélèvement trouvé pour ce code");
      setFound(null);
      return;
    }
    const row = data as unknown as Found;
    setFound(row);
    setHistory((h) => [row, ...h.filter((x) => x.id !== row.id)].slice(0, 10));
    // Auto-mark scanné
    await supabase
      .from("prelevements")
      .update({ scanne_at: new Date().toISOString() })
      .eq("id", row.id);
  };

  const validate = useMutation({
    mutationFn: async ({ id, temperature }: { id: string; temperature?: number | null }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const patch: {
        statut: "recu_labo";
        date_reception: string;
        verifie_at: string;
        verifie_by: string | null;
        temperature?: number;
      } = {
        statut: "recu_labo",
        date_reception: new Date().toISOString(),
        verifie_at: new Date().toISOString(),
        verifie_by: userRes.user?.id ?? null,
      };
      if (temperature !== undefined && temperature !== null && !Number.isNaN(temperature)) {
        patch.temperature = temperature;
      }
      const { error: err } = await supabase.from("prelevements").update(patch).eq("id", id);
      if (err) throw err;
    },
    onSuccess: () => {
      toast.success("Réception validée");
      qc.invalidateQueries({ queryKey: ["prelevements"] });
      setFound(null);
      setCode("");
      inputRef.current?.focus();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Réception — Scan code-barres"
        description="Scannez l'étiquette avec une douchette USB pour identifier et valider la réception du prélèvement."
        icon={<ScanLine className="h-5 w-5" />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Code-barres</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              lookup(code);
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Scannez ou saisissez le code…"
              className="text-lg font-mono"
            />
            <Button type="submit">Vérifier</Button>
          </form>
          {error && (
            <p className="mt-2 flex items-center gap-2 text-sm text-destructive">
              <XCircle className="h-4 w-4" />
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {found && <FoundCard found={found} onValidate={(t) => validate.mutate({ id: found.id, temperature: t })} pending={validate.isPending} />}

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
                  <StatusBadge tone={statutTone(h.statut)}>{h.statut}</StatusBadge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FoundCard({ found, onValidate, pending }: { found: Found; onValidate: (t: number | null) => void; pending: boolean }) {
  const [temp, setTemp] = useState<string>(found.temperature?.toString() ?? "");
  const isReceived = found.statut === "recu_labo";

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>{found.numero}</span>
          <StatusBadge tone={statutTone(found.statut)}>{found.statut}</StatusBadge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><Label className="text-xs text-muted-foreground">Client</Label><div>{found.clients?.raison_sociale ?? "—"}</div></div>
          <div><Label className="text-xs text-muted-foreground">Mission</Label><div>{found.missions?.numero ?? "—"}</div></div>
          <div><Label className="text-xs text-muted-foreground">Dénomination</Label><div>{found.denomination ?? "—"}</div></div>
          <div><Label className="text-xs text-muted-foreground">Lot</Label><div>{found.lot ?? "—"}</div></div>
          <div><Label className="text-xs text-muted-foreground">Lieu</Label><div>{found.lieu ?? "—"}</div></div>
          <div><Label className="text-xs text-muted-foreground">Date prélèvement</Label><div>{formatDateTime(found.date_prelevement)}</div></div>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="temp">Température réception (°C)</Label>
            <Input id="temp" type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} />
          </div>
          <Button
            disabled={pending || isReceived}
            onClick={() => onValidate(temp === "" ? null : parseFloat(temp))}
            className="gap-2"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isReceived ? "Déjà reçu" : "Valider la réception"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
