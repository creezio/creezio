/**
 * Contrat « kit bump → PR automatisable par marque ».
 *
 * Phase F livre le contrat + templates ; l'automation GitHub Actions
 * côté repos marques est Phase G (gated).
 */

import type { BrandId } from "@creezio/brand-config";
import type { PackageBumpImpact } from "./impact.js";
import type { BumpKind } from "./semver-policy.js";

export type UpdateChannelId =
  | "kit-workspace"
  | "brand-pr-certivan"
  | "brand-pr-fidu"
  | "brand-pr-tempoflow"
  | "brand-pr-demobrand"
  | "console-ops";

export type UpdateChannel = {
  id: UpdateChannelId;
  label: string;
  description: string;
  /** Repo / chemin cible (hint, pas d'écriture Phase F) */
  targetHint: string;
  automatable: boolean;
  /** Doc gate associée */
  gateDoc?: string;
};

export const UPDATE_CHANNELS: readonly UpdateChannel[] = [
  {
    id: "kit-workspace",
    label: "Kit creezio/creezio",
    description:
      "Bump semver packages + CHANGELOG + rebuild workspace (script kit:version)",
    targetHint: "https://github.com/creezio/creezio",
    automatable: true,
  },
  {
    id: "brand-pr-certivan",
    label: "PR Certivan (G1)",
    description:
      "PR automatisable : bump deps @creezio/* + checklist gate G1",
    targetHint: "/opt/docker/certivan-app",
    automatable: true,
    gateDoc: "docs/gates/G1-CERTIVAN.md",
  },
  {
    id: "brand-pr-fidu",
    label: "PR Fidu (G2)",
    description:
      "PR automatisable : bump deps @creezio/* + checklist gate G2",
    targetHint: "/opt/docker/fidu",
    automatable: true,
    gateDoc: "docs/gates/G2-FIDU.md",
  },
  {
    id: "brand-pr-tempoflow",
    label: "PR TempoFlow (G3)",
    description:
      "PR automatisable : bump deps @creezio/* + checklist gate G3",
    targetHint: "creezio/tempoflow2",
    automatable: true,
    gateDoc: "docs/gates/G3-TEMPOFLOW.md",
  },
  {
    id: "brand-pr-demobrand",
    label: "Sandbox DemoBrand",
    description: "Mise à jour locale apps/demobrand dans le kit",
    targetHint: "apps/demobrand",
    automatable: true,
  },
  {
    id: "console-ops",
    label: "Console ops",
    description: "Affiche versions kit locales + liens gates (lecture)",
    targetHint: "apps/console",
    automatable: false,
  },
] as const;

export type BrandPrPayload = {
  brandId: BrandId;
  channelId: UpdateChannelId;
  title: string;
  bodyMarkdown: string;
  packageName: string;
  bumpKind: BumpKind;
  gateDoc?: string;
};

const CHANNEL_BY_BRAND: Partial<Record<BrandId, UpdateChannelId>> = {
  certivan: "brand-pr-certivan",
  fidu: "brand-pr-fidu",
  tempoflow: "brand-pr-tempoflow",
  demobrand: "brand-pr-demobrand",
};

/**
 * Génère le payload PR marque à partir d'un impact (dry-run / automation G).
 */
export function buildBrandPrPayload(
  impact: PackageBumpImpact,
  brandId: BrandId,
): BrandPrPayload | null {
  const channelId = CHANNEL_BY_BRAND[brandId];
  if (!channelId) return null;
  if (!impact.brands.includes(brandId)) return null;

  const gate = impact.gates.find((g) => g.brandId === brandId);
  const bodyMarkdown = [
    `## Kit bump — ${impact.packageName}`,
    "",
    `- **Bump** : \`${impact.bumpKind}\``,
    `- **Canal** : \`${channelId}\``,
    gate ? `- **Gate** : ${gate.gateId} — voir \`${gate.checklistDoc}\`` : "",
    "",
    "### Surfaces touchées",
    ...impact.surfaceDetails.map(
      (s) => `- ${s.label} (\`${s.id}\`) — ${s.typicalPaths.join(", ")}`,
    ),
    "",
    "### Rebuild packages kit",
    ...impact.rebuildPackages.map((p) => `- \`${p}\``),
    "",
    "### Checklist (ne pas skipper)",
    ...impact.gateChecklist.map((c) => `- [ ] ${c}`),
    "",
    "> Généré par `@creezio/propagation` — Phase F contrat ; exécution bascule = Phase G.",
    "",
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  return {
    brandId,
    channelId,
    title: `${impact.suggestedPrTitle} [${brandId}]`,
    bodyMarkdown,
    packageName: impact.packageName,
    bumpKind: impact.bumpKind,
    gateDoc: gate?.checklistDoc,
  };
}

export function buildAllBrandPrPayloads(
  impact: PackageBumpImpact,
): BrandPrPayload[] {
  return impact.brands
    .map((b) => buildBrandPrPayload(impact, b))
    .filter((p): p is BrandPrPayload => p !== null);
}
