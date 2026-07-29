/**
 * Fichiers scaffold plugin générés depuis un PRD (preuve kit, sans LLM).
 */

import type { PluginPrdRevisionRecord } from "../store/types.js";
import { parsePluginPrdSections } from "../prd.js";

export type ScaffoldPluginFiles = Record<string, string>;

export function buildPluginScaffoldFiles(input: {
  pluginId: string;
  name: string;
  description?: string;
  prd?: PluginPrdRevisionRecord | null;
}): ScaffoldPluginFiles {
  const sections = input.prd
    ? parsePluginPrdSections(input.prd.sections_json)
    : {};
  const tables = Array.isArray(sections.db_schema) ? sections.db_schema : [];
  const schemaComment = tables.length
    ? tables
        .map(
          (t) =>
            `// table ${t.table}: ${(t.columns || []).map((c) => c.name).join(", ")}`,
        )
        .join("\n")
    : "// table plugin_kv: key, value, updated_at";

  const manifest = {
    id: input.pluginId,
    name: input.name,
    version: "0.1.0",
    description: input.description || input.prd?.problem || "",
    main: "index.js",
    permissions: ["net:loopback"],
    creezio: {
      factory: "v1",
      db: "plugin",
      mcpSpace: "plugin",
    },
  };

  const indexJs = `${schemaComment}
console.log("plugin ${input.pluginId} — fabrique V1");
module.exports = {
  id: ${JSON.stringify(input.pluginId)},
  start() {
    return { ok: true, pluginId: ${JSON.stringify(input.pluginId)} };
  },
};
`;

  const readme = `# ${input.name}

Plugin isolé généré par la fabrique conversationnelle Creezio (V1).

- DB : \`plugin/${input.pluginId}.db\`
- MCP : \`plugin.${input.pluginId}.*\`
- ACL : Product Hub L3 (see / install / execute)

${input.prd?.scope ? `## Périmètre\n\n${input.prd.scope}\n` : ""}
`;

  const prdMd = input.prd
    ? [
        `# PRD — ${input.name}`,
        "",
        `## Problème`,
        input.prd.problem,
        "",
        `## Utilisateurs`,
        input.prd.users,
        "",
        `## Périmètre`,
        input.prd.scope,
        "",
        `## Hors périmètre`,
        input.prd.out_of_scope || "(néant)",
        "",
        `## Critères d'acceptation`,
        input.prd.acceptance_criteria,
        "",
      ].join("\n")
    : `# PRD — ${input.name}\n`;

  return {
    "manifest.json": `${JSON.stringify(manifest, null, 2)}\n`,
    "index.js": indexJs,
    "README.md": readme,
    "PRD.md": prdMd,
  };
}
