/**
 * GC fail-closed du registre Docker local (`registry:2`, `127.0.0.1:5000`).
 *
 * Geste : `creezio server-docker registry-gc`
 *   1. catalogue + tags via API Distribution v2 ;
 *   2. rétention `--keep N` (défaut 2) + tags des conteneurs en cours ;
 *   3. DELETE des manifests non retenus (jamais un tag en usage) ;
 *   4. `registry garbage-collect` dans le container (`docker exec`).
 *
 * `--dry-run` : plan uniquement, zéro mutation.
 */
import { spawnSync } from "node:child_process";

export const REGISTRY_GC_KEEP_DEFAULT = 2;
export const REGISTRY_GC_DEFAULT_HOST = "127.0.0.1:5000";
export const REGISTRY_GC_DEFAULT_CONTAINER = "creezio-registry";
export const REGISTRY_GC_CONFIG = "/etc/docker/registry/config.yml";

export const REGISTRY_TAG_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

const MANIFEST_ACCEPT =
  "application/vnd.docker.distribution.manifest.v2+json, " +
  "application/vnd.oci.image.manifest.v1+json, " +
  "application/vnd.oci.image.index.v1+json, " +
  "application/vnd.docker.distribution.manifest.list.v2+json";

export type RegistryGcHttpResponse = {
  status: number;
  ok: boolean;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
  text(): Promise<string>;
};

export type RegistryGcHttp = {
  request(url: string, init?: RequestInit): Promise<RegistryGcHttpResponse>;
};

export type InUseImage = {
  ref: string;
  digest?: string;
};

export type RegistryGcDocker = {
  available(): boolean;
  listInUseImages(): InUseImage[];
  containerRunning(name: string): boolean;
  garbageCollect(
    container: string,
    configPath: string,
  ): { status: number; stdout: string; stderr: string };
};

export type ParsedImageRef = {
  host: string;
  repo: string;
  tag: string;
  digest?: string;
};

export type TagInfo = { tag: string; digest: string };

export type RepoGcKeepReason = "recent" | "in-use";

export type RepoGcPlan = {
  repo: string;
  keep: Array<{ tag: string; digest: string; reason: RepoGcKeepReason }>;
  delete: Array<{ tag: string; digest: string }>;
  skipShared: Array<{ tag: string; digest: string }>;
};

export type RegistryGcResult = {
  dryRun: boolean;
  keep: number;
  registry: string;
  container: string;
  repos: string[];
  kept: Array<{ repo: string; tag: string; reason: RepoGcKeepReason }>;
  deleted: Array<{ repo: string; tag: string; digest: string }>;
  skippedShared: Array<{ repo: string; tag: string; digest: string }>;
  gcRan: boolean;
};

export type RegistryGcArgs = {
  registry?: string;
  keepTags?: number;
  dryRun?: boolean;
  container?: string;
  repo?: string;
};

export type RegistryGcOpts = {
  registry: string;
  keep: number;
  dryRun: boolean;
  container: string;
  repo?: string;
  http?: RegistryGcHttp;
  docker?: RegistryGcDocker;
  log?: (line: string) => void;
};

/**
 * Compare deux tags version segment par segment (0.3.10 > 0.3.9 > 0.3.9-rc1).
 * Segments numériques comparés en nombre, sinon lexicographique.
 */
export function compareVersionTags(a: string, b: string): number {
  const pa = a.split(/[.\-_]/);
  const pb = b.split(/[.\-_]/);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const sa = pa[i] ?? "";
    const sb = pb[i] ?? "";
    const na = /^\d+$/.test(sa) ? Number(sa) : NaN;
    const nb = /^\d+$/.test(sb) ? Number(sb) : NaN;
    if (!Number.isNaN(na) && !Number.isNaN(nb)) {
      if (na !== nb) return na - nb;
    } else if (sa !== sb) {
      return sa < sb ? -1 : 1;
    }
  }
  return 0;
}

/** Tags à supprimer : tout sauf les `keep` plus récents (tri version). */
export function selectTagsToPrune(tags: string[], keep: number): string[] {
  const sorted = [...tags].sort(compareVersionTags);
  return keep >= sorted.length ? [] : sorted.slice(0, sorted.length - keep);
}

