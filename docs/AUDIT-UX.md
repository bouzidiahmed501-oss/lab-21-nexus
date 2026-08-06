# BALIMS — Audit UX/UI & Workflow

Fichier repère unique. Chaque point porte un identifiant (ex. `TRV-03`, `DEV-02`) et une case à cocher.
Pour lancer une correction : « fais TRV-03 et DEV-02 ».

- Audit réalisé le **3 août 2026** par parcours automatisé des **38 écrans authentifiés** (captures + relevé console + relevé réseau).
- Priorités : **P0** = bloque ou trompe l'utilisateur · **P1** = frein quotidien · **P2** = finition / parité concurrentielle.
- Statut : `[ ]` à faire · `[x]` fait (dater dans le journal en fin de fichier).

---

## 1. Synthèse

### 1.1 Verdict global

BALIMS couvre déjà **plus de modules qu'un LIMS d'entrée de gamme** (38 écrans, chaîne commerciale + chaîne labo + qualité + RH + IoT).
Le problème n'est pas la couverture fonctionnelle, c'est **la lisibilité du parcours** :

1. **Le menu est une liste de 40 entrées à plat.** Un nouvel utilisateur ne devine pas dans quel ordre travailler. LabWare, LabVantage et STARLIMS n'exposent jamais 40 entrées : ils exposent un *workbench* par rôle (« Ma journée »), et le reste est atteint par le contexte.
2. **Les écrans sont des tables isolées.** On crée un devis, mais rien ne dit « et maintenant, convertis-le ». Le fil métier Devis → BC → Mission → Prélèvement → Échantillon → Analyse → Validation → Rapport → Facture existe en base mais **n'est visible nulle part à l'écran**.
3. **Pas de fiche détail.** Presque tout se joue en modale. Un LIMS professionnel a une **fiche objet** (échantillon, commande, client) avec onglets, historique, pièces jointes, actions. C'est l'écart n°1 avec LabWare.
4. **Aucune donnée de démonstration.** 33 écrans sur 38 sont vides au premier contact : impossible pour un prospect d'évaluer le produit.
5. **Le thème est propre mais générique** (gris/bleu ERP). Il manque une signature laboratoire : états normalisés, densité, lecture des valeurs numériques et des unités, mode sombre paillasse.

### 1.2 Score par module (relevé réel)

| Module | Données affichées | Fiche détail | Chaînage | Score |
|---|---|---|---|---|
| Tableau de bord | 8 KPI + 3 tableaux, tous à 0 | — | partiel | 6/10 |
| Devis | table + filtre statut + CSV | modale | conversion BC OK | 7/10 |
| Bons de commande | table | modale | vers missions ✗ | 6/10 |
| Missions | vide, pas de table | modale | vers prélèvements ✗ | 5/10 |
| Prélèvements | table | modale | vers échantillons ✗ | 6/10 |
| Scan réception | écran scan seul | ✗ | impression étiquette OK | 6/10 |
| Échantillons | vide | historique OK | vers analyses ✗ | 6/10 |
| Plan de stockage | arborescence | ✗ | ✗ | 6/10 |
| Feuilles de route | table | modale | ✗ | 6/10 |
| Analyses | vide | modale saisie | vers validation ✗ | 6/10 |
| Packs d'analyses | vide | modale | ✗ | 6/10 |
| Chaînes d'analyse | vide | modale | non exécutable | 5/10 |
| Types prélèvement | vide | modale | ✗ | 6/10 |
| Rapports | vide | PDF OK | ✗ | 6/10 |
| Validations / Signature | vide | signature SHA-256 | ✗ | 6/10 |
| Rapports métier | 8 rapports + CSV | — | — | 7/10 |
| Clients | table | modale | pas de vue 360° | 6/10 |
| Produits | vide | modale | ✗ | 6/10 |
| Catalogue Analyses | vide | modale | ✗ | 6/10 |
| Milieux de culture | table | modale | ✗ | 6/10 |
| Réactifs | vide | modale | pas de décrément auto | 5/10 |
| Facturation | vide | PDF + Elfatoora | depuis BC OK | 7/10 |
| Avoirs / Règlements / Comptes / Recouvrement | vides | modales | partiel | 6/10 |
| Dépenses | vide | modale | ✗ | 6/10 |
| Équipements | vide | modale | étalonnage OK | 7/10 |
| Réservations équip. | vide | modale | pas de calendrier | 5/10 |
| Sondes IoT | table | modale | alertes OK | 7/10 |
| RH & Paie | vide | modale | ✗ | 6/10 |
| Formations | vide | modale | ✗ | 6/10 |
| Projets | vide | Gantt | ✗ | 6/10 |
| Qualité | onglets NC/CAPA/audits | modales | ✗ | 7/10 |
| Contrôle Qualité | cartes Shewhart | modale | ✗ | 7/10 |
| Paramètres / Société | 19 champs | onglets | assistant absent | 6/10 |

