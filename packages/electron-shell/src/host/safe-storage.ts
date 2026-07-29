/**
 * Abstraction safeStorage Electron — chiffrement secrets local-config.
 * Fallback plain si backend OS indisponible (documenté TF2).
 */

import { createRequire } from "node:module";
import path from "node:path";
import type { StoredValue } from "@creezio/platform-core";

export type SafeStorageBackend = {
  isEncryptionAvailable: () => boolean;
  encryptString: (plain: string) => Buffer;
  decryptString: (buffer: Buffer) => string;
};

/** Backend Electron `safeStorage` (chargé à la demande). */
export async function loadElectronSafeStorage(): Promise<SafeStorageBackend> {
  const { safeStorage } = await import("electron");
  return safeStorage;
}

/**
 * Variante sync pour `createLocalConfigStoreSync({ encryption: "electron" })`.
 * Échec (hors Electron / module absent) → null (fallback plain).
 */
export function loadElectronSafeStorageSync(): SafeStorageBackend | null {
  try {
    const req = createRequire(path.join(process.cwd(), "package.json"));
    const electron = req("electron") as { safeStorage?: SafeStorageBackend };
    return electron.safeStorage ?? null;
  } catch {
    return null;
  }
}

export function canEncrypt(backend: SafeStorageBackend | null): boolean {
  if (!backend) return false;
  try {
    return backend.isEncryptionAvailable();
  } catch {
    return false;
  }
}

export function sealValue(
  backend: SafeStorageBackend | null,
  value: string,
): StoredValue {
  if (canEncrypt(backend) && backend) {
    return { enc: backend.encryptString(value).toString("base64") };
  }
  return { plain: value };
}

export function openValue(
  backend: SafeStorageBackend | null,
  v: StoredValue | undefined,
): string | null {
  if (!v) return null;
  if ("plain" in v) return v.plain;
  if (!backend) return null;
  try {
    return backend.decryptString(Buffer.from(v.enc, "base64"));
  } catch {
    return null;
  }
}
