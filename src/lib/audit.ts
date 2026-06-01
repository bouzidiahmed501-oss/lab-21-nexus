import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "validate"
  | "archive"
  | "login"
  | "logout"
  | "export"
  | "import"
  | "generate_pdf"
  | "send_email"
  | "status_change";

interface AuditEntry {
  action: AuditAction | string;
  entity_type: string;
  entity_id?: string | null;
  details?: Record<string, unknown>;
}

/**
 * Fire-and-forget audit log writer. Never throws — failures are silently logged.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("audit_log" as never).insert({
      user_id: user.id,
      user_email: user.email ?? null,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      details: entry.details ?? {},
    } as never);
  } catch (err) {
    console.warn("[audit] failed", err);
  }
}
