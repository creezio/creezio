import crypto from "node:crypto";
import type {
  MailProvider,
  PlatformMail,
  PlatformMailsStore,
} from "./types.js";

function now(): string {
  return new Date().toISOString();
}

export function createMemoryMailsStore(): PlatformMailsStore {
  const mails = new Map<string, PlatformMail>();
  const providers = new Map<string, MailProvider>();

  // Provider stub plateforme (pas de SMTP réel).
  providers.set("platform-stub", {
    id: "platform-stub",
    async send(mail) {
      return { ok: Boolean(mail.to && mail.subject) };
    },
  });

  const store: PlatformMailsStore = {
    createDraft(input) {
      const ts = now();
      const mail: PlatformMail = {
        id: crypto.randomUUID(),
        userId: input.userId,
        to: input.to.trim(),
        subject: input.subject.trim(),
        body: input.body || "",
        status: "draft",
        providerId: null,
        createdAt: ts,
        updatedAt: ts,
      };
      mails.set(mail.id, mail);
      return mail;
    },
    list(userId) {
      return [...mails.values()]
        .filter((m) => m.userId === userId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    get(id) {
      return mails.get(id);
    },
    registerProvider(provider) {
      providers.set(provider.id, provider);
    },
    async queueSend(id, actorUserId) {
      const mail = mails.get(id);
      if (!mail) throw new Error("not_found");
      if (mail.userId !== actorUserId) throw new Error("forbidden");
      const provider = providers.get("platform-stub")!;
      const queued: PlatformMail = {
        ...mail,
        status: "queued",
        providerId: provider.id,
        updatedAt: now(),
      };
      mails.set(id, queued);
      const result = await provider.send(queued);
      const final: PlatformMail = {
        ...queued,
        status: result.ok ? "sent" : "failed",
        updatedAt: now(),
      };
      mails.set(id, final);
      return final;
    },
  };

  return store;
}
