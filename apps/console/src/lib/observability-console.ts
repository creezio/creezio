/**
 * Store observabilité console ops — fichier JSON multi-org (V2).
 */

import fs from "node:fs";
import path from "node:path";
import {
  createMemoryObservabilityStore,
  type ObservabilityEvent,
  type ObservabilityStore,
  type OrgActivityAggregate,
  type PluginUsageAggregate,
} from "@creezio/observability";

function kitRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const marker = path.join(dir, "packages", "observability", "package.json");
    if (fs.existsSync(marker)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "../..");
}

export function observabilityConsoleFilePath(): string {
  return (
    process.env.CREEZIO_OBS_CONSOLE_PATH ||
    path.join(kitRoot(), "var", "observability-console.json")
  );
}

type Persisted = {
  updatedAt: string;
  events: ObservabilityEvent[];
};

function loadEvents(): ObservabilityEvent[] {
  const file = observabilityConsoleFilePath();
  if (!fs.existsSync(file)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as Persisted;
    return Array.isArray(raw.events) ? raw.events : [];
  } catch {
    return [];
  }
}

function saveEvents(events: ObservabilityEvent[]): void {
  const file = observabilityConsoleFilePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const payload: Persisted = {
    updatedAt: new Date().toISOString(),
    events: events.slice(-2000),
  };
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

/** Store mémoire hydraté depuis fichier + persist à chaque record. */
export function getConsoleObservabilityStore(): ObservabilityStore {
  const mem = createMemoryObservabilityStore();
  for (const e of loadEvents()) {
    mem.record({
      id: e.id,
      kind: e.kind,
      action: e.action,
      orgId: e.orgId,
      userId: e.userId,
      brandId: e.brandId,
      pluginId: e.pluginId,
      meta: e.meta,
      createdAt: e.createdAt,
    });
  }
  return {
    record(input) {
      const event = mem.record(input);
      saveEvents(mem.list({ limit: 2000 }));
      return event;
    },
    list: (q) => mem.list(q),
    count: (q) => mem.count(q),
    aggregatePluginUsage: (o) => mem.aggregatePluginUsage(o),
    aggregateOrgActivity: (o) => mem.aggregateOrgActivity(o),
  };
}

export function loadObservabilityConsoleSnapshot(): {
  filePath: string;
  updatedAt: string;
  summary: {
    activity: number;
    plugin_usage: number;
    control_plane: number;
    total: number;
  };
  usage: PluginUsageAggregate[];
  orgs: OrgActivityAggregate[];
  recent: ObservabilityEvent[];
} {
  const store = getConsoleObservabilityStore();
  const file = observabilityConsoleFilePath();
  let updatedAt = new Date(0).toISOString();
  if (fs.existsSync(file)) {
    try {
      updatedAt = (JSON.parse(fs.readFileSync(file, "utf8")) as Persisted)
        .updatedAt;
    } catch {
      /* */
    }
  }
  return {
    filePath: file,
    updatedAt,
    summary: {
      activity: store.count({ kind: "activity" }),
      plugin_usage: store.count({ kind: "plugin_usage" }),
      control_plane: store.count({ kind: "control_plane" }),
      total: store.count(),
    },
    usage: store.aggregatePluginUsage({ limit: 20 }),
    orgs: store.aggregateOrgActivity({ limit: 20 }),
    recent: store.list({ limit: 15 }),
  };
}
