import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/lab/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ClipboardList, FileText, Receipt, Download, LogOut, Loader2, Package, CheckCircle2, Clock, AlertCircle, ArrowLeft,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { generateRapportPdf } from "@/lib/pdf/rapport";

export const Route = createFileRoute("/portail")({
  head: () => ({
    meta: [
      { title: "Portail client — BALIMS" },
      { name: "description", content: "Portail client BALIMS : suivez vos analyses, téléchargez vos rapports et consultez vos factures." },
    ],
  }),
  component: PortailPage,
});

const BC_STATUT_LABEL: Record<string, string> = {
  brouillon: "Brouillon", envoye: "Envoyé", accepte: "Accepté", en_cours: "En cours",
  termine: "Terminé", facture: "Facturé", archive: "Archivé",
};
const BC_STATUT_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  brouillon: "outline", envoye: "secondary", accepte: "secondary", en_cours: "default",
  termine: "default", facture: "default", archive: "outline",
};

function PortailPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Check session
  useState(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary to-accent/30">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary to-accent/30 px-4">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center"><Logo /></div>
          <Card className="border-border/60 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle>Portail client</CardTitle>
              <CardDescription>Connectez-vous pour accéder à vos commandes, rapports et factures.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>Mot de passe</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={authLoading}>
                  {authLoading && <Loader2 className="h-4 w-4 animate-spin" />} Se connecter
                </Button>
              </form>
            </CardContent>
          </Card>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Accès réservé aux clients BALIMS. Contactez votre interlocuteur pour obtenir vos identifiants.
          </p>
        </div>
      </div>
    );
  }

  return <PortailDashboard onLogout={handleLogout} />;
}

function PortailDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState("commandes");

  const { data: bcs = [], isLoading: loadingBc } = useQuery({
    queryKey: ["portail-bcs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bons_commande")
        .select("id, numero, date_bc, statut, objet, total_ttc, clients(raison_sociale)")
        .order("date_bc", { ascending: false }).limit(50);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: rapports = [], isLoading: loadingRap } = useQuery({
    queryKey: ["portail-rapports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rapports")
        .select("id, numero, titre, date_rapport, statut, clients(raison_sociale)")
        .in("statut", ["valide", "envoye"])
        .order("date_rapport", { ascending: false }).limit(50);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: factures = [], isLoading: loadingFac } = useQuery({
    queryKey: ["portail-factures"],
    queryFn: async () => {
      const { data, error } = await supabase.from("factures")
        .select("id, numero, date_facture, statut, net_a_payer, payment_status, clients(raison_sociale)")
        .order("date_facture", { ascending: false }).limit(50);
      if (error) throw error;
      return data as any[];
    },
  });

  const stats = useMemo(() => ({
    bcEnCours: bcs.filter((b: any) => ["envoye", "accepte", "en_cours"].includes(b.statut)).length,
    rapportsDispo: rapports.length,
    facturesImpayees: factures.filter((f: any) => ["emise", "partielle", "impayee"].includes(f.statut)).length,
  }), [bcs, rapports, factures]);

  const handleDownloadRapport = async (rap: any) => {
    try {
      const { data: links } = await supabase.from("rapport_analyses")
        .select("analyse_id, ordre, analyses(id,numero,date_debut,prelevements(numero))")
        .eq("rapport_id", rap.id).order("ordre");
      const analyses = await Promise.all((links ?? []).map(async (l: any) => {
        const a = l.analyses as any;
        const { data: res } = await supabase.from("analyse_resultats")
          .select("valeur, conformite, parametres_analyse(libelle,seuil_min,seuil_max), unites:unite_id(symbole), methodes_analyse:methode_id(libelle)")
          .eq("analyse_id", a.id);
        return {
          numero: a.numero, prelevement: a.prelevements?.numero ?? null, date_debut: a.date_debut,
          resultats: ((res ?? []) as any[]).map((r) => ({
            parametre: r.parametres_analyse?.libelle ?? "—", valeur: r.valeur ?? "—",
            unite: r.unites?.symbole ?? null, methode: r.methodes_analyse?.libelle ?? null,
            seuil_min: r.parametres_analyse?.seuil_min ?? null, seuil_max: r.parametres_analyse?.seuil_max ?? null,
            conformite: r.conformite,
          })),
        };
      }));
      const blob = await generateRapportPdf({
        numero: rap.numero, titre: rap.titre, date_rapport: rap.date_rapport,
        client: { raison_sociale: rap.clients?.raison_sociale ?? "" },
        conclusion: null, analyses,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${rap.numero}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-sm font-medium text-muted-foreground">Portail client</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}><LogOut className="h-4 w-4 mr-1" /> Déconnexion</Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2"><Clock className="h-5 w-5 text-primary" /></div>
              <div><p className="text-xs text-muted-foreground">Commandes en cours</p><p className="text-2xl font-bold">{stats.bcEnCours}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-green-500/10 p-2"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
              <div><p className="text-xs text-muted-foreground">Rapports disponibles</p><p className="text-2xl font-bold">{stats.rapportsDispo}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-orange-500/10 p-2"><AlertCircle className="h-5 w-5 text-orange-600" /></div>
              <div><p className="text-xs text-muted-foreground">Factures en attente</p><p className="text-2xl font-bold">{stats.facturesImpayees}</p></div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="commandes"><ClipboardList className="h-3.5 w-3.5 mr-1" /> Commandes</TabsTrigger>
            <TabsTrigger value="rapports"><FileText className="h-3.5 w-3.5 mr-1" /> Rapports</TabsTrigger>
            <TabsTrigger value="factures"><Receipt className="h-3.5 w-3.5 mr-1" /> Factures</TabsTrigger>
          </TabsList>

          {/* Commandes */}
          <TabsContent value="commandes">
            <Card>
              <CardHeader><CardTitle className="text-base">Bons de commande</CardTitle></CardHeader>
              <CardContent>
                {loadingBc ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : bcs.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Aucune commande.</p>
                ) : (
                  <div className="rounded-lg border border-border/60">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>N°</TableHead><TableHead>Date</TableHead><TableHead>Objet</TableHead>
                        <TableHead className="text-right">Total TTC</TableHead><TableHead>Statut</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {bcs.map((b: any) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-mono text-sm">{b.numero}</TableCell>
                            <TableCell>{formatDate(b.date_bc)}</TableCell>
                            <TableCell className="max-w-[250px] truncate text-sm">{b.objet || "—"}</TableCell>
                            <TableCell className="text-right tabular-nums font-medium">{Number(b.total_ttc || 0).toFixed(3)} DT</TableCell>
                            <TableCell><Badge variant={BC_STATUT_VARIANT[b.statut] ?? "outline"}>{BC_STATUT_LABEL[b.statut] ?? b.statut}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rapports */}
          <TabsContent value="rapports">
            <Card>
              <CardHeader><CardTitle className="text-base">Rapports d'essai</CardTitle><CardDescription>Téléchargez vos rapports validés au format PDF.</CardDescription></CardHeader>
              <CardContent>
                {loadingRap ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : rapports.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Aucun rapport disponible.</p>
                ) : (
                  <div className="rounded-lg border border-border/60">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>N°</TableHead><TableHead>Date</TableHead><TableHead>Titre</TableHead>
                        <TableHead>Statut</TableHead><TableHead className="text-right">PDF</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {rapports.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-sm">{r.numero}</TableCell>
                            <TableCell>{formatDate(r.date_rapport)}</TableCell>
                            <TableCell className="max-w-[260px] truncate text-sm">{r.titre}</TableCell>
                            <TableCell><Badge variant="default">{r.statut}</Badge></TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="ghost" onClick={() => handleDownloadRapport(r)}><Download className="h-4 w-4" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Factures */}
          <TabsContent value="factures">
            <Card>
              <CardHeader><CardTitle className="text-base">Factures</CardTitle></CardHeader>
              <CardContent>
                {loadingFac ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : factures.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Aucune facture.</p>
                ) : (
                  <div className="rounded-lg border border-border/60">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>N°</TableHead><TableHead>Date</TableHead>
                        <TableHead className="text-right">Net à payer</TableHead><TableHead>Paiement</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {factures.map((f: any) => (
                          <TableRow key={f.id}>
                            <TableCell className="font-mono text-sm">{f.numero}</TableCell>
                            <TableCell>{formatDate(f.date_facture)}</TableCell>
                            <TableCell className="text-right tabular-nums font-medium">{Number(f.net_a_payer || 0).toFixed(3)} DT</TableCell>
                            <TableCell>
                              <Badge variant={f.payment_status === "paye" ? "default" : f.payment_status === "partiel" ? "secondary" : "destructive"}>
                                {f.payment_status === "paye" ? "Payée" : f.payment_status === "partiel" ? "Partielle" : "Impayée"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
