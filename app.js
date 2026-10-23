"use strict";

document.getElementById("pwa-version").textContent = `PWA ${self.WOW_PWA_VERSION}`;

// Claves internas y texto editorial del Excel nunca se modifican.
function raceDisplayName(name) {
  return name === "Elfo" ? "Elfo de la noche" : name;
}

// Solo ajustes gramaticales muy concretos en textos visibles históricos.
// No sustituyas "Elfo" sin contexto: produciría expresiones incorrectas.
function raceProse(text) {
  return text
    .replace(/, denominado Elfo en la base/g, "")
    .replace(/\bFrente a Elfo\b/g, "Frente al elfo de la noche")
    .replace(/\bde Elfo\b/g, "del elfo de la noche")
    .replace(/\bElfo ofrece\b/g, "El elfo de la noche ofrece")
    .replace(/\bElfo conserva\b/g, "El elfo de la noche conserva");
}

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
const alternativeRaceIcon = document.getElementById("alternative-race-icon");
alternativeRaceIcon.addEventListener("load", () => { alternativeRaceIcon.hidden = false; });
alternativeRaceIcon.addEventListener("error", () => { alternativeRaceIcon.hidden = true; });
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
let raceAdditionSources = [];
let skyborneData = null;
const skyborneResult = document.getElementById("skyborne-result");
const skyborneFaction = document.getElementById("skyborne-faction");
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
  label.textContent = kind === "raza" ? raceDisplayName(value) : value;
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
  alternativeRaceIcon.hidden = true;
  alternativeRaceIcon.removeAttribute("src");
  for (const field of result.querySelectorAll("[data-field]")) field.textContent = "";
  document.getElementById("result-combination").textContent = "";
  document.getElementById("alternative-profile").hidden = true;
  document.getElementById("alternative-use").textContent = "";
  document.getElementById("alternative-scope").textContent = "";
  document.getElementById("alternative-detail-label").textContent = "Más información";
  document.getElementById("alternative-details").open = false;
  document.getElementById("alternative-detail-text").textContent = "";
  document.getElementById("alternative-empty").hidden = true;
  document.getElementById("alternative-empty").textContent = "";
  document.getElementById("primary-profile").open = false;
  document.getElementById("race-extra-sources").replaceChildren();
  document.getElementById("race-beta-updates").hidden = true;
  document.getElementById("race-beta-updates").open = false;
  status.classList.remove("visually-hidden");
  document.getElementById("race-beta-alternative").hidden = true;
}

function uniqueValues(rows, field) {
  return [...new Set(rows.map((row) => row[field]))];
}

