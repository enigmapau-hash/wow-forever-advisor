"use strict";

if ("serviceWorker" in navigator && window.isSecureContext) {
  const cacheIcons = () => {
    if (!navigator.onLine) return;
    navigator.serviceWorker.ready.then((registration) => {
      registration.active?.postMessage({ type: "CACHE_WOW_ICONS" });
    }).catch(() => {});
  };
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", {
      scope: "./",
      updateViaCache: "none",
    }).then(cacheIcons).catch((error) => {
      console.warn("No se pudo activar el modo sin conexión.", error);
    });
  });
  navigator.serviceWorker.addEventListener("controllerchange", cacheIcons);
  window.addEventListener("online", cacheIcons);
}

const homeView = document.getElementById("home-view");
const advisorView = document.getElementById("advisor-view");
const form = document.getElementById("advisor-form");
const faction = document.getElementById("faction");
const characterClass = document.getElementById("character-class");
const specialization = document.getElementById("specialization");
const result = document.getElementById("advisor-result");
const status = document.getElementById("selection-status");
const dataError = document.getElementById("data-error");
const retryButton = document.getElementById("retry-data");
const racialView = document.getElementById("racial-view");
const racialSelect = document.getElementById("racial-race");
const racialResult = document.getElementById("racial-result");
const racialStatus = document.getElementById("racial-status");
const racialError = document.getElementById("racial-error");
let records = [];
let racialProfiles = new Map();
let loading = false;
let loaded = false;

// Los nombres coinciden con los JSON y el inventario. En especializaciones
// la clase distingue nombres compartidos (Sagrado, Protección, Restauración).
function optionButton(value, kind, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.value = value;
  button.dataset.iconKind = kind;
  button.dataset.iconName = value;
  if (className) button.dataset.iconClass = className;
  button.setAttribute("aria-pressed", "false");
  const icon = kind === "especializacion"
    ? self.WOW_ICON_MAP?.especializacion?.[className]?.[value]
    : self.WOW_ICON_MAP?.[kind]?.[value];
  if (icon) {
    const image = document.createElement("img");
    image.className = "option-icon";
    image.src = icon;
    image.alt = ""; // Decorativo: el nombre de la opción sigue accesible.
    image.width = 40;
    image.height = 40;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => image.remove(), { once: true });
    button.append(image);
  }
  const label = document.createElement("span");
  label.className = "option-label";
  label.textContent = value;
  button.append(label);
  return button;
}

function selectOption(group, value) {
  const buttons = [...group.querySelectorAll("button")];
  group.dataset.value = buttons.some((button) => button.dataset.value === value) ? value : "";
  for (const button of buttons) {
    button.setAttribute("aria-pressed", String(button.dataset.value === group.dataset.value));
  }
  group.dispatchEvent(new Event("change", { bubbles: true }));
}

function setOptions(group, values, placeholder) {
  group.dataset.value = "";
  group.querySelector(".option-buttons").replaceChildren(...values.map((value) => {
    const button = optionButton(value, group.dataset.iconKind, group.dataset.iconClass);
    button.addEventListener("click", () => selectOption(group, value));
    return button;
  }));
  group.disabled = values.length === 0;
  group.querySelector(".option-prompt").textContent = values.length ? "" : placeholder;
}

function clearResult() {
  result.hidden = true;
  for (const field of result.querySelectorAll("[data-field]")) field.textContent = "";
  document.getElementById("result-combination").textContent = "";
  document.getElementById("no-alternative").hidden = true;
  document.getElementById("alternative-profile").hidden = true;
  document.getElementById("alternative-use").textContent = "";
}

function uniqueValues(rows, field) {
  return [...new Set(rows.map((row) => row[field]))];
}

async function readJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`No se pudo leer ${path}: ${response.status}`);
  return response.json();
}

