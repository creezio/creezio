/**
 * Provider mails **non-stub** : écrit chaque envoi dans un fichier JSON
 * sous `outDir` (sink local / tests / CI). Pas de templates marque.
 *
 * Pour SMTP réel, enregistrer un autre `MailProvider` via `registerProvider`
 * et passer `defaultProviderId`.
 */

import fs from "node:fs";
import path from "node:path";
import type { MailProvider, PlatformMail } from "../types.js";

export const FILE_SINK_PROVIDER_ID = "file-sink";

export type CreateFileSinkMailProviderOptions = {
  /** Répertoire de sortie (créé si absent). */
  outDir: string;
  id?: string;
};

export function createFileSinkMailProvider(
  opts: CreateFileSinkMailProviderOptions,
): MailProvider {
  const id = opts.id || FILE_SINK_PROVIDER_ID;
  const outDir = opts.outDir;

  return {
    id,
    async send(mail: PlatformMail) {
      if (!mail.to?.trim() || !mail.subject?.trim()) {
        return { ok: false, error: "to_and_subject_required" };
      }
      try {
        fs.mkdirSync(outDir, { recursive: true });
        const file = path.join(
          outDir,
          `${mail.id}-${Date.now()}.json`,
        );
        fs.writeFileSync(
          file,
          JSON.stringify(
            {
              id: mail.id,
              to: mail.to,
              subject: mail.subject,
              body: mail.body,
              userId: mail.userId,
              providerId: id,
              writtenAt: new Date().toISOString(),
            },
            null,
            2,
          ) + "\n",
          "utf8",
        );
        return { ok: true };
      } catch (e) {
        return {
          ok: false,
          error: e instanceof Error ? e.message : "file_sink_error",
        };
      }
    },
  };
}
