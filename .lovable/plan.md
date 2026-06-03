
# Plan — Finitions BALIMS : popups, modules en construction, workflow devis

## Objectif
Passer de "plateforme fonctionnelle" à **LIMS complet niveau production** : tailles de modales standardisées, modules "à activer" réellement implémentés, et ajout du workflow commercial manquant (Devis → BC → Facture).

---

## Lot A — Standardisation UI des popups (rapide, transversal)

**Problème** : plusieurs `DialogContent` débordent du viewport (notamment Client, Prélèvement, Équipement, Employé).

**Solution**
- Créer un wrapper standard `ResponsiveDialogContent` (max-w configurable + `max-h-[90vh] overflow-y-auto`)
- Forcer toutes les modales projet à ce standard via remplacement ciblé
- Tailles standards : `sm` (max-w-md), `md` (max-w-2xl, défaut), `lg` (max-w-4xl), `xl` (max-w-6xl)
- Audit : `clients.tsx`, `prelevements.tsx`, `equipements.tsx`, `rh.tsx`, `produits.tsx`, `qualite.tsx`, `referentiels.tsx`, `milieux.tsx`, `sondes.tsx`, `bons-commande.tsx`, `facturation.tsx`

## Lot B — Nouveau module **Devis** (workflow commercial manquant)

**DB**
- Table `devis` (numero, client_id, date_devis, validite_jours, statut: brouillon/envoye/accepte/refuse/expire/converti, totaux HT/TVA/TTC, conditions, notes)
- Table `devis_lignes` (designation, parametre_id, quantite, prix, remise, TVA, total)
- Séquence numbering `DEV`
- FK `bons_commande.devis_id` (traçabilité conversion Devis → BC)
- RLS : lecture staff + client (ses devis), écriture commercial/direction/admin
- GRANTs complets

**UI** `/devis`
- Liste, création, édition, duplication
- Conversion en BC (1 clic, copie lignes + lien)
- Export PDF (réutilise le générateur `bonCommande.ts` adapté)
- Envoi par email (toast — vrai email = phase ultérieure)
- Acceptation client (statut, signature électronique simple)

## Lot C — Modules "à activer" à compléter

Audit rapide des modules qui affichent encore "Module à activer" :

1. **Sécurité / Utilisateurs & rôles** (`parametres.tsx`)
   - CRUD utilisateurs : invite par email, attribution multi-rôles, désactivation
   - Liste des sessions actives, journal des connexions (depuis `audit_log`)

2. **Audit log** (onglet Audit dans paramètres)
   - Affichage filtré du `audit_log` (user, action, entité, date) — déjà en DB
   - Filtres + export CSV

3. **Sauvegardes**
   - Vue d'export complet (CSV multi-tables : clients, BC, prélèvements, analyses, factures)
   - Bouton "Tout exporter (ZIP)" via JSZip

4. **Intégrations**
   - Carte d'état des intégrations : Lovable AI ✓, ElFatoora (config existante), Webhook sondes ✓
   - Bouton de test endpoint

5. **Notifications (paramètres)**
   - Préférences par utilisateur (toasts uniquement aujourd'hui — préf email pour plus tard)
   - Règles : seuil sondes, factures impayées, congés à valider

## Lot D — Sidebar
- Ajouter "Devis" dans groupe **Activité laboratoire** (entre Bons de commande et Missions)
- Pas d'autre ajout (modules déjà visibles)

---

## Détails techniques

- `ResponsiveDialogContent` = simple wrapper autour de `DialogContent` shadcn
- Conversion Devis→BC : RPC SQL `convert_devis_to_bc(devis_id uuid) returns uuid` (atomique)
- Export ZIP : `jszip` (déjà compatible browser)
- PDF Devis : copie de `bonCommande.ts` avec titre "DEVIS" + validité
- Pas de nouvelle dépendance lourde

## Ordre d'exécution

1. **Migration DB** : table `devis`, `devis_lignes`, séquence `DEV`, RPC conversion, FK BC.devis_id
2. **Lot A** : wrapper + remplacement modales (parallèle aux autres lots)
3. **Lot B** : pages + PDF Devis + ajout sidebar
4. **Lot C** : compléter modules paramètres (Utilisateurs, Audit, Sauvegardes, Intégrations, Notifications)
5. **Vérif build** + test rapide flow Devis → BC → Facture

Livraison itérative : je commence par la migration DB (Lot B/C), puis j'enchaîne les UI en parallèle.
