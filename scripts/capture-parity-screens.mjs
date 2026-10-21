/**
 * Targeted light/dark screenshots: Home, Shopping Mode, Login, Register, Language.
 */
import { chromium } from "playwright";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = "/opt/cursor/artifacts/screenshots";
const distDir = path.join(root, "..", "dist");
const PORT = 8766;
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

async function signIn(page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(2000);
  const email = page.locator('input[placeholder*="mail"], input[placeholder*="Email"]').first();
  if (await email.isVisible({ timeout: 5000 }).catch(() => false)) {
    await email.fill(EMAIL);
    await page.locator('input[placeholder*="assword"]').first().fill(PASSWORD);
    await page.locator("div").filter({ hasText: /^Sign In$|^התחבר$/ }).last().click();
    await page.waitForTimeout(5000);
  }
}

async function openDrawer(page, label) {
  await page.mouse.click(28, 52);
  await page.waitForTimeout(500);
  await page.evaluate((text) => {
    const nodes = [...document.querySelectorAll("div, span")];
    const hit = nodes.find((n) => n.textContent?.trim() === text && n.getBoundingClientRect().x < 300);
    hit?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }, label);
  await page.waitForTimeout(2500);
}

async function captureAuth(page, mode, file) {
  await page.addInitScript(() => {
    localStorage.setItem("hasSelectedLanguage", JSON.stringify("true"));
    localStorage.setItem("userLanguage", JSON.stringify("en"));
  });
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  if (mode === "register") {
    const link = page.getByText("Create Account", { exact: false }).first();
    await link.click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: path.join(outDir, file), fullPage: true });
}

async function captureLanguage(page, file) {
  await page.addInitScript(() => {
    localStorage.removeItem("hasSelectedLanguage");
    localStorage.setItem("userLanguage", JSON.stringify("en"));
  });
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(outDir, file), fullPage: true });
}

async function runTheme(theme) {
  const suffix = theme === "dark" ? "dark" : "light";
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: theme,
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("hasSelectedLanguage", JSON.stringify("true"));
    localStorage.setItem("userLanguage", JSON.stringify("en"));
  });

  await captureAuth(page, "login", `parity-login-${suffix}.png`);
  await captureAuth(page, "register", `parity-register-${suffix}.png`);
  await captureLanguage(page, `parity-language-${suffix}.png`);

  await signIn(page);
  await page.screenshot({ path: path.join(outDir, `parity-home-${suffix}.png`), fullPage: true });
  await openDrawer(page, "Shopping Mode");
  await page.screenshot({ path: path.join(outDir, `parity-shopping-mode-${suffix}.png`), fullPage: true });

  await context.close();
}

const browser = await chromium.launch();
const server = await startServer();
try {
  await runTheme("light");
  await runTheme("dark");
  console.log("Parity screenshots saved to", outDir);
} finally {
  server.kill("SIGTERM");
  await browser.close();
}
