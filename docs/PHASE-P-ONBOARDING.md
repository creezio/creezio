# Phase P — Onboarding / Setup (DRAFT — arbitrage packages)

| | |
|--|--|
| **Statut** | ⏸️ **DRAFT / NON DÉFINITIF** — attente arbitrage découpage packages |
| **Date** | 2026-07-30 |
| **Hypothèse initiale (contestée)** | Moteur dans `@creezio/shell-ui` |
| **Blocage** | L’utilisateur questionne « onboarding ∈ shell-ui » (risque fourre-tout). Un autre agent audite le scope réel de `shell-ui`. **Ne pas implémenter ni conclure** tant que le package cible n’est pas tranché (`shell-ui` vs package dédié vs autre). |
| **Repos** | TF `tempoflow2` · CV `certivan-app` · Fidu `fidu` · kit `creezio` |
| **SoT intention** | [ETAT-DES-LIEUX-INTENTION.md](ETAT-DES-LIEUX-INTENTION.md) §0 (×3 = NATIF) — *où* (quel package) = **ouvert** |
| **Hors scope** | Implémentation, cutover, tout autre pilier P |

> **⚠ Ce document n’est PAS une décision d’architecture package.**
> L’audit comparatif TF/CV/Fidu (commun vs divergences) reste utile comme
> matière. Les sections « design cible / API / plan → shell-ui » sont une
> **hypothèse de placement** à revalider ou à déplacer (ex. `@creezio/onboarding`,
> autre) après l’audit scope `shell-ui`.

> **Règle gelée.** Aucune extraction ni cutover onboarding/setup tant que le
> découpage package n’est pas tranché.

---

## 0. Verdict en une phrase

**Setup** = jumeau quasi-identique ×3 (sim ≥ 0,97) → **extrait kit à 100 %**
via `ShellUiBrand` + config. **Onboarding** = **moteur UI commun** (stepper,
micro-questions, advance/skip/complete) ×3 + **contenu/API métier divergent**
→ kit = moteur + slots ; pas le schéma restaurant TF.

---

## 1. Audit comparatif TF × CV × Fidu

### 1.1 Fichiers & volumétrie (UI + pages)

| Surface | TF | CV | Fidu |
|---------|----|----|------|
| `components/setup/setup-wizard.tsx` | 484 LOC | 484 (sim **0,975** vs TF) | 484 (sim **0,971** vs TF) |
| `app/setup/page.tsx` | 7 LOC | 7 | 7 |
| `components/onboarding/*` | ~2,8 kLOC (8 steps + micro + import) | ~0,6 kLOC (3 steps, **sans** micro) | ~2,2 kLOC (8 steps + micro) |
| `onboarding-shell.tsx` (Stepper) | 89 · labels resto | 78 · 3 labels | 88 · labels cabinet |
| `micro.tsx` | 362 | — | 362 (**sim 1,000** vs TF) |
| `onboarding-wizard.tsx` | 336 | 153 (sim 0,51) | 234 (sim 0,70) |
| Routes `server/routes/onboarding.ts` | 309 | 309 (**identique** TF) | **76** (profil only) |
| `lib/onboarding-queries.ts` | 474 | 474 (twin TF) | 297 (cabinet) |

### 1.2 Flow setup (commun ×3)

Séquence **identique** :

1. **Compte** — username / password / confirm / « rester connecté »
2. **Récupération** — génération clé IPC + ack + copie
3. **Tunnel** — slug + `checkTunnelSlug` + preview `*.{suffix}`
4. **OpenAI** — BYOK + `completeSetup` → redirect `/onboarding`

Contrats IPC (déjà kit `electron-shell` / `shell`) : `getSetupStatus`,
`generateRecoveryKey`, `checkTunnelSlug`, `completeSetup`,
`setAssistantChrome`, `rechooseConnection`.

Gate middleware ×3 : `SETUP_COMPLETE !== "1"` + desktop local → force `/setup`
(hors chrome workspace).

### 1.3 Divergences setup (uniquement branding / copy)