// Solo orden visual: nunca reordena los JSON del Excel ni las fichas.
// La misma clase ocupa siempre la misma casilla en los tres asesores.
function alphabeticalClassNames(names) {
  return [...new Set(names)].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
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

// Capa complementaria independiente: el Excel maestro y sus 51 fichas siguen inmutables.
function validateRaceAdditions(data, advisor, profiles) {
  const expectedSpecs = ["Sagrado", "Protección", "Reprensión"];
  const required = ["faccion", "clase", "especializacion", "razaRecomendada",
    "alternativa", "prioridad", "motivoPrincipal", "explicacion"];
  if (!data || data.schemaVersion !== 1 || data.tipo !== "extension_editorial_no_modifica_excel"
      || data.base?.sha256 !== advisor.fuente?.sha256 || data.base?.fichas !== 51
      || advisor.fichas.length !== 51 || !Array.isArray(data.fuentes) || data.fuentes.length !== 2
      || !data.fuentes.every((source) => typeof source.nombre === "string"
        && /^https:\/\/(news\.blizzard\.com|us\.forums\.blizzard\.com)\//.test(source.url))
      || !Array.isArray(data.fichas) || data.fichas.length !== 3
      || !profiles.has("No-muerto")) {
    throw new Error("Falta una ampliación válida de Paladín de Horda.");
  }
  const seen = new Set(advisor.fichas.map((row) =>
    JSON.stringify([row.faccion, row.clase, row.especializacion])));
  const expanded = [];
  for (const spec of expectedSpecs) {
    const row = data.fichas.find((entry) => entry.especializacion === spec);
    if (!row || !required.every((key) => typeof row[key] === "string" && row[key].trim())
        || row.faccion !== "Horda" || row.clase !== "Paladín"
        || row.razaRecomendada !== "No-muerto" || row.alternativa !== "-"
        || /★/.test(row.prioridad)) {
      throw new Error("Ficha Paladín Horda incompleta o con valoración inventada.");
    }
    const key = JSON.stringify([row.faccion, row.clase, row.especializacion]);
    if (seen.has(key)) throw new Error("Ficha duplicada de Paladín Horda.");
    seen.add(key);
    expanded.push(row);
  }
  return expanded;
}

// Aprobación editorial limitada a Druida: sustituye SOLO la alternativa no evaluada.
// Todas las razas principales y los campos originales del Excel permanecen intactos.
function validateDruidAlternatives(data, advisor, skyborne) {
  if (!skyborne || !data) return []; // Si falla una capa adicional, conservar las 51 fichas originales.
  const specs = ["Equilibrio", "Feral", "Restauración"];
  const original = advisor.fichas.filter((row) => row.clase === "Druida");
  if (!data || data.schemaVersion !== 1 || data.tipo !== "evaluacion_editorial_druida"
      || data.estado !== "aprobado_usuario" || data.base?.sha256 !== advisor.fuente?.sha256
      || data.base?.fichas !== 51 || advisor.fichas.length !== 51
      || !Array.isArray(data.fichas) || data.fichas.length !== 6
      || original.length !== 6) throw new Error("Evaluación Druida incompleta.");
  const seen = new Set();
  for (const row of data.fichas) {
    const expected = original.find((r) => r.faccion === row.faccion
      && r.especializacion === row.especializacion);
    const variant = skyborne.variantes.find((v) => v.faccion === row.faccion);
    const key = JSON.stringify([row.faccion, row.especializacion]);
    if (!expected || !variant?.clases.includes("Druida") || seen.has(key)
        || !specs.includes(row.especializacion) || row.clase !== "Druida"
        || row.razaRecomendada !== expected.razaRecomendada || expected.alternativa !== "-"
        || (row.faccion === "Alianza" && row.razaRecomendada !== "Elfo")
        || (row.faccion === "Horda" && row.razaRecomendada !== "Tauren")
        || row.alternativa !== skyborne.raza
        || typeof row.usoAlternativa !== "string" || row.usoAlternativa.trim().length < 45
        || typeof row.motivoComparacion !== "string" || row.motivoComparacion.trim().length < 80) {
      throw new Error("Alternativa Druida incompatible o no justificada.");
    }
    seen.add(key);
  }
  return data.fichas;
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
    "Raza principal · " + raceDisplayName(record.razaRecomendada);
  const alternative = record.alternativa !== "-"
    && fillRacialBetaList("race-beta-alternative-list", record.alternativa);
  const alternativeView = document.getElementById("race-beta-alternative");
  alternativeView.hidden = !alternative;
  if (alternative) {
    document.getElementById("race-beta-alternative-label").textContent =
      "Alternativa · " + raceDisplayName(record.alternativa);
  } else {
    document.getElementById("race-beta-alternative-list").replaceChildren();
  }
  document.getElementById("race-beta-updates").hidden = !main && !alternative;
}

// Cielonato has its own beta schema. Keep the original eight-profile validator
// and original beta annotations scoped to their unchanged source data.
function validateSkyborneData(data) {
  try {
    const text = (value) => typeof value === "string" && value.trim().length > 0;
    if (!data || data.schemaVersion !== 1 || data.raza !== "Cielonato" || data.estado !== "beta"
        || !["pendiente", "verificado"].includes(data.revision?.estado)
        || !/^\d{4}-\d{2}-\d{2}$/.test(data.revision.fecha)
        || !text(data.icono?.nota) || data.icono.estado !== "enlace_cdn"
        || data.icono.url !== self.WOW_ICON_MAP?.raza?.Cielonato
        || !Array.isArray(data.icono.candidatos)
        || !data.icono.candidatos.some((candidate) => candidate.url === data.icono.url
          && candidate.http === 200 && /^https:\/\/wow\.zamimg\.com\/images\/wow\/icons\/large\/[a-z0-9_]+\.jpg$/.test(candidate.url))
        || data.evaluacion?.estado !== "pendiente"
        || !text(data.evaluacion.criterio) || !text(data.evaluacion.limitacion)
        || !Array.isArray(data.fuentes) || data.fuentes.length !== 3) return null;
    const sources = new Set(data.fuentes.map((source) => source.id));
    if (sources.size !== 3 || !data.fuentes.every((source) => {
      const url = new URL(source.url);
      return text(source.nombre) && url.protocol === "https:"
        && ["news.blizzard.com", "us.forums.blizzard.com"].includes(url.hostname);
    })) return null;
    const references = (row) => Array.isArray(row.fuentes) && row.fuentes.length > 0
      && row.fuentes.every((id) => sources.has(id));
    const ability = (row) => row && text(row.id) && text(row.nombre) && text(row.descripcion)
      && ["activa", "pasiva"].includes(row.tipo) && references(row);
    if (!Array.isArray(data.comunes) || data.comunes.length !== 3 || !data.comunes.every(ability)) return null;
    const common = new Map(data.comunes.map((row) => [row.id, row]));
    if (common.size !== 3 || common.get("wind-blessed")?.celeridadPorcentaje !== 3
        || common.get("walk-on-air")?.duracionSegundos !== 10
        || common.get("walk-on-air")?.reutilizacionSegundos !== 90
        || common.get("elemental-insight")?.danoContraElementalesPorcentaje !== 5) return null;
    const allowed = {
      Alianza: ["Guerrero", "Cazador", "Pícaro", "Druida", "Mago"],
      Horda: ["Guerrero", "Cazador", "Pícaro", "Druida", "Chamán"],
    };
    if (!Array.isArray(data.variantes) || data.variantes.length !== 2
        || new Set(data.variantes.map((row) => row.faccion)).size !== 2
        || !data.variantes.every((row) => allowed[row.faccion] && text(row.nombre) && references(row)
          && Array.isArray(row.clases) && row.clases.length === 5 && new Set(row.clases).size === 5
          && row.clases.every((name) => allowed[row.faccion].includes(name)) && ability(row.habilidad)
          && row.habilidad.lanzableEnMovimiento === true)) return null;
    const alliance = data.variantes.find((row) => row.faccion === "Alianza");
    const horde = data.variantes.find((row) => row.faccion === "Horda");
    if (alliance.habilidad.id !== "read-leyline" || alliance.habilidad.nombre !== "Read Ley Line"
        || alliance.habilidad.regeneracionPorcentaje !== 100
        || alliance.habilidad.duracionMinimaSegundos !== 30 || horde.habilidad.id !== "skysight"
        || horde.habilidad.movimientoPorcentaje !== 10 || Object.hasOwn(horde.habilidad, "monturaPorcentaje")) return null;
    return data;
  } catch { return null; }
}

function updateRacialCoverage(available = true) {
  const count = racialProfiles.size + (skyborneData ? 1 : 0);
  document.getElementById("explore-racials").textContent = available
    ? `Explorar las ${count} razas →` : "Abrir Race Explorer →";
  document.getElementById("racial-coverage-note").textContent = available
    ? (skyborneData
      ? "Nueve razas, incluido Cielonato con variantes de Alianza y Horda."
      : "Ocho razas disponibles. Cielonato no está disponible.")
    : "Perfiles raciales no disponibles.";
}

function skyborneVerification() {
  return skyborneData.revision.estado === "verificado"
    ? `Datos oficiales de beta · revisión ${skyborneData.revision.fecha}. No equivalen a confirmación de lanzamiento.`
    : "Datos de beta pendientes de contraste independiente con las fuentes oficiales. Facultades y compatibilidad por confirmar; valoración comparativa pendiente.";
}

// F05: mostrar el efecto vigente en la ficha; las notas históricas permanecen en Fuentes.
function skyborneAbilitySummary(ability) {
  switch (ability.id) {
    case "walk-on-air":
      return `Planeo controlado durante ${ability.duracionSegundos} s. Reutilización: ${ability.reutilizacionSegundos} s.`;
    case "wind-blessed":
      return `+${ability.celeridadPorcentaje} % de celeridad.`;
    case "read-leyline":
      return `+${ability.regeneracionPorcentaje} % de regeneración de salud y maná. Se puede lanzar en movimiento. Duración mínima: ${ability.duracionMinimaSegundos} s.`;
    case "skysight":
      return `+${ability.movimientoPorcentaje} % de velocidad de carrera. Se puede lanzar en movimiento.`;
    default:
      return ability.descripcion;
  }
}

function fillSkyborneAbilities(id, abilities) {
  document.getElementById(id).replaceChildren(...abilities.map((ability) => {
    const item = document.createElement("li");
    const name = document.createElement("strong");
    name.textContent = ability.nombre;
    item.append(name, ` · ${ability.tipo}: ${skyborneAbilitySummary(ability)}`);
    return item;
  }));
}

function prepareSkyborneExplorer() {
  setOptions(skyborneFaction, skyborneData.variantes.map((row) => row.faccion), "Elige una variante");
  document.getElementById("skyborne-verification").textContent = skyborneVerification();
  document.getElementById("skyborne-beta-note").textContent =
    "Facultades según notas de beta del 15/10/2026; sujetas a cambios.";
  fillSkyborneAbilities("skyborne-common", skyborneData.comunes);
  document.getElementById("skyborne-wind-history").textContent =
    `Historial de Wind Blessed: ${skyborneData.comunes.find((ability) => ability.id === "wind-blessed").descripcion}`;
  document.getElementById("skyborne-skysight-source").textContent =
    `Procedencia de Skysight: ${skyborneData.variantes.find((variant) => variant.faccion === "Horda").habilidad.descripcion}`;
  document.getElementById("skyborne-criterion").textContent = "Cielonato se ha evaluado como alternativa de Druida; no hay clasificación aprobada para otras clases.";
  document.getElementById("skyborne-limitation").textContent = "Pendiente de comprobar su rendimiento al nivel 60, la regeneración durante lanzamientos y la velocidad en formas druídicas.";
  document.getElementById("skyborne-sources").replaceChildren(...skyborneData.fuentes.map((source) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.textContent = source.nombre;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    item.append(link);
    return item;
  }));
}

skyborneFaction.addEventListener("change", () => {
  const variant = skyborneData?.variantes.find((row) => row.faccion === skyborneFaction.dataset.value);
  document.getElementById("skyborne-variant").hidden = !variant;
  for (const id of ["skyborne-variant-title", "skyborne-classes", "skyborne-ability-title", "skyborne-ability"]) {
    document.getElementById(id).textContent = "";
  }
  const variantStatus = document.getElementById("skyborne-status");
  variantStatus.textContent = variant
    ? `Variante seleccionada: ${variant.faccion} · ${variant.nombre}.`
    : "Elige Alianza o Horda para consultar sus diferencias.";
  variantStatus.classList.toggle("visually-hidden", Boolean(variant));
  if (!variant) return;
  document.getElementById("skyborne-variant-title").textContent = `${variant.faccion} · ${variant.nombre}`;
  document.getElementById("skyborne-classes").textContent = variant.clases.join(" · ");
  document.getElementById("skyborne-ability-title").textContent = variant.habilidad.nombre;
  document.getElementById("skyborne-ability").textContent = skyborneAbilitySummary(variant.habilidad);
});

async function loadData() {
  if (loaded || loading) return;
  loading = true;
  form.setAttribute("aria-busy", "true");
  dataError.hidden = true;
  retryButton.disabled = true;
  status.textContent = "Cargando recomendaciones…";
  racialError.hidden = true;
  racialStatus.textContent = "Cargando perfiles raciales…";
  clearResult();
  try {
    const [advisor, profiles, updates, skyborne, additions, druidEvaluation] = await Promise.all([
      readJson("./data/race-advisor.json"),
      readJson("./data/racials.json"),
      readJson("./data/racial-beta-updates.json").catch(() => null),
      readJson("./data/skyborne.json").catch(() => null),
      readJson("./data/race-advisor-additions.json"),
      readJson("./data/race-advisor-druid-alternatives.json").catch(() => null),
    ]);
    racialProfiles = validateData(advisor, profiles);
    racialBetaUpdates = validateRacialBetaUpdates(updates, racialProfiles);
    skyborneData = validateSkyborneData(skyborne);
    document.getElementById("skyborne-data-error").hidden = Boolean(skyborneData);
    if (skyborneData) prepareSkyborneExplorer();
    updateRacialCoverage();
    const druidAlternatives = validateDruidAlternatives(druidEvaluation, advisor, skyborneData);
    const overlay = new Map(druidAlternatives.map((entry) =>
      [JSON.stringify([entry.faccion, entry.clase, entry.especializacion]), entry]));
    records = [...advisor.fichas.map((row) => {
      const extra = overlay.get(JSON.stringify([row.faccion, row.clase, row.especializacion]));
      return extra ? { ...row, alternativa: extra.alternativa,
        usoAlternativa: extra.usoAlternativa, motivoComparacion: extra.motivoComparacion } : row;
    }), ...validateRaceAdditions(additions, advisor, racialProfiles)];
    raceAdditionSources = additions.fuentes;
    if (skyborneData && druidAlternatives.length !== 6) {
      document.getElementById("skyborne-criterion").textContent =
        "Las alternativas de Druida aún no están disponibles. Se conservan las recomendaciones aprobadas del asesor.";
      document.getElementById("skyborne-limitation").textContent =
        "No se ha cargado o validado la ampliación editorial. Cielonato sigue siendo consultable como raza en beta.";
    }
    setOptions(faction, uniqueValues(records, "faccion"), "Elige facción");
    setOptions(racialSelect, [...racialProfiles.keys(), ...(skyborneData ? [skyborneData.raza] : [])], "Elige raza");
    racialStatus.textContent = "Elige una raza para consultar su perfil.";
    loaded = true;
    status.textContent = "Elige una facción para comenzar.";
  } catch (error) {
    updateRacialCoverage(false);
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
  setOptions(characterClass, alphabeticalClassNames(rows.map((row) => row.clase)), faction.dataset.value ? "Elige clase" : "Elige primero una facción");
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
    const value = key === "alternativa" && record.alternativa === "-"
      ? record.faccion === "Alianza" && record.clase === "Chamán"
        ? "Sin alternativa: Enano es la única raza de Chamán de Alianza."
        : record.faccion === "Horda" && record.clase === "Paladín"
          ? "Sin alternativa: No-muerto es la única raza de Paladín de Horda."
          : "Alternativa pendiente de evaluación."
      : (Object.hasOwn(record, key) ? record[key] : profile[key]);
    field.textContent = (key === "razaRecomendada" || (key === "alternativa" && record.alternativa !== "-"))
      ? raceDisplayName(value) : raceProse(value);
  }
  document.getElementById("result-combination").textContent = [record.faccion, record.clase, record.especializacion].join(" · ");
  document.getElementById("primary-reason-label").textContent = `Por qué elegir ${raceDisplayName(record.razaRecomendada)}`;
  document.getElementById("primary-profile-label").textContent = `Perfil de ${raceDisplayName(record.razaRecomendada)}`;
  if (record.alternativa !== "-") {
    const alternative = racialProfiles.get(record.alternativa);
    const isSpecialized = Boolean(record.motivoComparacion);
    document.getElementById("alternative-scope").textContent = isSpecialized
      ? "En esta especialización" : "Ventaja racial general";
    document.getElementById("alternative-use").textContent = raceProse(isSpecialized
      ? record.usoAlternativa : alternative?.usoPrincipal || "");
    document.getElementById("alternative-detail-label").textContent = isSpecialized
      ? "Comparación con la principal" : "Ver limitaciones raciales";
    document.getElementById("alternative-detail-text").textContent = raceProse(isSpecialized
      ? record.motivoComparacion : alternative?.debilidades || "");
    const alternativeIconUrl = self.WOW_ICON_MAP?.raza?.[record.alternativa];
    if (alternativeIconUrl) alternativeRaceIcon.src = alternativeIconUrl;
    document.getElementById("alternative-profile").hidden = false;
  } else {
    const message = document.querySelector('[data-field="alternativa"]').textContent;
    document.getElementById("alternative-empty").textContent = message;
    document.getElementById("alternative-empty").hidden = false;
  }
  renderRaceBetaUpdates(record);
  // Las adiciones editoriales conservan sus fuentes oficiales junto a las notas comunes.
  const sources = record.alternativa === "Cielonato" ? skyborneData?.fuentes
    : record.faccion === "Horda" && record.clase === "Paladín" ? raceAdditionSources : [];
  document.getElementById("race-extra-sources").replaceChildren(...(sources || []).map((source) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.textContent = source.nombre;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    item.append(link);
    return item;
  }));
  if (sources?.length) document.getElementById("race-beta-updates").hidden = false;
  result.hidden = false;
  AddonAdvisor.context("race-addons", { modulo: "race", clase: record.clase });
  status.textContent = `Ficha disponible: ${record.faccion}, ${record.clase}, ${record.especializacion}.`;
  status.classList.add("visually-hidden");
  // Tras completar la selección, el resultado no debe quedar fuera de la vista móvil.
  if (window.matchMedia("(max-width: 40rem)").matches) {
    window.requestAnimationFrame(() => {
      if (result.hidden || advisorView.hidden) return;
      document.getElementById("result-race").focus({ preventScroll: true });
      result.scrollIntoView({ block: "start", behavior: "auto" });
    });
  }
});

