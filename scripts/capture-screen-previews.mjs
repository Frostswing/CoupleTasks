import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const root = path.dirname(fileURLToPath(import.meta.url));
const html = path.join(root, "ui-previews/redesign-screens.html");
const outDir = "/opt/cursor/artifacts/screenshots";

const screens = ["auth", "home", "tasks", "shopping", "events", "drawer"];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto(`file://${html}`);
await page.waitForTimeout(300);

await page.screenshot({
  path: path.join(outDir, "after-redesign-all-screens.png"),
  fullPage: true,
});

for (const id of screens) {
  const el = page.locator(`#${id}`);
  await el.screenshot({ path: path.join(outDir, `after-${id}.png`) });
}

await browser.close();
console.log("Saved screenshots to", outDir);
