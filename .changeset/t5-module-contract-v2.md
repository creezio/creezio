---
"@creezio/app-runtime": minor
"@creezio/assistant": minor
"@creezio/onboarding": minor
"@creezio/brand-spec": minor
"@creezio/factory": minor
---

T5 / F3.4 — volet 2 du contrat de module : champs additifs `assistantSources`,
`assistantSourcesJustification` et `onboarding` sur `BrandModuleDef`.
Collecteurs `collectAssistantSources` / `collectOnboardingContent` dans
`createBrandModuleRegistry` ; consommation réelle dans `@creezio/assistant`
(`moduleSources`, `applyModuleAssistantSources`, contexte prompt +
entitySources + toolDefinitions) et `@creezio/onboarding`
(`composeOnboardingFromModules`, mount factory). Doctor warn
`MODULE_ASSISTANT_SOURCES_MISSING` si un module expose une API sans sources
ni justification. Templates factory (`brand module init`, from-prd) mis à
jour. Pas de bump `ARCHITECTURE_VERSION` (champs optionnels).
