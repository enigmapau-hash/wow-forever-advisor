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
      const display = (text) => text === "Elfo" ? "Elfo de la noche" : text
        .replace(/, denominado Elfo en la base/g, "")
        .replace(/\bFrente a Elfo\b/g, "Frente al elfo de la noche")
        .replace(/\bde Elfo\b/g, "del elfo de la noche")
        .replace(/\bElfo ofrece\b/g, "El elfo de la noche ofrece")
        .replace(/\bElfo conserva\b/g, "El elfo de la noche conserva");
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
        ensure(explanation.textContent === display(row.explicacion) && explanation.hidden, "Explicación original conservada");
        ensure(document.getElementById("primary-analysis").getClientRects().length > 0
          && document.getElementById("primary-key-reason").textContent === display(row.motivoPrincipal),
          "Análisis y decisión visibles en secciones distintas");
        ensure(alternative.hidden === (alt === "-"), "Sin tarjeta vacía");
        const noAlternative = document.getElementById("alternative-empty");
        ensure(noAlternative.hidden === (alt !== "-"), "Motivo de alternativa ausente");
        ensure(Boolean(main.querySelector('[data-field="motivoPrincipal"]').hidden), "Motivo fuente conservado sin duplicarse visualmente");
        ensure(Boolean(document.getElementById("primary-analysis").getClientRects().length), "Justificación visible");
        ensure(noAlternative.compareDocumentPosition(main.querySelector("#primary-reason-label")) & Node.DOCUMENT_POSITION_FOLLOWING,
          "Aviso de alternativa ausente cerca de cabecera");
        ensure(document.getElementById("primary-profile-link").dataset.race === row.razaRecomendada,
          "Perfil principal enlazado a Race Explorer");
        ensure(main.querySelector("#result-race").closest("a")?.id === "primary-profile-link",
          "La imagen y el nombre comparten el enlace racial");
        ensure(document.getElementById("primary-profile") === null
          && document.getElementById("alternative-details") === null,
          "No hay desplegables con textos raciales repetidos");
        const sources = document.getElementById("race-beta-updates");
        const addons = document.getElementById("race-addons");
        ensure(Boolean(addons.compareDocumentPosition(sources) & Node.DOCUMENT_POSITION_FOLLOWING),
          "Fuentes después de addons");
        if (alt !== "-") {
          ensure(alternative.querySelector('[data-field="alternativa"]').textContent === display(alt), "Alternativa intacta");
          ensure(document.getElementById("alternative-race-icon").getAttribute("src") === self.WOW_ICON_MAP.raza[alt], "Icono de alternativa correcto");
          ensure(document.getElementById("alternative-use").textContent.trim().length > 0, "Alternativa explicada");
          ensure(document.getElementById("alternative-scope").textContent ===
            (extra ? "En esta especialización" : "Ventaja racial general"), "Alcance de la alternativa honesto");
          ensure(document.getElementById("alternative-race-link").dataset.race === alt
            && alternative.querySelector("#alternative-name").closest("a")?.id === "alternative-race-link",
            "Imagen y nombre de alternativa enlazados");
          for (const id of ["compare-primary-pro", "compare-primary-con",
            "compare-alternative-pro", "compare-alternative-con"]) {
            ensure(document.getElementById(id).textContent.length > 0, "Argumento comparativo: " + id);
          }
          const summary = document.getElementById("race-comparison-conclusion-text").textContent;
          ensure(summary.length > 70 && summary.includes(display(row.razaRecomendada))
            && summary.includes(display(alt)),
            "Una conclusión con ambas razas para " + row.especializacion);
          ensure(document.getElementById("race-comparison-conclusion-title").textContent
            === "Conclusión para " + row.especializacion,
            "Título ajustado a la especialización");
          ensure(Boolean(document.getElementById("race-comparison").compareDocumentPosition(addons)
            & Node.DOCUMENT_POSITION_FOLLOWING), "Comparativa antes de addons");
          const a = main.getBoundingClientRect(), b = alternative.getBoundingClientRect();
          ensure(width < 960 ? b.top >= a.bottom : b.left >= a.right, `Jerarquía responsive ${width}`);
          ensure(width < 960 || (a.width >= b.width * 1.8 && a.right <= b.left + 1),
            "Principal ocupa aproximadamente dos tercios y alternativa queda a la derecha");
        } else {
          ensure(!document.getElementById("alternative-race-icon").hasAttribute("src"), "Sin icono ficticio o residual");
          ensure(document.getElementById("race-comparison").hidden
            && document.getElementById("race-comparison-conclusion-text").textContent === "",
            "Sin comparativa ni conclusión cuando no existe una alternativa");
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
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [id, value] of [["faction", "Alianza"], ["character-class", "Guerrero"], ["specialization", "Armas"]]) {
    await page.locator(`#${id} button[data-value="${value}"]`).click();
  }
  await page.waitForFunction(() => document.activeElement?.id === "result-race");
  assert.equal(await page.locator("#advisor-result").evaluate(el => {
    const top = el.getBoundingClientRect().top;
    return top >= 0 && top < window.innerHeight;
  }), true, "El resultado es visible y recibe foco al elegir especialización en móvil");
  const raceProfileLink = page.locator("#primary-profile-link");
  await raceProfileLink.focus();
  await page.keyboard.press("Enter");
  await page.locator("#racial-result").waitFor();
  assert.equal(await page.locator("#racial-name").textContent(), "Gnomo",
    "Enlace accesible al perfil de la raza principal");
  await page.goto(base + "/#race-advisor");
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
      if (!document.querySelector(".profession-choice-main [data-profession-field='principal']")
          || !document.querySelector(".profession-choice-alternative [data-profession-field='alternativa']")) {
        throw new Error("Profesiones sin jerarquía principal/alternativa");
      }
      for (const field of document.querySelectorAll("[data-profession-field]")) {
        const value = row[field.dataset.professionField];
        if (field.textContent !== (Array.isArray(value) ? value.join(" + ") : value)) throw new Error("Profesiones alteradas");
      }
    }
    return data.fichas.length;
  });
  assert.equal(professions, 27);
  console.log(`v36 ${offline ? "offline" : "320/390/820/1280px"}: 54 fichas, jerarquía, alternativas, iconos y 27 profesiones: OK`);
};
