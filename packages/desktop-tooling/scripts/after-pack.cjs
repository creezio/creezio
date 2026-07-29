/**
 * Hook electron-builder afterPack — générique multi-marque.
 *
 * Port de `crm/scripts/electron/after-pack.cjs` (TF2 0.10.26).
 * Aucune marque hardcodée : lit `build/electron/app-kind.json`.
 *
 * 1. Client léger : n'embarque pas le standalone Next.
 * 2. Serveur / legacy : copie `build/server` + garantit better-sqlite3
 *    conforme à la plateforme cible (PE/ELF).
 *
 * Usage dans electron-builder.yml d'une app :
 *   afterPack: node_modules/@creezio/desktop-tooling/scripts/after-pack.cjs
 */
const fs = require("node:fs");
const path = require("node:path");

/** "PE" (Windows, MZ), "ELF" (Linux) ou "?" d'après l'en-tête du fichier. */
function binFormat(file) {
  const fd = fs.openSync(file, "r");
  const head = Buffer.alloc(4);
  fs.readSync(fd, head, 0, 4, 0);
  fs.closeSync(fd);
  if (head[0] === 0x4d && head[1] === 0x5a) return "PE";
  if (head[0] === 0x7f && head.toString("latin1", 1, 4) === "ELF") return "ELF";
  return "?";
}

/** Tous les better_sqlite3.node sous `dir` (récursif). */
function findBindings(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...findBindings(p));
    else if (entry.name === "better_sqlite3.node") found.push(p);
  }
  return found;
}

/** Kind packagé, écrit par write-app-kind juste avant electron-builder. */
function packagedAppKind(root) {
  try {
    const raw = fs.readFileSync(
      path.join(root, "build", "electron", "app-kind.json"),
      "utf8",
    );
    const kind = JSON.parse(raw).kind;
    return kind === "server" || kind === "client" ? kind : "legacy";
  } catch {
    return "legacy";
  }
}

module.exports = async function afterPack(context) {
  const root = context.packager.projectDir;
  const kind = packagedAppKind(root);
  const dest = path.join(context.appOutDir, "resources", "server");
  fs.rmSync(dest, { recursive: true, force: true });

  // Client léger : allowLocalStack=false → jamais de serveur Next local.
  if (kind === "client") {
    console.log(
      "  • afterPack : kind=client → standalone Next non embarqué (client léger)",
    );
    return;
  }

  const src = path.join(root, "build", "server");
  fs.cpSync(src, dest, { recursive: true });
  console.log(`  • afterPack : build/server copié intégralement → ${dest}`);

  const platform = context.electronPlatformName; // "win32" | "linux" | "darwin"
  const expected = platform === "win32" ? "PE" : "ELF";

  if (platform === "win32") {
    const winNode = path.join(root, "resources-win", "better_sqlite3.node");
    if (!fs.existsSync(winNode) || binFormat(winNode) !== "PE") {
      throw new Error(
        "afterPack : resources-win/better_sqlite3.node absent ou pas un binaire Windows (PE).",
      );
    }
    const canonical = path.join(
      dest,
      "node_modules",
      "better-sqlite3",
      "build",
      "Release",
      "better_sqlite3.node",
    );
    const targets = findBindings(dest);
    if (!targets.includes(canonical)) targets.push(canonical);
    for (const t of targets) {
      fs.mkdirSync(path.dirname(t), { recursive: true });
      fs.copyFileSync(winNode, t);
      console.log(`  • afterPack : binding WINDOWS → ${path.relative(dest, t)}`);
    }
  }

  const resources = path.join(context.appOutDir, "resources");
  const all = findBindings(resources);
  if (all.length === 0) {
    throw new Error(
      "afterPack : aucun better_sqlite3.node dans le paquet — serveur inutilisable.",
    );
  }
  for (const b of all) {
    const fmt = binFormat(b);
    console.log(`  • afterPack : vérif ${path.relative(resources, b)} = ${fmt}`);
    if (fmt !== expected) {
      throw new Error(
        `afterPack : ${b} est ${fmt}, attendu ${expected} pour la cible ${platform} — build refusé.`,
      );
    }
  }

  for (const mod of ["bindings", "file-uri-to-path"]) {
    const p = path.join(dest, "node_modules", mod, "package.json");
    if (!fs.existsSync(p)) {
      throw new Error(
        `afterPack : node_modules/${mod} manquant dans le serveur embarqué.`,
      );
    }
  }
  console.log(
    `  • afterPack : binding better-sqlite3 conforme (${expected}) + bindings/file-uri-to-path OK`,
  );
};