---

## 2. Référentiel concurrentiel

| Capacité | LabWare / LabVantage / STARLIMS | BALIMS aujourd'hui | Écart |
|---|---|---|---|
| Workbench par rôle | écran « ma journée » : mes analyses, mes validations, mes retards | tableau de bord unique pour tous | **majeur** |
| Fiche objet à onglets | échantillon = fiche (résultats, historique, pièces, audit) | modale d'édition | **majeur** |
| Login sample / batch | réception en lot, arborescence parent/aliquots | échantillon simple | **majeur** |
| Saisie résultats en grille | grille type tableur, saisie clavier, contrôle limites en direct | formulaire par analyse | **majeur** |
| Spécifications & conformité | limites par produit/norme, verdict auto conforme/non conforme | limites partielles | important |
| Workflow configurable | états et transitions paramétrables par société | états codés en dur | important |
| Chain of custody | traçabilité signée de bout en bout | historique échantillon seul | moyen |
| CQ / cartes de contrôle | Shewhart, Westgard, EIL | Shewhart + EIL présents | **acquis** |
| Signature électronique | 21 CFR 11 / ISO 17025 | SHA-256 multi-niveaux présent | **acquis** |
| Étiquettes code-barres | impression à la réception | présent (A6 Code128) | **acquis** |
| Portail client | dépôt et suivi | présent | **acquis** |
| Facturation locale | rarement inclus | devis→BC→facture + Elfatoora | **avantage BALIMS** |
| Prise en main | plusieurs semaines de paramétrage | doit être immédiate | **avantage à créer** |

**Positionnement à tenir :** *le LIMS ISO 17025 qui se met en route en une journée, pas en six mois.* C'est notre différenciateur face à LabWare : rapidité, prix, adaptation locale (Tunisie / TVA 19 % / Elfatoora / arabe-français).

---

## 3. Défauts transverses

### 3.1 Navigation
- [x] `TRV-01` **P0** — Fil d'Ariane affiche l'URL brute : `BALIMS > devis`, `BALIMS > echantillons`. 20 routes n'ont pas de libellé.
- [x] `TRV-02` **P0** — 40 entrées de menu à plat, sans repli des groupes ni mémorisation.
- [ ] `TRV-03` **P1** — Pas de favoris / « épingler un module ».
- [ ] `TRV-04` **P1** — Pas de fil workflow visible (Devis → BC → … → Facture) ni de bouton « étape suivante » sur les fiches.
- [ ] `TRV-05` **P1** — Pas de « récemment consultés ».
- [ ] `TRV-06` **P2** — Ctrl+K ne cherche que clients / échantillons / factures : étendre aux devis, BC, analyses, rapports, équipements, et aux commandes (« créer un devis »).
- [ ] `TRV-07` **P1** — Aucun bouton retour sur les écrans profonds (seuls login et portail en ont un).

