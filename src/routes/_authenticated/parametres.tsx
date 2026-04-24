import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Workflow,
  Hash,
  FlaskConical,
  Wrench,
  Receipt,
  Bell,
  Shield,
  Plug,
  HardDrive,
  ScrollText,
  Users,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/parametres")({
  head: () => ({ meta: [{ title: "Paramètres — BALIMS" }] }),
  component: ParametresPage,
});

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type SettingsRow = {
  id: string;
  category: string;
  settings: Record<string, unknown>;
  updated_at: string;
};

type SequenceRow = {
  id: string;
  code: string;
  label: string;
  prefix: string;
  suffix: string;
  padding: number;
  current_value: number;
  year_reset: boolean;
  current_year: number;
  format_template: string;
};

// ----------------------------------------------------------------------------
// Hooks
// ----------------------------------------------------------------------------

function useAllSettings() {
  return useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*");
      if (error) throw error;
      const map: Record<string, SettingsRow> = {};
      for (const row of data ?? []) {
        map[row.category] = row as SettingsRow;
      }
      return map;
    },
  });
}

function useSequences() {
  return useQuery({
    queryKey: ["numbering_sequences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("numbering_sequences")
        .select("*")
        .order("label");
      if (error) throw error;
      return (data ?? []) as SequenceRow[];
    },
  });
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

function ParametresPage() {
  const { user } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles(user?.id);

  const canEdit = roles.includes("admin") || roles.includes("direction");
  const isAdmin = roles.includes("admin");

  return (
    <div className="px-8 py-6">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">Configuration globale</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Centralisez toute la configuration de votre plateforme BALIMS : société,
          workflow laboratoire, numérotation, facturation, sécurité, intégrations.
        </p>
        {!rolesLoading && !canEdit && (
          <div className="mt-3 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-foreground">
            Mode lecture seule — les modifications sont réservées aux administrateurs et à la direction.
          </div>
        )}
      </header>

      <Tabs defaultValue="societe" className="w-full">
        <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
          <TabsTrigger value="societe" className="gap-2"><Building2 className="h-4 w-4" />Société</TabsTrigger>
          <TabsTrigger value="workflow" className="gap-2"><Workflow className="h-4 w-4" />Workflow</TabsTrigger>
          <TabsTrigger value="numerotation" className="gap-2"><Hash className="h-4 w-4" />Numérotation</TabsTrigger>
          <TabsTrigger value="methodes" className="gap-2"><FlaskConical className="h-4 w-4" />Méthodes</TabsTrigger>
          <TabsTrigger value="equipements" className="gap-2"><Wrench className="h-4 w-4" />Équipements</TabsTrigger>
          <TabsTrigger value="facturation" className="gap-2"><Receipt className="h-4 w-4" />Facturation</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" />Notifications</TabsTrigger>
          <TabsTrigger value="securite" className="gap-2"><Shield className="h-4 w-4" />Sécurité</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2"><Plug className="h-4 w-4" />Intégrations</TabsTrigger>
          <TabsTrigger value="sauvegardes" className="gap-2"><HardDrive className="h-4 w-4" />Sauvegardes</TabsTrigger>
          <TabsTrigger value="utilisateurs" className="gap-2"><Users className="h-4 w-4" />Utilisateurs</TabsTrigger>
          <TabsTrigger value="audit" className="gap-2"><ScrollText className="h-4 w-4" />Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="societe"><SocieteTab canEdit={canEdit} /></TabsContent>
        <TabsContent value="workflow"><WorkflowTab canEdit={canEdit} /></TabsContent>
        <TabsContent value="numerotation"><NumerotationTab canEdit={isAdmin} /></TabsContent>
        <TabsContent value="methodes"><PlaceholderTab title="Méthodes & critères d'analyse" description="Gérez vos méthodes normalisées (ISO, AFNOR, internes), critères, unités, valeurs limites et formules de calcul." badge="Module Référentiels" /></TabsContent>
        <TabsContent value="equipements"><PlaceholderTab title="Configuration équipements" description="Catégories d'équipements, fréquences d'étalonnage, modèles de fiches de vie, intégration LabGuard." badge="Module Équipements" /></TabsContent>
        <TabsContent value="facturation"><FacturationTab canEdit={canEdit} /></TabsContent>
        <TabsContent value="notifications"><NotificationsTab canEdit={canEdit} /></TabsContent>
        <TabsContent value="securite"><SecuriteTab canEdit={isAdmin} /></TabsContent>
        <TabsContent value="integrations"><IntegrationsTab canEdit={isAdmin} /></TabsContent>
        <TabsContent value="sauvegardes"><SauvegardesTab canEdit={isAdmin} /></TabsContent>
        <TabsContent value="utilisateurs"><PlaceholderTab title="Gestion des utilisateurs & rôles" description="Créez des comptes, attribuez des rôles (admin, direction, chef labo, technicien, qualité, comptable, RH, commercial, client), gérez les permissions et les services." badge="Module Sécurité" /></TabsContent>
        <TabsContent value="audit"><PlaceholderTab title="Journal d'audit" description="Toutes les actions sensibles sont tracées : connexions, modifications, validations, suppressions. Filtre par utilisateur, date, type d'action." badge="Conformité ISO" /></TabsContent>
      </Tabs>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Generic JSON settings form helper
// ----------------------------------------------------------------------------

function useSettingsForm(category: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading } = useAllSettings();
  const row = data?.[category];
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (row?.settings) {
      setDraft(row.settings);
      setDirty(false);
    }
  }, [row?.settings]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!row) throw new Error("Catégorie introuvable");
      const { error } = await supabase
        .from("app_settings")
        .update({ settings: draft as never, updated_by: user?.id ?? null })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paramètres enregistrés");
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["app_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = (key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  return { draft, update, save: mutation.mutate, saving: mutation.isPending, dirty, isLoading };
}

function SaveBar({ canEdit, dirty, saving, onSave }: { canEdit: boolean; dirty: boolean; saving: boolean; onSave: () => void }) {
  if (!canEdit) return null;
  return (
    <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
      {dirty && <span className="text-xs text-muted-foreground">Modifications non enregistrées</span>}
      <Button onClick={onSave} disabled={!dirty || saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Enregistrer
      </Button>
    </div>
  );
}

function FieldText({
  label, value, onChange, disabled, type = "text", placeholder,
}: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} />
    </div>
  );
}

