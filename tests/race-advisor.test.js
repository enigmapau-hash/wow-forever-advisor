"use strict";

const display = (text) => text === "Elfo" ? "Elfo de la noche" : text
  .replace(/, denominado Elfo en la base/g, "")
  .replace(/\bFrente a Elfo\b/g, "Frente al elfo de la noche")
  .replace(/\bde Elfo\b/g, "del elfo de la noche")
  .replace(/\bElfo ofrece\b/g, "El elfo de la noche ofrece")
  .replace(/\bElfo conserva\b/g, "El elfo de la noche conserva");

const runButton = document.getElementById("run-tests");
const report = document.getElementById("test-report");
const frame = document.getElementById("app-under-test");

const shownAlternative = (row) => row.alternativa !== "-" ? row.alternativa
  : row.faccion === "Alianza" && row.clase === "Chamán"
    ? "Sin alternativa: Enano es la única raza de Chamán de Alianza."
    : row.faccion === "Horda" && row.clase === "Paladín"
      ? "Sin alternativa: No-muerto es la única raza de Paladín de Horda."
      : "Alternativa pendiente de evaluación.";

async function waitFor(condition) {
  const deadline = Date.now() + 6000;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error("Tiempo de espera agotado");
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
}

runButton.addEventListener("click", async () => {
  runButton.disabled = true;
  report.textContent = "Ejecutando…";
  let assertions = 0;
  const check = (condition, message) => {
    assertions += 1;
    if (!condition) throw new Error(message);
  };
  try {
    const [advisor, profiles, additions, druidAlt, priestCorrection] = await Promise.all([
      fetch("../data/race-advisor.json").then((response) => response.json()),
      fetch("../data/racials.json").then((response) => response.json()),
      fetch("../data/race-advisor-additions.json").then((response) => response.json()),
      fetch("../data/race-advisor-druid-alternatives.json").then((response) => response.json()),
      fetch("../data/race-advisor-priest-horde-alternative.json").then((response) => response.json()),
    ]);
    const updatedRows = advisor.fichas.map((row) => {
      const alt = druidAlt.fichas.find((x) => x.faccion === row.faccion
        && x.clase === row.clase && x.especializacion === row.especializacion);
      if (alt) return { ...row, alternativa: "Cielonato",
        usoAlternativa: alt.usoAlternativa, motivoComparacion: alt.motivoComparacion };
      if (row.faccion === priestCorrection.faccion && row.clase === priestCorrection.clase
          && row.especializacion === priestCorrection.especializacion) {
        return { ...row, alternativa: priestCorrection.alternativa,
          explicacion: priestCorrection.explicacion };
      }
      return row;
    });
    const allRows = [...updatedRows, ...additions.fichas];
    await new Promise((resolve) => {
      frame.addEventListener("load", resolve, { once: true });
      frame.src = `../index.html?test=${Date.now()}`;
    });
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    const faction = doc.getElementById("faction");
    const characterClass = doc.getElementById("character-class");
    const spec = doc.getElementById("specialization");
    const result = doc.getElementById("advisor-result");
    const choose = (select, value) => {
      const option = [...select.querySelectorAll("button")].find((item) => item.dataset.value === value);
      if (option) option.click();
      else win.selectOption(select, value);
      check([...select.querySelectorAll("button")].every((item) => item.getAttribute("aria-pressed")
        === String(item.dataset.value === select.dataset.value)), "Selección accesible exclusiva");
    };
    const options = (select) => [...select.querySelectorAll("button")].map((option) => option.dataset.value).sort();
    const sameOptions = (select, values) => JSON.stringify(options(select)) === JSON.stringify([...new Set(values)].sort());
    check(doc.getElementById("advisor-view").hidden, "La aplicación debe abrir en inicio");
    check([...doc.querySelectorAll(".available-modules .module-link")].length === 4
      && [...doc.querySelectorAll(".available-modules .module-link")].every((link) => link.tagName === "A"),
      "Cuatro tarjetas con enlaces nativos y sin botones duplicados");
    doc.getElementById("race-advisor").click();
    await waitFor(() => !faction.disabled || !doc.getElementById("data-error").hidden);
    check(doc.getElementById("data-error").hidden, "Los datos deben cargarse");
    check(advisor.fichas.length === 51, "El Excel conserva 51 fichas originales");
    check(additions.fichas.length === 3 && allRows.length === 54,
      "Las tres especializaciones de Paladín Horda se añaden sin alterar las 51 originales");
    check(win.validateRaceAdditions(additions, advisor, new Map(profiles.raciales.map(r => [r.raza, r]))).length === 3,
      "La capa adicional se valida y tiene procedencia original trazada");
    const sky = await fetch("../data/skyborne.json").then((response) => response.json());
    check(win.validateDruidAlternatives(druidAlt, advisor, sky).length === 6,
      "Las seis alternativas de Druida cumplen los criterios editoriales aprobados");
    check(advisor.fichas.filter((row) => row.clase === "Druida").every((row) => row.alternativa === "-"),
      "El Excel conserva las seis alternativas originales sin modificar");
    check(win.validatePriestHordeAlternative(priestCorrection, advisor,
      new Map(profiles.raciales.map(r => [r.raza, r])))?.alternativa === "No-muerto",
      "Única corrección aprobada de Sacerdote Sagrado validada con el archivo original");
    check(sameOptions(faction, allRows.map((row) => row.faccion)), "Facciones exactas");
    check(characterClass.disabled && spec.disabled && result.hidden, "Estado inicial encadenado");
    const expectedClasses = ["Brujo", "Cazador", "Chamán", "Druida", "Guerrero",
      "Mago", "Paladín", "Pícaro", "Sacerdote"];
    for (const side of ["Alianza", "Horda"]) {
      choose(faction, side);
      check(JSON.stringify([...characterClass.querySelectorAll("button")].map((item) => item.dataset.value))
        === JSON.stringify(expectedClasses),
        `Orden alfabético idéntico en Race Advisor para ${side}, incluido Paladín Horda`);
    }
    let missingAlternatives = 0;
    for (const record of allRows) {
      const key = [record.faccion, record.clase, record.especializacion].join(" / ");
      choose(faction, record.faccion);
      check(characterClass.dataset.value === "" && spec.dataset.value === "" && spec.disabled && result.hidden, `${key}: limpiar al cambiar facción`);
      check([...result.querySelectorAll("[data-field]")].every((field) => field.textContent === ""), `${key}: sin texto residual`);
      const factionRows = allRows.filter((row) => row.faccion === record.faccion);
      check(sameOptions(characterClass, factionRows.map((row) => row.clase)), `${key}: clases exactas`);
      choose(characterClass, record.clase);
      check(spec.dataset.value === "" && !spec.disabled && result.hidden, `${key}: limpiar al cambiar clase`);
      check(sameOptions(spec, factionRows.filter((row) => row.clase === record.clase).map((row) => row.especializacion)), `${key}: especializaciones exactas`);
      choose(spec, record.especializacion);
      check(!result.hidden, `${key}: resultado visible`);
      const raceIcon = doc.getElementById("result-race-icon");
      check(raceIcon.getAttribute("src") === win.WOW_ICON_MAP.raza[record.razaRecomendada]
        && raceIcon.alt === "", `${key}: icono racial correcto y decorativo`);
      const profile = profiles.raciales.find((row) => row.raza === record.razaRecomendada);
      for (const field of result.querySelectorAll("[data-field]")) {
        const name = field.dataset.field;
        const expected = name === "alternativa" ? shownAlternative(record)
          : (Object.hasOwn(record, name) ? record[name] : profile[name]);
        check(field.textContent === display(expected), `${key}: texto literal de ${name}`);
      }
      const priestHoly = record.faccion === "Horda" && record.clase === "Sacerdote"
        && record.especializacion === "Sagrado";
      const incompatible = priestHoly && record.alternativa === "Tauren";
      check(doc.getElementById("alternative-profile").hidden === (record.alternativa === "-" || incompatible),
        `${key}: la ficha de alternativa solo se muestra cuando existe`);
      check(doc.querySelector('[data-field="motivoPrincipal"]').hidden
        && doc.getElementById("primary-analysis").getClientRects().length > 0
        && !doc.getElementById("primary-key-reason").hidden,
        `${key}: el motivo original se conserva sin duplicar la explicación visible`);
      check(doc.getElementById("alternative-empty").hidden === (record.alternativa !== "-" && !incompatible),
        `${key}: la ausencia de alternativa aparece junto a la cabecera`);
      check(doc.getElementById("race-comparison").hidden === (record.alternativa === "-" || incompatible),
        `${key}: comparar solo cuando hay dos razas`);
      check(doc.getElementById("primary-profile-link").dataset.race === record.razaRecomendada,
        `${key}: el perfil general se consulta en Race Explorer`);
      check(doc.getElementById("primary-ability-name").textContent.trim().length > 4,
        `${key}: se identifica la facultad racial principal`);
      if (record.alternativa !== "-" && !incompatible) {
        const contextual = record.alternativa === "Cielonato";
        check(doc.getElementById("alternative-scope").textContent ===
          (contextual ? "En esta especialización" : "")
          && doc.getElementById("alternative-scope").hidden === !contextual,
          `${key}: solo se muestra alcance cuando la evaluación es especializada`);
        check(doc.getElementById("alternative-race-link").dataset.race === record.alternativa,
          `${key}: alternativa enlazada a su perfil completo`);
        const abilityName = doc.getElementById("alternative-ability-name").textContent;
        const explanation = doc.getElementById("alternative-explanation").textContent;
        check(abilityName.trim().length > 4,
          `${key}: habilidad racial alternativa identificada`);
        check(explanation.startsWith(abilityName + " ") && explanation.endsWith("."),
          `${key}: la explicación comienza por la habilidad racial exacta`);
        check(doc.getElementById("alternative-use").textContent.trim().length > 20,
          `${key}: resumen de utilidad visible antes de la explicación`);
        check(doc.getElementById("alternative-use").compareDocumentPosition(
          doc.getElementById("alternative-explanation")) & Node.DOCUMENT_POSITION_FOLLOWING,
          `${key}: orden visible habilidad, resumen y explicación`);
        check(doc.getElementById("race-comparison-conclusion-text").querySelectorAll("p").length === 2,
          `${key}: conclusión dividida por raza`);
      }
      if (priestHoly) {
        check(!incompatible && record.alternativa === "No-muerto",
          `${key}: la alternativa aprobada es No-muerto`);
        check(doc.getElementById("compare-alternative-pro").textContent.includes("Dark Sacrifice"),
          `${key}: se consideran facultades exclusivas de Sacerdote no-muerto`);
        check(!doc.getElementById("primary-analysis").textContent.includes("Frente a Tauren"),
          `${key}: explicación ajustada sin modificar el Excel`);
      }
      check(doc.getElementById("no-alternative") === null
        && doc.getElementById("race-addition-note") === null,
        `${key}: no hay mensajes duplicados de raza única`);
      if (record.clase === "Druida") {
        const comparisonPro = doc.getElementById("compare-alternative-pro").textContent;
        const summary = doc.getElementById("alternative-use").textContent;
        const explanation = doc.getElementById("alternative-explanation").textContent;
        check(comparisonPro !== summary && comparisonPro !== explanation
          && !comparisonPro.includes("sin reemplazar")
          && !comparisonPro.includes("pendiente de verificar"),
          `${key}: los seis Druidas evitan duplicar el argumento en la comparativa`);
        check(doc.getElementById("alternative-ability-name").textContent ===
          (record.faccion === "Alianza" ? "Read Ley Line" : "Skysight"),
          `${key}: Cielonato usa la habilidad exacta de su facción`);
        check(doc.getElementById("alternative-details") === null,
          `${key}: sin segundo párrafo repetido ni comparativa desplegable`);
      } else {
        check(!doc.getElementById("alternative-use").textContent.includes("Wind Blessed"), `${key}: sin comparación de Druida ajena`);
      }
      if (record.alternativa === "-") missingAlternatives += 1;
      choose(spec, "");
      check(result.hidden, `${key}: selección incompleta sin resultado`);
      check(raceIcon.hidden && !raceIcon.hasAttribute("src"), `${key}: sin icono antiguo al limpiar`);
      check(doc.getElementById("alternative-explanation").textContent === "",
        `${key}: sin explicación residual de la alternativa anterior`);
    }
    check(missingAlternatives === 6, "3 Chamán Alianza + 3 Paladín Horda sin segunda raza jugable");

    choose(faction, "Alianza");
    choose(characterClass, "Paladín");
    choose(spec, "Sagrado");
    choose(faction, "Horda");
    check(options(characterClass).includes("Paladín") && characterClass.dataset.value === ""
      && spec.disabled && result.hidden,
      "El Paladín está en ambas facciones, pero cambiar de facción limpia el estado");
    choose(characterClass, "Paladín");
    check(sameOptions(spec, ["Sagrado", "Protección", "Reprensión"]),
      "Paladín Horda dispone de tres especializaciones");
    choose(spec, "Sagrado");
    check(!result.hidden && doc.querySelector('[data-field="razaRecomendada"]').textContent === "No-muerto"
      && doc.querySelector('[data-field="alternativa"]').textContent ===
        "Sin alternativa: No-muerto es la única raza de Paladín de Horda.",
      "Paladín Horda Sagrado muestra No-muerto y ausencia de alternativa");
    choose(characterClass, "Guerrero");
    choose(spec, "Armas");
    choose(characterClass, "Mago");
    check(!options(spec).includes("Armas") && spec.dataset.value === "" && result.hidden, "Armas no debe persistir al cambiar a Mago");
    choose(spec, "Especialización inexistente");
    check(result.hidden, "Una selección inválida no debe mostrar otra ficha");
    choose(faction, "");
    check(characterClass.disabled && spec.disabled && result.hidden, "Vaciar facción restablece toda la selección");

    for (const corrupt of [
      { ...advisor, fichas: [...advisor.fichas, advisor.fichas[0]] },
      { ...advisor, fuente: { sha256: "fuente distinta" } },
      { ...advisor, fichas: [{ ...advisor.fichas[0], razaRecomendada: "Perfil ausente" }] },
    ]) {
      let rejected = false;
      try { win.validateData(corrupt, profiles); } catch { rejected = true; }
      check(rejected, "Rechazar datos ambiguos o incoherentes");
    }

    choose(faction, "Alianza");
    choose(characterClass, "Guerrero");
    choose(spec, "Armas");
    doc.getElementById("back-home").click();
    await waitFor(() => !doc.getElementById("home-view").hidden);
    check(doc.getElementById("advisor-view").hidden, "Volver al inicio");
    win.history.back();
    await waitFor(() => !doc.getElementById("advisor-view").hidden);
    check(!result.hidden && faction.dataset.value === "Alianza" && spec.dataset.value === "Armas", "Navegación atrás conserva una selección coherente");
    await new Promise((resolve) => {
      frame.addEventListener("load", resolve, { once: true });
      win.location.reload();
    });
    const reloaded = frame.contentDocument;
    await waitFor(() => !reloaded.getElementById("faction").disabled);
    check(!reloaded.getElementById("advisor-view").hidden, "Recarga directa de #race-advisor");
    check(reloaded.getElementById("advisor-result").hidden, "Una recarga no recupera un resultado sin selección");
    report.textContent = `OK: 51 fichas originales intactas + 3 Paladín Horda (54/54), 6 alternativas Druida con Cielonato, ${assertions} comprobaciones, 6 sin segunda raza. Perfiles y navegación correctos.`;
  } catch (error) {
    report.textContent = `ERROR: ${error.message} (${assertions} comprobaciones completadas)`;
  } finally {
    runButton.disabled = false;
  }
});

