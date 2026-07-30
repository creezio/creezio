# `@creezio/onboarding`

Module **natif** du kit : setup first-run + moteur d’onboarding plateforme (Phase P).

**Natif ≠ identique ×3 marques.** Natif = **même moteur**, parcours **injectés** par métier.

## Contrat — kit vs marque

| Couche | Kit (`@creezio/onboarding`) | Marque |
|--------|-----------------------------|--------|
| Shell setup first-run | `SetupWizard` | config : `productName` (via brand shell), `slugPlaceholder`, `requireOpenaiKey`, recovery copy… |
| Shell parcours produit | `OnboardingWizard` + Stepper + micro + interstitials + CSS `onb-*` | `steps: OnboardingStepDef[]` |
| Protocole | `OnboardingStepDef`, `OnboardingStepContext`, `OnboardingTransport`, flags/theme | implémentations de steps |
| Persistence | contrat `transport` (persist/skip/complete) | routes `/api/v1/onboarding/*` + queries métier |
| Branding | `configureOnboardingUi({ companionSrc })` + theme props | assets + copy métier |

### Ce que le kit FOURNIT (SoT)

- `SetupWizard` — tunnel first-run desktop (compte, recovery, slug, BYOK)
- `OnboardingWizard` — stepper, interstitials optionnels, micro-UI générique
- Protocole de steps : `OnboardingStepDef` / `OnboardingStepContext`
- Contrat `OnboardingTransport` (get/save via `persistStep`, `skip`, `complete`)
- Flags (`interstitials`, `allowSkip`, `interstitialMs`) + `OnboardingTheme`
- Hooks UI : `configureOnboardingUi({ companionSrc })`, poses `CompanionPose`
- CSS `@creezio/onboarding/ui/onboarding/onboarding.css` (classes `onb-*`)
- Engine pur (non-UI) : `computeInitialStep`, `clampStep`, `nextStepIndex`, …
- Helpers DX : `defineOnboardingSteps`, `createOnboardingHostProps` (assemblage typé, **sans** steps métier)

### Ce que la marque DOIT fournir

- `steps: OnboardingStepDef[]` — composants step locaux (`step-*.tsx`)
- Copy setup : `slugPlaceholder`, `tunnelHelp`, éventuellement `stepLabels`
- `transport` branché sur l’API de la marque
- Companion / hero assets (`configureOnboardingUi`)
- Gates métier (flags, `resolveExitHref` / `onExit` si besoin)
- Persistence backend (routes + queries) — **hors** de ce package

### Ce que le kit ne doit JAMAIS contenir

- Noms de tables / schémas métier
- Libellés métier hardcodés (resto, cabinet, VASP, atelier, achats…)
- IDs / globals desktop marque (`tempoflowDesktop`, …)
- Routes métier figées (`/dashboard` métier, paths produit)
- Steps « restaurant », « atelier », « cabinet » embarqués

Les exemples ci-dessous sont **docs only** — aucun parcours métier n’est shippé dans le runtime du package.

---

## Placement

Package **dédié** — **pas** un sous-dossier de `@creezio/shell-ui`.  
Dépendance **one-way** : `onboarding` → `shell-ui` (Button, Input, brand, desktop API, home path).

Exports :

| Entrée | Contenu |
|--------|---------|
| `@creezio/onboarding` | engine + validators setup (pas de React) |
| `@creezio/onboarding/ui` | `SetupWizard`, `OnboardingWizard`, micro, types |
| `@creezio/onboarding/ui/onboarding/onboarding.css` | styles `onb-*` |

---

## Setup (100 % package, copy marque)

```tsx
import { SetupWizard } from "@creezio/onboarding/ui";

// TempoFlow (resto)
<SetupWizard
  config={{
    slugPlaceholder: "mon-restaurant",
    tunnelHelp: "Choisissez l'adresse mobile de votre CRM :",
  }}
/>

// Certivan (atelier / VASP)
<SetupWizard
  config={{
    slugPlaceholder: "mon-atelier",
    tunnelHelp: "Choisissez l'adresse d'accès distant de votre atelier :",
  }}
/>

// Fidu (cabinet)
<SetupWizard
  config={{
    slugPlaceholder: "mon-cabinet",
    tunnelHelp: "Choisissez l'adresse d'accès distant (tunnel) de votre CRM :",
  }}
/>
```

