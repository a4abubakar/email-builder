import type { EmailDoc } from "./types";
import { DEFAULT_SETTINGS, FONT_STACKS } from "./types";

/** All starter content is fictional. Image paths are root-relative and made absolute at render time. */

const renewal: EmailDoc = {
  version: 1,
  settings: {
    ...DEFAULT_SETTINGS,
    subject: "Your Harborlight home cover renews on 14 December",
    preheader: "Review your cover, check what's changed and renew in under two minutes.",
    brandColor: "#0b5c8e",
    backgroundColor: "#e9eef3",
    fontStack: FONT_STACKS[0].value,
  },
  blocks: [
    {
      id: "rr-header",
      type: "header",
      logoUrl: "/samples/logo-harborlight.png",
      logoAlt: "Harborlight Cover",
      logoWidth: 150,
      logoHeight: 38,
      logoLink: "https://harborlight.example",
      nav: "My policy | https://harborlight.example/policy\nHelp | https://harborlight.example/help",
    },
    {
      id: "rr-hero",
      type: "hero",
      imageUrl: "/samples/hero-renewal.png",
      imageAlt: "A lighthouse on a calm coastline at dusk",
      imageHeight: 300,
      linkUrl: "https://harborlight.example/renew",
      headline: "Your home cover renews on 14 December",
    },
    {
      id: "rr-text",
      type: "text",
      heading: "Hi {{first_name}}, time for a quick check-up",
      body: "Your **Home Plus** policy (ref HL-48213) is due to renew on **14 December**. Nothing to do if everything is still right: we'll renew it automatically.\n\nIf your circumstances have changed, [update your details](https://harborlight.example/policy) before the renewal date so your price stays accurate.",
      align: "left",
    },
    {
      id: "rr-cols",
      type: "twoColumn",
      imageUrl: "/samples/column-c.png",
      imageAlt: "A house with a shield icon",
      imageHeight: 160,
      imageSide: "left",
      heading: "What's changed this year",
      body: "Your buildings sum insured now follows the latest rebuild-cost index, and accidental damage is included as standard.",
      linkLabel: "See the full changes",
      linkUrl: "https://harborlight.example/renewal-changes",
    },
    {
      id: "rr-cta",
      type: "cta",
      label: "Review and renew",
      url: "https://harborlight.example/renew",
      align: "center",
    },
    { id: "rr-div", type: "divider", style: "line", height: 24 },
    {
      id: "rr-help",
      type: "text",
      heading: "",
      body: "Prefer to talk it through? Call us on 0800 000 0000, Monday to Friday, 8am to 6pm.",
      align: "center",
    },
    {
      id: "rr-footer",
      type: "footer",
      company: "Harborlight Cover Ltd",
      address: "1 Quayside Walk\nPortmere, PM1 4HL",
      social: "Facebook | https://harborlight.example/facebook\nLinkedIn | https://harborlight.example/linkedin",
      note: "You're receiving this because you hold a policy with Harborlight Cover. This is a service message about your renewal.",
      unsubscribeLabel: "Manage email preferences",
      unsubscribeUrl: "https://harborlight.example/preferences",
    },
  ],
};

const welcome: EmailDoc = {
  version: 1,
  settings: {
    ...DEFAULT_SETTINGS,
    subject: "Welcome to Fernwood Cycles",
    preheader: "Your first ride starts here: three things to do this week.",
    brandColor: "#2f7d4f",
    backgroundColor: "#eef3ec",
    fontStack: FONT_STACKS[1].value,
  },
  blocks: [
    {
      id: "wl-header",
      type: "header",
      logoUrl: "/samples/logo-fernwood.png",
      logoAlt: "Fernwood Cycles",
      logoWidth: 150,
      logoHeight: 38,
      logoLink: "https://fernwood.example",
      nav: "Bikes | https://fernwood.example/bikes\nRoutes | https://fernwood.example/routes",
    },
    {
      id: "wl-hero",
      type: "hero",
      imageUrl: "/samples/hero-welcome.png",
      imageAlt: "A cyclist riding along a tree-lined country lane",
      imageHeight: 300,
      linkUrl: "",
      headline: "Welcome to the Fernwood family",
    },
    {
      id: "wl-text",
      type: "text",
      heading: "Glad you're here, {{first_name}}",
      body: "Thanks for joining. Here's how to get the most from your first week with us.\n\nYour **10% welcome code** is *FERN10*, valid for 30 days on bikes and accessories.",
      align: "left",
    },
    {
      id: "wl-col1",
      type: "twoColumn",
      imageUrl: "/samples/column-a.png",
      imageAlt: "A route map with a highlighted trail",
      imageHeight: 160,
      imageSide: "left",
      heading: "Find a route",
      body: "Browse 200+ graded routes near you, from family loops to weekend climbs.",
      linkLabel: "Explore routes",
      linkUrl: "https://fernwood.example/routes",
    },
    {
      id: "wl-col2",
      type: "twoColumn",
      imageUrl: "/samples/column-b.png",
      imageAlt: "A bike with a wrench and a tick",
      imageHeight: 160,
      imageSide: "right",
      heading: "Free first service",
      body: "Book a free safety check at any Fernwood workshop within 60 days of purchase.",
      linkLabel: "Book a service",
      linkUrl: "https://fernwood.example/service",
    },
    {
      id: "wl-cta",
      type: "cta",
      label: "Shop with 10% off",
      url: "https://fernwood.example/shop",
      align: "center",
    },
    {
      id: "wl-footer",
      type: "footer",
      company: "Fernwood Cycles",
      address: "22 Millrace Lane\nGreenfield, GF2 7QT",
      social: "Instagram | https://fernwood.example/instagram\nYouTube | https://fernwood.example/youtube",
      note: "You're receiving this because you created a Fernwood account.",
      unsubscribeLabel: "Unsubscribe",
      unsubscribeUrl: "https://fernwood.example/unsubscribe",
    },
  ],
};