document.getElementById("run-racials").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  runButton.disabled = true;
  report.textContent = "Comprobando raciales…";
  let assertions = 0;
  const check = (condition, message) => {
    assertions += 1;
    if (!condition) throw new Error(message);
  };
  try {
    const [profiles, advisor, additions, druidAlt, priestCorrection] = await Promise.all([
      fetch("../data/racials.json").then((response) => response.json()),
      fetch("../data/race-advisor.json").then((response) => response.json()),
      fetch("../data/race-advisor-additions.json").then((response) => response.json()),
      fetch("../data/race-advisor-druid-alternatives.json").then((response) => response.json()),
      fetch("../data/race-advisor-priest-horde-alternative.json").then((response) => response.json()),
    ]);
    const updatedRows = advisor.fichas.map((row) => {
      const alt = druidAlt.fichas.find((x) => x.faccion === row.faccion
        && x.clase === row.clase && x.especializacion === row.especializacion);
      if (alt) return { ...row, alternativa: "Cielonato",
        usoAlternativa: alt.usoAlternativa, motivoComparacion: alt.motivoComparacion };
      if (row.faccion === priestCorrection.faccion && row.clase === priestCorrection.clase
          && row.especializacion === priestCorrection.especializacion) {
        return { ...row, alternativa: priestCorrection.alternativa,
          explicacion: priestCorrection.explicacion };
      }
      return row;
    });
    const allRows = [...updatedRows, ...additions.fichas];
    await new Promise((resolve) => {
      frame.addEventListener("load", resolve, { once: true });
      frame.src = `../index.html?racials-test=${Date.now()}#race-advisor`;
    });
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    const choose = (id, value) => {
      const select = doc.getElementById(id);
      const option = [...select.querySelectorAll("button")].find((item) => item.dataset.value === value);
      if (option) option.click();
      else win.selectOption(select, value);
      check([...select.querySelectorAll("button")].every((item) => item.getAttribute("aria-pressed")
        === String(item.dataset.value === select.dataset.value)), "Selección accesible exclusiva");
    };
    await waitFor(() => !doc.getElementById("faction").disabled);
    const original = advisor.fichas[0];
    choose("faction", original.faccion);
    choose("character-class", original.clase);
    choose("specialization", original.especializacion);
    check(doc.querySelector('[data-field="razaRecomendada"]').textContent === display(original.razaRecomendada),
      "El Race Advisor original sigue operativo");
    doc.getElementById("explore-racials").click();
    await waitFor(() => !doc.getElementById("racial-view").hidden);
    const select = doc.getElementById("racial-race");
    const result = doc.getElementById("racial-result");
    check(JSON.stringify([...select.querySelectorAll("button")].map((option) => option.dataset.value))
      === JSON.stringify([...profiles.raciales.map((profile) => profile.raza), "Cielonato"]), "Ocho perfiles originales más Cielonato");
    check(profiles.raciales.length === 8 && result.hidden, "Ocho perfiles, sin resultado inicial");
    check(advisor.fichas.length === 51 && allRows.length === 54,
      "Cruzar los ocho perfiles con 51 fichas originales y 3 complementarias");
    let recommended = 0;
    let alternatives = 0;
    for (const profile of profiles.raciales) {
      choose("racial-race", profile.raza);
      check(!result.hidden && doc.getElementById("racial-name").textContent === display(profile.raza), `Raza: ${profile.raza}`);
      for (const field of result.querySelectorAll("[data-racial-field]")) {
        check(field.textContent === display(profile[field.dataset.racialField]), `${profile.raza}: ${field.dataset.racialField} literal con etiqueta visible`);
      }
      for (const [listId, emptyId, field] of [
        ["racial-recommended", "racial-no-recommended", "razaRecomendada"],
        ["racial-alternative", "racial-no-alternative", "alternativa"],
      ]) {
        const expected = allRows.filter((row) => row[field] === profile.raza);
        const list = doc.getElementById(listId);
        const links = [...list.querySelectorAll("a")];
        const label = (row) => [row.faccion, row.clase, row.especializacion].join(" · ");
        check(JSON.stringify(links.map((link) => link.getAttribute("aria-label"))) === JSON.stringify(expected.map(label)),
          `${profile.raza}: coincidencias accesibles exactas en ${field}`);
        check(JSON.stringify(links.map((link) => link.textContent))
          === JSON.stringify(expected.map((row) => [row.clase, row.especializacion].join(" · "))),
          `${profile.raza}: enlaces agrupados sin repetir facción`);
        check(list.hidden === (expected.length === 0)
          && doc.getElementById(emptyId).hidden === (expected.length > 0)
          && doc.getElementById(emptyId).textContent.trim().length > 0, `${profile.raza}: estado vacío de ${field}`);
        for (const [index, link] of links.entries()) {
          const record = expected[index];
          link.click();
          await waitFor(() => !doc.getElementById("advisor-view").hidden);
          check(doc.getElementById("racial-view").hidden
            && doc.getElementById("faction").dataset.value === record.faccion
            && doc.getElementById("character-class").dataset.value === record.clase
            && doc.getElementById("specialization").dataset.value === record.especializacion
            && !doc.getElementById("advisor-result").hidden
            && doc.getElementById("result-combination").textContent === label(record), `${label(record)}: abrir ficha desde ${field}`);
          check([...doc.querySelectorAll("#advisor-result [data-field]")].every((element) => {
            const key = element.dataset.field;
            const racial = profiles.raciales.find((row) => row.raza === record.razaRecomendada);
            const expected = key === "alternativa" ? shownAlternative(record)
              : (Object.hasOwn(record, key) ? record[key] : racial[key]);
            return element.textContent === display(expected);
          }), `${label(record)}: ficha completa correspondiente`);
          doc.getElementById("explore-racials").click();
          await waitFor(() => !doc.getElementById("racial-view").hidden);
          check(select.dataset.value === profile.raza && !result.hidden, "Volver conserva la consulta racial");
        }
        if (field === "razaRecomendada") recommended += links.length;
        else alternatives += links.length;
      }
    }
    check(recommended === 54 && alternatives === 42,
      "54 recomendaciones (51 originales + 3 Paladín Horda) y 42 alternativas de las ocho razas originales");
    choose("racial-race", "Cielonato");
    const cieloAlternatives = [...doc.querySelectorAll("#skyborne-alternatives a")];
    check(cieloAlternatives.length === 6, "Seis alternativas Cielonato en Race Explorer");
    check(JSON.stringify(cieloAlternatives.map(link => link.getAttribute("aria-label"))) ===
      JSON.stringify(druidAlt.fichas.map(x => [x.faccion, x.clase, x.especializacion].join(" · "))),
      "Cielonato enlaza accesiblemente las seis combinaciones Druida");
    const skyLink = cieloAlternatives[0];
    skyLink.click();
    await waitFor(() => !doc.getElementById("advisor-view").hidden);
    check(doc.querySelector('[data-field="alternativa"]').textContent === "Cielonato",
      "Race Explorer enlaza con la alternativa de Druida");
    doc.getElementById("explore-racials").click();
    await waitFor(() => !doc.getElementById("racial-view").hidden);
    choose("faction", original.faccion);
    choose("character-class", original.clase);
    choose("specialization", original.especializacion);
    choose("racial-race", "");
    check(result.hidden && [...result.querySelectorAll("[data-racial-field]")].every((field) => field.textContent === ""),
      "Vaciar raza elimina el perfil anterior");
    check(!doc.querySelector("#racial-recommended li, #racial-alternative li"), "Vaciar raza elimina las coincidencias anteriores");
    doc.getElementById("back-selector").click();
    await waitFor(() => !doc.getElementById("advisor-view").hidden);
    check(doc.getElementById("specialization").dataset.value === original.especializacion
      && doc.querySelector('[data-field="razaRecomendada"]').textContent === display(original.razaRecomendada),
      "Volver al selector conserva la selección original");
    win.history.back();
    await waitFor(() => !doc.getElementById("racial-view").hidden);
    check(doc.getElementById("advisor-view").hidden, "Atrás vuelve a la consulta racial");
    await new Promise((resolve) => {
      frame.addEventListener("load", resolve, { once: true });
      win.location.reload();
    });
    await waitFor(() => !frame.contentDocument.getElementById("racial-race").disabled);
    check(!frame.contentDocument.getElementById("racial-view").hidden, "Recarga directa de #raciales");
    report.textContent = `OK: ocho perfiles × 54 fichas (51 originales), ${recommended} recomendaciones principales, ${alternatives} alternativas clásicas y 6 Cielonato, ${assertions} comprobaciones.`;
  } catch (error) {
    report.textContent = `ERROR: ${error.message} (${assertions} comprobaciones completadas)`;
  } finally {
    button.disabled = false;
    runButton.disabled = false;
  }
});