### 3.2 Écrans et tableaux
- [x] `TRV-10` **P0** — Pendant le chargement, le pied de tableau annonce « 0 ligne » sous des lignes squelettes : information contradictoire.
- [~] `TRV-11` **P0** — Les écrans vides n'expliquent rien : ni cause, ni action. Besoin d'un état vide utile (« Aucun devis — créez le premier / importez »).
- [x] `TRV-12` **P1** — Contenu bloqué en haut de page : sur un écran 1800 px, 80 % de vide sous le tableau. Pas de hauteur pleine ni d'en-tête de tableau collant.
- [x] `TRV-13` **P1** — Pas de sélection multiple ni d'actions groupées (imprimer étiquettes, changer statut, exporter la sélection).
- [x] `TRV-14` **P1** — Filtres non mémorisés : on perd son filtre en revenant sur l'écran.
- [ ] `TRV-15` **P1** — Pas de choix ni de réordonnancement des colonnes, pas de densité réglable.
- [ ] `TRV-16` **P2** — Pas de tri secondaire, pas de tri par défaut métier (le plus récent en premier).
- [ ] `TRV-17` **P2** — L'export CSV exporte la vue et non la sélection ; pas d'export Excel.
- [ ] `TRV-18` **P1** — Aucun écran n'est vraiment utilisable sous 768 px (tables non repliées en cartes).

### 3.3 Formulaires et modales
- [ ] `TRV-20` **P1** — Formulaires longs sans sections ni étapes (BC, facture, équipement, RH).
- [ ] `TRV-21` **P1** — Validation seulement à l'envoi ; pas de message sous le champ fautif.
- [ ] `TRV-22` **P1** — Fermeture d'une modale sans avertissement en cas de modifications non enregistrées.
- [x] `TRV-23` **P2** — Pas de raccourci d'enregistrement (Ctrl+S), pas de « enregistrer et créer le suivant ».
- [ ] `TRV-24` **P2** — Retours d'action inégaux : certains toasts, d'autres rien.

### 3.4 Données et démonstration
- [ ] `TRV-30` **P0** — 33 écrans sur 38 sont vides : ni jeu de démonstration, ni import.
- [ ] `TRV-31` **P1** — Pas d'import CSV (clients, catalogue d'analyses, produits) : reprise de l'existant impossible.
- [ ] `TRV-32` **P1** — Aucune corbeille / annulation : suppression définitive immédiate.

### 3.5 Thème et identité
- [x] `TRV-40` **P0** — États non normalisés : chaque module invente ses couleurs de statut. Besoin d'un jeu unique : *brouillon, en attente, en cours, conforme, non conforme, hors limites, expiré, clôturé*.
- [ ] `TRV-41` **P1** — Les KPI du tableau de bord se chevauchent et coupent les libellés sur deux lignes en 1280 px.
- [ ] `TRV-42` **P1** — Valeurs numériques sans hiérarchie ni unité lisible (`0,000 DT` aussi gros que le reste).
- [x] `TRV-43` **P1** — Mode sombre défini dans les tokens mais aucun sélecteur : inutilisable en salle d'analyse.
- [ ] `TRV-44` **P2** — Aucun accent laboratoire visuel : séparateurs, en-têtes de section, badges d'accréditation, marquage « donnée non validée ».
- [ ] `TRV-45` **P2** — Accessibilité : contraste des textes gris sur gris, focus clavier peu visible, cibles tactiles < 32 px.

### 3.6 Impression et documents
- [ ] `TRV-50` **P1** — Aucun aperçu avant impression : le PDF s'ouvre directement, sans possibilité de vérifier.
- [ ] `TRV-51` **P1** — Étiquettes A6 : bordure pointillée visible à l'écran, un seul format ; besoin de 2 formats (A6 flacon, 50×25 mm rouleau) et de l'impression en lot.
- [ ] `TRV-52` **P1** — Rapport ISO 17025 : vérifier pagination « page X sur Y », mention d'accréditation, portée, mention « les résultats ne concernent que les échantillons soumis », note d'incertitude.
- [ ] `TRV-53` **P1** — Facture : contrôler timbre fiscal, TVA 19 %, montant en toutes lettres, mentions légales, RIB.
- [ ] `TRV-54` **P2** — Pas de modèle de document paramétrable (en-tête/pied, mentions) par société.
- [ ] `TRV-55` **P2** — Pas d'envoi par e-mail du rapport ou de la facture depuis l'écran.

