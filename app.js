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
const recommendationRaceIcon = document.getElementById("result-race-icon");
recommendationRaceIcon.addEventListener("load", () => { recommendationRaceIcon.hidden = false; });
recommendationRaceIcon.addEventListener("error", () => { recommendationRaceIcon.hidden = true; });
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
let racialBetaUpdates = new Map();
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
  AddonAdvisor.clear("race-addons");
  result.hidden = true;
  recommendationRaceIcon.hidden = true;
  recommendationRaceIcon.removeAttribute("src");
  for (const field of result.querySelectorAll("[data-field]")) field.textContent = "";
  document.getElementById("result-combination").textContent = "";
  document.getElementById("no-alternative").hidden = true;
  document.getElementById("alternative-profile").hidden = true;
  document.getElementById("alternative-use").textContent = "";
  document.getElementById("race-beta-updates").hidden = true;
  document.getElementById("race-beta-alternative").hidden = true;
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

// La actualización oficial de beta es una capa opcional: no modifica el Excel original.
function validateRacialBetaUpdates(data, profiles) {
  if (!data || data.schemaVersion !== 1 || data.fechaRevision !== "2026-10-22"
      || !data.fuente?.url?.startsWith("https://us.forums.blizzard.com/en/wow/")
      || !Array.isArray(data.razas) || data.razas.length !== profiles.size
      || !data.razas.every((row) => profiles.has(row.raza)
        && Array.isArray(row.cambios) && row.cambios.length > 0
        && row.cambios.every((text) => typeof text === "string" && text.trim()))) {
    return new Map();
  }
  const updates = new Map(data.razas.map((row) => [row.raza, row.cambios]));
  return updates.size === profiles.size ? updates : new Map();
}

function fillRacialBetaList(id, race) {
  const list = document.getElementById(id);
  const updates = racialBetaUpdates.get(race) || [];
  list.replaceChildren(...updates.map((description) => {
    const item = document.createElement("li");
    item.textContent = description;
    return item;
  }));
  return updates.length > 0;
}

function renderRaceBetaUpdates(record) {
  const main = fillRacialBetaList("race-beta-recommended-list", record.razaRecomendada);
  document.getElementById("race-beta-recommended-label").textContent =
    "Raza recomendada · " + record.razaRecomendada;
  const alternative = record.alternativa !== "-"
    && fillRacialBetaList("race-beta-alternative-list", record.alternativa);
  const alternativeView = document.getElementById("race-beta-alternative");
  alternativeView.hidden = !alternative;
  if (alternative) {
    document.getElementById("race-beta-alternative-label").textContent =
      "Alternativa · " + record.alternativa;
  } else {
    document.getElementById("race-beta-alternative-list").replaceChildren();
  }
  document.getElementById("race-beta-updates").hidden = !main && !alternative;
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
    const [advisor, profiles, updates] = await Promise.all([
      readJson("./data/race-advisor.json"),
      readJson("./data/racials.json"),
      readJson("./data/racial-beta-updates.json").catch(() => null),
    ]);
    racialProfiles = validateData(advisor, profiles);
    racialBetaUpdates = validateRacialBetaUpdates(updates, racialProfiles);
    records = advisor.fichas;
    setOptions(faction, uniqueValues(records, "faccion"), "Elige facción");
    setOptions(racialSelect, [...racialProfiles.keys()], "Elige raza");
    racialStatus.textContent = "Elige una raza para consultar su perfil.";
    loaded = true;
    status.textContent = "Elige una facción para comenzar.";
  } catch (error) {
    racialBetaUpdates = new Map();
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
  const iconUrl = self.WOW_ICON_MAP?.raza?.[record.razaRecomendada];
  if (iconUrl) recommendationRaceIcon.src = iconUrl;
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
  renderRaceBetaUpdates(record);
  result.hidden = false;
  AddonAdvisor.context("race-addons", { modulo: "race", clase: record.clase });
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
  document.getElementById("racial-beta-updates").hidden = true;
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
  document.getElementById("racial-beta-updates").hidden =
    !fillRacialBetaList("racial-beta-list", profile.raza);
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
  AddonAdvisor.clear("profession-addons");
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
      AddonAdvisor.context("profession-addons", { modulo: "profession", profesiones: [...record.principal, ...record.alternativa] });
      professionStatus.textContent = `Ficha disponible: ${record.clase}, ${record.especializacion}.`;
    });
    return button;
  }));
  professionStatus.textContent = rows.length ? "Elige una especialización." : "Elige una clase para comenzar.";
});
document.getElementById("retry-professions").addEventListener("click", loadProfessions);

