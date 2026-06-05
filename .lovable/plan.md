
# Plan d'amélioration complet — BALIMS LIMS

Objectif : atteindre la **parité fonctionnelle** avec le LIMS PHP legacy (analysé depuis `lims.zip`), compléter tous les modules "en construction", aligner la logique métier (papiers, standards, workflows) et finaliser l'UI.

---

## Audit de l'écart (legacy vs actuel)

**Modules legacy détectés dans le zip** (≈70 modules PHP) vs **modules BALIMS existants** :

| Domaine | Legacy | BALIMS actuel | État |
|---|---|---|---|
| Commercial | BonCommande, Avoir, Facture, FacturationAuto, Reglement, Recouvrement, ModeReglement | bons-commande, facturation, devis | ⚠️ Avoir, Règlements détaillés, Recouvrement, FacturationAuto manquants |
| Pré-analytique | Mission, FeuilleRoute, Prelevement, TypePrelevement, MoyenLocomotion | missions, feuilles-route, prelevements | ✓ presque complet (TypePrelevement à ajouter) |
| Analytique | Analyse, PackAnalyse, Critere, Validation, Chaine, RapportEssai | analyses, rapports | ⚠️ PackAnalyse UI, Chaîne d'analyse, Validation multi-niveaux à compléter |
| Référentiels | Famille, SuperFamille, ExtraFamille, TypeAnalyse, NatureAnalyse, Unite, Referentiel, Region, Milieu | referentiels, milieux, produits | ⚠️ Familles hiérarchiques (Super/Famille/Extra) à exposer |
| Équipements | FicheAppareil, TypeAppareil, RequeteAppareil | equipements, sondes | ⚠️ Requêtes/réservations appareil manquantes |
| Qualité | ActionCorrective, DocumentQualite, NonConformite | qualite | ⚠️ Workflow CAPA + GED à compléter |
| Compta | Compte, CompteHistorique, CompteSolde, Transaction, Depense | facturation | ❌ Comptabilité client (solde, historique, dépenses) manquante |
| RH/Users | Utilisateur, CatUtilisateur, Permission, USession, UtilisateurLog | rh, parametres | ⚠️ Gestion permissions fines + journal sessions à compléter |
| Rapports | rapportBilan, rapportCA, rapportDelaiPayement, rapportImpaye, rapportKilometrage, rapportPrelevement, rapportPreleveur, rapportReglement | rapports (basique) | ❌ 8 rapports métier à recréer |

---

## Lot 1 — Finitions UI & modules "à activer" (rapide)

- **Popups responsives** : auditer & corriger toutes les modales débordantes (client, équipement, employé, BC, facture). Standardiser à `max-w-2xl` / `4xl` / `6xl` + `max-h-[90vh]`.
- **Modules paramètres "à activer"** : compléter Sécurité (CRUD users + rôles + sessions), Audit (filtres + export), Sauvegardes (export ZIP multi-tables), Intégrations (status + test), Notifications (préférences).
- **Sidebar** : ajouter entrées manquantes (Avoirs, Règlements, Comptabilité, Dépenses).

## Lot 2 — Workflow commercial complet (papier-conforme legacy)

**DB + UI**
- **Avoirs** (`avoirs`, `lignes_avoir` déjà en DB) → page `/avoirs` : création depuis facture, PDF, numérotation `AV-YYYY-XXXXX`.
- **Règlements détaillés** (`reglements`, `lignes_reglement`, `modes_reglement` déjà en DB) → page `/reglements` : multi-modes (chèque/virement/espèces/traite), lettrage facture↔règlement, échéances.
- **Recouvrement** : tableau de bord créances, relances automatiques (J+15/J+30/J+60), génération lettres de relance PDF.
- **Facturation automatique** : génération mensuelle des factures depuis BC clôturés, paramétrable par client.
- **Comptabilité client** : page `/clients/:id/compte` avec solde, historique mouvements (factures + règlements + avoirs).
- **Dépenses** (nouvelle table `depenses`) : saisie + catégorisation + rattachement projet/mission.

## Lot 3 — Workflow analytique conforme (chaîne + validation)

