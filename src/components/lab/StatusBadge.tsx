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

/** Vocabulaire d'états normalisé BALIMS (TRV-40) */
const SUCCESS = ["valide","validee","valides","validees","termine","terminee","cloture","cloturee","conforme","approuve","approuvee","paye","payee","paid","actif","active","efficace","signe","signee","recu","recue","livre","livree","disponible","ok"];
const INFO = ["brouillon","nouveau","nouvelle","en_attente","attente","planifie","planifiee","demande","demandee","a_faire","preventive","enregistre","enregistree","prevu","prevue","soumis","soumise"];
const PROGRESS = ["en_cours","en_analyse","en_traitement","en_preparation","en_validation","partiel","partielle","en_stock_faible"];
const WARNING = ["mineure","observation","a_verifier","alerte","hors_limites","avertissement","bientot_expire","retard_leger","suspendu","suspendue","en_pause"];
const DANGER = ["en_retard","retard","anomalie","majeure","non_conforme","refuse","refusee","annule","annulee","rejete","rejetee","impaye","impayee","critique","expire","expiree","perime","perimee","rupture","hors_service","echec"];

export function statutTone(statut: string | null | undefined): StatusTone {
  if (!statut) return "neutral";
  const s = statut.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (SUCCESS.includes(s)) return "success";
  if (DANGER.includes(s)) return "destructive";
  if (WARNING.includes(s)) return "warning";
  if (PROGRESS.includes(s)) return "primary";
  if (INFO.includes(s)) return "info";
  return "neutral";
}

/** Libellé lisible pour un code d'état (ex. "non_conforme" → "Non conforme"). */
export function statutLabel(statut: string | null | undefined): string {
  if (!statut) return "—";
  const s = statut.replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
