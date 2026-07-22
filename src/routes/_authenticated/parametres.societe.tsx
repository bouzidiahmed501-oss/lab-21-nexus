import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save, Building2, Receipt, Hash, Bell as BellIcon, Palette } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/lab/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/parametres/societe")({
  head: () => ({
    meta: [
      { title: "Paramètres société — BALIMS" },
      { name: "description", content: "Personnalisation de votre société : identité, fiscalité, numérotation, notifications." },
    ],
  }),
  component: SocietePage,
});

type NumSeq = {
  id: string;
  code: string;
  prefix: string;
  suffix: string;
  padding: number;
  current_value: number;
  current_year: number;
  year_reset: boolean;
  format_template: string;
};

type NotifRule = {
  id: string;
  evenement: string;
  libelle: string;
  canal_in_app: boolean;
  canal_email: boolean;
  destinataires_roles: string[];
  delai_minutes: number;
  actif: boolean;
};

const EVENEMENTS = [
  { code: "facture_impayee", label: "Facture impayée (échéance dépassée)" },
  { code: "seuil_iot", label: "Seuil IoT dépassé" },
  { code: "echeance_etalonnage", label: "Échéance étalonnage équipement" },
  { code: "nc_ouverte", label: "Non-conformité ouverte" },
  { code: "devis_valide", label: "Devis validé par client" },
  { code: "rapport_signe", label: "Rapport signé" },
  { code: "mission_planifiee", label: "Mission planifiée" },
  { code: "prelevement_recu", label: "Prélèvement réceptionné" },
];

const ROLES = ["admin", "direction", "chef_labo", "commercial", "comptable", "qualite", "technicien"];