function renderRacialMatches(listId, emptyId, field) {
  const list = document.getElementById(listId);
  const matches = records.filter((row) => row[field] === racialSelect.dataset.value);
  const groups = new Map();
  for (const record of matches) {
    if (!groups.has(record.faccion)) groups.set(record.faccion, []);
    groups.get(record.faccion).push(record);
  }
  list.replaceChildren(...[...groups].map(([factionName, entries]) => {
    const groupItem = document.createElement("li");
    groupItem.className = "racial-match-group";
    const heading = document.createElement("h4");
    heading.textContent = factionName;
    const choices = document.createElement("ul");
    choices.className = "racial-match-links";
    for (const record of entries) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.className = "back-link";
      link.href = "#race-advisor";
      link.textContent = [record.clase, record.especializacion].join(" · ");
      link.setAttribute("aria-label", [record.faccion, record.clase, record.especializacion].join(" · "));
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
      choices.append(item);
    }
    groupItem.append(heading, choices);
    return groupItem;
  }));
  list.hidden = matches.length === 0;
  document.getElementById(emptyId).hidden = matches.length > 0;
}

racialSelect.addEventListener("change", () => {
  skyborneResult.hidden = true;
  racialResult.hidden = true;
  document.getElementById("racial-beta-updates").hidden = true;
  document.getElementById("racial-beta-updates").open = false;
  document.getElementById("racial-name").textContent = "";
  for (const field of racialResult.querySelectorAll("[data-racial-field]")) field.textContent = "";
  renderRacialMatches("racial-recommended", "racial-no-recommended", "razaRecomendada");
  renderRacialMatches("racial-alternative", "racial-no-alternative", "alternativa");
  renderRacialMatches("skyborne-alternatives", "skyborne-no-alternatives", "alternativa");
  if (skyborneData && racialSelect.dataset.value === skyborneData.raza) {
    skyborneResult.hidden = false;
    racialStatus.textContent = "Cielonato seleccionado. Consulta sus variantes de facción.";
    racialStatus.classList.add("visually-hidden");
    return;
  }
  const profile = racialProfiles.get(racialSelect.dataset.value);
  if (!profile) {
    racialStatus.textContent = "Elige una raza para consultar su perfil.";
    racialStatus.classList.remove("visually-hidden");
    return;
  }
  document.getElementById("racial-name").textContent = raceDisplayName(profile.raza);
  for (const field of racialResult.querySelectorAll("[data-racial-field]")) {
    field.textContent = raceProse(profile[field.dataset.racialField]);
  }
  document.getElementById("racial-beta-updates").hidden =
    !fillRacialBetaList("racial-beta-list", profile.raza);
  racialResult.hidden = false;
  racialStatus.textContent = `Perfil disponible: ${raceDisplayName(profile.raza)}.`;
  racialStatus.classList.add("visually-hidden");
});

