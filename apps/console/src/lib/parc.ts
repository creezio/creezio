import {
  type BrandId,
  getManifest,
  listBrandIds,
} from "@creezio/brand-config";
import {
  collectDesktopBuildStatus,
  fetchBrandFeeds,
  type BrandFeedsSnapshot,
} from "@creezio/desktop-tooling";

export type BrandParcRow = {
  brandId: BrandId;
  label: string;
  envPrefix: string;
  defaultAppRoot: string;
  buildServerArtifact: boolean;
  feeds: BrandFeedsSnapshot;
  buildStatus: ReturnType<typeof collectDesktopBuildStatus>;
};

const LABELS: Record<BrandId, string> = {
  tempoflow: "TempoFlow",
  certivan: "Certivan",
  fidu: "Fidu",
};

export function brandLabel(id: BrandId): string {
  return LABELS[id] || id;
}

export function loadParc(): BrandParcRow[] {
  return listBrandIds().map((brandId) => {
    const manifest = getManifest(brandId);
    const feeds = fetchBrandFeeds(brandId);
    const buildStatus = collectDesktopBuildStatus({
      brandId,
      appRoot: manifest.publish.defaultAppRoot,
    });
    return {
      brandId,
      label: brandLabel(brandId),
      envPrefix: manifest.envPrefix,
      defaultAppRoot: manifest.publish.defaultAppRoot,
      buildServerArtifact: manifest.publish.buildServerArtifact,
      feeds,
      buildStatus,
    };
  });
}

export { listBrandIds };
