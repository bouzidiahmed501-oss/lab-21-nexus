import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "./bons-commande";

export const Route = createFileRoute("/_authenticated/rh")({
  head: () => ({ meta: [{ title: "RH & Paie — LAB 21" }] }),
  component: () => (
    <ModuleStub
      title="Ressources humaines & Paie"
      description="Employés, congés, pointage, paie Tunisie (CNSS/IRPP) et bulletins."
      phase="Livraison 8"
    />
  ),
});