| Point | TF | CV | Fidu |
|-------|----|----|------|
| `window.*Desktop` | `tempoflowDesktop` | `certivanDesktop` | `fiduDesktop` |
| Nom produit UI | TempoFlow | Certivan | Fidu |
| Suffixe tunnel | `tempoflow.fr` | `certivan.creez.io` | `fidu.creez.io` |
| Placeholder slug | `mon-restaurant` | `mon-restaurant` | `mon-cabinet` |
| Phrase étape 3 | « adresse mobile » | idem TF | « adresse d’accès distant (tunnel) » |
| Couleur accent | `#f0701d` (hardcodé ×3) | idem | idem |
| Fond | `#14182f` | idem | idem |

**Aucune** divergence de validation, d’ordre d’étapes, ni de payload
`completeSetup`. Le wizard utilise déjà `Button` / `Input` de
`@creezio/shell-ui/ui`, mais **pas** `getShellDesktopApi()` /
`getShellUiBrand()`.

### 1.4 Flow onboarding — commun vs divergences

#### Commun (plateforme shell)

| Brique | Preuve ×3 |
|--------|-----------|
| Routes pages `/onboarding` + `?step=` | Oui |
| Shell plein écran `onb-stage` + Fraunces | Oui (CSS globals marques) |
| Palette crème / encre `#14182f` / teal `#0e7b7b` / orange `#f0701d` | Oui |
| **Stepper** visuel (cercles + traits + labels) | Code quasi-identique ; **labels** injectés |
| Intro : grid promesses + CTA Commencer / Plus tard | Layout commun ; **copy + hero** diverge |
| Persistence `onboarding_step` + `POST /skip` + `POST /complete` | Oui (chemins API identiques) |
| `editMode` → saute au récap | Oui |
| Sortie → home | TF/CV : `resolveDesktopHomePath()` (kit) ; Fidu : hardcode `/dashboard` |
| Hors workspace tabs | `workspace/types.ts` kit exclut déjà `/setup` `/onboarding` |

#### Divergences front (métier — restent marque)

| | TF | CV | Fidu |
|--|----|----|------|
| Nb étapes | **8** | **3** | **8** |
| Labels stepper | Bienvenue → Établissement → Achats → Fournisseurs → Objectifs → Contraintes → Préférences → Récap | Bienvenue → Atelier → Récap | Bienvenue → Cabinet → Organisation → Collecte → Relances → Portail → Communications → Récap |
| Micro-questions | Oui (`micro.tsx`) | Non (formulaires simples) | Oui (**même** `micro.tsx` que TF) |
| Interstitiels titre | Oui | Non | Oui |
| Hero intro | mascotte `/tempo/tempo-waving.png` + « Tempo » | badge « CV » | mascotte Tempo (dette branding) |
| Domaine données | restaurant + profil achats + imports/lignes | reuse table `restaurant` (nom/ville/responsable) | `cabinet_profil` + formes juridiques + seed |
| Import fichiers | Oui (step Achats) | Non (routes twin **mortes** côté UI) | Non |
| Copy | achats / économies / fournisseurs | VASP / RTI / DREAL | cabinet / GED / relances / portail |

#### Backend (hors `shell-ui` — pour ne pas mal découper)

- **TF ↔ CV** : routes + queries + `import-parser` **jumeaux** ; CV UI n’utilise
  qu’un sous-ensemble (`/restaurant`, `/profil`, skip/complete). Dette :
  schéma « restaurant » sous CV.
- **Fidu** : API mince adaptée cabinet — **bon modèle** de perso côté serveur
  (pas d’obligation à unifier le schéma SQLite dans `shell-ui`).

**Conclusion découpe :** le kit porte le **chrome + moteur de parcours** ;
chaque marque fournit `steps[]` (composants + labels + handlers API). Les
routes HTTP / migrations restent **marque** (ou package data ultérieur) —
**pas** une dette bloquante du 100 % `shell-ui` onboarding UI.

### 1.5 Couplage minimal hors périmètre

| Dépendance | Pourquoi mentionnée | Action dans ce plan |
|------------|---------------------|---------------------|
| `ShellUiBrand` / `getShellDesktopApi` | Setup hardcode encore `window.*Desktop` | **Réutiliser** (déjà kit) |
| `AuthWindowChrome` | Chrome frameless login/setup | Setup kit doit s’en servir (ou documenter wrap page) |
| `resolveDesktopHomePath` | Sortie onboarding TF/CV | API onboarding kit l’utilise par défaut ; Fidu override optionnel |
| Exclusion paths workspace | Déjà dans `ui/workspace/types.ts` | **Aucun** chantier sidebar |
| Middleware `SETUP_COMPLETE` | Gate first-run | Reste marque (1 fichier) — hors extract UI |
| Cockpit serveur | Cible home `appKind=server` | Lien via `resolveDesktopHomePath` seulement |

