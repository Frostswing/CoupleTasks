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

const LIGHT_SCREENS = [
  { file: "after-home.png", drawer: "Home", wait: 2000 },
  { file: "after-daily-tasks-light.png", drawer: "Daily Tasks" },
  { file: "after-events-light.png", drawer: "Events" },
  { file: "after-shopping-list-light.png", drawer: "Shopping List", waitText: ["חלב", "Bread"] },
  { file: "after-inventory.png", drawer: "Inventory" },
  { file: "after-settings.png", drawer: "Settings" },
  { file: "after-sharing.png", drawer: "Sharing" },
  { file: "after-history.png", drawer: "History" },
  { file: "after-management-light.png", drawer: "Management" },
  { file: "after-shopping-mode-light.png", drawer: "Shopping Mode" },
  { file: "after-drawer.png", drawer: null },
];

const DARK_SCREENS = [
  { file: "after-dark-home.png", drawer: "Home" },
  { file: "after-daily-tasks-dark.png", drawer: "Daily Tasks" },
  { file: "after-events-dark.png", drawer: "Events" },
  { file: "after-dark-shopping.png", drawer: "Shopping List", waitText: ["חלב", "Bread"] },
  { file: "after-dark-inventory.png", drawer: "Inventory" },
  { file: "after-dark-settings.png", drawer: "Settings" },
  { file: "after-management-dark.png", drawer: "Management" },
  { file: "after-shopping-mode-dark.png", drawer: "Shopping Mode" },
];

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
  await page.mouse.click(28, 52);
  await page.waitForTimeout(600);
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

async function captureScreens(page, screens) {
  for (const shot of screens) {
    if (shot.drawer) {
      await navigateFromDrawer(page, shot.drawer);
    } else {
      await openDrawer(page);
      await page.waitForTimeout(800);
    }
    if (shot.waitText) {
      for (const t of shot.waitText) {
        await page.locator(`text=${t}`).first().waitFor({ timeout: 12000 }).catch(() => {});
      }
    }
    await page.waitForTimeout(shot.wait || 1000);
    await page.screenshot({ path: path.join(outDir, shot.file), fullPage: true });
    if (shot.drawer && shot.drawer !== "Home") {
      await page.goto(BASE, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
    }
  }
}

const browser = await chromium.launch();
const server = await startServer();

try {
  const lightContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "light",
  });
  const lightPage = await lightContext.newPage();
  await skipLanguageGate(lightPage);
  await signIn(lightPage);
  await captureScreens(lightPage, LIGHT_SCREENS);
  await lightContext.close();

  const darkContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "dark",
  });
  const darkPage = await darkContext.newPage();
  await skipLanguageGate(darkPage);
  await signIn(darkPage);
  await captureScreens(darkPage, DARK_SCREENS);
  await darkContext.close();

  const composite = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  const tiles = [
    "shopping-before-redesign.png",
    "after-shopping-list-light.png",
    "after-dark-shopping.png",
    "after-inventory.png",
    "after-settings.png",
    "after-sharing.png",
    "after-dark-settings.png",
    "after-daily-tasks-light.png",
    "after-daily-tasks-dark.png",
    "after-events-light.png",
    "after-events-dark.png",
    "after-history.png",
    "after-management.png",
    "after-home.png",
    "after-dark-home.png",
  ];
  const html = `<!DOCTYPE html><html><head><style>body{margin:0;background:#0a0a0a;color:#fff;font-family:system-ui}h1{padding:12px;font-size:18px}grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:8px}img{width:100%;border-radius:10px;border:1px solid #333}</style></head><body><h1>CoupleTasks UI — light &amp; dark</h1><grid>${tiles
    .map((f) => `<img src="file://${path.join(outDir, f)}" alt="${f}"/>`)
    .join("")}</grid></body></html>`;
  await composite.setContent(html);
  await composite.screenshot({
    path: path.join(outDir, "ui-redesign-composite.png"),
    fullPage: true,
  });

  console.log("Live app screenshots saved to", outDir);
} finally {
  server.kill("SIGTERM");
  await browser.close();
}
