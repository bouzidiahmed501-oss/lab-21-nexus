import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Loader2, Power } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { DataTable, type Column } from "@/components/lab/DataTable";
import { StatusBadge } from "@/components/lab/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/clients")({
  head: () => ({ meta: [{ title: "Clients — BALIMS" }] }),
  component: ClientsPage,
});

const clientSchema = z.object({
  raison_sociale: z.string().trim().min(2, "Raison sociale requise").max(200),
  code: z.string().trim().max(50).optional().nullable(),
  type_client: z.string().max(50).optional().nullable(),
  matricule_fiscal: z.string().trim().max(50).optional().nullable(),
  registre_commerce: z.string().trim().max(50).optional().nullable(),
  email: z.string().trim().email("Email invalide").max(255).optional().or(z.literal("")),
  telephone: z.string().trim().max(50).optional().nullable(),
  adresse: z.string().trim().max(500).optional().nullable(),
  ville: z.string().trim().max(100).optional().nullable(),
  code_postal: z.string().trim().max(20).optional().nullable(),
  pays: z.string().trim().max(100).optional().nullable(),
  contact_principal: z.string().trim().max(150).optional().nullable(),
  contact_email: z.string().trim().email("Email contact invalide").max(255).optional().or(z.literal("")),
  contact_telephone: z.string().trim().max(50).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  is_active: z.boolean().default(true),
});

type ClientForm = z.infer<typeof clientSchema>;

interface ClientRow extends ClientForm {
  id: string;
  created_at: string;
}

const EMPTY_FORM: ClientForm = {
  raison_sociale: "", code: "", type_client: "societe", matricule_fiscal: "",
  registre_commerce: "", email: "", telephone: "", adresse: "", ville: "",
  code_postal: "", pays: "Tunisie", contact_principal: "", contact_email: "",
  contact_telephone: "", notes: "", is_active: true,
};

function ClientsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRow | null>(null);
  const [form, setForm] = useState<ClientForm>(EMPTY_FORM);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("raison_sociale");
      if (error) throw error;
      return data as ClientRow[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (input: ClientForm) => {
      const parsed = clientSchema.parse(input);
      const payload = { ...parsed, email: parsed.email || null, contact_email: parsed.contact_email || null };
      if (editing) {
        const { error } = await supabase.from("clients").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Client mis à jour" : "Client créé");
      qc.invalidateQueries({ queryKey: ["clients"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async (c: ClientRow) => {
      const { error } = await supabase.from("clients").update({ is_active: !c.is_active }).eq("id", c.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (c: ClientRow) => { setEditing(c); setForm({ ...EMPTY_FORM, ...c }); setDialogOpen(true); };

  const columns: Column<ClientRow>[] = [
    { key: "raison_sociale", header: "Raison sociale", cell: (r) => <span className="font-medium">{r.raison_sociale}</span> },
    { key: "code", header: "Code", cell: (r) => <span className="text-numeric text-muted-foreground">{r.code || "—"}</span> },
    { key: "matricule_fiscal", header: "MF", cell: (r) => <span className="text-numeric text-muted-foreground">{r.matricule_fiscal || "—"}</span> },
    { key: "ville", header: "Ville", cell: (r) => r.ville || "—" },
    { key: "email", header: "Email", cell: (r) => <span className="text-muted-foreground">{r.email || "—"}</span> },
    { key: "telephone", header: "Téléphone", cell: (r) => <span className="text-numeric text-muted-foreground">{r.telephone || "—"}</span> },
    { key: "is_active", header: "Statut", align: "center", cell: (r) => <StatusBadge label={r.is_active ? "Actif" : "Inactif"} tone={r.is_active ? "success" : "neutral"} /> },
    {
      key: "actions", header: "", align: "right", sortable: false, width: "90px",
      cell: (r) => (
        <div className="flex justify-end gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(r); }} title="Modifier">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); toggleActive.mutate(r); }} title={r.is_active ? "Désactiver" : "Activer"}>
            <Power className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Référentiel des clients du laboratoire."
        badge={<StatusBadge label={`${clients.length}`} tone="info" dot={false} />}
        actions={<Button size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Nouveau client</Button>}
      />

      <div className="p-4">
        <DataTable
          data={clients}
          columns={columns}
          loading={isLoading}
          rowKey={(r) => r.id}
          searchableKeys={["raison_sociale", "code", "email", "ville", "matricule_fiscal", "telephone"]}
          searchPlaceholder="Rechercher (nom, code, email, ville, MF…)"
          exportFilename="clients"
          emptyMessage="Aucun client. Cliquez sur « Nouveau client » pour démarrer."
          onRowClick={openEdit}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier client" : "Nouveau client"}</DialogTitle>
            <DialogDescription>Identification, adresse et contact principal.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}>
            <div className="space-y-2 md:col-span-2">
              <Label>Raison sociale *</Label>
              <Input required value={form.raison_sociale} onChange={(e) => setForm({ ...form, raison_sociale: e.target.value })} />
            </div>
            <div className="space-y-2"><Label>Code interne</Label><Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div className="space-y-2"><Label>Matricule fiscal</Label><Input value={form.matricule_fiscal ?? ""} onChange={(e) => setForm({ ...form, matricule_fiscal: e.target.value })} /></div>
            <div className="space-y-2"><Label>Registre de commerce</Label><Input value={form.registre_commerce ?? ""} onChange={(e) => setForm({ ...form, registre_commerce: e.target.value })} /></div>
            <div className="space-y-2"><Label>Type</Label><Input value={form.type_client ?? ""} onChange={(e) => setForm({ ...form, type_client: e.target.value })} placeholder="societe / particulier / public" /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Téléphone</Label><Input value={form.telephone ?? ""} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Adresse</Label><Textarea rows={2} value={form.adresse ?? ""} onChange={(e) => setForm({ ...form, adresse: e.target.value })} /></div>
            <div className="space-y-2"><Label>Ville</Label><Input value={form.ville ?? ""} onChange={(e) => setForm({ ...form, ville: e.target.value })} /></div>
            <div className="space-y-2"><Label>Code postal</Label><Input value={form.code_postal ?? ""} onChange={(e) => setForm({ ...form, code_postal: e.target.value })} /></div>
            <div className="space-y-2"><Label>Pays</Label><Input value={form.pays ?? ""} onChange={(e) => setForm({ ...form, pays: e.target.value })} /></div>
            <div className="space-y-2 md:col-span-2 border-t pt-3"><Label className="text-xs text-muted-foreground">Contact principal</Label></div>
            <div className="space-y-2"><Label>Nom contact</Label><Input value={form.contact_principal ?? ""} onChange={(e) => setForm({ ...form, contact_principal: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email contact</Label><Input type="email" value={form.contact_email ?? ""} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Téléphone contact</Label><Input value={form.contact_telephone ?? ""} onChange={(e) => setForm({ ...form, contact_telephone: e.target.value })} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Notes internes</Label><Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <span className="text-sm">Client actif</span>
            </div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
