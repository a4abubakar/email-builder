import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Start every test from a clean slate (saved doc and theme live in localStorage).
  await page.addInitScript(() => {
    // Also runs inside the sandboxed preview iframe, where storage access throws.
    try {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.clear();
        sessionStorage.setItem("seeded", "1");
      }
    } catch {
      /* sandboxed frame */
    }
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Quillmail/ })).toBeVisible();
});

test("build an email: starter, add CTA, edit, preview, mobile, export", async ({ page }) => {
  // 1. Load a starter in one click from the Templates menu.
  await page.getByRole("button", { name: "Templates" }).click();
  await page.getByRole("button", { name: /Welcome/ }).click();
  const frame = page.frameLocator('iframe[title="Email preview"]');
  await expect(frame.getByRole("heading", { level: 1, name: "Welcome to the Fernwood family" })).toBeVisible();

  // 2. Add a CTA block (inserted after the selected block, or at the end) and edit its label.
  const rowsBefore = await page.getByTestId("block-row").count();
  await page.getByRole("button", { name: "Add CTA button" }).click();
  await expect(page.getByTestId("block-row")).toHaveCount(rowsBefore + 1);
  const label = page.getByLabel("Button label");
  await label.fill("Claim my free service");

  // 3. The text shows up in the sandboxed preview iframe.
  await expect(frame.getByText("Claim my free service").first()).toBeVisible();
  await expect(page.locator('iframe[title="Email preview"]')).toHaveAttribute("sandbox", "");

  // 4. Switch to mobile width.
  await page.getByRole("button", { name: /Mobile 375px/ }).click();
  const iframe = page.getByTestId("preview-frame");
  await expect(iframe).toHaveAttribute("data-viewport", "mobile");
  const box = await iframe.boundingBox();
  expect(Math.round(box!.width)).toBe(375);
  await expect(frame.getByText("Claim my free service").first()).toBeVisible();

  // 5. Export: copy puts HTML containing the text on the clipboard and the Export tab shows it too.
  await page.getByRole("button", { name: "Copy HTML" }).click();
  await expect(page.getByTestId("notice")).toContainText(/Copied .* KB of HTML/);
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain("Claim my free service");
  expect(clipboard).toContain("<v:roundrect");
  expect(clipboard).toContain("<!--[if mso]>");

  await page.getByRole("tab", { name: "Export" }).click();
  await expect(page.getByLabel("HTML source")).toHaveValue(/Claim my free service/);
  await expect(page.getByTestId("size-badge")).toContainText(/\d+(\.\d)? KB/);

  // 6. Download .html
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download .html" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.html$/);
});

test("reorder with the keyboard-friendly buttons, duplicate, delete and undo", async ({ page }) => {
  const types = () => page.getByTestId("block-row").evaluateAll((els) => els.map((e) => e.getAttribute("data-block-type")));
  const initial = await types();
  expect(initial[0]).toBe("header");

  await page.getByRole("button", { name: "Move Header down" }).click();
  const after = await types();
  expect(after[1]).toBe("header");
  expect(after[0]).toBe(initial[1]);

  await page.getByRole("button", { name: "Duplicate Footer" }).click();
  expect((await types()).length).toBe(initial.length + 1);

  await page.getByRole("button", { name: "Delete Footer" }).last().click();
  expect((await types()).length).toBe(initial.length);

  await page.getByRole("button", { name: "Undo" }).click();
  expect((await types()).length).toBe(initial.length + 1);
});

test("document persists across reloads", async ({ page }) => {
  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByLabel("Preheader text").fill("Persisted preheader");
  await page.reload();
  await page.getByRole("tab", { name: "Settings" }).click();
  await expect(page.getByLabel("Preheader text")).toHaveValue("Persisted preheader");
});

test("dark mode preview and app theme toggle", async ({ page }) => {
  await page.getByRole("switch", { name: /Dark mode preview/ }).click();
  const frame = page.frameLocator('iframe[title="Email preview"]');
  const bg = await frame.locator("table.container").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe("rgb(28, 28, 30)");

  await page.getByRole("button", { name: /Colour theme/ }).click(); // system -> light
  await page.getByRole("button", { name: /Colour theme/ }).click(); // light -> dark
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("no horizontal scroll at 360px and panels are reachable", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Quillmail/ })).toBeVisible();
  for (const pane of ["Blocks", "Edit", "Preview"]) {
    await page.getByRole("navigation", { name: "Panels" }).getByRole("button", { name: pane }).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${pane} pane overflows horizontally`).toBeLessThanOrEqual(0);
  }
  await expect(page.getByRole("button", { name: "Copy HTML" })).toBeVisible();
});

test("keyboard drag-and-drop reorders blocks (dnd-kit keyboard sensor)", async ({ page }) => {
  const types = () => page.getByTestId("block-row").evaluateAll((els) => els.map((e) => e.getAttribute("data-block-type")));
  const before = await types();
  const handle = page.getByRole("button", { name: /Drag to reorder Header/ });
  await handle.focus();
  // dnd-kit measures droppables between key presses, so give each step a moment.
  await page.keyboard.press("Space");
  await page.waitForTimeout(250);
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(250);
  await page.keyboard.press("Space");
  await expect.poll(types).not.toEqual(before);
  const after = await types();
  expect(after[0]).toBe(before[1]);
  expect(after[1]).toBe("header");
});

test("loads without console errors or hydration warnings", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: /Quillmail/ })).toBeVisible();
  await page.getByRole("button", { name: "Add Footer" }).click();
  expect(errors).toEqual([]);
});
