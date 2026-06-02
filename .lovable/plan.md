# Plan — Codes-barres, Sondes IoT, et complétion des modules

## Lot 1 — Codes-barres Code128 sur la réception

**Base de données**
- Ajouter `code_barre` (text unique) sur `prelevements` (auto-généré au format `PRL-{numero}` ou UUID court)
- Ajouter `scanne_at`, `scanne_by`, `verifie_at`, `verifie_by` pour tracer la vérification
- Trigger pour générer `code_barre` à l'insert si vide

**UI**
- Composant `<BarcodeLabel>` (JsBarcode, format Code128) — étiquette imprimable A6/A7 avec numéro, client, date, paramètres
- Page **Réception** : bouton "Imprimer étiquettes" pour un BC (toutes les lignes) ou un prélèvement individuel
- Page **Vérification scan** : input qui capte la douchette USB (focus auto, Enter = submit), affiche la fiche du prélèvement, bouton "Valider la réception"
- Recherche globale par code-barres dans la topbar

**Librairie** : `jsbarcode` (pur JS, fonctionne navigateur + impression)

## Lot 2 — Sondes IoT (LabGuard / Testo / générique)

**Base de données**
- `sondes` : id, code, libelle, equipement_id (FK), type (`temperature`|`humidite`|`pression`|`autre`), unite, seuil_min, seuil_max, intervalle_minutes, api_key (hash), is_active
- `releves_sonde` : id, sonde_id, mesure (numeric), mesuree_at, batterie_pct, signal_pct, payload (jsonb), conformite (bool)
- `alertes_sonde` : id, sonde_id, releve_id, type (`hors_seuil`|`hors_ligne`|`batterie_faible`), severite, acquittee_at, acquittee_by

**Endpoint webhook public** : `/api/public/sondes/ingest`
- POST, auth par header `x-api-key` (vérifié contre `sondes.api_key` hashée)
- Schéma Zod : `{ code_sonde, mesure, mesuree_at?, batterie?, signal?, raw? }`
- Insert relevé + calcul conformité (seuils) + création alerte si hors seuil
- Compatible LabGuard/Testo via mapping configurable côté sonde

**UI module Équipements** :
- Onglet "Sondes" : liste + CRUD, génération API key (affichée 1× à la création)
- Onglet "Relevés" : courbe (recharts) 24h/7j/30j, tableau, export CSV
- Onglet "Alertes" : badges sur sidebar, acquittement
- Job côté serveur : marquer hors-ligne les sondes sans relevé depuis 2× `intervalle_minutes`

## Lot 3 — Audit visibilité & complétude modules

**Audit systématique** (en parallèle) :
1. Lister tous les fichiers `src/routes/_authenticated/*.tsx` et vérifier qu'ils sont dans la sidebar
2. Pour chaque module : vérifier formulaire création, édition, suppression, actions métier
3. Corriger erreurs i18n FR (libellés, messages toast)
4. Vérifier responsive (sidebar mobile, tableaux scroll-x, modales)

**Modules à compléter en priorité** (selon audit) :
- Missions / Prélèvements : workflow réception → étiquette → scan → analyse
- Équipements : sondes (Lot 2)
- RH : bulletins paie PDF, congés workflow
- Qualité : CAPA actions, audits constats
- Portail client : accès résultats + factures

## Détails techniques

- `jsbarcode` rendu en SVG dans un `<iframe>` pour impression propre (CSS print)
- Douchette USB = HID clavier : `<input autoFocus onKeyDown={e => e.key === 'Enter' && validate()}>`
- Webhook sondes : signature HMAC optionnelle en plus de l'API key pour LabGuard
- Recharts pour courbes sondes (déjà installé)
- Realtime Supabase sur `releves_sonde` + `alertes_sonde` pour dashboard live

## Ordre d'exécution

1. **Migration DB** (codes-barres prélèvements + tables sondes + alertes) — 1 migration
2. **Backend** : trigger code-barres, endpoint `/api/public/sondes/ingest`
3. **UI Réception** : composant étiquette + page scan/vérif
4. **UI Sondes** : CRUD + relevés + alertes dans module Équipements
5. **Audit modules** : passe systématique, corrections UI/FR/actions manquantes
6. **Sidebar** : ajout des nouveaux écrans (Scan réception, Sondes, Alertes)

Livraison itérative — je commence par le Lot 1 (codes-barres) puis enchaîne sur le Lot 2 (sondes), puis Lot 3 (audit modules) dans le même flux.
