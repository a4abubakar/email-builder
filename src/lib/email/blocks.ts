import type { Block, BlockType } from "./types";

export type FieldKind = "text" | "textarea" | "url" | "number" | "select";

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  help?: string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
}

export interface BlockMeta {
  label: string;
  description: string;
  fields: FieldDef[];
}

const ALIGN = [
  { label: "Left", value: "left" },
  { label: "Centre", value: "center" },
];

export const BLOCK_META: Record<BlockType, BlockMeta> = {
  header: {
    label: "Header",
    description: "Logo with optional navigation links",
    fields: [
      { key: "logoUrl", label: "Logo image URL", kind: "url", help: "Absolute https URL, ideally 2x resolution." },
      { key: "logoAlt", label: "Logo alt text / brand name", kind: "text", help: "Shown as text when no logo is set." },
      { key: "logoWidth", label: "Logo width (px)", kind: "number", min: 40, max: 300 },
      { key: "logoHeight", label: "Logo height (px)", kind: "number", min: 16, max: 160 },
      { key: "logoLink", label: "Logo link URL", kind: "url" },
      { key: "nav", label: "Navigation links", kind: "textarea", help: "One per line: Label | https://url" },
    ],
  },
  hero: {
    label: "Hero banner",
    description: "Full-width image with a headline",
    fields: [
      { key: "imageUrl", label: "Image URL", kind: "url", help: "Absolute https URL. Exported at 600px wide." },
      { key: "imageAlt", label: "Image alt text", kind: "text" },
      { key: "imageHeight", label: "Image height (px)", kind: "number", min: 60, max: 800, help: "Match your asset's ratio at 600px wide; Outlook uses it." },
      { key: "linkUrl", label: "Image link URL (optional)", kind: "url" },
      { key: "headline", label: "Headline", kind: "text" },
    ],
  },
  text: {
    label: "Text",
    description: "Heading and paragraphs",
    fields: [
      { key: "heading", label: "Heading", kind: "text" },
      { key: "body", label: "Body", kind: "textarea", help: "Blank line = new paragraph. **bold**, *italic*, [label](https://url)" },
      { key: "align", label: "Alignment", kind: "select", options: ALIGN },
    ],
  },
  cta: {
    label: "CTA button",
    description: "Bulletproof button (VML for Outlook)",
    fields: [
      { key: "label", label: "Button label", kind: "text" },
      { key: "url", label: "Button URL", kind: "url" },
      { key: "align", label: "Alignment", kind: "select", options: ALIGN },
    ],
  },
  twoColumn: {
    label: "Two-column",
    description: "Image beside text; stacks on mobile",
    fields: [
      { key: "imageUrl", label: "Image URL", kind: "url" },
      { key: "imageAlt", label: "Image alt text", kind: "text" },
      { key: "imageHeight", label: "Image height (px)", kind: "number", min: 40, max: 600, help: "Height at 250px wide." },
      { key: "imageSide", label: "Image side", kind: "select", options: [{ label: "Left", value: "left" }, { label: "Right", value: "right" }] },
      { key: "heading", label: "Heading", kind: "text" },
      { key: "body", label: "Body", kind: "textarea", help: "**bold**, *italic*, [label](https://url)" },
      { key: "linkLabel", label: "Link label (optional)", kind: "text" },
      { key: "linkUrl", label: "Link URL", kind: "url" },
    ],
  },
  divider: {
    label: "Spacer / divider",
    description: "Vertical space or a thin rule",
    fields: [
      { key: "style", label: "Style", kind: "select", options: [{ label: "Divider line", value: "line" }, { label: "Empty space", value: "space" }] },
      { key: "height", label: "Height (px)", kind: "number", min: 4, max: 120 },
    ],
  },
  footer: {
    label: "Footer",
    description: "Address, social links and unsubscribe",
    fields: [
      { key: "company", label: "Company name", kind: "text" },
      { key: "address", label: "Postal address", kind: "textarea", help: "Line breaks are kept." },
      { key: "social", label: "Social links", kind: "textarea", help: "One per line: Label | https://url" },
      { key: "note", label: "Reason for receiving this", kind: "textarea" },
      { key: "unsubscribeLabel", label: "Unsubscribe link text", kind: "text" },
      { key: "unsubscribeUrl", label: "Unsubscribe URL", kind: "url", help: "Use your ESP's merge tag, e.g. {{unsubscribe_url}}." },
    ],
  },
};

export function createBlock(type: BlockType, id: string): Block {
  switch (type) {
    case "header":
      return {
        id,
        type,
        logoUrl: "",
        logoAlt: "Your brand",
        logoWidth: 140,
        logoHeight: 36,
        logoLink: "https://example.com",
        nav: "Shop | https://example.com/shop\nHelp | https://example.com/help",
      };
    case "hero":
      return {
        id,
        type,
        imageUrl: "/samples/hero-welcome.png",
        imageAlt: "Illustration of a bicycle on a hill",
        imageHeight: 300,
        linkUrl: "",
        headline: "A headline that says it all",
      };
    case "text":
      return {
        id,
        type,
        heading: "A short, useful heading",
        body: "Write the message here. Keep paragraphs short, and put the *one thing* the reader should do near the top.\n\nA blank line starts a new paragraph.",
        align: "left",
      };
    case "cta":
      return {
        id,
        type,
        label: "Get started",
        url: "https://example.com/start",
        align: "center",
      };
    case "twoColumn":
      return {
        id,
        type,
        imageUrl: "/samples/column-a.png",
        imageAlt: "Illustration of a route map",
        imageHeight: 160,
        imageSide: "left",
        heading: "Feature heading",
        body: "One or two sentences about this feature or story.",
        linkLabel: "Learn more",
        linkUrl: "https://example.com/learn-more",
      };
    case "divider":
      return { id, type, style: "line", height: 24 };
    case "footer":
      return {
        id,
        type,
        company: "Your Company Ltd",
        address: "12 Example Street\nSampletown, AB1 2CD",
        social: "Instagram | https://example.com/instagram\nLinkedIn | https://example.com/linkedin",
        note: "You are receiving this email because you signed up on our website.",
        unsubscribeLabel: "Unsubscribe",
        unsubscribeUrl: "https://example.com/unsubscribe",
      };
  }
}

/** One-line description of a block's content, for the structure list. */
export function summarizeBlock(block: Block): string {
  const clip = (s: string) => (s.length > 46 ? s.slice(0, 45) + "…" : s);
  switch (block.type) {
    case "header":
      return clip(block.logoAlt || "Logo");
    case "hero":
      return clip(block.headline || "No headline");
    case "text":
      return clip(block.heading || block.body || "Empty text");
    case "cta":
      return clip(block.label || "No label");
    case "twoColumn":
      return clip(block.heading || "No heading");
    case "divider":
      return block.style === "line" ? `Line, ${block.height}px` : `Space, ${block.height}px`;
    case "footer":
      return clip(block.company || "Footer");
  }
}
