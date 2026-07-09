import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTND, formatDate } from "@/lib/format";
import { exportCSV } from "@/lib/csv";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/comptes-clients")({
  component: ComptesClientsPage,
});

interface Mouvement {
  date: string;
  type: "Facture" | "Règlement" | "Avoir";
  numero: string;
  debit: number;
  credit: number;
  ref: string;
}

function ComptesClientsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-compta"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, raison_sociale, code_client").order("raison_sociale");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: factures = [] } = useQuery({
    queryKey: ["factures-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("factures").select("id, client_id, numero, date_facture, net_a_payer");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: reglements = [] } = useQuery({
    queryKey: ["reglements-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reglements").select("id, client_id, numero, date_paiement, date_versement, montant");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: avoirs = [] } = useQuery({
    queryKey: ["avoirs-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("avoirs").select("id, client_id, numero, date_avoir, net_a_payer");
      if (error) throw error;
      return data ?? [];
    },
  });

  const soldes = useMemo(() => {
    const m = new Map<string, { debit: number; credit: number; solde: number }>();
    for (const c of clients) m.set(c.id, { debit: 0, credit: 0, solde: 0 });
    for (const f of factures) {
      const s = m.get(f.client_id); if (!s) continue;
      s.debit += Number(f.net_a_payer ?? 0);
    }
    for (const r of reglements) {
      const s = m.get(r.client_id); if (!s) continue;
      s.credit += Number(r.montant ?? 0);
    }
    for (const a of avoirs) {
      const s = m.get(a.client_id); if (!s) continue;
      s.credit += Number(a.net_a_payer ?? 0);
    }
    for (const [, v] of m) v.solde = v.debit - v.credit;
    return m;
  }, [clients, factures, reglements, avoirs]);

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.raison_sociale?.toLowerCase().includes(q) || c.code_client?.toLowerCase().includes(q);
  });

  const totals = useMemo(() => {
    let debit = 0, credit = 0;
    for (const c of filteredClients) {
      const s = soldes.get(c.id);
      if (s) { debit += s.debit; credit += s.credit; }
    }
    return { debit, credit, solde: debit - credit };
  }, [filteredClients, soldes]);

  const mouvements: Mouvement[] = useMemo(() => {
    if (!selected) return [];
    const list: Mouvement[] = [];
    for (const f of factures.filter((x) => x.client_id === selected)) {
      list.push({ date: f.date_facture, type: "Facture", numero: f.numero, debit: Number(f.net_a_payer ?? 0), credit: 0, ref: f.id });
    }
    for (const r of reglements.filter((x) => x.client_id === selected)) {
      list.push({ date: r.date_paiement ?? r.date_versement ?? "", type: "Règlement", numero: r.numero, debit: 0, credit: Number(r.montant ?? 0), ref: r.id });
    }
    for (const a of avoirs.filter((x) => x.client_id === selected)) {
      list.push({ date: a.date_avoir, type: "Avoir", numero: a.numero, debit: 0, credit: Number(a.net_a_payer ?? 0), ref: a.id });
    }
    list.sort((a, b) => (a.date < b.date ? -1 : 1));
    return list;
  }, [selected, factures, reglements, avoirs]);

  const selectedClient = clients.find((c) => c.id === selected);
  let running = 0;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        icon={Wallet}
        title="Comptabilité clients"
        description="Solde, historique des factures, règlements et avoirs par client."
      />

      <div className="grid grid-cols-3 gap-3 p-4 pb-2">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total débit (factures)</p><p className="text-xl font-bold">{formatTND(totals.debit)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total crédit (règl.+avoirs)</p><p className="text-xl font-bold">{formatTND(totals.credit)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Solde net</p><p className={`text-xl font-bold ${totals.solde > 0 ? "text-destructive" : "text-emerald-600"}`}>{formatTND(totals.solde)}</p></CardContent></Card>
      </div>

      <div className="grid flex-1 grid-cols-[380px_1fr] gap-3 overflow-hidden p-4 pt-2">
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="p-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un client…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            <div className="divide-y">
              {filteredClients.map((c) => {
                const s = soldes.get(c.id) ?? { debit: 0, credit: 0, solde: 0 };
                const active = selected === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left hover:bg-accent ${active ? "bg-accent" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.raison_sociale}</p>
                      <p className="text-[11px] text-muted-foreground">{c.code_client}</p>
                    </div>
                    <span className={`text-sm font-semibold ${s.solde > 0 ? "text-destructive" : s.solde < 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {formatTND(s.solde)}
                    </span>
                  </button>
                );
              })}
              {filteredClients.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Aucun client</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-3">
            <CardTitle className="text-base">
              {selectedClient ? selectedClient.raison_sociale : "Sélectionnez un client"}
            </CardTitle>
            {selectedClient && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">Débit : {formatTND(soldes.get(selectedClient.id)?.debit ?? 0)}</Badge>
                <Badge variant="outline">Crédit : {formatTND(soldes.get(selectedClient.id)?.credit ?? 0)}</Badge>
                <Badge variant={(soldes.get(selectedClient.id)?.solde ?? 0) > 0 ? "destructive" : "secondary"}>
                  Solde : {formatTND(soldes.get(selectedClient.id)?.solde ?? 0)}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportCSV(`compte-${selectedClient.code_client ?? selectedClient.id}.csv`,
                    mouvements.map((m) => ({ Date: formatDate(m.date), Type: m.type, Numero: m.numero, Debit: m.debit, Credit: m.credit }))
                  )}
                >
                  <Download className="mr-1 h-3.5 w-3.5" /> CSV
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {!selectedClient ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Choisissez un client pour voir son historique.</p>
            ) : mouvements.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Aucun mouvement pour ce client.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Date</TableHead>
                    <TableHead className="w-28">Type</TableHead>
                    <TableHead>N°</TableHead>
                    <TableHead className="text-right">Débit</TableHead>
                    <TableHead className="text-right">Crédit</TableHead>
                    <TableHead className="text-right">Solde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mouvements.map((m, i) => {
                    running += m.debit - m.credit;
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{formatDate(m.date)}</TableCell>
                        <TableCell>
                          <Badge variant={m.type === "Facture" ? "default" : m.type === "Règlement" ? "secondary" : "outline"}>{m.type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{m.numero}</TableCell>
                        <TableCell className="text-right text-sm">{m.debit > 0 ? formatTND(m.debit) : "—"}</TableCell>
                        <TableCell className="text-right text-sm">{m.credit > 0 ? formatTND(m.credit) : "—"}</TableCell>
                        <TableCell className={`text-right text-sm font-semibold ${running > 0 ? "text-destructive" : running < 0 ? "text-emerald-600" : ""}`}>
                          {formatTND(running)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
