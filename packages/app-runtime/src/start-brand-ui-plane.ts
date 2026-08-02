/**
 * Démarre le plan UI Next standalone si présent (sortie `next build`).
 * Sinon la façade charge la SPA `resources/renderer`.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { findFreePort } from "@creezio/platform-core";
import { log } from "@creezio/electron-shell";

export type BrandUiPlaneHandle = {
  kind: "next" | "spa";
  baseUrl: string | null;
  child: ChildProcess | null;
  close: () => Promise<void>;
};

export async function startBrandUiPlane(opts: {
  appRoot: string;
  metierBaseUrl: string;
  preferredPort?: number;
}): Promise<BrandUiPlaneHandle> {
  const entry = path.join(
    opts.appRoot,
    "ui/.next/standalone/server.js",
  );
  if (!fs.existsSync(entry)) {
    log("ui", "Next standalone absent — SPA renderer");
    return {
      kind: "spa",
      baseUrl: null,
      child: null,
      close: async () => undefined,
    };
  }

  const port =
    opts.preferredPort && opts.preferredPort > 0
      ? opts.preferredPort
      : await findFreePort();
  const standaloneRoot = path.dirname(entry);
  // Next standalone attend .next/static à côté du server.js.
  // Toujours resync (BUILD_ID / chunks) — un dossier stale provoque HTTP 400
  // sur `/_next/static/*` et une erreur client hydratation.
  const staticSrc = path.join(opts.appRoot, "ui/.next/static");
  const staticDst = path.join(standaloneRoot, ".next/static");
  if (fs.existsSync(staticSrc)) {
    fs.mkdirSync(path.dirname(staticDst), { recursive: true });
    fs.rmSync(staticDst, { recursive: true, force: true });
    fs.cpSync(staticSrc, staticDst, { recursive: true });
    const buildIdSrc = path.join(opts.appRoot, "ui/.next/BUILD_ID");
    const buildIdDst = path.join(standaloneRoot, ".next/BUILD_ID");
    if (fs.existsSync(buildIdSrc)) {
      fs.copyFileSync(buildIdSrc, buildIdDst);
    }
  }
  const publicSrc = path.join(opts.appRoot, "ui/public");
  const publicDst = path.join(standaloneRoot, "public");
  if (fs.existsSync(publicSrc)) {
    fs.rmSync(publicDst, { recursive: true, force: true });
    fs.cpSync(publicSrc, publicDst, { recursive: true });
  }

  const child = spawn(process.execPath, [entry], {
    cwd: standaloneRoot,
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      METIER_BASE_URL: opts.metierBaseUrl,
      APP_BASE_URL: `http://127.0.0.1:${port}`,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (b) => log("next", String(b).trim()));
  child.stderr?.on("data", (b) => log("next", String(b).trim()));

  const baseUrl = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 80; i++) {
    try {
      const res = await fetch(baseUrl);
      if (res.ok || res.status === 404) {
        log("ui", `Next plane ready ${baseUrl}`);
        return {
          kind: "next",
          baseUrl,
          child,
          close: async () => {
            child.kill("SIGTERM");
          },
        };
      }
    } catch {
      /* warming */
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  log("ui", "Next plane timeout — fallback SPA");
  child.kill("SIGTERM");
  return {
    kind: "spa",
    baseUrl: null,
    child: null,
    close: async () => undefined,
  };
}