function validateData(advisor, profiles) {
  if (advisor.schemaVersion !== 1 || profiles.schemaVersion !== 1
      || !advisor.fuente?.sha256 || advisor.fuente.sha256 !== profiles.fuente?.sha256
      || !Array.isArray(advisor.fichas) || !advisor.fichas.length
      || !Array.isArray(profiles.raciales) || !profiles.raciales.length) {
    throw new Error("Los archivos no pertenecen a la misma exportación validada.");
  }
  const recordFields = ["faccion", "clase", "especializacion", "razaRecomendada", "alternativa", "prioridad", "motivoPrincipal", "explicacion"];
  const profileFields = ["raza", "fortalezas", "debilidades", "escalaUtilidad", "comentarios", "usoPrincipal"];
  const complete = (row, fields) => row && fields.every((key) => typeof row[key] === "string" && row[key].length > 0);
  if (!advisor.fichas.every((row) => complete(row, recordFields))
      || !profiles.raciales.every((row) => complete(row, profileFields))) {
    throw new Error("La exportación contiene campos incompletos.");
  }
  const races = new Map(profiles.raciales.map((row) => [row.raza, row]));
  const keys = advisor.fichas.map((row) => JSON.stringify([row.faccion, row.clase, row.especializacion]));
  if (races.size !== profiles.raciales.length || new Set(keys).size !== keys.length
      || !advisor.fichas.every((row) => ["Alianza", "Horda"].includes(row.faccion)
        && races.has(row.razaRecomendada) && (row.alternativa === "-" || races.has(row.alternativa)))) {
    throw new Error("La exportación contiene duplicados o referencias incompletas.");
  }
  return races;
}

async function loadData() {
  if (loaded || loading) return;
  loading = true;
  form.setAttribute("aria-busy", "true");
  dataError.hidden = true;
  retryButton.disabled = true;
  status.textContent = "Cargando las fichas del Excel…";
  racialError.hidden = true;
  racialStatus.textContent = "Cargando perfiles raciales…";
  clearResult();
  try {
    const [advisor, profiles] = await Promise.all([
      readJson("./data/race-advisor.json"),
      readJson("./data/racials.json"),
    ]);
    racialProfiles = validateData(advisor, profiles);
    records = advisor.fichas;
    setOptions(faction, uniqueValues(records, "faccion"), "Elige facción");
    setOptions(racialSelect, [...racialProfiles.keys()], "Elige raza");
    racialStatus.textContent = "Elige una raza para consultar su perfil.";
    loaded = true;
    status.textContent = "Elige una facción para comenzar.";
  } catch (error) {
    setOptions(faction, [], "Datos no disponibles");
    setOptions(characterClass, [], "Elige primero una facción");
    setOptions(specialization, [], "Elige primero una clase");
    status.textContent = "Fichas no disponibles.";
    dataError.hidden = false;
    setOptions(racialSelect, [], "Datos no disponibles");
    racialError.hidden = false;
    racialStatus.textContent = "Perfiles no disponibles.";
  } finally {
    loading = false;
    retryButton.disabled = false;
    form.setAttribute("aria-busy", "false");
  }
}

faction.addEventListener("change", () => {
  clearResult();
  const rows = records.filter((row) => row.faccion === faction.dataset.value);
  setOptions(characterClass, uniqueValues(rows, "clase"), faction.dataset.value ? "Elige clase" : "Elige primero una facción");
  setOptions(specialization, [], "Elige primero una clase");
  status.textContent = faction.dataset.value ? "Elige una clase." : "Elige una facción para comenzar.";
});

characterClass.addEventListener("change", () => {
  clearResult();
  const rows = records.filter((row) => row.faccion === faction.dataset.value && row.clase === characterClass.dataset.value);
  specialization.dataset.iconClass = characterClass.dataset.value;
  setOptions(specialization, uniqueValues(rows, "especializacion"), characterClass.dataset.value ? "Elige especialización" : "Elige primero una clase");
  status.textContent = characterClass.dataset.value ? "Elige una especialización." : "Elige una clase.";
});

