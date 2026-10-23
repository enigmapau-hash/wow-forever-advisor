"use strict";
const assert = require("node:assert/strict");

// Called by the shared browser runner on an already installed, offline PWA.
module.exports = async function checkAddons(page, context, base, browser) {
  await page.goto(base + "/#addon-advisor");
  await page.locator("#addon-results article").first().waitFor();
  assert.equal(await page.locator("#addon-results article").count(), 5);
  assert.match(await page.getByRole("button", { name: "Selección inicial" }).getAttribute("aria-pressed"), /true/,
    "Editorially named initial selection is the default filter");
  assert.equal(await page.locator("#addon-results article").first().locator(".addon-state").count(), 1,
    "Publication status remains visible");
  assert.equal(await page.locator("#addon-results article").first().getByText("Prueba independiente").count(), 0,
    "No repetitive testing disclaimer in each collapsed addon card");
  await page.locator("#addon-results article").first().locator("details summary").click();
  assert.match(await page.locator("#addon-results article").first().locator("details").textContent(), /Prueba independiente: no registrada/,
    "Independent test status remains available in detail");
  await page.locator("#addon-results article").first().locator("details summary").click();
  assert.match(await page.title(), /^Addon Advisor/);
  assert.equal(await page.locator("#addon-title").evaluate((el) => el === document.activeElement), true);
  await page.getByRole("button", { name: "Todos", exact: true }).click();
  assert.equal(await page.locator("#addon-results article").count(), 11);
  await page.getByRole("button", { name: "Exploración", exact: true }).click();
  assert.equal(await page.locator("#addon-results article").count(), 1);
  assert.match(await page.locator("#addon-results").textContent(), /OpenMap/);
  await page.getByRole("button", { name: "Recolección", exact: true }).click();
  assert.equal(await page.locator("#addon-results article").count(), 1);
  assert.match(await page.locator("#addon-results").textContent(), /Pendiente de verificar/);
  assert.equal(await page.locator("#addon-results a").first().getAttribute("rel"), "noopener noreferrer");
  const groups = page.getByRole("button", { name: "Grupos", exact: true });
  await groups.focus();
  await page.keyboard.press("Space");
  assert.equal(await groups.getAttribute("aria-pressed"), "true");
  assert.match(await page.locator("#addon-results").textContent(), /En observación/);
  for (const width of [320, 360, 390, 412]) {
    await page.setViewportSize({ width, height: 844 });
    await page.getByRole("button", { name: "Todos", exact: true }).click();
    await page.locator("#addon-results details").evaluateAll((items) => items.forEach((d) => { d.open = true; }));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No addon overflow at ${width}`);
    await page.locator("#addon-results details").evaluateAll((items) => items.forEach((d) => { d.open = false; }));
    const sizes = await page.locator("#addon-filters button").evaluateAll((items) => items.map((b) => b.getBoundingClientRect().height));
    assert(sizes.every((h) => h >= 44), "44px touch targets");
  }
  if (process.env.REVIEW_SCREENSHOT) await page.screenshot({ path: process.env.REVIEW_SCREENSHOT, fullPage: true });

  await page.goto(base + "/#race-advisor");
  await page.locator('#faction button[data-value="Alianza"]').click();
  await page.locator('#character-class button[data-value="Druida"]').click();
  await page.locator("#specialization button").first().click();
  await page.locator("#race-addons").waitFor();
  assert.match(await page.locator("#race-addons").textContent(), /Leatrix Plus/);
  await page.locator("#race-addons a").click();
  await page.locator("#addon-view").waitFor();
  await page.goBack();
  await page.locator("#race-addons").waitFor();
  await page.locator('#character-class button[data-value="Guerrero"]').click();
  await page.locator("#specialization button").first().click();
  assert.equal(await page.locator("#race-addons").isVisible(), false);

  await page.goto(base + "/#race-advisor");
  await page.locator('#faction button[data-value="Alianza"]').click();
  await page.locator('#character-class button[data-value="Cazador"]').click();
  await page.locator("#specialization button").first().click();
  await page.locator("#race-addons strong").first().waitFor();
  assert.match(await page.locator("#race-addons").textContent(), /ProcDoc/);
  await page.goto(base + "/#profession-advisor");
  await page.locator("#profession-class button").first().click();
  await page.locator("#profession-buttons button").first().click();
  await page.locator("#profession-addons").waitFor();
  assert.equal(await page.locator("#profession-addons strong").count(), 2);
  assert.match(await page.locator("#profession-addons").textContent(), /Auctionator/);
  assert.match(await page.locator("#profession-addons").textContent(), /CraftProfit Forever/);
  await page.locator("#profession-class button").last().click();
  assert.equal(await page.locator("#profession-addons").isVisible(), false);

  await page.goto(base + "/#talent-advisor");
  await page.locator('#talent-class button[data-value="Druida"]').click();
  await page.locator('#talent-spec button[data-value="Feral"]').click();
  await page.locator('#talent-goal button[data-value="Subir al 60"]').click();
  await page.locator("#talent-addons").waitFor();
  assert.equal(await page.locator("#talent-addons strong").count(), 2);
  await page.locator('#talent-class button[data-value="Guerrero"]').click();
  await page.locator("#talent-spec button").first().click();
  await page.locator('#talent-goal button[data-value="Mazmorras"]').click();
  await page.locator("#talent-addons strong").first().waitFor();
  assert.match(await page.locator("#talent-addons").textContent(), /ProcDoc/);
  await page.locator('#talent-class button[data-value="Sacerdote"]').click();
  await page.locator("#talent-spec button").first().click();
  await page.locator('#talent-goal button[data-value="Mazmorras"]').click();
  assert.equal(await page.locator("#talent-addons").isVisible(), false);
  console.log("Addons offline: filters, sources, related cards, back navigation, 320–412px touch sizes OK");

  await context.setOffline(false);
  const retry = await browser.newContext({ serviceWorkers: "block" });
  await retry.route("https://wow.zamimg.com/**", (route) => route.abort());
  let fail = true;
  await retry.route("**/data/addon-advisor.json", (route) => fail
    ? route.fulfill({ contentType: "application/json", body: "{}" }) : route.continue());
  const p = await retry.newPage();
  await p.goto(base + "/#addon-advisor");
  await p.locator("#addon-error").waitFor();
  assert.equal(await p.locator("#addon-results article").count(), 0);
  // A failed optional catalog cannot break Race Advisor.
  await p.goto(base + "/#race-advisor");
  await p.locator('#faction button[data-value="Alianza"]').click();
  await p.locator('#character-class button[data-value="Druida"]').click();
  await p.locator("#specialization button").first().click();
  assert.equal(await p.locator("#advisor-result").isVisible(), true);
  assert.equal(await p.locator("#race-addons").isVisible(), false);
  await p.goto(base + "/#addon-advisor");
  await p.locator("#addon-error").waitFor();
  fail = false;
  await p.locator("#retry-addons").click();
  await p.locator("#addon-results article").first().waitFor();
  assert.equal(await p.locator("#addon-results article").count(), 5);
  assert.equal(await p.locator("#addon-error").isVisible(), false);
  // Defer the catalog response; changing class invalidates the in-flight context.
  await p.goto(base + "/#race-advisor");
  await p.evaluate(async () => {
    let release;
    const originalFetch = window.fetch;
    window.fetch = (...args) => args[0] === "./data/addon-advisor.json"
      ? new Promise((resolve) => { release = () => originalFetch(...args).then(resolve); })
      : originalFetch(...args);
    window.releaseAddonResponse = () => release?.();
  });
  // A class change clears the host while the optional request is still pending.
  await p.evaluate(async () => {
    const task = AddonAdvisor.context("race-addons", { modulo: "race", clase: "Druida" });
    AddonAdvisor.clear("race-addons");
    window.releaseAddonResponse();
    await task;
  });
  assert.equal(await p.locator("#race-addons").isVisible(), false);
  await retry.close();
  console.log("Addon invalid catalog, retry, optional failure isolation and stale context cancellation OK");
};
