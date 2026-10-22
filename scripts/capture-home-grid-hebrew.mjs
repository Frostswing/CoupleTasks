/**
 * Home quick-action grid — Hebrew RTL dark at ~360dp and ~411dp widths.
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = "/opt/cursor/artifacts/screenshots";
mkdirSync(outDir, { recursive: true });
const distDir = path.join(root, "..", "dist");
const PORT = 8780;
const BASE = `http://127.0.0.1:${PORT}`;
const EMAIL = "cursor-coupletasks-e2e-primary@test.invalid";
const PASSWORD = "CursorE2E_CoupleTasks_2026!";

const envPath = path.join(root, "..", ".env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

async function startServer() {
  const proc = spawn(
    "python3",
    ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", distDir],
    { stdio: "pipe" }
  );
  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch(`${BASE}/`)).ok) return proc;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  proc.kill();
  throw new Error("server failed");
}

async function signIn(page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3000);
  const onHome = await page
    .getByText("פעולות מהירות", { exact: false })
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  if (onHome) return;
  const email = page.locator('input[placeholder*="mail"], input[placeholder*="Email"], input[placeholder*="דוא"]').first();
  if (await email.isVisible({ timeout: 10000 }).catch(() => false)) {
    await email.fill(EMAIL);
    await page.locator('input[placeholder*="assword"], input[placeholder*="סיסמה"]').first().fill(PASSWORD);
    await page
      .locator("div")
      .filter({ hasText: /^Sign In$|^התחבר$/ })
      .last()
      .click({ timeout: 10000 });
    await page.waitForTimeout(6000);
  }
}

async function captureViewport(browser, width, file) {
  const context = await browser.newContext({
    viewport: { width, height: 844 },
    colorScheme: "dark",
    locale: "he-IL",
  });
  await context.addInitScript(() => {
    localStorage.setItem("hasSelectedLanguage", "true");
    localStorage.setItem("userLanguage", "he");
    document.documentElement.setAttribute("dir", "rtl");
  });
  const page = await context.newPage();
  await signIn(page);
  await page.getByText("פעולות מהירות", { exact: false }).waitFor({ timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, file), fullPage: true });
  await context.close();
}

const server = await startServer();
const browser = await chromium.launch();
try {
  await captureViewport(browser, 360, "home-grid-hebrew-360-dark.png");
  await captureViewport(browser, 411, "home-grid-hebrew-411-dark.png");
  console.log("✓ home grid screenshots saved to", outDir);
} finally {
  server.kill();
  await browser.close();
}
