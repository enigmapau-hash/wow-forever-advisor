"use strict";

const button = document.getElementById("run-talent-tests");
const report = document.getElementById("talent-test-report");
const frame = document.getElementById("talent-app-under-test");

async function waitFor(condition) {
  const deadline = Date.now() + 7000;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error("Tiempo de espera agotado");
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
}

button.addEventListener("click", async () => {
  button.disabled = true;
  report.textContent = "Ejecutando…";
  let assertions = 0;
  const check = (test, detail) => {
    assertions += 1;
    if (!test) throw new Error(detail);
  };
  try {
    const response = await fetch("../data/talent-advisor-warrior.json");
    if (!response.ok) throw new Error("JSON del piloto no disponible");
    const data = await response.json();
    await new Promise((resolve) => {
      frame.addEventListener("load", resolve, { once: true });
      frame.src = `../index.html?talent-test=${Date.now()}`;
    });
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    const view = doc.getElementById("talent-view");
    const klass = doc.getElementById("talent-class");
    const spec = doc.getElementById("talent-spec");
    const goal = doc.getElementById("talent-goal");
    const result = doc.getElementById("talent-result");
    const choose = (group, value) => {
      const item = [...group.querySelectorAll("button")].find((candidate) => candidate.dataset.value === value);
      check(Boolean(item), `Opción disponible: ${value}`);
      item.click();
      check(item.getAttribute("aria-pressed") === "true" && group.dataset.value === value,
        `Opción seleccionada: ${value}`);
    };
    check(view.hidden, "Talent Advisor debe comenzar oculto");
    check(doc.getElementById("profession-view").hidden && doc.getElementById("advisor-view").hidden,
      "Otras vistas ocultas en inicio");
    doc.getElementById("talent-advisor").click();
    await waitFor(() => !klass.disabled || !doc.getElementById("talent-error").hidden);
    check(!doc.getElementById("talent-error").hidden, "Carga el piloto sin errores");
    check(!view.hidden && doc.getElementById("home-view").hidden,
      "Abre Talent Advisor de forma exclusiva");
    check(result.hidden && spec.disabled && goal.disabled, "Sin resultado antes de elegir");
    choose(klass, "Guerrero");
    check(!spec.disabled && goal.disabled, "La clase habilita especializaciones");
    check([...spec.querySelectorAll("button")].length === 3, "Tres especializaciones");
    const formats = new Set();
    for (const name of data.especializaciones) {
      choose(spec, name);
      check(goal.dataset.value === "" && result.hidden, "Cambiar especialización limpia resultado");
      for (const objective of data.objetivos) {
        choose(goal, objective);
        check(!result.hidden, "La recomendación se muestra");
        const record = data.fichas.find((ficha) =>
          ficha.especializacion === name && ficha.objetivo === objective);
        formats.add(record.especializacion + "|" + record.objetivo);
        check(doc.getElementById("talent-overview").textContent === record.resumen, "Resumen editorial exacto");
        check(doc.getElementById("talent-reason").textContent === record.motivo, "Razón exacta");
        check(doc.getElementById("talent-limitation").textContent === record.limitacion, "Limitación exacta");
        check(doc.getElementById("talent-extra").textContent === record.progreso, "Consejo adicional exacto");
        check(JSON.stringify([...doc.querySelectorAll("#talent-priorities li")].map(li => li.textContent))
          === JSON.stringify(record.talentos), "Talentos exactos");
        check(JSON.stringify([...doc.querySelectorAll("#talent-legacy-perks li")].map(li => li.textContent))
          === JSON.stringify(data.legado[objective].ventajas), "Legado por objetivo exacto");
        check(doc.getElementById("talent-legacy-warning").textContent
          === data.legado[objective].advertencia, "Advertencia de Legado exacta");
        check(doc.getElementById("talent-advice-warning").textContent === data.aviso,
          "Siempre se avisa de que es beta");
        check(doc.getElementById("talent-version").textContent.includes(data.versionCliente),
          "Versión visible");
        check(doc.getElementById("talent-spec-icon").getAttribute("src")
          === win.WOW_ICON_MAP.especializacion.Guerrero[record.especializacion],
          "Icono de la especialización correcta");
        check(!doc.getElementById("talent-result").textContent.includes("51/51"),
          "No simula repartos validados");
      }
    }
    check(formats.size === 9, "Nueve configuraciones independientes");
    choose(spec, "Armas");
    check(result.hidden && goal.dataset.value === "", "Sin mezcla de objetivos antiguos");
    choose(goal, "PvP");
    check(!result.hidden, "Se recupera ficha tras elegir objetivo");
    doc.getElementById("talent-back-home").click();
    await waitFor(() => view.hidden && !doc.getElementById("home-view").hidden);
    check(true, "Vuelve al inicio");
    report.textContent = `OK: ${assertions} comprobaciones, 9 combinaciones, 3 objetivos y Legado.`;
  } catch (error) {
    report.textContent = `ERROR: ${error.message} (${assertions} comprobaciones)`;
  } finally {
    button.disabled = false;
  }
});
