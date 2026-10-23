"use strict";
const assert = require("node:assert/strict");

module.exports = async function testRedesign(page, base, offline = false) {
  await page.goto(base + "/#race-advisor");
  await page.locator("#faction button").first().waitFor();
  for (const width of offline ? [390] : [320, 390, 820, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    const count = await page.evaluate(async (width) => {
      const read = async (name) => (await fetch(`./data/${name}.json`)).json();
      const [source, additions, druid, profiles] = await Promise.all([
        read("race-advisor"), read("race-advisor-additions"),
        read("race-advisor-druid-alternatives"), read("racials"),
      ]);
      const display = (text) => text.replace(/\bElfo\b(?! de la noche)/g, "Elfo de la noche");
      const choose = (id, value) => document.querySelector(`#${id} button[data-value="${value}"]`).click();
      const ensure = (ok, message) => { if (!ok) throw new Error(message); };
      let count = 0;
      for (const row of [...source.fichas, ...additions.fichas]) {
        const extra = druid.fichas.find((r) => r.faccion === row.faccion && r.clase === row.clase
          && r.especializacion === row.especializacion);
        const alt = extra?.alternativa || row.alternativa;
        choose("faction", row.faccion);
        choose("character-class", row.clase);
        choose("specialization", row.especializacion);
        const main = document.getElementById("primary-choice");
        const alternative = document.getElementById("alternative-profile");
        ensure(main.querySelector('[data-field="razaRecomendada"]').textContent === display(row.razaRecomendada), "Raza principal intacta");
        ensure(main.querySelector('[data-field="motivoPrincipal"]').textContent === display(row.motivoPrincipal), "Motivo asociado a principal");
        const explanation = main.querySelector('[data-field="explicacion"]');
        ensure(explanation.textContent === display(row.explicacion) && explanation.getClientRects().length > 0, "Explicación original visible");
        ensure(alternative.hidden === (alt === "-"), "Sin tarjeta vacía");
        ensure(document.getElementById("alternative-empty").hidden === (alt !== "-"), "Motivo de alternativa ausente");
        ensure(document.getElementById("primary-profile-label").textContent === `Perfil de ${display(row.razaRecomendada)}`, "Perfil identificado por raza");
        const profile = profiles.raciales.find((p) => p.raza === row.razaRecomendada);
        for (const key of ["fortalezas", "debilidades", "comentarios"]) {
          ensure(document.querySelector(`[data-field="${key}"]`).textContent === display(profile[key]), "Perfil racial intacto");
        }
        ensure(!document.getElementById("primary-profile").open && !document.getElementById("alternative-details").open, "Detalles restablecidos al cambiar selección");
        if (alt !== "-") {
          ensure(alternative.querySelector('[data-field="alternativa"]').textContent === display(alt), "Alternativa intacta");
          ensure(document.getElementById("alternative-race-icon").getAttribute("src") === self.WOW_ICON_MAP.raza[alt], "Icono de alternativa correcto");
          ensure(document.getElementById("alternative-use").textContent.trim().length > 0, "Alternativa explicada");
          const a = main.getBoundingClientRect(), b = alternative.getBoundingClientRect();
          ensure(width < 768 ? b.top >= a.bottom : b.left >= a.right, `Jerarquía responsive ${width}`);
          ensure(width < 768 || a.width > b.width, "Principal más grande en escritorio");
        } else {
          ensure(!document.getElementById("alternative-race-icon").hasAttribute("src"), "Sin icono ficticio o residual");
        }
        ensure(document.documentElement.scrollWidth <= innerWidth, `Sin desbordamiento ${width}`);
        for (const label of document.querySelectorAll('#character-class .option-label, #specialization .option-label')) {
          ensure(label.getBoundingClientRect().height <= parseFloat(getComputedStyle(label).lineHeight) + 1,
            `Nombre sin cortar a ${width}px: ${label.textContent}`);
          ensure(label.getBoundingClientRect().width <= label.closest('button').clientWidth,
            `Nombre dentro del botón a ${width}px: ${label.textContent}`);
        }
        count++;
      }
      ensure(document.getElementById("pwa-version").textContent === `PWA ${self.WOW_PWA_VERSION}`, "Versión sincronizada");
      return count;
    }, width);
    assert.equal(count, 54);
  }
  for (const [id, value] of [["faction", "Alianza"], ["character-class", "Guerrero"], ["specialization", "Armas"]]) {
    await page.locator(`#${id} button[data-value="${value}"]`).click();
  }
  for (const id of ["primary-profile", "alternative-details", "race-beta-updates"]) {
    const summary = page.locator(`#${id} > summary`);
    await summary.focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.locator(`#${id}`).evaluate(el => el.open), true, id + " abre con teclado");
    await page.keyboard.press("Enter");
    assert.equal(await page.locator(`#${id}`).evaluate(el => el.open), false, id + " cierra con teclado");
  }
  // La etiqueta visible cambia; claves, selección e iconos siguen usando «Elfo».
  await page.goto(base + "/#raciales");
  const elf = page.locator('#racial-race button[data-value="Elfo"]');
  await elf.click();
  assert.equal(await elf.locator(".option-label").textContent(), "Elfo de la noche");
  assert.equal(await elf.getAttribute("data-icon-name"), "Elfo");
  assert.equal(await page.locator("#racial-name").textContent(), "Elfo de la noche");
  await page.goto(base + "/#profession-advisor");
  await page.locator("#profession-class button").first().waitFor();
  const professions = await page.evaluate(async () => {
    const data = await (await fetch("./data/profession-advisor.json")).json();
    for (const row of data.fichas) {
      document.querySelector(`#profession-class button[data-value="${row.clase}"]`).click();
      document.querySelector(`#profession-buttons button[data-value="${row.especializacion}"]`).click();
      if (document.getElementById("profession-result").hidden) throw new Error("Ficha de profesiones ausente");
      for (const field of document.querySelectorAll("[data-profession-field]")) {
        const value = row[field.dataset.professionField];
        if (field.textContent !== (Array.isArray(value) ? value.join(" + ") : value)) throw new Error("Profesiones alteradas");
      }
    }
    return data.fichas.length;
  });
  assert.equal(professions, 27);
  console.log(`v32 ${offline ? "offline" : "320/390/820/1280px"}: 54 fichas, jerarquía, iconos, Elfo, versión y 27 profesiones: OK`);
};
