/** Compares dot-separated version strings (e.g. "1.2.10" vs "1.10.0") numerically per segment. */
export function isVersionLower(current: string, min: string): boolean {
  const c = current.split(".").map((n) => parseInt(n, 10) || 0);
  const m = min.split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(c.length, m.length);
  for (let i = 0; i < len; i++) {
    const cv = c[i] ?? 0;
    const mv = m[i] ?? 0;
    if (cv !== mv) return cv < mv;
  }
  return false;
}