function SocietePage() {
  const { user } = useAuth();
  const { hasRole } = useUserRoles(user?.id);
  const isAdmin = hasRole("admin");
  const { tenant, loading, reload } = useTenant();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string | number | null>>({});
  const [sequences, setSequences] = useState<NumSeq[]>([]);
  const [rules, setRules] = useState<NotifRule[]>([]);

  useEffect(() => {
    if (tenant) {
      setForm({
        nom: tenant.nom,
        logo_url: tenant.logo_url ?? "",
        couleur_primaire: tenant.couleur_primaire ?? "#0c2340",
        couleur_secondaire: tenant.couleur_secondaire ?? "#2d8a9e",
        adresse: tenant.adresse ?? "",
        ville: tenant.ville ?? "",
        code_postal: tenant.code_postal ?? "",
        pays: tenant.pays ?? "Tunisie",
        telephone: tenant.telephone ?? "",
        email: tenant.email ?? "",
        site_web: tenant.site_web ?? "",
        matricule_fiscal: tenant.matricule_fiscal ?? "",
        rib: tenant.rib ?? "",
        tva_defaut: tenant.tva_defaut ?? 19,
        timbre_fiscal: tenant.timbre_fiscal ?? 1,
        retenue_source: tenant.retenue_source ?? 0,
        monnaie: tenant.monnaie ?? "TND",
        langue: tenant.langue ?? "fr",
        fuseau: tenant.fuseau ?? "Africa/Tunis",
        format_date: tenant.format_date ?? "dd/MM/yyyy",
        mentions_legales: tenant.mentions_legales ?? "",
        signature_scan_url: tenant.signature_scan_url ?? "",
      });
    }
  }, [tenant]);

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const { data: seq } = await supabase
        .from("numbering_sequences" as never)
        .select("*")
        .order("code");
      setSequences((seq as unknown as NumSeq[]) ?? []);

      const { data: nr } = await supabase
        .from("notification_rules" as never)
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("evenement");
      setRules((nr as unknown as NotifRule[]) ?? []);
    })();
  }, [tenant]);

  const saveIdentity = async () => {
    if (!tenant) return;
    setSaving(true);
    const { error } = await supabase
      .from("tenants" as never)
      .update(form as never)
      .eq("id", tenant.id);
    setSaving(false);
    if (error) toast.error("Erreur : " + error.message);
    else {
      toast.success("Société mise à jour");
      reload();
    }
  };

  const saveSequence = async (seq: NumSeq) => {
    const { error } = await supabase
      .from("numbering_sequences" as never)
      .update({
        prefix: seq.prefix,
        suffix: seq.suffix,
        padding: seq.padding,
        year_reset: seq.year_reset,
        format_template: seq.format_template,
      } as never)
      .eq("id", seq.id);
    if (error) toast.error("Erreur : " + error.message);
    else toast.success(`Séquence ${seq.code} enregistrée`);
  };

  const upsertRule = async (evenement: string, patch: Partial<NotifRule>) => {
    if (!tenant) return;
    const existing = rules.find((r) => r.evenement === evenement);
    const label = EVENEMENTS.find((e) => e.code === evenement)?.label ?? evenement;
    if (existing) {
      await supabase
        .from("notification_rules" as never)
        .update(patch as never)
        .eq("id", existing.id);
    } else {
      await supabase.from("notification_rules" as never).insert({
        tenant_id: tenant.id,
        evenement,
        libelle: label,
        canal_in_app: true,
        canal_email: false,
        destinataires_roles: ["admin"],
        delai_minutes: 0,
        actif: true,
        ...patch,
      } as never);
    }
    const { data: nr } = await supabase
      .from("notification_rules" as never)
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("evenement");
    setRules((nr as unknown as NotifRule[]) ?? []);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Aucune société rattachée à votre profil.</div>
    );
  }

  const numeroPreview = (seq: NumSeq) => {
    const year = new Date().getFullYear();
    return seq.format_template
      .replace("{prefix}", seq.prefix ?? "")
      .replace("{year}", String(year))
      .replace("{number}", String(seq.current_value + 1).padStart(seq.padding, "0"))
      .replace("{suffix}", seq.suffix ?? "");
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Paramètres société"
        description={`${tenant.nom} • Personnalisez votre identité, fiscalité, numérotation et notifications.`}
        backTo="/parametres"
      />

      {!isAdmin && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-3 text-xs text-amber-700 dark:text-amber-300">
            Mode lecture seule — seuls les administrateurs peuvent modifier les paramètres société.
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="identite" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="identite" className="gap-2"><Building2 className="h-4 w-4" />Identité</TabsTrigger>
          <TabsTrigger value="fiscalite" className="gap-2"><Receipt className="h-4 w-4" />Fiscalité</TabsTrigger>
          <TabsTrigger value="numerotation" className="gap-2"><Hash className="h-4 w-4" />Numérotation</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><BellIcon className="h-4 w-4" />Notifications</TabsTrigger>
        </TabsList>

        {/* IDENTITE */}
        <TabsContent value="identite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Palette className="h-4 w-4" />Identité visuelle</CardTitle>
              <CardDescription>Nom, logo et couleurs affichés dans l'application et sur vos PDF.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div><Label>Nom société</Label><Input value={String(form.nom ?? "")} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} disabled={!isAdmin} /></div>
              <div><Label>Logo (URL)</Label><Input value={String(form.logo_url ?? "")} onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))} disabled={!isAdmin} placeholder="https://…" /></div>
              <div><Label>Couleur primaire</Label><div className="flex gap-2"><Input type="color" value={String(form.couleur_primaire ?? "#0c2340")} onChange={(e) => setForm((f) => ({ ...f, couleur_primaire: e.target.value }))} disabled={!isAdmin} className="w-16 p-1" /><Input value={String(form.couleur_primaire ?? "")} onChange={(e) => setForm((f) => ({ ...f, couleur_primaire: e.target.value }))} disabled={!isAdmin} /></div></div>
              <div><Label>Couleur secondaire</Label><div className="flex gap-2"><Input type="color" value={String(form.couleur_secondaire ?? "#2d8a9e")} onChange={(e) => setForm((f) => ({ ...f, couleur_secondaire: e.target.value }))} disabled={!isAdmin} className="w-16 p-1" /><Input value={String(form.couleur_secondaire ?? "")} onChange={(e) => setForm((f) => ({ ...f, couleur_secondaire: e.target.value }))} disabled={!isAdmin} /></div></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Coordonnées</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2"><Label>Adresse</Label><Input value={String(form.adresse ?? "")} onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))} disabled={!isAdmin} /></div>
              <div><Label>Ville</Label><Input value={String(form.ville ?? "")} onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))} disabled={!isAdmin} /></div>
              <div><Label>Code postal</Label><Input value={String(form.code_postal ?? "")} onChange={(e) => setForm((f) => ({ ...f, code_postal: e.target.value }))} disabled={!isAdmin} /></div>
              <div><Label>Pays</Label><Input value={String(form.pays ?? "")} onChange={(e) => setForm((f) => ({ ...f, pays: e.target.value }))} disabled={!isAdmin} /></div>
              <div><Label>Téléphone</Label><Input value={String(form.telephone ?? "")} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} disabled={!isAdmin} /></div>
              <div><Label>Email</Label><Input type="email" value={String(form.email ?? "")} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} disabled={!isAdmin} /></div>
              <div className="md:col-span-2"><Label>Site web</Label><Input value={String(form.site_web ?? "")} onChange={(e) => setForm((f) => ({ ...f, site_web: e.target.value }))} disabled={!isAdmin} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Mentions légales & signature</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div><Label>Mentions légales (bas de page PDF)</Label><Textarea rows={4} value={String(form.mentions_legales ?? "")} onChange={(e) => setForm((f) => ({ ...f, mentions_legales: e.target.value }))} disabled={!isAdmin} /></div>
              <div><Label>Signature scannée (URL image)</Label><Input value={String(form.signature_scan_url ?? "")} onChange={(e) => setForm((f) => ({ ...f, signature_scan_url: e.target.value }))} disabled={!isAdmin} placeholder="https://…" /></div>
            </CardContent>
          </Card>

          <div className="flex justify-end"><Button onClick={saveIdentity} disabled={!isAdmin || saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Enregistrer</Button></div>
        </TabsContent>

        {/* FISCALITE */}
        <TabsContent value="fiscalite" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Paramètres fiscaux</CardTitle><CardDescription>Utilisés par défaut sur devis, BC et factures.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div><Label>Matricule fiscal</Label><Input value={String(form.matricule_fiscal ?? "")} onChange={(e) => setForm((f) => ({ ...f, matricule_fiscal: e.target.value }))} disabled={!isAdmin} /></div>
              <div><Label>RIB</Label><Input value={String(form.rib ?? "")} onChange={(e) => setForm((f) => ({ ...f, rib: e.target.value }))} disabled={!isAdmin} /></div>
              <div><Label>TVA par défaut (%)</Label><Input type="number" step="0.01" value={Number(form.tva_defaut ?? 0)} onChange={(e) => setForm((f) => ({ ...f, tva_defaut: Number(e.target.value) }))} disabled={!isAdmin} /></div>
              <div><Label>Timbre fiscal</Label><Input type="number" step="0.001" value={Number(form.timbre_fiscal ?? 0)} onChange={(e) => setForm((f) => ({ ...f, timbre_fiscal: Number(e.target.value) }))} disabled={!isAdmin} /></div>
              <div><Label>Retenue à la source (%)</Label><Input type="number" step="0.01" value={Number(form.retenue_source ?? 0)} onChange={(e) => setForm((f) => ({ ...f, retenue_source: Number(e.target.value) }))} disabled={!isAdmin} /></div>
              <div><Label>Monnaie</Label><Input value={String(form.monnaie ?? "")} onChange={(e) => setForm((f) => ({ ...f, monnaie: e.target.value }))} disabled={!isAdmin} /></div>
              <div><Label>Langue</Label><Input value={String(form.langue ?? "")} onChange={(e) => setForm((f) => ({ ...f, langue: e.target.value }))} disabled={!isAdmin} /></div>
              <div><Label>Fuseau horaire</Label><Input value={String(form.fuseau ?? "")} onChange={(e) => setForm((f) => ({ ...f, fuseau: e.target.value }))} disabled={!isAdmin} /></div>
            </CardContent>
          </Card>
          <div className="flex justify-end"><Button onClick={saveIdentity} disabled={!isAdmin || saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Enregistrer</Button></div>
        </TabsContent>

        {/* NUMEROTATION */}
        <TabsContent value="numerotation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Séquences de numérotation</CardTitle>
              <CardDescription>
                Personnalisez le préfixe, la longueur et le format des numéros de documents.
                Modèle : <code className="rounded bg-muted px-1">{`{prefix}-{year}-{number}{suffix}`}</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Préfixe</TableHead>
                      <TableHead>Suffixe</TableHead>
                      <TableHead className="w-20">Padding</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Reset an.</TableHead>
                      <TableHead>Aperçu</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sequences.map((seq, idx) => (
                      <TableRow key={seq.id}>
                        <TableCell><Badge variant="outline">{seq.code}</Badge></TableCell>
                        <TableCell><Input value={seq.prefix ?? ""} onChange={(e) => setSequences((arr) => arr.map((s, i) => i === idx ? { ...s, prefix: e.target.value } : s))} disabled={!isAdmin} className="h-8 w-20" /></TableCell>
                        <TableCell><Input value={seq.suffix ?? ""} onChange={(e) => setSequences((arr) => arr.map((s, i) => i === idx ? { ...s, suffix: e.target.value } : s))} disabled={!isAdmin} className="h-8 w-16" /></TableCell>
                        <TableCell><Input type="number" min={1} max={10} value={seq.padding} onChange={(e) => setSequences((arr) => arr.map((s, i) => i === idx ? { ...s, padding: Number(e.target.value) } : s))} disabled={!isAdmin} className="h-8 w-16" /></TableCell>
                        <TableCell><Input value={seq.format_template} onChange={(e) => setSequences((arr) => arr.map((s, i) => i === idx ? { ...s, format_template: e.target.value } : s))} disabled={!isAdmin} className="h-8 w-56 font-mono text-xs" /></TableCell>
                        <TableCell><Switch checked={seq.year_reset} onCheckedChange={(v) => setSequences((arr) => arr.map((s, i) => i === idx ? { ...s, year_reset: v } : s))} disabled={!isAdmin} /></TableCell>
                        <TableCell><code className="rounded bg-muted px-2 py-1 text-xs">{numeroPreview(seq)}</code></TableCell>
                        <TableCell><Button size="sm" variant="outline" onClick={() => saveSequence(seq)} disabled={!isAdmin}>OK</Button></TableCell>
                      </TableRow>
                    ))}
                    {sequences.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground">Aucune séquence configurée.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Règles de notifications</CardTitle>
              <CardDescription>Choisissez, pour chaque événement, les canaux et les rôles destinataires.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Événement</TableHead>
                      <TableHead className="w-20">In-app</TableHead>
                      <TableHead className="w-20">Email</TableHead>
                      <TableHead>Destinataires (rôles)</TableHead>
                      <TableHead className="w-24">Délai (min)</TableHead>
                      <TableHead className="w-20">Actif</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {EVENEMENTS.map((ev) => {
                      const rule = rules.find((r) => r.evenement === ev.code);
                      return (
                        <TableRow key={ev.code}>
                          <TableCell className="text-sm">{ev.label}</TableCell>
                          <TableCell><Switch checked={rule?.canal_in_app ?? true} onCheckedChange={(v) => upsertRule(ev.code, { canal_in_app: v })} disabled={!isAdmin} /></TableCell>
                          <TableCell><Switch checked={rule?.canal_email ?? false} onCheckedChange={(v) => upsertRule(ev.code, { canal_email: v })} disabled={!isAdmin} /></TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {ROLES.map((role) => {
                                const active = (rule?.destinataires_roles ?? []).includes(role);
                                return (
                                  <button
                                    key={role}
                                    type="button"
                                    disabled={!isAdmin}
                                    onClick={() => {
                                      const current = rule?.destinataires_roles ?? [];
                                      const next = active ? current.filter((r) => r !== role) : [...current, role];
                                      upsertRule(ev.code, { destinataires_roles: next });
                                    }}
                                    className={`rounded-full border px-2 py-0.5 text-[10px] transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}
                                  >
                                    {role}
                                  </button>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell><Input type="number" min={0} value={rule?.delai_minutes ?? 0} onChange={(e) => upsertRule(ev.code, { delai_minutes: Number(e.target.value) })} disabled={!isAdmin} className="h-8 w-20" /></TableCell>
                          <TableCell><Switch checked={rule?.actif ?? true} onCheckedChange={(v) => upsertRule(ev.code, { actif: v })} disabled={!isAdmin} /></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