function FieldTextarea({
  label, value, onChange, disabled, rows = 3,
}: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; rows?: number }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} rows={rows} />
    </div>
  );
}

function FieldSwitch({
  label, description, value, onChange, disabled,
}: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border bg-card p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={value} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

const s = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const n = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
const b = (v: unknown) => v === true;

// ----------------------------------------------------------------------------
// Tabs
// ----------------------------------------------------------------------------

function SocieteTab({ canEdit }: { canEdit: boolean }) {
  const { draft, update, save, saving, dirty, isLoading } = useSettingsForm("societe");
  if (isLoading) return <LoadingCard />;
  const d = canEdit ? false : true;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identité de la société</CardTitle>
          <CardDescription>Ces informations apparaîtront sur les rapports, factures et documents officiels.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FieldText label="Nom commercial *" value={s(draft.nom_commercial)} onChange={(v) => update("nom_commercial", v)} disabled={d} />
          <FieldText label="Raison sociale" value={s(draft.raison_sociale)} onChange={(v) => update("raison_sociale", v)} disabled={d} />
          <div className="md:col-span-2">
            <FieldTextarea label="Adresse complète" value={s(draft.adresse)} onChange={(v) => update("adresse", v)} disabled={d} rows={2} />
          </div>
          <FieldText label="Ville" value={s(draft.ville)} onChange={(v) => update("ville", v)} disabled={d} />
          <FieldText label="Code postal" value={s(draft.code_postal)} onChange={(v) => update("code_postal", v)} disabled={d} />
          <FieldText label="Pays" value={s(draft.pays)} onChange={(v) => update("pays", v)} disabled={d} />
          <FieldText label="Téléphone" value={s(draft.telephone)} onChange={(v) => update("telephone", v)} disabled={d} />
          <FieldText label="Fax" value={s(draft.fax)} onChange={(v) => update("fax", v)} disabled={d} />
          <FieldText label="Email" type="email" value={s(draft.email)} onChange={(v) => update("email", v)} disabled={d} />
          <FieldText label="Site web" value={s(draft.site_web)} onChange={(v) => update("site_web", v)} disabled={d} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations fiscales & bancaires</CardTitle>
          <CardDescription>Données utilisées pour la facturation et les déclarations.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FieldText label="Matricule fiscal" value={s(draft.matricule_fiscal)} onChange={(v) => update("matricule_fiscal", v)} disabled={d} />
          <FieldText label="Registre du commerce" value={s(draft.registre_commerce)} onChange={(v) => update("registre_commerce", v)} disabled={d} />
          <FieldText label="Code TVA" value={s(draft.code_tva)} onChange={(v) => update("code_tva", v)} disabled={d} />
          <FieldText label="RIB" value={s(draft.rib)} onChange={(v) => update("rib", v)} disabled={d} />
          <FieldText label="IBAN" value={s(draft.iban)} onChange={(v) => update("iban", v)} disabled={d} />
          <FieldText label="SWIFT / BIC" value={s(draft.swift)} onChange={(v) => update("swift", v)} disabled={d} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identité visuelle & signatures</CardTitle>
          <CardDescription>URL des images de votre logo, cachet et signature du directeur (téléversement à venir).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FieldText label="URL Logo" value={s(draft.logo_url)} onChange={(v) => update("logo_url", v)} disabled={d} placeholder="https://..." />
          <FieldText label="URL Cachet" value={s(draft.cachet_url)} onChange={(v) => update("cachet_url", v)} disabled={d} placeholder="https://..." />
          <FieldText label="Nom du directeur" value={s(draft.directeur_nom)} onChange={(v) => update("directeur_nom", v)} disabled={d} />
          <FieldText label="URL Signature directeur" value={s(draft.directeur_signature_url)} onChange={(v) => update("directeur_signature_url", v)} disabled={d} placeholder="https://..." />
        </CardContent>
      </Card>

      <SaveBar canEdit={canEdit} dirty={dirty} saving={saving} onSave={save} />
    </div>
  );
}

