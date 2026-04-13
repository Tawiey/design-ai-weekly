// Deterministic gradient mesh generator.
// Same input slug → same output gradient, every time.
// Used to give each weekly digest its own unique visual identity.

function hash(str: string): number {
  // FNV-1a hash, 32-bit
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function gradientMeshFor(slug: string): string {
  const h = hash(slug);

  // Derive 3 hues from the hash, spaced apart for visual harmony
  const baseHue = h % 360;
  const hue1 = baseHue;
  const hue2 = (baseHue + 90 + ((h >> 8) % 60)) % 360;
  const hue3 = (baseHue + 200 + ((h >> 16) % 60)) % 360;

  // Stable saturation/lightness with mild variance per slug
  const sat = 75 + ((h >> 4) % 15); // 75–89
  const light1 = 55 + ((h >> 12) % 10); // 55–64
  const light2 = 45 + ((h >> 20) % 10); // 45–54
  const light3 = 60 + ((h >> 24) % 10); // 60–69

  // Position the radial gradient centres deterministically
  const x1 = 15 + ((h >> 2) % 30); // 15–44
  const y1 = 20 + ((h >> 6) % 30); // 20–49
  const x2 = 60 + ((h >> 10) % 30); // 60–89
  const y2 = 60 + ((h >> 14) % 30); // 60–89
  const x3 = 30 + ((h >> 18) % 40); // 30–69
  const y3 = 40 + ((h >> 22) % 30); // 40–69

  const c1 = `hsl(${hue1} ${sat}% ${light1}%)`;
  const c2 = `hsl(${hue2} ${sat}% ${light2}%)`;
  const c3 = `hsl(${hue3} ${sat - 10}% ${light3}%)`;

  return [
    `radial-gradient(at ${x1}% ${y1}%, ${c1} 0%, transparent 55%)`,
    `radial-gradient(at ${x2}% ${y2}%, ${c2} 0%, transparent 55%)`,
    `radial-gradient(at ${x3}% ${y3}%, ${c3} 0%, transparent 60%)`,
    `linear-gradient(135deg, hsl(${hue1} 40% 12%), hsl(${hue2} 40% 8%))`,
  ].join(", ");
}
