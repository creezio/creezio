# Expérience TempoFlow3 — prouver l’OS Creezio

## Intention

Donner des **prompts produit** (cadre + mini-PRDs par onglet), **sans code
à coller**, et obtenir une app TempoFlow3 :

- repo marque **léger** (métier seulement) ;
- capacités **lourdes** via creezio (auth, desktop, assistant, tasks, mails,
  plugins, tunnel, MCP…).

Si l’agent doit tricher (copier tempoflow2) ou digérer un roman technique →
**c’est creezio à corriger**.

## Chemin agent (à utiliser)

1. **[HISTORIQUE-PROMPTS.md](./HISTORIQUE-PROMPTS.md)** — suite ordonnée des
   prompts (0 cadre → 1 bootstrap → 2…12 mini-PRDs → 13 audit).
2. **[mini-prds/](./mini-prds/)** — un mini-PRD précis par onglet / module.
3. **[JOURNAL-CREATION.md](./JOURNAL-CREATION.md)** — ce qui a déjà été exécuté.
4. **[PRD-PRODUIT.md](./PRD-PRODUIT.md)** + **[PROMPT-PRODUIT.md](./PROMPT-PRODUIT.md)**
   — brief global non technique.

## État actuel

| Étape | Statut |
|-------|--------|
| Factory `--from-prd` (F0–F5) | ✅ dans creezio |
| Prompt 0–1 (cadre + bootstrap) | ✅ `apps/tempoflow3` + smokes verts |
| Prompts 2–12 (enrichissement onglets) | ⏳ mini-PRDs prêts, à enchaîner |
| Prompt 13 (audit allowlist / oracle) | ⏳ |

Bootstrap déjà joué :

```bash
creezio new-app \
  --from-prd docs/experiences/tempoflow3/PRD-PRODUIT.md \
  --out apps/tempoflow3 --force
cd apps/tempoflow3 && npm run test:metier-parcours
```

## Deux références (ne pas mélanger)

| Dimension | Référence | Rôle |
|-----------|-----------|------|
| **Capacités** | TempoFlow **0.10.26** | Oracle produit |
| **Forme** | tip kit `@creezio/*` (clean) | Architecture cible |

## Documents

| Fichier | Rôle |
|---------|------|
| [HISTORIQUE-PROMPTS.md](./HISTORIQUE-PROMPTS.md) | **Playbook prompts** |
| [mini-prds/](./mini-prds/) | Mini-PRDs par onglet |
| [JOURNAL-CREATION.md](./JOURNAL-CREATION.md) | Suivi d’exécution |
| [ORACLE-0.10.26.md](./ORACLE-0.10.26.md) | Checklist capacités |
| [ALLOWLIST.md](./ALLOWLIST.md) | Ce qui a le droit d’exister |
| [AUDIT-BRIEF-PRODUIT.md](./AUDIT-BRIEF-PRODUIT.md) | Audit factory F0–F5 |
| [PROMPTS.md](./PROMPTS.md) | Ancien plan ingénieur P0–P12 (filet, pas happy path) |
| [RAPPORT-TEMPLATE.md](./RAPPORT-TEMPLATE.md) | Rapport final |

## Anti-patterns (invalident l’expérience)

1. Cloner `tempoflow2` puis effacer des dossiers.  
2. Coller du code oracle 0.10.26 dans la marque.  
3. Enrichir le prompt avec `host-stack` / sync-vendor pour « débloquer ».  
4. Mettre des launchers OS dans `apps/tempoflow3`.
