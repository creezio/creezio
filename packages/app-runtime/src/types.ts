import type { AppManifest } from "@creezio/brand-config";
import type { ApiKernel } from "@creezio/api-kernel";
import type {
  SqliteMigration,
  SqliteRuntime,
} from "@creezio/platform-core";
import type { BrandMeiliFeed } from "@creezio/electron-shell/meili";
import type { CoreNavItem } from "@creezio/shell-ui";

/** Kernel marque déjà booted (SQLite + api-kernel + mounts). */
export type BrandKernelHandle = {
  api: ApiKernel;
  runtime: SqliteRuntime;
  close: () => void;
};

export type BootBrandKernelFn = (opts: {
  userDataDir: string;
  isPackaged?: boolean;
}) => BrandKernelHandle;

/**
 * Déclaration marque pour startBrandDesktop.
 * Soit `bootKernel`, soit migrations + registerModuleApi (recommandé).
 */
export type StartBrandDesktopConfig = {
  manifest: AppManifest;
  /** `__dirname` du main Electron compilé (pour preload + app-kind). */
  electronDirname: string;
  /** Callback custom (legacy). Préférer brandMigrations + registerModuleApi. */
  bootKernel?: BootBrandKernelFn;
  brandMigrations?: readonly SqliteMigration[];
  registerModuleApi?: (api: ApiKernel) => void;
  beforeBoot?: () => void;
  /** Monter tasks/mails/assistant natifs (défaut true). */
  enablePlatformServices?: boolean;
  /** Feed Meili marque (optionnel — sans feed = pas de boot Meili). */
  meiliFeed?: BrandMeiliFeed;
  /** Items nav brand (slot vertical). */
  navItems?: CoreNavItem[];
  window?: {
    width?: number;
    height?: number;
  };
  /** Chemin relatif resources depuis electronDirname (défaut ../../resources). */
  resourcesRel?: string;
  /** Log basename override. */
  logBasename?: string;
};

export type BrandDesktopHandle = {
  baseUrl: string;
  port: number;
  searchEngine: "meili" | "sql-fallback" | "off";
  close: () => Promise<void>;
};

export type StartBrandKernelHarnessConfig = {
  brandId: string;
  bootKernel?: BootBrandKernelFn;
  manifest?: AppManifest;
  brandMigrations?: readonly SqliteMigration[];
  registerModuleApi?: (api: ApiKernel) => void;
  beforeBoot?: () => void;
  enablePlatformServices?: boolean;
  meiliFeed?: BrandMeiliFeed;
  /** Racine app (pour binaire meili resources/). */
  appRoot: string;
  port?: number;
  dataDir?: string;
  meiliBinary?: string | null;
  skipIndex?: boolean;
};

export type BrandKernelHarnessHandle = {
  baseUrl: string;
  port: number;
  dataDir: string;
  searchEngine: "meili" | "sql-fallback" | "off";
  api: ApiKernel;
  runtime: SqliteRuntime;
  close: () => Promise<void>;
};
