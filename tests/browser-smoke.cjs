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
    // Seed the previous app cache before any document registers the new worker.
    await page.goto(base + "/manifest.webmanifest");
    await page.evaluate(async () => {
      const cache = await caches.open(`wow-forever-advisor:${location.origin}/:v22`);
      await cache.put("./obsolete-v22", new Response("old"));
    });
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
    assert.equal(await page.locator(".available-modules > li").count(), 4,
      "Only the four approved modules appear on the home screen");
    assert.equal(await page.locator("#future-title").count(), 0,
      "No future-module section on the home screen");
    assert.equal(await page.getByText("Build Advisor").count(), 0,
      "Build Advisor is not displayed on the home screen");
    assert.equal(await page.locator(".available-modules h3").first().evaluate((heading) =>
      heading.firstChild.textContent.trim()), "Race Explorer", "Home module uses approved name");
    assert.equal(await page.locator(".available-modules h3 .card-arrow").first().textContent(), "↗",
      "Decorative arrow is present without changing the module name");
    assert.equal(await page.locator("#racial-title").textContent(), "Race Explorer", "Explorer view uses approved name");
    assert.equal(await page.locator("#race-advisor").getAttribute("href"), "#race-advisor",
      "Hero card opens Race Advisor through a native link");
    assert.equal(await page.locator(".available-modules .module-link").count(), 4,
      "Each home module uses one full-card link");
    assert.equal(await page.locator("#home-view button").count(), 0,
      "The home page has no redundant Open buttons");
    for (const [id, destination] of [
      ["home-explore-racials", "#raciales"], ["profession-advisor", "#profession-advisor"],
      ["talent-advisor", "#talent-advisor"], ["addon-advisor", "#addon-advisor"],
    ]) {
      assert.equal(await page.locator("#" + id).getAttribute("href"), destination,
        id + " has a native link to its module");
    }
    for (const [width, expected] of [[360, 1], [820, 2], [1280, 2]]) {
      await page.setViewportSize({ width, height: 844 });
      const columns = await page.locator(".available-modules").evaluate((el) =>
        getComputedStyle(el).gridTemplateColumns.split(" ").length);
      assert.equal(columns, expected, "Responsive cards columns at " + width);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        "No horizontal overflow at " + width);
    }
    await page.locator("#profession-advisor").focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => location.hash === "#profession-advisor"
      && !document.getElementById("profession-view").hidden);
    assert.equal(await page.locator("#profession-view").isVisible(), true,
      "Whole module card opens using keyboard Enter");
    await page.goto(base + "/");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/#race-advisor");
    await page.locator('#faction button[data-value="Alianza"]').click();
    await page.locator('#character-class button[data-value="Guerrero"]').click();
    await page.locator('#specialization button[data-value="Armas"]').click();
    assert.equal(await page.locator(".recommendation .detail-disclosure").getAttribute("open"), null,
      "The long explanation starts collapsed");
    await page.locator(".recommendation .detail-disclosure summary").click();
    assert.equal(await page.locator('[data-field="explicacion"]').isVisible(), true,
      "The original explanation is available after expanding");
    assert.match(await page.locator("#advisor-result").textContent(), /Prioridad de esta combinación \(Excel\)/,
      "The recommendation rating is distinguished from general racial utility");
    await page.locator("#advisor-result > .detail-disclosure summary").click();
    assert.equal(await page.locator('[data-field="escalaUtilidad"]').isVisible(), true,
      "The general racial rating remains available");
    await page.goto(base + "/#raciales");
    await page.locator('#racial-race button[data-value="Gnomo"]').click();
    await page.locator("#racial-result .detail-disclosure summary").click();
    assert.equal(await page.locator('[data-racial-field="comentarios"]').isVisible(), true,
      "The original racial comments remain accessible");
    await page.goto(base + "/");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
      }
    });
    const catalog = await page.evaluate(async () => (await fetch("./data/talent-advisor-catalog.json")).json());
    const cacheNames = await page.evaluate(() => caches.keys());
    assert(cacheNames.some((name) => name.endsWith(":v23")), "Current version cache installed");
    assert(!cacheNames.some((name) => name.endsWith(":v22")), "Previous app cache removed after activation");
    await context.setOffline(true);
    await page.reload();
    await page.locator("#talent-advisor").click();
    await page.locator("#talent-class button").first().waitFor();
    await page.locator('#talent-class button[data-value="Cazador"]').click();
    await page.locator('#talent-spec button[data-value="Bestias"]').click();
    await page.locator('#talent-goal button[data-value="Subir al 60"]').click();
    assert.match(await page.locator("#talent-advice-warning").textContent(), /Los talentos destacados se repiten para los tres objetivos/, "Cazador shows evidence limit even offline");
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
    await page.goto(base + "/#raciales");
    await page.locator("#racial-race button").first().waitFor();
    const racialUpdates = await page.evaluate(async () => (await fetch("./data/racial-beta-updates.json")).json());
    for (const entry of racialUpdates.razas) {
      await page.locator(`#racial-race button[data-value="${entry.raza}"]`).click();
      assert.equal(await page.locator("#racial-beta-updates").isVisible(), true,
        `Racial beta updates visible offline for ${entry.raza}`);
      const text = await page.locator("#racial-beta-list").textContent();
      for (const change of entry.cambios) {
        assert(text.includes(change), `Official racial update matches source data for ${entry.raza}`);
      }
    }
    const raceData = await page.evaluate(async () => (await fetch("./data/race-advisor.json")).json());
    const orc = raceData.fichas.find((row) => row.razaRecomendada === "Orco");
    assert(orc, "Orc remains present as a recommended race in the original Excel");
    await page.goto(base + "/#race-advisor");
    await page.locator(`#faction button[data-value="${orc.faccion}"]`).click();
    await page.locator(`#character-class button[data-value="${orc.clase}"]`).click();
    await page.locator(`#specialization button[data-value="${orc.especializacion}"]`).click();
    assert.match(await page.locator("#race-beta-recommended-list").textContent(), /Savage/,
      "Race Advisor shows official Orc change without recalculating original recommendation");
    assert.equal(await page.locator('[data-field="razaRecomendada"]').textContent(), "Orco");
    console.log("Racials: 8/8 official updates available offline; Race Advisor context preserved");
    await require("./addon-browser.cjs")(page, context, base, browser);
    await page.goto(base + "/#talent-advisor");
    await page.locator("#talent-class button").first().waitFor();
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
