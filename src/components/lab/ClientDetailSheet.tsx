import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Building2, Mail, Phone, MapPin, FileText, ShoppingCart, Receipt,
  Wallet, Pencil, ArrowUpRight,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { StatusBadge, statutTone } from "@/components/lab/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTND, formatDate } from "@/lib/format";

export interface ClientLike {
  id: string;
  raison_sociale: string;
  code?: string | null;
  matricule_fiscal?: string | null;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  ville?: string | null;
  code_postal?: string | null;
  pays?: string | null;
  contact_principal?: string | null;
  contact_email?: string | null;
  contact_telephone?: string | null;
  notes?: string | null;
  is_active?: boolean | null;
}

interface Props {
  client: ClientLike | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (client: ClientLike) => void;
}

function InfoLine({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2 py-1">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm text-foreground">{value || "—"}</p>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-lg font-bold tabular-nums ${tone ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}

export function ClientDetailSheet({ client, open, onOpenChange, onEdit }: Props) {
  const id = client?.id;

  const { data } = useQuery({
    queryKey: ["client-360", id],
    enabled: !!id && open,
    queryFn: async () => {
      const [devis, bcs, factures, reglements] = await Promise.all([
        supabase.from("devis").select("id,numero,date_devis,statut,total_ttc").eq("client_id", id!).order("date_devis", { ascending: false }).limit(50),
        supabase.from("bons_commande").select("id,numero,date_bc,statut,total_ttc").eq("client_id", id!).order("date_bc", { ascending: false }).limit(50),
        supabase.from("factures").select("id,numero,date_facture,statut,net_a_payer,date_echeance").eq("client_id", id!).order("date_facture", { ascending: false }).limit(50),
        supabase.from("reglements").select("id,numero,date_paiement,montant").eq("client_id", id!).order("date_paiement", { ascending: false }).limit(50),
      ]);
      return {
        devis: devis.data ?? [],
        bcs: bcs.data ?? [],
        factures: factures.data ?? [],
        reglements: reglements.data ?? [],
      };
    },
  });

  const factures = data?.factures ?? [];
  const reglements = data?.reglements ?? [];
  const caTotal = factures.reduce((s, f: any) => s + Number(f.net_a_payer || 0), 0);
  const encaisse = reglements.reduce((s, r: any) => s + Number(r.montant || 0), 0);
  const encours = caTotal - encaisse;
  const today = new Date().toISOString().slice(0, 10);
  const enRetard = factures.filter(
    (f: any) => f.statut !== "payee" && f.date_echeance && f.date_echeance < today,
  ).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-3xl flex-col gap-0 p-0 sm:max-w-3xl">
        <SheetHeader className="border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="flex items-center gap-2 truncate">
                <Building2 className="h-4 w-4 text-primary" />
                {client?.raison_sociale ?? "Client"}
                <StatusBadge
                  label={client?.is_active === false ? "Inactif" : "Actif"}
                  tone={client?.is_active === false ? "neutral" : "success"}
                />
              </SheetTitle>
              <SheetDescription>
                {client?.code ? `Code ${client.code} · ` : ""}
                {client?.matricule_fiscal ? `MF ${client.matricule_fiscal}` : "Vue 360° du compte client"}
              </SheetDescription>
            </div>
            {client && onEdit && (
              <Button size="sm" variant="outline" onClick={() => onEdit(client)}>
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-2 border-b border-border bg-muted/30 px-5 py-3 md:grid-cols-4">
          <Kpi label="Facturé" value={formatTND(caTotal)} />
          <Kpi label="Encaissé" value={formatTND(encaisse)} tone="text-success" />
          <Kpi label="Encours" value={formatTND(encours)} tone={encours > 0 ? "text-warning" : "text-foreground"} />
          <Kpi label="Fact. en retard" value={String(enRetard)} tone={enRetard ? "text-destructive" : "text-foreground"} />
        </div>

        <Tabs defaultValue="identite" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-5 mt-3 w-fit">
            <TabsTrigger value="identite">Identité</TabsTrigger>
            <TabsTrigger value="devis">Devis ({data?.devis.length ?? 0})</TabsTrigger>
            <TabsTrigger value="bc">Commandes ({data?.bcs.length ?? 0})</TabsTrigger>
            <TabsTrigger value="factures">Factures ({factures.length})</TabsTrigger>
            <TabsTrigger value="reglements">Règlements ({reglements.length})</TabsTrigger>
          </TabsList>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <TabsContent value="identite" className="mt-0 space-y-4">
              <div className="grid gap-2 md:grid-cols-2">
                <InfoLine icon={Mail} label="Email" value={client?.email} />
                <InfoLine icon={Phone} label="Téléphone" value={client?.telephone} />
                <InfoLine
                  icon={MapPin}
                  label="Adresse"
                  value={[client?.adresse, client?.code_postal, client?.ville, client?.pays].filter(Boolean).join(", ")}
                />
                <InfoLine icon={Building2} label="Matricule fiscal" value={client?.matricule_fiscal} />
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact principal</p>
                <div className="grid gap-2 md:grid-cols-3">
                  <InfoLine icon={Building2} label="Nom" value={client?.contact_principal} />
                  <InfoLine icon={Mail} label="Email" value={client?.contact_email} />
                  <InfoLine icon={Phone} label="Téléphone" value={client?.contact_telephone} />
                </div>
              </div>
              {client?.notes && (
                <div className="rounded-md border border-border p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
                  <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                <Button asChild size="sm" variant="outline">
                  <Link to="/devis"><FileText className="h-3.5 w-3.5" /> Nouveau devis <ArrowUpRight className="h-3 w-3" /></Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/bons-commande"><ShoppingCart className="h-3.5 w-3.5" /> Nouvelle commande <ArrowUpRight className="h-3 w-3" /></Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/facturation"><Receipt className="h-3.5 w-3.5" /> Facturer <ArrowUpRight className="h-3 w-3" /></Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/comptes-clients"><Wallet className="h-3.5 w-3.5" /> Compte client <ArrowUpRight className="h-3 w-3" /></Link>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="devis" className="mt-0">
              <DocTable
                rows={data?.devis ?? []}
                dateKey="date_devis"
                amountKey="total_ttc"
                empty="Aucun devis pour ce client."
              />
            </TabsContent>
            <TabsContent value="bc" className="mt-0">
              <DocTable
                rows={data?.bcs ?? []}
                dateKey="date_bc"
                amountKey="total_ttc"
                empty="Aucune commande pour ce client."
              />
            </TabsContent>
            <TabsContent value="factures" className="mt-0">
              <DocTable
                rows={factures}
                dateKey="date_facture"
                amountKey="net_a_payer"
                empty="Aucune facture pour ce client."
              />
            </TabsContent>
            <TabsContent value="reglements" className="mt-0">
              <DocTable
                rows={reglements}
                dateKey="date_paiement"
                amountKey="montant"
                empty="Aucun règlement enregistré."
                hideStatut
              />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function DocTable({
  rows, dateKey, amountKey, empty, hideStatut,
}: {
  rows: any[];
  dateKey: string;
  amountKey: string;
  empty: string;
  hideStatut?: boolean;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Numéro</TableHead>
          <TableHead>Date</TableHead>
          {!hideStatut && <TableHead>Statut</TableHead>}
          <TableHead className="text-right">Montant</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono text-xs">{r.numero ?? "—"}</TableCell>
            <TableCell className="text-xs">{r[dateKey] ? formatDate(r[dateKey]) : "—"}</TableCell>
            {!hideStatut && (
              <TableCell>
                <StatusBadge label={String(r.statut ?? "—").replace(/_/g, " ")} tone={statutTone(r.statut)} />
              </TableCell>
            )}
            <TableCell className="text-right tabular-nums">{formatTND(Number(r[amountKey] || 0))}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
