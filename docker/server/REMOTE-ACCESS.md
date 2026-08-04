# Accès distant — reverse proxy (nginx-proxy-manager)

Les serveurs Docker et l'admin publient leurs ports sur **127.0.0.1**
(sécurité par défaut). Pour un accès distant, passer par un reverse proxy
TLS — sur les VPS Creezio/TempoFlow, **nginx-proxy-manager** (NPM) est déjà
en service.

## Principe

| Service | Port local | Auth intégrée |
|---------|-----------|----------------|
| Serveur marque (CRM + API) | `127.0.0.1:1879x` (registre `docker-data/servers.json`) | Login CRM (session OS) |
| Creezio Server Admin | `127.0.0.1:18800` | Basic auth (`docker-data/server-admin.json`) |

Vérifier le mode réseau de NPM :

```bash
docker inspect nginx-proxy-manager --format '{{.HostConfig.NetworkMode}}'
```

- **`host`** (cas du VPS TempoFlow, vérifié) : NPM voit directement les
  ports loopback de l'hôte → *Forward Host* = `127.0.0.1`. Rien d'autre à
  changer.
- **bridge** : le loopback hôte n'est pas joignable depuis NPM → publier
  l'instance sur la passerelle Docker :

```bash
creezio server-docker create prod --brand-root … --bind 172.17.0.1
```

  (la passerelle n'est pas routée publiquement tant que le firewall bloque
  l'INPUT externe — à vérifier sur l'hôte).

## Proxy Host NPM (UI)

1. NPM → *Hosts → Proxy Hosts → Add Proxy Host*
2. Domain : `crm-demo.exemple.fr` — Scheme `http` — Forward Host
   `127.0.0.1` (NPM en host) ou `172.17.0.1` (bridge) — Forward Port
   `18793` (port de l'instance, voir `creezio server-docker ls`)
3. Onglet SSL : *Request a new SSL Certificate* (Let's Encrypt) + Force SSL
4. Websockets Support : **ON** (UI Next / assistant)

Pour l'admin (`18800`) : ajouter en plus une **Access List** NPM (ou laisser
la Basic auth intégrée — les deux se cumulent).

## Garde-fous

- Ne jamais exposer `--expose`/`SERVER_BIND=0.0.0.0` sans firewall + TLS.
- L'admin donne le contrôle Docker (create/rm) : ne l'exposer qu'avec TLS +
  Basic auth + idéalement une allowlist IP.
- Ne pas réutiliser les domaines prod TF2 (`crm.tempoflow.fr`, `/server/`)
  ni toucher leurs proxy hosts existants.
