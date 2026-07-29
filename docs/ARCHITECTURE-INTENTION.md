# Architecture intention — Creezio (cadre H0)

> **Phase H0** — décisions **verrouillées** par l’utilisateur (2026-07-29).  
> Ce document fixe le *pourquoi* et le *où* ; le *comment packagé* est dans
> [BACKLOG-H1-PACKAGES.md](BACKLOG-H1-PACKAGES.md).  
> Constante runtime : `ARCHITECTURE_VERSION` dans `@creezio/platform-core`
> (`"H1"` après sign-off H1 ; était `"H0"` au cadre).

---

## 1. Intention (non-technique)

### Qu’est-ce que Creezio ?

Creezio est une **base stable type CMS** pour lancer rapidement un produit
desktop Client + Serveur sous une marque (TempoFlow, Fidu, Certivan…).

On démarre avec :

- une identité marque (nom, feeds, tunnel, bridge) ;
- un cœur technique partagé (auth, shell, assistant, API, MCP, hosts n8n/Hermes,
  recherche, Product Hub / plugins) ;
- un **espace métier vide** prêt à accueillir les modules de la marque.

La marque évolue souvent (catalogue, dispatch, GED…). Le kit Creezio évolue
plus lentement : c’est le socle, pas le métier.

### Trois couches à retenir

| Couche | Qui la possède | Exemples |
|--------|----------------|----------|
| **Natif Creezio** | Kit `@creezio/*` | Auth, nav + slots, chat, API façade, MCP, splash, tasks/mails plateforme, Product Hub, tunnel, Meili, hosts n8n/Hermes |
| **Modules métier** | **Repo de la marque** | Panier, dispatch, relevés, optimiser, catalogue (TempoFlow) ; GED (Fidu) ; RTI (Certivan) |
| **Plugins** | Organisation cliente (ACL) | Sidecars créés / installés par users, visibles selon droits org |

### Analogie simple

- Creezio ≈ WordPress **core** + admin + API.
- Modules métier ≈ thème + plugins **officiels** livrés avec le produit marque.
- Plugins orga ≈ extensions installées chez le client, avec qui peut les voir.

### Promotion plugin → module natif marque

Ce n’est **pas** un bouton magique. C’est un **processus humain / produit** :

1. revue (qualité, sécurité, valeur) ;
2. intégration dans le **repo de la marque** ;
3. release Client/Serveur de la marque ;
4. les données rejoignent alors le **SQLite métier** (plus le fichier plugin).

---

## 2. Intention technique

### SQLite multi-fichiers

Une instance Serveur (jour 0) ouvre **deux** bases, pas une seule monolithe :

| Fichier | Contenu | Création |
|---------|---------|----------|
| **`core`** | Cœur Creezio (auth, sessions, tasks/mails plateforme, Product Hub registry, config…) | Jour 0 |
| **`brand` / métier** | Schéma des modules natifs de la marque | Jour 0 (schéma modules, même vide) |
| **`plugin/<id>`** | Données d’un plugin installé | **À l’install** du plugin uniquement |

Chemins existants côté kit (à faire évoluer en H1) :

- `resolveDbPath` → aujourd’hui *un* `dbFileName` manifeste (souvent métier TF) ;
- `resolveAssistantDbPath` → `assistant_chats.db` (précédent du découpage multi-fichiers).

Cible H1+ : API paths explicite `core` / `brand` / `plugin/<id>` sans casser les
marques déjà branchées (migration douce).

### Modules métier = repo marque

- **Pas** dans le kit Creezio.
- Le kit expose des **contrats** (nav slots, façade API/MCP, stores, hooks).
- La marque implémente et versionne son métier indépendamment.

### Nav = nav Creezio + slots

- La navigation principale est celle des **fonctionnalités natives Creezio**.
- Le package nav expose des **slots** où la marque branche onglets / vues métier.
- Ce n’est **pas** « la nav TempoFlow générique » — TempoFlow (ou Fidu…) *remplit*
  les slots.

Aujourd’hui : placeholders factory (`nav-core.ts` + `vertical-slot.ts`).  
Cible H1 : `@creezio/shell-ui` (ou équivalent) avec contrat de slots typé.

### API + MCP : une façade unique

Un seul domaine / une seule API d’entrée qui **proxifie** :

1. API cœur Creezio ;
2. APIs modules métier (découvertes) ;
3. APIs plugins (découvertes).

Même principe MCP : **tools cœur (admin)** + **tools métier / modules / plugins**
découverts. Pas de « produit MCP Creezio » séparé du MCP de l’app.

