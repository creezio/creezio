/**
 * Contrat du registre de modules marque — SoT kit (P2.c / H9, audit F3.4).
 *
 * `BrandModuleDef` est LE contrat central d'un module métier de marque :
 * entités CRUD, mounts API + operations, nav, index Meili, démo interactive,
 * migrations. Il était historiquement matérialisé en copie owned-by-brand
 * (`modules/types.ts`) chez chaque marque — depuis H9 il est **importé** du
 * kit (le `modules/types.ts` d'une marque est un simple ré-export, doctor
 * `MODULE_TYPES_DIVERGENT` fail-closed).
 *
 * Les collecteurs génériques du registre montent aussi ici
 * (`createBrandModuleRegistry`) : le `modules/index.ts` généré factory ne
 * porte plus que la liste `BRAND_MODULES` + la délégation.
 */
import type { ApiKernel, ApiMount, EntitySpec } from "@creezio/api-kernel";
import type { SqliteMigration } from "@creezio/platform-core";
import type { BrandMeiliFeed } from "@creezio/electron-shell/meili";
import type { CoreNavItem } from "@creezio/shell-ui";
import type { DemoScenario } from "@creezio/interactive-demo";
import { collectInteractiveDemoDefaults } from "@creezio/interactive-demo";
import {
  discoverModuleToolsFromBrandModules,
  type McpRegisteredTool,
} from "@creezio/mcp-facade";

/** Entrée de nav métier — `order` fixe la position dans la sidebar. */
export type BrandNavItem = CoreNavItem & { order: number };

/** Spec d'index Meili (même forme que BrandMeiliFeed.indexes[n]). */
export type BrandMeiliIndex = BrandMeiliFeed["indexes"][number];

/**
 * Contrat d'un module métier de marque (standard kit DOC-STANDARD-MODULE.md).
 * Un module = un fichier `modules/<id>.ts` exportant un `BrandModuleDef`,
 * agrégé par le registre `modules/index.ts`.
 */
export type BrandModuleDef = {
  id: string;
  /** Entités CRUD (moteur kit createEntityApiMount) — clé = mount id. */
  entitySpecs?: Record<string, EntitySpec>;
  /**
   * Mounts API manuscrits — clé = id sous /api/v1/modules/<id>.
   * Chaque mount DOIT porter `operations[]` (SoT HTTP + /admin/api + MCP)
   * et déclarer son contrôle d'accès : `permission` (garde
   * `authorizeModuleAccess`) ou `accessJustification` explicite (doctor
   * `MODULE_PERMISSION_MISSING`, fail-closed 0.16+).
   */
  apiMounts?: Record<string, ApiMount>;
  /** Entrées de nav du module (fusionnées + triées par order). */
  navItems?: BrandNavItem[];
  /** Index Meili contribués au feed marque. */
  meiliIndexes?: BrandMeiliIndex[];
  /**
   * Obligatoire si le module a une liste catalogue SANS meiliIndexes
   * (relevés, joins commande, écritures, SKU EAN…). Une liste browse
   * sans justification = doctor `MODULE_MEILI_MISSING`.
   */
  horsIndexJustification?: string;
  /**
   * Scénarios de démo interactive du module — **obligatoire** (≥ 1 scénario
   * valide). Agrégés par `collectDemoScenarios()` (registre) et servis en
   * défauts du mount `interactive-demo`. Inclure
   * `genericOsTourScenario({ productName })` (id `os-tour` partagé).
   * Une app Creezio sans démo interactive est invalide.
   */
  demo?: { scenarios: DemoScenario[] };
  /**
   * Migrations du module — `mod_<module>_00N_<slug>`, jamais renuméroter
   * une migration appliquée ; migrations cross-module interdites.
   */
  migrations?: () => SqliteMigration[];
};

/**
 * Collecteurs zéro-argument du registre de modules d'une marque — mêmes
 * signatures que les fonctions historiquement générées dans le
 * `modules/index.ts` owned-by-brand (les consommateurs marque
 * `brand-module-api` / `brand-migrations` / `vertical-slot` / `meili-feed` /
 * `brand-mcp-tools` ne changent pas).
 */
export type BrandModuleRegistry = {
  /** EntitySpecs CRUD fusionnés (clé unique par module — collision = bug). */
  collectEntitySpecs: () => Record<string, EntitySpec>;
  /** Mounts API manuscrits fusionnés (un même mount peut avoir des alias). */
  collectApiMounts: () => Array<[string, ApiMount]>;
  /** Entrées de nav métier triées par `order`. */
  collectNavItems: (extra?: BrandNavItem[]) => BrandNavItem[];
  /** Tools MCP métier — générés depuis api.listOperations() (ops du kernel). */
  collectMcpTools: (api: ApiKernel) => McpRegisteredTool[];
  /** Index Meili contribués au feed marque. */
  collectMeiliIndexes: () => BrandMeiliIndex[];
  /** Migrations des modules (IDs stables mod_<module>_*). */
  collectModuleMigrations: () => SqliteMigration[];
  /**
   * Scénarios démo interactive contribués par les modules (champ `demo`) —
   * défauts marque du mount interactive-demo. Validation + dédup par id :
   * `collectInteractiveDemoDefaults` (id `os-tour` partagé : premier gagne).
   */
  collectDemoScenarios: () => DemoScenario[];
};

/**
 * Construit les collecteurs génériques d'un registre `BRAND_MODULES`.
 * Usage (modules/index.ts généré factory) :
 *
 * ```ts
 * export const {
 *   collectEntitySpecs, collectApiMounts, collectNavItems, collectMcpTools,
 *   collectMeiliIndexes, collectModuleMigrations, collectDemoScenarios,
 * } = createBrandModuleRegistry(BRAND_MODULES);
 * ```
 */
export function createBrandModuleRegistry(
  modules: readonly BrandModuleDef[],
): BrandModuleRegistry {
  return {
    collectEntitySpecs: () => {
      const out: Record<string, EntitySpec> = {};
      for (const mod of modules) {
        for (const [key, spec] of Object.entries(mod.entitySpecs ?? {})) {
          if (out[key]) {
            throw new Error(`entity spec en double: ${key} (module ${mod.id})`);
          }
          out[key] = spec;
        }
      }
      return out;
    },
    collectApiMounts: () => {
      const seen = new Set<string>();
      const out: Array<[string, ApiMount]> = [];
      for (const mod of modules) {
        for (const [key, mount] of Object.entries(mod.apiMounts ?? {})) {
          if (seen.has(key)) {
            throw new Error(`mount API en double: ${key} (module ${mod.id})`);
          }
          seen.add(key);
          out.push([key, mount]);
        }
      }
      return out;
    },
    collectNavItems: (extra: BrandNavItem[] = []) => {
      const items = [
        ...extra,
        ...modules.flatMap((mod) => mod.navItems ?? []),
      ];
      return items.sort((a, b) => a.order - b.order);
    },
    collectMcpTools: (api: ApiKernel) =>
      discoverModuleToolsFromBrandModules(modules, api),
    collectMeiliIndexes: () =>
      modules.flatMap((mod) => mod.meiliIndexes ?? []),
    collectModuleMigrations: () =>
      modules.flatMap((mod) => mod.migrations?.() ?? []),
    collectDemoScenarios: () =>
      collectInteractiveDemoDefaults(
        modules.flatMap((mod) =>
          mod.demo ? [{ moduleId: mod.id, scenarios: mod.demo.scenarios }] : [],
        ),
      ),
  };
}
