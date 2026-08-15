/**
 * Politique owner first-run de `server-docker create` — fail-closed VPS / prod.
 *
 * Un create « prod / VPS » ne réussit pas sans compte owner utilisable
 * (`POST /api/v1/os/setup` + login kit). Contrat unique cloud + VPS :
 *   CREEZIO_OWNER_EMAIL
 *   CREEZIO_OWNER_PASSWORD
 * `CREEZIO_TUNNEL_LOCAL=1` (dev machine) : owner optionnel.
 * Jamais le mot de passe dans les logs ni les messages d'erreur.
 */

export const CREATE_OWNER_ENV_KEYS = [
  "CREEZIO_OWNER_EMAIL",
  "CREEZIO_OWNER_PASSWORD",
] as const;

export type CreateOwnerPolicyInput = {
  /** Aligné sur la politique tunnel : `true` seulement si create LOCAL (pas `--profile prod`). */
  local: boolean;
  /** Env fusionné (process + .env marque + `--env`) — jamais de secrets en log. */
  env: Record<string, string | undefined>;
};

export type CreateOwnerPolicy =
  | { mode: "skip"; reason: "local-optional" }
  | { mode: "create"; email: string; password: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function formatMissingOwnerError(): string {
  return [
    "create VPS/prod refuse une instance sans compte owner utilisable : CREEZIO_OWNER_EMAIL et CREEZIO_OWNER_PASSWORD sont requis.",
    "",
    "Poser les vars dans le .env de la marque (gitignoré), les exporter avant create,",
    "ou les injecter en Runtime Secrets cloud (mêmes noms — pas E2E_OWNER_*).",
    "Le create appelle POST /api/v1/os/setup puis vérifie POST /api/v1/auth/login.",
    "",
    "Dev local (owner optionnel) : CREEZIO_TUNNEL_LOCAL=1",
  ].join("\n");
}

export function formatInvalidOwnerError(kind: "email" | "password" | "partial"): string {
  if (kind === "partial") {
    return "CREEZIO_OWNER_EMAIL et CREEZIO_OWNER_PASSWORD doivent être posés ensemble (un seul des deux est une erreur).";
  }
  if (kind === "email") {
    return "CREEZIO_OWNER_EMAIL invalide — attendu un e-mail (ex. owner@acme.example).";
  }
  return "CREEZIO_OWNER_PASSWORD trop court (min. 6 caractères, même règle que le setup kit).";
}

function readOwnerCreds(env: Record<string, string | undefined>): {
  email: string;
  password: string;
} {
  return {
    email: String(env.CREEZIO_OWNER_EMAIL || "").trim(),
    password: String(env.CREEZIO_OWNER_PASSWORD || "").trim(),
  };
}

/**
 * Décide skip vs create. Défaut VPS/prod = create obligatoire (fail-closed).
 * LOCAL=1 : skip si les deux vars manquent ; partiel / invalide = échec.
 */
export function resolveCreateOwnerPolicy(
  input: CreateOwnerPolicyInput,
): CreateOwnerPolicy {
  const { email, password } = readOwnerCreds(input.env);
  if (!email && !password) {
    if (input.local) return { mode: "skip", reason: "local-optional" };
    throw new Error(formatMissingOwnerError());
  }
  if (!email || !password) {
    throw new Error(formatInvalidOwnerError("partial"));
  }
  if (!EMAIL_RE.test(email)) {
    throw new Error(formatInvalidOwnerError("email"));
  }
  if (password.length < 6) {
    throw new Error(formatInvalidOwnerError("password"));
  }
  return { mode: "create", email, password };
}

export function redactSecret(text: string, secret: string): string {
  if (!secret) return text;
  return text.split(secret).join("***");
}

export function formatOwnerLoginLog(email: string): string {
  return `login : ${email}`;
}

export async function applyFirstRunOwner(opts: {
  baseUrl: string;
  email: string;
  password: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true; username: string }> {
  const fetchFn = opts.fetchImpl || fetch;
  const base = String(opts.baseUrl || "").replace(/\/+$/, "");
  const email = opts.email;
  const password = opts.password;
  const wrap = (err: unknown) => {
    const raw = err instanceof Error ? err.message : String(err);
    return new Error(redactSecret(raw, password));
  };

  let statusJson: { setupComplete?: boolean; username?: string | null };
  try {
    const statusRes = await fetchFn(`${base}/api/v1/os/setup`);
    statusJson = (await statusRes.json()) as typeof statusJson;
  } catch (err) {
    throw wrap(err);
  }

  if (statusJson?.setupComplete) {
    const existing = String(statusJson.username || "").trim();
    if (existing && existing !== email) {
      throw new Error(
        `setup déjà complet pour ${existing} — CREEZIO_OWNER_EMAIL=${email} ne correspond pas (pas d'écrasement).`,
      );
    }
    return { ok: true, username: existing || email };
  }

  let setupJson: { ok?: boolean; error?: string; username?: string };
  try {
    const setupRes = await fetchFn(`${base}/api/v1/os/setup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: email, password }),
    });
    setupJson = (await setupRes.json()) as typeof setupJson;
    if (setupRes.status !== 200 || !setupJson?.ok) {
      throw new Error(
        `POST /api/v1/os/setup → ${setupRes.status} ${String(setupJson?.error || "échec first-run")}`,
      );
    }
  } catch (err) {
    throw wrap(err);
  }

  try {
    const loginRes = await fetchFn(`${base}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (loginRes.status !== 200) {
      const body = await loginRes.text().catch(() => "");
      throw new Error(
        `owner créé mais POST /api/v1/auth/login → ${loginRes.status} ${body.slice(0, 160)}`,
      );
    }
  } catch (err) {
    throw wrap(err);
  }

  return { ok: true, username: String(setupJson.username || email) };
}
