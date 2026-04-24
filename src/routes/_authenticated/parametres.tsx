import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "./bons-commande";

export const Route = createFileRoute("/_authenticated/parametres")({
  head: () => ({ meta: [{ title: "Paramètres — LAB 21" }] }),
  component: () => (
    <ModuleStub
      title="Paramètres"
      description="Profil utilisateur, gestion des rôles, préférences et configuration système."
      phase="Livraison 1"
    />
  ),
});
