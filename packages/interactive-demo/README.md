# @creezio/interactive-demo

Démo interactive **native** (module OS présent dans toutes les apps Creezio) :
un product tour « Storylane-like » mais joué **en live dans l'app** — un faux
curseur animé se déplace, clique et tape réellement dans l'interface pendant
que des cartes de narration présentent chaque fonctionnalité.

## Ce que fournit le package

- **Types de scénario déclaratifs** (`DemoScenario` / `DemoStep`) : étapes
  `say` (carte plein écran), `navigate`, `highlight` (spotlight + carte
  ancrée), `click` (faux curseur + vrai clic DOM), `type` (frappe caractère
  par caractère), `scroll`, `wait`. Format JSON-sérialisable : ajouter /
  enlever / réordonner des étapes = éditer un tableau.
- **Contenu hybride DB** (ADR-module-natif-hybride) : la marque déclare ses
  scénarios par défaut dans UN fichier explicite
  (`server/src/electron/brand-interactive-demo-content.ts`), les overrides
  vivent en `brand.db` (`interactive_demo_content`), le runtime sert
  `merge(défauts, overrides)`. Le « déjà vu » par utilisateur va dans
  `interactive_demo_preferences`.
- **Mount api-kernel** `/api/v1/modules/interactive-demo/*` : `GET/PUT/DELETE
  scenarios[/:id]` + `GET/PUT preferences`.
- **UI React** (`@creezio/interactive-demo/ui`) : `InteractiveDemoRoot`
  (auto-lancement première visite + lanceur flottant « Visite guidée »),
  `DemoPlayer` (lecteur bas niveau), `startInteractiveDemo()` (déclenchement
  programmatique), curseur/spotlight en Web Animations API + CSS
  (`ui/interactive-demo.css`) — zéro dépendance d'animation tierce.
- **Scénario générique OS** : `genericOsTourScenario({ productName })` —
  démo de base jour 1 (sidebar, tâches, mails, assistant) pour toute marque
  sans scénario produit.

## Câblage marque (câblé en prod : WinHub)

```ts
// server/src/electron/brand-interactive-demo-content.ts (défauts marque)
import type { DemoScenario } from "@creezio/interactive-demo";
export function brandDemoScenarios(): DemoScenario[] { /* … */ }

// server/src/electron/brand-migrations.ts
import { interactiveDemoMigrations } from "@creezio/interactive-demo";
// … composeMigrations(…, interactiveDemoMigrations())

// server/src/electron/brand-module-api.ts
import { createInteractiveDemoMount } from "@creezio/interactive-demo";
api.registerModuleApi(
  "interactive-demo",
  createInteractiveDemoMount({ defaults: brandDemoScenarios() }),
);
```

```tsx
// ui : chrome de la marque (layout / BrandChrome)
import { InteractiveDemoRoot } from "@creezio/interactive-demo/ui";
import "@creezio/interactive-demo/ui/interactive-demo.css";

<InteractiveDemoRoot navigate={router.push} userKey={me?.user} />
```

Le scénario marqué `autoStart: true` se lance automatiquement à la première
visite (après le setup / l'onboarding) ; « déjà vu » est persisté par
utilisateur (preferences + localStorage). Le lanceur flottant permet de
rejouer la visite à tout moment.

## Éditer la démo (ajouter / enlever des étapes)

- **Défauts** : éditer le tableau `steps` du fichier marque
  `brand-interactive-demo-content.ts` (rebuild).
- **À chaud, sans code** : `PUT /api/v1/modules/interactive-demo/scenarios/<id>`
  avec `{ "steps": [ … ] }` (remplacement complet du tableau — pas de merge
  ambigu) ; `DELETE` pour revenir aux défauts. Un `PUT` sur un id inconnu
  avec `title` + `steps` crée un scénario supplémentaire.

## Commandes

```bash
npm run build -w @creezio/interactive-demo
node --test scripts/test-phase-interactive-demo.mjs   # gate kit
```

## Docs

- [AGENTS.md](./AGENTS.md) — frontières et pièges (agents IA)
- [docs/FILES.md](./docs/FILES.md) — inventaire des fichiers
- ADR : [docs/adr/ADR-module-natif-hybride.md](../../docs/adr/ADR-module-natif-hybride.md)
