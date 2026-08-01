# @creezio/onboarding — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/onboarding/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`src/engine.ts`](../src/engine.ts) | 43 | `OnboardingStepId`, `ComputeInitialStepInput`, `clampStep`, `computeInitialStep`, `nextStepIndex`, `prevStepIndex`, `shouldShowInterstitial` |
| [`src/index.ts`](../src/index.ts) | 39 | `ONBOARDING_PACKAGE`, `INTERSTITIAL_MS_DEFAULT`, `AUTO_ADVANCE_MS_DEFAULT`, `DEFAULT_SETUP_STEP_LABELS`, `DEFAULT_SLUG_PLACEHOLDER`, `DEFAULT_SETUP_ACCENT`, `DEFAULT_SETUP_BACKGROUND`, `SLUG_RE` |
| [`src/setup-types.ts`](../src/setup-types.ts) | 107 | `SetupWizardConfig`, `CompleteSetupPayload`, `DEFAULT_SETUP_STEP_LABELS`, `DEFAULT_SLUG_PLACEHOLDER`, `DEFAULT_SETUP_ACCENT`, `DEFAULT_SETUP_BACKGROUND`, `SLUG_RE`, `validateAccountStep` |
| [`ui/index.ts`](../ui/index.ts) | 53 | `SetupWizard`, `DEFAULT_SETUP_STEP_LABELS`, `DEFAULT_SLUG_PLACEHOLDER`, `DEFAULT_SETUP_ACCENT`, `DEFAULT_SETUP_BACKGROUND`, `SLUG_RE`, `OnboardingWizard`, `Stepper` |
| [`ui/onboarding/configure.ts`](../ui/onboarding/configure.ts) | 24 | `OnboardingUiConfig`, `configureOnboardingUi`, `getOnboardingUiConfig`, `resetOnboardingUiForTests` |
| [`ui/onboarding/define.ts`](../ui/onboarding/define.ts) | 22 | `defineOnboardingSteps`, `createOnboardingHostProps` |
| [`ui/onboarding/interstitial.tsx`](../ui/onboarding/interstitial.tsx) | 50 | `INTERSTITIAL_MS`, `Interstitial` |
| [`ui/onboarding/micro.tsx`](../ui/onboarding/micro.tsx) | 417 | `AUTO_ADVANCE_MS`, `useMicro`, `MicroScreen`, `BigOption`, `BigInput`, `MicroLabel` |
| [`ui/onboarding/onboarding-shell.tsx`](../ui/onboarding/onboarding-shell.tsx) | 117 | `Stepper` |
| [`ui/onboarding/onboarding-wizard.tsx`](../ui/onboarding/onboarding-wizard.tsx) | 195 | `OnboardingWizard` |
| [`ui/onboarding/onboarding.css`](../ui/onboarding/onboarding.css) | 127 | — |
| [`ui/onboarding/types.ts`](../ui/onboarding/types.ts) | 67 | `OnboardingStepId`, `OnboardingStepContext`, `OnboardingStepDef`, `OnboardingTransport`, `OnboardingWizardFlags`, `OnboardingTheme`, `OnboardingWizardProps`, `CompanionPose` |
| [`ui/setup/setup-types.ts`](../ui/setup/setup-types.ts) | 32 | `SetupWizardConfig`, `CompleteSetupPayload`, `DEFAULT_SETUP_STEP_LABELS`, `DEFAULT_SLUG_PLACEHOLDER`, `DEFAULT_SETUP_ACCENT`, `DEFAULT_SETUP_BACKGROUND`, `SLUG_RE` |
| [`ui/setup/setup-wizard.tsx`](../ui/setup/setup-wizard.tsx) | 520 | `SetupWizard` |

---

## Détail par fichier

### `src/engine.ts`

