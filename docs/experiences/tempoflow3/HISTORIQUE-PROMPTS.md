# Historique des prompts — création TempoFlow3 (sans triche)

Ce document est la **suite exacte des messages** à envoyer à un agent, dans
l’ordre, pour obtenir TempoFlow3.

**Règle anti-triche**

- On ne colle **jamais** de code source TempoFlow2 / 0.10.26.
- On ne dit pas « copie `crm/lib/commande-queries.ts` ».
- On décrit le **produit** ; l’agent s’appuie sur **creezio**
  (`new-app --from-prd`, packages `@creezio/*`, générateurs).
- Si l’agent est bloqué faute de générique → **corriger creezio**, pas le prompt.
- Le repo marque reste **léger** : métier + wiring mince. Le lourd
  (auth, fenêtre, MAJ, assistant, tâches, mails, plugins, tunnel, MCP…)
  vient de l’OS.

**Références**

| Rôle | Fichier |
|------|---------|
| Brief global | [PRD-PRODUIT.md](./PRD-PRODUIT.md) |
| Prompt 0 (cadre) | ci-dessous + [PROMPT-PRODUIT.md](./PROMPT-PRODUIT.md) |
| Mini-PRDs onglets | [mini-prds/](./mini-prds/) |
| Capacités cibles | [ORACLE-0.10.26.md](./ORACLE-0.10.26.md) |
| Allowlist repo | [ALLOWLIST.md](./ALLOWLIST.md) |
| Journal d’exécution | [JOURNAL-CREATION.md](./JOURNAL-CREATION.md) |

---

## Prompt 0 — Cadre général (OS + intention)

*Envoyé en premier. Fixe le contrat. Aucun détail d’onglet.*

```text
Tu travailles pour créer TempoFlow3, une application bureau pour les
restaurateurs et responsables d’achats CHR.

CADRE (non négociable) :
1. Plateforme = repo creezio (@creezio/*). Tout ce qui est générique
   (compte, setup, fenêtre desktop, mises à jour, assistant, tâches, mails,
   extensions/plugins, MCP, tunnel, recherche embarquée…) doit venir de
   Creezio — pas être réécrit dans TempoFlow3.
2. TempoFlow3 est un repo / dossier MARQUE LÉGER : uniquement le métier
   restaurateur (fournisseurs, catalogue, prix, panier, commandes, et les
   modules listés plus tard) + le minimum de câblage pour brancher l’OS.
3. Interdit de coller ou de recopier du code depuis tempoflow2 ou une
   ancienne version pour « aller plus vite ». Si un générique manque,
   tu améliores creezio (factory, packages), puis tu régénères / étends
   la marque.
4. Commande de bootstrap produit (quand on te le demandera) :
   creezio new-app --from-prd <PRD> --out <tempoflow3>
5. Les prochains messages te donneront un CADRE puis des MINI-PRD
   module par module (un onglet à la fois). Tu enrichis l’app
   progressivement. Pas de big-bang.
6. Critère de succès global : parcours fournisseurs → prix → panier →
   commande fonctionne ; le repo marque reste allowlist-métier ; les
   capacités lourdes tournent grâce à l’OS.

Confirme que tu as compris le cadre. N’écris pas encore de code métier
hors ce que la factory produit au Prompt 1.
```

---

## Prompt 1 — Bootstrap depuis le PRD produit

*Crée le squelette + cœur CHR via la factory.*

