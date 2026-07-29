/**
 * Démo ops console — fabrique V1 en mémoire (pas de demobrand requis).
 * Persist sessions dans var/plugin-factory-sessions.json pour le panel.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createConversationalPluginFactory,
  createFsPluginScaffoldAdapters,
  createMemoryProductHubStore,
  type FactorySessionSnapshot,
} from "@creezio/product-hub";

function kitRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const marker = path.join(dir, "packages", "product-hub", "package.json");
    if (fs.existsSync(marker)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "../..");
}

export function pluginFactorySessionsPath(): string {
  return (
    process.env.CREEZIO_PLUGIN_FACTORY_SESSIONS_PATH ||
    path.join(kitRoot(), "var", "plugin-factory-sessions.json")
  );
}

type Persisted = {
  updatedAt: string;
  sessions: FactorySessionSnapshot[];
};

function loadPersisted(): Persisted {
  const file = pluginFactorySessionsPath();
  if (!fs.existsSync(file)) {
    return { updatedAt: new Date().toISOString(), sessions: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as Persisted;
  } catch {
    return { updatedAt: new Date().toISOString(), sessions: [] };
  }
}

function savePersisted(sessions: FactorySessionSnapshot[]): void {
  const file = pluginFactorySessionsPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const payload: Persisted = {
    updatedAt: new Date().toISOString(),
    sessions,
  };
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

let factorySingleton: ReturnType<
  typeof createConversationalPluginFactory
> | null = null;
let pluginsDirSingleton: string | null = null;

function getFactory() {
  if (!factorySingleton) {
    pluginsDirSingleton = fs.mkdtempSync(
      path.join(os.tmpdir(), "creezio-console-factory-"),
    );
    const store = createMemoryProductHubStore({
      conversationPrefix: "console",
    });
    const fsAdapters = createFsPluginScaffoldAdapters(pluginsDirSingleton);
    factorySingleton = createConversationalPluginFactory({
      store,
      scaffoldPlugin: (i) => fsAdapters.scaffoldPlugin(i),
      writePluginFiles: (id, files) => fsAdapters.writePluginFiles(id, files),
      installRuntime: () => ({ dbOpened: true }),
    });
  }
  return factorySingleton;
}

export function listFactorySessionsSnapshot(): {
  updatedAt: string;
  sessions: FactorySessionSnapshot[];
  filePath: string;
  pluginsDir: string | null;
} {
  const persisted = loadPersisted();
  return {
    ...persisted,
    filePath: pluginFactorySessionsPath(),
    pluginsDir: pluginsDirSingleton,
  };
}

export async function runFactoryDemo(input: {
  text: string;
  name?: string;
  approve?: boolean;
  materialize?: boolean;
}): Promise<{
  session: FactorySessionSnapshot;
  materialize?: unknown;
}> {
  const factory = getFactory();
  let session = factory.submitIntention({
    text: input.text,
    name: input.name,
  });

  if (session.phase === "clarification_required" && session.openClarification) {
    session = factory.answerClarifications({
      productId: session.productId,
      clarificationId: session.openClarification.id,
      answers: {
        users: "équipe ops console",
        data_source: "APIs natives demobrand",
        ui_kind: "single",
      },
    });
  }

  if (input.approve !== false && session.phase === "awaiting_approval") {
    session = factory.approvePrd({
      productId: session.productId,
      userId: "console-ops",
    });
  }

  let materialize: unknown;
  if (input.materialize !== false && session.phase === "ready_to_materialize") {
    const result = await factory.materialize({
      productId: session.productId,
      actor: { isOwner: true, orgId: "org-console", userId: "console-ops" },
      pluginId: session.suggestedPluginId || undefined,
    });
    materialize = result;
    if (result.ok) session = result.session;
  }

  savePersisted(factory.listSessions());
  return { session, materialize };
}
