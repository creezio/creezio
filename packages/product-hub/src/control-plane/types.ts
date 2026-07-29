/**
 * Contrats control plane plugins HTTP (loopback) — brand-agnostic.
 */

import type { ProductHubBrandTokens } from "../brand-tokens.js";
import type { ProductHubProductDetails } from "../grants-flow.js";

export type PluginControlPlaneAdapters = {
  /** Status listing (plugins + running). */
  listStatus: () => Promise<Record<string, unknown>> | Record<string, unknown>;
  /** Création scaffold (vertical peut fournir git). */
  createPlugin: (opts: {
    id: string;
    name?: string;
    description?: string;
  }) => Promise<
    | { ok: true; plugin: unknown; git?: unknown }
    | { ok: false; error: string }
  >;
  writeFiles: (
    id: string,
    files: Record<string, string>,
    message?: string,
  ) => Promise<
    | { ok: true; written: string[]; git?: unknown }
    | { ok: false; error: string }
  >;
  deletePlugin?: (
    id: string,
  ) => Promise<{ ok: true; deleted: string } | { ok: false; error: string }>;
  enablePlugin?: (
    id: string,
    enabled: boolean,
  ) => Promise<{ ok: true; plugin: unknown } | { ok: false; error: string }>;
  restartPlugin?: (
    id: string,
  ) => Promise<
    | { ok: true; running: unknown }
    | { ok: false; error: string }
  >;
  pluginDir: (id: string) => string;
  /** Détails produit CRM pour émission grant. */
  fetchProductDetails?: (
    productId: string,
  ) => Promise<ProductHubProductDetails | null>;
};

export type PluginControlPlaneOptions = {
  tokens: ProductHubBrandTokens;
  /** Bearer secret (= control token). */
  controlToken: string;
  pluginsDir: string;
  adapters: PluginControlPlaneAdapters;
  /** Port préféré (info health). */
  preferredPort?: number;
};

export type PluginControlPlaneState = {
  port: number;
  url: string;
  token: string;
  pluginsDir: string;
  tokens: ProductHubBrandTokens;
  close: () => Promise<void>;
};
