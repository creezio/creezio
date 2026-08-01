# Mini-PRD — Dashboard métier

**Onglet** : Accueil / Dashboard  
**Route** : `/dashboard`  
**Dépend** : modules cœur

## Problème

En ouvrant l’app, l’acheteur veut savoir quoi faire maintenant — pas un
cockpit technique serveur.

## Comportement attendu

1. Vue d’accueil métier : raccourcis Fournisseurs, Panier, Commandes.
2. Indicateurs simples : nb fournisseurs actifs, lignes panier, dernières
   commandes, alertes prix / promos récentes si dispo.
3. Pas de stats infra (CPU, plugins, tunnel) — ça vit dans le cockpit OS
   creezio.
4. Une phrase d’orientation (« Continuer mon panier », « Voir les promos »).

## Critère de done

- Dashboard lisible en 5 secondes ; liens vers les onglets métier.
