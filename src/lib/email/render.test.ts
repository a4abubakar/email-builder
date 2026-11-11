import { describe, expect, it } from "vitest";
import { createBlock } from "./blocks";
import { ensureContrast, contrastRatio, readableTextOn } from "./color";
import { renderEmail, safeHref, resolveImageUrl, parseLinkLines } from "./render";
import { getStarter } from "./templates";
import { DEFAULT_SETTINGS, type DividerBlock, type EmailDoc } from "./types";

function docWith(...blocks: ReturnType<typeof createBlock>[]): EmailDoc {
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS, preheader: "Inbox preview text", subject: "Hello" },
    blocks,
  };
}

describe("renderEmail structure", () => {
  const html = renderEmail(getStarter("renewal")!, { baseUrl: "https://cdn.test" });

  it("emits an XHTML doctype and Outlook/VML namespaces", () => {
    expect(html.startsWith('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"')).toBe(true);
    expect(html).toContain('xmlns:v="urn:schemas-microsoft-com:vml"');
    expect(html).toContain('xmlns:o="urn:schemas-microsoft-com:office:office"');
  });

  it("is table-based: every layout table is role=presentation and nothing uses flex or grid", () => {
    const tables = html.match(/<table\b[^>]*>/g) ?? [];
    expect(tables.length).toBeGreaterThan(5);
    for (const t of tables) expect(t).toContain('role="presentation"');
    expect(html).not.toMatch(/display:\s*(flex|grid)/);
  });

  it.each(["renewal", "welcome", "newsletter"])("%s starter has balanced table markup", (id) => {
    // Remove conditional comments first: the Outlook ghost tables open and close in separate comments.
    const visible = renderEmail(getStarter(id)!, { baseUrl: "https://cdn.test" }).replace(/<!--[\s\S]*?-->/g, "");
    for (const tag of ["table", "tr", "td", "div", "p", "a"]) {
      const open = (visible.match(new RegExp(`<${tag}[\\s>]`, "g")) ?? []).length;
      const close = (visible.match(new RegExp(`</${tag}>`, "g")) ?? []).length;
      expect({ tag, open }).toEqual({ tag, open: close });
    }
  });

  it("includes MSO conditionals: ghost table wrapper and VML bulletproof CTA", () => {
    expect(html).toContain("<!--[if mso]>");
    expect(html).toContain("<![endif]-->");
    expect(html).toContain("<v:roundrect");
    expect(html).toContain("<w:anchorlock/>");
    expect(html).toContain("<!--[if !mso]><!-->");
    expect(html).toMatch(/<!--\[if mso\]><table role="presentation" align="center" width="600"/);
  });

  it("has the responsive stacking class, colour-scheme meta and dark-mode rules", () => {
    expect(html).toContain("@media screen and (max-width: 620px)");
    expect(html).toContain(".stack { display: block !important;");
    expect(html).toContain('<meta name="color-scheme" content="light dark" />');
    expect(html).toContain('<meta name="supported-color-schemes" content="light dark" />');
    expect(html).toContain("@media (prefers-color-scheme: dark)");
    expect(html).toContain("[data-ogsc]");
  });

  it("puts bgcolor attributes next to inline background styles", () => {
    expect(html).toMatch(/bgcolor="#0b5c8e"[^>]*background-color:#0b5c8e/);
  });

  it("only ships absolute image URLs with width, height and alt", () => {
    const imgs = html.match(/<img\b[^>]*>/g) ?? [];
    expect(imgs.length).toBeGreaterThanOrEqual(3);
    for (const img of imgs) {
      expect(img).toMatch(/src="https:\/\/cdn\.test\/samples\/[^"]+"/);
      expect(img).toMatch(/\swidth="\d+"/);
      expect(img).toMatch(/\sheight="\d+"/);
      expect(img).toMatch(/\salt="[^"]*"/);
    }
  });

  it("dark preview mode emits the rules unconditionally; exports never do", () => {
    const preview = renderEmail(getStarter("welcome")!, { forceDark: true });
    expect(preview).not.toContain("@media (prefers-color-scheme: dark)");
    expect(preview).toMatch(/\.dm-card\{background-color:#1c1c1e !important;\}/);
    expect(html).toContain("@media (prefers-color-scheme: dark) {");
  });
});

describe("preheader", () => {
  it("renders a hidden preheader before the email body", () => {
    const html = renderEmail(docWith(createBlock("text", "t")));
    const idx = html.indexOf("Inbox preview text");
    expect(idx).toBeGreaterThan(-1);
    expect(html.indexOf('<div role="article"')).toBeGreaterThan(idx);
    const div = html.slice(html.lastIndexOf("<div", idx), idx);
    expect(div).toContain("display:none");
    expect(div).toContain("mso-hide:all");
    expect(div).toContain("max-height:0");
  });

  it("is omitted when empty", () => {
    const doc = docWith(createBlock("text", "t"));
    doc.settings.preheader = "  ";
    expect(renderEmail(doc)).not.toContain("display:none;font-size:1px");
  });
});

describe("escaping (no XSS)", () => {
  const evil = `<script>alert(1)</script>" onmouseover="x`;

  it("escapes user text in every text field", () => {
    const text = { ...createBlock("text", "t"), heading: evil, body: evil };
    const hero = { ...createBlock("hero", "h"), headline: evil, imageAlt: evil };
    const cta = { ...createBlock("cta", "c"), label: evil };
    const footer = { ...createBlock("footer", "f"), company: evil, address: evil, note: evil };
    const doc = docWith(text, hero, cta, footer);
    doc.settings.preheader = evil;
    doc.settings.subject = evil;
    const html = renderEmail(doc);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('" onmouseover="x');
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("&quot; onmouseover=&quot;x");
  });

  it("neutralises javascript: and data: URLs", () => {
    expect(safeHref("javascript:alert(1)")).toBe("#");
    expect(safeHref("  JaVa\nScRiPt:alert(1)")).toBe("#");
    expect(safeHref("data:text/html,<script>")).toBe("#");
    expect(safeHref("https://a.test/?q=1&r=\"x\"")).toBe("https://a.test/?q=1&amp;r=&quot;x&quot;");
    expect(safeHref("{{unsubscribe_url}}")).toBe("{{unsubscribe_url}}");
    const cta = { ...createBlock("cta", "c"), url: "javascript:alert(1)" };
    expect(renderEmail(docWith(cta))).not.toContain("javascript:");
  });

  it("rejects relative and non-http image URLs", () => {
    expect(resolveImageUrl("javascript:alert(1)")).toBeNull();
    expect(resolveImageUrl("images/a.png", "https://cdn.test")).toBeNull();
    expect(resolveImageUrl("/a.png")).toBeNull();
    expect(resolveImageUrl("/a.png", "https://cdn.test/")).toBe("https://cdn.test/a.png");
  });

  it("does not let colour or font settings break out of the style attribute", () => {
    const doc = docWith(createBlock("text", "t"), createBlock("cta", "c"));
    doc.settings.brandColor = 'red;"><script>';
    doc.settings.fontStack = 'Arial";}</style><script>alert(1)</script>';
    const html = renderEmail(doc);
    expect(html).not.toContain("<script>");
    expect(html).toContain(`fillcolor="${DEFAULT_SETTINGS.brandColor}"`);
    expect(html).toContain(`font-family:${DEFAULT_SETTINGS.fontStack}`);
  });

  it("only turns validated markdown links into anchors", () => {
    const text = { ...createBlock("text", "t"), body: "See [docs](https://a.test) and [bad](javascript:alert(1)) and **bold** *it*" };
    const html = renderEmail(docWith(text));
    expect(html).toContain('<a href="https://a.test"');
    expect(html).not.toContain("javascript:");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>it</em>");
  });
});

describe("blocks", () => {
  it("renders a spacer as an empty fixed-height cell", () => {
    const spacer: DividerBlock = { id: "d", type: "divider", style: "space", height: 32 };
    const html = renderEmail(docWith(spacer));
    expect(html).toContain('height="32"');
  });

  it("keeps header navigation links out of the doc when the line has no url", () => {
    expect(parseLinkLines("Shop | https://a.test\nBroken line\n | https://x")).toEqual([
      { label: "Shop", url: "https://a.test" },
    ]);
  });

  it("falls back to a placeholder when a hero has no usable image", () => {
    const hero = { ...createBlock("hero", "h"), imageUrl: "" };
    const html = renderEmail(docWith(hero));
    expect(html).toContain("Add an image URL");
    expect(html).not.toContain("<img");
  });
});

describe("colour helpers", () => {
  it("picks readable text and repairs low-contrast link colours", () => {
    expect(readableTextOn("#ffee00")).toBe("#111827");
    expect(readableTextOn("#0b5c8e")).toBe("#ffffff");
    expect(contrastRatio("#ffee00", "#ffffff")).toBeLessThan(4.5);
    expect(contrastRatio(ensureContrast("#ffee00", "#ffffff"), "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
});