function WorkflowTab({ canEdit }: { canEdit: boolean }) {
  const { draft, update, save, saving, dirty, isLoading } = useSettingsForm("workflow");
  if (isLoading) return <LoadingCard />;
  const d = !canEdit;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workflow laboratoire</CardTitle>
          <CardDescription>
            Configurez la chaîne : <strong>Mission → Bon de commande → Feuille de route → Prélèvement → Analyse → Résultats → Validation → Rapport → Facturation</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FieldSwitch label="Validation des bons de commande obligatoire" description="Un BC doit être validé par un responsable avant d'enclencher les analyses." value={b(draft.validation_bc_obligatoire)} onChange={(v) => update("validation_bc_obligatoire", v)} disabled={d} />
          <FieldSwitch label="Génération automatique de la feuille de route" description="Créer automatiquement la feuille de route à la validation du BC." value={b(draft.feuille_route_auto)} onChange={(v) => update("feuille_route_auto", v)} disabled={d} />
          <FieldSwitch label="Exiger un prélèvement avant analyse" description="L'enregistrement d'analyses requiert un prélèvement référencé." value={b(draft.exiger_prelevement_avant_analyse)} onChange={(v) => update("exiger_prelevement_avant_analyse", v)} disabled={d} />
          <FieldSwitch label="Double validation des rapports" description="Rapport validé par le chef de labo puis contre-signé par la direction." value={b(draft.double_validation_rapport)} onChange={(v) => update("double_validation_rapport", v)} disabled={d} />
          <FieldSwitch label="Validation qualité avant émission" description="L'équipe Qualité doit approuver chaque rapport avant envoi client." value={b(draft.exiger_validation_qualite)} onChange={(v) => update("exiger_validation_qualite", v)} disabled={d} />
          <FieldSwitch label="Affectation automatique des techniciens" description="Répartit les analyses selon la charge et la spécialité." value={b(draft.auto_assign_technicien)} onChange={(v) => update("auto_assign_technicien", v)} disabled={d} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Délais & alertes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FieldText label="Délai d'alerte analyse en retard (jours)" type="number" value={s(draft.delai_alerte_analyse_jours)} onChange={(v) => update("delai_alerte_analyse_jours", Number(v))} disabled={d} />
          <FieldText label="Délai de relance client (jours)" type="number" value={s(draft.delai_relance_client_jours)} onChange={(v) => update("delai_relance_client_jours", Number(v))} disabled={d} />
        </CardContent>
      </Card>

      <SaveBar canEdit={canEdit} dirty={dirty} saving={saving} onSave={save} />
    </div>
  );
}

