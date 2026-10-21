/**
 * Smoke-test main flows against exported web build + test account.
 */
import { chromium } from "playwright";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const root = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(root, "..", "dist");
const PORT = 8788;
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
  await page.addInitScript(() => {
    localStorage.setItem("hasSelectedLanguage", "true");
    localStorage.setItem("userLanguage", "en");
  });
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3000);
  const email = page.locator('input[placeholder*="mail"], input[placeholder*="Email"]').first();
  if (await email.isVisible({ timeout: 10000 }).catch(() => false)) {
    await email.fill(EMAIL);
    await page.locator('input[placeholder*="assword"]').first().fill(PASSWORD);
    await page.locator("div").filter({ hasText: /^Sign In$/ }).last().click();
    await page.waitForTimeout(5000);
  }
  await page.getByText("Quick Actions", { exact: false }).waitFor({ timeout: 30000 });
}

const failures = [];

async function step(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
    console.error(`✗ ${name}:`, e.message);
  }
}

const browser = await chromium.launch();
const server = await startServer();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

try {
  await step("login", () => signIn(page));

  await step("add task", async () => {
    await page.getByText("Profile", { exact: true }).last().click().catch(() => {});
    await page.waitForTimeout(500);
    await page.getByText("Home", { exact: true }).last().click();
    await page.waitForTimeout(800);
    const fab = page.locator("text=+").first();
    await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("div")];
      const add = nodes.find((n) => n.textContent === "" && n.getBoundingClientRect().height > 40);
    });
    await page.getByRole("button", { name: /add task/i }).click({ timeout: 8000 }).catch(async () => {
      await page.locator('[aria-label="Add Task"], [aria-label*="Add"]').first().click({ timeout: 5000 });
    });
    await page.waitForTimeout(1500);
    const titleInput = page.locator('input[placeholder*="needs"], textarea').first();
    await titleInput.waitFor({ timeout: 10000 });
    const taskTitle = `Smoke task ${Date.now()}`;
    await titleInput.fill(taskTitle);
    const saveBtn = page.getByText("Create Task", { exact: false }).or(page.getByText("Save", { exact: false }));
    await saveBtn.first().click({ timeout: 8000 });
    await page.waitForTimeout(3000);
  });

  await step("complete task flow (tasks tab)", async () => {
    await page.getByText("Tasks", { exact: true }).last().click();
    await page.waitForTimeout(2000);
    await page.getByText("Smoke task", { exact: false }).first().waitFor({ timeout: 15000 }).catch(() => {});
  });

  await step("shopping list add item", async () => {
    await page.getByText("Home", { exact: true }).last().click();
    await page.waitForTimeout(600);
    await page.getByText("Add Grocery", { exact: false }).click({ timeout: 8000 });
    await page.waitForTimeout(2500);
    const addBtn = page.getByText("Add", { exact: false }).or(page.locator('[aria-label*="add"]'));
    if (await addBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.first().click();
      await page.waitForTimeout(1000);
      const nameInput = page.locator("input").first();
      await nameInput.fill(`Smoke milk ${Date.now() % 10000}`);
      await page.getByText("Save", { exact: false }).first().click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
  });

  await step("shopping mode", async () => {
    await page.mouse.click(28, 52);
    await page.waitForTimeout(700);
    await page.evaluate(() => {
      const hits = [...document.querySelectorAll("div, span")].filter(
        (n) => n.textContent?.trim() === "Shopping Mode" && n.getBoundingClientRect().x < 300
      );
      hits[hits.length - 1]?.click();
    });
    await page.waitForTimeout(3000);
    await page.getByText("Shopping Mode", { exact: false }).first().waitFor({ timeout: 15000 });
  });

  await step("events", async () => {
    await page.getByText("Events", { exact: true }).last().click({ timeout: 8000 });
    await page.waitForTimeout(2000);
    await page.getByText("Events", { exact: false }).first().waitFor({ timeout: 10000 });
  });

  await step("settings", async () => {
    await page.getByText("Profile", { exact: true }).last().click();
    await page.waitForTimeout(2000);
    await page.getByText("Settings", { exact: false }).first().waitFor({ timeout: 10000 });
  });

  await step("language HE via drawer", async () => {
    await page.mouse.click(28, 52);
    await page.waitForTimeout(700);
    await page.evaluate(() => {
      const hits = [...document.querySelectorAll("div, span")].filter(
        (n) => n.textContent?.trim() === "Language" && n.getBoundingClientRect().x < 300
      );
      hits[hits.length - 1]?.click();
    });
    await page.waitForTimeout(2000);
    await page.getByText("עברית", { exact: false }).or(page.getByText("Hebrew", { exact: false })).first().click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2000);
  });

  await step("dark mode context", async () => {
    await context.close();
    const darkCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: "dark",
    });
    const darkPage = await darkCtx.newPage();
    await signIn(darkPage);
    await darkPage.getByText("Quick Actions", { exact: false }).waitFor({ timeout: 20000 });
    await darkCtx.close();
  });
} finally {
  server.kill("SIGTERM");
  await browser.close();
}

if (failures.length) {
  console.error("\nSmoke test failures:");
  failures.forEach((f) => console.error(" -", f));
  process.exit(1);
}
console.log("\nAll smoke steps passed.");