```text
À partir du cadre confirmé, crée TempoFlow3 maintenant.

Utilise uniquement :
- creezio/docs/experiences/tempoflow3/PRD-PRODUIT.md
- la factory creezio : new-app --from-prd

Commande attendue (adapte le chemin out si besoin) :
  creezio new-app \
    --from-prd docs/experiences/tempoflow3/PRD-PRODUIT.md \
    --out apps/tempoflow3 \
    --force

Ensuite :
1. Lance le smoke métier généré (test:metier-parcours).
2. Vérifie que brandId = tempoflow3 (pas tempoflow réservé).
3. Vérifie que le dossier marque ne contient pas de launchers OS
   recopiés (Hermes/n8n/Meili/updater maison) — ça doit venir du kit.
4. Résume ce qui est généré (entities, pages, smokes) sans inventer
   de modules hors PRD.

Ne lis pas / ne copie pas le code métier de tempoflow2 pour cette étape.
```

**Statut** : ✅ exécuté (et prompts 2–13 enchaînés) — voir
[JOURNAL-CREATION.md](./JOURNAL-CREATION.md), [RAPPORT.md](./RAPPORT.md),
[PROBLEMES.md](./PROBLEMES.md).

---

## Prompt 2 — Mini-PRD Fournisseurs

*Fichier détail : [mini-prds/01-fournisseurs.md](./mini-prds/01-fournisseurs.md)*

```text
Enrichis TempoFlow3 avec l’onglet / module Fournisseurs.

Lis et applique le mini-PRD :
  creezio/docs/experiences/tempoflow3/mini-prds/01-fournisseurs.md

Rappels :
- Décris le comportement produit demandé dans ce mini-PRD.
- Implémente le métier dans le repo marque ; réutilise auth, shell, DB
  isolation, nav shell-ui, API kernel depuis creezio.
- Si la factory / un générateur creezio doit être étendu pour ce module
  (plutôt que du one-shot marque), préfère étendre creezio.
- Pas de copie de fichiers depuis tempoflow2.
- Smoke : créer / lister / archiver un fournisseur ; fiche détail.

Quand c’est vert, arrête-toi. N’attaque pas le module suivant.
```

---

## Prompt 3 — Mini-PRD Produits (catalogue)

*Fichier : [mini-prds/02-produits.md](./mini-prds/02-produits.md)*

```text
Enrichis TempoFlow3 avec l’onglet Produits / catalogue.

Mini-PRD :
  creezio/docs/experiences/tempoflow3/mini-prds/02-produits.md

Même règles anti-triche. Smoke : produit lié à un fournisseur, liste,
fiche. Stop avant Prix.
```

---

## Prompt 4 — Mini-PRD Prix & promotions

*Fichier : [mini-prds/03-prix.md](./mini-prds/03-prix.md)*

```text
Enrichis TempoFlow3 avec Prix (et promotions si le mini-PRD le demande).

Mini-PRD :
  creezio/docs/experiences/tempoflow3/mini-prds/03-prix.md

Smoke : enregistrer un tarif, voir une évolution / promo simple.
Stop avant Panier.
```

---

## Prompt 5 — Mini-PRD Panier

*Fichier : [mini-prds/04-panier.md](./mini-prds/04-panier.md)*

```text
Enrichis TempoFlow3 avec le Panier.

Mini-PRD :
  creezio/docs/experiences/tempoflow3/mini-prds/04-panier.md

Smoke : ajouter des lignes, quantités, total ; vider / modifier.
Stop avant Commandes.
```

---

## Prompt 6 — Mini-PRD Commandes

*Fichier : [mini-prds/05-commandes.md](./mini-prds/05-commandes.md)*

```text
Enrichis TempoFlow3 avec Commandes (création depuis panier + historique).

Mini-PRD :
  creezio/docs/experiences/tempoflow3/mini-prds/05-commandes.md

Smoke obligatoire bout-en-bout :
  fournisseurs → prix → panier → commande
Réutilise / étends test:metier-parcours. Stop avant Optimiser.
```

---

## Prompt 7 — Mini-PRD Optimiser

*Fichier : [mini-prds/06-optimiser.md](./mini-prds/06-optimiser.md)*

