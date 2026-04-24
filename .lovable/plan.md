
# LIMS LAB 21 — Édition 2026

Reconstruction complète d'un LIMS moderne pour le laboratoire LAB 21 (Charguia 2, Ariana). Remplace l'application PHP/MySQL existante (113 607 BC, 2 110 analyses, 11 687 critères, 65 utilisateurs) par une application web React full-stack hébergée sur Lovable Cloud, avec portail client, facturation Elfatoora 2026, dashboards, suivi équipements, RH/paie et gestion de projets.

## Note importante sur la stack

Votre prompt initial demandait Laravel 11 + Vue 3 + MySQL. Lovable ne supporte que **React 19 + TanStack Start + PostgreSQL (Lovable Cloud)**. Toutes les fonctionnalités demandées restent réalisables à 100 % avec cette stack — seul le langage change. La base MySQL existante sera convertie vers PostgreSQL via un script de migration sélectif (clients actifs, produits, analyses récentes ; historique conservé en archive lecture seule).

---

## Périmètre Phase 1 (ce plan)

Vous avez sélectionné les 3 blocs majeurs en parallèle. Ils seront livrés progressivement par modules cohérents.

### Bloc A — Cœur métier laboratoire
- **Référentiels** : clients, produits, familles/super-familles, analyses, critères, méthodes, unités, normes, tarifs.
- **Bons de commande (BC)** : création, devis, validation client, planning prélèvement, attribution agent.
- **Prélèvements** : feuilles de prélèvement, géolocalisation point, photos, codes-barres/QR échantillons.
- **Réception échantillons** : enregistrement, conformité, attribution lab.
- **Analyses & saisie résultats** : par technicien, par méthode, validation hiérarchique (technicien → chef de service → directeur).
- **Rapports d'essai** : génération PDF, signature électronique, versioning, envoi par email au client, dépôt dans portail.
- **Facturation** : factures, avoirs, acomptes, multi-devises, situations clients, relances automatiques.
- **Elfatoora 2026** : génération XML conforme TTN, export ZIP signé, statut soumission, téléchargement direct depuis chaque facture, archive XML.

### Bloc B — Dashboard & notifications temps réel
- **Page d'accueil par rôle** (direction, commercial, technique, qualité, comptable, client) avec KPIs, alertes, raccourcis.
- **Widgets** : BC en attente, analyses en retard, factures impayées, équipements à étalonner, anomalies qualité, CA mensuel, top clients.
- **Notifications in-app + email** : nouveau BC, résultat disponible, facture émise, échéance dépassée, équipement hors tolérance, etc.
- **Centre de notifications** avec filtres et historique.

### Bloc C — Modules support
- **Suivi équipements (style LabGuard)** : inventaire, étalonnage, vérifications inter-étalonnages, maintenance préventive/curative, historique pannes, certificats, alertes échéances, QR code par appareil.
- **RH** : employés, contrats, congés, absences, présences/pointage, formations, habilitations (qualifications par analyse).
- **Paie** : éléments fixes/variables, primes, cotisations CNSS/IRPP Tunisie, bulletins PDF, déclarations.
- **Projets** : projets internes (R&D, accréditation, audit), tâches, jalons, ressources, budget vs réalisé, Gantt simple.

### Bloc D — Portail client
- Espace dédié séparé (`/portail`) avec login client.
- Dashboard client : analyses en cours, résultats récents, factures, situation comptable.
- Tracking analyse en temps réel (timeline : reçu → en cours → validé → rapport disponible).
- Téléchargement rapports PDF + factures PDF + XML Elfatoora.
- Demande de nouveau BC en ligne.
- Messagerie avec le laboratoire.

---

## Architecture & sécurité

- **Auth** : email/password (Lovable Cloud Auth). Pour les 65 comptes existants : import des hashs MD5 dans une table `legacy_password_md5`, à la 1ère connexion on vérifie en MD5, on rehash via Lovable Auth (bcrypt côté Supabase), on supprime l'entrée legacy. Reset password classique disponible.
- **Rôles** : table `user_roles` séparée + enum (`admin`, `direction`, `commercial`, `chef_labo`, `technicien`, `qualite`, `comptable`, `rh`, `client`). Fonction security definer `has_role()`. RLS sur toutes les tables.
- **Isolation client** : RLS stricte — un client ne voit que ses propres BC/analyses/factures via `client_id = current_user_client_id()`.
- **Audit log** : table `audit_log` avec qui/quoi/quand pour toutes les opérations sensibles (validation résultat, émission facture, soumission Elfatoora, modification tarif).
- **Secrets** : clés Elfatoora/TTN, SMTP, certificat de signature stockés dans les secrets Lovable Cloud (jamais en clair).

