"use strict";

const runButton = document.getElementById("run-tests");
const report = document.getElementById("test-report");
const frame = document.getElementById("app-under-test");

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
    const [advisor, profiles] = await Promise.all([
      fetch("../data/race-advisor.json").then((response) => response.json()),
      fetch("../data/racials.json").then((response) => response.json()),
    ]);
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
    doc.getElementById("race-advisor").click();
    await waitFor(() => !faction.disabled || !doc.getElementById("data-error").hidden);
    check(doc.getElementById("data-error").hidden, "Los datos deben cargarse");
    check(advisor.fichas.length === 51, "Se esperaban 51 fichas");
    check(sameOptions(faction, advisor.fichas.map((row) => row.faccion)), "Facciones exactas");
    check(characterClass.disabled && spec.disabled && result.hidden, "Estado inicial encadenado");
    let missingAlternatives = 0;
    for (const record of advisor.fichas) {
      const key = [record.faccion, record.clase, record.especializacion].join(" / ");
      choose(faction, record.faccion);
      check(characterClass.dataset.value === "" && spec.dataset.value === "" && spec.disabled && result.hidden, `${key}: limpiar al cambiar facción`);
      check([...result.querySelectorAll("[data-field]")].every((field) => field.textContent === ""), `${key}: sin texto residual`);
      const factionRows = advisor.fichas.filter((row) => row.faccion === record.faccion);
      check(sameOptions(characterClass, factionRows.map((row) => row.clase)), `${key}: clases exactas`);
      choose(characterClass, record.clase);
      check(spec.dataset.value === "" && !spec.disabled && result.hidden, `${key}: limpiar al cambiar clase`);
      check(sameOptions(spec, factionRows.filter((row) => row.clase === record.clase).map((row) => row.especializacion)), `${key}: especializaciones exactas`);
      choose(spec, record.especializacion);
      check(!result.hidden, `${key}: resultado visible`);
      const profile = profiles.raciales.find((row) => row.raza === record.razaRecomendada);
      for (const field of result.querySelectorAll("[data-field]")) {
        const name = field.dataset.field;
        const expected = Object.hasOwn(record, name) ? record[name] : profile[name];
        check(field.textContent === expected, `${key}: texto literal de ${name}`);
      }
      check(doc.getElementById("no-alternative").hidden === (record.alternativa !== "-"), `${key}: alternativa no facilitada`);
      if (record.alternativa === "-") missingAlternatives += 1;
      choose(spec, "");
      check(result.hidden, `${key}: selección incompleta sin resultado`);
    }
    check(missingAlternatives === 9, "Conservar las nueve alternativas no facilitadas");

    choose(faction, "Alianza");
    choose(characterClass, "Paladín");
    choose(spec, "Sagrado");
    choose(faction, "Horda");
    check(!options(characterClass).includes("Paladín") && characterClass.dataset.value === "" && spec.disabled && result.hidden,
      "Alianza / Paladín no debe persistir en Horda");
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
    report.textContent = `OK: 51/51 combinaciones, ${assertions} comprobaciones, 9 alternativas «-». Textos literales, perfiles, cambios de selección y navegación correctos.`;
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
    const [profiles, advisor] = await Promise.all([
      fetch("../data/racials.json").then((response) => response.json()),
      fetch("../data/race-advisor.json").then((response) => response.json()),
    ]);
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
    check(doc.querySelector('[data-field="razaRecomendada"]').textContent === original.razaRecomendada,
      "El Race Advisor original sigue operativo");
    doc.getElementById("explore-racials").click();
    await waitFor(() => !doc.getElementById("racial-view").hidden);
    const select = doc.getElementById("racial-race");
    const result = doc.getElementById("racial-result");
    check(JSON.stringify([...select.querySelectorAll("button")].map((option) => option.dataset.value))
      === JSON.stringify(profiles.raciales.map((profile) => profile.raza)), "Las ocho razas exactas del JSON");
    check(profiles.raciales.length === 8 && result.hidden, "Ocho perfiles, sin resultado inicial");
    check(advisor.fichas.length === 51, "Cruzar las ocho razas con las 51 fichas");
    let recommended = 0;
    let alternatives = 0;
    for (const profile of profiles.raciales) {
      choose("racial-race", profile.raza);
      check(!result.hidden && doc.getElementById("racial-name").textContent === profile.raza, `Raza: ${profile.raza}`);
      for (const field of result.querySelectorAll("[data-racial-field]")) {
        check(field.textContent === profile[field.dataset.racialField], `${profile.raza}: ${field.dataset.racialField} literal`);
      }
      for (const [listId, emptyId, field] of [
        ["racial-recommended", "racial-no-recommended", "razaRecomendada"],
        ["racial-alternative", "racial-no-alternative", "alternativa"],
      ]) {
        const expected = advisor.fichas.filter((row) => row[field] === profile.raza);
        const list = doc.getElementById(listId);
        const links = [...list.querySelectorAll("a")];
        const label = (row) => [row.faccion, row.clase, row.especializacion].join(" · ");
        check(JSON.stringify(links.map((link) => link.textContent)) === JSON.stringify(expected.map(label)),
          `${profile.raza}: coincidencias exactas en ${field}`);
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
            return element.textContent === (Object.hasOwn(record, key) ? record[key] : racial[key]);
          }), `${label(record)}: ficha completa correspondiente`);
          doc.getElementById("explore-racials").click();
          await waitFor(() => !doc.getElementById("racial-view").hidden);
          check(select.dataset.value === profile.raza && !result.hidden, "Volver conserva la consulta racial");
        }
        if (field === "razaRecomendada") recommended += links.length;
        else alternatives += links.length;
      }
    }
    check(recommended === 51 && alternatives === 42, "51 recomendaciones y 42 alternativas, sin incluir «-»");
    choose("faction", original.faccion);
    choose("character-class", original.clase);
    choose("specialization", original.especializacion);
    choose("racial-race", "");
    check(result.hidden && [...result.querySelectorAll("[data-racial-field]")].every((field) => field.textContent === ""),
      "Vaciar raza elimina el perfil anterior");
    check(!result.querySelector("li"), "Vaciar raza elimina las coincidencias anteriores");
    doc.getElementById("back-selector").click();
    await waitFor(() => !doc.getElementById("advisor-view").hidden);
    check(doc.getElementById("specialization").dataset.value === original.especializacion
      && doc.querySelector('[data-field="razaRecomendada"]').textContent === original.razaRecomendada,
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
    report.textContent = `OK: 8/8 razas × 51 fichas, ${recommended} recomendaciones y ${alternatives} alternativas, ${assertions} comprobaciones. Perfiles, navegación a cada coincidencia y selector correctos.`;
  } catch (error) {
    report.textContent = `ERROR: ${error.message} (${assertions} comprobaciones completadas)`;
  } finally {
    button.disabled = false;
    runButton.disabled = false;
  }
});
