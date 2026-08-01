# Journal de création TempoFlow3

## Règle d’évaluation

TempoFlow3 prouve que **creezio + sa doc** suffisent pour créer une app
from scratch. Interdit : coller tempoflow2 ; s’appuyer sur un template kit
qui dump déjà tout le métier TempoFlow.

| Étape | Statut | Notes |
|-------|--------|-------|
| P8 — retrait `templates/chr` | ✅ | anti-triche |
| Prompt 1 — bootstrap cœur générique | ✅ | 5 entités, CRUD factory |
| Prompt 2 — Fournisseurs | ✅ | archive + `?q=` + `?archived=` |
| Prompt 3 — Produits | ✅ | rattachement fournisseur + filtres |
| Prompt 4 — Prix | ✅ | historique inserts + promo |
| Prompt 5 — Panier | ✅ | totaux / sous-totaux / prérempli tarif |
| Prompt 6 — Commandes | ✅ | from-panier + statuts MVP |
| Prompts 7+ — modules bonus | ⏳ | optimiser, stack, scan… un par un |

---

## Raisonnement Prompt 1

1. PRD = succès « fournisseurs → prix → panier → commande ».
2. Factory parse → ProductModel **5 entités** (pas 12 oracle).
3. Générateurs **génériques** → SQL/API/UI CRUD + OS kit.
4. Assert : aucun `optimiser/suggest` / `scan/start` / `templates/chr`.
5. `npm test` smokes OS + parcours cœur verts.

## Raisonnement Prompts 2–6 (marque)

Sans lire tempoflow2. Sources : mini-PRDs + schéma déjà généré (`archived_at`
présent pour fournisseurs/produits).

| Mini-PRD | Décision d’implémentation |
|----------|---------------------------|
| 01 Fournisseurs | Soft-archive `POST …/archive` ; liste `?archived=0\|1\|all` ; recherche `?q=` sur nom/contact/email. DELETE hard refusé (`use_archive`). |
| 02 Produits | Même archive ; filtre `?fournisseur_id=` ; nom obligatoire. |
| 03 Prix | Chaque POST = nouveau relevé (historique) ; filtres produit/fournisseur ; `?promo=1` ; champ `promo_fin` en SQL. |
| 04 Panier | GET renvoie `{ items, total_ht, by_fournisseur }` ; si `prix_unitaire` omis → dernier tarif connu. |
| 05 Commandes | `from-panier` fige les lignes, vide le panier du fournisseur ; PATCH statut ∈ `{brouillon,envoyee,recue}`. |

Fichiers marque touchés (écrits / enrichis, pas régénérés depuis un dump) :

- `scripts/metier-api.mjs`
- `scripts/test-mini-prd-core.mjs`
- `crm/src/brand/schema.sql` (`promo_fin`)
- `resources/renderer/index.html`

## Preuve

```bash
# Prompt 1 clean-room
rm -rf apps/tempoflow3
creezio new-app --from-prd docs/experiences/tempoflow3/PRD-PRODUIT.md \
  --out apps/tempoflow3 --force
cd apps/tempoflow3 && npm test   # cœur générique

# Puis (cette itération) enrichissements mini-PRDs 01–05 + 
# npm run test:mini-prd-core
```
