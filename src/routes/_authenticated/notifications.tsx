import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "./bons-commande";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — LAB 21" }] }),
  component: () => (
    <ModuleStub
      title="Centre de notifications"
      description="Toutes vos alertes et messages temps réel."
      phase="Livraison 6"
    />
  ),
});
