---
"@creezio/platform-core": minor
"@creezio/shell-ui": minor
"@creezio/assistant": minor
"@creezio/browser-host": minor
"@creezio/factory": minor
"@creezio/shell": minor
"@creezio/host-runtime": minor
---

H13 — résidu allowlist runtime (ARCHITECTURE_VERSION H12 → H13, convention 0.x : minor comme H10/H11/H12).

- Crash env : plus de dual-read `TF2_*` / `CERTIVAN_*` / `FIDU_*` / `TEMPOFLOW3_*` — `CREEZIO_*` + scan `envKey`.
- `envForNodeScriptSpawn` : plus d'heuristique packagée nommée marque.
- UI kit : `creezio-fake-cursor`, `creezio-titlebar-*`, cache SW `creezio-shell-*`.
- Codemods `scripts/codemods/H13/` (`since: 0.26.0`), appliqués par `creezio upgrade`.
