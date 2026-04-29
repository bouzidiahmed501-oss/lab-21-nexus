import { cn } from "@/lib/utils";

export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "destructive"
  | "primary";

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  dot?: boolean;
  className?: string;
}

const TONE: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-info/10 text-info border-info/30",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/15 text-warning-foreground border-warning/40",
  destructive: "bg-destructive/10 text-destructive border-destructive/30",
  primary: "bg-primary/10 text-primary border-primary/30",
};

const DOT: Record<StatusTone, string> = {
  neutral: "bg-muted-foreground",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  primary: "bg-primary",
};

export function StatusBadge({ label, tone = "neutral", dot = true, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        TONE[tone],
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", DOT[tone])} />}
      {label}
    </span>
  );
}

/** Mappings standards des statuts BALIMS */
export function statutTone(statut: string | null | undefined): StatusTone {
  if (!statut) return "neutral";
  const s = statut.toLowerCase();
  if (["valide", "validee", "valide", "termine", "terminee", "cloturee", "conforme", "approuve", "paye", "paid", "actif", "active", "efficace"].includes(s)) return "success";
  if (["en_cours", "en_attente", "planifie", "planifiee", "demande", "a_faire", "brouillon", "preventive"].includes(s)) return "info";
  if (["en_retard", "anomalie", "majeure", "non_conforme", "refuse", "annulee", "rejete", "impaye", "critique"].includes(s)) return "destructive";
  if (["partiel", "partielle", "mineure", "observation", "a_verifier", "alerte"].includes(s)) return "warning";
  return "neutral";
}
