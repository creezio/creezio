# Phase O4p — Cutover `assistant-chat` (TF → CV → Fidu)

| | |
|--|--|
| **Statut** | ✅ **Sign-off** (gates verts) |
| **Date** | 2026-07-30 |
| **Repo** | `creezio/creezio` (+ marques) |
| **Prérequis** | [PHASE-O4.md](PHASE-O4.md) · plan [PLAN-O.md](PLAN-O.md) |
| **Baseline O4 kit tip** | `f06577b` / pin `dc6e0b1` · fix supplier `8b3ffb0` |
| **Kit tip O4p** | `4274edc` |
| **ARCHITECTURE_VERSION** | `"H6"` (inchangé) |
| **Republish** | Non |

### SHAs marques (gold O4p)

| Marque | SHA |
|--------|-----|
| TempoFlow | `92a03f3` |
| Certivan | `1e97e72` |
| Fidu | `f6d0fb8` |

---

## Objectif

**0** `src/server/assistant-chat.ts` local ×3 ; mounts chat importent
`handleAssistantChat` depuis `@creezio/assistant` ; métier via
`brand-chat-tools` + `configureAssistantBrand`. Vendor liste complète
(kit tip O4 / `8b3ffb0`). **Paperclip = mort**. **Façades = NON done**.

---

## Deletes

| Fichier | TF | CV | Fidu |
|---------|----|----|------|
| `src/server/assistant-chat.ts` | ✅ | ✅ | ✅ |

---

## Wiring marque

| Surface | SoT | Brand |
|---------|-----|-------|
| `handleAssistantChat` / SSE / tools plateforme | `@creezio/assistant` | — |
| Auth session | kit `auth.getSession` | `getSession` → brand-config |
| Métier tools | `tools.executeTool` | `lib/assistant/brand-chat-tools.ts` |
| `get_entity` sources | `tools.entitySources` | kinds TF/CV/Fidu |
| Work Hermes | `hermes.workSkills` / `sessionIdPrefix` | TF `tf2-crm` · CV `certivan-crm` · Fidu `fidu-crm` |
| Mount chat | `routes/assistant.ts` | `import { handleAssistantChat } from "@creezio/assistant"` |

### Métier resté marque (`brand-chat-tools`)

| Marque | Tools |
|--------|-------|
| TF | `add_to_cart`, `set_statut`, `create_task`, `list_tasks` + entitySources catalogue |
| CV | idem schéma + entitySources dossier/véhicule/pièce |
| Fidu | `create_todo`, `list_todos`, `accounting_query`, `open_external_tab` + entitySources CRM |

---

## Gates

```bash
# ×3 marques
bash scripts/electron/sync-creezio-vendor.sh   # liste complète
npm run test:assistant-routing
npm run test:active-surface

# Kit
cd /opt/docker/creezio && npm test   # incl. test-phase-o4p
```

### Gate `test-phase-o4p`

- Absents ×3 : `src/server/assistant-chat.ts`
- Présents ×3 : `brand-chat-tools.ts`, import kit dans `routes/assistant.ts`
- `handleAssistantChat` exporté kit ; Paperclip mort
- PLAN-O O4p livré + SHAs marques

---

## Done

| Critère | Preuve |
|---------|--------|
| Cutover TF+CV+Fidu poussé | SHAs ci-dessus |
| 0 jumeau `assistant-chat.ts` ×3 | ✅ |
| Vendor kit tip O4 (+ fix) | ✅ `8b3ffb0` |
| Gates routing / active-surface ×3 | ✅ |
| `test-phase-o4p` | ✅ |
| Republish packing | Non |

---

## Suite

**O5** — Admin request-logs / api-endpoints → kit.
