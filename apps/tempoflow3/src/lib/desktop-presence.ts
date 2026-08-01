/**
 * Présence desktop — généré factory.
 */
export function desktopPresencePayload(opts: {
  online: boolean;
  appKind: string;
}) {
  return {
    brandId: "tempoflow3",
    online: opts.online,
    appKind: opts.appKind,
    at: new Date().toISOString(),
  };
}
