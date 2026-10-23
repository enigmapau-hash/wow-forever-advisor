"use strict";
const assert = require("node:assert/strict");

// Shared with browser-smoke.cjs; uses real DOM buttons and a fresh offline reload.
module.exports = async function testSkyborne(page, context, base) {
  await context.setOffline(false);
  await page.goto(base + "/#raciales");
  await page.locator('#racial-race button[data-value="Cielonato"]').waitFor();
  const data = await page.evaluate(async () => (await fetch("./data/skyborne.json")).json());
  const advisor = await page.evaluate(async () => (await fetch("./data/race-advisor.json")).json());
  const druidAlt = await page.evaluate(async () =>
    (await fetch("./data/race-advisor-druid-alternatives.json")).json());
  assert.equal(await page.locator("#racial-race button").count(), 9);
  assert.match(await page.locator("#racial-coverage-note").textContent(), /^Nueve razas/);
  assert.equal(await page.locator("#explore-racials").textContent(), "Explorar las 9 razas →");
  assert.equal(await page.locator("#skyborne-consideration").count(), 0,
    "No debe existir ninguna recomendación por mera compatibilidad en Race Advisor");
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
      (d) => { d.variantes[0].habilidad.nombre = "Read Leyline"; },
      (d) => { d.variantes[1].habilidad.monturaPorcentaje = 10; },
    ];
    return mutations.every((mutate) => { const d = structuredClone(data); mutate(d); return validateSkyborneData(d) === null; });
  }, data), "Reject stale beta, invalid classes, references and malformed metadata");
  const sky = page.getByRole("button", { name: "Cielonato", exact: true });
  await sky.focus();
  await page.keyboard.press("Enter");
  assert.equal(await sky.getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator("#skyborne-result").isVisible(), true);
  assert.equal(await page.locator("#racial-result").isVisible(), false);
  assert.equal(await page.evaluate(() => self.WOW_ICON_MAP?.raza?.Cielonato),
    data.icono.url, "El retrato identificado se sirve desde el mismo mapa que las demás razas");
  assert.equal(await sky.getAttribute("data-icon-name"), "Cielonato");
  assert.equal(await sky.getByText("Cielonato", { exact: true }).isVisible(), true,
    "El nombre permanece accesible si la red bloquea el icono");
  assert.equal(await page.locator("#skyborne-result .rating").count(), 0, "No invented stars");
  assert.match(await page.locator("#skyborne-result").textContent(), /Alcance de la evaluación/);
  assert.match(await page.locator("#skyborne-criterion").textContent(), /alternativa de Druida/);
  assert.equal(await page.locator("#skyborne-alternatives a").count(), 6,
    "Race Explorer enlaza las seis alternativas de Druida");
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
    if (variant.faccion === "Alianza") assert.equal(await page.locator("#skyborne-ability-title").textContent(), "Read Ley Line");
    else assert(!/montura/.test(await page.locator("#skyborne-ability").textContent()));
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
  // Race Advisor solo recomienda en función de las fichas valoradas, no por
  // compatibilidad de clase o facción. Cielonato permanece en Race Explorer.
  const coverage = await page.evaluate(({ advisor, druidAlt }) => {
    const choose = (id, value) => {
      const button = [...document.querySelectorAll(`#${id} button`)].find((b) => b.dataset.value === value);
      if (!button) throw new Error(`Missing ${id}: ${value}`);
      button.click();
    };
    if (document.getElementById("skyborne-consideration") || document.getElementById("skyborne-explore")) {
      throw new Error("No deben existir tarjetas de compatibilidad en Race Advisor");
    }
    for (const row of advisor.fichas) {
      choose("faction", row.faccion);
      choose("character-class", row.clase);
      choose("specialization", row.especializacion);
      const result = document.getElementById("advisor-result");
      if (result.hidden || /Cielonato/.test(result.textContent)) {
        throw new Error(`Recomendación no evaluada visible: ${row.faccion}/${row.clase}/${row.especializacion}`);
      }
      const druid = druidAlt.fichas.find((x) => x.faccion === row.faccion
        && x.clase === row.clase && x.especializacion === row.especializacion);
      for (const key of ["razaRecomendada", "alternativa", "prioridad", "motivoPrincipal", "explicacion"]) {
        const rendered = document.querySelector(`[data-field="${key}"]`).textContent;
        const expected = key === "alternativa" && druid ? "Cielonato"
          : key === "alternativa" && row.alternativa === "-" && row.faccion === "Alianza" && row.clase === "Chamán"
            ? "Sin alternativa: única raza disponible"
            : row[key];
        if (rendered !== expected) {
          throw new Error(`Changed original or incorrect Druid alternative: ${key}`);
        }
      }
      if (druid) {
        if (document.getElementById("alternative-use").textContent !== druid.usoAlternativa
            || !document.getElementById("race-druid-note").textContent.includes(druid.motivoComparacion)
            || document.getElementById("race-druid-note").hidden) {
          throw new Error(`Missing comparative reason for ${row.faccion}/${row.especializacion}`);
        }
      }
    }
    return advisor.fichas.length;
  }, { advisor, druidAlt });
  assert.equal(coverage, 51, "Conservar las 51 recomendaciones principales y las seis alternativas de Druida");
  const additions = await page.evaluate(async () => (await fetch("./data/race-advisor-additions.json")).json());
  assert.equal(additions.fichas.length, 3, "Tres fichas adicionales de Paladín Horda");
  await page.locator('#faction button[data-value="Horda"]').click();
  assert.equal(await page.locator('#character-class button[data-value="Paladín"]').count(), 1,
    "Paladín está disponible en Horda");
  await page.locator('#character-class button[data-value="Paladín"]').click();
  assert.equal(await page.locator("#specialization button").count(), 3);
  for (const entry of additions.fichas) {
    await page.locator(`#specialization button[data-value="${entry.especializacion}"]`).click();
    assert.equal(await page.locator('[data-field="razaRecomendada"]').textContent(), "No-muerto");
    assert.equal(await page.locator('[data-field="alternativa"]').textContent(), "Sin alternativa: única raza disponible");
    assert.equal(await page.locator("#race-addition-note").isVisible(), true);
    assert.match(await page.locator("#no-alternative").textContent(), /No-muerto es la única raza/);
    assert.equal(await page.locator('[data-field="motivoPrincipal"]').textContent(), entry.motivoPrincipal);
    assert.equal(await page.locator('[data-field="explicacion"]').textContent(), entry.explicacion);
  }
  for (const variant of data.variantes) {
    const row = advisor.fichas.find((row) => row.faccion === variant.faccion && row.clase === variant.clases[0]);
    for (const [id, key] of [["faction", "faccion"], ["character-class", "clase"], ["specialization", "especializacion"]]) {
      await page.locator(`#${id} button[data-value="${row[key]}"]`).click();
    }
    const original = await page.locator("#result-combination").textContent();
    await page.locator("#explore-racials").click();
    await page.locator('#racial-race button[data-value="Cielonato"]').click();
    await page.locator(`#skyborne-faction button[data-value="${variant.faccion}"]`).click();
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
  assert((await page.evaluate(() => caches.keys())).some((name) => name.endsWith(":v29")));
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
  assert.equal(await page.locator("#skyborne-consideration").count(), 0,
    "Ni siquiera una clase compatible debe crear una recomendación de Cielonato");
  assert.equal(await page.locator("#advisor-result").isVisible(), true);
  await page.locator('#character-class button[data-value="Sacerdote"]').click();
  await page.locator("#specialization button").first().click();
  assert.equal(await page.locator("#skyborne-consideration").count(), 0);
  await page.locator('#faction button[data-value="Horda"]').click();
  await page.locator('#character-class button[data-value="Paladín"]').click();
  await page.locator('#specialization button[data-value="Protección"]').click();
  assert.equal(await page.locator('[data-field="razaRecomendada"]').textContent(), "No-muerto",
    "Paladín Horda disponible offline con caché nueva");
  assert.equal(await page.locator("#race-addition-note").isVisible(), true);
  await context.setOffline(false);
  await page.goto(base + "/");
  const fallback = await context.browser().newContext({ serviceWorkers: "block" });
  try {
    await fallback.route("https://wow.zamimg.com/**", (route) => route.abort());
    let failSkyborne = true;
    await fallback.route("**/data/skyborne.json", (route) => failSkyborne
      ? route.fulfill({ contentType: "application/json", body: "{}" }) : route.continue());
    const fallbackPage = await fallback.newPage();
    await fallbackPage.goto(base + "/#raciales");
    await fallbackPage.locator("#skyborne-data-error").waitFor();
    assert.equal(await fallbackPage.locator("#racial-race button").count(), 8);
    assert.equal(await fallbackPage.locator("#explore-racials").textContent(), "Explorar las 8 razas →");
    assert.match(await fallbackPage.locator("#racial-coverage-note").textContent(), /^Ocho razas/);
    assert.equal(await fallbackPage.locator("#skyborne-consideration").count(), 0);
    await fallbackPage.locator("#back-selector").click();
    await fallbackPage.locator('#faction button[data-value="Alianza"]').click();
    await fallbackPage.locator('#character-class button[data-value="Guerrero"]').click();
    await fallbackPage.locator('#specialization button[data-value="Armas"]').click();
    assert.equal(await fallbackPage.locator("#advisor-result").isVisible(), true);
    assert.equal(await fallbackPage.locator("#skyborne-consideration").count(), 0);
    failSkyborne = false;
    await fallbackPage.goto(base + "/?skyborne-recovery=1#raciales");
    await fallbackPage.locator('#racial-race button[data-value="Cielonato"]').waitFor();
    assert.equal(await fallbackPage.locator("#racial-race button").count(), 9);
    assert.equal(await fallbackPage.locator("#explore-racials").textContent(), "Explorar las 9 razas →");
    assert.match(await fallbackPage.locator("#racial-coverage-note").textContent(), /^Nueve razas/);
    assert.equal(await fallbackPage.locator("#skyborne-data-error").isVisible(), false);
  } finally { await fallback.close(); }
  console.log("Cielonato: 9 razas, 2 variantes y 6 alternativas Druida; 51 originales + 3 Paladín Horda, teclado, navegación y offline: OK");
};
