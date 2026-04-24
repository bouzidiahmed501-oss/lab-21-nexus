import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/lab/ModuleStub";

export const Route = createFileRoute("/_authenticated/rh")({
  head: () => ({ meta: [{ title: "RH & Paie — BALIMS" }] }),
  component: () => (
    <ModuleStub
      title="Ressources humaines & Paie"
      description="Employés, congés, pointage, paie Tunisie (CNSS/IRPP) et bulletins."
      phase="Livraison 8"
    />
  ),
});
