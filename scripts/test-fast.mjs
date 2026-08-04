#!/usr/bin/env node
/**
 * Runner de gates fail-fast et lisible (`npm run test:fast`).
 *
 * Contrairement à `npm test` (toutes les gates en un seul `node --test`,
 * sortie TAP illisible, aucun feedback avant la fin), ce runner :
 *   - enchaîne les gates SÉQUENTIELLEMENT avec sortie live
 *     (`▶ test-phase-xxx` puis `✓ OK (12s)` / `✗ FAIL`) ;
 *   - S'ARRÊTE à la première gate rouge et n'affiche QUE sa sortie ;
 *   - journalise chaque gate en JSONL dans /tmp/creezio-test-fast.log.
 *
 * La liste des gates est lue depuis le script npm `test` (source of truth,
 * pas de seconde liste à maintenir).
 *
 * Options :
 *   --from <gate>     reprendre à partir de cette gate (substring)
 *   --only <regex>    ne lancer que les gates qui matchent
 *   --skip <regex>    exclure des gates (en plus du skip-list défaut)
 *   --no-default-skip inclure aussi les gates environnementales connues
 *   --keep-going      ne pas s'arrêter à la première rouge (inventaire)
 *   --timeout <s>     timeout par gate (défaut 300 s → FAIL timeout)
 *
 * Skip-list par défaut (DEFAULT_SKIP) : gates qui échouent sur ce VPS pour
 * des raisons d'ENVIRONNEMENT (réseau sortant filtré, oracle TF2 absent ou
 * en lecture seule, binaires embeds non provisionnés) — PAS parce que les
 * asserts seraient faux. Ne pas « fixer » ces gates en affaiblissant les
 * asserts ; les lancer avec `--no-default-skip` sur un poste complet.
 * Workflow : `npm run test:fast` → première rouge → corriger la cause →
 * `npm run test:fast -- --from <gate>` → itérer jusqu'au vert.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOG_FILE = process.env.CREEZIO_TEST_FAST_LOG || "/tmp/creezio-test-fast.log";

// Gates environnementales préexistantes sur CE VPS (inventaire du
// 2026-08-04, `--keep-going --no-default-skip`) : oracle tempoflow2 en
// lecture seule / état différent (phases C7, I, M, N, O, P), apps générées
// non installables offline (factory-prd F3), et test-os-cold-warm
// (bootstrap embeds réseau + ~4 Go dans /tmp par run). AUCUN assert
// affaibli — les relancer via `--no-default-skip` sur un poste complet.
const DEFAULT_SKIP = [
  "test-os-cold-warm.mjs",
  "test-phase-c7.mjs",
  "test-phase-factory-prd-experience.mjs",
  "test-phase-factory-prd.mjs",
  "test-phase-i2.mjs",
  "test-phase-i8.mjs",
  "test-phase-m1.mjs",
  "test-phase-m10.mjs",
  "test-phase-m11.mjs",
  "test-phase-m12.mjs",
  "test-phase-m12p.mjs",
  "test-phase-m13.mjs",
  "test-phase-m14.mjs",
  "test-phase-m15.mjs",
  "test-phase-m1p.mjs",
  "test-phase-m2.mjs",
  "test-phase-m2p.mjs",
  "test-phase-m3.mjs",
  "test-phase-m3p.mjs",
  "test-phase-m4.mjs",
  "test-phase-m5.mjs",
  "test-phase-m7.mjs",
  "test-phase-m8.mjs",
  "test-phase-m8p.mjs",
  "test-phase-m9.mjs",
  "test-phase-n0.mjs",
  "test-phase-n1p.mjs",
  "test-phase-n2p.mjs",
  "test-phase-n3p.mjs",
  "test-phase-n4.mjs",
  "test-phase-n4p.mjs",
  "test-phase-n5.mjs",
  "test-phase-n6p.mjs",
  "test-phase-n7.mjs",
  "test-phase-n8.mjs",
  "test-phase-o0.mjs",
  "test-phase-o1.mjs",
  "test-phase-o10.mjs",
  "test-phase-o11.mjs",
  "test-phase-o2.mjs",
  "test-phase-o3.mjs",
  "test-phase-o3p.mjs",
  "test-phase-o4.mjs",
  "test-phase-o4p.mjs",
  "test-phase-o4r.mjs",
  "test-phase-o4r2.mjs",
  "test-phase-o4r3.mjs",
  "test-phase-o4r4.mjs",
  "test-phase-o5.mjs",
  "test-phase-o5p.mjs",
  "test-phase-o6.mjs",
  "test-phase-o7.mjs",
  "test-phase-o8.mjs",
  "test-phase-o9.mjs",
  "test-phase-o9p.mjs",
  "test-phase-p-cockpit.mjs",
  "test-phase-p-onboarding.mjs",
  "test-phase-p-shell-ui.mjs",
  "test-phase-p0-intention.mjs",
  "test-phase-p29.mjs",
];

/* ── CLI ── */
const args = process.argv.slice(2);
const opt = {
  from: "",
  only: "",
  skip: "",
  noDefaultSkip: false,
  keepGoing: false,
  timeoutS: 300,
};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--from") opt.from = args[++i] || "";
  else if (a.startsWith("--from=")) opt.from = a.slice(7);
  else if (a === "--only") opt.only = args[++i] || "";
  else if (a.startsWith("--only=")) opt.only = a.slice(7);
  else if (a === "--skip") opt.skip = args[++i] || "";
  else if (a.startsWith("--skip=")) opt.skip = a.slice(7);
  else if (a === "--no-default-skip") opt.noDefaultSkip = true;
  else if (a === "--keep-going") opt.keepGoing = true;
  else if (a === "--timeout") opt.timeoutS = Number(args[++i]) || 300;
  else if (a.startsWith("--timeout=")) opt.timeoutS = Number(a.slice(10)) || 300;
  else if (a === "--help" || a === "-h") {
    console.log(
      "Usage: npm run test:fast [-- --from <gate>] [--only <regex>] [--skip <regex>] [--no-default-skip] [--keep-going] [--timeout <s>]",
    );
    process.exit(0);
  } else {
    console.error(`option inconnue: ${a}`);
    process.exit(2);
  }
}

