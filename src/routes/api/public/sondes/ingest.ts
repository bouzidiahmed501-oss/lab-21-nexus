import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PayloadSchema = z.object({
  code_sonde: z.string().min(1).max(64),
  mesure: z.number(),
  mesuree_at: z.string().datetime().optional(),
  batterie_pct: z.number().min(0).max(100).optional(),
  signal_pct: z.number().min(0).max(100).optional(),
  raw: z.unknown().optional(),
});

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const Route = createFileRoute("/api/public/sondes/ingest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("x-api-key");
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "Missing x-api-key" }), { status: 401, headers: { "Content-Type": "application/json" } });
        }

        let body: unknown;
        try { body = await request.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }

        const parsed = PayloadSchema.safeParse(body);
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: "Invalid payload", details: parsed.error.flatten() }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        const p = parsed.data;
        const keyHash = await sha256(apiKey);

        const { data: sonde, error: sErr } = await supabaseAdmin
          .from("sondes")
          .select("id,seuil_min,seuil_max,is_active,unite,code")
          .eq("code", p.code_sonde)
          .eq("api_key_hash", keyHash)
          .maybeSingle();

        if (sErr || !sonde) {
          return new Response(JSON.stringify({ error: "Unauthorized: sonde not found or bad key" }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        if (!sonde.is_active) {
          return new Response(JSON.stringify({ error: "Sonde inactive" }), { status: 403, headers: { "Content-Type": "application/json" } });
        }

        const mesureeAt = p.mesuree_at ?? new Date().toISOString();
        const overHi = sonde.seuil_max !== null && p.mesure > sonde.seuil_max;
        const overLo = sonde.seuil_min !== null && p.mesure < sonde.seuil_min;
        const conformite = !overHi && !overLo;

        const { data: releve, error: rErr } = await supabaseAdmin
          .from("releves_sonde")
          .insert({
            sonde_id: sonde.id,
            mesure: p.mesure,
            mesuree_at: mesureeAt,
            batterie_pct: p.batterie_pct ?? null,
            signal_pct: p.signal_pct ?? null,
            conformite,
            payload: (p.raw ?? null) as never,
          } as never)
          .select("id")
          .single();
        if (rErr) {
          return new Response(JSON.stringify({ error: rErr.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

        // Update last_* on sonde
        await supabaseAdmin
          .from("sondes")
          .update({
            last_releve_at: mesureeAt,
            last_mesure: p.mesure,
            last_batterie: p.batterie_pct ?? null,
          } as never)
          .eq("id", sonde.id);

        // Create alerts
        const alerts: Array<Record<string, unknown>> = [];
        if (overHi) alerts.push({ sonde_id: sonde.id, releve_id: releve.id, type: "hors_seuil_haut", severite: "warning", mesure: p.mesure, message: `Mesure ${p.mesure}${sonde.unite} > seuil max ${sonde.seuil_max}${sonde.unite}` });
        if (overLo) alerts.push({ sonde_id: sonde.id, releve_id: releve.id, type: "hors_seuil_bas", severite: "warning", mesure: p.mesure, message: `Mesure ${p.mesure}${sonde.unite} < seuil min ${sonde.seuil_min}${sonde.unite}` });
        if (p.batterie_pct !== undefined && p.batterie_pct < 15) {
          alerts.push({ sonde_id: sonde.id, releve_id: releve.id, type: "batterie_faible", severite: "info", mesure: p.batterie_pct, message: `Batterie faible : ${p.batterie_pct}%` });
        }
        if (alerts.length) {
          await supabaseAdmin.from("alertes_sonde").insert(alerts as never);
        }

        return new Response(JSON.stringify({ ok: true, releve_id: releve.id, conformite, alerts: alerts.length }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
      OPTIONS: async () => new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-api-key" } }),
    },
  },
});
