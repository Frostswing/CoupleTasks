/**
 * Targeted light/dark screenshots: Home, Shopping Mode, Login, Register, Language.
 * Uses isolated browser contexts so language-gate init scripts do not leak.
 */
import { chromium } from "playwright";
import { readFileSync, statSync } from "fs";
import { createHash } from "crypto";
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

const VIEWPORT = { width: 390, height: 844 };

function md5(filePath) {
  const buf = readFileSync(filePath);
  return createHash("md5").update(buf).digest("hex");
}

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

/** Match AsyncStorage values used by the app (plain strings, not JSON-wrapped). */
function installLanguageDoneInitScript(context) {
  return context.addInitScript(() => {
    localStorage.setItem("hasSelectedLanguage", "true");
    localStorage.setItem("userLanguage", "en");
  });
}

function installLanguageGateInitScript(context) {
  return context.addInitScript(() => {
    localStorage.removeItem("hasSelectedLanguage");
    localStorage.setItem("userLanguage", "en");
  });
}

async function waitForHome(page) {
  await page
    .getByText("Quick Access", { exact: false })
    .waitFor({ timeout: 25000 })
    .catch(() => page.getByText("Focus", { exact: false }).waitFor({ timeout: 15000 }));
  await page.waitForTimeout(800);
}

async function signInOnPage(page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3000);

  const email = page
    .locator('input[placeholder*="mail"], input[placeholder*="Email"], input[placeholder*="אימייל"]')
    .first();
  const password = page
    .locator('input[placeholder*="assword"], input[placeholder*="סיסמה"]')
    .first();

  if (await email.isVisible({ timeout: 10000 }).catch(() => false)) {
    await email.fill(EMAIL);
    await password.fill(PASSWORD);
    await page
      .locator("div")
      .filter({ hasText: /^Sign In$|^התחבר$/ })
      .last()
      .click({ timeout: 10000 });
    await page.waitForTimeout(5000);
  }

  await waitForHome(page);
}

async function openDrawer(page, label) {
  await page.mouse.click(28, 52);
  await page.waitForTimeout(600);
  await page.evaluate((text) => {
    const nodes = [...document.querySelectorAll("div, span")];
    const hits = nodes.filter((n) => {
      const r = n.getBoundingClientRect();
      return (
        n.textContent?.trim() === text &&
        r.x < 320 &&
        r.width > 40 &&
        r.height > 8 &&
        r.y > 80
      );
    });
    const hit = hits[hits.length - 1] || hits[0];
    hit?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }, label);
  await page.waitForTimeout(2800);
  await page.mouse.click(320, 420);
  await page.waitForTimeout(500);
}

/** Mark a few pending items as in-cart for Shopping Mode hero progress. */
async function seedShoppingModeCart(page) {
  await page
    .getByText("Shopping Mode", { exact: false })
    .first()
    .waitFor({ timeout: 15000 })
    .catch(() => {});

  const checks = page.locator('[aria-role="checkbox"], [role="checkbox"]');
  const count = await checks.count();
  const toToggle = Math.min(count, 3);
  for (let i = 0; i < toToggle; i++) {
    await checks.nth(i).click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(350);
  }
  await page.waitForTimeout(600);
}

async function captureLanguage(browser, theme, file) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: theme,
  });
  await installLanguageGateInitScript(context);
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3000);
  await page
    .getByText("Choose your preferred language", { exact: false })
    .waitFor({ timeout: 15000 })
    .catch(() => page.getByText("בחר את השפה", { exact: false }).waitFor({ timeout: 10000 }).catch(() => {}));
  await page.screenshot({ path: path.join(outDir, file), fullPage: true });
  await context.close();
}

async function captureAuth(browser, theme, mode, file) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: theme,
  });
  await installLanguageDoneInitScript(context);
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.includes("firebase") || key.startsWith("firebase:")) {
        localStorage.removeItem(key);
      }
    }
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  const email = page.locator('input[placeholder*="mail"], input[placeholder*="Email"]').first();
  await email.waitFor({ timeout: 20000 });

  if (mode === "register") {
    await page.getByText("Create Account", { exact: false }).first().click({ timeout: 8000 });
    await page.waitForTimeout(1000);
    await page.getByText("Sign Up", { exact: false }).first().waitFor({ timeout: 8000 }).catch(() => {});
  }

  await page.screenshot({ path: path.join(outDir, file), fullPage: true });
  await context.close();
}

async function captureAuthedScreens(browser, theme) {
  const suffix = theme === "dark" ? "dark" : "light";
  const context = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: theme,
  });
  await installLanguageDoneInitScript(context);
  const page = await context.newPage();

  await signInOnPage(page);
  await page.screenshot({ path: path.join(outDir, `parity-home-${suffix}.png`), fullPage: true });

  await openDrawer(page, "Shopping Mode");
  await seedShoppingModeCart(page);
  await page.screenshot({
    path: path.join(outDir, `parity-shopping-mode-${suffix}.png`),
    fullPage: true,
  });

  await context.close();
}

async function runTheme(browser, theme) {
  const suffix = theme === "dark" ? "dark" : "light";
  await captureLanguage(browser, theme, `parity-language-${suffix}.png`);
  await captureAuth(browser, theme, "login", `parity-login-${suffix}.png`);
  await captureAuth(browser, theme, "register", `parity-register-${suffix}.png`);
  await captureAuthedScreens(browser, theme);
}

function verifyArtifacts() {
  const files = [
    "parity-home-light.png",
    "parity-home-dark.png",
    "parity-shopping-mode-light.png",
    "parity-shopping-mode-dark.png",
    "parity-language-light.png",
    "parity-language-dark.png",
    "parity-login-light.png",
    "parity-login-dark.png",
    "parity-register-light.png",
    "parity-register-dark.png",
  ].map((f) => path.join(outDir, f));

  const hashes = {};
  const sizes = {};
  for (const f of files) {
    hashes[f] = md5(f);
    sizes[f] = statSync(f).size;
  }

  const homeLight = hashes[path.join(outDir, "parity-home-light.png")];
  const langLight = hashes[path.join(outDir, "parity-language-light.png")];
  const modeLight = hashes[path.join(outDir, "parity-shopping-mode-light.png")];

  if (homeLight === langLight) {
    throw new Error("parity-home-light.png is identical to parity-language-light.png");
  }
  if (modeLight === langLight) {
    throw new Error("parity-shopping-mode-light.png is identical to parity-language-light.png");
  }
  if (homeLight === modeLight) {
    throw new Error("parity-home-light.png is identical to parity-shopping-mode-light.png");
  }

  console.log("Verification OK — distinct captures:");
  for (const f of files) {
    console.log(`  ${path.basename(f)}  ${sizes[f]} bytes  md5=${hashes[f].slice(0, 8)}…`);
  }
}

const browser = await chromium.launch();
const server = await startServer();
try {
  await runTheme(browser, "light");
  await runTheme(browser, "dark");
  verifyArtifacts();
  console.log("Parity screenshots saved to", outDir);
} finally {
  server.kill("SIGTERM");
  await browser.close();
}