### 3.7 Paramétrage
- [x] `TRV-60` **P0** — Doublon d'écran société : la page `Paramètres` contient déjà un onglet « Société », et une seconde route `/parametres/societe` existe sans lien ni rendu propre (la page parente n'affiche pas de sous-route). Garder un seul écran.
- [ ] `TRV-61` **P1** — Pas d'assistant de première configuration (société → logo → numérotation → utilisateurs → catalogue).
- [ ] `TRV-62` **P1** — Pas d'aperçu en direct du branding sur un document.
- [ ] `TRV-63` **P1** — Numérotation paramétrable mais sans exemple de rendu.
- [ ] `TRV-64` **P2** — Pas d'écran de santé du compte (utilisateurs actifs, stockage, dernières sauvegardes).

---

## 4. Fiches par module

### 4.1 Tableau de bord — `DSH`
Rôle : point d'entrée quotidien.
- [ ] `DSH-01` **P0** — Même écran pour tous les rôles : créer un workbench par rôle (technicien : mes analyses ; chef labo : à valider ; commercial : devis en attente ; comptable : impayés).
- [ ] `DSH-02` **P1** — 8 KPI de même poids : hiérarchiser (3 majeurs + le reste en bandeau).
- [ ] `DSH-03` **P1** — Aucun indicateur de délai : ajouter « échantillons en retard », « TAT moyen », « analyses hors délai ».
- [ ] `DSH-04` **P1** — Les KPI à 0 ne renvoient pas vers une action de création.
- [ ] `DSH-05` **P2** — Graphique CA vide sur 12 mois : afficher un message plutôt qu'une grille vide.

### 4.2 Devis — `DEV`
- [ ] `DEV-01` **P1** — Pas de fiche devis : historique des révisions, relances, motif de refus.
- [ ] `DEV-02` **P1** — Pas de duplication d'un devis.
- [ ] `DEV-03` **P1** — Pas d'alerte sur devis expirés (date de validité dépassée).
- [ ] `DEV-04` **P2** — Pas de modèle de devis pré-rempli à partir d'un pack d'analyses.
- [ ] `DEV-05` **P2** — Pas d'envoi au client ni de trace « envoyé le ».

### 4.3 Bons de commande — `BCO`
- [x] `BCO-01` **P0** — Aucun bouton « planifier une mission » ou « créer les échantillons » depuis un BC : rupture du fil métier.
- [ ] `BCO-02` **P1** — Pas d'avancement visible (X analyses sur Y terminées).
- [ ] `BCO-03` **P1** — Pas de date d'échéance client ni d'alerte de retard.
- [ ] `BCO-04` **P2** — Pas de pièce jointe (bon client scanné, cahier des charges).

### 4.4 Missions — `MIS`
- [ ] `MIS-01` **P1** — Pas de vue calendrier ni de planning par préleveur.
- [ ] `MIS-02` **P1** — Pas de génération de la feuille de route depuis la mission.
- [ ] `MIS-03` **P2** — Pas de suivi terrain (heure de départ/retour, kilométrage réel, glacière/température).

### 4.5 Prélèvements — `PRE`
- [ ] `PRE-01` **P0** — Pas de création automatique de l'échantillon et de son étiquette au prélèvement.
- [ ] `PRE-02` **P1** — Pas de conditions de transport (température, délai) pourtant exigées en ISO 17025.
- [ ] `PRE-03` **P2** — Pas de photo ni de signature du client sur site.

### 4.6 Scan réception — `SCA`
- [ ] `SCA-01` **P1** — Pas de mode réception en lot (scanner 20 codes à la suite avec récapitulatif).
- [ ] `SCA-02` **P1** — Pas de contrôle de conformité à réception (température, état du contenant, quantité) : c'est le point de refus normatif.
- [ ] `SCA-03` **P2** — Pas de retour sonore/visuel fort en cas de code inconnu.

### 4.7 Échantillons — `ECH`
- [x] `ECH-01` **P0** — Pas de fiche échantillon à onglets (identité, résultats, historique, stockage, documents).
- [ ] `ECH-02` **P0** — Pas d'aliquots / sous-échantillons (parent-enfant) : indispensable en multi-analyses.
- [ ] `ECH-03` **P1** — Pas de lien direct vers l'emplacement de stockage.
- [ ] `ECH-04` **P1** — Pas de règle de conservation / destruction programmée avec rappel.

### 4.8 Plan de stockage — `STO`
- [ ] `STO-01` **P1** — Pas de recherche « où est l'échantillon X ».
- [ ] `STO-02` **P1** — Pas de glisser-déposer ni de déplacement en lot.
- [ ] `STO-03` **P2** — Températures affichées sans lien avec les sondes IoT existantes.

