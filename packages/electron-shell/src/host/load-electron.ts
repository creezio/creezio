/**
 * Charge electron en sync pour le main CJS des marques.
 * Évite `import "electron"` au top-level (casse les tests kit Node sans peer).
 */
export function loadElectron(): typeof import("electron") {
  try {
    // eslint-disable-next-line no-eval
    const req = eval("require") as NodeRequire;
    return req("electron") as typeof import("electron");
  } catch (e) {
    throw new Error(
      `@creezio/electron-shell: require('electron') indisponible (${e instanceof Error ? e.message : e})`,
    );
  }
}
