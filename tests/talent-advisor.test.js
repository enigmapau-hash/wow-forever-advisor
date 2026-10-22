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
  const check = (condition, message) => {
    assertions += 1;
    if (!condition) throw new Error(message);
  };
  try {
    const [catalog, warrior, paladin] = await Promise.all([
      fetch("../data/talent-advisor-catalog.json").then((r) => r.json()),
      fetch("../data/talent-advisor-warrior.json").then((r) => r.json()),
      fetch("../data/talent-advisor-paladin.json").then((r) => r.json()),
    ]);
    const sources = [warrior, paladin];
    check(catalog.clases.length === 2, "El catálogo incluye dos clases");
    await new Promise((resolve) => {
      frame.addEventListener("load", resolve, { once: true });
      frame.src = "../index.html?talent-test=" + Date.now();
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
      check(Boolean(item), "Opción disponible: " + value);
      item.click();
      check(item.getAttribute("aria-pressed") === "true" && group.dataset.value === value,
        "Opción seleccionada: " + value);
    };
    check(view.hidden, "Talent Advisor debe comenzar oculto");
    check(doc.getElementById("profession-view").hidden && doc.getElementById("advisor-view").hidden,
      "Otras vistas ocultas al inicio");
    doc.getElementById("talent-advisor").click();
    await waitFor(() => !klass.disabled || !doc.getElementById("talent-error").hidden);
    check(doc.getElementById("talent-error").hidden, "Carga el catálogo y las fichas sin errores");
    check(!view.hidden && doc.getElementById("home-view").hidden, "Abre Talent Advisor de forma exclusiva");
    check(result.hidden && spec.disabled && goal.disabled, "Sin resultado antes de elegir clase");
    check(JSON.stringify([...klass.querySelectorAll("button")].map((el) => el.dataset.value))
      === JSON.stringify(catalog.clases.map((el) => el.nombre)), "Clases del catálogo exactas");

    const formats = new Set();
    for (const data of sources) {
      choose(klass, data.clase);
      check(!spec.disabled && goal.disabled, "La clase habilita especializaciones");
      check(spec.dataset.iconClass === data.clase, "Iconos de especialización ligados a clase");
      check([...spec.querySelectorAll("button")].length === 3, "Tres especializaciones");
      for (const name of data.especializaciones) {
        choose(spec, name);
        check(goal.dataset.value === "" && result.hidden,
          "Cambiar especialización limpia resultado");
        for (const objective of data.objetivos) {
          choose(goal, objective);
          check(!result.hidden, "La recomendación se muestra");
          const record = data.fichas.find((ficha) =>
            ficha.especializacion === name && ficha.objetivo === objective);
          formats.add(data.clase + "|" + record.especializacion + "|" + record.objetivo);
          check(doc.getElementById("talent-overview").textContent === record.resumen, "Resumen editorial exacto");
          check(doc.getElementById("talent-reason").textContent === record.motivo, "Razón exacta");
          check(doc.getElementById("talent-limitation").textContent === record.limitacion, "Limitación exacta");
          check(doc.getElementById("talent-extra").textContent === record.progreso, "Progreso adicional exacto");
          check(doc.getElementById("talent-build-info").textContent.includes(data.clase),
            "Clase correcta en ficha");
          check(JSON.stringify([...doc.querySelectorAll("#talent-priorities li")].map((li) => li.textContent))
            === JSON.stringify(record.talentos), "Lista de talentos exacta");
          check(JSON.stringify([...doc.querySelectorAll("#talent-legacy-perks li")].map((li) => li.textContent))
            === JSON.stringify(warrior.legado[objective].ventajas), "Legado común por objetivo");
          check(doc.getElementById("talent-legacy-warning").textContent
            === warrior.legado[objective].advertencia, "Advertencia de Legado exacta");
          check(JSON.stringify([...doc.querySelectorAll("#talent-legacy-points li")].map((li) => li.textContent))
            === JSON.stringify(data.obtenerPuntosLegado), "Obtención de Legado específica de clase");
          check(doc.getElementById("talent-advice-warning").textContent === data.aviso,
            "Advertencia beta de la clase");
          check(doc.getElementById("talent-version").textContent.includes(data.versionCliente),
            "Versión de beta visible");
          check(doc.getElementById("talent-spec-icon").getAttribute("src")
            === win.WOW_ICON_MAP.especializacion[data.clase][record.especializacion],
            "Icono exacto de la clase y especialización");
          check(!doc.getElementById("talent-result").textContent.includes("51/51"),
            "No simula repartos definitivos");
        }
      }
    }
    check(formats.size === 18, "Dieciocho fichas independientes");
    choose(klass, "Guerrero");
    check(result.hidden && spec.dataset.value === "" && goal.dataset.value === "",
      "Cambiar clase limpia la selección previa");
    choose(spec, "Armas");
    choose(goal, "PvP");
    check(!result.hidden && doc.getElementById("talent-build-info").textContent.includes("Guerrero"),
      "El Guerrero sigue funcionando después de consultar Paladín");
    doc.getElementById("talent-back-home").click();
    await waitFor(() => view.hidden && !doc.getElementById("home-view").hidden);
    check(true, "Vuelve al inicio");
    report.textContent = "OK: " + assertions +
      " comprobaciones, 18 fichas, 2 clases, 3 objetivos y Legado común.";
  } catch (error) {
    report.textContent = "ERROR: " + error.message + " (" + assertions + " comprobaciones)";
  } finally {
    button.disabled = false;
  }
});
