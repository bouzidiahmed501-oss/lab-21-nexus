
# Plan d'Amelioration Complet — LIMS BALIMS

## Etat des Lieux

**64 tables** existent en base. **15 modules** ont une page frontend. Mais beaucoup restent des stubs ou des listes basiques sans workflow complet.

### Modules en place (partiellement)
| Module | Lignes | Etat |
|--------|--------|------|
| Qualite (NC, audits, CAPA, reclamations) | 1245 | Le plus avance |
| Parametres | 682 | Fonctionnel |
| RH (employes, conges, pointage, paie) | 555 | CRUD basique |
| Equipements (GMAO, maintenances, etalonnages) | 532 | CRUD basique |
| Facturation | 473 | CRUD, pas de workflow complet |
| Analyses | 440 | CRUD, pas de saisie resultats inline |
| Bons de commande | 427 | CRUD, manque workflow statuts legacy |
| Referentiels (catalogue, criteres) | 395 | Gestion basique |
| Missions | 390 | CRUD |
| Rapports | 361 | CRUD, pas de generation PDF |
| Projets | 358 | CRUD |
| Prelevements | 256 | CRUD, manque workflow complet |
| Feuilles de route | 237 | CRUD |
| Milieux de culture | 225 | CRUD |
| Produits | 223 | CRUD |
| Clients | 194 | CRUD |
| Notifications | 13 | **Stub vide** |

### Fonctionnalites Legacy Manquantes (critiques)
1. **Workflow BC complet** : enchainement brouillon -> receptionne -> en_cours -> resultats_prets -> facture -> archive
2. **Saisie resultats d'analyse inline** avec controle conformite temps reel (ValeurMin/ValeurMax)
3. **Generation PDF** rapports d'essai (format ISO 17025 LAB 21)
4. **Generation PDF** factures (format tunisien avec TVA 19%, timbre, RS)
5. **Elfatoora** : generation XML UBL 2.1 pour facturation electronique
6. **Portail client** : acces externe clients pour suivi BC / telechargement rapports
7. **Chaines/Unites** : structure hierarchique client legacy (Chaine = groupe, Unite = site)
8. **Packs d'analyses** : affectation automatique criteres par famille produit
9. **Liens BC -> Prelevements -> Analyses -> Resultats -> Rapport** : chaine complete
10. **Dashboard BI** avec graphiques (CA, BC/jour, top clients, analyses par superfamille)
11. **Notifications temps reel** (in-app + email)
12. **Avoirs et reglements** complets

---

## Planning d'Amelioration (14 Sprints)

### SPRINT 1 — Workflow BC & Prelevements (fondation)
- Refonte page Bons de commande : workflow multi-statuts avec timeline visuelle
- Lien BC -> Client -> Mission avec cascade Chaine/Unite
- Ajout prelevements depuis BC avec selection pack d'analyses
- Temperature de reception, code externe, responsable rencontre
- Statut badge anime + historique des changements de statut

### SPRINT 2 — Saisie Resultats & Conformite
- Tableau inline editable dans la page Analyses : un resultat par critere
- Verification conformite automatique (vert/rouge) vs ValeurMin/ValeurMax des criteres
- Incertitude de mesure par resultat
- Bouton "Tout conforme" pour saisie rapide
- Validation multi-niveaux : technicien -> chef labo -> qualite

### SPRINT 3 — Generation PDF Rapports d'Essai
- Template PDF conforme ISO 17025 : entete LAB 21, tableau resultats, conclusion, QR code
- Generation cote serveur via createServerFn
- Stockage dans Lovable Cloud Storage
- Preview avant envoi, telechargement direct
- Lien rapport -> analyses -> prelevements -> BC

### SPRINT 4 — Facturation Complete & PDF
- Refonte facturation : creation depuis BC selectionnes
- Calcul automatique : HT, TVA 19%, Timbre 1 TND, Retenue source
- Lignes de facture detail (reference analyse, designation, quantite, PU)
- Generation PDF facture format tunisien
- Gestion avoirs : creation avoir depuis facture, lignes, PDF