specialization.addEventListener("change", () => {
  clearResult();
  const matches = records.filter((row) => row.faccion === faction.dataset.value
    && row.clase === characterClass.dataset.value && row.especializacion === specialization.dataset.value);
  if (matches.length !== 1) {
    status.textContent = "Elige una especialización válida para consultar la ficha.";
    return;
  }
  const record = matches[0];
  const profile = racialProfiles.get(record.razaRecomendada);
  for (const field of result.querySelectorAll("[data-field]")) {
    const key = field.dataset.field;
    field.textContent = Object.hasOwn(record, key) ? record[key] : profile[key];
  }
  document.getElementById("result-combination").textContent = [record.faccion, record.clase, record.especializacion].join(" · ");
  document.getElementById("no-alternative").hidden = record.alternativa !== "-";
  if (record.alternativa !== "-") {
    const alternative = racialProfiles.get(record.alternativa);
    document.getElementById("alternative-use").textContent = alternative.usoPrincipal;
    document.getElementById("alternative-profile").hidden = false;
  }
  result.hidden = false;
  status.textContent = `Ficha disponible: ${record.faccion}, ${record.clase}, ${record.especializacion}.`;
});

function renderRacialMatches(listId, emptyId, field) {
  const list = document.getElementById(listId);
  const matches = records.filter((row) => row[field] === racialSelect.dataset.value);
  list.replaceChildren(...matches.map((record) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.className = "back-link";
    link.href = "#race-advisor";
    link.textContent = [record.faccion, record.clase, record.especializacion].join(" · ");
    link.addEventListener("click", (event) => {
      event.preventDefault();
      for (const [select, value] of [
        [faction, record.faccion],
        [characterClass, record.clase],
        [specialization, record.especializacion],
      ]) {
        selectOption(select, value);
      }
      window.location.hash = "race-advisor";
    });
    item.append(link);
    return item;
  }));
  list.hidden = matches.length === 0;
  document.getElementById(emptyId).hidden = matches.length > 0;
}

racialSelect.addEventListener("change", () => {
  racialResult.hidden = true;
  document.getElementById("racial-name").textContent = "";
  for (const field of racialResult.querySelectorAll("[data-racial-field]")) field.textContent = "";
  renderRacialMatches("racial-recommended", "racial-no-recommended", "razaRecomendada");
  renderRacialMatches("racial-alternative", "racial-no-alternative", "alternativa");
  const profile = racialProfiles.get(racialSelect.dataset.value);
  if (!profile) {
    racialStatus.textContent = "Elige una raza para consultar su perfil.";
    return;
  }
  document.getElementById("racial-name").textContent = profile.raza;
  for (const field of racialResult.querySelectorAll("[data-racial-field]")) {
    field.textContent = profile[field.dataset.racialField];
  }
  racialResult.hidden = false;
  racialStatus.textContent = `Perfil disponible: ${profile.raza}.`;
});

const professionView = document.getElementById("profession-view");
const professionClass = document.getElementById("profession-class");
const professionButtons = document.getElementById("profession-buttons");
const professionResult = document.getElementById("profession-result");
const professionStatus = document.getElementById("profession-status");
let professionRecords = [];
let professionsLoading = false;
let professionsLoaded = false;

function clearProfessionResult() {
  professionResult.hidden = true;
  document.getElementById("profession-combination").textContent = "";
  for (const field of professionResult.querySelectorAll("[data-profession-field]")) field.textContent = "";
}

