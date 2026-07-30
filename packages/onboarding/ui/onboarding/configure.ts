import type { CompanionPose } from "./types";

export type OnboardingUiConfig = {
  /**
   * Résout l'URL d'image companion pour une pose.
   * Si absent / renvoie undefined → pas de mascotte (bulle seule si hint).
   */
  companionSrc?: (pose: CompanionPose) => string | undefined;
};

let uiConfig: OnboardingUiConfig = {};

export function configureOnboardingUi(next: Partial<OnboardingUiConfig>): void {
  uiConfig = { ...uiConfig, ...next };
}

export function getOnboardingUiConfig(): OnboardingUiConfig {
  return uiConfig;
}

export function resetOnboardingUiForTests(): void {
  uiConfig = {};
}
