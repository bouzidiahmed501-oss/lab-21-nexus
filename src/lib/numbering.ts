import { supabase } from "@/integrations/supabase/client";

/**
 * Generate next document number using server-side sequence.
 * Codes: BC, MIS, PRL, FR, ANA, RAP, FAC
 */
export async function nextNumero(code: string): Promise<string> {
  const { data, error } = await supabase.rpc("next_numero" as never, { _code: code } as never);
  if (error) throw error;
  return data as unknown as string;
}
