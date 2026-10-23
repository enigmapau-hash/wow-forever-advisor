"use strict";
const assert = require("node:assert/strict");

// Shared with browser-smoke.cjs; uses real DOM buttons and a fresh offline reload.
module.exports = async function testSkyborne(page, context, base) {
  await context.setOffline(false);
  await page.goto(base + "/#raciales");
  await page.locator('#racial-race button[data-value="Cielonato"]').waitFor();
  const data = await page.evaluate(async () => (await fetch("./data/skyborne.json")).json());
  const advisor = await page.evaluate(async () => (await fetch("./data/race-advisor.json")).json());
  assert.equal(await page.locator("#racial-race button").count(), 9);
  assert(await page.evaluate((data) => {
    if (!validateSkyborneData(data)) return false;
    const mutations = [
      (d) => { d.comunes.find((a) => a.id === "wind-blessed").celeridadPorcentaje = 1; },
      (d) => { d.variantes[0].clases[4] = "Chamán"; },
      (d) => { d.variantes[1].clases[4] = "Mago"; },
      (d) => { d.variantes[1] = d.variantes[0]; },
      (d) => { d.comunes[0].fuentes = ["missing"]; },
      (d) => { d.fuentes[0].url = "https://example.com"; },
      (d) => { delete d.icono; },
    ];
    return mutations.every((mutate) => { const d = structuredClone(data); mutate(d); return validateSkyborneData(d) === null; });
  }, data), "Reject stale beta, invalid classes, references and malformed metadata");
  const sky = page.getByRole("button", { name: "Cielonato", exact: true });
  await sky.focus();
  await page.keyboard.press("Enter");
  assert.equal(await sky.getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator("#skyborne-result").isVisible(), true);
  assert.equal(await page.locator("#racial-result").isVisible(), false);
  assert.equal(await sky.locator("img").count(), 0, "No invented or borrowed racial icon");
  assert.equal(await page.locator("#skyborne-result .rating").count(), 0, "No invented stars");
  assert.match(await page.locator("#skyborne-result").textContent(), /Valoración pendiente/);
  assert.match(await page.locator("#skyborne-verification").textContent(),
    data.revision.estado === "verificado" ? /Datos oficiales de beta/ : /pendientes de contraste independiente/);
  for (const ability of data.comunes) {
    assert((await page.locator("#skyborne-common").textContent()).includes(ability.descripcion));
  }
  assert.deepEqual(await page.locator("#skyborne-sources a").evaluateAll((links) => links.map((link) => link.href)),
    data.fuentes.map((source) => source.url));
  for (const variant of data.variantes) {
    const faction = page.locator(`#skyborne-faction button[data-value="${variant.faccion}"]`);
    await faction.focus();
    await page.keyboard.press("Space");
    assert.equal(await faction.getAttribute("aria-pressed"), "true");
    assert.equal(await page.locator("#skyborne-faction button[aria-pressed=true]").count(), 1);
    assert.equal(await page.locator("#skyborne-classes").textContent(), variant.clases.join(" · "));
    assert.equal(await page.locator("#skyborne-ability").textContent(), variant.habilidad.descripcion);
    assert.equal(await page.locator("#skyborne-ability-title").textContent(), variant.habilidad.nombre);
  }
  for (const width of [320, 390, 820, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    const grid = page.locator("#racial-race .option-buttons");
    assert.equal(await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length), 3);
    const boxes = await page.locator("#racial-race button").evaluateAll((buttons) => buttons.map((button) => {
      const b = button.getBoundingClientRect();
      return { x: b.x, y: b.y, h: b.height, w: b.width, label: button.textContent.trim() };
    }));
    assert.equal(new Set(boxes.map((b) => b.y)).size, 3, "Three complete rows");
    assert.equal(new Set(boxes.map((b) => b.x)).size, 3, "Three aligned columns");
    assert(boxes.every((b) => b.h >= 48 && b.w >= 48 && b.label.length > 0));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#racial-race button[data-value="Gnomo"]').click();
  assert.equal(await page.locator("#skyborne-result").isVisible(), false);
  assert.equal(await page.locator("#racial-result").isVisible(), true);
  await page.locator("#back-selector").click();
  await page.locator("#faction button").first().waitFor();
  const coverage = await page.evaluate(({ data, advisor }) => {
    let eligible = 0;
    const choose = (id, value) => {
      const button = [...document.querySelectorAll(`#${id} button`)].find((b) => b.dataset.value === value);
      if (!button) throw new Error(`Missing ${id}: ${value}`);
      button.click();
    };
    for (const row of advisor.fichas) {
      choose("faction", row.faccion);
      if (!document.getElementById("skyborne-consideration").hidden) throw new Error("Stale faction consideration");
      choose("character-class", row.clase);
      if (!document.getElementById("skyborne-consideration").hidden) throw new Error("Stale class consideration");
      choose("specialization", row.especializacion);
      const allowed = data.variantes.some((v) => v.faccion === row.faccion && v.clases.includes(row.clase));
      if (document.getElementById("skyborne-consideration").hidden === allowed) throw new Error(`Wrong eligibility: ${row.faccion}/${row.clase}`);
      for (const key of ["razaRecomendada", "alternativa", "prioridad", "motivoPrincipal", "explicacion"]) {
        if (document.querySelector(`[data-field="${key}"]`).textContent !== row[key]) throw new Error(`Changed original: ${key}`);
      }
      if (allowed) {
        eligible++;
        const v = data.variantes.find((v) => v.faccion === row.faccion);
        if (!document.getElementById("skyborne-advisor-abilities").textContent.includes(v.habilidad.descripcion)) throw new Error("Wrong faction ability");
      }
    }
    return { total: advisor.fichas.length, eligible };
  }, { data, advisor });
  assert.deepEqual(coverage, { total: 51, eligible: 30 });
  assert.equal(await page.locator("#skyborne-consideration .rating").count(), 0);
  for (const variant of data.variantes) {
    const row = advisor.fichas.find((row) => row.faccion === variant.faccion && row.clase === variant.clases[0]);
    for (const [id, key] of [["faction", "faccion"], ["character-class", "clase"], ["specialization", "especializacion"]]) {
      await page.locator(`#${id} button[data-value="${row[key]}"]`).click();
    }
    const original = await page.locator("#result-combination").textContent();
    await page.locator("#skyborne-explore").click();
    await page.locator("#skyborne-result").waitFor();
    assert.equal(await page.locator("#skyborne-result").isVisible(), true);
    assert.equal(await page.locator(`#skyborne-faction button[data-value="${variant.faccion}"]`).getAttribute("aria-pressed"), "true");
    await page.locator("#back-selector").click();
    assert.equal(await page.locator("#result-combination").textContent(), original);
    await page.goBack();
    await page.locator("#skyborne-result").waitFor();
    assert.equal(await page.locator("#skyborne-result").isVisible(), true);
    await page.locator("#back-selector").click();
  }
  await page.goto(base + "/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((resolve) =>
      navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
  });
  assert((await page.evaluate(() => caches.keys())).some((name) => name.endsWith(":v26")));
  await context.setOffline(true);
  await page.reload();
  await page.locator("#home-explore-racials").click();
  await page.locator('#racial-race button[data-value="Cielonato"]').click();
  for (const variant of data.variantes) {
    await page.locator(`#skyborne-faction button[data-value="${variant.faccion}"]`).click();
    assert.equal(await page.locator("#skyborne-ability").textContent(), variant.habilidad.descripcion);
  }
  await page.locator("#back-selector").click();
  await page.locator('#faction button[data-value="Alianza"]').click();
  await page.locator('#character-class button[data-value="Mago"]').click();
  await page.locator("#specialization button").first().click();
  assert.equal(await page.locator("#skyborne-consideration").isVisible(), true);
  await page.locator('#character-class button[data-value="Sacerdote"]').click();
  await page.locator("#specialization button").first().click();
  assert.equal(await page.locator("#skyborne-consideration").isVisible(), false);
  await context.setOffline(false);
  await page.goto(base + "/");
  const fallback = await context.browser().newContext({ serviceWorkers: "block" });
  try {
    await fallback.route("https://wow.zamimg.com/**", (route) => route.abort());
    await fallback.route("**/data/skyborne.json", (route) => route.fulfill({ contentType: "application/json", body: "{}" }));
    const fallbackPage = await fallback.newPage();
    await fallbackPage.goto(base + "/#raciales");
    await fallbackPage.locator("#skyborne-data-error").waitFor();
    assert.equal(await fallbackPage.locator("#racial-race button").count(), 8);
    await fallbackPage.locator("#back-selector").click();
    await fallbackPage.locator('#faction button[data-value="Alianza"]').click();
    await fallbackPage.locator('#character-class button[data-value="Guerrero"]').click();
    await fallbackPage.locator('#specialization button[data-value="Armas"]').click();
    assert.equal(await fallbackPage.locator("#advisor-result").isVisible(), true);
    assert.equal(await fallbackPage.locator("#skyborne-consideration").isVisible(), false);
  } finally { await fallback.close(); }
  console.log("Cielonato: 9 races, 2 variants, 30 eligible / 21 excluded combinations; original recommendations, keyboard, 4 viewport sizes, navigation and offline: OK");
};
