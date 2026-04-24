import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "./bons-commande";

export const Route = createFileRoute("/_authenticated/produits")({
  head: () => ({ meta: [{ title: "Produits — LAB 21" }] }),
  component: () => (
    <ModuleStub
      title="Produits"
      description="Référentiel produits, familles et super-familles."
      phase="Livraison 2"
    />
  ),
});