const professionView = document.getElementById("profession-view");
const professionClass = document.getElementById("profession-class");
const professionButtons = document.getElementById("profession-buttons");
const professionResult = document.getElementById("profession-result");
const professionStatus = document.getElementById("profession-status");
let professionRecords = [];
let professionsLoading = false;
let professionsLoaded = false;
const professionReasonBlock = document.getElementById("profession-reason-block");
const professionMainChoice = document.getElementById("profession-choice-main");
const professionSharedReason = document.getElementById("profession-shared-reason");

// F03: si el texto explica también una profesión exclusiva de la alternativa,
// mostrarlo como argumento compartido, sin reescribir el dato original.
function positionProfessionReason(record) {
  const alternativeOnly = record.alternativa.filter((name) => !record.principal.includes(name));
  const comparesBoth = alternativeOnly.some((name) => record.motivoPrincipal.includes(name));
  const target = comparesBoth ? professionSharedReason : professionMainChoice;
  target.append(professionReasonBlock);
  document.getElementById("profession-reason-title").textContent = comparesBoth
    ? "Cómo se comparan estas opciones" : "Por qué se recomienda";
  professionSharedReason.hidden = !comparesBoth;
}

function clearProfessionResult() {
  AddonAdvisor.clear("profession-addons");
  professionMainChoice.append(professionReasonBlock);
  professionSharedReason.hidden = true;
  document.getElementById("profession-reason-title").textContent = "Por qué se recomienda";
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
    setOptions(professionClass, alphabeticalClassNames(rows.map((row) => row.clase)), "Elige clase");
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
      positionProfessionReason(record);
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
  document.getElementById("talent-original-detail").open = false;
  talentResult.hidden = true;
  talentSpecIcon.hidden = true;
  talentSpecIcon.removeAttribute("src");
  for (const id of ["talent-result-title", "talent-build-info", "talent-overview",
    "talent-reason", "talent-limitation", "talent-legacy-intro",
    "talent-legacy-warning", "talent-legacy-tip", "talent-extra",
    "talent-version", "talent-source-note", "talent-advice-warning",
    "talent-original-notice", "talent-original-limitation"]) {
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
  // En seis clases la misma cautela sobre la beta se repite en las nueve fichas.
  // Se conserva el texto original completo, pero la vista principal destaca el límite táctico.
  document.getElementById("talent-limitation").textContent =
    record.limitacion.replace(/\s*Prioridades editoriales de beta, pendientes de validar al 60\.$/, "");
  document.getElementById("talent-original-limitation").textContent = record.limitacion;
  document.getElementById("talent-legacy-intro").textContent = legacy.descripcion;
  replaceTalentList("talent-legacy-perks", legacy.ventajas);
  document.getElementById("talent-legacy-warning").textContent = legacy.advertencia;
  document.getElementById("talent-legacy-tip").textContent = legacy.consejo;
  replaceTalentList("talent-legacy-points", talentData.obtenerPuntosLegado);
  document.getElementById("talent-extra").textContent = record.progreso;
  const sameTalentsForAllGoals = talentData.fichas
    .filter((item) => item.especializacion === spec)
    .every((item) => JSON.stringify(item.talentos) === JSON.stringify(record.talentos));
  document.getElementById("talent-advice-warning").textContent =
    "Orientación de beta: no es una build probada al nivel 60 ni reparte 51 puntos."
    + (sameTalentsForAllGoals
      ? " Los talentos destacados se repiten para los tres objetivos; no son listas diferenciadas."
      : "");
  document.getElementById("talent-original-notice").textContent = talentData.aviso;
  document.getElementById("talent-version").textContent =
    `Compilación beta ${talentData.versionCliente} · Revisión ${talentData.fechaRevision}.`;
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
    setOptions(talentClass, alphabeticalClassNames(catalog.clases.map((entry) => entry.nombre)), "Elige clase");
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
