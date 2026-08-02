"use client";

/**
 * Point d'entrée onboarding — les étapes métier sont injectées par la marque
 * via OnboardingWizard + defineOnboardingSteps. Sans steps : lien setup OS.
 */
export default function Page() {
  return (
    <section>
      <h1>Onboarding</h1>
      <p>
        Les étapes produit se déclarent côté marque (
        <code>@creezio/onboarding/ui</code>). First-run technique :{" "}
        <a href="/setup">/setup</a>.
      </p>
    </section>
  );
}