// Talent Advisor: asesor editorial por clases. No asigna puntos automáticamente
// ni convierte notas provisionales de beta en builds completas.
const talentView = document.getElementById("talent-view");
const talentClass = document.getElementById("talent-class");
const talentSpec = document.getElementById("talent-spec");
const talentGoal = document.getElementById("talent-goal");
const talentResult = document.getElementById("talent-result");
const talentStatus = document.getElementById("talent-status");
const talentError = document.getElementById("talent-error");
const talentRetry = document.getElementById("retry-talents");
const talentSpecIcon = document.getElementById("talent-spec-icon");
talentSpecIcon.addEventListener("load", () => { talentSpecIcon.hidden = false; });
talentSpecIcon.addEventListener("error", () => { talentSpecIcon.hidden = true; });
let talentData = null;
let talentCatalog = new Map();
let talentLegacy = null;
let talentsLoading = false;
let talentsLoaded = false;

function validateTalentCatalog(catalog) {
  const goals = ["Subir al 60", "PvP", "Mazmorras"];
  const routeIsSafe = (route) => typeof route === "string"
    && /^\.\/data\/talent-advisor-[a-z]+\.json$/.test(route);
  if (!catalog || catalog.schemaVersion !== 1
      || JSON.stringify(catalog.objetivos) !== JSON.stringify(goals)
      || !Array.isArray(catalog.clases) || !catalog.clases.length
      || typeof catalog.fuenteLegado !== "string"
      || !catalog.clases.every((entry) => entry && typeof entry.nombre === "string"
        && self.WOW_ICON_MAP?.clase?.[entry.nombre] && routeIsSafe(entry.ruta))
      || new Set(catalog.clases.map((entry) => entry.nombre)).size !== catalog.clases.length
      || !catalog.clases.some((entry) => entry.nombre === catalog.fuenteLegado)) {
    throw new Error("Catálogo de clases de Talent Advisor no válido.");
  }
  return catalog;
}

