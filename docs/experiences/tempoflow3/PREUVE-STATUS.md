# Preuve TempoFlow3 vs TempoFlow 0.10.26 — statut

## Verdict (honnête, en cours)

| Couche | Statut | Preuve |
|--------|--------|--------|
| Archi mince (pas host-stack marque) | OK | `proof:hard` arch.* |
| OS hosts composés (Hermes/n8n/tunnel) | OK | `/api/v1/os/hosts` startHermes/startN8n |
| MCP HTTP | OK | `GET /mcp` + tool `module.os.status` |
| Platform tasks/mails | OK | mounts kit |
| Métier API MVP + bonus routes | OK partiel | hard proof métier.* |
| UI Next riche = 0.10.26 | **EN COURS** | pages fetch API ; pas encore parité UX TF2 |
| `installBrandDesktopRuntime` (tray/splash/Next plane) | **EN COURS** | absorbé ensuite derrière façade |
| Tunnel/Hermes **processus démarrés** (binaries) | partiel | factories prêtes ; embeds si runtime présent |
| `test:shell` ~40 équivalent | **NON** | à construire progressivement |

### Scripts

- `npm run proof:hard` — preuve dure OS+MCP+métier (**20/20**)
- `npm run proof:oracle` — checklist fichiers/API

### Kit

`@creezio/app-runtime` `desktopProfile: "full"` → `composeBrandOs` + `listenBrandOsHttp`.
