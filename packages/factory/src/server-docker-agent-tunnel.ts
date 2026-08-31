/**
 * Tunnel cloudflared DÉDIÉ au host-agent (T7) — helpers purs du CLI.
 *
 * `creezio server-docker enroll` provisionne un tunnel Cloudflare PROPRE à
 * l'agent (nom CF `creezio-agent-<slug>`, ingress unique
 * `agent.{slug}.{zone}` → 127.0.0.1:<port agent>) et fait tourner son
 * connecteur dans un container dédié `creezio-agent-tunnel` — l'agent ne
 * dépend plus du cloudflared in-process d'un serveur applicatif du VPS
 * (serveur down/recréé ≠ agent injoignable).
 *
 * Sécurité : le token du connecteur vit UNIQUEMENT dans
 * `docker-data/agent-tunnel.env` (chmod 600, `TUNNEL_TOKEN=`) — jamais en
 * argv (docker inspect / ps), jamais dans host-agent.json ni les logs.
 *
 * Respawn : `--restart unless-stopped` côté Docker + surveillance bornée
 * par le host-agent (`@creezio/fleet` `agent-tunnel.ts`, miroir de la
 * politique cloudflared-respawn).
 */

import path from "node:path";

/** Nom du container cloudflared dédié agent (aligné @creezio/fleet). */
export const AGENT_TUNNEL_CONTAINER = "creezio-agent-tunnel";

/**
 * Image du connecteur — l'image officielle cloudflared (le binaire seul,
 * pas d'app Creezio dedans). Override : `CREEZIO_AGENT_TUNNEL_IMAGE`.
 */
export const AGENT_TUNNEL_IMAGE_DEFAULT = "cloudflare/cloudflared:latest";

export function resolveAgentTunnelImage(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return (
    String(env.CREEZIO_AGENT_TUNNEL_IMAGE || "").trim() ||
    AGENT_TUNNEL_IMAGE_DEFAULT
  );
}

/** Env file 600 du token connecteur — à côté de host-agent.json. */
export function agentTunnelEnvPath(brandRoot: string): string {
  return path.join(brandRoot, "docker-data", "agent-tunnel.env");
}

/** Contenu de l'env file (TUNNEL_TOKEN lu nativement par cloudflared). */
export function renderAgentTunnelEnvFile(tunnelToken: string): string {
  const token = String(tunnelToken || "").trim();
  if (!token) {
    throw new Error("agent-tunnel.env : tunnelToken vide (refus d'écrire)");
  }
  return `# Token du connecteur cloudflared dédié agent (T7) — chmod 600, jamais commité.\nTUNNEL_TOKEN=${token}\n`;
}

/**
 * Args `docker run` du connecteur dédié. Réseau host : cloudflared joint
 * l'agent en loopback (`127.0.0.1:<port>`) sans dépendre de docker0 /
 * host.docker.internal. `--protocol http2` : QUIC/UDP instable sur les VPS
 * (même règle que les tunnels hôte, skill fleet-ops §13). Token via
 * `--env-file` uniquement — jamais en argv.
 */
export function buildAgentTunnelRunArgs(opts: {
  image: string;
  envFile: string;
  container?: string;
}): string[] {
  return [
    "run",
    "-d",
    "--name",
    opts.container || AGENT_TUNNEL_CONTAINER,
    "--restart",
    "unless-stopped",
    "--network",
    "host",
    "--label",
    "creezio.agent-tunnel=1",
    "--env-file",
    opts.envFile,
    opts.image,
    "tunnel",
    "--no-autoupdate",
    "--protocol",
    "http2",
    "run",
  ];
}