async function loadProfessions() {
  if (professionsLoaded || professionsLoading) return;
  professionsLoading = true;
  const selector = document.getElementById("profession-selector");
  const error = document.getElementById("profession-error");
  const retry = document.getElementById("retry-professions");
  selector.setAttribute("aria-busy", "true");
  error.hidden = true;
  retry.disabled = true;
  professionStatus.textContent = "Cargando profesiones…";
  try {
    const data = await readJson("./data/profession-advisor.json");
    const rows = data.fichas;
    const textFields = ["clase", "especializacion", "motivoPrincipal", "limitacion"];
    if (data.schemaVersion !== 1 || !Array.isArray(rows) || rows.length !== 27
        || !rows.every((row) => row && textFields.every((key) => typeof row[key] === "string" && row[key].trim())
          && ["principal", "alternativa"].every((key) => Array.isArray(row[key]) && row[key].length === 2
            && row[key].every((value) => typeof value === "string" && value.trim())))
        || uniqueValues(rows, "clase").length !== 9
        || new Set(rows.map((row) => JSON.stringify([row.clase, row.especializacion]))).size !== 27
        || !uniqueValues(rows, "clase").every((name) => rows.filter((row) => row.clase === name).length === 3)) {
      throw new Error("Fichas de profesiones incompletas o duplicadas.");
    }
    professionRecords = rows;
    setOptions(professionClass, uniqueValues(rows, "clase"), "Elige clase");
    professionsLoaded = true;
    professionStatus.textContent = "Elige una clase para comenzar.";
  } catch (error) {
    setOptions(professionClass, [], "Datos no disponibles");
    professionStatus.textContent = "Profesiones no disponibles.";
    document.getElementById("profession-error").hidden = false;
  } finally {
    professionsLoading = false;
    retry.disabled = false;
    selector.setAttribute("aria-busy", "false");
  }
}

professionClass.addEventListener("change", () => {
  clearProfessionResult();
  const rows = professionRecords.filter((row) => row.clase === professionClass.dataset.value);
  document.getElementById("profession-specializations").hidden = rows.length === 0;
  professionButtons.replaceChildren(...rows.map((record) => {
    const button = optionButton(record.especializacion, "especializacion", record.clase);
    button.addEventListener("click", () => {
      for (const sibling of professionButtons.children) sibling.setAttribute("aria-pressed", String(sibling === button));
      for (const field of professionResult.querySelectorAll("[data-profession-field]")) {
        const value = record[field.dataset.professionField];
        field.textContent = Array.isArray(value) ? value.join(" + ") : value;
      }
      document.getElementById("profession-combination").textContent = `${record.clase} · ${record.especializacion}`;
      professionResult.hidden = false;
      professionStatus.textContent = `Ficha disponible: ${record.clase}, ${record.especializacion}.`;
    });
    return button;
  }));
  professionStatus.textContent = rows.length ? "Elige una especialización." : "Elige una clase para comenzar.";
});
document.getElementById("profession-advisor").addEventListener("click", () => {
  window.location.hash = "profession-advisor";
});
document.getElementById("retry-professions").addEventListener("click", loadProfessions);

function showRoute(event) {
  const isAdvisor = window.location.hash === "#race-advisor";
  const isRacials = window.location.hash === "#raciales";
  const isProfession = window.location.hash === "#profession-advisor";
  homeView.hidden = isAdvisor || isRacials || isProfession;
  professionView.hidden = !isProfession;
  advisorView.hidden = !isAdvisor;
  racialView.hidden = !isRacials;
  document.title = isProfession ? "Profession Advisor | WoW Forever Advisor" : isRacials ? "Raciales | WoW Forever Advisor"
    : isAdvisor ? "Race Advisor | WoW Forever Advisor" : "WoW Forever Advisor";
  if (isProfession) {
    document.getElementById("profession-title").focus();
    loadProfessions();
  } else if (isAdvisor) {
    document.getElementById("advisor-title").focus();
    loadData();
  } else if (isRacials) {
    document.getElementById("racial-title").focus();
    loadData();
  } else if (event) {
    document.getElementById("race-advisor").focus({ preventScroll: true });
  }
  window.scrollTo(0, 0);
}

document.getElementById("race-advisor").addEventListener("click", () => {
  window.location.hash = "race-advisor";
});
form.addEventListener("submit", (event) => event.preventDefault());
retryButton.addEventListener("click", loadData);
document.getElementById("retry-racials").addEventListener("click", loadData);
window.addEventListener("hashchange", showRoute);
showRoute();