---

## Migration des données (schéma propre + import sélectif)

1. Analyse du dump `BDLB.sql` (~70 tables MySQL) → mapping vers nouveau schéma PostgreSQL normalisé.
2. Script de migration en deux passes :
   - **Passe 1 (référentiels actifs)** : clients actifs (commande dans les 24 derniers mois), produits, familles, analyses, critères, méthodes, employés actifs, équipements en service.
   - **Passe 2 (transactionnel récent)** : BC + analyses + factures des 24 derniers mois.
3. **Archive lecture seule** : historique antérieur importé dans schéma `archive.*` (consultable mais non modifiable, sans contraintes FK), accessible via une page "Archives historiques".
4. Réconciliation : rapport de migration avec compteurs avant/après, écarts, rejets.
5. Période de double-saisie possible si vous le souhaitez (1-2 semaines).

---

## Roadmap d'implémentation (livraisons successives)

Vu l'ampleur, on livre par itérations. Chaque itération produit une app utilisable.

| # | Livraison | Contenu |
|---|-----------|---------|
| 1 | **Fondations** | Auth + rôles + RLS + layout + navigation + dashboard squelette + import migration legacy MD5 |
| 2 | **Référentiels** | Clients, produits, familles, analyses, critères, méthodes, tarifs |
| 3 | **Workflow BC → Rapport** | BC, prélèvement, réception, saisie résultats, validation, rapport PDF |
| 4 | **Facturation + Elfatoora** | Factures, avoirs, situations, génération XML TTN, export ZIP |
| 5 | **Portail client** | Login client, tracking, téléchargements, demande BC en ligne |
| 6 | **Dashboards & notifications** | KPIs par rôle, notifications in-app + email, alertes |
| 7 | **Équipements (LabGuard-like)** | Inventaire, étalonnage, maintenance, QR, certificats |
| 8 | **RH & Paie** | Employés, congés, pointage, paie Tunisie, bulletins |
| 9 | **Projets** | Projets, tâches, Gantt, budget |
| 10 | **Migration données réelles** | Exécution du script complet + réconciliation + archives |

Vous validez après chaque livraison. On peut réordonner selon vos priorités.

---

## Détails techniques (section pour profil technique)

- **Frontend** : React 19 + TanStack Start + TanStack Router (file-based) + TanStack Query + Tailwind 4 + shadcn/ui.
- **Backend** : TanStack Start server functions (`createServerFn`) + server routes pour webhooks Elfatoora.
- **DB** : PostgreSQL via Lovable Cloud (Supabase), ~80-100 tables, RLS partout, fonctions security definer pour les rôles.
- **PDF** : génération via `@react-pdf/renderer` côté server function (compatible Worker runtime).
- **XML Elfatoora** : génération avec `fast-xml-parser`, signature XML via `xml-crypto` si Worker-compatible, sinon proxy via service externe.
- **Excel** : `exceljs` (Worker-compatible) pour exports.
- **QR codes** : `qrcode` package.
- **Email** : Resend via connecteur Lovable, ou SMTP custom via secret.
- **Notifications temps réel** : Supabase Realtime sur table `notifications`.
- **Stockage fichiers** (rapports PDF, certificats équipements, photos prélèvement) : Supabase Storage avec policies RLS.
- **Migration MySQL→PostgreSQL** : script Node.js exécuté localement, lit le dump, transforme types (`tinyint(1)`→`boolean`, `datetime`→`timestamptz`, `text`→`text`, gestion `utf8mb3`), insère via batch COPY.

---

## Hors périmètre Phase 1 (à discuter ensuite)

- App mobile native (PWA installable incluse par défaut).
- Connexion directe instruments labo (LIMS instrument interface).
- Module accréditation ISO 17025 documentaire complet.
- BI avancé / cubes OLAP.
- Multi-tenant (plusieurs labos sur la même instance).

---

Une fois ce plan approuvé, je démarre par la **Livraison 1 (Fondations)** : authentification, rôles, RLS, layout principal et squelette du dashboard. Vous pourrez tester immédiatement le login avant qu'on enchaîne sur les référentiels.
