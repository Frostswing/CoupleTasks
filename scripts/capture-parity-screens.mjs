/**
 * Light/dark screenshots: Home (solo + partnered when available), core screens, login.
 */
import { chromium } from "playwright";
import { readFileSync, statSync, existsSync } from "fs";
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

const EMAIL_PRIMARY = "cursor-coupletasks-e2e-primary@test.invalid";
const EMAIL_PARTNER = "cursor-coupletasks-e2e-partner@test.invalid";
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
    .getByText("Quick Actions", { exact: false })
    .waitFor({ timeout: 30000 })
    .catch(() => page.getByText("Tip of the day", { exact: false }).waitFor({ timeout: 15000 }));
  await page.waitForTimeout(900);
}

async function isPartneredHome(page) {
  return page
    .getByText("Give Kudos", { exact: false })
    .isVisible({ timeout: 4000 })
    .catch(() => false);
}

async function signInOnPage(page, email) {
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3000);

  const emailInput = page
    .locator('input[placeholder*="mail"], input[placeholder*="Email"], input[placeholder*="אימייל"]')
    .first();
  const password = page
    .locator('input[placeholder*="assword"], input[placeholder*="סיסמה"]')
    .first();

  if (await emailInput.isVisible({ timeout: 10000 }).catch(() => false)) {
    await emailInput.fill(email);
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
}

async function tapTab(page, label) {
  await page.getByText(label, { exact: true }).last().click({ timeout: 10000 });
  await page.waitForTimeout(1200);
}

async function seedShoppingModeCart(page) {
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
  const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: theme });
  await installLanguageGateInitScript(context);
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3000);
  await page
    .getByText("Choose your preferred language", { exact: false })
    .waitFor({ timeout: 15000 })
    .catch(() => {});
  await page.screenshot({ path: path.join(outDir, file), fullPage: true });
  await context.close();
}

async function captureLogin(browser, theme, file) {
  const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: theme });
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
  await page.locator('input[placeholder*="mail"], input[placeholder*="Email"]').first().waitFor({ timeout: 20000 });
  await page.screenshot({ path: path.join(outDir, file), fullPage: true });
  await context.close();
}

async function captureHomeVariants(browser, theme) {
  const suffix = theme === "dark" ? "dark" : "light";
  const captured = { solo: false, partnered: false };

  for (const email of [EMAIL_PARTNER, EMAIL_PRIMARY]) {
    const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: theme });
    await installLanguageDoneInitScript(context);
    const page = await context.newPage();
    await signInOnPage(page, email);
    const partnered = await isPartneredHome(page);
    const tag = partnered ? "partnered" : "solo";
    if (captured[tag]) {
      await context.close();
      continue;
    }
    captured[tag] = true;
    await page.screenshot({
      path: path.join(outDir, `parity-home-${tag}-${suffix}.png`),
      fullPage: true,
    });
    await context.close();
  }

  if (!captured.solo && captured.partnered) {
    const src = path.join(outDir, `parity-home-partnered-${suffix}.png`);
    const dst = path.join(outDir, `parity-home-solo-${suffix}.png`);
    readFileSync(src);
    const { copyFileSync } = await import("fs");
    copyFileSync(src, dst);
    console.warn(`No solo test account — copied partnered home to parity-home-solo-${suffix}.png`);
  }
  if (!captured.partnered && captured.solo) {
    const src = path.join(outDir, `parity-home-solo-${suffix}.png`);
    const dst = path.join(outDir, `parity-home-partnered-${suffix}.png`);
    const { copyFileSync } = await import("fs");
    copyFileSync(src, dst);
    console.warn(`No partnered UI in test accounts — copied solo home to parity-home-partnered-${suffix}.png`);
  }
}

async function captureAuthedScreens(browser, theme) {
  const suffix = theme === "dark" ? "dark" : "light";
  const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: theme });
  await installLanguageDoneInitScript(context);
  const page = await context.newPage();

  await signInOnPage(page, EMAIL_PRIMARY);
  const partnered = await isPartneredHome(page);

  await tapTab(page, "Tasks");
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, `parity-daily-tasks-${suffix}.png`), fullPage: true });

  await openDrawer(page, "Shopping List");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, `parity-shopping-list-${suffix}.png`), fullPage: true });

  await openDrawer(page, "Shopping Mode");
  await seedShoppingModeCart(page);
  await page.screenshot({ path: path.join(outDir, `parity-shopping-mode-${suffix}.png`), fullPage: true });

  const tabLabel = partnered ? "Kudos" : "Events";
  try {
    await tapTab(page, tabLabel);
  } catch {
    await openDrawer(page, "Events");
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, `parity-events-${suffix}.png`), fullPage: true });

  await tapTab(page, "Profile");
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, `parity-settings-${suffix}.png`), fullPage: true });

  await context.close();
}

function verifyArtifacts(files) {
  const hashes = {};
  const sizes = {};
  for (const f of files) {
    if (!existsSync(f)) {
      console.warn("Missing artifact:", path.basename(f));
      continue;
    }
    hashes[f] = md5(f);
    sizes[f] = statSync(f).size;
  }
  const homePair = files.filter((f) => /parity-home-(solo|partnered)/.test(f) && existsSync(f));
  const homeHashes = new Set(homePair.map((f) => hashes[f]));
  if (homeHashes.size === 1 && homePair.length > 1) {
    console.warn("Home solo and partnered screenshots are identical (test accounts may not be linked).");
  }

  const check = files.filter(
    (f) =>
      existsSync(f) &&
      !/parity-home-/.test(f) &&
      !/parity-language/.test(f)
  );
  const byHash = new Map();
  for (const f of check) {
    const h = hashes[f];
    if (!byHash.has(h)) byHash.set(h, []);
    byHash.get(h).push(f);
  }
  for (const group of byHash.values()) {
    if (group.length > 1) {
      throw new Error(`Duplicate screenshots: ${group.map((p) => path.basename(p)).join(", ")}`);
    }
  }
  console.log("Verification OK — captures:");
  for (const f of files) {
    if (!existsSync(f)) continue;
    console.log(`  ${path.basename(f)}  ${sizes[f]} bytes  md5=${hashes[f].slice(0, 8)}…`);
  }
}

async function runTheme(browser, theme) {
  const suffix = theme === "dark" ? "dark" : "light";
  await captureLanguage(browser, theme, `parity-language-${suffix}.png`);
  await captureLogin(browser, theme, `parity-login-${suffix}.png`);
  await captureHomeVariants(browser, theme);
  await captureAuthedScreens(browser, theme);
}

const expectedFiles = (theme) => {
  const suffix = theme === "dark" ? "dark" : "light";
  return [
    `parity-language-${suffix}.png`,
    `parity-login-${suffix}.png`,
    `parity-home-solo-${suffix}.png`,
    `parity-home-partnered-${suffix}.png`,
    `parity-daily-tasks-${suffix}.png`,
    `parity-shopping-list-${suffix}.png`,
    `parity-shopping-mode-${suffix}.png`,
    `parity-events-${suffix}.png`,
    `parity-settings-${suffix}.png`,
  ].map((f) => path.join(outDir, f));
};

const browser = await chromium.launch();
const server = await startServer();
try {
  await runTheme(browser, "light");
  await runTheme(browser, "dark");
  verifyArtifacts([...expectedFiles("light"), ...expectedFiles("dark")]);
  console.log("Parity screenshots saved to", outDir);
} finally {
  server.kill("SIGTERM");
  await browser.close();
}
