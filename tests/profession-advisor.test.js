"use strict";

document.getElementById("run-tests").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const report = document.getElementById("test-report");
  button.disabled = true;
  report.textContent = "Ejecutando…";
  let assertions = 0;
  const check = (condition, message) => {
    assertions += 1;
    if (!condition) throw new Error(message);
  };
  const waitFor = async (condition) => {
    const deadline = Date.now() + 6000;
    while (!condition()) {
      if (Date.now() > deadline) throw new Error("Tiempo de espera agotado");
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
  };
  try {
    const data = await fetch("../data/profession-advisor.json").then((response) => response.json());
    const frame = document.getElementById("app-under-test");
    await new Promise((resolve) => {
      frame.addEventListener("load", resolve, { once: true });
      frame.src = `../index.html?profession-test=${Date.now()}`;
    });
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    const select = doc.getElementById("profession-class");
    const result = doc.getElementById("profession-result");
    const choose = (element, value) => {
      const option = [...element.querySelectorAll("button")].find((item) => item.dataset.value === value);
      if (option) option.click();
      else win.selectOption(element, value);
      check([...element.querySelectorAll("button")].every((item) => item.getAttribute("aria-pressed")
        === String(item.dataset.value === element.dataset.value)), "Selección accesible exclusiva");
    };
    doc.getElementById("profession-advisor").click();
    await waitFor(() => !select.disabled);
    check(!doc.getElementById("profession-view").hidden && doc.getElementById("home-view").hidden, "Abrir desde inicio");
    const classes = [...new Set(data.fichas.map((row) => row.clase))];
    check(classes.length === 9 && data.fichas.length === 27, "Nueve clases y 27 fichas");
    const expectedClasses = ["Brujo", "Cazador", "Chamán", "Druida", "Guerrero",
      "Mago", "Paladín", "Pícaro", "Sacerdote"];
    check(JSON.stringify([...select.querySelectorAll("button")].map((option) => option.dataset.value))
      === JSON.stringify(expectedClasses), "Profession Advisor: orden alfabético común de nueve clases");
    check(JSON.stringify([...classes].sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }))) === JSON.stringify(expectedClasses),
      "Mismas nueve clases del JSON; solo cambia el orden de los botones");
    check(doc.querySelectorAll("select").length === 0 && select.querySelectorAll("button").length === 9, "Nueve botones de clase y ningún desplegable");
    for (const name of classes) {
      choose(select, name);
      check(result.hidden && [...result.querySelectorAll("[data-profession-field]")].every((field) => field.textContent === ""), "Cambiar clase limpia la ficha");
      const rows = data.fichas.filter((row) => row.clase === name);
      const buttons = [...doc.querySelectorAll("#profession-buttons button")];
      check(buttons.length === 3 && JSON.stringify(buttons.map((item) => item.textContent)) === JSON.stringify(rows.map((row) => row.especializacion)), "Tres botones originales");
      check(buttons.every((item) => item.getAttribute("aria-pressed") === "false"), "Sin especialización preseleccionada");
      for (const [index, row] of rows.entries()) {
        buttons[index].click();
        check(!result.hidden && doc.getElementById("profession-combination").textContent === `${name} · ${row.especializacion}`, "Ficha seleccionada visible");
        check(row.estado === "provisional" && doc.getElementById("profession-editorial-note").textContent.includes("Orientación provisional"),
          "Estado y alcance editorial de profesión visibles");
        check(buttons.every((item, i) => item.getAttribute("aria-pressed") === String(i === index)), "Botón activo exclusivo");
        for (const field of result.querySelectorAll("[data-profession-field]")) {
          const value = row[field.dataset.professionField];
          check(field.textContent === (Array.isArray(value) ? value.join(" + ") : value), "Texto original: " + field.dataset.professionField);
        }
        const mainReason = doc.getElementById("profession-main-reason");
        const altReason = doc.getElementById("profession-alt-reason");
        check(mainReason.textContent.trim().length > 25 && altReason.textContent.trim().length > 25,
          "Cada pareja tiene una explicación con contenido");
        check(mainReason.textContent !== altReason.textContent,
          "Las razones distinguen las dos parejas");
        check(doc.getElementById("profession-shared-reason") === null,
          "No se acumulan dos opciones en un único párrafo");
        check(mainReason.closest(".profession-choice-main") !== null
          && altReason.closest(".profession-choice-alternative") !== null,
          "Cada motivo aparece debajo de su pareja");
      }
    }
    choose(select, "");
    check(result.hidden && doc.getElementById("profession-specializations").hidden, "Vaciar selección");
    choose(select, classes[0]);
    doc.querySelector("#profession-buttons button").click();
    doc.getElementById("profession-back-home").click();
    await waitFor(() => !doc.getElementById("home-view").hidden);
    check(doc.getElementById("profession-view").hidden, "Volver al inicio");
    win.history.back();
    await waitFor(() => !doc.getElementById("profession-view").hidden);
    check(!result.hidden && select.dataset.value === classes[0], "Atrás conserva selección");
    await new Promise((resolve) => {
      frame.addEventListener("load", resolve, { once: true });
      win.location.reload();
    });
    await waitFor(() => !frame.contentDocument.getElementById("profession-class").disabled);
    check(!frame.contentDocument.getElementById("profession-view").hidden && frame.contentDocument.getElementById("profession-result").hidden, "Recarga directa sin ficha residual");
    report.textContent = `OK: 27/27 combinaciones, ${assertions} comprobaciones. Textos, botones y navegación correctos.`;
  } catch (error) {
    report.textContent = `ERROR: ${error.message} (${assertions} comprobaciones)`;
  } finally {
    button.disabled = false;
  }
});
