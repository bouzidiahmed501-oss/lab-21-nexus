import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardList,
  FlaskConical,
  Receipt,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [{ title: "Tableau de bord — BALIMS" }],
  }),
  component: DashboardPage,
});

interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "warning" | "success" | "primary";
}

function KpiCard({ label, value, delta, icon: Icon, tone = "default" }: KpiCardProps) {
  const toneClasses = {
    default: "bg-card text-card-foreground",
    primary: "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground",
    warning: "bg-warning/10 text-foreground border-warning/30",
    success: "bg-success/10 text-foreground border-success/30",
  }[tone];

  const iconClasses = {
    default: "bg-secondary text-primary",
    primary: "bg-white/15 text-primary-foreground",
    warning: "bg-warning/20 text-warning",
    success: "bg-success/20 text-success",
  }[tone];

  return (
    <Card className={toneClasses}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${iconClasses}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-medium uppercase tracking-wide ${tone === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
            {label}
          </p>
          <p className="mt-0.5 text-2xl font-bold leading-tight">{value}</p>
          {delta && (
            <p className={`text-xs ${tone === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
              {delta}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  // Données placeholders — seront connectées aux vraies tables en livraison 2-3
  return (
    <div className="px-8 py-6">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground">Vue d'ensemble</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Tableau de bord
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bienvenue dans votre plateforme BALIMS.
        </p>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="BC en cours"
          value="—"
          delta="Données après migration"
          icon={ClipboardList}
          tone="primary"
        />
        <KpiCard
          label="Analyses en attente"
          value="—"
          icon={FlaskConical}
        />
        <KpiCard
          label="Factures impayées"
          value="—"
          icon={Receipt}
          tone="warning"
        />
        <KpiCard
          label="CA du mois"
          value="—"
          icon={TrendingUp}
          tone="success"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
              <p className="mt-3 text-sm font-medium text-foreground">
                Système initialisé avec succès
              </p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                Les modules métier seront livrés progressivement. La prochaine étape
                est la mise en place des référentiels (clients, produits, analyses).
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning/5 p-3">
              <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div className="text-xs">
                <p className="font-medium text-foreground">Migration des données</p>
                <p className="mt-0.5 text-muted-foreground">
                  La base existante (113 607 BC) n'a pas encore été importée.
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              Phase 1 — Fondations
            </Badge>
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Accès rapide</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/bons-commande">Nouveau bon de commande</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/analyses">Saisir un résultat</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/clients">Gérer les clients</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
