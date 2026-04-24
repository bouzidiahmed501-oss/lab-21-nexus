import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/lab/ModuleStub";

export const Route = createFileRoute("/_authenticated/projets")({
  head: () => ({ meta: [{ title: "Projets — BALIMS" }] }),
  component: () => (
    <ModuleStub
      title="Projets"
      description="Projets internes, tâches, jalons, ressources et budget."
      phase="Livraison 9"
    />
  ),
});
