/**
 * Bridge BrandSpec → SetupWizardConfig (sans dépendre de @creezio/brand-spec
 * au runtime UI — la marque / factory peut passer un objet déjà résolu).
 */
import type { SetupWizardConfig } from "./setup-types.js";

export type OnboardingSpecInput = {
  enabled?: boolean;
  stepLabels?: string[];
  slugPlaceholder?: string;
  tunnelHelp?: string;
  requireOpenaiKey?: boolean;
  afterCompleteHref?: string;
  accentColor?: string;
  backgroundColor?: string;
};

/**
 * Convertit une déclaration onboarding (YAML brand-spec) en SetupWizardConfig.
 */
export function setupWizardConfigFromSpec(
  input: OnboardingSpecInput | null | undefined,
): SetupWizardConfig | null {
  if (!input || input.enabled === false) return null;
  const out: SetupWizardConfig = {};
  if (input.stepLabels && input.stepLabels.length >= 4) {
    out.stepLabels = [
      input.stepLabels[0]!,
      input.stepLabels[1]!,
      input.stepLabels[2]!,
      input.stepLabels[3]!,
    ];
  }
  if (input.slugPlaceholder) out.slugPlaceholder = input.slugPlaceholder;
  if (input.tunnelHelp) out.tunnelHelp = input.tunnelHelp;
  if (input.requireOpenaiKey != null) {
    out.requireOpenaiKey = input.requireOpenaiKey;
  }
  if (input.afterCompleteHref) out.afterCompleteHref = input.afterCompleteHref;
  if (input.accentColor) out.accentColor = input.accentColor;
  if (input.backgroundColor) out.backgroundColor = input.backgroundColor;
  return out;
}
