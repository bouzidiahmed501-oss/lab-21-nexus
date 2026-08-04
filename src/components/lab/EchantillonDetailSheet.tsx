import { useQuery } from "@tanstack/react-query";
import { TestTubes, MapPin, Thermometer, CalendarClock, History, Barcode as BarcodeIcon } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { StatusBadge, statutTone, statutLabel } from "@/components/lab/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { formatDate, formatDateTime } from "@/lib/format";

interface Props {
  echantillon: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions?: React.ReactNode;
}

function Field({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border px-3 py-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm text-foreground">{value || "—"}</p>
      </div>
    </div>
  );
}

export function EchantillonDetailSheet({ echantillon, open, onOpenChange, actions }: Props) {
  const id = echantillon?.id as string | undefined;

  const { data: histo = [] } = useQuery({
    queryKey: ["echantillon-histo", id],
    enabled: !!id && open,
    queryFn: async () => {
      const { data } = await (supabase.from("echantillon_historique" as never) as any)
        .select("*").eq("echantillon_id", id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: analyses = [] } = useQuery({
    queryKey: ["echantillon-analyses", echantillon?.prelevement_id],
    enabled: !!echantillon?.prelevement_id && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("analyses")
        .select("id,numero,statut,date_debut,date_fin")
        .eq("prelevement_id", echantillon.prelevement_id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-2xl flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="flex items-center gap-2 truncate">
                <TestTubes className="h-4 w-4 text-primary" />
                {echantillon?.designation ?? "Échantillon"}
                <StatusBadge label={statutLabel(echantillon?.statut)} tone={statutTone(echantillon?.statut)} />
              </SheetTitle>
              <SheetDescription className="font-mono text-xs">{echantillon?.code_barre ?? "—"}</SheetDescription>
            </div>
            {actions}
          </div>
        </SheetHeader>

        <Tabs defaultValue="identite" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-5 mt-3 w-fit">
            <TabsTrigger value="identite">Identité</TabsTrigger>
            <TabsTrigger value="stockage">Stockage</TabsTrigger>
            <TabsTrigger value="analyses">Analyses ({analyses.length})</TabsTrigger>
            <TabsTrigger value="historique">Traçabilité ({histo.length})</TabsTrigger>
          </TabsList>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <TabsContent value="identite" className="mt-0 grid gap-2 md:grid-cols-2">
              <Field icon={BarcodeIcon} label="Code barre" value={echantillon?.code_barre} />
              <Field icon={TestTubes} label="Type" value={echantillon?.type_echantillon} />
              <Field icon={CalendarClock} label="Réception" value={echantillon?.date_reception ? formatDate(echantillon.date_reception) : null} />
              <Field icon={CalendarClock} label="Fin de conservation" value={echantillon?.date_conservation_fin ? formatDate(echantillon.date_conservation_fin) : null} />
              <Field icon={TestTubes} label="Volume / quantité" value={echantillon?.volume_quantite} />
              <Field icon={CalendarClock} label="Destruction" value={echantillon?.date_destruction ? formatDate(echantillon.date_destruction) : null} />
              {echantillon?.notes && (
                <div className="md:col-span-2 rounded-md border border-border p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
                  <p className="whitespace-pre-wrap text-sm">{echantillon.notes}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="stockage" className="mt-0 grid gap-2 md:grid-cols-2">
              <Field icon={MapPin} label="Emplacement" value={echantillon?.emplacement} />
              <Field
                icon={Thermometer}
                label="Température de conservation"
                value={echantillon?.temperature_stockage != null ? `${echantillon.temperature_stockage} °C` : null}
              />
            </TabsContent>

            <TabsContent value="analyses" className="mt-0 space-y-2">
              {analyses.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aucune analyse rattachée à cet échantillon.
                </p>
              ) : (
                analyses.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div>
                      <p className="font-mono text-xs">{a.numero}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {a.date_debut ? formatDate(a.date_debut) : "—"} → {a.date_fin ? formatDate(a.date_fin) : "en cours"}
                      </p>
                    </div>
                    <StatusBadge label={statutLabel(a.statut)} tone={statutTone(a.statut)} />
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="historique" className="mt-0">
              {histo.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Aucun mouvement enregistré.</p>
              ) : (
                <ol className="relative space-y-3 border-l border-border pl-4">
                  {histo.map((h: any) => (
                    <li key={h.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                      <div className="flex items-center gap-2">
                        <History className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{statutLabel(h.action)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {h.ancien_statut ? `${statutLabel(h.ancien_statut)} → ` : ""}
                        {statutLabel(h.nouveau_statut)}
                        {h.emplacement ? ` — ${h.emplacement}` : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{formatDateTime(h.created_at)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