document.getElementById("run-navigation").addEventListener("click", async () => {
  const controls = [...document.querySelectorAll("body > button")];
  controls.forEach((button) => { button.disabled = true; });
  report.textContent = "Comprobando accesos…";
  let assertions = 0;
  const check = (condition, message) => {
    assertions += 1;
    if (!condition) throw new Error(message);
  };
  try {
    const advisor = await fetch("../data/race-advisor.json").then((response) => response.json());
    await new Promise((resolve) => {
      frame.addEventListener("load", resolve, { once: true });
      frame.src = `../index.html?navigation-test=${Date.now()}`;
    });
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    const visible = (id) => !doc.getElementById(id).hidden;
    // Optional addon hints load asynchronously and have their own regression suite.
    // Compare the full advisor content without those independently changing hints.
    const snapshot = (id) => {
      const copy = doc.getElementById(id).cloneNode(true);
      copy.querySelectorAll(".addon-context").forEach((node) => node.remove());
      return copy.textContent;
    };
    const open = async (id, view) => {
      doc.getElementById(id).click();
      await waitFor(() => visible(view));
    };
    const choose = (id, value) => {
      const button = [...doc.querySelectorAll(`#${id} button`)].find((item) => item.dataset.value === value);
      check(Boolean(button), `${id}: opción disponible`);
      button.click();
    };
    check(doc.querySelectorAll(".available-modules > li").length === 4, "Cuatro tarjetas disponibles");
    check(doc.getElementById("race-advisor").tagName === "A", "La tarjeta principal es un enlace accesible");
    check(doc.getElementById("profession-advisor").tagName === "A", "El enlace de profesión ocupa su tarjeta");
    check(doc.querySelectorAll("#profession-advisor").length === 1, "Un único acceso a profesiones");
    check(!doc.getElementById("future-title")
      && !doc.querySelector('[aria-labelledby="future-title"]')
      && !doc.getElementById("build-advisor")
      && !doc.getElementById("home-view").textContent.includes("Build Advisor"),
      "La portada no ofrece Build Advisor ni módulos futuros");
    check(doc.getElementById("home-explore-racials").getAttribute("href") === "#raciales", "Destino directo a raciales");
    check(doc.getElementById("racial-recommended-title").textContent === "Dónde se recomienda esta raza"
      && doc.getElementById("racial-alternative-title").textContent === "Dónde aparece como alternativa",
      "Race Explorer deja claro que las listas son combinaciones y no nuevas recomendaciones");
    await open("home-explore-racials", "racial-view");
    await waitFor(() => doc.querySelectorAll("#racial-race button").length === 9);
    check(doc.activeElement === doc.getElementById("racial-title"), "Foco en el título de raciales");
    const record = advisor.fichas[0];
    choose("racial-race", record.razaRecomendada);
    const racialText = doc.getElementById("racial-result").textContent;
    check(visible("racial-result"), "Perfil desde inicio");
    await open("back-selector", "advisor-view");
    check(!visible("advisor-result"), "Regreso al selector sin una ficha inventada");
    for (const [id, key] of [["faction", "faccion"], ["character-class", "clase"], ["specialization", "especializacion"]]) choose(id, record[key]);
    const raceText = snapshot("advisor-result");
    check(doc.getElementById("explore-racials").textContent === "Explorar las 9 razas →"
      && doc.getElementById("explore-racials").classList.contains("button-link"), "Acceso secundario visible");
    await open("explore-racials", "racial-view");
    check(doc.getElementById("racial-result").textContent === racialText, "Conservar perfil racial");
    await open("back-selector", "advisor-view");
    check(visible("advisor-result") && snapshot("advisor-result") === raceText, "Conservar ficha y selección de Race Advisor");
    await open("explore-racials", "racial-view");
    const label = [record.faccion, record.clase, record.especializacion].join(" · ");
    const link = [...doc.querySelectorAll("#racial-recommended a")].find((item) => item.getAttribute("aria-label") === label);
    check(Boolean(link), "Enlace a ficha concreta");
    link.click();
    await waitFor(() => visible("advisor-view"));
    check(doc.getElementById("result-combination").textContent === label && visible("advisor-result"), "Ficha concreta desde el perfil");
    await open("back-home", "home-view");
    await open("profession-advisor", "profession-view");
    await waitFor(() => doc.querySelectorAll("#profession-class button").length === 9);
    doc.querySelector("#profession-class button").click();
    doc.querySelector("#profession-buttons button").click();
    const professionText = snapshot("profession-result");
    check(visible("profession-result"), "Profession Advisor operativo");
    await open("profession-back-home", "home-view");
    await open("home-explore-racials", "racial-view");
    check(doc.getElementById("racial-result").textContent === racialText, "Conservar perfil al cambiar de módulo");
    await open("back-selector", "advisor-view");
    check(snapshot("advisor-result") === raceText, "Conservar ficha entre módulos");
    await open("back-home", "home-view");
    await open("profession-advisor", "profession-view");
    check(visible("profession-result") && snapshot("profession-result") === professionText, "Conservar resultado de profesiones");
    win.history.back();
    await waitFor(() => visible("home-view"));
    win.history.forward();
    await waitFor(() => visible("profession-view"));
    check(visible("profession-result") && snapshot("profession-result") === professionText, "Atrás y adelante conservan resultados");
    report.textContent = `OK: accesos y navegación, ${assertions} comprobaciones. Raciales, fichas y profesiones conservan sus selecciones y resultados.`;
  } catch (error) {
    report.textContent = `ERROR: ${error.message} (${assertions} comprobaciones)`;
  } finally {
    controls.forEach((button) => { button.disabled = false; });
  }
});
