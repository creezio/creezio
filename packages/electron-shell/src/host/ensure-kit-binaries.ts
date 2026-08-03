/**
 * Assure les binaires OS kit (Meili, cloudflared) sous
 * `@creezio/electron-shell/resources/bin` — jamais dans la marque.
 * Appelé au boot startBrandDesktop / harness pour le plug-and-play.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { kitOsResourcesRoot } from "./kit-os-resources.js";

export type KitBinaryName = "meili" | "cloudflared";

export type EnsureKitBinariesResult = {
  ok: boolean;
  binDir: string;
  meili: string | null;
  cloudflared: string | null;
  downloaded: KitBinaryName[];
  errors: string[];
};

const DEFAULTS: Record<KitBinaryName, string> = {
  meili:
    process.env.CREEZIO_MEILI_URL ||
    "https://github.com/meilisearch/meilisearch/releases/download/v1.11.3/meilisearch-linux-amd64",
  cloudflared:
    process.env.CREEZIO_CLOUDFLARED_URL ||
    "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64",
};

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          file.close();
          try {
            fs.unlinkSync(dest);
          } catch {
            /* */
          }
          download(res.headers.location, dest).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} ${url}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve()));
      })
      .on("error", reject);
  });
}

async function ensureOne(
  name: KitBinaryName,
  binDir: string,
): Promise<{ path: string | null; downloaded: boolean; error?: string }> {
  const dest = path.join(
    binDir,
    process.platform === "win32" && name === "cloudflared"
      ? "cloudflared.exe"
      : name,
  );
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    return { path: dest, downloaded: false };
  }
  if (process.env.CREEZIO_SKIP_KIT_BINARIES === "1") {
    return { path: null, downloaded: false, error: "CREEZIO_SKIP_KIT_BINARIES=1" };
  }
  const tmp = `${dest}.tmp`;
  try {
    await download(DEFAULTS[name], tmp);
    fs.chmodSync(tmp, 0o755);
    fs.renameSync(tmp, dest);
    return { path: dest, downloaded: true };
  } catch (e) {
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* */
    }
    return {
      path: fs.existsSync(dest) ? dest : null,
      downloaded: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Chemins binaires kit (null si absents). */
export function kitBinaryPaths(): {
  binDir: string;
  meili: string | null;
  cloudflared: string | null;
} {
  const binDir = path.join(kitOsResourcesRoot(), "bin");
  const meili = path.join(binDir, "meili");
  const cf = path.join(
    binDir,
    process.platform === "win32" ? "cloudflared.exe" : "cloudflared",
  );
  return {
    binDir,
    meili: fs.existsSync(meili) ? meili : null,
    cloudflared: fs.existsSync(cf) ? cf : null,
  };
}

/**
 * Télécharge Meili + cloudflared si manquants.
 * No-op rapide si déjà présents.
 */
function resolveWritableBinDir(): string {
  // Packagé Electron : binaires sous process.resourcesPath/bin (jamais /resources).
  try {
    const rp = (process as NodeJS.Process & { resourcesPath?: string })
      .resourcesPath;
    if (rp && path.isAbsolute(rp) && rp !== path.sep) {
      const candidate = path.join(rp, "bin");
      return candidate;
    }
  } catch {
    /* ignore */
  }
  return path.join(kitOsResourcesRoot(), "bin");
}

export async function ensureKitOsBinaries(): Promise<EnsureKitBinariesResult> {
  const binDir = resolveWritableBinDir();
  const downloaded: KitBinaryName[] = [];
  const errors: string[] = [];

  try {
    fs.mkdirSync(binDir, { recursive: true });
  } catch (e) {
    // Soft : ne jamais planter le boot (EACCES /resources/bin vu en AppImage).
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`mkdir ${binDir}: ${msg}`);
    const existing = kitBinaryPaths();
    return {
      ok: Boolean(existing.meili || existing.cloudflared),
      binDir,
      meili: existing.meili,
      cloudflared: existing.cloudflared,
      downloaded,
      errors,
    };
  }

  if (process.env.CREEZIO_SKIP_KIT_BINARIES === "1") {
    const existing = kitBinaryPaths();
    // Aussi chercher sous binDir résolu (resourcesPath packagé).
    const meiliP = path.join(binDir, "meili");
    const cfP = path.join(
      binDir,
      process.platform === "win32" ? "cloudflared.exe" : "cloudflared",
    );
    return {
      ok: true,
      binDir,
      meili: fs.existsSync(meiliP)
        ? meiliP
        : existing.meili,
      cloudflared: fs.existsSync(cfP) ? cfP : existing.cloudflared,
      downloaded,
      errors,
    };
  }

  const meili = await ensureOne("meili", binDir);
  if (meili.downloaded) downloaded.push("meili");
  if (meili.error) errors.push(`meili: ${meili.error}`);

  const cf = await ensureOne("cloudflared", binDir);
  if (cf.downloaded) downloaded.push("cloudflared");
  if (cf.error) errors.push(`cloudflared: ${cf.error}`);

  if (meili.path) {
    const ver = spawnSync(meili.path, ["--version"], {
      encoding: "utf8",
      timeout: 10_000,
    });
    if (ver.status !== 0 && ver.error) {
      errors.push(`meili --version: ${ver.error.message}`);
    }
  }

  return {
    ok: Boolean(meili.path && cf.path),
    binDir,
    meili: meili.path,
    cloudflared: cf.path,
    downloaded,
    errors,
  };
}
