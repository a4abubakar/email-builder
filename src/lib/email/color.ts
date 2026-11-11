/** Small colour helpers: validation and WCAG contrast, used to keep exported emails readable for any brand colour. */

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Returns a lowercase 6-digit hex colour, or `fallback` when the input isn't a valid #rgb / #rrggbb value. */
export function normalizeHex(input: unknown, fallback: string): string {
  if (typeof input !== "string") return fallback;
  const v = input.trim();
  if (!HEX_RE.test(v)) return fallback;
  if (v.length === 4) {
    return ("#" + v[1] + v[1] + v[2] + v[2] + v[3] + v[3]).toLowerCase();
  }
  return v.toLowerCase();
}

function toRgb(hex: string): [number, number, number] {
  const h = normalizeHex(hex, "#000000").slice(1);
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]: [number, number, number]): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Text colour (white or near-black) with the best contrast on `bg`. */
export function readableTextOn(bg: string): string {
  return contrastRatio("#ffffff", bg) >= contrastRatio("#111827", bg)
    ? "#ffffff"
    : "#111827";
}

/**
 * Nudges `fg` towards black (on light backgrounds) or white (on dark ones)
 * until it reaches `min` contrast against `bg`. Returns `fg` untouched when it already passes.
 */
export function ensureContrast(fg: string, bg: string, min = 4.5): string {
  const start = normalizeHex(fg, "#000000");
  if (contrastRatio(start, bg) >= min) return start;
  const target: [number, number, number] =
    luminance(bg) > 0.5 ? [0, 0, 0] : [255, 255, 255];
  const base = toRgb(start);
  for (let step = 1; step <= 20; step++) {
    const t = step / 20;
    const mixed = toHex([
      base[0] + (target[0] - base[0]) * t,
      base[1] + (target[1] - base[1]) * t,
      base[2] + (target[2] - base[2]) * t,
    ]);
    if (contrastRatio(mixed, bg) >= min) return mixed;
  }
  return toHex(target);
}
