import fs from "node:fs";
import path from "node:path";
import {
  PHASE_G_GATES,
  collectKitInventory,
  publishedHintsFromInventory,
  type KitInventory,
  type PublishedKitHint,
} from "@creezio/propagation";

export type GateRow = (typeof PHASE_G_GATES)[number];

export type KitConsoleSnapshot = {
  inventory: KitInventory;
  published: PublishedKitHint[];
  gates: GateRow[];
  docs: Array<{ id: string; label: string; href: string }>;
};

function kitRoot(): string {
  // Remonte jusqu'au monorepo (packages/propagation présent).
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const marker = path.join(dir, "packages", "propagation", "package.json");
    if (fs.existsSync(marker)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "../..");
}

export function loadKitSnapshot(): KitConsoleSnapshot {
  const root = kitRoot();
  const inventory = collectKitInventory(root);
  const published = publishedHintsFromInventory(inventory);
  return {
    inventory,
    published,
    gates: [...PHASE_G_GATES],
    docs: [
      {
        id: "propagation",
        label: "PROPAGATION.md",
        href: "https://github.com/creezio/creezio/blob/main/docs/PROPAGATION.md",
      },
      {
        id: "phase-f",
        label: "PHASE-F.md",
        href: "https://github.com/creezio/creezio/blob/main/docs/PHASE-F.md",
      },
      {
        id: "g1",
        label: "Gate G1 Certivan",
        href: "https://github.com/creezio/creezio/blob/main/docs/gates/G1-CERTIVAN.md",
      },
      {
        id: "g2",
        label: "Gate G2 Fidu",
        href: "https://github.com/creezio/creezio/blob/main/docs/gates/G2-FIDU.md",
      },
      {
        id: "g3",
        label: "Gate G3 TempoFlow",
        href: "https://github.com/creezio/creezio/blob/main/docs/gates/G3-TEMPOFLOW.md",
      },
      {
        id: "platform",
        label: "PLATFORM-VS-VERTICAL.md",
        href: "https://github.com/creezio/creezio/blob/main/docs/PLATFORM-VS-VERTICAL.md",
      },
    ],
  };
}
