import { normalizeHex } from "./color";
import { BLOCK_META, createBlock } from "./blocks";
import { safeFontStack } from "./render";
import {
  DEFAULT_SETTINGS,
  isBlockType,
  type Block,
  type EmailDoc,
  type EmailSettings,
} from "./types";

export const STORAGE_KEY = "email-builder:doc:v1";
const MAX_BLOCKS = 200;
const MAX_TEXT = 5000;

/** Collision-resistant id for blocks created in the browser. */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.slice(0, MAX_TEXT) : fallback;
}

function parseSettings(raw: unknown): EmailSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    subject: str(r.subject, DEFAULT_SETTINGS.subject),
    preheader: str(r.preheader, ""),
    brandColor: normalizeHex(r.brandColor, DEFAULT_SETTINGS.brandColor),
    backgroundColor: normalizeHex(r.backgroundColor, DEFAULT_SETTINGS.backgroundColor),
    fontStack: safeFontStack(str(r.fontStack, DEFAULT_SETTINGS.fontStack)),
    width: DEFAULT_SETTINGS.width,
  };
}

function parseBlock(raw: unknown, used: Set<string>): Block | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!isBlockType(r.type)) return null;
  let id = typeof r.id === "string" && r.id && !used.has(r.id) ? r.id.slice(0, 64) : newId();
  while (used.has(id)) id = newId();
  used.add(id);

  // Start from the defaults and only copy over known, correctly-typed fields.
  const block = createBlock(r.type, id) as unknown as Record<string, string | number>;
  for (const field of BLOCK_META[r.type].fields) {
    const v = r[field.key];
    if (field.kind === "number") {
      if (typeof v === "number" && Number.isFinite(v)) {
        block[field.key] = Math.max(field.min ?? v, Math.min(field.max ?? v, Math.round(v)));
      }
    } else if (field.kind === "select") {
      if (typeof v === "string" && field.options?.some((o) => o.value === v)) block[field.key] = v;
    } else if (typeof v === "string") {
      block[field.key] = v.slice(0, MAX_TEXT);
    }
  }
  return block as unknown as Block;
}

/** Validates and sanitises untrusted JSON (imports, localStorage). Returns `null` if it isn't an email document. */
export function parseDoc(input: unknown): EmailDoc | null {
  if (!input || typeof input !== "object") return null;
  const r = input as Record<string, unknown>;
  if (!Array.isArray(r.blocks) || r.blocks.length > MAX_BLOCKS) return null;
  const used = new Set<string>();
  const blocks = r.blocks
    .map((b) => parseBlock(b, used))
    .filter((b): b is Block => b !== null);
  return { version: 1, settings: parseSettings(r.settings), blocks };
}

export function serializeDoc(doc: EmailDoc): string {
  return JSON.stringify(doc, null, 2);
}

export function parseDocJson(json: string): EmailDoc | null {
  try {
    return parseDoc(JSON.parse(json));
  } catch {
    return null;
  }
}

export function loadStoredDoc(): EmailDoc | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseDocJson(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredDoc(doc: EmailDoc): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch {
    /* storage full or blocked (private mode): editing still works in memory */
  }
}
