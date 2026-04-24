import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "./bons-commande";

export const Route = createFileRoute("/_authenticated/analyses")({
  head: () => ({ meta: [{ title: "Analyses — BALIMS" }] }),
  component: () => (
    <ModuleStub
      title="Analyses"
      description="Saisie des résultats, validation hiérarchique et méthodes."
      phase="Livraison 3"
    />
  ),
});
