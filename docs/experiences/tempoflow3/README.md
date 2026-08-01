# Expérience TempoFlow3 — prouver l’OS Creezio

## Intention

Recréer **TempoFlow** dans un nouveau repo `tempoflow3` en partant :

1. du kit **`creezio`** (natif / OS) ;
2. d’un **PRD / cahier des charges** structuré ;
3. d’une **suite de prompts** numérotés et rejouables.

Objectif : vérifier que l’OS permet de reconstruire une marque **métier-only**
dont le comportement applicatif égale au minimum la baseline qui **fonctionnait
parfaitement avant le grand refactor kit**.

## Oracle (référence absolue)

| Champ | Valeur |
|-------|--------|
| Repo | `creezio/tempoflow2` |
| Version | **0.10.26** |
| Tag | `v0.10.26` |
| Commit | `e36e4d0e94d19e939343e6d7baac62087a0c39a5` |
| Date | 27 juillet 2026 |
| Note | **Aucun** `@creezio/*` dans ce tip — monolithe desktop qui marchait |

**Ne pas** prendre `0.10.33` (30 juil., post-refactor) comme oracle.
`0.10.33` peut servir de comparaison secondaire « état kit actuel », jamais de
critère de succès de l’expérience.

Checklist détaillée : [ORACLE-0.10.26.md](./ORACLE-0.10.26.md).

## Ce que l’expérience prouve (ou infirme)

| Si… | Alors… |
|-----|--------|
| `tempoflow3` passe les gates oracle 0.10.26 avec code marque = métier + wiring mince | l’OS est suffisant pour une marque TempoFlow |
| un prompt est forcé d’ajouter du natif dans `tempoflow3` | **gap kit** → ticket creezio, pas « on copie TF2 » |
| parity UI/API métier OK mais `test:shell` incomplet | OS partiel — documenter les trous |

Hors scope de l’expérience :

- améliorations d’architecture imaginées pendant le refactor (P*, N*, intention…) ;
- parity avec `0.10.33` ;
- Fidu / Certivan ;
- republish Windows production.

## Documents

| Fichier | Rôle |
|---------|------|
| [ORACLE-0.10.26.md](./ORACLE-0.10.26.md) | Surfaces, pages, `test:shell`, métier à égaler |
| [PRD.md](./PRD.md) | Cahier des charges TempoFlow3 |
| [PROMPTS.md](./PROMPTS.md) | Suite de prompts P0…P12 (textes prêts) |
| [ALLOWLIST.md](./ALLOWLIST.md) | Ce qui a le droit d’exister dans tempoflow3 |
| [RAPPORT-TEMPLATE.md](./RAPPORT-TEMPLATE.md) | Trame du rapport final |

## Déroulement

```text
Oracle 0.10.26 figé
        ↓
PRD + PROMPTS (ce dossier)
        ↓
P0–P5   OS monté depuis creezio
        ↓ gates OS (sous-ensemble test:shell 0.10.26)
P6–P10  Métier TempoFlow injecté
        ↓ gates métier 0.10.26
P11     Parity checklist oracle
        ↓
P12     Audit allowlist + RAPPORT
```

## Anti-patterns (invalident l’expérience)

1. Cloner `tempoflow2@main` / `0.10.33` puis effacer des dossiers.  
2. Copier des fichiers natifs depuis `0.10.26` au lieu de consommer `@creezio/*`.  
3. Changer l’oracle en cours de route.  
4. « Ça compile » sans rejouer les gates listées dans l’oracle.
