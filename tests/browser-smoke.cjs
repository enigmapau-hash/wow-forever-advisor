"use strict";
const { chromium } = require("playwright");
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const types = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json",
  ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const server = http.createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const file = path.resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try {
    res.setHeader("Content-Type", types[path.extname(file)] || "text/plain");
    res.end(await fs.readFile(file));
  } catch { res.writeHead(404).end(); }
});

(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = process.env.TEST_BASE_URL || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || undefined });
  try {
    const context = await browser.newContext();
    // External artwork is irrelevant to content and offline correctness.
    await context.route("https://wow.zamimg.com/**", (route) => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const [suite, button, report] of [
      ["talent-advisor", "run-talent-tests", "talent-test-report"],
      ["race-advisor", "run-tests", "test-report"],
      ["profession-advisor", "run-tests", "test-report"],
    ]) {
      await page.goto(`${base}/tests/${suite}.html`);
      await page.locator("#" + button).click();
      await page.waitForFunction((id) => /^(OK|ERROR):/.test(document.getElementById(id).textContent), report);
      const result = await page.locator("#" + report).textContent();
      assert.match(result, /^OK:/, result);
      console.log(suite + ": " + result);
    }
    await page.goto(base + "/");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
      }
    });
    const catalog = await page.evaluate(async () => (await fetch("./data/talent-advisor-catalog.json")).json());
    const cacheNames = await page.evaluate(() => caches.keys());
    assert(cacheNames.some((name) => name.endsWith(":v16")), "Current version cache installed");
    await context.setOffline(true);
    await page.reload();
    await page.locator("#talent-advisor").click();
    await page.locator("#talent-class button").first().waitFor();
    let offline = 0;
    for (const entry of catalog.clases) {
      await page.locator(`#talent-class button[data-value="${entry.nombre}"]`).click();
      const specs = await page.locator("#talent-spec button").evaluateAll((buttons) => buttons.map((b) => b.dataset.value));
      for (const spec of specs) {
        await page.locator(`#talent-spec button[data-value="${spec}"]`).click();
        for (const goal of catalog.objetivos) {
          await page.locator(`#talent-goal button[data-value="${goal}"]`).click();
          assert.equal(await page.locator("#talent-result").isVisible(), true);
          assert.match(await page.locator("#talent-build-info").textContent(), new RegExp(entry.nombre));
          offline++;
        }
      }
    }
    assert.equal(offline, 81);
    console.log("Offline reload: 81/81 records; shared Legacy available");
    await context.setOffline(false);
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No horizontal overflow on mobile");
    const first = page.locator("#talent-class button").first();
    await first.focus();
    await page.keyboard.press("Enter");
    assert.equal(await first.getAttribute("aria-pressed"), "true");
    assert.equal(await page.locator("#talent-result").isVisible(), false);
    console.log("Mobile layout and keyboard class selection: OK");
    assert.deepEqual(errors, [], "No uncaught JavaScript errors");
    await context.close();

    const retry = await browser.newContext({ serviceWorkers: "block" });
    await retry.route("https://wow.zamimg.com/**", (route) => route.abort());
    let fail = true;
    await retry.route("**/data/talent-advisor-priest.json", (route) => fail
      ? route.fulfill({ contentType: "application/json", body: "{}" }) : route.continue());
    const retryPage = await retry.newPage();
    await retryPage.goto(base + "/");
    await retryPage.locator("#talent-advisor").click();
    await retryPage.locator("#talent-error").waitFor();
    assert.equal(await retryPage.locator("#talent-result").isVisible(), false);
    fail = false;
    await retryPage.locator("#retry-talents").click();
    await retryPage.locator("#talent-class button").first().waitFor();
    assert.equal(await retryPage.locator("#talent-class button").count(), 9);
    assert.equal(await retryPage.locator("#talent-error").isVisible(), false);
    console.log("Invalid class data and successful retry: OK");
    await retry.close();
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => { console.error(error); server.close(); process.exitCode = 1; });