const newsletter: EmailDoc = {
  version: 1,
  settings: {
    ...DEFAULT_SETTINGS,
    subject: "Paperkite Weekly: five things worth your Friday",
    preheader: "A calmer way to catch up: stories, a tool and a long read.",
    brandColor: "#7a3fc2",
    backgroundColor: "#f1edf7",
    fontStack: FONT_STACKS[5].value,
  },
  blocks: [
    {
      id: "nl-header",
      type: "header",
      logoUrl: "/samples/logo-paperkite.png",
      logoAlt: "Paperkite Weekly",
      logoWidth: 190,
      logoHeight: 38,
      logoLink: "https://paperkite.example",
      nav: "Archive | https://paperkite.example/archive",
    },
    {
      id: "nl-hero",
      type: "hero",
      imageUrl: "/samples/hero-news.png",
      imageAlt: "A kite made from folded paper over rooftops",
      imageHeight: 240,
      linkUrl: "",
      headline: "Issue 48: the slow web is back",
    },
    {
      id: "nl-intro",
      type: "text",
      heading: "This week",
      body: "Hello {{first_name}}. Five short reads, one tool we keep using, and a long read for the weekend.",
      align: "left",
    },
    {
      id: "nl-col1",
      type: "twoColumn",
      imageUrl: "/samples/column-d.png",
      imageAlt: "A stack of books with a bookmark",
      imageHeight: 160,
      imageSide: "left",
      heading: "Why small blogs are winning",
      body: "Readers are drifting back to independent writers. What that means for how we publish.",
      linkLabel: "Read the story",
      linkUrl: "https://paperkite.example/small-blogs",
    },
    {
      id: "nl-col2",
      type: "twoColumn",
      imageUrl: "/samples/column-a.png",
      imageAlt: "A map with a winding path",
      imageHeight: 160,
      imageSide: "right",
      heading: "A tool we keep using",
      body: "A tiny outliner that turns messy notes into a clean draft in minutes.",
      linkLabel: "Try it free",
      linkUrl: "https://paperkite.example/tool",
    },
    { id: "nl-div", type: "divider", style: "line", height: 28 },
    {
      id: "nl-long",
      type: "text",
      heading: "The long read",
      body: "*How a village library became the most-borrowed in the country.* Twelve minutes, worth it.",
      align: "left",
    },
    {
      id: "nl-cta",
      type: "cta",
      label: "Read the long read",
      url: "https://paperkite.example/long-read",
      align: "left",
    },
    {
      id: "nl-footer",
      type: "footer",
      company: "Paperkite Media",
      address: "Unit 4, Cobble Yard\nLinden, LN3 9XY",
      social: "Mastodon | https://paperkite.example/mastodon\nRSS | https://paperkite.example/rss",
      note: "You're getting this because you subscribed to Paperkite Weekly.",
      unsubscribeLabel: "Unsubscribe",
      unsubscribeUrl: "https://paperkite.example/unsubscribe",
    },
  ],
};

export interface StarterTemplate {
  id: string;
  name: string;
  description: string;
  doc: EmailDoc;
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  { id: "renewal", name: "Renewal reminder", description: "Service email with a clear renew action", doc: renewal },
  { id: "welcome", name: "Welcome", description: "Onboarding with a welcome offer", doc: welcome },
  { id: "newsletter", name: "Newsletter", description: "Editorial layout with alternating columns", doc: newsletter },
];

export function getStarter(id: string): EmailDoc | null {
  const found = STARTER_TEMPLATES.find((t) => t.id === id);
  return found ? structuredClone(found.doc) : null;
}

export const EMPTY_DOC: EmailDoc = {
  version: 1,
  settings: { ...DEFAULT_SETTINGS },
  blocks: [],
};
