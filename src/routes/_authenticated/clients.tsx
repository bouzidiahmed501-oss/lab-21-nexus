import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "./bons-commande";

export const Route = createFileRoute("/_authenticated/clients")({
  head: () => ({ meta: [{ title: "Clients — BALIMS" }] }),
  component: () => (
    <ModuleStub
      title="Clients"
      description="Référentiel clients : identification, contacts, contrats et tarifs."
      phase="Livraison 2"
    />
  ),
});
