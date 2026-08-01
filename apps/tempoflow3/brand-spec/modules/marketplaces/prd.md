# Mini-PRD — Marketplaces & référentiels

**Onglets** : Marketplaces / Secteurs / Agrégateurs / Data-mapping  
**Routes** : `/marketplaces`, `/secteurs`, `/agregateurs`, `/data-mapping`  
**Dépend** : Fournisseurs, Produits

## Problème

Au-delà de « mes fournisseurs », l’acheteur organise le marché
(enseignes, secteurs, sources agrégées) et aligne les libellés produits.

## Comportement attendu (MVP progressif)

1. **Marketplaces** : liste d’enseignes / places de marché liées à des
   fournisseurs ou sources.
2. **Secteurs** : classification (ex. fruits, viande, boissons) pour filtrer
   le catalogue.
3. **Agrégateurs** : sources qui regroupent plusieurs offres (fiche + lien).
4. **Data-mapping** : associer un libellé fournisseur ↔ produit interne
   pour fiabiliser prix / panier.

Livrer d’abord Marketplaces + Secteurs ; Agrégateurs / Data-mapping ensuite
si le temps le permet dans le même prompt — sinon découper.

## Critère de done

- Au moins Marketplaces + Secteurs navigables et liés au catalogue.
- Data-mapping : une association testable qui impacte la résolution produit.