export function registryBaseUrl(registry: string): string {
  const raw = (registry || "").trim().replace(/\/+$/, "");
  if (!raw) {
    throw new Error(
      `registre invalide — attendu ${REGISTRY_GC_DEFAULT_HOST}`,
    );
  }
  if (/^https?:\/\//i.test(raw)) return raw;
  return `http://${raw}`;
}

export function parseImageRef(ref: string): ParsedImageRef | null {
  const raw = (ref || "").trim();
  if (!raw || raw === "<none>") return null;
  if (/^sha256:[0-9a-f]{64}$/i.test(raw)) {
    return { host: "", repo: "", tag: "", digest: raw.toLowerCase() };
  }
  let digest: string | undefined;
  let rest = raw;
  const at = raw.lastIndexOf("@");
  if (at > 0) {
    digest = raw.slice(at + 1).toLowerCase();
    rest = raw.slice(0, at);
  }
  let tag = "latest";
  const lastColon = rest.lastIndexOf(":");
  const lastSlash = rest.lastIndexOf("/");
  if (lastColon > lastSlash) {
    tag = rest.slice(lastColon + 1);
    rest = rest.slice(0, lastColon);
  }
  if (!rest) return digest ? { host: "", repo: "", tag: "", digest } : null;
  const first = rest.split("/")[0] || "";
  const hasHost =
    first.includes(".") || first.includes(":") || first === "localhost";
  if (hasHost) {
    const repo = rest.slice(first.length + 1);
    if (!repo && !digest) return null;
    return { host: first, repo, tag, digest };
  }
  return { host: "", repo: rest, tag, digest };
}

export function collectInUseKeys(images: InUseImage[]): {
  tags: Set<string>;
  digests: Set<string>;
} {
  const tags = new Set<string>();
  const digests = new Set<string>();
  for (const img of images) {
    if (img.digest && img.digest.startsWith("sha256:")) {
      digests.add(img.digest.toLowerCase());
    }
    const parsed = parseImageRef(img.ref);
    if (!parsed) continue;
    if (parsed.digest && parsed.digest.startsWith("sha256:")) {
      digests.add(parsed.digest);
    }
    if (parsed.repo && parsed.tag) {
      tags.add(`${parsed.repo}:${parsed.tag}`);
    }
  }
  return { tags, digests };
}

export function planRepoGc(opts: {
  repo: string;
  tags: TagInfo[];
  keep: number;
  inUseTags: Set<string>;
  inUseDigests: Set<string>;
}): RepoGcPlan {
  const { repo, keep } = opts;
  if (!Number.isFinite(keep) || keep < 1) {
    throw new Error(`--keep invalide (${keep}) — entier ≥ 1 requis`);
  }
  const unique = new Map<string, TagInfo>();
  for (const t of opts.tags) {
    if (!t.tag || !REGISTRY_TAG_RE.test(t.tag)) continue;
    unique.set(t.tag, t);
  }
  const list = [...unique.values()];
  const recent = new Set(
    [...list]
      .map((t) => t.tag)
      .sort(compareVersionTags)
      .slice(-Math.floor(keep)),
  );
  const keepItems: RepoGcPlan["keep"] = [];
  const candidates: TagInfo[] = [];
  for (const t of list) {
    const inUse =
      opts.inUseTags.has(`${repo}:${t.tag}`) ||
      opts.inUseDigests.has(t.digest.toLowerCase());
    if (inUse) {
      keepItems.push({ ...t, reason: "in-use" });
    } else if (recent.has(t.tag)) {
      keepItems.push({ ...t, reason: "recent" });
    } else {
      candidates.push(t);
    }
  }
  const keptDigests = new Set(
    keepItems.map((k) => k.digest.toLowerCase()).filter(Boolean),
  );
  const del: TagInfo[] = [];
  const skipShared: TagInfo[] = [];
  for (const t of candidates) {
    if (t.digest && keptDigests.has(t.digest.toLowerCase())) {
      skipShared.push(t);
    } else {
      del.push(t);
    }
  }
  return { repo, keep: keepItems, delete: del, skipShared };
}

export function resolveRegistryGcKeep(
  args: { keepTags?: number },
  env: NodeJS.ProcessEnv = process.env,
): number {
  const candidates = [
    args.keepTags,
    Number((env.CREEZIO_REGISTRY_GC_KEEP || "").trim()),
    Number((env.CREEZIO_PUBLISH_KEEP_TAGS || "").trim()),
  ];
  for (const raw of candidates) {
    if (typeof raw === "number" && Number.isFinite(raw) && raw >= 1) {
      return Math.floor(raw);
    }
  }
  return REGISTRY_GC_KEEP_DEFAULT;
}

export function createDefaultRegistryHttp(): RegistryGcHttp {
  return {
    async request(url, init) {
      let res: Response;
      try {
        res = await fetch(url, init);
      } catch (err) {
        const why = err instanceof Error ? err.message : String(err);
        throw new Error(`registre injoignable (${url}) — ${why}`);
      }
      const raw = Buffer.from(await res.arrayBuffer());
      const text = raw.toString("utf8");
      return {
        status: res.status,
        ok: res.ok,
        headers: { get: (name) => res.headers.get(name) },
        json: async () => (text ? JSON.parse(text) : {}),
        text: async () => text,
      };
    },
  };
}

function inspectJson(argv: string[]): unknown {
  const r = spawnSync("docker", argv, { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(
      `docker ${argv[0]} KO : ${(r.stderr || r.stdout || "").trim() || "échec"}`,
    );
  }
  try {
    return JSON.parse(r.stdout || "null");
  } catch {
    throw new Error(`docker ${argv[0]} : JSON invalide`);
  }
}

export function createDefaultRegistryDocker(): RegistryGcDocker {
  return {
    available() {
      const r = spawnSync("docker", ["--version"], { encoding: "utf8" });
      return r.status === 0;
    },
    listInUseImages() {
      const ps = spawnSync("docker", ["ps", "-q"], { encoding: "utf8" });
      if (ps.status !== 0) {
        throw new Error(
          `docker ps KO : ${(ps.stderr || "").trim() || "docker absent"}`,
        );
      }
      const ids = (ps.stdout || "").trim().split(/\s+/).filter(Boolean);
      if (!ids.length) return [];
      const containers = inspectJson(["inspect", ...ids]) as Array<{
        Config?: { Image?: string };
        Image?: string;
      }>;
      const out: InUseImage[] = [];
      const imageIds = new Set<string>();
      for (const c of containers) {
        if (c.Config?.Image) out.push({ ref: c.Config.Image });
        if (c.Image) imageIds.add(c.Image);
      }
      if (imageIds.size) {
        const images = inspectJson(["inspect", ...imageIds]) as Array<{
          RepoTags?: string[];
          RepoDigests?: string[];
          Id?: string;
        }>;
        for (const img of images) {
          for (const t of img.RepoTags || []) out.push({ ref: t });
          for (const d of img.RepoDigests || []) {
            const parsed = parseImageRef(d);
            out.push({
              ref: d,
              digest: parsed?.digest,
            });
          }
        }
      }
      return out;
    },
    containerRunning(name) {
      const r = spawnSync(
        "docker",
        ["inspect", "-f", "{{.State.Running}}", name],
        { encoding: "utf8" },
      );
      return r.status === 0 && (r.stdout || "").trim() === "true";
    },
    garbageCollect(container, configPath) {
      const r = spawnSync(
        "docker",
        ["exec", container, "registry", "garbage-collect", configPath],
        { encoding: "utf8" },
      );
      return {
        status: r.status ?? 1,
        stdout: r.stdout || "",
        stderr: r.stderr || "",
      };
    },
  };
}

async function registryGetJson(
  http: RegistryGcHttp,
  url: string,
  what: string,
): Promise<unknown> {
  const res = await http.request(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`${what} : HTTP ${res.status} (${url})`);
  }
  return res.json();
}

async function listCatalog(
  http: RegistryGcHttp,
  base: string,
): Promise<string[]> {
  const repos: string[] = [];
  let url = `${base}/v2/_catalog?n=1000`;
  for (let i = 0; i < 50; i++) {
    const res = await http.request(url, { method: "GET" });
    if (!res.ok) {
      throw new Error(`catalogue registre : HTTP ${res.status} (${url})`);
    }
    const body = (await res.json()) as { repositories?: string[] };
    for (const r of body.repositories || []) {
      if (r) repos.push(r);
    }
    const link = res.headers.get("link") || res.headers.get("Link") || "";
    const next = link.match(/<([^>]+)>\s*;\s*rel="next"/i);
    if (!next) break;
    const href = next[1]!;
    url = href.startsWith("http") ? href : `${base}${href}`;
  }
  return repos;
}

async function listTags(
  http: RegistryGcHttp,
  base: string,
  repo: string,
): Promise<string[]> {
  const body = (await registryGetJson(
    http,
    `${base}/v2/${repo}/tags/list`,
    `tags ${repo}`,
  )) as { tags?: string[] | null };
  return (body.tags || []).filter((t) => typeof t === "string" && REGISTRY_TAG_RE.test(t));
}

async function manifestDigest(
  http: RegistryGcHttp,
  base: string,
  repo: string,
  ref: string,
): Promise<string> {
  const res = await http.request(`${base}/v2/${repo}/manifests/${ref}`, {
    method: "HEAD",
    headers: { accept: MANIFEST_ACCEPT },
  });
  if (!res.ok) {
    throw new Error(
      `digest introuvable pour ${repo}:${ref} (HTTP ${res.status})`,
    );
  }
  const digest = (res.headers.get("docker-content-digest") || "").trim();
  if (!digest) {
    throw new Error(
      `digest introuvable pour ${repo}:${ref} (header Docker-Content-Digest absent)`,
    );
  }
  return digest;
}

async function deleteManifest(
  http: RegistryGcHttp,
  base: string,
  repo: string,
  tag: string,
  digest: string,
): Promise<void> {
  const res = await http.request(`${base}/v2/${repo}/manifests/${digest}`, {
    method: "DELETE",
  });
  if (res.ok || res.status === 202) return;
  const hint =
    res.status === 405
      ? " — REGISTRY_STORAGE_DELETE_ENABLED=true requis"
      : "";
  throw new Error(
    `DELETE manifeste KO ${repo}:${tag} (${digest}) HTTP ${res.status}${hint}`,
  );
}

export async function runRegistryGc(
  opts: RegistryGcOpts,
): Promise<RegistryGcResult> {
  const log = opts.log || ((line) => console.log(line));
  if (!Number.isFinite(opts.keep) || opts.keep < 1) {
    throw new Error(`--keep invalide (${opts.keep}) — entier ≥ 1 requis`);
  }
  const keep = Math.floor(opts.keep);
  const docker = opts.docker || createDefaultRegistryDocker();
  const http = opts.http || createDefaultRegistryHttp();
  if (!docker.available()) {
    throw new Error(
      "docker introuvable — installer Docker Engine (requis pour docker ps / exec)",
    );
  }

  const base = registryBaseUrl(opts.registry);
  const ping = await http.request(`${base}/v2/`, { method: "GET" });
  if (!ping.ok) {
    throw new Error(
      `registre down (${base}/v2/ HTTP ${ping.status}) — container ${opts.container} démarré ?`,
    );
  }

  const repos = opts.repo
    ? [opts.repo]
    : await listCatalog(http, base);

  const inUse = collectInUseKeys(docker.listInUseImages());
  const result: RegistryGcResult = {
    dryRun: opts.dryRun,
    keep,
    registry: base,
    container: opts.container,
    repos,
    kept: [],
    deleted: [],
    skippedShared: [],
    gcRan: false,
  };

  log(
    `${opts.dryRun ? "[dry-run] " : ""}registre ${base} keep=${keep} container=${opts.container}`,
  );

  const toDelete: Array<{ repo: string; tag: string; digest: string }> = [];

  for (const repo of repos) {
    const tags = await listTags(http, base, repo);
    const infos: TagInfo[] = [];
    for (const tag of tags) {
      infos.push({
        tag,
        digest: await manifestDigest(http, base, repo, tag),
      });
    }
    const plan = planRepoGc({
      repo,
      tags: infos,
      keep,
      inUseTags: inUse.tags,
      inUseDigests: inUse.digests,
    });
    log(`  ${repo}: ${infos.length} tag(s)`);
    for (const k of plan.keep) {
      result.kept.push({ repo, tag: k.tag, reason: k.reason });
      log(
        `    KEEP   ${k.tag} (${k.reason === "in-use" ? "conteneur en cours" : "récent"})`,
      );
    }
    for (const s of plan.skipShared) {
      result.skippedShared.push({ repo, tag: s.tag, digest: s.digest });
      log(
        `    SKIP   ${s.tag} (digest partagé avec un tag conservé)`,
      );
    }
    for (const d of plan.delete) {
      toDelete.push({ repo, tag: d.tag, digest: d.digest });
      log(`    DELETE ${d.tag} ${d.digest}`);
    }
  }

  if (opts.dryRun) {
    log(
      `[dry-run] ${toDelete.length} manifeste(s) seraient supprimé(s) — aucune mutation, garbage-collect non lancé`,
    );
    return result;
  }

  for (const d of toDelete) {
    await deleteManifest(http, base, d.repo, d.tag, d.digest);
    result.deleted.push(d);
    log(`✓ tag supprimé ${d.repo}:${d.tag}`);
  }

  if (!docker.containerRunning(opts.container)) {
    throw new Error(
      `container registry '${opts.container}' absent ou arrêté — garbage-collect impossible`,
    );
  }
  const gc = docker.garbageCollect(opts.container, REGISTRY_GC_CONFIG);
  if (gc.status !== 0) {
    throw new Error(
      `garbage-collect KO dans ${opts.container} (exit ${gc.status}) : ${(gc.stderr || gc.stdout || "").trim() || "échec"}`,
    );
  }
  result.gcRan = true;
  const gcTail = (gc.stdout || "").trim().split("\n").slice(-3).join(" | ");
  log(`✓ garbage-collect ${opts.container}${gcTail ? ` — ${gcTail}` : ""}`);
  return result;
}

export async function runRegistryGcCommand(
  args: RegistryGcArgs,
  env: NodeJS.ProcessEnv = process.env,
): Promise<RegistryGcResult> {
  return runRegistryGc({
    registry:
      args.registry ||
      (env.CREEZIO_REGISTRY || "").trim() ||
      REGISTRY_GC_DEFAULT_HOST,
    keep: resolveRegistryGcKeep(args, env),
    dryRun: !!args.dryRun,
    container:
      args.container ||
      (env.CREEZIO_REGISTRY_CONTAINER || "").trim() ||
      REGISTRY_GC_DEFAULT_CONTAINER,
    repo: args.repo,
  });
}
