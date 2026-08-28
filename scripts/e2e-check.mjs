import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const playwrightModule = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = require(playwrightModule);

const baseUrl = process.env.SITE_URL || "http://127.0.0.1:8642";
const outputDir = path.resolve(process.env.E2E_OUTPUT_DIR || "../审查报告/e2e-latest");
const executablePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const routes = [
  ["index.html", ".hero-title"],
  ["timeline.html", "#timeline-body"],
  ["gallery.html", "#photo-sphere"],
  ["stages.html", "#stages-body"],
  ["birthday.html", "#birthday-body"],
  ["wall.html", "#message-wall"],
  ["about.html", ".about-sec"],
  ["review.html#admin", "#review-login"]
];

fs.mkdirSync(outputDir, { recursive: true });
const results = [];

async function mockCloud(page) {
  await page.route("https://*.supabase.co/**", async (route) => {
    const request = route.request();
    const url = request.url();
    if (url.includes("/auth/v1/")) {
      return route.fulfill({ status: 401, contentType: "application/json", body: '{"msg":"e2e mock"}' });
    }
    if (url.includes("/rest/v1/")) {
      const headers = url.includes("site_visits") ? { "content-range": "0-0/0" } : {};
      return route.fulfill({ status: 200, headers, contentType: "application/json", body: "[]" });
    }
    return route.fulfill({ status: 204, body: "" });
  });
}

async function verifyRoute(browser, deviceName, viewport, routeName, selector) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript(() => localStorage.setItem("xl_gate_passed", "1"));
  const page = await context.newPage();
  const errors = [];
  const badResponses = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("response", (response) => {
    if (response.status() >= 400 && response.url().startsWith(baseUrl)) {
      badResponses.push(response.status() + " " + response.url());
    }
  });
  await mockCloud(page);
  const url = baseUrl + "/" + routeName;
  let ok = true;
  let failure = "";
  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator(selector).waitFor({ state: "visible", timeout: 10000 });
    if (await page.locator(".gate").count()) throw new Error("进站验证层未被测试预置绕过");
    if (routeName.startsWith("index")) {
      await page.locator("#quote-btn").click();
      await page.locator("#quote-text").waitFor({ state: "visible" });
    }
    if (routeName.startsWith("timeline")) {
      await page.locator("#tl-collapsed-open").click();
      await page.locator("#tl-expand").waitFor({ state: "visible" });
    }
    if (routeName.startsWith("gallery")) {
      await page.evaluate(() => window.GalleryBoard && window.GalleryBoard.open());
      await page.locator("#gallery-board").waitFor({ state: "visible" });
      await page.locator("#gallery-board-close").click();
    }
    if (routeName.startsWith("wall")) {
      await page.locator("#tab-suggestion").click();
      await page.locator("#suggestion-panel").waitFor({ state: "visible" });
    }
    if (routeName.startsWith("review")) {
      await page.locator("#review-enter").click();
      await page.locator(".admin-auth-card").waitFor({ state: "visible" });
      if (await page.locator("#review-code, #admin-code").count()) throw new Error("仍存在旧明文口令输入框");
      await page.locator("[data-cancel]").click();
    }
    if (viewport.width <= 390) {
      await page.locator("#nav-toggle").click();
      await page.locator("#nav-links.open").waitFor({ state: "visible" });
    }
    if (errors.length || badResponses.length) throw new Error([...errors, ...badResponses].join(" | "));
    await page.screenshot({ path: path.join(outputDir, deviceName + "-" + routeName.split("#")[0].replace(".html", "") + ".png"), fullPage: true });
  } catch (error) {
    ok = false;
    failure = error && error.message ? error.message : String(error);
  }
  results.push({ device: deviceName, route: routeName, ok, failure, errors, badResponses });
  await context.close();
}

const browser = await chromium.launch({ headless: true, executablePath });
try {
  for (const [routeName, selector] of routes) {
    await verifyRoute(browser, "desktop", { width: 1280, height: 900 }, routeName, selector);
  }
  for (const [routeName, selector] of routes) {
    await verifyRoute(browser, "mobile", { width: 390, height: 844 }, routeName, selector);
  }
} finally {
  await browser.close();
}

const summary = {
  checkedAt: new Date().toISOString(),
  baseUrl,
  passed: results.filter((item) => item.ok).length,
  failed: results.filter((item) => !item.ok).length,
  results
};
fs.writeFileSync(path.join(outputDir, "results.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (summary.failed) process.exitCode = 1;