/* ── Liste des gates depuis package.json (SoT) ── */
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const gates = (pkg.scripts.test.match(/scripts\/[\w./-]+\.mjs/g) || []).map((g) =>
  g.trim(),
);
if (!gates.length) {
  console.error("aucune gate trouvée dans le script npm test");
  process.exit(2);
}

const onlyRe = opt.only ? new RegExp(opt.only) : null;
const skipRe = opt.skip ? new RegExp(opt.skip) : null;
let started = !opt.from;
const plan = [];
for (const gate of gates) {
  const base = path.basename(gate);
  if (!started) {
    if (base.includes(opt.from) || gate.includes(opt.from)) started = true;
    else continue;
  }
  if (onlyRe && !onlyRe.test(base)) continue;
  const skippedDefault = !opt.noDefaultSkip && DEFAULT_SKIP.includes(base);
  const skippedArg = Boolean(skipRe && skipRe.test(base));
  plan.push({ gate, base, skipped: skippedDefault || skippedArg });
}

/* ── Couleurs (désactivées si pas un TTY) ── */
const tty = process.stdout.isTTY;
const c = (code, s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = (s) => c("32", s);
const red = (s) => c("31", s);
const dim = (s) => c("2", s);
const yellow = (s) => c("33", s);

const logStream = fs.createWriteStream(LOG_FILE, { flags: "a" });
const jsonl = (o) =>
  logStream.write(JSON.stringify({ ts: new Date().toISOString(), ...o }) + "\n");

function runGate(gate) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--test", gate], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    const t0 = Date.now();
    const killer = setTimeout(() => {
      child.kill("SIGKILL");
    }, opt.timeoutS * 1000);
    child.on("close", (code, signal) => {
      clearTimeout(killer);
      resolve({
        code,
        timedOut: signal === "SIGKILL",
        ms: Date.now() - t0,
        out,
      });
    });
  });
}

const fmt = (ms) => (ms >= 10_000 ? `${Math.round(ms / 1000)}s` : `${(ms / 1000).toFixed(1)}s`);

jsonl({ event: "run-start", gates: plan.length, opts: opt });
console.log(
  dim(
    `test:fast — ${plan.filter((p) => !p.skipped).length} gates (skip: ${plan.filter((p) => p.skipped).length}) → ${LOG_FILE}`,
  ),
);

let pass = 0;
let fail = 0;
let firstFail = null;
for (const item of plan) {
  if (item.skipped) {
    console.log(`${yellow("∅")} ${item.base} ${dim("(skip environnement)")}`);
    jsonl({ event: "gate", gate: item.base, status: "skip" });
    continue;
  }
  process.stdout.write(`▶ ${item.base} `);
  const r = await runGate(item.gate);
  if (r.code === 0) {
    pass++;
    console.log(green(`✓ OK (${fmt(r.ms)})`));
    jsonl({ event: "gate", gate: item.base, status: "ok", ms: r.ms });
  } else {
    fail++;
    console.log(red(r.timedOut ? `✗ FAIL (timeout ${opt.timeoutS}s)` : `✗ FAIL (${fmt(r.ms)})`));
    jsonl({
      event: "gate",
      gate: item.base,
      status: r.timedOut ? "timeout" : "fail",
      ms: r.ms,
    });
    if (!opt.keepGoing) {
      firstFail = item;
      console.log(red(`\n━━━ sortie de ${item.base} ━━━`));
      console.log(r.out);
      console.log(
        red(
          `━━━ FIN — corriger puis relancer : npm run test:fast -- --from ${item.base} ━━━`,
        ),
      );
      break;
    }
  }
}

jsonl({ event: "run-end", pass, fail });
console.log(
  `\n${pass} OK, ${fail} FAIL, ${plan.filter((p) => p.skipped).length} skip.`,
);
logStream.end();
process.exit(fail ? 1 : 0);
