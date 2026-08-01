export function metierBase(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_METIER_BASE_URL) {
    return process.env.NEXT_PUBLIC_METIER_BASE_URL;
  }
  return "http://127.0.0.1:18791";
}
