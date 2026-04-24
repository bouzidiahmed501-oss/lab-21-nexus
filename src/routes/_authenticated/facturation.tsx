import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "./bons-commande";

export const Route = createFileRoute("/_authenticated/facturation")({
  head: () => ({ meta: [{ title: "Facturation — BALIMS" }] }),
  component: () => (
    <ModuleStub
      title="Facturation & Elfatoora"
      description="Factures, avoirs, situations clients et export XML Elfatoora 2026."
      phase="Livraison 4"
    />
  ),
});
