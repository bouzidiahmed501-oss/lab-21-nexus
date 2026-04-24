import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "./bons-commande";

export const Route = createFileRoute("/_authenticated/projets")({
  head: () => ({ meta: [{ title: "Projets — LAB 21" }] }),
  component: () => (
    <ModuleStub
      title="Projets"
      description="Projets internes, tâches, jalons, ressources et budget."
      phase="Livraison 9"
    />
  ),
});
