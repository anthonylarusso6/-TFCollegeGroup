const f1 = (v) => v.toFixed(1);

// Monotone cubic path — smooth, but never overshoots a real weigh-in.
export function smoothPath(P) {
  const n = P.length;
  if (n < 2) return "";
  if (n === 2) return `M${f1(P[0].x)},${f1(P[0].y)}L${f1(P[1].x)},${f1(P[1].y)}`;
  const dx = [], m = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = P[i + 1].x - P[i].x; m[i] = dx[i] ? (P[i + 1].y - P[i].y) / dx[i] : 0; }
  const t = [m[0]];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  t[n - 1] = m[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = `M${f1(P[0].x)},${f1(P[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${f1(P[i].x + h)},${f1(P[i].y + t[i] * h)} ${f1(P[i + 1].x - h)},${f1(P[i + 1].y - t[i + 1] * h)} ${f1(P[i + 1].x)},${f1(P[i + 1].y)}`;
  }
  return d;
}
