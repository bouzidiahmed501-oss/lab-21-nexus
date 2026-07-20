import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: { label: string; to?: string }[];
  badge?: ReactNode;
  /** Path to navigate back to. When provided, a back button is shown. */
  backTo?: string;
  /** Label for the back button (default: "Retour"). */
  backLabel?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  badge,
  backTo,
  backLabel = "Retour",
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-border bg-card px-6 py-3 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        {backTo && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link to={backTo}>
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{backLabel}</span>
            </Link>
          </Button>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