- **Chaîne d'analyse** (table `chaines` à créer) : ordre des étapes par paramètre, technicien assigné par étape, durée standard.
- **Validation multi-niveaux** (`validations` existe) : workflow technicien → chef labo → direction, signatures électroniques horodatées.
- **Pack analyses** : UI complète CRUD (`pack_analyses`, `lignes_pack_analyse` en DB) avec application en 1 clic dans BC/devis.
- **Catalogue analyses hiérarchique** : exposer Super-famille / Famille / Extra-famille avec navigation arborescente.
- **Critères & seuils par région** : `region_criteres` existe → UI d'édition + application automatique selon région client.
- **Types de prélèvement** : nouvelle table `type_prelevements` (eau, surface, air, aliment…) + champs spécifiques par type.

## Lot 4 — Équipements & maintenance

- **Requête appareil** (réservation) : nouvelle table `reservations_equipement` (qui utilise quoi quand), calendrier de disponibilité.
- **Étalonnages** (`etalonnages` existe) : workflow complet alertes échéance + historique + certificats PDF.
- **Maintenance** (`maintenances` existe) : planification préventive + curative + coûts.

## Lot 5 — Qualité ISO 17025

- **CAPA workflow** (`actions_capa` existe) : ouverture NC → action immédiate → action corrective → vérification d'efficacité → clôture.
- **GED qualité** (`documents_qualite` existe) : versionning, diffusion contrôlée, accusé de lecture, archivage.
- **Revue de direction** (`revues_direction` existe) : agenda type ISO, compte-rendu auto, indicateurs.
- **Audits internes** (`audits` existe) : planification + grilles + constats + suivi.
- **Indicateurs qualité** : tableau de bord avec objectifs/réalisé.

## Lot 6 — Rapports métier (8 rapports legacy)

Recréer en PDF + export Excel :
1. **Bilan d'activité** (volumes / CA / délais)
2. **Chiffre d'affaires** (par client / période / commercial)
3. **Délai de paiement** moyen par client
4. **Factures impayées** + ancienneté créance
5. **Kilométrage** missions (par véhicule / préleveur)
6. **Prélèvements** (volumes / types / régions)
7. **Préleveur** (productivité par technicien)
8. **Règlements** (par mode / période)

## Lot 7 — Permissions & sécurité fines

- **Permissions granulaires** (table `permissions` à créer) : par module × action (lire/écrire/valider/supprimer/exporter).
- **Catégories utilisateurs** : presets de permissions réutilisables.
- **Journal sessions** (`audit_log` + filtre session_id) : qui s'est connecté, IP, durée, actions.
- **Verrouillage compte** après N échecs.

## Lot 8 — Finitions transversales

- i18n FR cohérent partout (corriger mélanges FR/EN restants).
- Tooltips d'aide sur tous les champs métier complexes.
- Raccourcis clavier (sauvegarder Ctrl+S, nouveau Ctrl+N).
- Export Excel généralisé sur toutes les listes (déjà CSV).
- Mode impression optimisé pour tous les PDF (entête société dynamique).
- Numérotation centralisée : ajouter séquences `AV`, `REG`, `DEP`, `RES` à `numbering_sequences`.

---

## Ordre d'exécution proposé

```
Lot 1 (UI fixes)            → 1 itération  [bloquant UX]
Lot 2 (Commercial)          → 2 itérations [haute valeur]
Lot 3 (Analytique)          → 2 itérations [cœur métier ISO]
Lot 6 (Rapports)            → 2 itérations [demandé direction]
Lot 5 (Qualité ISO 17025)   → 1 itération
Lot 4 (Équipements)         → 1 itération
Lot 7 (Permissions)         → 1 itération
Lot 8 (Finitions)           → 1 itération continue
```

Chaque lot = **1 migration DB consolidée** + **pages UI** + **PDF/exports** + **vérification build**.

---

## Démarrage

Dites simplement **"go Lot 1"** (ou un autre numéro) pour que je lance l'implémentation. Par défaut j'enchaîne dans l'ordre proposé : **Lot 1 puis Lot 2** sans attendre validation intermédiaire.
