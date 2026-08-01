/**
 * Boot plateforme mince — généré factory (F2/F4).
 * Prépare userData + kind avant installBrandDesktopRuntime.
 */
import {
  initLogger,
  log,
  prepareDesktopBoot,
  writeAppKindFile,
} from "@creezio/electron-shell";
import { tempoflow3Manifest as manifest } from "../electron/app-manifest.js";

export async function creezioBoot(opts: { electronDir: string }) {
  const boot = await prepareDesktopBoot(manifest);
  initLogger(boot.userDataDir, manifest.logBasename);
  log("boot", `kind=${boot.appKind} product=${manifest.client.productName}`);
  writeAppKindFile(
    opts.electronDir,
    boot.appKind === "legacy" ? "client" : boot.appKind,
  );
  return { boot, manifest };
}