---

## 2. État actuel kit `packages/shell-ui`

| Attendu onboarding/setup | Présent ? | Où |
|--------------------------|-----------|-----|
| `SetupWizard` | ❌ | — (100 % local ×3) |
| `OnboardingWizard` / host steps | ❌ | — |
| `Stepper` / `OnboardingShell` | ❌ | — |
| `micro` (MicroScreen, useMicro, …) | ❌ | — (TF≡Fidu local) |
| CSS `onb-*` | ❌ | dans `globals.css` marques |
| Brand tokens (`productName`, `publicHostSuffix`, desktop API) | ✅ | `src/brand.ts` |
| `getShellDesktopApi` | ✅ | `src/brand.ts` |
| `resolveDesktopHomePath` | ✅ | `src/lib/desktop-home-path.ts` |
| Exclusion `/setup` `/onboarding` workspace | ✅ | `ui/workspace/types.ts` |
| `AuthWindowChrome` | ✅ | `ui/desktop/auth-window-chrome.tsx` |
| Primitives Button/Input | ✅ | déjà consommées par setup local |

**Gap :** zéro module `ui/setup/*` ni `ui/onboarding/*`. O9 a **explicitement
exclu** l’onboarding restaurateur — d’où la dette actuelle.

---

## 3. Design cible — moteur kit + API de perso

### 3.1 Principes

1. **Setup = 100 % kit** (une seule implémentation). Marque = `configureShellUiBrand` + overrides copy optionnels.
2. **Onboarding = moteur kit + registry de steps marque.** Zéro hardcode « restaurant » / « cabinet » / « atelier » dans le kit.
3. **Intelligent, pas clone TF :** CV court (3 steps) et Fidu cabinet doivent être des configs de première classe, pas des forks du parcours achats.
4. **Persistance / schéma = hors kit UI** : le host injecte un `OnboardingTransport` (fetch wrappers).
5. **Feature flags** pour activer/désactiver briques (ex. étape OpenAI obligatoire, interstitiels, skip, micro-engine).

### 3.2 API proposée — Setup

Fichiers cibles (indicatif) :

```
packages/shell-ui/ui/setup/
  setup-wizard.tsx          # composant unique
  setup-types.ts
  setup-copy.ts             # defaults FR + merge overrides
packages/shell-ui/ui/index.ts  # re-export SetupWizard
```

```ts
/** Config optionnelle — tout le reste vient de getShellUiBrand(). */
export type SetupWizardConfig = {
  /** Override labels étapes (défaut: Compte / Récupération / Tunnel / OpenAI). */
  stepLabels?: [string, string, string, string];
  /** Placeholder slug (défaut générique: "mon-espace"). */
  slugPlaceholder?: string;
  /** Phrase d’aide étape tunnel. */
  tunnelHelp?: string;
  /** Si false, étape 4 optionnelle / sautable (défaut true = actuel ×3). */
  requireOpenaiKey?: boolean;
  /** Redirect post-success (défaut "/onboarding"). */
  afterCompleteHref?: string;
  /** Accent CSS (défaut #f0701d — ou token brand futur). */
  accentColor?: string;
  /** Fond (défaut #14182f). */
  backgroundColor?: string;
};

export function SetupWizard(props?: { config?: SetupWizardConfig }): JSX.Element;
```

Règles internes :

- IPC **uniquement** via `getShellDesktopApi()` (plus de `window.tempoflowDesktop`).
- Copy produit / suffixe tunnel via `getShellUiBrand().productName` +
  `publicHostSuffix`.
- Fallback non-desktop : écran « lancez l’app desktop {productName} » (déjà là).
- Enveloppe recommandée page marque : `<AuthWindowChrome variant="dark"><SetupWizard /></AuthWindowChrome>`.

### 3.3 API proposée — Onboarding engine

