/**
 * Lie le `node_modules` du kit dans une app générée (hors workspace).
 *
 * Les gates `factory-prd*` compilent le main/preload (`tsc`, `@types/node`,
 * `@creezio/*`) sans `npm install` — obligatoire hors ligne (le registre
 * GitHub Packages / le binaire Electron ne sont pas joignables).
 *
 * `--link-kit` (factory, PR #172) pinne les `@creezio/*` en `file:` le temps
 * d'un `npm install` : ça règle l'œuf-poule registre, **pas** le hors-ligne
 * (electron, typescript, lock restent téléchargés). Ici on ne touche pas
 * aux manifests : on réutilise le hoist déjà présent dans le clone kit.
 *
 * Ne remplace jamais un `node_modules` réel (install dédiée). Recrée un
 * symlink cassé (layout historique).
 */
import fs from "node:fs";
import path from "node:path";

/**
 * @param {string} appOrServerDir dossier qui porte le `package.json` compilé
 *   (`server/` en monorepo, racine en layout plat)
 * @param {string} kitRoot racine du clone kit (`CREEZIO_KIT_ROOT`)
 * @returns {{ linked: boolean, path: string }}
 */
export function linkKitNodeModules(appOrServerDir, kitRoot) {
  const target = path.join(appOrServerDir, "node_modules");
  const kitNm = path.join(kitRoot, "node_modules");
  if (!fs.existsSync(kitNm)) {
    throw new Error(
      `link-kit-node-modules : node_modules kit introuvable (${kitNm})`,
    );
  }
  const stat = fs.lstatSync(target, { throwIfNoEntry: false });
  if (stat?.isSymbolicLink() && !fs.existsSync(target)) {
    fs.unlinkSync(target);
  }
  if (fs.existsSync(target)) {
    return { linked: false, path: target };
  }
  fs.symlinkSync(kitNm, target, "dir");
  return { linked: true, path: target };
}

/**
 * Pose le lien sur `server/` (monorepo) ou la racine (layout plat).
 * @param {string} brandRoot
 * @param {string} kitRoot
 * @returns {{ linked: boolean, path: string, dir: string }}
 */
export function linkKitNodeModulesForBrand(brandRoot, kitRoot) {
  const serverDir = path.join(brandRoot, "server");
  const dir = fs.existsSync(path.join(serverDir, "package.json"))
    ? serverDir
    : brandRoot;
  return { dir, ...linkKitNodeModules(dir, kitRoot) };
}
