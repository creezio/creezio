/**
 * Scaffold du repo ADMIN dédié d'une marque (`<brand>-admin`).
 *
 * Toute marque factory est livrée en 2 repos GitHub privés :
 *   - monorepo marque   : server/ client/ brand-spec/ vendor/
 *   - repo admin flotte : config server-admin.json + fleet-hosts.json
 *     versionnées SANS secrets ; runtime (pass, tokens) sous docker-data/
 *     gitignoré.
 *
 * L'admin tourne sur le VPS propriétaire (`admin.{domaine}`), réservé au
 * propriétaire de la marque — jamais accessible aux restaurateurs.
 */

import fs from "node:fs";
import path from "node:path";

export type AdminRepoOptions = {
  /** Dossier cible du repo admin (ex. /opt/docker/tempoflow-admin). */
  outDir: string;
  brandId: string;
  productName: string;
  /** Domaine marque (zone tunnel) — l'admin vit sur admin.{domain}. */
  domain: string;
  /** Brand roots par défaut du plan local (souvent vide en multi-VPS pur). */
  brandRoots?: string[];
  force?: boolean;
};

export type AdminRepoResult = {
  outDir: string;
  writtenFiles: string[];
};

function writeFile(
  file: string,
  content: string,
  force: boolean,
  written: string[],
): void {
  if (fs.existsSync(file) && !force) {
    throw new Error(`refus d'écraser sans --force: ${file}`);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  written.push(file);
}

function renderServerAdminJson(o: AdminRepoOptions): string {
  return (
    JSON.stringify(
      {
        port: 18800,
        user: "admin",
        brandId: o.brandId,
        domain: o.domain,
        brandRoots: o.brandRoots || [],
      },
      null,
      2,
    ) + "\n"
  );
}

function renderFleetHostsJson(): string {
  // Miroir versionnable SANS tokens — le runtime (avec tokens agents) vit
  // dans docker-data/fleet-hosts.json, régénéré par le server-admin.
  return JSON.stringify({ version: 1, hosts: [] }, null, 2) + "\n";
}

function renderGitignore(): string {
  return `# Runtime admin (secrets : pass Basic, tokens agents) — jamais commité
docker-data/
.env
.github-token
node_modules/
`;
}

function renderEnvExample(o: AdminRepoOptions): string {
  return `# ${o.productName} admin — secrets locaux (copier en .env, gitignoré)

# Auth Basic de l'admin web (le CLI génère un pass runtime si absent)
# CREEZIO_ADMIN_USER=admin
# CREEZIO_ADMIN_PASS=…

# Registre d'images versionnées (update de flotte)
# CREEZIO_REGISTRY=127.0.0.1:5000
# CREEZIO_REGISTRY_BASIC=user:pass          # API registre protégée (tags)
# CREEZIO_REGISTRY_AUTH=…                   # base64 docker auth (pull agents)
`;
}

function renderComposeYml(o: AdminRepoOptions): string {
  return `# Admin web multi-serveurs / multi-VPS ${o.productName}
# Image kit \`creezio-server-admin:local\` (fleet-collector étendu,
# packagée depuis $CREEZIO_KIT_ROOT/docker/server-admin).
#
# Chemin nominal (build + run + config runtime docker-data/) :
#   creezio server-docker admin up --admin-root .
#
# Ce compose est l'alternative déclarative (image déjà buildée par le CLI) :
#   CREEZIO_ADMIN_PASS=… docker compose up -d

name: ${o.brandId}-admin

services:
  server-admin:
    image: creezio-server-admin:local
    container_name: creezio-server-admin
    restart: unless-stopped
    # host network : sonde les serveurs locaux 127.0.0.1:<port> ;
    # l'admin lui-même bind 127.0.0.1 (exposition via reverse proxy TLS).
    network_mode: host
    labels:
      creezio.server-admin: "1"
    environment:
      CREEZIO_ADMIN_PORT: \${CREEZIO_ADMIN_PORT:-18800}
      CREEZIO_ADMIN_USER: \${CREEZIO_ADMIN_USER:-admin}
      CREEZIO_ADMIN_PASS: \${CREEZIO_ADMIN_PASS:?secret runtime — voir docker-data/server-admin.json}
      CREEZIO_ADMIN_ROOT: \${PWD}
      CREEZIO_ADMIN_BRAND_ROOTS: \${CREEZIO_ADMIN_BRAND_ROOTS:-}
      CREEZIO_REGISTRY: \${CREEZIO_REGISTRY:-}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - .:\${PWD}
`;
}

function renderReadme(o: AdminRepoOptions): string {
  return `# ${o.productName} — admin flotte

Pilotage de la flotte multi-VPS **${o.productName}** (\`admin.${o.domain}\`,
réservé au propriétaire — les restaurateurs n'y accèdent jamais).

L'admin **initie tous les appels** vers les VPS restaurants via leurs
adresses tunnelisées : CRM/santé \`https://{slug}.${o.domain}\`, actions
Docker via l'agent hôte \`https://agent.{slug}.${o.domain}\` (Bearer token
hashé, révocable).

## Démarrer

\`\`\`bash
# Image + container + config runtime (pass généré sous docker-data/) :
creezio server-docker admin up --admin-root .
# → http://127.0.0.1:18800/admin (exposer via reverse proxy TLS en prod)
\`\`\`

## Enrôler un VPS restaurant

1. UI admin → « Générer un token d'enrôlement » (affiché une fois).
2. Sur le VPS restaurant (marque déployée + serveur Docker + tunnel) :

\`\`\`bash
creezio server-docker agent up --brand-root .
creezio server-docker enroll --brand-root . \\
  --admin https://admin.${o.domain} --token <enrollToken> --slug <slug>
\`\`\`

3. L'hôte apparaît dans l'admin (santé, serveurs, logs, update).

## Mettre à jour un restaurant

\`\`\`bash
# 1. Publier une version (VPS build) :
creezio server-docker publish --brand-root <marque> --tag 0.2.0 --registry <registre>
# 2. UI admin → serveur → « Mettre à jour » → tag 0.2.0
#    (backup /data auto, health-check, rollback auto si KO)
\`\`\`

## Fichiers

| Fichier | Rôle |
|---------|------|
| \`server-admin.json\` | Config versionnée SANS secret (port, user, brandRoots, brandId/domaine) |
| \`fleet-hosts.json\` | Hôtes enrôlés SANS tokens (miroir généré) |
| \`docker-compose.admin.yml\` | Alternative déclarative au CLI |
| \`.env.example\` | Secrets locaux à copier en \`.env\` |
| \`docker-data/\` | Runtime gitignoré (pass Basic, tokens agents, registres) |

Doc kit : \`$CREEZIO_KIT_ROOT/docker/server-admin/README.md\`.
`;
}

export function scaffoldAdminRepo(o: AdminRepoOptions): AdminRepoResult {
  const outDir = path.resolve(o.outDir);
  const force = Boolean(o.force);
  const written: string[] = [];
  writeFile(
    path.join(outDir, "server-admin.json"),
    renderServerAdminJson(o),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "fleet-hosts.json"),
    renderFleetHostsJson(),
    force,
    written,
  );
  writeFile(path.join(outDir, ".gitignore"), renderGitignore(), force, written);
  writeFile(
    path.join(outDir, ".env.example"),
    renderEnvExample(o),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "docker-compose.admin.yml"),
    renderComposeYml(o),
    force,
    written,
  );
  writeFile(path.join(outDir, "README.md"), renderReadme(o), force, written);
  return { outDir, writtenFiles: written };
}
