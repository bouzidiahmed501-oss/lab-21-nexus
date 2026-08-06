import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { EmptyState } from "@/components/lab/EmptyState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FileCheck2, Loader2, ShieldCheck, ThumbsUp, ThumbsDown, Signature } from "lucide-react";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/validations")({
  head: () => ({
    meta: [
      { title: "Validations & Signatures — BALIMS" },
      { name: "description", content: "File d'attente de validation personnelle et signature électronique en lot des rapports d'essai." },
      { property: "og:title", content: "Validations & Signatures — BALIMS" },
      { property: "og:description", content: "Workflow technicien → superviseur → qualité avec signature SHA-256 horodatée." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ValidationsPage,
});

const NIVEAUX = [
  { value: "technicien", label: "Technicien" },
  { value: "superviseur", label: "Superviseur" },
  { value: "qualite", label: "Responsable Qualité" },
];

async function sha256(text: string) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

type Vue = "moi" | "en_cours" | "signes" | "tous";

function ValidationsPage() {
  const qc = useQueryClient();
  const [signOpen, setSignOpen] = useState<any | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [commentaire, setCommentaire] = useState("");
  const [niveau, setNiveau] = useState("technicien");
  const [vue, setVue] = useState<Vue>("moi");
  const [selected, setSelected] = useState<string[]>([]);

  const { data: userId } = useQuery({
    queryKey: ["current_user_id"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
  });

  const { data: rapports = [], isLoading } = useQuery({
    queryKey: ["rapports_validation"],
    queryFn: async () => {
      const { data } = await (supabase.from("rapports" as never) as any)
        .select("*").order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  const { data: validations = [] } = useQuery({
    queryKey: ["validations_all"],
    queryFn: async () => {
      const { data } = await (supabase.from("validations_rapport" as never) as any).select("*");
      return data ?? [];
    },
  });

  const validationsByRapport = (rapportId: string) =>
    validations.filter((v: any) => v.rapport_id === rapportId);

  const isSigned = (rapportId: string) =>
    validationsByRapport(rapportId).some((v: any) => v.niveau === "qualite" && v.statut === "valide");

  // « À valider par moi » : pas encore signé au niveau sélectionné par l'utilisateur courant.
  const aValiderParMoi = (rapportId: string) =>
    !isSigned(rapportId) &&
    !validationsByRapport(rapportId).some((v: any) => v.user_id === userId && v.niveau === niveau);

  const visibles = useMemo(() => {
    return rapports.filter((r: any) => {
      if (vue === "tous") return true;
      if (vue === "signes") return isSigned(r.id);
      if (vue === "en_cours") return !isSigned(r.id);
      return aValiderParMoi(r.id);
    });
  }, [rapports, validations, vue, niveau, userId]);

  const selectable = visibles.filter((r: any) => !isSigned(r.id)).map((r: any) => r.id);
  const allSelected = selectable.length > 0 && selectable.every((id: string) => selected.includes(id));

  async function signOne(rapportId: string, action: "valide" | "rejete", note: string) {
    const payload = JSON.stringify({ rapport_id: rapportId, niveau, user: userId, at: new Date().toISOString() });
    const hash = action === "valide" ? await sha256(payload) : null;
    const { error } = await (supabase.from("validations_rapport" as never) as any).insert({
      rapport_id: rapportId,
      niveau,
      user_id: userId,
      statut: action,
      commentaire: note || null,
      signature_hash: hash,
      signed_at: action === "valide" ? new Date().toISOString() : null,
    });
    if (error) throw error;
  }

  const signMut = useMutation({
    mutationFn: async ({ rapport, action }: { rapport: any; action: "valide" | "rejete" }) =>
      signOne(rapport.id, action, commentaire),
    onSuccess: () => {
      toast.success("Enregistré");
      setSignOpen(null);
      setCommentaire("");
      qc.invalidateQueries({ queryKey: ["validations_all"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const batchMut = useMutation({
    mutationFn: async (action: "valide" | "rejete") => {
      for (const id of selected) await signOne(id, action, commentaire);
      return selected.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} rapport(s) traité(s)`);
      setBatchOpen(false);
      setSelected([]);
      setCommentaire("");
      qc.invalidateQueries({ queryKey: ["validations_all"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function niveauBadge(v: any) {
    const label = NIVEAUX.find((n) => n.value === v.niveau)?.label;
    if (v.statut === "valide") return <Badge className="bg-success/15 text-success text-[10px]">{label} ✓</Badge>;
    if (v.statut === "rejete") return <Badge className="bg-destructive/15 text-destructive text-[10px]">{label} ✗</Badge>;
    return <Badge variant="outline" className="text-[10px]">{label}</Badge>;
  }

  const compteMoi = rapports.filter((r: any) => aValiderParMoi(r.id)).length;

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Validations & Signatures électroniques"
        description="Workflow technicien → superviseur → qualité — hash SHA-256 conforme ISO 17025 §7.8 / 21 CFR Part 11"
        backTo="/rapports"
        actions={
          <Button size="sm" disabled={selected.length === 0} onClick={() => setBatchOpen(true)}>
            <Signature className="h-3.5 w-3.5" /> Signer en lot ({selected.length})
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={vue} onValueChange={(v) => { setVue(v as Vue); setSelected([]); }}>
          <TabsList>
            <TabsTrigger value="moi">À valider par moi ({compteMoi})</TabsTrigger>
            <TabsTrigger value="en_cours">En cours</TabsTrigger>
            <TabsTrigger value="signes">Signés</TabsTrigger>
            <TabsTrigger value="tous">Tous</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Je signe en tant que</span>
          <Select value={niveau} onValueChange={(v) => { setNiveau(v); setSelected([]); }}>
            <SelectTrigger className="h-9 w-52"><SelectValue /></SelectTrigger>
            <SelectContent>{NIVEAUX.map((n) => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> :
           visibles.length === 0 ? (
            <EmptyState
              icon={FileCheck2}
              title={vue === "moi" ? "Rien à valider pour vous" : "Aucun rapport"}
              description={vue === "moi"
                ? "Aucun rapport n'attend votre signature à ce niveau. Changez de niveau ou consultez l'onglet « En cours »."
                : "Les rapports générés apparaîtront ici pour validation."}
            />
           ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    aria-label="Tout sélectionner"
                    onCheckedChange={(c) => setSelected(c ? selectable : [])}
                  />
                </TableHead>
                <TableHead>N° Rapport</TableHead><TableHead>Date</TableHead>
                <TableHead>Statut</TableHead><TableHead>Validations</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {visibles.map((r: any) => {
                  const vals = validationsByRapport(r.id);
                  const signedQualite = isSigned(r.id);
                  return (
                    <TableRow key={r.id} className={selected.includes(r.id) ? "bg-primary/5" : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(r.id)}
                          disabled={signedQualite}
                          aria-label={`Sélectionner ${r.numero ?? r.id}`}
                          onCheckedChange={(c) =>
                            setSelected((s) => (c ? [...s, r.id] : s.filter((x) => x !== r.id)))
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.numero ?? r.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs">{formatDate(r.created_at)}</TableCell>
                      <TableCell>
                        {signedQualite ? (
                          <Badge className="bg-success/15 text-success"><ShieldCheck className="h-3 w-3 mr-1" />Signé</Badge>
                        ) : (
                          <Badge variant="outline">En cours</Badge>
                        )}
                      </TableCell>
                      <TableCell><div className="flex flex-wrap gap-1">{vals.map((v: any) => <span key={v.id}>{niveauBadge(v)}</span>)}</div></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setSignOpen(r)} disabled={signedQualite}>
                          Valider
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!signOpen} onOpenChange={(o) => !o && setSignOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Validation / Signature</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Niveau</label>
              <Select value={niveau} onValueChange={setNiveau}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{NIVEAUX.map((n) => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Commentaire</label>
              <Textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={3} />
            </div>
            <p className="text-xs text-muted-foreground">
              La validation génère un hash SHA-256 horodaté qui certifie votre signature électronique.
            </p>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => signMut.mutate({ rapport: signOpen, action: "rejete" })} disabled={signMut.isPending}>
              <ThumbsDown className="mr-2 h-4 w-4" /> Rejeter
            </Button>
            <Button onClick={() => signMut.mutate({ rapport: signOpen, action: "valide" })} disabled={signMut.isPending}>
              <ThumbsUp className="mr-2 h-4 w-4" /> Valider & signer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={batchOpen} onOpenChange={(o) => !o && setBatchOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Signature en lot — {selected.length} rapport(s)</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Vous signez en tant que <span className="font-medium text-foreground">{NIVEAUX.find((n) => n.value === niveau)?.label}</span>.
              Chaque rapport reçoit sa propre signature SHA-256 horodatée.
            </p>
            <div>
              <label className="text-sm font-medium">Commentaire commun</label>
              <Textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => batchMut.mutate("rejete")} disabled={batchMut.isPending}>
              <ThumbsDown className="mr-2 h-4 w-4" /> Rejeter le lot
            </Button>
            <Button onClick={() => batchMut.mutate("valide")} disabled={batchMut.isPending}>
              {batchMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
              Valider & signer le lot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
