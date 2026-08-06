/**
 * Boucle d'updates en PULL de l'agent hôte (F5).
 *
 * Opt-in : ne démarre que si l'agent connaît l'app admin de la marque
 * (CREEZIO_AGENT_ADMIN_URL) et son credential flotte (CREEZIO_AGENT_FLEET_KEY
 * = agentToken émis à l'enrôlement — Bearer envoyé sous la forme
 * `hostId:fleetKey`). Posés par `creezio server-docker enroll` (state 0600)
 * ou par l'env de `agent up`.
 *
 * Cycle (poll ~5 min + jitter 0-60 s, best-effort absolu) :
 *   1. GET  {admin}/api/v1/modules/fleet-releases/next?hostId=…
 *   2. par directive : slot de téléchargement (sémaphore admin) → pull par
 *      digest si présent → `updateServer` EXISTANT (backup/recreate/rollback
 *      intacts, mutex `updates` partagé avec le push manuel) → libère le
 *      slot → POST report (done|failed|rolled_back).
 *
 * Le push admin actuel (POST /agent/api/…/update) reste le geste manuel :
 * le mutex `updates` (une entrée par containerName) protège du conflit.
 */

/** Référence pull par digest : repo de l'image (sans tag) + @sha256:… */
export function imageRefWithDigest(image, digest) {
  if (!digest) return image;
  const slash = image.lastIndexOf("/");
  const colon = image.lastIndexOf(":");
  // un ":" avant le dernier "/" est un port de registre, pas un tag.
  const repo = colon > slash ? image.slice(0, colon) : image;
  return `${repo}@${digest}`;
}

/**
 * Un cycle de pull-updates. Injectable de bout en bout (gates : mock admin +
 * mock updateServer). Retourne un résumé { polled, applied, skipped, errors }.
 */
