# Politique republish Client + Serveur (Phase I0)

> **Règle d’or** : ne jamais publier un exe « pour voir ».  
> Sync vendor → tests verts → **puis** publish.  
> Chemin critique I* : **I14 / I16 / I18** (livrés).  
> Dette post-I18 (**D***) : republish **seulement** si code runtime packaged
> (typ. **D3** TF, **D4/D5** Fidu si nécessaire) — jamais « pour doc ».

---

## Séquence obligatoire

```text
1. Sync vendor (contrat scripts/sync-creezio-vendor.sh)
2. Build / compile (Next + electron)
3. Tests pertinents verts (kit npm test ; marque smokes / test:<brand>)
4. Bump patch version marque
5. remote-build --publish (feeds Client + Serveur)
6. Documenter SHA + version feeds dans le gate / PHASE-I*
```

## Interdits

| Interdit | Pourquoi |
|----------|----------|
| Publish sans tests verts | Régression terrain (TF gold) |
| Sync vendor H5+ puis publish immédiat sans conso code | Vendor à jour ≠ app branchée |
| Force-push feeds / overwrite sans bump | Clients auto-update cassés |
| Republish pendant I0–I13 / I15 / I17 | Phases fondation — pas de gate publish |

## Qui republish quoi

| Phase | Marque | Publish |
|-------|--------|---------|
| I0–I8 | — | **Non** (kit / demobrand seulement) |
| I9–I13 | TempoFlow | Non (sauf hotfix hors plan) |
| **I14** | TempoFlow | **Oui** Client+Serveur |
| I15 | Certivan | Non |
| **I16** | Certivan | **Oui** |
| I17 | Fidu | Non |
| **I18** | Fidu | **Oui** (pipeline ship Fidu) |
| **D0** | — (docs kit) | **Non** |
| **D1–D2** | TempoFlow | **Non** (sauf packing requis pour preuve MCP — sinon regrouper **D3**) |
| **D3** | TempoFlow | **Oui si** runtime packaged touché (Client+Serveur) |
| **D4** | Fidu | **Oui si** control-plane HTTP entre dans l’exe |
| **D5** | Fidu | **Oui si** `clientSlim` / host-stack change le packaging |
| **D6** | Certivan | **Oui si** gap runtime corrigé ; sinon doc-only |

## Dry-run sync (I0 / courant H6)

Sans toucher le vendor disque marques en masse :

```bash
CREEZIO_SYNC_DRY_RUN=1 bash /opt/docker/tempoflow2/crm/scripts/electron/sync-creezio-vendor.sh
```

La copie réelle + conso code = phases marques (I9+).