```
packages/shell-ui/ui/onboarding/
  onboarding-shell.tsx      # Stepper({ steps, current })
  onboarding-wizard.tsx     # moteur
  micro.tsx                 # gold TF≡Fidu
  interstitial.tsx
  types.ts                  # types moteur (pas OnbRestaurant)
  onboarding.css.ts|css     # classes onb-* exportables / injectables
```

```ts
export type OnboardingStepId = string;

export type OnboardingStepDef = {
  id: OnboardingStepId;
  label: string;                 // stepper
  /** Titre interstitiel (si flags.interstitials). */
  interstitialTitle?: string;
  /**
   * Contenu step. Reçoit helpers du moteur.
   * La marque compose ses step-*.tsx ici.
   */
  render: (ctx: OnboardingStepContext) => React.ReactNode;
};

export type OnboardingStepContext = {
  stepIndex: number;
  entry: "start" | "end";       // reprise micro depuis la fin
  saving: boolean;
  skipping: boolean;
  advance: () => void;          // → index+1 + persist + interstitial?
  goTo: (index: number) => void;
  back: () => void;
  setSaving: (v: boolean) => void;
  setError: (msg: string | null) => void;
};

export type OnboardingTransport = {
  /** Persistance best-effort de l’index (PATCH profil step). */
  persistStep: (stepIndex: number) => void | Promise<void>;
  skip: () => Promise<void>;
  complete: () => Promise<void>;
};

export type OnboardingWizardFlags = {
  interstitials?: boolean;      // défaut true
  allowSkip?: boolean;          // défaut true
  /** ms affichage interstitiel */
  interstitialMs?: number;
};

export type OnboardingWizardProps = {
  steps: OnboardingStepDef[];   // inclut intro (0) + … + recap
  transport: OnboardingTransport;
  initialStep?: number;
  editMode?: boolean;           // → last step
  flags?: OnboardingWizardFlags;
  /** Après skip/complete (défaut resolveDesktopHomePath). */
  resolveExitHref?: () => Promise<string> | string;
  /** Slot erreur globale (optionnel). */
  className?: string;
};

export function OnboardingWizard(props: OnboardingWizardProps): JSX.Element;
export function Stepper(props: { steps: string[]; current: number }): JSX.Element;

/* Micro-engine — exportés pour steps marque */
export {
  useMicro,
  MicroScreen,
  MicroLabel,
  BigInput,
  BigOption,
  AUTO_ADVANCE_MS,
};
```

#### Composition marque (exemples — pas du code livré ici)

```ts
// TempoFlow — 8 steps métier locaux
<OnboardingWizard
  steps={[
    { id: "intro", label: "Bienvenue", render: (ctx) => <StepIntro … /> },
    { id: "restaurant", label: "Établissement", interstitialTitle: "…", render: … },
    // …
  ]}
  transport={tfTransport}   // wrap /api/v1/onboarding
  flags={{ interstitials: true }}
/>

// Certivan — 3 steps
<OnboardingWizard
  steps={[intro, atelier, recap]}
  transport={cvTransport}
  flags={{ interstitials: false }}
/>

// Fidu — 8 steps cabinet
<OnboardingWizard
  steps={[intro, cabinet, org, collecte, relances, portail, prefs, synthese]}
  transport={fiduTransport}
  resolveExitHref={() => "/dashboard"}  // ou aligner sur resolveDesktopHomePath
/>
```

#### Ce qui **ne** va **pas** dans le kit

- Types `OnbRestaurant` / `CabinetProfil` / labels OBJECTIF_LABELS / PACK_LABELS
- Steps concrets `step-restaurant`, `step-atelier`, `step-cabinet`, …
- `import-parser`, routes Hono, migrations `011_onboarding`
- Mascotte Tempo hardcodée (slot hero intro marque)

### 3.4 Branding tokens (extension minimale `ShellUiBrand`)

Déjà suffisant pour setup : `productName`, `publicHostSuffix`, `desktopApiGlobal`.

Optionnel (si on évite les hardcodes couleur setup/onboarding) :

```ts
// Extension NON bloquante du 100 % — peut rester en SetupWizardConfig /
// OnboardingTheme props si on refuse d’élargir ShellUiBrand trop tôt.
accentColor?: string;      // #f0701d
inkColor?: string;         // #14182f
tealColor?: string;        // #0e7b7b
creamBackground?: string;  // #faf7f1
```