export async function runAgentUpdateCycle({
  adminUrl,
  fleetKey,
  hostId,
  brandRoots,
  findInstance,
  updateServer,
  updates,
  audit = () => {},
  fetchImpl = fetch,
  timeoutMs = 15_000,
}) {
  const base = String(adminUrl || "").replace(/\/+$/, "");
  const summary = { polled: false, applied: 0, skipped: 0, errors: [] };
  if (!base || !fleetKey || !hostId) return summary;

  const call = async (method, subPath, body) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetchImpl(
        `${base}/api/v1/modules/fleet-releases/${subPath}`,
        {
          method,
          signal: ctrl.signal,
          headers: {
            Authorization: `Bearer ${hostId}:${fleetKey}`,
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          },
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        },
      );
      let json = null;
      try {
        json = await res.json();
      } catch {
        /* non JSON */
      }
      return { status: res.status, json };
    } finally {
      clearTimeout(timer);
    }
  };

  let next;
  try {
    next = await call("GET", `next?hostId=${encodeURIComponent(hostId)}`);
  } catch (e) {
    summary.errors.push(`next injoignable: ${e?.message || e}`);
    return summary;
  }
  if (next.status !== 200 || !next.json?.ok) {
    summary.errors.push(`next → ${next.status}`);
    return summary;
  }
  summary.polled = true;
  summary.pollIntervalSeconds = next.json.pollIntervalSeconds;
  const directives = Array.isArray(next.json.updates) ? next.json.updates : [];

  for (const d of directives) {
    const brandId = String(d.brandId || "");
    const name = String(d.name || "");
    const image = String(d.image || "");
    if (!brandId || !name || !image) continue;
    const found = findInstance(brandRoots, brandId, name);
    if (!found) {
      summary.skipped++;
      continue;
    }
    const { inst, brandRoot, registry } = found;
    // Mutex partagé avec le push manuel : jamais deux updates simultanés.
    const cur = updates.get(inst.containerName);
    if (cur?.status === "running") {
      summary.skipped++;
      continue;
    }
    // À jour si l'image courante est la référence taguée OU la référence
    // par digest (un pull par digest laisse `repo@sha256:…` sur le container).
    if (
      inst.image === image ||
      inst.image === imageRefWithDigest(image, d.digest || null)
    ) {
      summary.skipped++;
      continue;
    }

    // Slot de téléchargement (sémaphore côté admin) — releases seulement,
    // un pin s'applique sans lease.
    let leaseId = null;
    if (d.releaseId) {
      let slot;
      try {
        slot = await call("POST", "slots", {
          releaseId: d.releaseId,
          serverId: d.serverId,
        });
      } catch (e) {
        summary.errors.push(`slot ${name}: ${e?.message || e}`);
        continue;
      }
      if (slot.status !== 200 || !slot.json?.ok) {
        summary.errors.push(`slot ${name} → ${slot.status}`);
        continue;
      }
      if (!slot.json.granted) {
        audit(
          `pull-update ${brandId}/${name} en file (position ${slot.json.position}) — retry au prochain cycle`,
        );
        summary.skipped++;
        continue;
      }
      leaseId = slot.json.leaseId;
    }

    const ref = imageRefWithDigest(image, d.digest || null);
    const entry = {
      status: "running",
      image: ref,
      startedAt: new Date().toISOString(),
      source: "pull",
    };
    updates.set(inst.containerName, entry);
    audit(`pull-update ${brandId}/${name} → ${ref} (${d.reason || "release"})`);
    let result;
    try {
      result = await updateServer({ brandRoot, registry, inst, image: ref, audit });
    } catch (e) {
      result = { ok: false, error: String(e?.message || e), rolledBack: false };
    }
    entry.status = result.ok ? "done" : "error";
    entry.finishedAt = new Date().toISOString();
    entry.result = result;

    if (leaseId) {
      try {
        await call("DELETE", `slots/${encodeURIComponent(leaseId)}`);
      } catch {
        /* la lease expirera (TTL) */
      }
    }
    if (d.releaseId) {
      const status = result.ok
        ? "done"
        : result.rolledBack
          ? "rolled_back"
          : "failed";
      try {
        await call("POST", "report", {
          releaseId: d.releaseId,
          serverId: d.serverId,
          status,
          detail: result.ok
            ? `version=${result.version || "?"}`
            : String(result.error || "").slice(0, 500),
        });
      } catch (e) {
        summary.errors.push(`report ${name}: ${e?.message || e}`);
      }
    }
    if (result.ok) summary.applied++;
    else summary.errors.push(`update ${name}: ${result.error || "KO"}`);
  }
  return summary;
}

/**
 * Démarre la boucle (poll périodique + jitter). `unref()` — ne retient
 * jamais le process. Retourne { stop, tick }.
 */
export function startAgentUpdateLoop(opts) {
  const pollIntervalMs = opts.pollIntervalMs ?? 300_000;
  const jitterMaxMs = opts.jitterMaxMs ?? 60_000;
  let stopped = false;
  let timer = null;
  const tick = async () => {
    try {
      const r = await runAgentUpdateCycle(opts);
      if (r.polled && (r.applied || r.errors.length)) {
        opts.audit?.(
          `pull-updates: applied=${r.applied} skipped=${r.skipped} errors=${r.errors.length}`,
        );
      }
      return r;
    } catch (e) {
      opts.audit?.(`pull-updates cycle KO: ${e?.message || e}`);
      return null;
    }
  };
  const schedule = () => {
    if (stopped) return;
    const delay = pollIntervalMs + Math.floor(Math.random() * jitterMaxMs);
    timer = setTimeout(async () => {
      await tick();
      schedule();
    }, delay);
    if (timer.unref) timer.unref();
  };
  // Premier cycle rapide (délai court) puis rythme nominal.
  timer = setTimeout(async () => {
    await tick();
    schedule();
  }, 10_000 + Math.floor(Math.random() * 5_000));
  if (timer.unref) timer.unref();
  return {
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
    tick,
  };
}
