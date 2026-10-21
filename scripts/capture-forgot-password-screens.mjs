/**
 * Light/dark screenshots: Forgot Password form + success state (web export).
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
const PORT = 8771;
const BASE = `http://127.0.0.1:${PORT}`;
const EMAIL = "cursor-coupletasks-e2e-primary@test.invalid";
const VIEWPORT = { width: 390, height: 844 };

const envPath = path.join(root, "..", ".env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

async function startServer() {
  const proc = spawn(
    "python3",
    ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", distDir],
    { stdio: "pipe", cwd: path.join(root, "..") }
  );
  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch(`${BASE}/`)).ok) return proc;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  proc.kill();
  throw new Error("Static server failed to start");
}

function installInitScript(context) {
  return context.addInitScript(() => {
    localStorage.setItem("hasSelectedLanguage", "true");
    localStorage.setItem("userLanguage", "en");
    for (const key of Object.keys(localStorage)) {
      if (key.includes("firebase") || key.startsWith("firebase:")) {
        localStorage.removeItem(key);
      }
    }
    sessionStorage.clear();
  });
}

async function openForgotPasswordForm(page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(2500);
  const emailInput = page.locator('input[placeholder*="mail"], input[placeholder*="Email"]').first();
  await emailInput.waitFor({ timeout: 20000 });
  await emailInput.fill(EMAIL);
  await page.getByText("Forgot Password?", { exact: false }).click({ timeout: 10000 });
  await page.getByText("Send reset link", { exact: false }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(800);
}

async function captureForm(browser, theme, file) {
  const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: theme });
  await installInitScript(context);
  const page = await context.newPage();
  await openForgotPasswordForm(page);
  await page.screenshot({ path: path.join(outDir, file), fullPage: true });
  await context.close();
}

async function captureSuccess(browser, theme, file) {
  const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: theme });
  await installInitScript(context);
  const page = await context.newPage();
  await openForgotPasswordForm(page);
  await page.getByText("Send reset link", { exact: false }).click({ timeout: 10000 });
  await page.getByText("Check your inbox", { exact: false }).waitFor({ timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, file), fullPage: true });
  await context.close();
}

const browser = await chromium.launch();
const server = await startServer();

try {
  await captureForm(browser, "light", "forgot-password-light.png");
  await captureForm(browser, "dark", "forgot-password-dark.png");
  await captureSuccess(browser, "light", "forgot-password-success-light.png");
  await captureSuccess(browser, "dark", "forgot-password-success-dark.png");
  console.log("✓ forgot-password screenshots saved to", outDir);
} finally {
  server.kill();
  await browser.close();
}
