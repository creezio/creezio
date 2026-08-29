/**
 * Contrat « kit bump → PR automatisable par marque ».
 *
 * Phase F livre le contrat + templates ; l'automation GitHub Actions
 * côté repos marques est Phase G (gated).
 *
 * H7 — canaux DATA-DRIVEN : les canaux marque sont dérivés d'une config
 * (défaut : registre production de brand-surfaces) ou injectés via
 * `configureBrandChannels`. Plus aucun nom de marque ni chemin absolu
 * n'est énuméré dans ce module (ni dans ses types).
 */

import type { BrandId } from "@creezio/brand-config";
import { PRODUCTION_BRAND_GATES } from "./brand-surfaces.js";
import type { PackageBumpImpact } from "./impact.js";
import type { BumpKind } from "./semver-policy.js";

/** Id de canal — libre (H7) ; canaux marque = `brand-pr-<brandId>`. */
export type UpdateChannelId = string;

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

/** Canal PR d'une marque — convention `brand-pr-<brandId>`. */
export function brandPrChannelId(brandId: string): UpdateChannelId {
  return `brand-pr-${brandId}`;
}

/** Config d'un canal PR marque — fournie par la config, jamais câblée ici. */
export type BrandChannelConfig = {
  brandId: BrandId;
  label: string;
  /** Repo / chemin cible (hint). */
  targetHint: string;
  gateId?: string;
  gateDoc?: string;
};

function defaultBrandChannelConfigs(): BrandChannelConfig[] {
  // Dérivation du registre production (brand-surfaces) — la dette « marques
  // en dur » restante (F1.6) est localisée là-bas, pas ici.
  return Object.entries(PRODUCTION_BRAND_GATES).map(([brandId, g]) => ({
    brandId: brandId as BrandId,
    label: g.label,
    targetHint: g.repoHint,
    gateId: g.gateId,
    gateDoc: `docs/archive/gates/${g.gateId}-${brandId.toUpperCase()}.md`,
  }));
}

let brandChannelConfigs: BrandChannelConfig[] = defaultBrandChannelConfigs();

/** Injecte les canaux PR marque depuis une config (data-driven, H7). */
export function configureBrandChannels(configs: BrandChannelConfig[]): void {
  brandChannelConfigs = [...configs];
}

export function resetBrandChannelsForTests(): void {
  brandChannelConfigs = defaultBrandChannelConfigs();
}

function brandChannel(cfg: BrandChannelConfig): UpdateChannel {
  return {
    id: brandPrChannelId(cfg.brandId),
    label: cfg.gateId ? `PR ${cfg.label} (${cfg.gateId})` : `PR ${cfg.label}`,
    description:
      "PR automatisable : bump deps @creezio/* + checklist gate",
    targetHint: cfg.targetHint,
    automatable: true,
    gateDoc: cfg.gateDoc,
  };
}

const BASE_CHANNELS: readonly UpdateChannel[] = [
  {
    id: "kit-workspace",
    label: "Kit creezio/creezio",
    description:
      "Bump semver packages + CHANGELOG + rebuild workspace (script kit:version)",
    targetHint: "https://github.com/creezio/creezio",
    automatable: true,
  },
  {
    id: brandPrChannelId("demobrand"),
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

/** Canaux courants : base kit + canaux marque configurés. */
export function listUpdateChannels(): UpdateChannel[] {
  return [...BASE_CHANNELS, ...brandChannelConfigs.map(brandChannel)];
}

/**
 * @deprecated H7 — snapshot au chargement du module ; utiliser
 * `listUpdateChannels()` (reflète `configureBrandChannels`). Retrait au
 * prochain bump d'architecture.
 */
export const UPDATE_CHANNELS: readonly UpdateChannel[] = listUpdateChannels();

export type BrandPrPayload = {
  brandId: BrandId;
  channelId: UpdateChannelId;
  title: string;
  bodyMarkdown: string;
  packageName: string;
  bumpKind: BumpKind;
  gateDoc?: string;
};

/**
 * Génère le payload PR marque à partir d'un impact (dry-run / automation G).
 */
export function buildBrandPrPayload(
  impact: PackageBumpImpact,
  brandId: BrandId,
): BrandPrPayload | null {
  if (!impact.brands.includes(brandId)) return null;
  const channelId = brandPrChannelId(brandId);

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
