import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: "light" | "dark";
}

export function Logo({ className, showText = true, variant = "dark" }: LogoProps) {
  const textColor = variant === "light" ? "text-sidebar-foreground" : "text-foreground";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-md">
        <FlaskConical className="h-5 w-5 text-primary-foreground" />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={cn("text-base font-bold tracking-tight", textColor)}>LAB 21</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            LIMS 2026
          </span>
        </div>
      )}
    </div>
  );
}
