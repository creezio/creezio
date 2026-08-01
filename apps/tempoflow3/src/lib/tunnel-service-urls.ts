/**
 * URLs services tunnel — généré factory.
 */
export function publicUrlForService(
  publicBase: string | null | undefined,
  service: string,
): string | null {
  if (!publicBase) return null;
  const base = publicBase.replace(/\/$/, "");
  return `${base}/${service}`;
}

export const TUNNEL_ROOT = "tempoflow3.local";
