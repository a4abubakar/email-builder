import { resolveImageUrl, safeHref } from "./render";
import type { EmailDoc } from "./types";

export interface Check {
  level: "warn" | "info";
  message: string;
}

/** Pre-send checks that go beyond what the renderer can silently fix. */
export function checkEmail(doc: EmailDoc, opts: { baseUrl?: string } = {}): Check[] {
  const out: Check[] = [];
  const { settings, blocks } = doc;

  if (!settings.preheader.trim()) {
    out.push({ level: "warn", message: "No preheader text: inboxes will show the first line of body copy instead." });
  } else if (settings.preheader.length > 110) {
    out.push({ level: "warn", message: `Preheader is ${settings.preheader.length} characters; most inboxes show about 40 to 110.` });
  }
  if (!settings.subject.trim()) {
    out.push({ level: "warn", message: "Subject line is empty (used as the HTML <title>)." });
  }

  const images: { where: string; url: string; alt: string; required: boolean }[] = [];
  for (const b of blocks) {
    if (b.type === "header") images.push({ where: "Header logo", url: b.logoUrl, alt: b.logoAlt, required: true });
    if (b.type === "hero") images.push({ where: "Hero banner", url: b.imageUrl, alt: b.imageAlt, required: true });
    if (b.type === "twoColumn") images.push({ where: "Two-column image", url: b.imageUrl, alt: b.imageAlt, required: true });
  }
  let localhostSeen = false;
  for (const img of images) {
    if (img.where === "Header logo" && !img.url.trim()) continue; // text fallback is intentional
    const resolved = resolveImageUrl(img.url, opts.baseUrl);
    if (!resolved) {
      out.push({ level: "warn", message: `${img.where}: no usable absolute image URL.` });
      continue;
    }
    if (img.required && !img.alt.trim()) {
      out.push({ level: "warn", message: `${img.where}: missing alt text.` });
    }
    if (/^http:\/\//i.test(resolved) && !/localhost|127\.0\.0\.1/.test(resolved)) {
      out.push({ level: "warn", message: `${img.where}: image is served over http, which some clients block.` });
    }
    if (/localhost|127\.0\.0\.1/.test(resolved)) localhostSeen = true;
  }
  if (localhostSeen) {
    out.push({ level: "info", message: "Images are served from localhost. Swap in CDN URLs before sending." });
  }

  for (const b of blocks) {
    if (b.type === "cta" && safeHref(b.url) === "#") {
      out.push({ level: "warn", message: `CTA "${b.label}" has no valid URL.` });
    }
  }

  const footer = blocks.find((b) => b.type === "footer");
  if (!footer) {
    out.push({ level: "warn", message: "No footer block: marketing email needs a postal address and an unsubscribe link." });
  } else if (footer.type === "footer") {
    if (safeHref(footer.unsubscribeUrl) === "#" || !footer.unsubscribeLabel.trim()) {
      out.push({ level: "warn", message: "Footer has no working unsubscribe link." });
    }
    if (!footer.address.trim()) {
      out.push({ level: "warn", message: "Footer has no postal address." });
    }
  }
  return out;
}