IPC via `getShellDesktopApi()` · produit / suffixe tunnel via `getShellUiBrand()`.  
Le kit ne choisit **pas** le placeholder : c’est la marque.

---

## Onboarding — injection métier

### Helper DX (optionnel)

```tsx
import {
  OnboardingWizard,
  defineOnboardingSteps,
  createOnboardingHostProps,
  configureOnboardingUi,
  type OnboardingTransport,
} from "@creezio/onboarding/ui";
import "@creezio/onboarding/ui/onboarding/onboarding.css";

configureOnboardingUi({
  companionSrc: (pose) => `/brand/companion-${pose}.png`,
});

const steps = defineOnboardingSteps([
  { id: "intro", label: "Bienvenue", render: (ctx) => <StepIntro … /> },
  // … steps MÉTIER locaux uniquement
]);

const transport: OnboardingTransport = {
  persistStep: (i) => fetch("/api/v1/onboarding/profil", { /* marque */ }),
  skip: () => fetch("/api/v1/onboarding/skip", { method: "POST" }).then(…),
  complete: () => fetch("/api/v1/onboarding/complete", { method: "POST" }).then(…),
};

const props = createOnboardingHostProps({
  steps,
  transport,
  flags: { interstitials: true, allowSkip: true },
  // resolveExitHref omis → resolveDesktopHomePath() (shell-ui)
});

<OnboardingWizard {...props} />
```

`defineOnboardingSteps` / `createOnboardingHostProps` **assemblent** seulement — ils n’embarquent aucun step métier.

### Exemple minimal Certivan (~3 steps, sans interstitials)

```tsx
const steps = defineOnboardingSteps([
  { id: "intro", label: "Bienvenue", render: (ctx) => <StepIntro … /> },
  { id: "workshop", label: "Espace", render: (ctx) => <StepWorkshop … /> },
  { id: "recap", label: "Récap", render: (ctx) => <StepRecap … /> },
]);

<OnboardingWizard
  steps={steps}
  transport={transport}
  flags={{ interstitials: false }}
/>
```

### Exemple TempoFlow / Fidu (~8 steps + micro + interstitials)

```tsx
const steps = defineOnboardingSteps([
  { id: "intro", label: "Bienvenue", interstitialTitle: "…", render: … },
  { id: "org", label: "Organisation", interstitialTitle: "…", render: … },
  // … ~6 autres steps métier locaux
  { id: "synthese", label: "Récapitulatif", render: … },
]);

<OnboardingWizard
  steps={steps}
  transport={transport}
  flags={{ interstitials: true }}
/>
```

Les `step-*.tsx` **restent dans la marque** — c’est le point customizable.

### Exit

Par défaut, `OnboardingWizard` appelle `resolveDesktopHomePath()` (shell-ui, kind-aware).  
Override marque seulement si nécessaire :

```tsx
resolveExitHref={async () => resolveDesktopHomePath()}
// éviter un hardcode opaque "/dashboard" si le desktop expose déjà le home
```

### Poses companion

Utiliser `CompanionPose` (`"pointing" | "thumbs" | "waving" | "presenting"`).  
`TempoPose` est un **alias deprecated** — ne plus l’utiliser dans le code marque.

---

## Hors package

- Steps métier (`step-*` resto / cabinet / atelier…)
- Types/schémas métier
- Routes Hono / migrations SQLite
- Splash (`@creezio/electron-shell`), cockpit, settings shell-ui
- Auth / recovery key flow (`@creezio/auth`)

---

## CSS

Importer **une fois** (layout ou page onboarding) :

```ts
import "@creezio/onboarding/ui/onboarding/onboarding.css";
```
