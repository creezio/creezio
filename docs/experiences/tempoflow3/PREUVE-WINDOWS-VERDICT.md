# Verdict Windows TempoFlow3 — 2026-08-01

## Demande

> App TempoFlow3 Windows buildée, testée de bout en bout, avec toutes les fonctionnalités TempoFlow2, architecture kit `@creezio/*`.

## Verdict

**NON PROUVÉ** pour un E2E Windows réel.

Ce pod est **Linux**. Il n’y a pas d’hôte Windows distant configuré pour `tempoflow3` (`desktop-tooling` ne connaît que `tempoflow`, `certivan`, `fidu`, `demobrand`). On ne peut donc **pas** installer/lancer/valider l’app sous Windows ici.

## Ce qui EST produit / prouvé

| Item | Statut | Preuve |
|------|--------|--------|
| Architecture mince (`startBrandDesktop`, pas host-stack marque) | OK | `proof:hard` arch.* |
| Métier + OS harness E2E (Linux) | OK | **`proof:hard` 81/81** |
| Oracle pages/API vs TF2 0.10.26 | OK | **`proof:oracle` 37/37** |
| Suite `npm test` TF3 | OK | metier + mini-prd + setup/login + meili + smoke profile |
| MCP OAuth/admin loopback | OK | `test-os-mcp-oauth` |
| Electron smoke xvfb (Linux) | OK | wiring + launch |
| Artefact Windows **zip** cross-compilé | PARTIEL | `TempoFlow-Setup-0.1.0.zip` (318 Mo) + `TempoFlow.exe` PE32+ |
| `better-sqlite3` natif win32 dans le zip | OK | PE32+ DLL |
| Installer NSIS `.exe` Setup | ÉCHEC | wine/NSIS instable sur ce Linux (wine32/X) |
| Binaires kit Meili/cloudflared **Windows** dans le pack | **ÉCHEC** | le pack embarque des binaires **ELF Linux** |
| E2E runtime sous Windows OS | **NON FAIT** | pas de machine Windows |

## Artefacts

- `/opt/cursor/artifacts/tempoflow3-windows/TempoFlow-Setup-0.1.0.zip`
- `/opt/cursor/artifacts/tempoflow3-windows/TempoFlow.exe`
- Linux AppImage déjà présent : `apps/tempoflow3/dist-electron/TempoFlow-Setup-0.1.0.AppImage`

## Pourquoi ce n’est pas « toutes les fonctionnalités TF2 sous Windows »

1. **Pas d’exécution Windows** → pas de preuve first-run GUI, tray, updater NSIS, Meili/Hermes/n8n sur Win.
2. **Pack Win actuel non shippable** : `resources/bin/meili` + `cloudflared` sont Linux ; sous Windows la recherche/tunnel kit cassent.
3. **Parité TF2** prouvée côté **API/harness/pages** (oracle + hard), pas côté **desktop Windows packagé**.
4. Build distant officiel = `remote-build-win.sh` sur marque connue + SSH — **indisponible** pour `tempoflow3` dans cet env.

## Ce qu’il faut pour une preuve Windows réelle

1. Hôte Windows (ou CI Windows) avec `electron-builder --win nsis`.
2. Binaires kit **win** (`meili*.exe`, `cloudflared.exe`) dans `electron-shell/resources/bin` (ou extraResources conditionnels).
3. Installer NSIS → first-run → parcours métier → MCP/tunnel → Hermes/n8n warm.
4. Enregistrer captures + logs sous `docs/experiences/tempoflow3/`.

## Ce qui fonctionne déjà (architecture nouvelle) — Linux

Rejoué ce tour :

- `npm test` (apps/tempoflow3) → OK
- `npm run proof:hard` → **81/81 SUCCESS**
- Harness OS : hosts construits, n8n/hermes start, MCP public, OAuth well-known, métier optimiser/dispatch/scan/stack…

**Conclusion honnête** : l’architecture kit + métier TF3 est prouvée en profondeur sur Linux. Une **app Windows E2E complète** n’est **pas** démontrée dans cet environnement.
