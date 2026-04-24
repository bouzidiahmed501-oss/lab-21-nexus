import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "./bons-commande";

export const Route = createFileRoute("/_authenticated/rapports")({
  head: () => ({ meta: [{ title: "Rapports — LAB 21" }] }),
  component: () => (
    <ModuleStub
      title="Rapports d'essai"
      description="Génération PDF, signature électronique et envoi aux clients."
      phase="Livraison 3"
    />
  ),
});
