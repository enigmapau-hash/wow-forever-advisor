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
      select.value = value;
      select.dispatchEvent(new win.Event("change", { bubbles: true }));
    };
    const options = (select) => [...select.options].map((option) => option.value).filter(Boolean).sort();
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
      check(characterClass.value === "" && spec.value === "" && spec.disabled && result.hidden, `${key}: limpiar al cambiar facción`);
      check([...result.querySelectorAll("[data-field]")].every((field) => field.textContent === ""), `${key}: sin texto residual`);
      const factionRows = advisor.fichas.filter((row) => row.faccion === record.faccion);
      check(sameOptions(characterClass, factionRows.map((row) => row.clase)), `${key}: clases exactas`);
      choose(characterClass, record.clase);
      check(spec.value === "" && !spec.disabled && result.hidden, `${key}: limpiar al cambiar clase`);
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
    check(!options(characterClass).includes("Paladín") && characterClass.value === "" && spec.disabled && result.hidden,
      "Alianza / Paladín no debe persistir en Horda");
    choose(characterClass, "Guerrero");
    choose(spec, "Armas");
    choose(characterClass, "Mago");
    check(!options(spec).includes("Armas") && spec.value === "" && result.hidden, "Armas no debe persistir al cambiar a Mago");
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
    check(!result.hidden && faction.value === "Alianza" && spec.value === "Armas", "Navegación atrás conserva una selección coherente");
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