### 4.9 Feuilles de route — `FDR`
- [ ] `FDR-01` **P1** — Pas d'impression optimisée terrain (une page, cases à cocher, encart signature).
- [ ] `FDR-02` **P2** — Pas d'ordre de tournée ni d'estimation de trajet.

### 4.10 Analyses — `ANA`
- [x] `ANA-01` **P0** — Pas de saisie en grille multi-échantillons : c'est l'écran le plus utilisé d'un LIMS, il doit se piloter au clavier.
- [x] `ANA-02` **P0** — Pas de contrôle des limites à la saisie (verdict conforme / hors spécification immédiat).
- [ ] `ANA-03` **P1** — Pas de saisie de l'incertitude ni de la méthode utilisée par résultat.
- [ ] `ANA-04` **P1** — Pas de rattachement automatique équipement + réactif + lot au résultat (traçabilité ISO).
- [ ] `ANA-05` **P1** — Pas de reprise/répétition d'analyse tracée.

### 4.11 Packs d'analyses — `PCK`
- [ ] `PCK-01` **P1** — Pas d'application d'un pack en un clic sur un BC ou un échantillon.
- [ ] `PCK-02` **P2** — Pas de tarif de pack distinct de la somme des analyses.

### 4.12 Chaînes d'analyse — `CHA`
- [ ] `CHA-01` **P0** — Les chaînes se définissent mais ne s'exécutent pas : aucun suivi d'avancement étape par étape sur un échantillon réel.
- [ ] `CHA-02` **P1** — Pas de délai par étape ni d'alerte de dépassement.

### 4.13 Types de prélèvement — `TYP`
- [ ] `TYP-01` **P1** — Pas de liaison type ↔ analyses obligatoires ↔ contenant ↔ volume minimal.

### 4.14 Rapports — `RAP`
- [ ] `RAP-01` **P1** — Pas de rapport partiel / rapport rectificatif (version 2 avec motif).
- [ ] `RAP-02` **P1** — Pas de diffusion tracée (à qui, quand, par quel canal).
- [ ] `RAP-03` **P2** — Pas de modèle de rapport par type de client ou par norme.

### 4.15 Validations / Signature — `VAL`
- [x] `VAL-01` **P1** — Pas de file d'attente « à valider par moi » ni de validation en lot.
- [ ] `VAL-02` **P1** — Pas de motif obligatoire au refus, ni de renvoi au technicien.
- [ ] `VAL-03` **P2** — Pas de re-saisie du mot de passe au moment de signer (attendu en 17025 / 21 CFR 11).

### 4.16 Rapports métier — `RME`
- [ ] `RME-01` **P1** — Pas de sélecteur de période global ni de comparaison N-1.
- [ ] `RME-02` **P2** — Pas de graphiques : uniquement des tableaux et du CSV.

### 4.17 Clients — `CLI`
- [x] `CLI-01` **P0** — Pas de vue 360° client (devis, BC, échantillons, factures, encours, contacts, contrat) : aujourd'hui il faut ouvrir 6 modules.
- [ ] `CLI-02` **P1** — Contacts multiples et adresses de facturation/livraison distinctes absents.
- [ ] `CLI-03` **P1** — Pas de tarif négocié par client.
- [ ] `CLI-04` **P2** — Pas d'accès portail géré depuis la fiche client.

### 4.18 Produits — `PRD`
- [ ] `PRD-01` **P1** — Pas de spécifications par produit (limites réglementaires) : socle du verdict de conformité.

### 4.19 Catalogue Analyses — `CAT`
- [ ] `CAT-01` **P1** — Pas de méthode normative, délai standard, matrice applicable, accréditée oui/non par analyse.
- [ ] `CAT-02` **P1** — Pas d'import du catalogue en CSV.
- [ ] `CAT-03` **P2** — Pas de versionnage du tarif avec date d'effet.

### 4.20 Milieux de culture — `MIL`
- [ ] `MIL-01` **P1** — Pas de contrôle de stérilité / fertilité par lot préparé.
- [ ] `MIL-02` **P2** — Pas de lien avec le stock de réactifs consommés.

