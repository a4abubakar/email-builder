// Renders the fictional sample artwork (logos, heroes, column images) to PNG in public/samples.
// Email clients don't render SVG, so the starter templates ship real PNGs at 2x resolution.
// Usage: npm run samples   (needs Microsoft Edge, or remove `channel` to use Playwright's Chromium)
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const out = path.resolve("public/samples");
await mkdir(out, { recursive: true });

const FONT = `font-family="Arial, Helvetica, sans-serif" font-weight="700"`;

const logo = (w, h, mark, name, colour) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" rx="14" fill="#ffffff"/>
  ${mark(colour)}
  <text x="${h + 6}" y="${h * 0.66}" ${FONT} font-size="${h * 0.42}" fill="${colour}">${name}</text>
</svg>`;

const sky = (id, a, b, c) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="0.6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;

const assets = {
  "logo-harborlight": {
    w: 300, h: 76,
    svg: logo(300, 76, (c) => `<g fill="${c}"><path d="M30 8h16l5 46H25z"/><rect x="20" y="54" width="36" height="8" rx="2"/><path d="M28 4h20l-10-4z"/></g><rect x="31" y="22" width="14" height="6" fill="#fff"/><rect x="31" y="36" width="14" height="6" fill="#fff"/>`, "Harborlight", "#0b5c8e"),
  },
  "logo-fernwood": {
    w: 300, h: 76,
    svg: logo(300, 76, (c) => `<path d="M10 62C10 30 30 10 62 8c0 32-20 52-52 54z" fill="${c}"/><path d="M14 58C28 40 40 28 56 14" stroke="#fff" stroke-width="3" fill="none"/>`, "Fernwood", "#2f7d4f"),
  },
  "logo-paperkite": {
    w: 380, h: 76,
    svg: logo(380, 76, (c) => `<path d="M38 4l24 26-24 22-24-22z" fill="${c}"/><path d="M38 4v48M14 30h48" stroke="#fff" stroke-width="2"/><path d="M38 52c-6 8 6 10 0 18" stroke="${c}" stroke-width="3" fill="none"/>`, "Paperkite Weekly", "#7a3fc2"),
  },
  "hero-renewal": {
    w: 1200, h: 600,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600"><defs>${sky("s", "#0e2a47", "#2c6a8f", "#f3b48a")}</defs>
      <rect width="1200" height="600" fill="url(#s)"/>
      <circle cx="900" cy="330" r="70" fill="#ffd9a8" opacity=".9"/>
      <path d="M0 360h1200v240H0z" fill="#0f3a5a"/>
      <path d="M0 400c150-20 250 20 400 0s300-20 450 0 250 20 350 0v200H0z" fill="#0b2e49"/>
      <path d="M0 470c200-25 300 25 500 0s400-25 700 0v130H0z" fill="#082337"/>
      <path d="M0 330c200-40 360-20 520 10l40 30H0z" fill="#16405d"/>
      <path d="M300 340l22-190h56l22 190z" fill="#f4f1ea"/>
      <path d="M311 255l7-60h44l7 60z" fill="#c8453b"/>
      <rect x="318" y="122" width="62" height="34" fill="#ffd27a"/>
      <path d="M312 122h74l-37-34z" fill="#c8453b"/>
      <path d="M380 139L760 60v158z" fill="#ffd27a" opacity=".28"/>
      <rect x="276" y="340" width="146" height="18" rx="4" fill="#2a2f3a"/></svg>`,
  },
  "hero-welcome": {
    w: 1200, h: 600,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600"><defs>${sky("s", "#9fd6ee", "#dff2e6", "#f6f1d4")}</defs>
      <rect width="1200" height="600" fill="url(#s)"/>
      <circle cx="1000" cy="130" r="60" fill="#fff6c8"/>
      <path d="M0 360c200-90 380-70 560-10s440 40 640-40v290H0z" fill="#8ec79a"/>
      <path d="M0 430c260-60 420-30 640 10s380 10 560-30v190H0z" fill="#4f9a68"/>
      <path d="M0 520c300-30 600-10 1200-20v100H0z" fill="#3a7d52"/>
      <g fill="#2c6a45"><circle cx="150" cy="330" r="46"/><rect x="144" y="360" width="12" height="60"/><circle cx="1040" cy="350" r="38"/><rect x="1034" y="376" width="12" height="50"/></g>
      <g transform="translate(470 330)" stroke="#1f2b24" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="0" cy="130" r="62"/><circle cx="250" cy="130" r="62"/>
        <path d="M0 130L80 40h110l60 90M80 40l50 90h120M190 40l-12-22h40M80 40l-8-20h-22"/>
        <circle cx="120" cy="-24" r="22" fill="#1f2b24"/>
        <path d="M110 4l-30 36M120 4l50 20 20 16"/></g></svg>`,
  },
  "hero-news": {
    w: 1200, h: 480,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="480" viewBox="0 0 1200 480"><defs>${sky("s", "#cdb6f0", "#eadcf8", "#fbeede")}</defs>
      <rect width="1200" height="480" fill="url(#s)"/>
      <g fill="#6d4aa3" opacity=".85"><path d="M0 400h120l30-50 30 50h130l40-70 40 70h160l30-40 30 40h140l40-60 40 60h160l30-45 30 45h220v80H0z"/></g>
      <g transform="translate(700 40) rotate(14)"><path d="M0 0l110 120-110 150L-110 120z" fill="#fff"/><path d="M0 0v270M-110 120h220" stroke="#7a3fc2" stroke-width="5"/><path d="M0 0l110 120H0z" fill="#e9d8ff"/>
      <path d="M0 270c-40 40 40 70 0 110s40 50 10 80" stroke="#7a3fc2" stroke-width="5" fill="none"/>
      <path d="M-14 330l14-12 14 12-14 12zM6 392l14-12 14 12-14 12z" fill="#f08a5d"/></g></svg>`,
  },
  "column-a": {
    w: 500, h: 320,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="320" viewBox="0 0 500 320"><rect width="500" height="320" fill="#e8f1e6"/>
      <path d="M0 80c80 20 120-30 200 0s140 40 300 0v-80H0z" fill="#cfe3cb"/><path d="M0 250c100-30 160 30 260 0s160-30 240 10v60H0z" fill="#d7e8d2"/>
      <path d="M60 270c90-20 40-90 130-100s80 60 150 20 20-90 110-90" stroke="#2f7d4f" stroke-width="8" stroke-dasharray="4 16" stroke-linecap="round" fill="none"/>
      <circle cx="60" cy="270" r="12" fill="#2f7d4f"/><path d="M450 80c-18 0-30 14-30 30 0 22 30 50 30 50s30-28 30-50c0-16-12-30-30-30z" fill="#c8453b"/><circle cx="450" cy="110" r="10" fill="#fff"/></svg>`,
  },
  "column-b": {
    w: 500, h: 320,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="320" viewBox="0 0 500 320"><rect width="500" height="320" fill="#e6efe9"/>
      <g stroke="#1f2b24" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(70 70)"><circle cx="50" cy="130" r="50"/><circle cx="270" cy="130" r="50"/><path d="M50 130l80-80h90l50 80M130 50l40 80h100M220 50l-10-20h36"/></g>
      <circle cx="400" cy="90" r="46" fill="#2f7d4f"/><path d="M378 90l16 18 30-34" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  "column-c": {
    w: 500, h: 320,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="320" viewBox="0 0 500 320"><rect width="500" height="320" fill="#e4eef6"/>
      <path d="M90 170L250 50l160 120v110H90z" fill="#fff" stroke="#0b5c8e" stroke-width="8" stroke-linejoin="round"/>
      <rect x="215" y="200" width="70" height="80" fill="#0b5c8e"/><rect x="120" y="190" width="56" height="50" fill="#bcd7ea"/><rect x="324" y="190" width="56" height="50" fill="#bcd7ea"/>
      <path d="M390 40l50 18v50c0 36-26 58-50 70-24-12-50-34-50-70V58z" fill="#0b5c8e"/><path d="M370 108l16 16 30-34" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  "column-d": {
    w: 500, h: 320,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="320" viewBox="0 0 500 320"><rect width="500" height="320" fill="#efe8f8"/>
      <rect x="110" y="212" width="290" height="44" rx="6" fill="#7a3fc2"/><rect x="130" y="166" width="250" height="46" rx="6" fill="#b48ae6"/><rect x="100" y="122" width="270" height="44" rx="6" fill="#4f2a85"/>
      <rect x="130" y="224" width="200" height="6" fill="#e9d8ff"/><rect x="150" y="180" width="160" height="6" fill="#fff"/><rect x="120" y="136" width="180" height="6" fill="#d9c2f5"/>
      <path d="M330 122v-70l24 16 24-16v70z" fill="#f08a5d"/></svg>`,
  },
};

const browser = await chromium.launch({ channel: "msedge" }); // other machines: drop the channel option
const page = await browser.newPage();
for (const [name, { w, h, svg }] of Object.entries(assets)) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
  const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
  await writeFile(path.join(out, `${name}.png`), png);
  console.log("wrote", `${name}.png`, `${w}x${h}`, `${Math.round(png.length / 1024)} KB`);
}
await browser.close();
