# Problèmes rencontrés — implémentation TempoFlow3

Journal technique des frictions (pas des excuses pour tricher).

## P1 — Factory MVP trop étroit pour les onglets oracle

**Symptôme** : `--from-prd` ne génère que 5 entités CHR (pas optimiser,
stack, relevés, scan, marketplaces…).

**Décision** : enrichir **le repo marque** `apps/tempoflow3` selon les
mini-PRDs (prompts 2–12), sans copier tempoflow2. Documenter le gap factory
comme ticket F6 / générateurs étendus.

**Statut** : contourné en marque ; factory reste le bootstrap.

## P2 — Runtime desktop riche vs smoke CI

**Symptôme** : `installBrandDesktopRuntime` exige hosts sidecars complets
(Hermes, n8n, Meili…) ; pas démarrable headless dans cette session.

**Décision** : garder wiring mince + `prepareDesktopBoot` + référence
`installBrandDesktopRuntime` ; prouver le métier via API HTTP + smokes Node
(`test:metier-parcours`, `test:allowlist`, `test:first-run-auth`).

**Gap kit** : scaffold factory devrait pouvoir monter un « desktop smoke
profile » feature-off pour CI sans Electron GUI.

## P3 — Capture / IA scan

**Symptôme** : mini-PRD Scan parle de capture assistée ; l’IA générique doit
venir de creezio (assistant), pas d’un moteur marque.

**Décision** : API `scan/start` + `validate` avec **propositions métier**
explicites ; pas de vision model dans tempoflow3. La note UI le rappelle.

## P4 — Next App Router vs renderer SPA

**Symptôme** : pages `ui/app/**` sans serveur Next packagé dans le monorepo
kit sandbox.

**Décision** : UI interactive complète dans `resources/renderer/index.html` ;
pages Next = surfaces / stubs branchables quand le host Next kit est monté.

## P5 — Prix multi-fournisseurs + fournisseur archivé

**Symptôme** : smoke crée un prix sur `f2` après archive soft de `f2`.

**Décision** : accepté pour l’historique (archive ≠ purge). Les listes
par défaut masquent les archivés ; l’historique prix peut encore référencer
l’id.

## P6 — Pas de repo GitHub `tempoflow3` séparé

**Symptôme** : allowlist décrit un repo externe ; ici sandbox dans
`apps/tempoflow3` du monorepo creezio.

**Décision** : preuve OS dans le kit ; extraction repo externe = étape
propagation ultérieure (sync vendor), hors blocage fonctionnel métier.