### Plugins = organisation + ACL

- Créés éventuellement par des users, mais ce sont des **plugins d’organisation**.
- Granularité ACL (qui voit / utilise) — Product Hub L3/L4 déjà contracté.
- Pas d’univers perso totalement séparé (pas de silo user hors org).

### Multi-exe Client + Serveur par marque

Chaque `AppManifest` expose **toujours** `client` + `server` + `publish`
(déjà livré Phases A–G).

### Serveur neuf — jour 0

1. SQLite **core** Creezio ;
2. SQLite **métier** (schéma modules marque) ;
3. SQLite **plugins** : aucun fichier tant qu’aucun plugin n’est installé.

---

## 3. Schéma des 3 couches

```text
┌─────────────────────────────────────────────────────────────────┐
│  Produit marque (exe Client + Serveur)                            │
│  TempoFlow / Fidu / Certivan / DemoBrand…                         │
├─────────────────────────────────────────────────────────────────┤
│  Couche 2 — MODULES MÉTIER          (repo marque)                 │
│  panier · dispatch · relevés · optimiser · catalogue · …        │
│  → SQLite brand                                                     │
├─────────────────────────────────────────────────────────────────┤
│  Couche 1 — NATIF CREEZIO           (kit @creezio/*)              │
│  auth · shell-ui/nav+slots · assistant · api-kernel · mcp-facade  │
│  splash/host · tasks · mails · product-hub · tunnel · meili       │
│  n8n/hermes hosts · brand-config · platform-core · tooling…       │
│  → SQLite core                                                      │
├─────────────────────────────────────────────────────────────────┤
│  Couche 3 — PLUGINS ORGA            (ACL Product Hub)             │
│  sidecars installés · tools MCP découverts · data isolée          │
│  → SQLite plugin/<id> (créé à l’install)                          │
└─────────────────────────────────────────────────────────────────┘

                    ▲ une façade API + MCP
                    │ proxifie cœur + modules + plugins
```

### Propagation (rappel Phases F)

- **Descente** : kit → vertical marque → org → user (entitlements).
- **Remontée** : plugin terrain → review org → intégration marque → (rare)
  acceptation kit natif.
- Promotion plugin → **module marque** = revue humaine (décision §1), pas auto.

Voir [PROPAGATION.md](PROPAGATION.md).

---

## 4. Décisions verrouillées (ne pas rediscuter)

1. **SQLite multi-fichiers** : `core` / `brand` / `plugin/<id>` ; promotion
   plugin→module marque = processus humain ; données → SQLite métier.
2. **Modules métier dans le repo marque**, pas dans le kit ; Creezio = CMS stable.
3. **Nav = nav Creezio** avec **slots** métier ; pas « nav TempoFlow » dans le kit.
4. **API + MCP** : façade unique qui proxifie cœur + modules + plugins ;
   un seul MCP d’app (tools découverts), pas un produit MCP séparé.
5. **Plugins d’organisation** + ACL granulaire ; pas d’univers perso isolé.
6. **Multi-exe Client + Serveur** par marque.
7. **Serveur neuf jour 0** : SQLite core + SQLite métier ; plugins à l’install.

---

## 5. Frontière kit vs marques

| Dans le kit (`/opt/docker/creezio`) | Hors kit (repos marques) |
|-------------------------------------|---------------------------|
| Packages `@creezio/*`, console, factory, demobrand | tempoflow2, fidu, certivan-app |
| Contrats, hosts, tooling, Product Hub générique | Domaine métier, seeds, UI CRM, migrations exécutées |
| Docs cadre H0 / backlog H1 | Releases exe marque, feeds publish |

Phases A→G (extraction + gates) : **terminées** — voir [DOD-PHASE-A-G.md](DOD-PHASE-A-G.md).  
Phase H0 : **cadre** — ce document + matrice + backlog.  
Phase H1 : **création des packages** listés dans le backlog.

---

## 6. Références

| Doc | Rôle |
|-----|------|
| [MATRICE-NATIVE-METIER-PLUGIN.md](MATRICE-NATIVE-METIER-PLUGIN.md) | Cartographie + statut ✅/🟡/❌ |
| [BACKLOG-H1-PACKAGES.md](BACKLOG-H1-PACKAGES.md) | Packages `@creezio/*` à créer |
| [PHASE-H0.md](PHASE-H0.md) | Sign-off H0 |
| [PLATFORM-VS-VERTICAL.md](PLATFORM-VS-VERTICAL.md) | Matrice de portage historique A–G |
| [PROPAGATION.md](PROPAGATION.md) | Semver / canaux / extension points |
