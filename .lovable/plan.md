
# Plan — BALIMS SaaS complet, workflow modifiable par société

Ordre demandé : **Phase 3 (visible) → Phase 2 (cœur workflow) → Phase 1 (fondations)**. Chaque phase = 1 migration DB + modules UI + vérification build. Je livre en séquence sans re-demander.

---

## Phase A — Personnalisation société (branding, numérotation, PDF, notifications)

Objectif : chaque société voit son identité sur toutes les sorties (écran + PDF + emails) et paramètre ses règles.

### Base de données
- Table `tenants` (société SaaS) : nom, logo_url, couleur_primaire, adresse, ninea/matricule fiscal, téléphone, email, mentions légales PDF, TVA par défaut, timbre fiscal, monnaie, langue.
- Table `tenant_settings` (clé/valeur JSON) : préférences notifications, seuils IoT par défaut, format date, fuseau.
- Extension `numbering_sequences` : `tenant_id`, `format_template` déjà présent → exposer via UI (prefix, padding, reset annuel, suffix).
- Table `notification_rules` : événement (facture_impayee, seuil_iot, echeance_etalonnage, nc_ouverte…) × canaux (in-app / email) × destinataires (rôle ou user) × délai.
- Table `tenant_branding_assets` : logos (entête, favicon, filigrane PDF) via `storage`.

### Modules UI
- Page `/parametres/societe` refonte complète en 6 onglets :
  1. **Identité** : logo (upload), couleurs, coordonnées, mentions légales.
  2. **Fiscalité** : TVA, timbre, retenue à la source, format Elfatoora, RIB.
  3. **Numérotation** : éditeur visuel des séquences (DEV, BC, MIS, PRL, FR, ANA, RAP, FAC, AV, REG, DEP) avec aperçu live.
  4. **PDF & Emails** : templates en-tête/pied, choix polices, signature scannée, aperçu.
  5. **Notifications** : matrice événement × canal × destinataire.
  6. **Préférences** : fuseau, langue, format date, seuils IoT par défaut.
- Refactor `src/lib/pdf/*` pour lire `tenant` (logo, couleurs, mentions, RIB, TVA) au lieu des constantes.
- `AppLayout` header : logo société dynamique.

Livrable : toute sortie visuelle reflète la société connectée.

---

## Phase B — Éditeur de workflow (statuts, transitions, validations, signatures)

Objectif : chaque société modifie ses étapes métier via UI, sans intervention développeur.

### Base de données
- Table `workflows` : `entity` (devis|bc|mission|prelevement|analyse|rapport|facture), `tenant_id`, nom, actif.
- Table `workflow_states` : ordre, code, libellé, couleur, is_initial, is_final.
- Table `workflow_transitions` : from_state, to_state, libellé, rôles autorisés, condition (JSON), action_hook.
- Table `workflow_validations` : state cible → niveaux de validation ordonnés (rôle, is_signature, quorum).
- Table `workflow_signatures` : entity_type, entity_id, state, user_id, signed_at, hash, ip.
- Migration : remplace la colonne `statut` texte libre par FK `state_id` sur chaque entité métier, avec fallback compat.

### Modules UI
- Page `/parametres/workflows` — éditeur visuel :
  - Liste des entités (Devis, BC, Mission, Prélèvement, Analyse, Rapport, Facture).
  - Vue "kanban builder" : ajout/suppression/renommage/couleur des états, drag pour réordonner.
  - Éditeur de transitions (flèches) avec panneau de règles : rôles, conditions, notifications déclenchées.
  - Onglet "Validations & signatures" par état : niveaux, rôles, signature obligatoire.
- Widget global `<StateTransitionButton>` : remplace tous les boutons de changement de statut existants. Vérifie transitions autorisées, rôle, déclenche validation + signature.
- Historique par entité : timeline des transitions (qui, quand, IP, signature).
- Templates prêts (ISO 17025 par défaut) importables en 1 clic pour démarrer.

Livrable : toutes les entités métier passent par le moteur configurable, sans casser les workflows existants (préréglage = workflow actuel).

---

## Phase C — Fondations multi-tenant + permissions fines

Objectif : isolation totale entre sociétés + matrice permissions granulaire.

### Base de données
- Ajout `tenant_id UUID` sur toutes les tables métier (50+), FK vers `tenants`, non-null, index.
- Ajout `tenant_id` sur `profiles` (société active) et `user_tenants` (multi-adhésion : user × tenant × rôle).
- Fonction SDF `current_tenant_id()` (lit `profiles.tenant_id` de `auth.uid()`).
- **Réécriture de toutes les policies RLS** : `USING (tenant_id = public.current_tenant_id())`, plus les règles rôle existantes.
- Backfill des données existantes vers un tenant "BALIMS Origine".
- Table `permissions` : module × action (lire, écrire, valider, supprimer, exporter, imprimer).
- Table `role_permissions` : rôle × permission, par tenant (overrides).
- Fonction `has_permission(_user_id, _module, _action)` SDF.

### Modules UI
- Onboarding SaaS : `/inscription-societe` — création d'un tenant (nom, logo, admin initial), envoi email confirmation, provisioning.
- Sélecteur de société dans le header (pour users multi-tenants).
- Page `/parametres/permissions` : matrice interactive rôle × module × action, presets (ISO 17025, Labo privé, Labo public).
- Page `/parametres/utilisateurs` : invitation par email, assignation rôle, désactivation, journal sessions.
- Middleware côté client : masque les entrées sidebar + boutons selon `has_permission()`.
- Middleware serverFn : vérifie `has_permission()` avant chaque écriture sensible.

Livrable : plusieurs sociétés cohabitent sans se voir, chacune configure ses rôles.

---

## Détails techniques

### Ordre d'implémentation
```
Phase A  → 3 itérations (DB, UI paramètres, refactor PDF/emails)
Phase B  → 4 itérations (DB workflow, éditeur UI, widget transitions, migration statuts)
Phase C  → 4 itérations (schema tenant_id + RLS, permissions, UI, onboarding SaaS)
```
Total ~11 itérations. Build vert après chaque itération.

### Compatibilité & non-régression
- Toutes les migrations sont additives ; un tenant par défaut "BALIMS Origine" absorbe l'existant.
- Le moteur de workflow est préréglé avec les statuts actuels — aucun écran ne casse.
- Les policies RLS sont réécrites en un seul passage transactionnel avec `GRANT` restauré.
- Le linter Supabase est passé après chaque migration.

### Sécurité
- `tenant_id` non modifiable côté client (trigger `BEFORE UPDATE`).
- Signature électronique : hash SHA-256 du snapshot entité + timestamp + user + IP, stocké en `workflow_signatures`.
- Permissions vérifiées **côté serveur** via server functions ; UI masque = confort, pas sécurité.
- Onboarding tenant : email confirmé obligatoire avant activation.

### Ce que je NE fais PAS (hors scope demandé)
- Facturation Stripe du SaaS lui-même (abonnements par tenant).
- Auto-scaling / sharding DB.
- Mobile natif.

---

## Démarrage

Dès approbation, j'attaque **Phase A itération 1** (migration `tenants` + `tenant_settings` + `notification_rules` + branding assets). Je poursuis la séquence sans attendre validation intermédiaire, sauf si un choix produit apparaît (ex. modèle de signature, format Elfatoora spécifique).