### 4.21 Réactifs — `REA`
- [ ] `REA-01` **P1** — Pas de décrément automatique du stock à la consommation d'une analyse.
- [ ] `REA-02` **P1** — Pas de seuil d'alerte ni de génération de demande d'achat.
- [ ] `REA-03` **P2** — Pas de fiche de données de sécurité rattachée.

### 4.22 Facturation — `FAC`
- [ ] `FAC-01` **P1** — Pas de facturation groupée mensuelle par client (usage courant en labo sous contrat).
- [ ] `FAC-02` **P1** — Pas d'échéancier ni de relance automatique.
- [ ] `FAC-03` **P1** — Vérifier le rendu du timbre fiscal et du montant en lettres sur le PDF.
- [ ] `FAC-04` **P2** — Pas de facture d'acompte.

### 4.23 Avoirs / Règlements / Comptes clients / Recouvrement — `TRE`
- [ ] `TRE-01` **P1** — Pas de rapprochement partiel d'un règlement sur plusieurs factures.
- [ ] `TRE-02` **P1** — Pas de balance âgée (30/60/90 jours) exploitable.
- [ ] `TRE-03` **P2** — Pas de courrier de relance imprimable.

### 4.24 Dépenses — `DEP`
- [ ] `DEP-01` **P2** — Pas de justificatif joint ni de catégorie analytique.

### 4.25 Équipements — `EQU`
- [ ] `EQU-01` **P1** — Pas de blocage d'usage d'un équipement hors étalonnage (exigence 17025).
- [ ] `EQU-02` **P1** — Pas de certificat d'étalonnage attaché.
- [ ] `EQU-03` **P2** — Pas d'historique de maintenance chronologique lisible.

### 4.26 Réservations équipement — `RES`
- [ ] `RES-01` **P1** — Pas de vue calendrier : une réservation sans calendrier n'a pas d'usage.
- [ ] `RES-02` **P2** — Pas de détection de conflit.

### 4.27 Sondes IoT — `SON`
- [ ] `SON-01` **P1** — Pas de courbe de température sur période ni d'export pour dossier qualité.
- [ ] `SON-02` **P1** — Alerte sans accusé de prise en charge (qui a vu, qui a agi).
- [ ] `SON-03` **P2** — Pas de rattachement sonde ↔ emplacement de stockage.

### 4.28 RH & Paie — `RHU`
- [ ] `RHU-01` **P1** — Pas de lien compétence ↔ droit d'exécuter une analyse (habilitation bloquante).
- [ ] `RHU-02` **P2** — Pas de bulletin imprimable ni de suivi des congés visuel.

### 4.29 Formations & habilitations — `FOR`
- [ ] `FOR-01` **P1** — Alerte d'expiration présente mais non remontée dans le tableau de bord ni en notification.

### 4.30 Projets — `PRJ`
- [ ] `PRJ-01` **P2** — Gantt non relié aux BC/analyses réels : reste décoratif.

### 4.31 Qualité — `QUA`
- [ ] `QUA-01` **P1** — NC non rattachables à un échantillon, une analyse ou un équipement précis.
- [ ] `QUA-02` **P1** — Pas de revue de direction ni de plan d'audit annuel.
- [ ] `QUA-03` **P2** — Pas de gestion documentaire (procédures, versions, accusés de lecture).

### 4.32 Contrôle qualité — `CQU`
- [ ] `CQU-01` **P1** — Règles de Westgard absentes (seul le hors-limites simple est détecté).
- [ ] `CQU-02` **P2** — Pas de rattachement d'une dérive CQ à une NC automatique.

### 4.33 Paramètres — `PAR`
- [x] `PAR-01` **P0** — Écran société en double (voir `TRV-60`).
- [ ] `PAR-02` **P1** — Pas d'éditeur de workflow par société (états, transitions, obligations) alors que c'est une promesse produit.
- [ ] `PAR-03` **P1** — Droits par rôle non paramétrables dans l'écran.
- [ ] `PAR-04` **P2** — Journal d'audit non filtrable par utilisateur/objet/période.

