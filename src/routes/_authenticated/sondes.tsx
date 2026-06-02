import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Radio, AlertTriangle, BellOff, Loader2, Copy, KeyRound } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { DataTable, type Column } from "@/components/lab/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/sondes")({
  head: () => ({ meta: [{ title: "Sondes IoT — BALIMS" }] }),
  component: SondesPage,
});

const TYPES = ["temperature", "humidite", "pression", "co2", "o2", "ph", "autre"] as const;
type SondeType = (typeof TYPES)[number];

interface Sonde {
  id: string;
  code: string;
  libelle: string;
  type: SondeType;
  unite: string;
  seuil_min: number | null;
  seuil_max: number | null;
  intervalle_minutes: number;
  is_active: boolean;
  localisation: string | null;
  last_releve_at: string | null;
  last_mesure: number | null;
  last_batterie: number | null;
  equipement_id: string | null;
}

interface Releve {
  id: string; sonde_id: string; mesure: number; mesuree_at: string;
  batterie_pct: number | null; conformite: boolean | null;
}

interface Alerte {
  id: string; sonde_id: string; type: string; severite: string;
  message: string | null; mesure: number | null; acquittee_at: string | null; created_at: string;
}

function SondesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Sonde | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  const { data: sondes = [], isLoading } = useQuery({
    queryKey: ["sondes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sondes").select("*").order("code");
      if (error) throw error;
      return data as unknown as Sonde[];
    },
  });

  const { data: alertes = [] } = useQuery({
    queryKey: ["alertes_sonde", "open"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alertes_sonde")
        .select("*")
        .is("acquittee_at", null)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as unknown as Alerte[];
    },
  });

  const ack = useMutation({
    mutationFn: async (id: string) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("alertes_sonde")
        .update({ acquittee_at: new Date().toISOString(), acquittee_by: u.user?.id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alerte acquittée");
      qc.invalidateQueries({ queryKey: ["alertes_sonde"] });
    },
  });

  const create = useMutation({
    mutationFn: async (form: Partial<Sonde> & { generate_key?: boolean }) => {
      let apiKeyPlain: string | null = null;
      let apiKeyHash: string | null = null;
      if (form.generate_key) {
        const buf = crypto.getRandomValues(new Uint8Array(24));
        apiKeyPlain = Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
        const hashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(apiKeyPlain));
        apiKeyHash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
      }
      const { generate_key, ...rest } = form;
      void generate_key;
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("sondes").insert({
        ...rest,
        api_key_hash: apiKeyHash,
        created_by: u.user?.id,
      } as never);
      if (error) throw error;
      return apiKeyPlain;
    },
    onSuccess: (key) => {
      toast.success("Sonde créée");
      qc.invalidateQueries({ queryKey: ["sondes"] });
      setOpen(false);
      if (key) setNewApiKey(key);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<Sonde>[] = useMemo(() => [
    { key: "code", header: "Code", className: "font-mono text-xs" },
    { key: "libelle", header: "Libellé" },
    { key: "type", header: "Type", render: (r) => <Badge variant="outline">{r.type}</Badge> },
    { key: "last_mesure", header: "Dernière mesure", render: (r) => r.last_mesure !== null ? `${r.last_mesure} ${r.unite}` : "—" },
    { key: "last_releve_at", header: "Dernier relevé", render: (r) => formatDateTime(r.last_releve_at) },
    { key: "is_active", header: "Actif", render: (r) => r.is_active ? <Badge>Actif</Badge> : <Badge variant="secondary">Inactif</Badge> },
  ], []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sondes IoT"
        description="Capteurs connectés (température, humidité, etc.) avec relevés automatiques et alertes."
        icon={<Radio className="h-5 w-5" />}
        actions={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nouvelle sonde
          </Button>
        }
      />

      <Tabs defaultValue="sondes">
        <TabsList>
          <TabsTrigger value="sondes">Sondes ({sondes.length})</TabsTrigger>
          <TabsTrigger value="alertes" className="gap-2">
            Alertes
            {alertes.length > 0 && <Badge variant="destructive">{alertes.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sondes" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <DataTable
                data={sondes}
                columns={columns}
                isLoading={isLoading}
                onRowClick={(r) => setSelected(r)}
                emptyMessage="Aucune sonde configurée."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertes" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {alertes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BellOff className="mb-2 h-10 w-10 opacity-50" />
                  <p>Aucune alerte ouverte</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alertes.map((a) => {
                    const s = sondes.find((x) => x.id === a.sonde_id);
                    return (
                      <div key={a.id} className="flex items-start justify-between rounded-md border p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <span className="font-medium">{s?.code ?? a.sonde_id} — {a.type}</span>
                            <Badge variant={a.severite === "critical" ? "destructive" : "secondary"}>{a.severite}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{a.message}</div>
                          {a.mesure !== null && <div className="text-sm">Mesure : <strong>{a.mesure} {s?.unite}</strong></div>}
                          <div className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => ack.mutate(a.id)} disabled={ack.isPending}>
                          Acquitter
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SondeFormDialog open={open} onOpenChange={setOpen} onSubmit={(d) => create.mutate(d)} pending={create.isPending} />
      {selected && <SondeDetailDialog sonde={selected} onClose={() => setSelected(null)} />}
      <ApiKeyDialog apiKey={newApiKey} onClose={() => setNewApiKey(null)} />
    </div>
  );
}

function SondeFormDialog({ open, onOpenChange, onSubmit, pending }: {
  open: boolean; onOpenChange: (b: boolean) => void;
  onSubmit: (d: Partial<Sonde> & { generate_key?: boolean }) => void; pending: boolean;
}) {
  const [form, setForm] = useState({
    code: "", libelle: "", type: "temperature" as SondeType, unite: "°C",
    seuil_min: "", seuil_max: "", intervalle_minutes: 15, localisation: "",
    is_active: true, generate_key: true,
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nouvelle sonde</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Code *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SND-001" /></div>
          <div><Label>Libellé *</Label><Input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} placeholder="Frigo labo 1" /></div>
          <div>
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as SondeType, unite: v === "temperature" ? "°C" : v === "humidite" ? "%" : "" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Unité</Label><Input value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })} /></div>
          <div><Label>Seuil min</Label><Input type="number" step="0.1" value={form.seuil_min} onChange={(e) => setForm({ ...form, seuil_min: e.target.value })} /></div>
          <div><Label>Seuil max</Label><Input type="number" step="0.1" value={form.seuil_max} onChange={(e) => setForm({ ...form, seuil_max: e.target.value })} /></div>
          <div><Label>Intervalle (min)</Label><Input type="number" value={form.intervalle_minutes} onChange={(e) => setForm({ ...form, intervalle_minutes: parseInt(e.target.value) || 15 })} /></div>
          <div className="col-span-2"><Label>Localisation</Label><Input value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} /></div>
          <div className="col-span-2 flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <Label>Générer une clé API</Label>
              <p className="text-xs text-muted-foreground">Nécessaire pour recevoir les mesures via webhook</p>
            </div>
            <Switch checked={form.generate_key} onCheckedChange={(c) => setForm({ ...form, generate_key: c })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            disabled={pending || !form.code || !form.libelle}
            onClick={() => onSubmit({
              code: form.code, libelle: form.libelle, type: form.type, unite: form.unite,
              seuil_min: form.seuil_min ? parseFloat(form.seuil_min) : null,
              seuil_max: form.seuil_max ? parseFloat(form.seuil_max) : null,
              intervalle_minutes: form.intervalle_minutes,
              localisation: form.localisation || null,
              is_active: form.is_active,
              generate_key: form.generate_key,
            })}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApiKeyDialog({ apiKey, onClose }: { apiKey: string | null; onClose: () => void }) {
  return (
    <Dialog open={!!apiKey} onOpenChange={(b) => !b && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Clé API générée</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Conservez cette clé en lieu sûr. Elle ne sera plus jamais affichée. Configurez votre sonde pour envoyer les mesures à&nbsp;:
          </p>
          <code className="block break-all rounded bg-muted p-2 text-xs">
            POST {typeof window !== "undefined" ? window.location.origin : ""}/api/public/sondes/ingest
          </code>
          <p className="text-sm">Header : <code>x-api-key: …</code></p>
          <div className="flex items-center gap-2">
            <Input value={apiKey ?? ""} readOnly className="font-mono text-xs" />
            <Button size="sm" variant="outline" onClick={() => { if (apiKey) { navigator.clipboard.writeText(apiKey); toast.success("Copié"); } }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <DialogFooter><Button onClick={onClose}>Fermer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SondeDetailDialog({ sonde, onClose }: { sonde: Sonde; onClose: () => void }) {
  const [range, setRange] = useState<"24h" | "7d" | "30d">("24h");
  const { data: releves = [] } = useQuery({
    queryKey: ["releves_sonde", sonde.id, range],
    queryFn: async () => {
      const hours = range === "24h" ? 24 : range === "7d" ? 24 * 7 : 24 * 30;
      const since = new Date(Date.now() - hours * 3600_000).toISOString();
      const { data, error } = await supabase
        .from("releves_sonde")
        .select("id,sonde_id,mesure,mesuree_at,batterie_pct,conformite")
        .eq("sonde_id", sonde.id)
        .gte("mesuree_at", since)
        .order("mesuree_at", { ascending: true });
      if (error) throw error;
      return data as unknown as Releve[];
    },
  });

  const chartData = releves.map((r) => ({
    t: new Date(r.mesuree_at).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }),
    v: r.mesure,
  }));

  return (
    <Dialog open onOpenChange={(b) => !b && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{sonde.code} — {sonde.libelle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["24h", "7d", "30d"] as const).map((r) => (
              <Button key={r} size="sm" variant={range === r ? "default" : "outline"} onClick={() => setRange(r)}>{r}</Button>
            ))}
          </div>
          <Card>
            <CardContent className="pt-4">
              {chartData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Aucun relevé sur cette période</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit={sonde.unite} />
                    <Tooltip />
                    {sonde.seuil_min !== null && <ReferenceLine y={sonde.seuil_min} stroke="#ef4444" strokeDasharray="3 3" />}
                    {sonde.seuil_max !== null && <ReferenceLine y={sonde.seuil_max} stroke="#ef4444" strokeDasharray="3 3" />}
                    <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
        <DialogFooter><Button onClick={onClose}>Fermer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
