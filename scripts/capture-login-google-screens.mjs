/**
 * Light/dark screenshots of login screen showing Sign in with Google.
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
const PORT = 8772;
const BASE = `http://127.0.0.1:${PORT}`;
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

async function captureLogin(browser, theme, file) {
  const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: theme });
  await context.addInitScript(() => {
    localStorage.setItem("hasSelectedLanguage", "true");
    localStorage.setItem("userLanguage", "en");
    for (const key of Object.keys(localStorage)) {
      if (key.includes("firebase") || key.startsWith("firebase:")) {
        localStorage.removeItem(key);
      }
    }
    sessionStorage.clear();
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(2500);
  await page.getByText("Sign in with Google", { exact: false }).waitFor({ timeout: 20000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, file), fullPage: true });
  await context.close();
}

const browser = await chromium.launch();
const server = await startServer();
try {
  await captureLogin(browser, "light", "login-google-light.png");
  await captureLogin(browser, "dark", "login-google-dark.png");
  console.log("✓ login-google screenshots saved to", outDir);
} finally {
  server.kill();
  await browser.close();
}