**Recommandation :** theme onboarding via props `OnboardingTheme` sur le shell,
pas obligation d’étendre `ShellUiBrand` au jour 1.

### 3.5 CSS

Extraire le bloc `.onb-*` (stage, scroll, anim, interstitial, stagger) depuis
`globals.css` marques vers `packages/shell-ui/ui/onboarding/onboarding.css`
(ou injection `getOnboardingStyleSheet()`). Les apps importent une fois
(layout onboarding ou global). Critère : **même rendu** sans duplication ×3.

---

## 4. Plan d’implémentation → 100 % périmètre kit

> Ordre strict. **Pas de cutover marques dans cette phase code** tant que les
> gates kit ne sont pas verts. Cutover = phase suivante (hors ce doc détail),
> mais les critères « consommation » ci-dessous définissent le **Done produit**.

### Étape A — Setup kit (P-ONB-A)

1. Créer `ui/setup/setup-wizard.tsx` depuis gold TF (structure), brancher
   `getShellDesktopApi` + `getShellUiBrand`.
2. `SetupWizardConfig` + defaults copy.
3. Export `@creezio/shell-ui/ui` → `SetupWizard`.
4. Test unitaire / harness : mock desktop API → parcours 4 steps + erreurs
   validation (sans Electron).
5. (Option) story demobrand page `/setup` consommant le kit.

**Done A (falsifiable)**

- [ ] Aucun `tempoflowDesktop|certivanDesktop|fiduDesktop` dans le module kit
- [ ] `SetupWizard` exporté ; build `shell-ui` vert
- [ ] Test : completeSetup appelé avec payload attendu quand mocks OK
- [ ] Changer `configureShellUiBrand({ productName, publicHostSuffix })` change
      le rendu (assert test ou snapshot)

### Étape B — Micro + Stepper + CSS (P-ONB-B)

1. Porter `micro.tsx` (TF≡Fidu) → kit.
2. Porter `Stepper` paramétré par `steps: string[]` (plus de `STEP_LABELS` hardcodés).
3. Extraire CSS `onb-*`.
4. Interstitial générique (`title` string).

**Done B**

- [ ] `useMicro` / `MicroScreen` / `Stepper` exportés
- [ ] Fichier CSS kit présent ; plus de dépendance au CSS marque pour le moteur
- [ ] Test micro : avance N questions → `onDone` ; back depuis fin

### Étape C — OnboardingWizard host (P-ONB-C)

1. Implémenter moteur (`advance` / `back` / `entry` / interstitial / skip /
   complete / error banner) branché sur `steps[]` + `transport`.
2. Pas d’import de steps métier.
3. Harness demobrand : 3 steps factices (intro / form / recap) prouvant CV-like
   **et** 8 steps factices prouvant TF/Fidu-like.

**Done C**

- [ ] Wizard kit sans string métier (`restaurant`, `cabinet`, `VASP`, `achats`)
- [ ] Demobrand (ou test RTL) : config 3 steps **et** config 8 steps passent
- [ ] `editMode` ouvre le dernier step ; `persistStep` appelé à chaque advance
- [ ] Exit utilise `resolveDesktopHomePath` par défaut

### Étape D — Pack export + doc package (P-ONB-D)

1. README `shell-ui` : section Setup + Onboarding (exemples config ×3).
2. `ui/index.ts` exports stables.
3. Gate CI : `npm run build:packages` + tests phase dédiés
   (`test-phase-p-onboarding` ou équivalent).

**Done D = 100 % package / périmètre UI**

- [ ] Exports listés §3 présents
- [ ] Aucun jumeau setup/onboarding-engine **dans le kit** (une SoT)
- [ ] Tests + build verts sur tip
- [ ] Doc package + ce PHASE à jour (statut → implémenté)

### Étape E — Cutover marques (hors implémentation maintenant — critères)

À faire **après** D, par un autre chantier (pas ce commit) :

