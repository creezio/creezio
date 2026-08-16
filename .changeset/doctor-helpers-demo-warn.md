---
"@creezio/brand-spec": patch
---

**doctor — helpers ignorés ; démo pauvre / pin < 0.10.1 = warn.**

`creezio brand doctor` ne traite plus `_lib`, `shared.ts`, `mcp-shared.ts`, `meili-shared.ts`, `index.ts`, `types.ts` comme des modules (plus de `MODULE_DEMO_MISSING` sur l'assemblage). Une démo trop pauvre (pas d'`autoStart`, steps trop courts) émet `MODULE_DEMO_THIN` en **warn**, pas fail-closed. Un pin kit < 0.10.1 (ex. Winhub encore en 0.9.2) : démo absente = warn — le CLI reste celui de `CREEZIO_KIT_ROOT`.
