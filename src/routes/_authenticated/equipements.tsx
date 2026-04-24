import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "./bons-commande";

export const Route = createFileRoute("/_authenticated/equipements")({
  head: () => ({ meta: [{ title: "Équipements — BALIMS" }] }),
  component: () => (
    <ModuleStub
      title="Suivi équipements"
      description="Inventaire, étalonnage, maintenance préventive et certificats (style LabGuard)."
      phase="Livraison 7"
    />
  ),
});
