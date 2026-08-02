/**
 * Provider SMTP minimal via env (nodemailer optionnel).
 * Si `nodemailer` n'est pas installé, le provider refuse proprement.
 *
 * Env :
 *   SMTP_URL=smtp://user:pass@host:587
 *   SMTP_FROM=noreply@example.com
 *   ou SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM
 */
import type { MailProvider, PlatformMail } from "../types.js";

export const SMTP_ENV_PROVIDER_ID = "smtp-env";

export type CreateSmtpEnvMailProviderOptions = {
  id?: string;
};

async function loadNodemailer(): Promise<null | {
  createTransport: (url: string | object) => {
    sendMail: (opts: Record<string, unknown>) => Promise<unknown>;
  };
}> {
  try {
    // Peer optionnel — éviter résolution tsc stricte sur `nodemailer`.
    const dynImport = new Function(
      "specifier",
      "return import(specifier)",
    ) as (specifier: string) => Promise<{
      default?: {
        createTransport: (url: string | object) => {
          sendMail: (opts: Record<string, unknown>) => Promise<unknown>;
        };
      };
      createTransport?: (url: string | object) => {
        sendMail: (opts: Record<string, unknown>) => Promise<unknown>;
      };
    }>;
    const mod = await dynImport("nodemailer");
    return (mod.default || mod) as {
      createTransport: (url: string | object) => {
        sendMail: (opts: Record<string, unknown>) => Promise<unknown>;
      };
    };
  } catch {
    return null;
  }
}

function resolveTransportConfig():
  | { kind: "url"; url: string; from: string }
  | { kind: "fields"; host: string; port: number; auth?: { user: string; pass: string }; from: string; secure: boolean }
  | null {
  const from = (process.env.SMTP_FROM || process.env.EMAIL_FROM || "").trim();
  const url = (process.env.SMTP_URL || "").trim();
  if (url) {
    return { kind: "url", url, from: from || "noreply@localhost" };
  }
  const host = (process.env.SMTP_HOST || "").trim();
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim();
  return {
    kind: "fields",
    host,
    port: Number.isFinite(port) ? port : 587,
    auth: user ? { user, pass } : undefined,
    from: from || `noreply@${host}`,
    secure: process.env.SMTP_SECURE === "1" || port === 465,
  };
}

export function createSmtpEnvMailProvider(
  opts: CreateSmtpEnvMailProviderOptions = {},
): MailProvider {
  const id = opts.id || SMTP_ENV_PROVIDER_ID;
  return {
    id,
    async send(mail: PlatformMail): Promise<{ ok: boolean; error?: string }> {
      const cfg = resolveTransportConfig();
      if (!cfg) {
        return {
          ok: false,
          error: "smtp_unconfigured (SMTP_URL ou SMTP_HOST requis)",
        };
      }
      const nm = await loadNodemailer();
      if (!nm) {
        return {
          ok: false,
          error: "nodemailer_absent — npm i nodemailer côté app ou utiliser file-sink",
        };
      }
      try {
        const transport =
          cfg.kind === "url"
            ? nm.createTransport(cfg.url)
            : nm.createTransport({
                host: cfg.host,
                port: cfg.port,
                secure: cfg.secure,
                auth: cfg.auth,
              });
        await transport.sendMail({
          from: cfg.from,
          to: mail.to,
          subject: mail.subject,
          text: mail.textBody || mail.body || undefined,
          html: mail.htmlBody || undefined,
        });
        return { ok: true };
      } catch (e) {
        return {
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    },
  };
}
