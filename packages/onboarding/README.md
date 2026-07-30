# `@creezio/onboarding`

Setup first-run desktop + moteur d’onboarding plateforme (Phase P).

## Placement

Package **dédié** — **pas** un sous-dossier de `@creezio/shell-ui`.  
Dépendance **one-way** : `onboarding` → `shell-ui` (Button, Input, brand, desktop API, home path).

## Setup (100 % package)

```tsx
import { SetupWizard } from "@creezio/onboarding/ui";

<SetupWizard
  config={{
    slugPlaceholder: "mon-restaurant", // ou mon-cabinet / mon-espace
    tunnelHelp: "Choisissez l'adresse mobile de votre CRM :",
  }}
/>
```

IPC via `getShellDesktopApi()` · produit / suffixe tunnel via `getShellUiBrand()`.

## Onboarding (moteur + slots marque)

```tsx
import {
  OnboardingWizard,
  configureOnboardingUi,
  type OnboardingStepDef,
  type OnboardingTransport,
} from "@creezio/onboarding/ui";
import "@creezio/onboarding/ui/onboarding/onboarding.css";

configureOnboardingUi({
  companionSrc: (pose) => `/tempo/tempo-${pose}.png`, // optionnel
});

const steps: OnboardingStepDef[] = [
  { id: "intro", label: "Bienvenue", render: (ctx) => <StepIntro … /> },
  {
    id: "atelier",
    label: "Atelier",
    interstitialTitle: "Votre atelier",
    render: (ctx) => <StepAtelier … />,
  },
  { id: "recap", label: "Récap", render: (ctx) => <StepRecap … /> },
];

const transport: OnboardingTransport = {
  persistStep: (i) => fetch("/api/v1/onboarding/profil", { … }),
  skip: () => fetch("/api/v1/onboarding/skip", { method: "POST" }).then(…),
  complete: () => fetch("/api/v1/onboarding/complete", { method: "POST" }).then(…),
};

<OnboardingWizard
  steps={steps}
  transport={transport}
  flags={{ interstitials: false }} // CV court
  // resolveExitHref={() => "/dashboard"} // Fidu si besoin
/>
```

## Hors package

- Steps métier (`step-restaurant`, `step-cabinet`, …)
- Types/schémas resto/cabinet/atelier
- Routes Hono / migrations SQLite
- Splash (`@creezio/electron-shell`), cockpit, settings shell-ui

## CSS

Importer **une fois** (layout ou page onboarding) :

```ts
import "@creezio/onboarding/ui/onboarding/onboarding.css";
```