function NumerotationTab({ canEdit }: { canEdit: boolean }) {
  const { data, isLoading } = useSequences();
  const qc = useQueryClient();
  const [edits, setEdits] = useState<Record<string, Partial<SequenceRow>>>({});

  const updateLocal = (id: string, patch: Partial<SequenceRow>) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const saveMutation = useMutation({
    mutationFn: async (row: SequenceRow) => {
      const patch = edits[row.id];
      if (!patch) return;
      const { error } = await supabase.from("numbering_sequences").update(patch).eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: (_d, row) => {
      toast.success(`Séquence « ${row.label} » mise à jour`);
      setEdits((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      qc.invalidateQueries({ queryKey: ["numbering_sequences"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <LoadingCard />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Numérotation des documents</CardTitle>
        <CardDescription>
          Personnalisez les préfixes, le remplissage et la remise à zéro annuelle.
          Variables disponibles dans le format : <code className="rounded bg-muted px-1 text-xs">{"{prefix}"}</code>{" "}
          <code className="rounded bg-muted px-1 text-xs">{"{year}"}</code>{" "}
          <code className="rounded bg-muted px-1 text-xs">{"{number}"}</code>{" "}
          <code className="rounded bg-muted px-1 text-xs">{"{suffix}"}</code>
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Préfixe</TableHead>
              <TableHead>Padding</TableHead>
              <TableHead>Compteur</TableHead>
              <TableHead>Reset annuel</TableHead>
              <TableHead>Aperçu</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).map((row) => {
              const patch = edits[row.id] ?? {};
              const merged: SequenceRow = { ...row, ...patch };
              const preview = merged.format_template
                .replace("{prefix}", merged.prefix)
                .replace("{year}", String(merged.current_year))
                .replace("{number}", String(merged.current_value + 1).padStart(merged.padding, "0"))
                .replace("{suffix}", merged.suffix);
              const dirty = Boolean(edits[row.id]);
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell>
                    <Input className="h-8 w-20" value={merged.prefix} disabled={!canEdit} onChange={(e) => updateLocal(row.id, { prefix: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input type="number" className="h-8 w-16" value={merged.padding} disabled={!canEdit} onChange={(e) => updateLocal(row.id, { padding: Number(e.target.value) })} />
                  </TableCell>
                  <TableCell>
                    <Input type="number" className="h-8 w-24" value={merged.current_value} disabled={!canEdit} onChange={(e) => updateLocal(row.id, { current_value: Number(e.target.value) })} />
                  </TableCell>
                  <TableCell>
                    <Switch checked={merged.year_reset} disabled={!canEdit} onCheckedChange={(v) => updateLocal(row.id, { year_reset: v })} />
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="font-mono text-xs">{preview}</Badge></TableCell>
                  <TableCell>
                    {dirty && canEdit && (
                      <Button size="sm" variant="outline" onClick={() => saveMutation.mutate(row)} disabled={saveMutation.isPending}>
                        <Save className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function FacturationTab({ canEdit }: { canEdit: boolean }) {
  const { draft, update, save, saving, dirty, isLoading } = useSettingsForm("facturation");
  if (isLoading) return <LoadingCard />;
  const d = !canEdit;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de facturation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FieldText label="TVA par défaut (%)" type="number" value={s(draft.tva_defaut)} onChange={(v) => update("tva_defaut", Number(v))} disabled={d} />
          <FieldText label="Devise" value={s(draft.devise)} onChange={(v) => update("devise", v)} disabled={d} />
          <FieldText label="Délai de paiement (jours)" type="number" value={s(draft.delai_paiement_jours)} onChange={(v) => update("delai_paiement_jours", Number(v))} disabled={d} />
          <FieldText label="Pénalité de retard (% / mois)" type="number" value={s(draft.penalite_retard_pct)} onChange={(v) => update("penalite_retard_pct", Number(v))} disabled={d} />
          <div className="md:col-span-2">
            <FieldTextarea label="Mention légale facture" value={s(draft.mention_legale_facture)} onChange={(v) => update("mention_legale_facture", v)} disabled={d} />
          </div>
          <div className="md:col-span-2">
            <FieldTextarea label="Conditions de paiement" value={s(draft.conditions_paiement)} onChange={(v) => update("conditions_paiement", v)} disabled={d} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Facturation électronique <Badge variant="secondary">Tunisie</Badge></CardTitle>
          <CardDescription>Intégration Elfatoora — TTN (Tunisie TradeNet) pour les factures XML certifiées.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldSwitch label="Activer Elfatoora" description="Émission automatique de la facture XML signée vers TTN." value={b(draft.elfatoora_actif)} onChange={(v) => update("elfatoora_actif", v)} disabled={d} />
          <FieldText label="Endpoint Elfatoora" value={s(draft.elfatoora_endpoint)} onChange={(v) => update("elfatoora_endpoint", v)} disabled={d} placeholder="https://elfatoora.tradenet.com.tn/..." />
          <FieldTextarea label="Certificat (PEM)" value={s(draft.elfatoora_certificate)} onChange={(v) => update("elfatoora_certificate", v)} disabled={d} rows={4} />
        </CardContent>
      </Card>

      <SaveBar canEdit={canEdit} dirty={dirty} saving={saving} onSave={save} />
    </div>
  );
}

function NotificationsTab({ canEdit }: { canEdit: boolean }) {
  const { draft, update, save, saving, dirty, isLoading } = useSettingsForm("notifications");
  if (isLoading) return <LoadingCard />;
  const d = !canEdit;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Canaux de notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FieldSwitch label="Email" value={b(draft.email_actif)} onChange={(v) => update("email_actif", v)} disabled={d} />
          <FieldSwitch label="SMS" value={b(draft.sms_actif)} onChange={(v) => update("sms_actif", v)} disabled={d} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Évènements à notifier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FieldSwitch label="Nouveau bon de commande reçu" value={b(draft.notif_nouveau_bc)} onChange={(v) => update("notif_nouveau_bc", v)} disabled={d} />
          <FieldSwitch label="Analyse terminée" value={b(draft.notif_analyse_terminee)} onChange={(v) => update("notif_analyse_terminee", v)} disabled={d} />
          <FieldSwitch label="Rapport prêt à valider" value={b(draft.notif_rapport_pret)} onChange={(v) => update("notif_rapport_pret", v)} disabled={d} />
          <FieldSwitch label="Facture émise" value={b(draft.notif_facture_emise)} onChange={(v) => update("notif_facture_emise", v)} disabled={d} />
          <FieldSwitch label="Étalonnage équipement à prévoir" value={b(draft.notif_equipement_etalonnage)} onChange={(v) => update("notif_equipement_etalonnage", v)} disabled={d} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration SMTP</CardTitle>
          <CardDescription>Utilisé pour l'envoi des emails transactionnels et notifications.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FieldText label="Hôte SMTP" value={s(draft.smtp_host)} onChange={(v) => update("smtp_host", v)} disabled={d} />
          <FieldText label="Port" type="number" value={s(draft.smtp_port)} onChange={(v) => update("smtp_port", Number(v))} disabled={d} />
          <FieldText label="Utilisateur" value={s(draft.smtp_user)} onChange={(v) => update("smtp_user", v)} disabled={d} />
        </CardContent>
      </Card>

      <SaveBar canEdit={canEdit} dirty={dirty} saving={saving} onSave={save} />
    </div>
  );
}

function SecuriteTab({ canEdit }: { canEdit: boolean }) {
  const { draft, update, save, saving, dirty, isLoading } = useSettingsForm("securite");
  if (isLoading) return <LoadingCard />;
  const d = !canEdit;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Politique de mot de passe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldText label="Longueur minimale" type="number" value={s(draft.longueur_mdp_min)} onChange={(v) => update("longueur_mdp_min", Number(v))} disabled={d} />
          <FieldSwitch label="Exiger une majuscule" value={b(draft.exiger_majuscule)} onChange={(v) => update("exiger_majuscule", v)} disabled={d} />
          <FieldSwitch label="Exiger un chiffre" value={b(draft.exiger_chiffre)} onChange={(v) => update("exiger_chiffre", v)} disabled={d} />
          <FieldSwitch label="Exiger un caractère spécial" value={b(draft.exiger_special)} onChange={(v) => update("exiger_special", v)} disabled={d} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions & accès</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldText label="Durée de session (minutes)" type="number" value={s(draft.duree_session_minutes)} onChange={(v) => update("duree_session_minutes", Number(v))} disabled={d} />
          <FieldText label="Verrouillage après X échecs" type="number" value={s(draft.verrouillage_apres_echecs)} onChange={(v) => update("verrouillage_apres_echecs", Number(v))} disabled={d} />
          <FieldSwitch label="Authentification à deux facteurs obligatoire (admins)" value={b(draft.force_2fa_admin)} onChange={(v) => update("force_2fa_admin", v)} disabled={d} />
          <FieldText label="Conservation journal d'audit (jours)" type="number" value={s(draft.audit_log_retention_jours)} onChange={(v) => update("audit_log_retention_jours", Number(v))} disabled={d} />
        </CardContent>
      </Card>

      <SaveBar canEdit={canEdit} dirty={dirty} saving={saving} onSave={save} />
    </div>
  );
}

function IntegrationsTab({ canEdit }: { canEdit: boolean }) {
  const { draft, update, save, saving, dirty, isLoading } = useSettingsForm("integrations");
  if (isLoading) return <LoadingCard />;
  const d = !canEdit;

  const integrations = useMemo(() => [
    { key: "elfatoora_actif", label: "Elfatoora (TTN)", desc: "Facturation électronique tunisienne" },
    { key: "google_calendar_actif", label: "Google Calendar", desc: "Synchroniser les missions et tournées" },
    { key: "outlook_actif", label: "Microsoft Outlook", desc: "Synchroniser les emails et calendrier" },
    { key: "iso_17025_actif", label: "Conformité ISO 17025", desc: "Activer les contrôles qualité étendus" },
    { key: "labguard_actif", label: "LabGuard", desc: "Synchronisation des équipements et étalonnages" },
    { key: "api_externe_actif", label: "API externe (REST)", desc: "Exposer les données via une API publique sécurisée" },
  ], []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Intégrations & connecteurs</CardTitle>
          <CardDescription>Activez les intégrations dont votre laboratoire a besoin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {integrations.map((it) => (
            <FieldSwitch
              key={it.key}
              label={it.label}
              description={it.desc}
              value={b(draft[it.key])}
              onChange={(v) => update(it.key, v)}
              disabled={d}
            />
          ))}
        </CardContent>
      </Card>

      <SaveBar canEdit={canEdit} dirty={dirty} saving={saving} onSave={save} />
    </div>
  );
}

function SauvegardesTab({ canEdit }: { canEdit: boolean }) {
  const { draft, update, save, saving, dirty, isLoading } = useSettingsForm("sauvegardes");
  if (isLoading) return <LoadingCard />;
  const d = !canEdit;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sauvegardes automatiques</CardTitle>
          <CardDescription>Vos données sont déjà sauvegardées en continu par l'infrastructure cloud. Ces réglages contrôlent les exports complémentaires.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldSwitch label="Activer les sauvegardes automatiques" value={b(draft.auto_backup_actif)} onChange={(v) => update("auto_backup_actif", v)} disabled={d} />
          <div className="grid gap-4 md:grid-cols-3">
            <FieldText label="Fréquence (jours)" type="number" value={s(draft.frequence_jours)} onChange={(v) => update("frequence_jours", Number(v))} disabled={d} />
            <FieldText label="Rétention (jours)" type="number" value={s(draft.retention_jours)} onChange={(v) => update("retention_jours", Number(v))} disabled={d} />
            <FieldText label="Destination" value={s(draft.destination)} onChange={(v) => update("destination", v)} disabled={d} />
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Dernière sauvegarde : {draft.derniere_sauvegarde ? String(draft.derniere_sauvegarde) : "—"}
          </p>
        </CardContent>
      </Card>

      <SaveBar canEdit={canEdit} dirty={dirty} saving={saving} onSave={save} />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function LoadingCard() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function PlaceholderTab({ title, description, badge }: { title: string; description: string; badge: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Badge variant="secondary">{badge}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-dashed bg-muted/30 px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">Module à activer</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cette section sera connectée lors de la livraison du module correspondant.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