function validateTalentData(data) {
  const goals = ["Subir al 60", "PvP", "Mazmorras"];
  const required = (value) => typeof value === "string" && value.trim().length > 0;
  const validList = (list) => Array.isArray(list) && list.length > 0 && list.every(required);
  if (!data || data.schemaVersion !== 1 || data.piloto !== true
      || !required(data.clase) || !self.WOW_ICON_MAP?.clase?.[data.clase]
      || data.estado !== "borrador_beta"
      || !required(data.versionCliente) || !required(data.fechaRevision)
      || !required(data.aviso)
      || !Array.isArray(data.objetivos) || JSON.stringify(data.objetivos) !== JSON.stringify(goals)
      || !Array.isArray(data.especializaciones) || data.especializaciones.length !== 3
      || new Set(data.especializaciones).size !== 3
      || !data.especializaciones.every((spec) => required(spec)
        && self.WOW_ICON_MAP?.especializacion?.[data.clase]?.[spec])
      || !Array.isArray(data.fichas) || data.fichas.length !== 9
      || !validList(data.obtenerPuntosLegado)
      || !Array.isArray(data.fuentes) || data.fuentes.length < 2
      || !data.fuentes.every((source) => required(source.nombre)
        && typeof source.url === "string" && /^https:\/\//.test(source.url))
      || !required(data.notaFuentes)) {
    throw new Error("Las fichas de talentos están incompletas.");
  }
  const keys = new Set();
  for (const row of data.fichas) {
    if (!row || !data.especializaciones.includes(row.especializacion)
        || !goals.includes(row.objetivo)
        || !["resumen", "motivo", "limitacion", "progreso"].every((field) => required(row[field]))
        || !validList(row.talentos)) {
      throw new Error("Una ficha de " + data.clase + " está incompleta.");
    }
    const key = JSON.stringify([row.especializacion, row.objetivo]);
    if (keys.has(key)) throw new Error("Existen recomendaciones duplicadas.");
    keys.add(key);
  }
  for (const spec of data.especializaciones) {
    for (const goal of goals) {
      if (!keys.has(JSON.stringify([spec, goal]))) {
        throw new Error("Falta una combinación de " + data.clase + ".");
      }
    }
  }
  if (data.legado) {
    for (const objetivo of goals) {
      const legacy = data.legado[objetivo];
      if (!legacy || !validList(legacy.ventajas)
          || !["descripcion", "advertencia", "consejo"].every((field) => required(legacy[field]))) {
        throw new Error("Los perfiles de Legado están incompletos.");
      }
    }
  }
  return data;
}

function replaceTalentList(id, entries) {
  document.getElementById(id).replaceChildren(...entries.map((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    return li;
  }));
}

function clearTalentResult() {
  AddonAdvisor.clear("talent-addons");
  talentResult.hidden = true;
  talentSpecIcon.hidden = true;
  talentSpecIcon.removeAttribute("src");
  for (const id of ["talent-result-title", "talent-build-info", "talent-overview",
    "talent-reason", "talent-limitation", "talent-legacy-intro",
    "talent-legacy-warning", "talent-legacy-tip", "talent-extra",
    "talent-version", "talent-source-note", "talent-advice-warning"]) {
    document.getElementById(id).textContent = "";
  }
  for (const id of ["talent-priorities", "talent-legacy-perks",
    "talent-legacy-points", "talent-sources"]) document.getElementById(id).replaceChildren();
}

function renderTalentResult() {
  clearTalentResult();
  if (!talentData || talentClass.dataset.value !== talentData.clase) return;
  const spec = talentSpec.dataset.value;
  const goal = talentGoal.dataset.value;
  const record = talentData.fichas.find((item) => item.especializacion === spec && item.objetivo === goal);
  const legacy = talentLegacy?.legado?.[goal];
  if (!record || !legacy) {
    talentStatus.textContent = "Elige especialización y objetivo para consultar las fichas.";
    return;
  }
  document.getElementById("talent-result-title").textContent = spec;
  document.getElementById("talent-build-info").textContent = `${talentData.clase} · ${spec} · ${goal}`;
  document.getElementById("talent-overview").textContent = record.resumen;
  replaceTalentList("talent-priorities", record.talentos);
  document.getElementById("talent-reason").textContent = record.motivo;
  document.getElementById("talent-limitation").textContent = record.limitacion;
  document.getElementById("talent-legacy-intro").textContent = legacy.descripcion;
  replaceTalentList("talent-legacy-perks", legacy.ventajas);
  document.getElementById("talent-legacy-warning").textContent = legacy.advertencia;
  document.getElementById("talent-legacy-tip").textContent = legacy.consejo;
  replaceTalentList("talent-legacy-points", talentData.obtenerPuntosLegado);
  document.getElementById("talent-extra").textContent = record.progreso;
  document.getElementById("talent-advice-warning").textContent = talentData.aviso;
  document.getElementById("talent-version").textContent =
    `Compilación beta ${talentData.versionCliente} · Revisión ${talentData.fechaRevision} · Pendiente de validar al nivel 60.`;
  document.getElementById("talent-source-note").textContent = talentData.notaFuentes;
  const sources = talentData.fuentes.map((source) => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.textContent = source.nombre;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    li.append(link);
    return li;
  });
  document.getElementById("talent-sources").replaceChildren(...sources);
  const icon = self.WOW_ICON_MAP?.especializacion?.[talentData.clase]?.[spec];
  if (icon) talentSpecIcon.src = icon;
  talentResult.hidden = false;
  AddonAdvisor.context("talent-addons", { modulo: "talent", clase: talentData.clase, especializacion: spec, objetivo: goal });
  talentStatus.textContent = `Ficha disponible: ${talentData.clase}, ${spec}, ${goal} (beta; pendiente de validar).`;
}

