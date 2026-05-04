import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Loader2, Filter, Trash2, AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/lab/PageHeader";
import { StatusBadge } from "@/components/lab/StatusBadge";
import { EmptyState } from "@/components/lab/EmptyState";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  info: "text-info bg-info/10 border-info/30",
  success: "text-success bg-success/10 border-success/30",
  warning: "text-warning bg-warning/15 border-warning/40",
  error: "text-destructive bg-destructive/10 border-destructive/30",
} as const;

function NotificationsPage() {
  const qc = useQueryClient();
  const [levelFilter, setLevelFilter] = useState<string>("all");

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
        .limit(200);
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
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const filtered = useMemo(() => {
    if (levelFilter === "all") return notifications;
    return notifications.filter((n) => n.level === levelFilter);
  }, [notifications, levelFilter]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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

  return (
    <div>
      <PageHeader
        title="Centre de notifications"
        description="Alertes, rappels et messages du système en temps réel."
        badge={unreadCount > 0 ? <StatusBadge label={`${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`} tone="warning" /> : undefined}
        actions={
          <Button size="sm" variant="outline" onClick={() => markAllRead.mutate()} disabled={unreadCount === 0 || markAllRead.isPending}>
            <CheckCheck className="h-3.5 w-3.5" /> Tout marquer lu
          </Button>
        }
      />

      <div className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les niveaux</SelectItem>
              <SelectItem value="info">Information</SelectItem>
              <SelectItem value="success">Succès</SelectItem>
              <SelectItem value="warning">Avertissement</SelectItem>
              <SelectItem value="error">Erreur</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
          </span>
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
                    "flex items-start gap-3 rounded-md border px-4 py-3 transition-colors",
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
                      <p className={cn("text-sm font-medium leading-tight", n.is_read && "font-normal")}>
                        {n.title}
                      </p>
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
                      <a
                        href={n.link}
                        className="mt-1 inline-block text-xs text-primary hover:underline"
                      >
                        Voir les détails →
                      </a>
                    )}
                  </div>

                  {!n.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => markRead.mutate(n.id)}
                      title="Marquer comme lu"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