| Marque | Actions | Done marque |
|--------|---------|-------------|
| ×3 setup | Page `/setup` = `<SetupWizard config={…} />` ; supprimer local `setup-wizard.tsx` | `diff` local absent ; sim N/A |
| TF onboarding | Wizard local → host kit + steps TF en slots ; shell/micro locaux supprimés | plus de `components/onboarding/micro.tsx` local |
| CV onboarding | Idem, 3 steps ; **ne pas** importer steps TF | parcours atelier OK |
| Fidu onboarding | Idem ; transport cabinet ; corriger hero Tempo → asset Fidu (dette) | micro local supprimé |
| Align Fidu exit | `resolveDesktopHomePath` ou config explicite | plus de hardcode divergent non justifié |

**Anti-pattern interdit :** copier le wizard TF entier dans le kit puis
`if (brand === 'fidu')` — utiliser **registry de steps**.

---

## 5. Critères « 100 % » (checklist unique)

### Package `@creezio/shell-ui` (obligatoire)

1. `SetupWizard` + `SetupWizardConfig` exportés et sans globals marque.
2. `OnboardingWizard` + `OnboardingStepDef` + `OnboardingTransport` exportés.
3. `Stepper`, micro-engine, interstitial, CSS `onb-*` exportés / documentés.
4. Zéro type/schéma métier resto/cabinet/atelier dans le package.
5. Build + tests dédiés verts.
6. Demobrand (ou harness) prouve **deux** shapes de parcours (court + long).

### Adoption ×3 (validation intention — après cutover)

7. Aucun `components/setup/setup-wizard.tsx` local.
8. Aucun moteur `onboarding-wizard.tsx` / `onboarding-shell.tsx` / `micro.tsx`
   plateforme local (seulement `step-*.tsx` + types métier + transport).
9. Smoke desktop : first-run setup → onboarding → home (TF, CV, Fidu).

Tant que 1–6 seuls sont verts : **package Done**, marques encore dettes
d’adoption (acceptable si séquencé — ne pas prétendre intention OS finie).

---

## 6. Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Extraire en clonant TF (8 steps achats dans le kit) | CV/Fidu forcés dans un mauvais moule | Registry steps ; demobrand 3 **et** 8 steps |
| Emporter routes/queries TF dans shell-ui | Violation frontière UI / data | Transport injecté ; routes restent marque |
| Éditer runners / apps pendant revert dirty | Conflits | Working trees propres avant cutover (déjà OK à l’audit) |
| CSS globals oubliés → UI cassée au cutover | Régression visuelle | CSS dans kit + import unique documenté |
| Fidu hero Tempo | Dette marque visible | Slot intro ; fix Fidu au cutover |
| CV twin queries mortes | Confusion maintenance | Hors shell-ui ; ticket data/brand séparé |
| Coupler sidebar/cockpit « en passant » | Scope creep | Interdit — seuls AuthWindowChrome + home path |

---

## 7. Ordre recommandé (résumé)

```
A SetupWizard kit (brand API)
    → B micro + Stepper + CSS
        → C OnboardingWizard host + demobrand 3/8
            → D exports + tests + README  = 100 % package
                → E cutover ×3 (autre chantier)
```

Estimation relative : **A** S · **B** S · **C** M · **D** S · **E** M
(cutover E hors charge « package seul »).

---

## 8. Références mesures (2026-07-30)

```
setup TF↔CV sim=0.975  LOC 484/484
setup TF↔Fidu sim=0.971
micro TF↔Fidu sim=1.000  LOC 362
shell Stepper TF↔Fidu sim=0.915 (labels)
wizard TF↔CV sim=0.507   (contenu divergent)
wizard TF↔Fidu sim=0.695 (moteur proche, steps différents)
```

Fichiers gold setup : n’importe lequel des trois (diff = branding only) —
préférer TF puis substituer IPC→`getShellDesktopApi`.

Fichiers gold micro/stepper : TF ou Fidu (`micro` identique).

Fichiers **non-gold** pour le kit : steps métier, `types.ts` marque,
`onboarding-queries`, routes.

---

## 9. Livrable / statut push

- ✅ Doc poussé puis **rétrogradé DRAFT** (attente arbitrage package)
- ❌ Pas de conclusion « onboarding ∈ shell-ui » définitive
- ❌ Pas de code feature / pas de cutover / pas de sed apps
- ⏸️ Reprise uniquement après décision de découpage packages
