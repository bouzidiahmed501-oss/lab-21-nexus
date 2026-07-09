import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  FlaskConical,
  Microscope,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
  Workflow,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Radio,
  ScanLine,
} from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "BALIMS — Le LIMS nouvelle génération pour laboratoires" },
      {
        name: "description",
        content:
          "Découvrez BALIMS, la plateforme LIMS tout-en-un : prélèvements, analyses, rapports ISO 17025, facturation, IoT et portail client. Alternative moderne à LabWare et LabWave.",
      },
      { property: "og:title", content: "BALIMS — LIMS nouvelle génération" },
      {
        property: "og:description",
        content: "La plateforme LIMS moderne, complète et conforme ISO 17025.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 2600);
    return () => clearInterval(i);
  }, []);

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden text-white"
      style={{
        fontFamily: "var(--font-sans)",
        background:
          "radial-gradient(1200px 800px at 85% -10%, rgba(92,189,185,0.18), transparent 60%), radial-gradient(900px 700px at -10% 20%, rgba(45,138,158,0.22), transparent 55%), linear-gradient(180deg, #071628 0%, #0c2340 45%, #0a1c33 100%)",
      }}
    >
      {/* Grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#5cbdb9] to-[#2d8a9e] shadow-[0_0_40px_-8px_rgba(92,189,185,0.6)]">
            <FlaskConical className="h-5 w-5 text-[#0c2340]" />
            <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          </div>
          <div className="leading-tight">
            <div style={{ fontFamily: "var(--font-display)" }} className="text-lg font-bold tracking-tight">
              BALIMS
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#5cbdb9]/80">LIMS Platform</div>
          </div>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a href="#modules" className="transition-colors hover:text-white">Modules</a>
          <a href="#workflow" className="transition-colors hover:text-white">Workflow</a>
          <a href="#stats" className="transition-colors hover:text-white">Preuves</a>
        </nav>
        <Link
          to="/login"
          className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium backdrop-blur transition-all hover:border-[#5cbdb9]/60 hover:bg-[#5cbdb9]/10"
        >
          Se connecter
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-8 pb-14">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#5cbdb9]/25 bg-[#5cbdb9]/10 px-3 py-1 text-xs text-[#5cbdb9]">
          <Sparkles className="h-3.5 w-3.5" />
          Alternative moderne à LabWare · LabWave · SampleManager
        </div>
        <h1
          style={{ fontFamily: "var(--font-display)" }}
          className="max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
        >
          Votre laboratoire,
          <br />
          <span className="bg-gradient-to-r from-[#5cbdb9] via-[#89e0dd] to-white bg-clip-text text-transparent">
            orchestré au millimètre.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/70">
          Un seul système pour piloter la chaîne complète du laboratoire : de la demande client jusqu'au
          rapport signé — traçable, conforme ISO 17025, et branché à vos sondes IoT.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/login"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#5cbdb9] to-[#2d8a9e] px-6 py-3 text-sm font-semibold text-[#0c2340] shadow-[0_20px_60px_-15px_rgba(92,189,185,0.6)] transition-transform hover:scale-[1.02]"
          >
            <span className="relative z-10">Démarrer maintenant</span>
            <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
            <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-700 group-hover:translate-x-full" />
          </Link>
          <a
            href="#modules"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            Explorer les modules
          </a>
        </div>
      </section>

      {/* BENTO GRID */}
      <section id="modules" className="relative z-10 mx-auto max-w-7xl px-6 pb-16">
        <div className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 md:grid-cols-6">
          {/* Live workflow — hero card */}
          <div className="group relative col-span-1 row-span-2 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f2d4a]/80 to-[#0c2340]/80 p-6 backdrop-blur md:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#5cbdb9]/15 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-[#5cbdb9]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5cbdb9] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#5cbdb9]" />
                </span>
                Workflow live
              </span>
              <Workflow className="h-5 w-5 text-white/40" />
            </div>
            <h3 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-semibold">
              De la demande au rapport signé
            </h3>
            <p className="mt-2 text-sm text-white/60">
              Chaque étape est tracée, horodatée et validée. Zéro Excel, zéro papier perdu.
            </p>

            <div className="mt-6 space-y-2">
              {[
                { label: "Devis validé", role: "Commercial" },
                { label: "Bon de commande", role: "Client" },
                { label: "Mission planifiée", role: "Chef labo" },
                { label: "Prélèvement scanné", role: "Préleveur" },
                { label: "Analyses réalisées", role: "Technicien" },
                { label: "Rapport ISO signé", role: "Qualité" },
              ].map((s, i) => {
                const active = i === tick % 6;
                const done = i < tick % 6;
                return (
                  <div
                    key={s.label}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition-all duration-500 ${
                      active
                        ? "border-[#5cbdb9]/60 bg-[#5cbdb9]/10 shadow-[0_0_30px_-10px_rgba(92,189,185,0.6)]"
                        : done
                          ? "border-white/5 bg-white/[0.02] opacity-60"
                          : "border-white/5 bg-white/[0.02]"
                    }`}
                  >
                    <div
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-colors ${
                        done || active
                          ? "bg-[#5cbdb9] text-[#0c2340]"
                          : "bg-white/10 text-white/50"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{s.label}</div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40">{s.role}</div>
                    </div>
                    {active && <Zap className="h-4 w-4 shrink-0 text-[#5cbdb9]" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Analyses en direct */}
          <div className="group relative col-span-1 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a4a6e]/50 to-[#0c2340]/60 p-6 backdrop-blur md:col-span-3">
            <div className="mb-3 flex items-center gap-2">
              <Microscope className="h-5 w-5 text-[#5cbdb9]" />
              <h3 style={{ fontFamily: "var(--font-display)" }} className="text-lg font-semibold">
                Résultats en direct
              </h3>
            </div>
            <p className="text-sm text-white/60">
              Saisie avec seuils par région, conformité calculée en temps réel.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { p: "pH", v: "7.42", ok: true },
                { p: "Turbidité", v: "1.8 NTU", ok: true },
                { p: "E. coli", v: "0 UFC", ok: true },
                { p: "Nitrates", v: "48 mg/L", ok: false },
                { p: "Cl", v: "0.6 mg/L", ok: true },
                { p: "Fer", v: "0.09", ok: true },
              ].map((r) => (
                <div
                  key={r.p}
                  className={`rounded-xl border px-3 py-2 ${
                    r.ok
                      ? "border-emerald-400/20 bg-emerald-400/5"
                      : "border-amber-400/30 bg-amber-400/5"
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-white/50">{r.p}</div>
                  <div
                    style={{ fontFamily: "var(--font-display)" }}
                    className={`mt-0.5 text-sm font-semibold ${r.ok ? "text-emerald-300" : "text-amber-300"}`}
                  >
                    {r.v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ISO 17025 */}
          <div className="relative col-span-1 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#5cbdb9]/15 to-transparent p-6 backdrop-blur md:col-span-2">
            <ShieldCheck className="mb-3 h-6 w-6 text-[#5cbdb9]" />
            <h3 style={{ fontFamily: "var(--font-display)" }} className="text-lg font-semibold">
              ISO 17025
            </h3>
            <p className="mt-1 text-sm text-white/60">
              CAPA, non-conformités, audits, GED, revues de direction — le référentiel qualité intégré.
            </p>
            <div className="mt-4 flex -space-x-2">
              {["CAPA", "NC", "GED", "Audit"].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/20 bg-[#0c2340]/80 px-2.5 py-1 text-[10px] font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Sondes IoT — animated wave */}
          <div className="relative col-span-1 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c2340]/80 to-[#1a4a6e]/40 p-6 backdrop-blur md:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <Radio className="h-5 w-5 text-[#5cbdb9]" />
              <span className="text-[10px] uppercase tracking-wider text-emerald-300">● Live</span>
            </div>
            <h3 style={{ fontFamily: "var(--font-display)" }} className="text-lg font-semibold">
              Sondes IoT
            </h3>
            <p className="mt-1 text-sm text-white/60">Ingestion continue, alertes temps réel.</p>
            <svg viewBox="0 0 200 60" className="mt-3 h-14 w-full">
              <defs>
                <linearGradient id="wave" x1="0" x2="1">
                  <stop offset="0%" stopColor="#5cbdb9" stopOpacity="0" />
                  <stop offset="50%" stopColor="#5cbdb9" stopOpacity="1" />
                  <stop offset="100%" stopColor="#5cbdb9" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,30 Q25,10 50,30 T100,30 T150,30 T200,30"
                fill="none"
                stroke="url(#wave)"
                strokeWidth="2"
              />
              <path
                d="M0,35 Q25,25 50,35 T100,35 T150,35 T200,35"
                fill="none"
                stroke="#5cbdb9"
                strokeOpacity="0.3"
                strokeWidth="1"
              />
            </svg>
          </div>

          {/* Facturation */}
          <div className="relative col-span-1 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a4a6e]/60 to-[#0c2340]/60 p-6 backdrop-blur md:col-span-2">
            <BarChart3 className="mb-3 h-6 w-6 text-[#5cbdb9]" />
            <h3 style={{ fontFamily: "var(--font-display)" }} className="text-lg font-semibold">
              Facturation TN
            </h3>
            <p className="mt-1 text-sm text-white/60">
              Facture · Avoir · Règlement · El Fatoora · Recouvrement — natif Tunisie.
            </p>
            <div className="mt-4 flex items-end gap-1">
              {[35, 55, 42, 78, 60, 92, 71].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-[#5cbdb9]/20 to-[#5cbdb9]"
                  style={{ height: `${h}%`, minHeight: 12 }}
                />
              ))}
            </div>
          </div>

          {/* Scan */}
          <div className="relative col-span-1 overflow-hidden rounded-3xl border border-white/10 bg-[#0c2340]/60 p-6 backdrop-blur md:col-span-2">
            <ScanLine className="mb-3 h-6 w-6 text-[#5cbdb9]" />
            <h3 style={{ fontFamily: "var(--font-display)" }} className="text-lg font-semibold">
              Scan & étiquettes
            </h3>
            <p className="mt-1 text-sm text-white/60">Codes-barres + QR sur chaque échantillon.</p>
            <div className="mt-4 grid grid-cols-6 gap-0.5">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="h-6 rounded-sm bg-white/70"
                  style={{ opacity: [0.15, 0.4, 0.9, 0.6, 0.3, 1][i % 6] }}
                />
              ))}
            </div>
          </div>

          {/* Modules count */}
          <div className="relative col-span-1 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#5cbdb9]/20 via-[#2d8a9e]/10 to-transparent p-6 backdrop-blur md:col-span-2">
            <ClipboardCheck className="mb-3 h-6 w-6 text-[#5cbdb9]" />
            <div style={{ fontFamily: "var(--font-display)" }} className="text-5xl font-bold">
              30<span className="text-[#5cbdb9]">+</span>
            </div>
            <p className="mt-1 text-sm text-white/60">
              Modules connectés : commercial, terrain, labo, qualité, RH, comptabilité.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow horizontal */}
      <section id="workflow" className="relative z-10 mx-auto max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-white/10 bg-[#0c2340]/50 p-8 backdrop-blur">
          <h2 style={{ fontFamily: "var(--font-display)" }} className="text-3xl font-semibold">
            Un seul fil conducteur.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Aucun ressaisi. La donnée circule d'un module à l'autre — de la commande client jusqu'au règlement.
          </p>

          <div className="relative mt-8">
            <div className="absolute left-0 right-0 top-6 h-px bg-gradient-to-r from-transparent via-[#5cbdb9]/40 to-transparent" />
            <div className="relative grid grid-cols-2 gap-6 md:grid-cols-6">
              {[
                { n: "01", t: "Client" },
                { n: "02", t: "Devis / BC" },
                { n: "03", t: "Prélèvement" },
                { n: "04", t: "Analyse" },
                { n: "05", t: "Rapport" },
                { n: "06", t: "Facture" },
              ].map((s) => (
                <div key={s.n} className="text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[#5cbdb9]/40 bg-[#0c2340] text-xs font-bold text-[#5cbdb9]">
                    {s.n}
                  </div>
                  <div className="mt-3 text-sm font-medium">{s.t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { k: "ISO 17025", v: "Conforme" },
            { k: "Modules", v: "30+" },
            { k: "Rapports métier", v: "8" },
            { k: "Traçabilité", v: "100%" },
          ].map((s) => (
            <div key={s.k} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur">
              <div style={{ fontFamily: "var(--font-display)" }} className="text-3xl font-bold text-[#5cbdb9]">
                {s.v}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-white/50">{s.k}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-24 text-center">
        <h2 style={{ fontFamily: "var(--font-display)" }} className="text-4xl font-semibold sm:text-5xl">
          Prêt à moderniser votre laboratoire ?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/60">
          Connectez-vous et démarrez avec votre premier bon de commande en moins de 5 minutes.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#5cbdb9] to-[#2d8a9e] px-8 py-4 text-base font-semibold text-[#0c2340] shadow-[0_20px_60px_-15px_rgba(92,189,185,0.7)] transition-transform hover:scale-[1.03]"
        >
          Accéder à BALIMS
          <ArrowRight className="h-5 w-5" />
        </Link>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-6 py-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} BALIMS — Laboratory Information Management System
      </footer>
    </div>
  );
}
