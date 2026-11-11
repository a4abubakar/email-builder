// Captures the README screenshots against a running dev server (npm run dev, port 3003).
// Usage: npm run screenshots   (uses Microsoft Edge; on other machines drop the `channel` option)
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3003";
const out = path.resolve("docs/screenshots");
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ channel: "msedge" });

async function shoot(name, { theme, viewport, setup }) {
  const context = await browser.newContext({
    viewport,
    colorScheme: theme,
    deviceScaleFactor: 1,
    isMobile: viewport.width < 600,
    hasTouch: viewport.width < 600,
  });
  const page = await context.newPage();
  await page.addInitScript((t) => {
    localStorage.clear();
    localStorage.setItem("eb-theme", t);
  }, theme);
  await page.goto(BASE);
  await page.getByRole("heading", { level: 1, name: /Quillmail/ }).waitFor();
  await page.waitForTimeout(600); // let the preview iframe paint its images
  if (setup) await setup(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log("wrote", name);
  await context.close();
}

await shoot("desktop-light", {
  theme: "light",
  viewport: { width: 1440, height: 900 },
  setup: async (page) => {
    await page.getByRole("button", { name: /Edit CTA button/ }).click();
  },
});

await shoot("desktop-dark", {
  theme: "dark",
  viewport: { width: 1440, height: 900 },
  setup: async (page) => {
    await page.getByRole("switch", { name: /Dark mode preview/ }).click();
    await page.getByRole("button", { name: /Edit Hero banner/ }).click();
  },
});

await shoot("desktop-export", {
  theme: "light",
  viewport: { width: 1440, height: 900 },
  setup: async (page) => {
    await page.getByRole("button", { name: "Templates" }).click();
    await page.getByRole("button", { name: /Newsletter/ }).click();
    await page.getByRole("button", { name: /Mobile 375px/ }).click();
    await page.getByRole("tab", { name: "Export" }).click();
  },
});

await shoot("mobile-light", {
  theme: "light",
  viewport: { width: 390, height: 844 },
  setup: async (page) => {
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await page.getByRole("button", { name: /Mobile 375px/ }).click();
  },
});

await shoot("mobile-dark", {
  theme: "dark",
  viewport: { width: 390, height: 844 },
  setup: async (page) => {
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await page.getByRole("button", { name: /Mobile 375px/ }).click();
    await page.getByRole("switch", { name: /Dark mode preview/ }).click();
  },
});

await browser.close();
