/** Gmail clips messages whose HTML is larger than about 102 KB and hides the rest behind "View entire message". */
export const GMAIL_CLIP_BYTES = 102 * 1024;
/** Start warning at ~90% so there's headroom for ESP-injected tracking pixels and wrapped links. */
export const GMAIL_WARN_BYTES = Math.round(GMAIL_CLIP_BYTES * 0.9);

export type SizeLevel = "ok" | "warn" | "over";

export interface EmailSize {
  bytes: number;
  /** Kilobytes (1 KB = 1024 bytes), rounded to one decimal. */
  kb: number;
  /** Share of Gmail's clipping limit, 0 to 100+ (not capped). */
  percentOfLimit: number;
  level: SizeLevel;
}

/** UTF-8 byte length: what actually goes over the wire, which is what Gmail measures. */
export function byteLength(html: string): number {
  return new TextEncoder().encode(html).length;
}

export function measureEmail(html: string): EmailSize {
  const bytes = byteLength(html);
  return {
    bytes,
    kb: Math.round((bytes / 1024) * 10) / 10,
    percentOfLimit: Math.round((bytes / GMAIL_CLIP_BYTES) * 1000) / 10,
    level: bytes > GMAIL_CLIP_BYTES ? "over" : bytes >= GMAIL_WARN_BYTES ? "warn" : "ok",
  };
}
