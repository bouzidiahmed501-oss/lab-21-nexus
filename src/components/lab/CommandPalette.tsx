import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const PAGES: { label: string; to: string; group: string }[] = [
  { label: "Tableau de bord", to: "/", group: "Pilotage" },
  { label: "Notifications", to: "/notifications", group: "Pilotage" },
  { label: "Devis", to: "/devis", group: "Activité" },
  { label: "Bons de commande", to: "/bons-commande", group: "Activité" },
  { label: "Missions", to: "/missions", group: "Activité" },
  { label: "Prélèvements", to: "/prelevements", group: "Activité" },
  { label: "Scan réception", to: "/reception-scan", group: "Activité" },
  { label: "Échantillons", to: "/echantillons", group: "Activité" },
  { label: "Plan de stockage", to: "/stockage", group: "Activité" },
  { label: "Feuilles de route", to: "/feuilles-route", group: "Activité" },
  { label: "Analyses", to: "/analyses", group: "Activité" },
  { label: "Packs d'analyses", to: "/pack-analyses", group: "Activité" },
  { label: "Chaînes d'analyse", to: "/chaines-analyse", group: "Activité" },
  { label: "Rapports", to: "/rapports", group: "Activité" },
  { label: "Validations / Signature", to: "/validations", group: "Activité" },
  { label: "Rapports métier", to: "/rapports-metier", group: "Activité" },
  { label: "Clients", to: "/clients", group: "Référentiels" },
  { label: "Produits", to: "/produits", group: "Référentiels" },
  { label: "Catalogue Analyses", to: "/referentiels", group: "Référentiels" },
  { label: "Milieux de culture", to: "/milieux", group: "Référentiels" },
  { label: "Réactifs", to: "/reactifs", group: "Référentiels" },
  { label: "Facturation", to: "/facturation", group: "Gestion" },
  { label: "Avoirs", to: "/avoirs", group: "Gestion" },
  { label: "Règlements", to: "/reglements", group: "Gestion" },
  { label: "Comptes clients", to: "/comptes-clients", group: "Gestion" },
  { label: "Recouvrement", to: "/recouvrement", group: "Gestion" },
  { label: "Dépenses", to: "/depenses", group: "Gestion" },
  { label: "Équipements", to: "/equipements", group: "Gestion" },
  { label: "Réservations équipement", to: "/reservations-equipement", group: "Gestion" },
  { label: "Sondes IoT", to: "/sondes", group: "Gestion" },
  { label: "RH & Paie", to: "/rh", group: "Gestion" },
  { label: "Formations & habilitations", to: "/formations", group: "Gestion" },
  { label: "Projets", to: "/projets", group: "Gestion" },
  { label: "Qualité", to: "/qualite", group: "Gestion" },
  { label: "Contrôle Qualité", to: "/controle-qualite", group: "Gestion" },
  { label: "Paramètres", to: "/parametres", group: "Gestion" },
];

interface Hit {
  id: string;
  label: string;
  sub: string;
  to: string;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const like = `%${term}%`;
      const [clients, echantillons, factures] = await Promise.all([
        (supabase.from("clients" as never) as any).select("id, raison_sociale, code").ilike("raison_sociale", like).limit(5),
        (supabase.from("echantillons" as never) as any).select("id, code_barre, designation").or(`code_barre.ilike.${like},designation.ilike.${like}`).limit(5),
        (supabase.from("factures" as never) as any).select("id, numero").ilike("numero", like).limit(5),
      ]);
      if (cancelled) return;
      const list: Hit[] = [
        ...((clients.data ?? []) as any[]).map((c) => ({ id: `c-${c.id}`, label: c.raison_sociale, sub: "Client", to: "/clients" })),
        ...((echantillons.data ?? []) as any[]).map((s) => ({ id: `e-${s.id}`, label: `${s.code_barre} — ${s.designation ?? ""}`, sub: "Échantillon", to: "/echantillons" })),
        ...((factures.data ?? []) as any[]).map((f) => ({ id: `f-${f.id}`, label: f.numero, sub: "Facture", to: "/facturation" })),
      ];
      setHits(list);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const go = (to: string) => {
    setOpen(false);
    setQuery("");
    navigate({ to });
  };

  const groups = Array.from(new Set(PAGES.map((p) => p.group)));

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-7 gap-2 px-2 text-xs text-muted-foreground"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Rechercher…</span>
        <kbd className="hidden rounded border border-border bg-muted px-1 text-[10px] md:inline">Ctrl K</kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Rechercher un module, un client, un échantillon, une facture…" value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          {hits.length > 0 && (
            <CommandGroup heading="Résultats">
              {hits.map((h) => (
                <CommandItem key={h.id} value={`${h.label} ${h.sub}`} onSelect={() => go(h.to)}>
                  <span className="truncate">{h.label}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{h.sub}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {groups.map((g) => (
            <CommandGroup key={g} heading={g}>
              {PAGES.filter((p) => p.group === g).map((p) => (
                <CommandItem key={p.to} value={p.label} onSelect={() => go(p.to)}>
                  {p.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
