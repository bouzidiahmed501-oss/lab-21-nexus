# Audit UX/UI BALIMS vs LabWare — plan d'exécution

## Objectif
Produire un **fichier repère unique** (`docs/AUDIT-UX.md`) qui liste, module par module, chaque défaut UX/UI et chaque écart de workflow face aux LIMS du marché (LabWare, LabVantage, STARLIMS, Labguru), puis corriger point par point avec un suivi coché dans ce même fichier.

## Étape 1 — Audit réel, pas théorique
Passage sur les 38 écrans authentifiés (déjà inventoriés : de `type-prelevements` 154 lignes à `qualite` 1314 lignes) avec, pour chacun :
- parcours réel dans le navigateur (captures d'écran), en tant que nouvel utilisateur : « j'ouvre le module, qu'est-ce que je comprends, que puis-je faire, où je bloque ? »
- vérification des états : liste vide, chargement, erreur, données nombreuses (tri/filtre/pagination), mobile 375px et desktop
- vérification des formulaires : champs obligatoires, messages d'erreur, sauvegarde, feedback après action
- vérification du chaînage métier : depuis un module, puis-je aller à l'étape suivante sans passer par le menu ?

## Étape 2 — Le fichier repère
`docs/AUDIT-UX.md`, structuré ainsi :

```text
1. Synthèse (score par module, priorités P0/P1/P2)
2. Référentiel concurrentiel (ce que fait LabWare et qui nous manque)
3. Défauts transverses (navigation, thème, tableaux, modales, impression)
4. Fiche par module x38
     - Rôle métier | Parcours actuel | Défauts UX | Écarts workflow
     - Actions correctives numérotées [ ] à cocher
5. Tests de bout en bout (scénarios client)
6. Journal d'avancement
```
Chaque point est numéroté (ex. `CLI-03`) pour pouvoir dire « fais CLI-03 et FAC-07 ».

## Étape 3 — Axes de correction déjà identifiés
**Navigation** : 40+ entrées de menu à plat, sans regroupement repliable ni favoris ; pas de fil workflow (Devis → BC → Mission → Prélèvement → Échantillon → Analyse → Rapport → Facture) visible depuis les fiches.

**Thème** : le rendu actuel est correct mais « ERP générique ». Passage à une identité laboratoire : densité maîtrisée, typographie technique, codes couleur d'état normalisés (en attente / en cours / conforme / non conforme / hors limites), badges et tableaux unifiés, mode sombre labo, meilleure lisibilité des chiffres et des unités.

**Tableaux** : comportement unifié (recherche, filtres persistants, tri, colonnes ajustables, sélection multiple, actions groupées, export) — aujourd'hui inégal d'un module à l'autre.

**Formulaires et modales** : tailles hétérogènes, formulaires longs sans sections ni étapes, peu de validation immédiate.

**Impression / documents** : contrôle visuel de chaque sortie (étiquettes A6 code-barres, devis, bon de commande, facture + Elfatoora, rapport ISO 17025, feuille de route) — marges, en-tête tenant, logo, pieds de page, pagination, aperçu avant impression.

**Paramétrage** : rendre le paramétrage compréhensible pour une société qui démarre (assistant de configuration initiale, valeurs par défaut sensées, aperçu en direct du branding).

## Étape 4 — Exécution par lots
Après validation du fichier repère, correction par lots priorisés, chaque lot terminé étant coché dans `docs/AUDIT-UX.md` :
1. Transverse : navigation, thème, tableaux, modales
2. Chaîne commerciale : Devis → BC → Facturation → Règlements
3. Chaîne laboratoire : Prélèvements → Réception → Échantillons → Analyses → Validation → Rapports
4. Qualité / CQ / Équipements / Réactifs
5. Impression et paramétrage
6. Tests de bout en bout rejoués

## Détails techniques
- Audit conduit avec Playwright en local (captures par module, relevé des erreurs console et des requêtes en échec).
- Aucune modification de schéma dans cette phase d'audit ; les besoins de données manquantes sont listés comme actions.
- Les corrections transverses passent par les composants partagés (`DataTable`, `PageHeader`, `dialog`, `StatusBadge`, `AppSidebar`) et les tokens de `src/styles.css`, pour éviter 38 corrections isolées.
- Correction au passage d'un bruit d'exécution actuel : conflit de verrou sur le jeton d'authentification (plusieurs clients concurrents) visible dans les erreurs de prévisualisation.

Livrable de la première étape : `docs/AUDIT-UX.md` complet et chiffré, prêt à être exécuté ligne par ligne.