async function loadTalents() {
  if (talentsLoaded || talentsLoading) return;
  talentsLoading = true;
  const selector = document.getElementById("talent-selector");
  selector.setAttribute("aria-busy", "true");
  talentError.hidden = true;
  talentRetry.disabled = true;
  talentStatus.textContent = "Cargando fichas de talentos…";
  clearTalentResult();
  try {
    const catalog = validateTalentCatalog(await readJson("./data/talent-advisor-catalog.json"));
    const classes = await Promise.all(catalog.clases.map((entry) => readJson(entry.ruta)));
    const validated = classes.map((data, index) => {
      const entry = catalog.clases[index];
      const result = validateTalentData(data);
      if (result.clase !== entry.nombre) throw new Error("Catálogo y fichero no coinciden.");
      return result;
    });
    const nextMap = new Map(validated.map((data) => [data.clase, data]));
    const nextLegacy = nextMap.get(catalog.fuenteLegado);
    if (!nextLegacy?.legado) throw new Error("Falta la fuente común de Legado.");
    talentCatalog = nextMap;
    talentLegacy = nextLegacy;
    talentData = null;
    setOptions(talentClass, catalog.clases.map((entry) => entry.nombre), "Elige clase");
    setOptions(talentSpec, [], "Elige primero la clase");
    setOptions(talentGoal, [], "Elige primero una especialización");
    talentsLoaded = true;
    talentStatus.textContent = "Elige una clase para empezar.";
  } catch (error) {
    talentData = null;
    talentCatalog = new Map();
    talentLegacy = null;
    setOptions(talentClass, [], "Datos no disponibles");
    setOptions(talentSpec, [], "Elige primero la clase");
    setOptions(talentGoal, [], "Elige primero una especialización");
    talentError.hidden = false;
    talentStatus.textContent = "Fichas no disponibles.";
  } finally {
    talentsLoading = false;
    talentRetry.disabled = false;
    selector.setAttribute("aria-busy", "false");
  }
}

talentClass.addEventListener("change", () => {
  clearTalentResult();
  talentData = talentCatalog.get(talentClass.dataset.value) || null;
  talentSpec.dataset.iconClass = talentData?.clase || "";
  setOptions(talentSpec, talentData ? talentData.especializaciones : [], "Elige primero la clase");
  setOptions(talentGoal, [], "Elige primero una especialización");
  talentStatus.textContent = talentData ? "Elige especialización." : "Elige una clase para empezar.";
});

talentSpec.addEventListener("change", () => {
  clearTalentResult();
  const valid = talentData && talentData.especializaciones.includes(talentSpec.dataset.value)
    && talentClass.dataset.value === talentData.clase;
  setOptions(talentGoal, valid ? talentData.objetivos : [], "Elige primero una especialización");
  talentStatus.textContent = valid ? "Elige objetivo: subir al 60, PvP o mazmorras." : "Elige especialización.";
});

talentGoal.addEventListener("change", renderTalentResult);
talentRetry.addEventListener("click", loadTalents);

function showRoute(event) {
  const isAdvisor = window.location.hash === "#race-advisor";
  const isRacials = window.location.hash === "#raciales";
  const isProfession = window.location.hash === "#profession-advisor";
  const isTalent = window.location.hash === "#talent-advisor";
  const isAddon = window.location.hash === "#addon-advisor";
  document.getElementById("addon-view").hidden = !isAddon;
  homeView.hidden = isAdvisor || isRacials || isProfession || isTalent || isAddon;
  professionView.hidden = !isProfession;
  advisorView.hidden = !isAdvisor;
  racialView.hidden = !isRacials;
  talentView.hidden = !isTalent;
  document.title = isAddon ? "Addon Advisor | WoW Forever Advisor" : isTalent ? "Talent Advisor | WoW Forever Advisor"
    : isProfession ? "Profession Advisor | WoW Forever Advisor"
      : isRacials ? "Race Explorer | WoW Forever Advisor"
        : isAdvisor ? "Race Advisor | WoW Forever Advisor" : "WoW Forever Advisor";
  if (isAddon) {
    document.getElementById("addon-title").focus();
    AddonAdvisor.open();
  } else if (isTalent) {
    document.getElementById("talent-title").focus();
    loadTalents();
  } else if (isProfession) {
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

form.addEventListener("submit", (event) => event.preventDefault());
retryButton.addEventListener("click", loadData);
document.getElementById("retry-racials").addEventListener("click", loadData);
document.getElementById("retry-addons").addEventListener("click", AddonAdvisor.open);
window.addEventListener("hashchange", showRoute);
showRoute();
