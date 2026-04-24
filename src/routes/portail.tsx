import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/lab/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Lock } from "lucide-react";

export const Route = createFileRoute("/portail")({
  head: () => ({
    meta: [
      { title: "Portail client — BALIMS" },
      {
        name: "description",
        content:
          "Portail client BALIMS : suivez vos analyses, téléchargez vos rapports et consultez vos factures en ligne.",
      },
    ],
  }),
  component: PortailLanding,
});

function PortailLanding() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary to-accent/30 px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <Card className="border-border/60 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Portail client</CardTitle>
            <CardDescription>
              Bientôt disponible — suivez vos analyses, téléchargez vos rapports
              et consultez vos factures Elfatoora en ligne.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Le portail client sera livré lors d'une prochaine itération. En attendant,
              contactez votre interlocuteur BALIMS habituel.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/login">
                <ExternalLink className="h-4 w-4" />
                Accès employés
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
