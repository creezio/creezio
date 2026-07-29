# Gates post-H5 — checklist transversale (Phase I0)

> Complète G1/G2/G3 (Phases A–G). Ne remplace pas les gates marques.  
> Sign-off H5 kit : [PHASE-H5.md](../PHASE-H5.md). Plan I* : [PHASE-I0.md](../PHASE-I0.md).

## Kit (`creezio/creezio`)

- [x] `ARCHITECTURE_VERSION = "H6"` (freeze I8 ; était H5 ACL)
- [x] Script canonique `scripts/sync-creezio-vendor.sh` (assert version + CJS + SYNC.json)
- [x] Console expose `architectureVersion` (`GET /api/kit-versions`)
- [x] Politique republish : [REPUBLISH-POLICY.md](../REPUBLISH-POLICY.md)
- [x] Phases I1–I8 livrées (persistance + control-plane + admin + shell-ui + freeze)

## TempoFlow (`tempoflow2`)

- [x] Wrapper sync → contrat kit I0
- [x] Vendor H6 consommé nominal (I9)
- [x] ACL L3 + control-plane `acl` (I10)
- [x] Republish I14 Client+Serveur **0.10.30**

## Certivan (`certivan-app`)

- [x] Wrapper sync → contrat kit I0 (liste H5 baseline)
- [ ] Foundation SqliteRuntime + modules (I15)
- [ ] Republish uniquement I16

## Fidu (`fidu`)

- [x] Wrapper sync → contrat kit I0
- [ ] ADR `clientSlim` + foundation (I17)
- [ ] Republish uniquement I18

## Dry-run sync TF (preuve I0)

```bash
CREEZIO_SYNC_DRY_RUN=1 bash crm/scripts/electron/sync-creezio-vendor.sh
# attendu : ARCHITECTURE_VERSION=H6, packages baseline I3, OK dry-run
```
