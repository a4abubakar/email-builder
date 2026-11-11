import { describe, expect, it } from "vitest";
import { checkEmail } from "./checks";
import { GMAIL_CLIP_BYTES, GMAIL_WARN_BYTES, byteLength, measureEmail } from "./size";
import { parseDoc, parseDocJson, serializeDoc } from "./storage";
import { getStarter } from "./templates";

describe("size calculation", () => {
  it("counts UTF-8 bytes, not characters", () => {
    expect(byteLength("abc")).toBe(3);
    expect(byteLength("é")).toBe(2);
    expect(byteLength("€")).toBe(3);
    expect(byteLength("😀")).toBe(4);
  });

  it("reports kilobytes at 1024 bytes and the share of Gmail's 102 KB limit", () => {
    const s = measureEmail("x".repeat(51 * 1024));
    expect(s.kb).toBe(51);
    expect(s.percentOfLimit).toBe(50);
    expect(s.level).toBe("ok");
  });

  it("warns near the limit and flags clipping above it", () => {
    expect(measureEmail("x".repeat(GMAIL_WARN_BYTES - 1)).level).toBe("ok");
    expect(measureEmail("x".repeat(GMAIL_WARN_BYTES)).level).toBe("warn");
    expect(measureEmail("x".repeat(GMAIL_CLIP_BYTES)).level).toBe("warn");
    expect(measureEmail("x".repeat(GMAIL_CLIP_BYTES + 1)).level).toBe("over");
  });
});

describe("document import", () => {
  it("round-trips a starter through JSON", () => {
    const doc = getStarter("newsletter")!;
    expect(parseDocJson(serializeDoc(doc))).toEqual(doc);
  });

  it("rejects non-documents and drops unknown blocks", () => {
    expect(parseDocJson("not json")).toBeNull();
    expect(parseDoc({ blocks: "x" })).toBeNull();
    const doc = parseDoc({ blocks: [{ type: "evil", id: "1" }, { type: "cta", id: "2", label: 5 }] });
    expect(doc?.blocks).toHaveLength(1);
    expect(doc?.blocks[0]).toMatchObject({ type: "cta", id: "2", label: "Get started" });
  });

  it("sanitises settings and clamps numbers", () => {
    const doc = parseDoc({
      settings: { brandColor: "javascript:1", fontStack: "Arial;}<script>" },
      blocks: [{ type: "hero", id: "h", imageHeight: 99999 }],
    });
    expect(doc?.settings.brandColor).toBe("#0f6fbd");
    expect(doc?.settings.fontStack).not.toContain("<");
    expect(doc?.blocks[0]).toMatchObject({ imageHeight: 800 });
  });

  it("repairs duplicate ids", () => {
    const doc = parseDoc({ blocks: [{ type: "text", id: "x" }, { type: "text", id: "x" }] });
    expect(new Set(doc?.blocks.map((b) => b.id)).size).toBe(2);
  });
});

describe("pre-send checks", () => {
  it("flags missing preheader, alt text, CTA url and unsubscribe", () => {
    const doc = getStarter("renewal")!;
    doc.settings.preheader = "";
    for (const b of doc.blocks) {
      if (b.type === "hero") b.imageAlt = "";
      if (b.type === "cta") b.url = "javascript:x";
      if (b.type === "footer") b.unsubscribeUrl = "";
    }
    const messages = checkEmail(doc, { baseUrl: "https://cdn.test" }).map((c) => c.message).join("\n");
    expect(messages).toMatch(/preheader/i);
    expect(messages).toMatch(/Hero banner: missing alt/);
    expect(messages).toMatch(/CTA/);
    expect(messages).toMatch(/unsubscribe/i);
  });

  it("is quiet for a clean starter", () => {
    const warns = checkEmail(getStarter("welcome")!, { baseUrl: "https://cdn.test" }).filter((c) => c.level === "warn");
    expect(warns).toEqual([]);
  });
});
