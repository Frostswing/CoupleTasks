/**
 * Playwright screenshots against exported web build + real Firebase auth.
 */
import { chromium } from "playwright";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = "/opt/cursor/artifacts/screenshots";
const distDir = path.join(root, "..", "dist");
const PORT = 8765;
const BASE = `http://127.0.0.1:${PORT}`;

const envPath = path.join(root, "..", ".env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const EMAIL = "cursor-coupletasks-e2e-primary@test.invalid";
const PASSWORD = "CursorE2E_CoupleTasks_2026!";

async function startServer() {
  const proc = spawn(
    "python3",
    ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", distDir],
    { stdio: "pipe", cwd: path.join(root, "..") }
  );
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BASE}/`);
      if (res.ok) return proc;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  proc.kill();
  throw new Error("Static server failed to start");
}

async function skipLanguageGate(page) {
  await page.addInitScript(() => {
    localStorage.setItem("hasSelectedLanguage", JSON.stringify("true"));
    localStorage.setItem("userLanguage", JSON.stringify("en"));
  });
}

async function signIn(page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(2500);

  const email = page.locator('input[placeholder*="mail"], input[placeholder*="Email"], input[placeholder*="אימייל"]').first();
  const password = page.locator('input[placeholder*="assword"], input[placeholder*="סיסמה"]').first();

  if (await email.isVisible({ timeout: 8000 }).catch(() => false)) {
    await email.fill(EMAIL);
    await password.fill(PASSWORD);
    const signInBtn = page
      .locator("div")
      .filter({ hasText: /^Sign In$|^התחבר$/ })
      .last();
    await signInBtn.click({ timeout: 10000 });
    await page.waitForTimeout(6000);
    await page
      .getByText("Quick Access", { exact: false })
      .waitFor({ timeout: 20000 })
      .catch(() => {});
  }
}

async function openDrawer(page) {
  await page.waitForTimeout(500);
  const menuHit = page.locator("text=Quick Access").first();
  if (await menuHit.isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.mouse.click(28, 52);
    await page.waitForTimeout(600);
    return;
  }
  await page.mouse.click(28, 52);
  await page.waitForTimeout(600);
}

async function goHome(page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
}

async function clickByLabel(page, label) {
  await page.evaluate((text) => {
    const walk = (node) => {
      if (!node || node.nodeType !== 1) return null;
      const rect = node.getBoundingClientRect();
      const t = node.textContent?.trim() || "";
      if (
        rect.height >= 48 &&
        rect.width >= 200 &&
        t.includes(text) &&
        (node.getAttribute("role") === "button" ||
          node.onclick ||
          node.style?.cursor === "pointer" ||
          node.className?.includes?.("r-"))
      ) {
        return node;
      }
      for (const child of node.children) {
        const hit = walk(child);
        if (hit) return hit;
      }
      return null;
    };
    const target =
      walk(document.body) ||
      [...document.querySelectorAll("div")].find(
        (n) => n.textContent?.includes(text) && n.getBoundingClientRect().height > 50
      );
    target?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }, label);
  await page.waitForTimeout(2500);
}

async function navigateFromDrawer(page, label) {
  await openDrawer(page);
  await page.waitForTimeout(400);
  await page.evaluate((text) => {
    const nodes = [...document.querySelectorAll("div, span")];
    const hits = nodes.filter((n) => {
      const r = n.getBoundingClientRect();
      return (
        n.textContent?.trim() === text &&
        r.x < 300 &&
        r.width > 40 &&
        r.height > 10 &&
        r.y > 80
      );
    });
    const hit = hits[hits.length - 1] || hits[0];
    hit?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }, label);
  await page.waitForTimeout(2500);
  await page.mouse.click(320, 420);
  await page.waitForTimeout(600);
}

async function navigateTo(page, label) {
  await navigateFromDrawer(page, label);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  colorScheme: "light",
});
const page = await context.newPage();
await skipLanguageGate(page);

const server = await startServer();

try {
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(outDir, "after-auth.png"), fullPage: true });

  await signIn(page);

  await goHome(page);
  await page.screenshot({ path: path.join(outDir, "after-home.png"), fullPage: true });

  await navigateFromDrawer(page, "Daily Tasks");
  await page.screenshot({ path: path.join(outDir, "after-tasks.png"), fullPage: true });

  await goHome(page);
  await navigateFromDrawer(page, "Shopping List");
  await page
    .locator("text=חלב")
    .or(page.locator("text=Bread"))
    .first()
    .waitFor({ timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(outDir, "after-shopping.png"),
    fullPage: true,
  });
  await page.screenshot({
    path: path.join(outDir, "after-shopping-list-grouped.png"),
    fullPage: true,
  });

  await navigateFromDrawer(page, "Events");
  await page.screenshot({ path: path.join(outDir, "after-events.png"), fullPage: true });

  await openDrawer(page);
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, "after-drawer.png"), fullPage: true });

  await context.close();
  const darkContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "dark",
  });
  const darkPage = await darkContext.newPage();
  await skipLanguageGate(darkPage);
  await signIn(darkPage);
  await darkPage.screenshot({
    path: path.join(outDir, "after-dark-home.png"),
    fullPage: true,
  });
  await navigateFromDrawer(darkPage, "Shopping List");
  await darkPage.screenshot({
    path: path.join(outDir, "after-dark-shopping.png"),
    fullPage: true,
  });
  await darkContext.close();

  const composite = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const tiles = [
    "after-auth.png",
    "after-home.png",
    "after-tasks.png",
    "after-shopping-list-grouped.png",
    "after-events.png",
    "after-drawer.png",
    "after-dark-home.png",
  ];
  const html = `<!DOCTYPE html><html><body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px">${tiles
    .map(
      (f) =>
        `<img src="file://${path.join(outDir, f)}" style="width:100%;border-radius:8px"/>`
    )
    .join("")}</body></html>`;
  await composite.setContent(html);
  await composite.screenshot({
    path: path.join(outDir, "after-redesign-all-screens.png"),
    fullPage: true,
  });

  console.log("Live app screenshots saved to", outDir);
} finally {
  server.kill("SIGTERM");
  await browser.close();
}
