import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  FlaskConical,
  Microscope,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
  Workflow,
  ArrowRight,
  CheckCircle2,
  Radio,
  ScanLine,
  FileText,
  Users,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "BALIMS — Le LIMS SaaS pour laboratoires modernes" },
      {
        name: "description",
        content:
          "BALIMS : la plateforme LIMS SaaS tout-en-un. Prélèvements, analyses, rapports ISO 17025, facturation, IoT et portail client. Alternative moderne à LabWare et LabWave.",
      },
      { property: "og:title", content: "BALIMS — LIMS SaaS moderne" },
      {
        property: "og:description",
        content: "Plateforme LIMS SaaS complète, conforme ISO 17025.",
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
    const i = setInterval(() => setTick((t) => t + 1), 2400);
    return () => clearInterval(i);
  }, []);

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden bg-white text-slate-900"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#0c2340]">
              <FlaskConical className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="leading-tight">
              <div style={{ fontFamily: "var(--font-display)" }} className="text-base font-semibold tracking-tight">
                BALIMS
              </div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500">LIMS Platform</div>
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <a href="#modules" className="transition-colors hover:text-slate-900">Modules</a>
            <a href="#workflow" className="transition-colors hover:text-slate-900">Workflow</a>
            <a href="#stats" className="transition-colors hover:text-slate-900">Preuves</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/portail"
              className="hidden rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline-flex"
            >
              Portail client
            </Link>
            <Link
              to="/login"
              className="hidden rounded-md px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900 sm:inline-flex"
            >
              Se connecter
            </Link>
            <Link
              to="/login"
              className="group inline-flex items-center gap-1.5 rounded-md bg-[#0c2340] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#123057]"
            >
              Démarrer
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-6 pt-20 pb-16">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Alternative moderne à LabWare, LabWave & SampleManager
        </div>
        <h1
          style={{ fontFamily: "var(--font-display)" }}
          className="max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl md:text-6xl"
        >
          Le LIMS SaaS pour laboratoires
          <span className="text-[#2d8a9e]"> qui vont vite.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-600">
          Pilotez toute la chaîne — de la demande client jusqu'au rapport signé. Traçable, conforme ISO 17025,
          connecté à vos sondes IoT.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 rounded-md bg-[#0c2340] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[#123057]"
          >
            Démarrer maintenant
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#modules"
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            Explorer les modules
          </a>
        </div>

        {/* Logos strip */}
        <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs uppercase tracking-wider text-slate-400">
          <span>Conforme ISO 17025</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>El Fatoora TN</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>CNSS / IRPP</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>API IoT LabGuard / Testo</span>
        </div>
      </section>

      {/* Product preview card */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-2 shadow-[0_20px_60px_-30px_rgba(12,35,64,0.25)]">
          <div className="rounded-xl border border-slate-200 bg-white">
            {/* fake toolbar */}
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
              <div className="ml-3 rounded-md bg-slate-50 px-3 py-1 text-[11px] text-slate-500">balims.app / analyses</div>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-3">
              {/* Workflow live */}
              <div className="md:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-[#2d8a9e]" />
                    <span className="text-sm font-medium text-slate-800">Workflow en cours</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                  </span>
                </div>
                <div className="space-y-1.5">
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
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-all duration-500 ${
                          active
                            ? "border-[#2d8a9e]/40 bg-[#2d8a9e]/5"
                            : done
                              ? "border-slate-100 bg-white opacity-60"
                              : "border-slate-100 bg-white"
                        }`}
                      >
                        <div
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${
                            done || active
                              ? "bg-[#2d8a9e] text-white"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm text-slate-800">{s.label}</div>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">{s.role}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Résultats */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Microscope className="h-4 w-4 text-[#2d8a9e]" />
                  <span className="text-sm font-medium text-slate-800">Résultats en direct</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
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
                      className={`rounded-lg border px-3 py-2 ${
                        r.ok
                          ? "border-emerald-100 bg-emerald-50/50"
                          : "border-amber-100 bg-amber-50/50"
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">{r.p}</div>
                      <div
                        style={{ fontFamily: "var(--font-display)" }}
                        className={`mt-0.5 text-sm font-semibold ${r.ok ? "text-emerald-700" : "text-amber-700"}`}
                      >
                        {r.v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules grid */}
      <section id="modules" className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-10 max-w-2xl">
          <div className="text-xs font-medium uppercase tracking-wider text-[#2d8a9e]">Modules</div>
          <h2 style={{ fontFamily: "var(--font-display)" }} className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Tout ce dont un laboratoire moderne a besoin.
          </h2>
          <p className="mt-3 text-slate-600">
             30 modules connectés : commercial, terrain, laboratoire, qualité, RH, comptabilité — sans ressaisie.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Users, t: "Clients & CRM", d: "Devis, contrats, conventions, portail client dédié." },
            { icon: ScanLine, t: "Scan & étiquettes", d: "Codes-barres + QR sur chaque échantillon." },
            { icon: FlaskConical, t: "Analyses", d: "Saisie avec seuils par région, conformité automatique." },
            { icon: ShieldCheck, t: "ISO 17025", d: "CAPA, non-conformités, audits, GED, revues de direction." },
            { icon: Radio, t: "Sondes IoT", d: "Ingestion continue LabGuard/Testo, alertes temps réel." },
            { icon: FileText, t: "Rapports d'essai", d: "PDF signés multi-niveaux, envoi client automatisé." },
            { icon: BarChart3, t: "Facturation TN", d: "Facture, avoir, règlement, El Fatoora, recouvrement." },
            { icon: ClipboardCheck, t: "GMAO", d: "Étalonnages, maintenances, réservations équipement." },
            { icon: Zap, t: "RH & Paie", d: "Employés, congés, bulletins CNSS/IRPP Tunisie." },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.t}
                className="group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-[#2d8a9e]/40 hover:shadow-sm"
              >
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#2d8a9e]/10 text-[#2d8a9e]">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h3 style={{ fontFamily: "var(--font-display)" }} className="mt-4 text-base font-semibold text-slate-900">
                  {m.t}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{m.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Workflow band */}
      <section id="workflow" className="border-y border-slate-200 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 max-w-2xl">
            <div className="text-xs font-medium uppercase tracking-wider text-[#2d8a9e]">Workflow</div>
            <h2 style={{ fontFamily: "var(--font-display)" }} className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Un seul fil conducteur.
            </h2>
            <p className="mt-3 text-slate-600">
              Aucune ressaisie. La donnée circule d'un module à l'autre — de la commande client jusqu'au règlement.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-0 right-0 top-5 hidden h-px bg-slate-200 md:block" />
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
                  <div className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-[#2d8a9e]">
                    {s.n}
                  </div>
                  <div className="mt-3 text-sm font-medium text-slate-800">{s.t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { k: "ISO 17025", v: "Conforme" },
            { k: "Modules", v: "30+" },
            { k: "Rapports métier", v: "8" },
            { k: "Traçabilité", v: "100%" },
          ].map((s) => (
            <div key={s.k} className="rounded-xl border border-slate-200 bg-white p-6">
              <div style={{ fontFamily: "var(--font-display)" }} className="text-3xl font-semibold text-[#0c2340]">
                {s.v}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">{s.k}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#0c2340] px-8 py-14 text-center text-white">
          <h2 style={{ fontFamily: "var(--font-display)" }} className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Prêt à moderniser votre laboratoire ?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Connectez-vous et démarrez avec votre premier bon de commande en moins de 5 minutes.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-[#0c2340] transition-transform hover:scale-[1.02]"
          >
            Accéder à BALIMS
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} BALIMS — Laboratory Information Management System
      </footer>
    </div>
  );
}
