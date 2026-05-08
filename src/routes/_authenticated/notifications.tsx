import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell, Check, CheckCheck, Loader2, Filter, Trash2, AlertTriangle,
  Info, CheckCircle2, XCircle, Settings2, Volume2, VolumeX,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { StatusBadge } from "@/components/lab/StatusBadge";
import { EmptyState } from "@/components/lab/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — BALIMS" }] }),
  component: NotificationsPage,
});

interface Notification {
  id: string;
  title: string;
  message: string | null;
  level: string;
  category: string | null;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

const LEVEL_ICON = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
} as const;

const LEVEL_COLORS = {
  info: "text-blue-600 bg-blue-500/10 border-blue-500/30",
  success: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30",
  warning: "text-amber-600 bg-amber-500/15 border-amber-500/40",
  error: "text-red-600 bg-red-500/10 border-red-500/30",
} as const;

const CATEGORIES = [
  { value: "all", label: "Toutes catégories" },
  { value: "bc", label: "Bons de commande" },
  { value: "analyse", label: "Analyses" },
  { value: "rapport", label: "Rapports" },
  { value: "facture", label: "Facturation" },
  { value: "equipement", label: "Équipements" },
  { value: "qualite", label: "Qualité" },
  { value: "rh", label: "RH" },
  { value: "system", label: "Système" },
];

function NotificationsPage() {
  const qc = useQueryClient();
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tab, setTab] = useState("all");
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as Notification[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("notifications-live")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
      }, () => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
        if (soundEnabled) {
          try { new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU").play(); } catch {}
        }
        toast.info("Nouvelle notification reçue");
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc, soundEnabled]);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (tab === "unread" && n.is_read) return false;
      if (tab === "read" && !n.is_read) return false;
      if (levelFilter !== "all" && n.level !== levelFilter) return false;
      if (categoryFilter !== "all" && n.category !== categoryFilter) return false;
      return true;
    });
  }, [notifications, levelFilter, categoryFilter, tab]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const todayCount = notifications.filter((n) => {
    const d = new Date(n.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Toutes les notifications marquées comme lues");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteNotif = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notification supprimée");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteAllRead = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .eq("is_read", true);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notifications lues supprimées");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const levelStats = useMemo(() => {
    const s = { info: 0, success: 0, warning: 0, error: 0 };
    notifications.forEach((n) => { if (n.level in s) s[n.level as keyof typeof s]++; });
    return s;
  }, [notifications]);

  return (
    <div>
      <PageHeader
        title="Centre de notifications"
        description="Alertes, rappels et messages du système en temps réel."
        badge={unreadCount > 0 ? <StatusBadge label={`${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`} tone="warning" /> : undefined}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPrefsOpen(true)}>
              <Settings2 className="h-3.5 w-3.5" /> Préférences
            </Button>
            <Button size="sm" variant="outline" onClick={() => markAllRead.mutate()} disabled={unreadCount === 0 || markAllRead.isPending}>
              <CheckCheck className="h-3.5 w-3.5" /> Tout marquer lu
            </Button>
          </div>
        }
      />

      <div className="space-y-4 p-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{notifications.length}</p><p className="text-[10px] text-muted-foreground">Total</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-amber-600">{unreadCount}</p><p className="text-[10px] text-muted-foreground">Non lues</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-blue-600">{todayCount}</p><p className="text-[10px] text-muted-foreground">Aujourd'hui</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-red-600">{levelStats.error}</p><p className="text-[10px] text-muted-foreground">Erreurs</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-amber-500">{levelStats.warning}</p><p className="text-[10px] text-muted-foreground">Avertissements</p></CardContent></Card>
        </div>

        {/* Tabs & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="unread">Non lues ({unreadCount})</TabsTrigger>
              <TabsTrigger value="read">Lues</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <Filter className="h-3 w-3 mr-1" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous niveaux</SelectItem>
              <SelectItem value="info">Information</SelectItem>
              <SelectItem value="success">Succès</SelectItem>
              <SelectItem value="warning">Avertissement</SelectItem>
              <SelectItem value="error">Erreur</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </span>
          {tab === "read" && (
            <Button size="sm" variant="destructive" onClick={() => deleteAllRead.mutate()} disabled={deleteAllRead.isPending}>
              <Trash2 className="h-3 w-3" /> Purger lues
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Aucune notification"
            description="Vous serez notifié des événements importants : analyses terminées, maintenances urgentes, factures impayées…"
          />
        ) : (
          <div className="space-y-1">
            {filtered.map((n) => {
              const level = (n.level as keyof typeof LEVEL_ICON) || "info";
              const Icon = LEVEL_ICON[level] || Info;
              const colors = LEVEL_COLORS[level] || LEVEL_COLORS.info;

              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 rounded-md border px-4 py-3 transition-colors group",
                    n.is_read
                      ? "border-border/40 bg-card/50 opacity-70"
                      : "border-border bg-card shadow-sm",
                  )}
                >
                  <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border", colors)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm font-medium leading-tight", n.is_read && "font-normal")}>
                          {n.title}
                        </p>
                        {n.category && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1">
                            {n.category}
                          </Badge>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                        {formatDateTime(n.created_at)}
                      </span>
                    </div>
                    {n.message && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {n.message}
                      </p>
                    )}
                    {n.link && (
                      <a href={n.link} className="mt-1 inline-block text-xs text-primary hover:underline">
                        Voir les détails →
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.is_read && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markRead.mutate(n.id)} title="Marquer comme lu">
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteNotif.mutate(n.id)} title="Supprimer">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preferences dialog */}
      <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Préférences de notification</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                <Label>Son de notification</Label>
              </div>
              <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
            </div>
            <div className="rounded-md border p-3 space-y-2">
              <p className="text-sm font-medium">Types de notifications</p>
              <p className="text-xs text-muted-foreground">Les notifications sont générées automatiquement par le système pour :</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>Réception de bons de commande</li>
                <li>Résultats d'analyses disponibles</li>
                <li>Rapports prêts à diffuser</li>
                <li>Factures impayées (J+30)</li>
                <li>Maintenances & étalonnages urgents</li>
                <li>Non-conformités critiques</li>
                <li>Alertes qualité (CAPA en retard)</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setPrefsOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
