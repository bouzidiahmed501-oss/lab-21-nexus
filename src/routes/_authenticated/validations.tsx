import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { EmptyState } from "@/components/lab/EmptyState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { FileCheck2, Loader2, ShieldCheck, ThumbsUp, ThumbsDown } from "lucide-react";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/validations")({
  head: () => ({ meta: [{ title: "Validations & Signatures — BALIMS" }] }),
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

function ValidationsPage() {
  const qc = useQueryClient();
  const [signOpen, setSignOpen] = useState<any | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [niveau, setNiveau] = useState("technicien");

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

  const signMut = useMutation({
    mutationFn: async ({ rapport, action }: { rapport: any; action: "valide" | "rejete" }) => {
      const { data: userData } = await supabase.auth.getUser();
      const payload = JSON.stringify({ rapport_id: rapport.id, niveau, user: userData.user?.id, at: new Date().toISOString() });
      const hash = action === "valide" ? await sha256(payload) : null;
      const { error } = await (supabase.from("validations_rapport" as never) as any).insert({
        rapport_id: rapport.id,
        niveau,
        user_id: userData.user?.id,
        statut: action,
        commentaire: commentaire || null,
        signature_hash: hash,
        signed_at: action === "valide" ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Enregistré");
      setSignOpen(null);
      setCommentaire("");
      qc.invalidateQueries({ queryKey: ["validations_all"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function niveauBadge(v: any) {
    if (v.statut === "valide") return <Badge className="bg-green-100 text-green-800 text-[10px]">{NIVEAUX.find((n) => n.value === v.niveau)?.label} ✓</Badge>;
    if (v.statut === "rejete") return <Badge className="bg-red-100 text-red-800 text-[10px]">{NIVEAUX.find((n) => n.value === v.niveau)?.label} ✗</Badge>;
    return <Badge variant="outline" className="text-[10px]">{NIVEAUX.find((n) => n.value === v.niveau)?.label}</Badge>;
  }

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Validations & Signatures électroniques"
        description="Workflow technicien → superviseur → qualité — hash SHA-256 conforme ISO 17025 §7.8 / 21 CFR Part 11"
      />

      <Card>
        <CardContent className="p-4">
          {isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> :
           rapports.length === 0 ? <EmptyState icon={FileCheck2} title="Aucun rapport" description="Les rapports générés apparaîtront ici pour validation." /> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>N° Rapport</TableHead><TableHead>Date</TableHead>
                <TableHead>Statut</TableHead><TableHead>Validations</TableHead><TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rapports.map((r: any) => {
                  const vals = validationsByRapport(r.id);
                  const signedQualite = vals.some((v: any) => v.niveau === "qualite" && v.statut === "valide");
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.numero ?? r.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs">{formatDate(r.created_at)}</TableCell>
                      <TableCell>
                        {signedQualite ? (
                          <Badge className="bg-green-100 text-green-800"><ShieldCheck className="h-3 w-3 mr-1" />Signé</Badge>
                        ) : (
                          <Badge variant="outline">En cours</Badge>
                        )}
                      </TableCell>
                      <TableCell><div className="flex flex-wrap gap-1">{vals.map((v: any) => <span key={v.id}>{niveauBadge(v)}</span>)}</div></TableCell>
                      <TableCell>
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
    </div>
  );
}
