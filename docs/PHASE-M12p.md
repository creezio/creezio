# Phase M12p — main.ts marques via façade kit

| | |
|--|--|
| **Statut** | ✅ **Certivan + Fidu** |
| **Date** | 2026-07-30 |
| **ARCHITECTURE_VERSION** | `"H6"` |
| **Republish** | Fidu oui (retrait Paperclip packing) |

`installBrandDesktopRuntime` sur Certivan + Fidu ; `main.ts` ≤ 800 LOC.
**Paperclip retiré** — aucun hook kit / aucune surface Fidu.

| Marque | LOC | SHA |
|--------|----:|-----|
| Certivan | 320 | `15ae995` |
| Fidu | ~303 | `9f139f2` |
| kit | — | `812d6df` |

Gates: `node scripts/test-phase-m12p.mjs` ; Fidu `electron:compile` + `test:shell`.
Suite: **M13**.
