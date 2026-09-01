import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface WorkflowStep {
  /** Identifiant technique de l'étape */
  key: string;
  /** Libellé affiché */
  label: string;
  /** Lien optionnel vers le module correspondant */
  to?: string;
}

/** Chaîne commerciale + technique standard du LIMS. */
export const LIMS_WORKFLOW: WorkflowStep[] = [
  { key: "devis", label: "Devis", to: "/devis" },
  { key: "bon_commande", label: "Bon de commande", to: "/bons-commande" },
  { key: "mission", label: "Mission", to: "/missions" },
  { key: "prelevement", label: "Prélèvement", to: "/prelevements" },
  { key: "reception", label: "Réception", to: "/reception-scan" },
  { key: "analyse", label: "Analyse", to: "/paillasse" },
  { key: "validation", label: "Validation", to: "/validations" },
  { key: "rapport", label: "Rapport", to: "/rapports" },
  { key: "facture", label: "Facture", to: "/facturation" },
];

interface WorkflowTrailProps {
  /** Étape courante (clé dans `steps`) */
  current: string;
  /** Étapes du fil (par défaut le workflow LIMS complet) */
  steps?: WorkflowStep[];
  /** Action « étape suivante » : bouton personnalisé */
  onNext?: () => void;
  nextLabel?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Fil d'Ariane métier : montre où se situe la fiche courante dans le
 * workflow global et propose l'accès direct à l'étape suivante.
 */
export function WorkflowTrail({
  current,
  steps = LIMS_WORKFLOW,
  onNext,
  nextLabel,
  className,
  compact = false,
}: WorkflowTrailProps) {
  const idx = steps.findIndex((s) => s.key === current);
  const next = idx >= 0 && idx < steps.length - 1 ? steps[idx + 1] : null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-1 gap-y-1 rounded-md border border-border bg-muted/30 px-2 py-1.5",
        className,
      )}
    >
      {steps.map((s, i) => {
        const done = idx >= 0 && i < idx;
        const active = i === idx;
        if (compact && !active && !done && i > idx + 1) return null;
        const content = (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
              active && "bg-primary text-primary-foreground",
              done && "text-success",
              !active && !done && "text-muted-foreground",
            )}
          >
            {done && <Check className="h-3 w-3" />}
            {s.label}
          </span>
        );
        return (
          <span key={s.key} className="inline-flex items-center">
            {s.to && !active ? (
              <Link to={s.to} className="hover:underline">
                {content}
              </Link>
            ) : (
              content
            )}
            {i < steps.length - 1 && (
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
            )}
          </span>
        );
      })}

      {next && (
        <div className="ml-auto">
          {onNext ? (
            <Button size="sm" className="h-7 gap-1 text-xs" onClick={onNext}>
              {nextLabel ?? `Étape suivante : ${next.label}`}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : next.to ? (
            <Button size="sm" variant="outline" asChild className="h-7 gap-1 text-xs">
              <Link to={next.to}>
                {nextLabel ?? `Étape suivante : ${next.label}`}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