### 4.34 Portail client — `POR`
- [ ] `POR-01` **P1** — Pas de dépôt de demande d'analyse depuis le portail.
- [ ] `POR-02` **P1** — Pas de suivi d'avancement échantillon côté client.
- [ ] `POR-03` **P2** — Pas de notification e-mail à la publication d'un rapport.

---

## 5. Tests de bout en bout à rejouer

| # | Scénario | Attendu | Statut |
|---|---|---|---|
| `E2E-1` | Nouvelle société : inscription → paramétrage → premier client → premier devis | < 15 min sans aide | [ ] |
| `E2E-2` | Devis → BC → mission → prélèvement → étiquette → réception scan → analyse → validation → rapport → facture | zéro passage par le menu | [ ] |
| `E2E-3` | Réception de 20 échantillons en lot avec impression des étiquettes | < 5 min | [ ] |
| `E2E-4` | Saisie de 50 résultats au clavier avec contrôle de limites | sans souris | [ ] |
| `E2E-5` | Refus de validation → correction technicien → re-validation | traçabilité complète | [ ] |
| `E2E-6` | Facture + XML Elfatoora + règlement partiel + relance | montants justes | [ ] |
| `E2E-7` | Dérive de température sonde → alerte → NC → action corrective | chaîne complète | [ ] |
| `E2E-8` | Parcours client sur le portail : consulter, télécharger, demander | sans formation | [ ] |
| `E2E-9` | Tous les écrans en 375 px | utilisable | [ ] |
| `E2E-10` | Impression réelle : étiquette, rapport, facture, feuille de route | conforme au papier | [ ] |

---

## 6. Ordre d'exécution recommandé

1. **Lot 1 — Fondations UX** : `TRV-01`, `TRV-02`, `TRV-04`, `TRV-10`, `TRV-11`, `TRV-40`, `TRV-41`, `TRV-60`, `TRV-30`.
2. **Lot 2 — Thème laboratoire** : `TRV-42` à `TRV-45`, densité, mode sombre, badges d'état normalisés.
3. **Lot 3 — Fiches objet** : `ECH-01`, `CLI-01`, `BCO-01`, `DEV-01`.
4. **Lot 4 — Cœur analytique** : `ANA-01`, `ANA-02`, `ANA-04`, `CHA-01`, `VAL-01`.
5. **Lot 5 — Réception et terrain** : `SCA-01`, `SCA-02`, `PRE-01`, `FDR-01`, `TRV-51`.
6. **Lot 6 — Commercial et trésorerie** : `FAC-01`, `FAC-02`, `TRE-01`, `TRE-02`.
7. **Lot 7 — Qualité, équipements, CQ** : `EQU-01`, `CQU-01`, `QUA-01`, `SON-01`.
8. **Lot 8 — Paramétrage et impression** : `TRV-50` à `TRV-55`, `PAR-02`, `TRV-61`.

---

## 7. Journal d'avancement

| Date | Points traités | Note |
|---|---|---|
| 2026-08-03 | Audit initial des 38 écrans | création du fichier |
| 2026-08-03 | `TRV-01`, `TRV-10` | libellés du fil d'Ariane complétés ; pied de tableau silencieux pendant le chargement |


### Journal — Lot 1 (transverse)
- 4 août 2026 : TRV-02 (menu repliable + filtre, état mémorisé), TRV-12 (en-tête de tableau collant, zone scrollable), TRV-13 (sélection multiple + actions groupées), TRV-14 (recherche mémorisée par écran), TRV-40 (vocabulaire d'états normalisé + `statutLabel`), TRV-43 (bascule thème clair/sombre dans l'en-tête). TRV-11 : socle prêt (`emptyState` dans `DataTable`), à câbler module par module.

### Journal — Lot 2/3 (fiches objet et paramétrage)
- `TRV-01` libellés du fil d'Ariane complétés pour toutes les routes.
- `TRV-10` plus de « 0 ligne » pendant le chargement.
- `TRV-60` route doublon `/parametres/societe` supprimée : un seul écran Société dans Paramètres.
- `CLI-01` vue 360° client (KPI facturé / encaissé / encours / retards + onglets devis, commandes, factures, règlements, identité et actions rapides).
- `ECH-01` fiche échantillon à onglets (identité, stockage, analyses liées, traçabilité chronologique).