### SPRINT 5 — Reglements & Elfatoora
- Module reglements : affectation paiement sur factures (partiel/total)
- Modes de reglement (cheque, virement, especes, traite)
- Suivi solde client en temps reel
- Generation XML Elfatoora (UBL 2.1) pour soumission DGI
- Telechargement XML, historique soumissions

### SPRINT 6 — Dashboard BI Avance
- Graphiques Chart.js/Recharts : BC par jour, CA mensuel N vs N-1
- Repartition analyses par super-famille (camembert)
- Top 10 clients par CA
- Alertes : maintenances en retard, etalonnages expires, factures impayees J+30
- KPIs dynamiques avec refresh automatique

### SPRINT 7 — Referentiels Complets
- Gestion super-familles / familles / criteres avec arborescence
- Packs d'analyses : composition, lien famille, affectation unite
- Regions critere, natures critere, natures analyse
- Import/export catalogue CSV
- Referentiels normatifs (ISO, TUNAC)

### SPRINT 8 — Equipements GMAO Avance
- Calendrier de maintenance visuel
- Alertes etalonnage J-30
- Fiches d'intervention detaillees
- Cout maintenance par appareil/an
- Upload certificats etalonnage (Storage)
- Liaison appareil -> analyses (quel appareil pour quelle analyse)

### SPRINT 9 — RH & Paie Complet
- Fiche employe complete (CIN, CNSS, RIB, contrat)
- Calcul bulletin de paie tunisien : CNSS 9.18%/16.57%, IRPP baremes 2026
- Generation PDF bulletin de paie
- Calendrier conges avec validation workflow
- Organigramme visuel

### SPRINT 10 — Notifications & Centre de Messages
- Implementation page notifications (remplacer le stub)
- Notifications in-app temps reel (Supabase Realtime)
- Types : BC recu, resultats disponibles, rapport pret, facture impayee, maintenance urgente
- Marquage lu/non-lu, filtres par type
- Preferences notification par utilisateur

### SPRINT 11 — Portail Client Externe
- Interface client separee : login par email/mot de passe
- Dashboard client : BC en cours, resultats disponibles, factures
- Timeline suivi BC (recu -> analyse -> rapport -> facture)
- Telechargement rapports PDF et factures
- Historique complet par client

### SPRINT 12 — Qualite ISO 17025 & Audit
- Amelioration module qualite existant
- Workflow CAPA complet avec verification efficacite
- GED documents qualite (upload/versionning Storage)
- Indicateurs qualite automatiques (taux conformite, delai moyen)
- Revue de direction : tableau synthetique

### SPRINT 13 — Projets, Missions & Feuilles de Route
- Projets avec diagramme de Gantt simplifie
- Missions : lien complet avec BC, vehicule, preleveur, frais
- Feuilles de route : affectation taches aux techniciens
- Milieux de culture : tracabilite complete lot -> preparation -> utilisation

### SPRINT 14 — Optimisation & Finalisation
- Performance : index DB, pagination serveur, cache queries
- Audit log complet (toutes les actions CRUD)
- Export CSV/Excel sur tous les modules
- Parametres systeme avances (numerotation, seuils alertes, logo)
- Tests de regression et corrections finales
- Documentation utilisateur integree (tooltips, aide contextuelle)

---

## Details Techniques

### Base de donnees
- Tables existantes couvrent deja la majorite des besoins (64 tables avec RLS)
- Migrations additionnelles pour : champs manquants sur factures (elfatoora_uuid, payment_status), liens BC->prelevements enrichis
- Storage bucket pour : certificats etalonnage, rapports PDF, documents qualite, bulletins paie

### Architecture
- PDF generation via createServerFn (pas d'Edge Function) avec html-to-pdf ou jsPDF
- Elfatoora XML generation cote serveur
- Realtime via Supabase channels pour notifications
- Pas de migration de donnees legacy (MySQL) dans ce scope — uniquement construction neuve

### Securite
- RLS deja active sur toutes les tables
- Roles existants : admin, direction, commercial, chef_labo, technicien, qualite, comptable, rh, client
- Portail client isole via role "client" + RLS policies
