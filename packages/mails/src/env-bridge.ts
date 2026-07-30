/**
 * Bridge mails marque → index kit inbound — M8.
 */

import {
  ensureCoreDbParent,
  resolveCoreDbPathFromEnv,
} from "@creezio/platform-core";
import { createSqliteMailsStore } from "./sqlite-store.js";

export function indexKitInboundMail(opts: {
  userId: string;
  from: string;
  to: string;
  subject: string;
  body?: string;
  messageId?: string | null;
  brandEmailId?: string | null;
}): void {
  const corePath = resolveCoreDbPathFromEnv();
  if (!corePath) return;
  try {
    ensureCoreDbParent(corePath);
    const store = createSqliteMailsStore({ coreDbPath: corePath });
    try {
      store.insertInbound?.({
        userId: opts.userId || "system",
        from: opts.from,
        to: opts.to,
        subject: opts.subject,
        body: opts.body || "",
        messageId: opts.messageId,
        brandEmailId: opts.brandEmailId,
      });
    } finally {
      store.close();
    }
  } catch {
    /* never block inbox */
  }
}