- **Lignes** : 43
- **Exports** : `OnboardingStepId`, `ComputeInitialStepInput`, `clampStep`, `computeInitialStep`, `nextStepIndex`, `prevStepIndex`, `shouldShowInterstitial`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/index.ts`

- **Lignes** : 39
- **Exports** : `ONBOARDING_PACKAGE`, `INTERSTITIAL_MS_DEFAULT`, `AUTO_ADVANCE_MS_DEFAULT`, `DEFAULT_SETUP_STEP_LABELS`, `DEFAULT_SLUG_PLACEHOLDER`, `DEFAULT_SETUP_ACCENT`, `DEFAULT_SETUP_BACKGROUND`, `SLUG_RE`, `validateAccountStep`, `validateRecoveryStep`, `validateSlugStep`, `validateOpenaiStep`, `buildCompleteSetupPayload`, `computeInitialStep`, `clampStep`, `nextStepIndex`, `prevStepIndex`, `shouldShowInterstitial`

@creezio/onboarding — setup first-run + moteur onboarding (Phase P).
UI React : `@creezio/onboarding/ui`.

### `src/setup-types.ts`

- **Lignes** : 107
- **Exports** : `SetupWizardConfig`, `CompleteSetupPayload`, `DEFAULT_SETUP_STEP_LABELS`, `DEFAULT_SLUG_PLACEHOLDER`, `DEFAULT_SETUP_ACCENT`, `DEFAULT_SETUP_BACKGROUND`, `SLUG_RE`, `validateAccountStep`, `validateRecoveryStep`, `validateSlugStep`, `validateOpenaiStep`, `buildCompleteSetupPayload`

Config optionnelle SetupWizard — le reste vient de getShellUiBrand(). 
export type SetupWizardConfig = {
   Override labels étapes (défaut: Compte / Récupération / Tunnel / OpenAI).

### `ui/index.ts`

- **Lignes** : 53
- **Exports** : `SetupWizard`, `DEFAULT_SETUP_STEP_LABELS`, `DEFAULT_SLUG_PLACEHOLDER`, `DEFAULT_SETUP_ACCENT`, `DEFAULT_SETUP_BACKGROUND`, `SLUG_RE`, `OnboardingWizard`, `Stepper`, `Interstitial`, `INTERSTITIAL_MS`, `useMicro`, `MicroScreen`, `MicroLabel`, `BigInput`, `BigOption`, `AUTO_ADVANCE_MS`, `configureOnboardingUi`, `getOnboardingUiConfig`, `resetOnboardingUiForTests`, `defineOnboardingSteps`, `createOnboardingHostProps`

@creezio/onboarding/ui — SetupWizard + moteur onboarding + micro.

### `ui/onboarding/configure.ts`

- **Lignes** : 24
- **Exports** : `OnboardingUiConfig`, `configureOnboardingUi`, `getOnboardingUiConfig`, `resetOnboardingUiForTests`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/onboarding/define.ts`

- **Lignes** : 22
- **Exports** : `defineOnboardingSteps`, `createOnboardingHostProps`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/onboarding/interstitial.tsx`

- **Lignes** : 50
- **Exports** : `INTERSTITIAL_MS`, `Interstitial`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/onboarding/micro.tsx`

- **Lignes** : 417
- **Exports** : `AUTO_ADVANCE_MS`, `useMicro`, `MicroScreen`, `BigOption`, `BigInput`, `MicroLabel`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/onboarding/onboarding-shell.tsx`

- **Lignes** : 117
- **Exports** : `Stepper`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/onboarding/onboarding-wizard.tsx`

- **Lignes** : 195
- **Exports** : `OnboardingWizard`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/onboarding/onboarding.css`

- **Lignes** : 127

Moteur onboarding — styles `.onb-*` (extrait marques ×3).
Importer une fois : `import "@creezio/onboarding/ui/onboarding/onboarding.css"`

### `ui/onboarding/types.ts`

- **Lignes** : 67
- **Exports** : `OnboardingStepId`, `OnboardingStepContext`, `OnboardingStepDef`, `OnboardingTransport`, `OnboardingWizardFlags`, `OnboardingTheme`, `OnboardingWizardProps`, `CompanionPose`, `TempoPose`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/setup/setup-types.ts`

- **Lignes** : 32
- **Exports** : `SetupWizardConfig`, `CompleteSetupPayload`, `DEFAULT_SETUP_STEP_LABELS`, `DEFAULT_SLUG_PLACEHOLDER`, `DEFAULT_SETUP_ACCENT`, `DEFAULT_SETUP_BACKGROUND`, `SLUG_RE`

Config optionnelle SetupWizard — le reste vient de getShellUiBrand(). 
export type SetupWizardConfig = {
  stepLabels?: [string, string, string, string];
  slugPlaceholder?: string;
  tunnelHelp?: string;
  requireOpenaiKey?: boolean;
  afterCompleteHref?: string;
  accentColor?: string;
  backgroundColor?: string;
};

export type CompleteSetupPayload = {

### `ui/setup/setup-wizard.tsx`

- **Lignes** : 520
- **Exports** : `SetupWizard`

_(pas de cartouche JSDoc en tête — voir le code)_