```text
Enrichis TempoFlow3 avec Optimiser (aide au choix fournisseur / panier).

Mini-PRD :
  creezio/docs/experiences/tempoflow3/mini-prds/06-optimiser.md

Pas de moteur inventé hors besoin produit. Si un service générique
(scoring, jobs) manque dans creezio, ticket kit. Stop ensuite.
```

---

## Prompt 8 — Mini-PRD Mes produits (stack)

*Fichier : [mini-prds/07-stack.md](./mini-prds/07-stack.md)*

```text
Enrichis TempoFlow3 avec « Mes produits » (stack / sélection habituelle).

Mini-PRD :
  creezio/docs/experiences/tempoflow3/mini-prds/07-stack.md
```

---

## Prompt 9 — Mini-PRD Relevés

*Fichier : [mini-prds/08-releves.md](./mini-prds/08-releves.md)*

```text
Enrichis TempoFlow3 avec Relevés de prix.

Mini-PRD :
  creezio/docs/experiences/tempoflow3/mini-prds/08-releves.md
```

---

## Prompt 10 — Mini-PRD Scan

*Fichier : [mini-prds/09-scan.md](./mini-prds/09-scan.md)*

```text
Enrichis TempoFlow3 avec Scan (saisie / capture assistée).

Mini-PRD :
  creezio/docs/experiences/tempoflow3/mini-prds/09-scan.md

L’assistant / captures génériques = creezio ; le flux métier scan =
marque.
```

---

## Prompt 11 — Mini-PRD Tableau de bord

*Fichier : [mini-prds/10-dashboard.md](./mini-prds/10-dashboard.md)*

```text
Enrichis TempoFlow3 avec le Dashboard métier (pas un cockpit OS).

Mini-PRD :
  creezio/docs/experiences/tempoflow3/mini-prds/10-dashboard.md

Login / setup / cockpit serveur restent 100 % OS creezio.
```

---

## Prompt 12 — Mini-PRD Marketplaces & référentiels

*Fichier : [mini-prds/11-marketplaces.md](./mini-prds/11-marketplaces.md)*

```text
Enrichis TempoFlow3 avec marketplaces / secteurs / agrégateurs /
data-mapping (périmètre du mini-PRD uniquement).

Mini-PRD :
  creezio/docs/experiences/tempoflow3/mini-prds/11-marketplaces.md
```

---

## Prompt 13 — Fermeture : allowlist + parity capacités

```text
Temps de l’audit final TempoFlow3 — sans ajouter de features.

1. Lis creezio/docs/experiences/tempoflow3/ALLOWLIST.md
   et vérifie que le repo marque ne contient que métier + wiring mince.
2. Lis ORACLE-0.10.26.md : coche ce qui est couvert vs restant (F6).
3. Relance les smokes métier + first-run.
4. Rédige le rapport (template RAPPORT-TEMPLATE.md) :
   - ce qui vient de creezio (lourd / OS)
   - ce qui est dans tempoflow3 (léger / métier)
   - gaps kit restants (tickets, pas de copies)

Si tu trouves du code OS recopié dans la marque : déplace-le vers
creezio ou génère-le depuis la factory, puis nettoie la marque.
```

---

## Ordre résumé

| # | Prompt | Livrable |
|---|--------|----------|
| 0 | Cadre général | Contrat OS / anti-triche |
| 1 | Bootstrap PRD | `apps/tempoflow3` + smoke CHR |
| 2 | Fournisseurs | Module onglet |
| 3 | Produits | Module onglet |
| 4 | Prix | Module onglet |
| 5 | Panier | Module onglet |
| 6 | Commandes | Parcours bout-en-bout |
| 7 | Optimiser | Module |
| 8 | Stack | Module |
| 9 | Relevés | Module |
| 10 | Scan | Module |
| 11 | Dashboard | Module |
| 12 | Marketplaces… | Module |
| 13 | Audit | Allowlist + rapport |

Les prompts **2–12** sont volontairement monotâche : un onglet = un tour
agent = un mini-PRD.
