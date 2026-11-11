import { ensureContrast, normalizeHex, readableTextOn } from "./color";
import {
  DEFAULT_SETTINGS,
  EMAIL_WIDTH,
  type Block,
  type CtaBlock,
  type DividerBlock,
  type EmailDoc,
  type FooterBlock,
  type HeaderBlock,
  type HeroBlock,
  type TextBlock,
  type TwoColumnBlock,
} from "./types";

export interface RenderOptions {
  /** Prefix for root-relative asset paths (`/samples/a.png`), so exported image URLs are always absolute. */
  baseUrl?: string;
  /**
   * Preview only: emits the dark-mode rules unconditionally, because an iframe can't be told to
   * match `prefers-color-scheme: dark` independently of the host page. Never set for real exports.
   */
  forceDark?: boolean;
}

/* ------------------------------------------------------------------ */
/* Escaping and sanitising: every user-controlled string goes through  */
/* one of these before it is interpolated into markup.                 */
/* ------------------------------------------------------------------ */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const CONTROL_CHARS = /[\u0000-\u001f\u007f\s]+/g;
const MERGE_TAG = /^\{\{[A-Za-z0-9_.| :'-]{1,80}\}\}$/;

/**
 * Returns an attribute-safe href. Allows http(s), mailto, tel, in-page anchors and a single
 * ESP merge tag such as `{{unsubscribe_url}}`. Anything else (javascript:, data:, ...) becomes `#`.
 */
export function safeHref(url: string): string {
  const v = (url ?? "").replace(CONTROL_CHARS, "");
  if (v === "") return "#";
  if (MERGE_TAG.test(v)) return v;
  if (v === "#" || /^(https?:\/\/|mailto:|tel:)/i.test(v)) return escapeHtml(v);
  return "#";
}

/** Absolute http(s) image URL, or `null` when none can be produced. */
export function resolveImageUrl(url: string, baseUrl?: string): string | null {
  const v = (url ?? "").replace(CONTROL_CHARS, "");
  if (/^https?:\/\//i.test(v)) return escapeHtml(v);
  if (v.startsWith("//")) return escapeHtml("https:" + v);
  if (v.startsWith("/") && baseUrl && /^https?:\/\//i.test(baseUrl)) {
    return escapeHtml(baseUrl.replace(/\/+$/, "") + v);
  }
  return null;
}

/** Font stacks are interpolated into a style attribute, so only allow plain font-name characters. */
export function safeFontStack(value: string): string {
  const v = (value ?? "").trim();
  // Reject (rather than strip) anything suspicious so a tampered value can't turn into a different valid stack.
  return v !== "" && /^[A-Za-z0-9 ,'_-]+$/.test(v) ? v : DEFAULT_SETTINGS.fontStack;
}

function int(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

/** `Label | https://url` lines to link objects (labels unescaped). */
export function parseLinkLines(text: string): { label: string; url: string }[] {
  return (text ?? "")
    .split(/\r?\n/)
    .map((line) => {
      const i = line.indexOf("|");
      if (i === -1) return { label: line.trim(), url: "" };
      return { label: line.slice(0, i).trim(), url: line.slice(i + 1).trim() };
    })
    .filter((l) => l.label !== "" && l.url !== "");
}

/* ------------------------------------------------------------------ */
/* Simple inline formatting: **bold**, *italic*, [label](url)          */
/* ------------------------------------------------------------------ */

function emphasis(escaped: string): string {
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, "$1<em>$2</em>");
}

function inline(text: string, linkStyle: string): string {
  const LINK = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = LINK.exec(text)) !== null) {
    out += emphasis(escapeHtml(text.slice(last, m.index)));
    out += `<a href="${safeHref(m[2])}" class="dm-link" style="${linkStyle}">${emphasis(escapeHtml(m[1]))}</a>`;
    last = m.index + m[0].length;
  }
  out += emphasis(escapeHtml(text.slice(last)));
  return out;
}

/* ------------------------------------------------------------------ */
/* Render context                                                      */
/* ------------------------------------------------------------------ */

interface Ctx {
  brand: string;
  bg: string;
  font: string;
  baseUrl?: string;
  /** Brand colour adjusted to pass AA on white / on the footer grey. */
  link: string;
  linkOnGrey: string;
  linkDark: string;
}

const CARD = "#ffffff";
const FOOTER_BG = "#f4f4f5";
const DARK_PAGE = "#121212";
const DARK_CARD = "#1c1c1e";
const DARK_FOOTER = "#161618";
const TEXT = "#1f2937";
const HEADING = "#111827";
const MUTED = "#565d6b";
const MUTED_DARK = "#a8a8b0";
const TEXT_DARK = "#f2f2f2";

const T = `role="presentation" cellpadding="0" cellspacing="0" border="0"`;
const IMG_RESET = "display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;";

function placeholder(width: number, height: number, ctx: Ctx, text: string): string {
  return `<table ${T} width="100%"><tr><td bgcolor="#e5e7eb" align="center" height="${height}" style="height:${height}px;background-color:#e5e7eb;color:#4b5563;font-family:${ctx.font};font-size:14px;">${escapeHtml(text)}</td></tr></table>`;
}

function image(
  url: string,
  alt: string,
  width: number,
  height: number,
  ctx: Ctx,
  opts: { className?: string; extraStyle?: string } = {},
): string {
  const src = resolveImageUrl(url, ctx.baseUrl);
  if (!src) return placeholder(width, height, ctx, "Add an image URL");
  const cls = ` class="${opts.className ?? "img-fluid"}"`;
  return `<img src="${src}" width="${width}" height="${height}" alt="${escapeHtml(alt)}"${cls} style="${IMG_RESET}width:100%;max-width:${width}px;height:auto;${opts.extraStyle ?? ""}" />`;
}

function paragraphs(text: string, ctx: Ctx, opts: { size: number; line: number; align?: string; color?: string; cls?: string; linkStyle?: string }): string {
  const linkStyle = opts.linkStyle ?? `color:${ctx.link};text-decoration:underline;`;
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p class="${opts.cls ?? "dm-text"}" style="margin:0 0 16px;font-family:${ctx.font};font-size:${opts.size}px;line-height:${opts.line}px;color:${opts.color ?? TEXT};${opts.align ? `text-align:${opts.align};` : ""}">${inline(p, linkStyle).replace(/\n/g, "<br />")}</p>`,
    )
    .join("\n");
}

/* ------------------------------------------------------------------ */
/* Blocks: each returns one or more <tr> rows for the 600px container  */
/* ------------------------------------------------------------------ */

function renderHeader(b: HeaderBlock, ctx: Ctx): string {
  const w = int(b.logoWidth, 40, 300, 140);
  const h = int(b.logoHeight, 16, 160, 36);
  const logoImg = resolveImageUrl(b.logoUrl, ctx.baseUrl)
    ? image(b.logoUrl, b.logoAlt, w, h, ctx, { className: "logo-center" })
    : `<span class="dm-text" style="font-family:${ctx.font};font-size:22px;font-weight:bold;color:${HEADING};">${escapeHtml(b.logoAlt)}</span>`;
  const logo = b.logoLink
    ? `<a href="${safeHref(b.logoLink)}" style="text-decoration:none;">${logoImg}</a>`
    : logoImg;
  const nav = parseLinkLines(b.nav)
    .map(
      (l) =>
        `<a href="${safeHref(l.url)}" class="dm-link" style="font-family:${ctx.font};font-size:14px;line-height:20px;color:${ctx.link};text-decoration:none;font-weight:bold;padding-left:18px;white-space:nowrap;">${escapeHtml(l.label)}</a>`,
    )
    .join(" ");
  return `<tr>
<td class="px-m" style="padding:20px 40px;border-top:4px solid ${ctx.brand};">
<table ${T} width="100%"><tr>
<td class="stack stack-center" align="left" valign="middle" style="padding:4px 0;">${logo}</td>
${nav ? `<td class="stack stack-center nav" align="right" valign="middle" style="padding:4px 0;">${nav}</td>` : ""}
</tr></table>
</td>
</tr>`;
}

function renderHero(b: HeroBlock, ctx: Ctx): string {
  const h = int(b.imageHeight, 60, 800, 300);
  let img = image(b.imageUrl, b.imageAlt, EMAIL_WIDTH, h, ctx);
  if (b.linkUrl.trim()) {
    img = `<a href="${safeHref(b.linkUrl)}" style="text-decoration:none;">${img}</a>`;
  }
  const headline = b.headline.trim();
  return `<tr>
<td style="padding:0;font-size:0;line-height:0;">${img}</td>
</tr>${
    headline
      ? `
<tr>
<td class="px-m" bgcolor="${ctx.brand}" style="padding:28px 40px;background-color:${ctx.brand};text-align:center;">
<h1 class="h1" style="margin:0;font-family:${ctx.font};font-size:30px;line-height:36px;font-weight:bold;color:${readableTextOn(ctx.brand)};">${escapeHtml(headline)}</h1>
</td>
</tr>`
      : ""
  }`;
}

function renderText(b: TextBlock, ctx: Ctx): string {
  const align = b.align === "center" ? "center" : "left";
  const heading = b.heading.trim();
  const body = paragraphs(b.body, ctx, { size: 16, line: 24, align });
  if (!heading && !body) return "";
  return `<tr>
<td class="px-m" align="${align}" style="padding:28px 40px 12px;text-align:${align};">
${heading ? `<h2 class="dm-text h2" style="margin:0 0 12px;font-family:${ctx.font};font-size:22px;line-height:28px;font-weight:bold;color:${HEADING};text-align:${align};">${escapeHtml(heading)}</h2>` : ""}
${body}
</td>
</tr>`;
}

function renderCta(b: CtaBlock, ctx: Ctx): string {
  const align = b.align === "left" ? "left" : "center";
  const label = escapeHtml(b.label.trim() || "Click here");
  const href = safeHref(b.url);
  const textColor = readableTextOn(ctx.brand);
  // Outlook can't size an <a> by padding, so the VML button gets an explicit width estimated from the label.
  const vmlWidth = int(b.label.length * 11 + 72, 140, 520, 220);
  return `<tr>
<td class="px-m" align="${align}" style="padding:12px 40px 32px;text-align:${align};">
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:50px;v-text-anchor:middle;width:${vmlWidth}px;" arcsize="16%" strokecolor="${ctx.brand}" fillcolor="${ctx.brand}">
<w:anchorlock/>
<center style="color:${textColor};font-family:${ctx.font};font-size:16px;font-weight:bold;">${label}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="${href}" style="display:inline-block;background-color:${ctx.brand};border:1px solid ${ctx.brand};border-radius:8px;color:${textColor};font-family:${ctx.font};font-size:16px;font-weight:bold;line-height:48px;text-align:center;text-decoration:none;padding:0 32px;mso-hide:all;-webkit-text-size-adjust:none;">${label}</a>
<!--<![endif]-->
</td>
</tr>`;
}

function renderTwoColumn(b: TwoColumnBlock, ctx: Ctx): string {
  const colW = 250;
  const h = int(b.imageHeight, 40, 600, 160);
  const imgHtml = image(b.imageUrl, b.imageAlt, colW, h, ctx);
  const heading = b.heading.trim();
  const link =
    b.linkLabel.trim()
      ? `<p style="margin:0 0 16px;font-family:${ctx.font};font-size:15px;line-height:22px;"><a href="${safeHref(b.linkUrl)}" class="dm-link" style="color:${ctx.link};font-weight:bold;text-decoration:underline;">${escapeHtml(b.linkLabel.trim())}</a></p>`
      : "";
  const textHtml = `${heading ? `<h3 class="dm-text" style="margin:0 0 8px;font-family:${ctx.font};font-size:18px;line-height:24px;font-weight:bold;color:${HEADING};">${escapeHtml(heading)}</h3>` : ""}
${paragraphs(b.body, ctx, { size: 15, line: 22 })}
${link}`;
  const imageFirst = b.imageSide !== "right";
  const left = imageFirst ? imgHtml : textHtml;
  const right = imageFirst ? textHtml : imgHtml;
  const col = (side: "l" | "r", content: string) =>
    `<div class="stack" style="display:inline-block;width:100%;max-width:${colW + 10}px;vertical-align:top;font-size:16px;text-align:left;">
<table ${T} width="100%"><tr><td class="col-${side}${side === "r" ? " col-gap" : ""}" valign="top" style="padding:${side === "l" ? "0 10px 0 0" : "0 0 0 10px"};">
${content}
</td></tr></table>
</div>`;
  return `<tr>
<td class="px-m" align="center" style="padding:20px 40px 12px;font-size:0;text-align:center;">
<!--[if mso]><table ${T} width="${EMAIL_WIDTH - 80}"><tr><td width="${(EMAIL_WIDTH - 80) / 2}" valign="top"><![endif]-->
${col("l", left)}
<!--[if mso]></td><td width="${(EMAIL_WIDTH - 80) / 2}" valign="top"><![endif]-->
${col("r", right)}
<!--[if mso]></td></tr></table><![endif]-->
</td>
</tr>`;
}

function renderDivider(b: DividerBlock): string {
  const h = int(b.height, 4, 120, 24);
  if (b.style === "space") {
    return `<tr>
<td height="${h}" style="height:${h}px;line-height:${h}px;font-size:1px;">&nbsp;</td>
</tr>`;
  }
  const pad = Math.max(0, Math.floor((h - 1) / 2));
  return `<tr>
<td class="px-m" style="padding:${pad}px 40px;">
<table ${T} width="100%"><tr><td class="dm-rule" height="1" style="height:1px;line-height:1px;font-size:1px;border-top:1px solid #e5e7eb;">&nbsp;</td></tr></table>
</td>
</tr>`;
}

function renderFooter(b: FooterBlock, ctx: Ctx): string {
  const small = `font-family:${ctx.font};font-size:12px;line-height:18px;color:${MUTED};`;
  const social = parseLinkLines(b.social)
    .map(
      (l) =>
        `<a href="${safeHref(l.url)}" class="dm-link" style="color:${ctx.linkOnGrey};text-decoration:underline;">${escapeHtml(l.label)}</a>`,
    )
    .join(" &nbsp;&middot;&nbsp; ");
  const address = escapeHtml(b.address.trim()).replace(/\r?\n/g, "<br />");
  const unsub = b.unsubscribeLabel.trim()
    ? `<a href="${safeHref(b.unsubscribeUrl)}" class="dm-link" style="color:${ctx.linkOnGrey};text-decoration:underline;">${escapeHtml(b.unsubscribeLabel.trim())}</a>`
    : "";
  return `<tr>
<td class="px-m dm-footer" bgcolor="${FOOTER_BG}" align="center" style="padding:32px 40px;background-color:${FOOTER_BG};text-align:center;">
${b.company.trim() ? `<p class="dm-text" style="margin:0 0 8px;font-family:${ctx.font};font-size:14px;line-height:20px;font-weight:bold;color:${HEADING};">${escapeHtml(b.company.trim())}</p>` : ""}
${address ? `<p class="dm-muted" style="margin:0 0 14px;${small}">${address}</p>` : ""}
${social ? `<p class="dm-muted" style="margin:0 0 14px;${small}font-size:13px;">${social}</p>` : ""}
${b.note.trim() ? `<p class="dm-muted" style="margin:0 0 8px;${small}">${escapeHtml(b.note.trim())}</p>` : ""}
${unsub ? `<p class="dm-muted" style="margin:0;${small}">${unsub}</p>` : ""}
</td>
</tr>`;
}

function renderBlock(block: Block, ctx: Ctx): string {
  switch (block.type) {
    case "header":
      return renderHeader(block, ctx);
    case "hero":
      return renderHero(block, ctx);
    case "text":
      return renderText(block, ctx);
    case "cta":
      return renderCta(block, ctx);
    case "twoColumn":
      return renderTwoColumn(block, ctx);
    case "divider":
      return renderDivider(block);
    case "footer":
      return renderFooter(block, ctx);
    default:
      return "";
  }
}

/* ------------------------------------------------------------------ */
/* Document                                                            */
/* ------------------------------------------------------------------ */

function darkRules(ctx: Ctx): { plain: string; outlook: string } {
  const rules: [string, string][] = [
    [".dm-body, .dm-outer", `background-color:${DARK_PAGE} !important;`],
    [".dm-card", `background-color:${DARK_CARD} !important;`],
    [".dm-footer", `background-color:${DARK_FOOTER} !important;`],
    [".dm-text", `color:${TEXT_DARK} !important;`],
    [".dm-muted", `color:${MUTED_DARK} !important;`],
    [".dm-link", `color:${ctx.linkDark} !important;`],
    [".dm-rule", `border-color:#3a3a3e !important;`],
  ];
  const plain = rules.map(([sel, decl]) => `${sel}{${decl}}`).join("\n");
  // Outlook.com / Outlook mobile use [data-ogsc] (text) and [data-ogsb] (background) instead of the media query.
  const outlook = rules
    .map(([sel, decl]) => {
      const attr = decl.startsWith("background") ? "data-ogsb" : "data-ogsc";
      const scoped = sel
        .split(",")
        .map((s) => `[${attr}] ${s.trim()}`)
        .join(", ");
      return `${scoped}{${decl}}`;
    })
    .join("\n");
  return { plain, outlook };
}

const MSO_FONT_FALLBACK = "Arial, Helvetica, sans-serif";

export function renderEmail(doc: EmailDoc, options: RenderOptions = {}): string {
  const s = doc.settings ?? DEFAULT_SETTINGS;
  const brand = normalizeHex(s.brandColor, DEFAULT_SETTINGS.brandColor);
  const bg = normalizeHex(s.backgroundColor, DEFAULT_SETTINGS.backgroundColor);
  const font = safeFontStack(s.fontStack);
  const ctx: Ctx = {
    brand,
    bg,
    font,
    baseUrl: options.baseUrl,
    link: ensureContrast(brand, CARD),
    linkOnGrey: ensureContrast(brand, FOOTER_BG),
    linkDark: ensureContrast(brand, DARK_CARD),
  };

  const rows = (doc.blocks ?? [])
    .map((b) => renderBlock(b, ctx))
    .filter(Boolean)
    .join("\n");
  const preheader = (s.preheader ?? "").trim();
  // Padding with zero-width characters stops clients from pulling body copy into the inbox preview.
  const preheaderHtml = preheader
    ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}${"&nbsp;&zwnj;".repeat(60)}</div>`
    : "";
  const dark = darkRules(ctx);
  const title = escapeHtml((s.subject ?? "").trim() || "Email");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<title>${title}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<style type="text/css">
table, td, div, p, a, h1, h2, h3, span { font-family: ${MSO_FONT_FALLBACK}; }
td { mso-line-height-rule: exactly; }
</style>
<![endif]-->
<style type="text/css">
:root { color-scheme: light dark; supported-color-schemes: light dark; }
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
table { border-collapse: collapse; }
img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
u + #body a { color: inherit; text-decoration: none; }
#MessageViewBody a { color: inherit; text-decoration: none; }
@media screen and (max-width: 620px) {
  .container { width: 100% !important; max-width: 100% !important; }
  .px-m { padding-left: 20px !important; padding-right: 20px !important; }
  .stack { display: block !important; width: 100% !important; max-width: 100% !important; }
  .stack-center { text-align: center !important; }
  .nav a:first-child { padding-left: 0 !important; }
  .logo-center { margin: 0 auto !important; }
  .col-l { padding-right: 0 !important; }
  .col-r { padding-left: 0 !important; }
  .col-gap { padding-top: 20px !important; }
  .img-fluid { width: 100% !important; max-width: 100% !important; height: auto !important; }
  .h1 { font-size: 26px !important; line-height: 32px !important; }
  .h2 { font-size: 20px !important; line-height: 26px !important; }
}
${options.forceDark ? dark.plain : `@media (prefers-color-scheme: dark) {\n${dark.plain}\n}`}
${dark.outlook}
</style>
</head>
<body id="body" class="dm-body" bgcolor="${bg}" style="margin:0;padding:0;width:100%;word-spacing:normal;background-color:${bg};">
${preheaderHtml}
<div role="article" aria-roledescription="email" aria-label="${title}" lang="en" style="-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table ${T} width="100%" class="dm-outer" bgcolor="${bg}" style="background-color:${bg};">
<tr>
<td align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" align="center" width="${EMAIL_WIDTH}" cellpadding="0" cellspacing="0" border="0"><tr><td width="${EMAIL_WIDTH}"><![endif]-->
<table ${T} width="${EMAIL_WIDTH}" class="container dm-card" bgcolor="${CARD}" style="width:100%;max-width:${EMAIL_WIDTH}px;background-color:${CARD};">
${rows}
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td>
</tr>
</table>
</div>
</body>
</html>
`;
}
