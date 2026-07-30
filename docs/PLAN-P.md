# Plan P* — Atteindre 100 % intention OS (post-O11)

**SoT écart + checklist :** [ETAT-DES-LIEUX-INTENTION.md](ETAT-DES-LIEUX-INTENTION.md)

**Baseline** : kit tip au commit de cet état des lieux · marques TF/CV/Fidu
post-O11 feeds.

**Règles non négociables**

- Intention = ARCHITECTURE-INTENTION (CMS + 3 couches), **pas** « finir MCP ».
- Commun = `@creezio/*` ; marques = minimum métier.
- Façades / stubs / jumeaux = **NON done**.
- Extraire TempoFlow gold ; ne pas inventer.
- **Pas de P(n+1) si gate intention P(n) rouge.**
- Décisions trous documentaires (tasks kanban, cockpit, fabrique, Fidu fleet,
  paths multi-DB) **avant** le code concerné.

## Vagues

| Vague | Contenu | Effort |
|-------|---------|--------|
| **P0** | Gates intention + matrice honnête | S |
| **P1** | Décisions humaines (trous doc) | S |
| **P2** | Shell-UI jumeaux → kit | XL |
| **P3** | Tasks/AI/Hermes (si natif) | XL |
| **P4** | Product Hub routes + n8n provisioning | L |
| **P5** | MCP SoT unique | L |
| **P6** | Assistant routes / mounts | M |
| **P7** | Auth login UI + mails parité | M |
| **P8** | Fleet → kit/ops | M |
| **P9** | Server twins (schemas, mcp/oauth) | L |
| **P10** | Boot + multi-DB paths | M |
| **P11** | Purge vocabulaire TF kit | L |
| **P12** | Obs / automations lifecycle parité | M |
| **P13** | Scripts/tests twins | L |
| **P14** | Freeze intention 100 % + republish | S |

Détail done / étapes / risques : §E–G de l’état des lieux.
