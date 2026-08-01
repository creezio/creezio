# Mini-PRD — Fournisseurs

**Onglet** : Fournisseurs  
**Route** : `/fournisseurs` (+ fiche `/fournisseurs/[id]`)  
**Public** : chef / acheteur CHR

## Problème

Les contacts et infos fournisseurs sont éparpillés (mails, favoris navigateur,
Excel). Il faut un annuaire local fiable.

## Comportement attendu

1. Liste des fournisseurs (nom, contact, statut actif/archivé).
2. Créer / modifier une fiche : nom (obligatoire), contact, email, téléphone,
   notes, site web éventuel.
3. Archiver sans supprimer l’historique lié (commandes passées restent
   consultables).
4. Recherche rapide par nom.
5. Depuis une fiche : accès aux produits / prix liés (navigation métier).

## Hors scope (OS creezio)

Compte utilisateur, fenêtre, sync cloud obligatoire, plugins génériques.

## Critère de done

- Créer 2 fournisseurs, en archiver 1, le retrouver en filtre « archivés ».
- Aucun launcher OS ajouté dans le repo marque pour cette feature.
