/** Document model for the email builder. Plain JSON so it can be persisted, exported and imported as-is. */

export const EMAIL_WIDTH = 600 as const;

export const BLOCK_TYPES = [
  "header",
  "hero",
  "text",
  "cta",
  "twoColumn",
  "divider",
  "footer",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export interface HeaderBlock {
  id: string;
  type: "header";
  logoUrl: string;
  logoAlt: string;
  logoWidth: number;
  logoHeight: number;
  logoLink: string;
  /** One link per line: `Label | https://url` */
  nav: string;
}

export interface HeroBlock {
  id: string;
  type: "hero";
  imageUrl: string;
  imageAlt: string;
  imageHeight: number;
  linkUrl: string;
  headline: string;
}

export interface TextBlock {
  id: string;
  type: "text";
  heading: string;
  /** Blank line = new paragraph. Supports **bold**, *italic* and [label](url). */
  body: string;
  align: "left" | "center";
}

export interface CtaBlock {
  id: string;
  type: "cta";
  label: string;
  url: string;
  align: "left" | "center";
}

export interface TwoColumnBlock {
  id: string;
  type: "twoColumn";
  imageUrl: string;
  imageAlt: string;
  imageHeight: number;
  imageSide: "left" | "right";
  heading: string;
  body: string;
  linkLabel: string;
  linkUrl: string;
}

export interface DividerBlock {
  id: string;
  type: "divider";
  style: "line" | "space";
  height: number;
}

export interface FooterBlock {
  id: string;
  type: "footer";
  company: string;
  address: string;
  /** One link per line: `Label | https://url` */
  social: string;
  note: string;
  unsubscribeLabel: string;
  unsubscribeUrl: string;
}

export type Block =
  | HeaderBlock
  | HeroBlock
  | TextBlock
  | CtaBlock
  | TwoColumnBlock
  | DividerBlock
  | FooterBlock;

export interface EmailSettings {
  subject: string;
  preheader: string;
  brandColor: string;
  backgroundColor: string;
  fontStack: string;
  width: typeof EMAIL_WIDTH;
}

export interface EmailDoc {
  version: 1;
  settings: EmailSettings;
  blocks: Block[];
}

export const FONT_STACKS: { label: string; value: string }[] = [
  { label: "Arial / Helvetica", value: "Arial, Helvetica, sans-serif" },
  {
    label: "Helvetica Neue",
    value: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  {
    label: "System UI",
    value: "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  {
    label: "Verdana / Tahoma",
    value: "Verdana, Geneva, Tahoma, sans-serif",
  },
  {
    label: "Trebuchet",
    value: "'Trebuchet MS', 'Lucida Grande', Tahoma, sans-serif",
  },
  {
    label: "Georgia (serif)",
    value: "Georgia, 'Times New Roman', Times, serif",
  },
];

export const DEFAULT_SETTINGS: EmailSettings = {
  subject: "Your email subject",
  preheader: "",
  brandColor: "#0f6fbd",
  backgroundColor: "#eef1f5",
  fontStack: FONT_STACKS[0].value,
  width: EMAIL_WIDTH,
};

export function isBlockType(value: unknown): value is BlockType {
  return (
    typeof value === "string" &&
    (BLOCK_TYPES as readonly string[]).includes(value)
  );
}
