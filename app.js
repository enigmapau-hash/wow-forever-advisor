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
let contextualRaceComparisons = new Map();
let singleRaceEvaluations = new Map();
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
  document.getElementById("alternative-explanation").textContent = "";
  document.getElementById("alternative-ability-name").textContent = "";
  document.getElementById("alternative-race-link").dataset.race = "";
  document.getElementById("primary-profile-link").dataset.race = "";
  document.getElementById("primary-ability-name").textContent = "";
  document.getElementById("primary-key-reason").textContent = "";
  document.getElementById("primary-analysis").textContent = "";
  document.getElementById("race-comparison").hidden = true;
  document.getElementById("race-single-evaluation").hidden = true;
  for (const id of ["race-single-name", "race-single-pro", "race-single-con",
    "race-single-conclusion", "race-single-conclusion-title"]) {
    document.getElementById(id).textContent = "";
  }
  document.getElementById("race-official-sources").open = false;
  document.getElementById("race-official-sources").hidden = true;
  document.getElementById("race-beta-content").hidden = true;
  document.getElementById("race-comparison-conclusion-text").textContent = "";
  document.getElementById("race-comparison-conclusion-title").textContent =
    "Conclusión para esta especialización";
  for (const id of ["compare-primary-name", "compare-alternative-name", "compare-primary-pro",
    "compare-primary-con", "compare-alternative-pro", "compare-alternative-con"]) {
    document.getElementById(id).textContent = "";
  }
  document.getElementById("alternative-empty").hidden = true;
  document.getElementById("alternative-empty").textContent = "";
  document.getElementById("race-extra-sources").replaceChildren();
  document.getElementById("race-beta-updates").hidden = true;
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
// Corrección puntual aprobada: preservar la fuente Excel y corregir únicamente
// Sacerdote Sagrado Horda para que la alternativa sea una clase/raza jugable.
function validatePriestHordeAlternative(data, advisor, profiles) {
  const original = advisor.fichas.find((row) => row.faccion === "Horda"
    && row.clase === "Sacerdote" && row.especializacion === "Sagrado");
  if (!data || data.schemaVersion !== 1
      || data.tipo !== "correccion_alternativa_sacerdote_horda"
      || data.estado !== "aprobado_usuario"
      || data.base?.sha256 !== advisor.fuente?.sha256
      || data.base?.fichas !== 51 || advisor.fichas.length !== 51
      || !original || original.razaRecomendada !== "Troll"
      || original.alternativa !== "Tauren" || data.alternativaAnterior !== "Tauren"
      || data.faccion !== original.faccion || data.clase !== original.clase
      || data.especializacion !== original.especializacion
      || data.razaRecomendada !== original.razaRecomendada
      || data.alternativa !== "No-muerto" || !profiles.has("No-muerto")
      || typeof data.explicacion !== "string" || data.explicacion.trim().length < 180
      || !Array.isArray(data.fuentes) || data.fuentes.length < 2
      || !data.fuentes.every((url) => url.startsWith("https://worldofwarcraft.blizzard.com/")))
    return null;
  return data;
}

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

function firstRacialPoint(value) {
  return String(value || "").split("\n").map((point) => point.replace(/^\s*•\s*/, "").trim()).find(Boolean) || "";
}
// Nombres coherentes con las facultades descritas en las ocho fichas originales.
const raceAbilityNames = Object.freeze({
  Gnomo: "Escape Artist",
  Humano: "Will to Survive",
  Enano: "Stoneform",
  Elfo: "Shadowmeld",
  Orco: "Hardiness",
  Tauren: "War Stomp",
  Troll: "Berserking",
  "No-muerto": "Will of the Forsaken",
});

function alternativeRacialAbility(record) {
  if (record.alternativa === "Cielonato") {
    return record.faccion === "Alianza" ? "Read Ley Line" : "Skysight";
  }
  return raceAbilityNames[record.alternativa] || "";
}

// Las tarjetas indican para qué sirve la racial y, después, qué hace.
// Estas frases se derivan de los comentarios originales de los ocho perfiles.
const alternativeRaceAbilityDescriptions = Object.freeze({
  Gnomo: "Escape Artist libera de raíces y ralentizaciones para recuperar movimiento.",
  Humano: "Will to Survive elimina un aturdimiento para volver a actuar.",
  Enano: "Stoneform reduce la presión física y protege frente a sangrados, venenos y enfermedades.",
  Elfo: "Shadowmeld permite permanecer oculto e inmóvil para preparar la intervención.",
  Orco: "Hardiness reduce de forma pasiva la duración de los aturdimientos.",
  Tauren: "War Stomp aturde a enemigos cercanos para crear espacio defensivo.",
  Troll: "Berserking acelera ataques y lanzamientos durante una ventana de intervención.",
  "No-muerto": "Will of the Forsaken permite salir de miedo, sueño o encanto.",
});

// La alternativa de Druida distingue el uso puntual, la facultad activa y
// la ventaja comparativa. No reutilizar la misma frase en dos recuadros.
const druidCielonatoPresentation = Object.freeze({
  "Alianza|Equilibrio": {
    use: "Contar con una opción de recuperación entre ventanas de combate.",
    advantage: "Wind Blessed añade un 3 % de celeridad para sostener ventanas de lanzamiento.",
  },
  "Alianza|Feral": {
    use: "Disponer de recursos situacionales para cambiar la ruta de entrada.",
    advantage: "Walk on Air permite planear para buscar otra ruta de entrada o retirada.",
  },
  "Alianza|Restauración": {
    use: "Añadir un recurso de recuperación entre ventanas de curación.",
    advantage: "Wind Blessed aporta un 3 % de celeridad pasiva a las acciones de apoyo.",
  },
  "Horda|Equilibrio": {
    use: "Cambiar de posición antes de una nueva ventana de lanzamiento.",
    advantage: "Wind Blessed aporta un 3 % de celeridad durante las oportunidades ofensivas.",
  },
  "Horda|Feral": {
    use: "Conservar opciones de persecución y retirada.",
    advantage: "Walk on Air permite planear para variar la ruta de aproximación.",
  },
  "Horda|Restauración": {
    use: "Facilitar el desplazamiento hacia cobertura y aliados.",
    advantage: "Wind Blessed complementa las ventanas de lanzamiento de apoyo con un 3 % de celeridad.",
  },
});

function druidAlternativePresentation(record) {
  return druidCielonatoPresentation[record.faccion + "|" + record.especializacion] || null;
}

function alternativeRacialExplanation(record) {
  if (record.alternativa !== "Cielonato") {
    return alternativeRaceAbilityDescriptions[record.alternativa] || "";
  }
  const variant = skyborneData?.variantes.find((item) => item.faccion === record.faccion);
  if (!variant) return "";
  return record.faccion === "Alianza"
    ? `Read Ley Line aumenta un ${variant.habilidad.regeneracionPorcentaje} % la regeneración de salud y maná y puede activarse en movimiento.`
    : `Skysight aumenta un ${variant.habilidad.movimientoPorcentaje} % la velocidad de carrera y puede activarse en movimiento.`;
}

function focusedRaceExplanation(explanation) {
  const sentences = String(explanation).split(/(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ])/u);
  // En las 54 fichas, la segunda oración expone la facultad concreta.
  // La primera reitera el objetivo ya resumido en motivoPrincipal.
  return sentences[1] || sentences[0] || "";
}

/* v36 · La conclusión interpreta el contraste, sin crear un cuarto recuadro
   ni atribuir la misma ventaja racial a dos razas distintas. */
const racePairConclusions = new Map([
  ["Gnomo|Humano", "Gnomo conserva prioridad cuando el movimiento decide la posición. Humano gana interés si los aturdimientos impiden responder."],
  ["Enano|Humano", "Enano ofrece más margen defensivo frente a presión física. Humano resulta interesante cuando salir de un aturdimiento es la necesidad dominante."],
  ["Humano|Enano", "Humano recupera la capacidad de actuar tras un aturdimiento. Enano interesa si sostener el daño físico pesa más que esa reacción."],
  ["Enano|Elfo", "Enano prioriza la protección frente al daño físico. Elfo de la noche destaca cuando la preparación posicional y la ocultación son más importantes."],
  ["Elfo|Gnomo", "Elfo de la noche conserva ventaja por su preparación y ocultación. Gnomo interesa cuando las raíces y ralentizaciones bloquean la retirada o la entrada."],
  ["Enano|Gnomo", "Enano mantiene la prioridad por su resistencia frente a la presión física. Gnomo puede convenir si escapar de raíces y ralentizaciones importa más que mitigar ese daño."],
  ["Humano|Gnomo", "Humano prioriza la respuesta tras un aturdimiento. Gnomo resulta útil cuando el principal obstáculo es recuperar movimiento."],
  ["Elfo|Cielonato", "Elfo de la noche mantiene la prioridad por ocultación y preparación defensiva. Cielonato puede interesar por la celeridad, el planeo o la regeneración situacional según el papel del druida."],
  ["Orco|Tauren", "Orco protege mejor la continuidad de acción frente a aturdimientos. Tauren interesa si hace falta el control cercano inmediato de War Stomp."],
  ["Tauren|Orco", "Tauren aporta una pausa de control cercano para defender la posición. Orco interesa si los aturdimientos son la amenaza más frecuente."],
  ["Orco|Troll", "Orco reduce las interrupciones provocadas por aturdimientos. Troll gana interés cuando la celeridad de Berserking permite aprovechar mejor una ventana ofensiva."],
  ["Troll|Orco", "Troll prioriza la rapidez durante las ventanas de presión. Orco puede ser preferible si los aturdimientos impiden mantener la actividad."],
  ["No-muerto|Orco", "No-muerto destaca al responder ante miedo, sueño y encanto. Orco interesa más si el control predominante son los aturdimientos."],
  ["Orco|No-muerto", "Orco reduce la interrupción causada por aturdimientos. No-muerto resulta útil cuando miedo, sueño o encanto determinan el combate."],
  ["Troll|No-muerto", "Troll aprovecha ventanas de lanzamiento con Berserking. No-muerto interesa más si miedo, sueño o encanto están cortando la respuesta."],
  ["Troll|Tauren", "Troll da prioridad a la rapidez de intervención. Tauren ofrece una pausa defensiva con War Stomp cuando hay enemigos demasiado cerca."],
  ["No-muerto|Troll", "No-muerto ayuda a mantener capacidad de respuesta frente a miedo, sueño y encanto. Troll es interesante si la rapidez de lanzamiento es más determinante."],
  ["Tauren|Troll", "Tauren ofrece control defensivo inmediato con War Stomp. Troll interesa si las ventanas de lanzamiento rápido pesan más que ese control."],
  ["Tauren|Cielonato", "Tauren conserva la prioridad por el control cercano de War Stomp. Cielonato aporta celeridad y desplazamiento activable, pero no sustituye esa pausa defensiva."]
]);
function raceComparisonConclusion(record) {
  const key = record.razaRecomendada + "|" + record.alternativa;
  const text = racePairConclusions.get(key) || "";
  if (!text) return [];
  // Los 19 pares aprobados tienen dos afirmaciones: principal y alternativa.
  // Mantenerlas como párrafos independientes en vez de otro bloque de texto corrido.
  const split = text.indexOf(". ");
  return split < 0 ? [text] : [text.slice(0, split + 1), text.slice(split + 2)];
}

// Capa de análisis contextual separada: conserva las decisiones originales.
// Un fallo de validación impide importar datos nuevos, sin inventar resultados.
function contextualRaceKey(record) {
  return JSON.stringify([record.faccion, record.clase, record.especializacion]);
}
function isImpossiblePriestAlternative(record) {
  return record.faccion === "Horda" && record.clase === "Sacerdote"
    && record.especializacion === "Sagrado" && record.alternativa === "Tauren";
}
function validateContextualRaceComparisons(data, sourceRecords) {
  if (!data || data.schemaVersion !== 1 || !Array.isArray(data.fichas)
      || data.fichas.length !== 48 || sourceRecords.length !== 54) return new Map();
  const expected = new Map(sourceRecords.filter((r) => r.alternativa !== "-")
    .map((r) => [contextualRaceKey(r), r]));
  if (expected.size !== 48) return new Map();
  const overlay = new Map();
  for (const item of data.fichas) {
    const key = contextualRaceKey(item), source = expected.get(key);
    if (!source || overlay.has(key)
        || item.razaRecomendada !== source.razaRecomendada
        || item.alternativa !== source.alternativa) return new Map();
    if (isImpossiblePriestAlternative(source)) {
      if (item.estado !== "bloqueado_incompatibilidad" || !item.aviso) return new Map();
    } else {
      if (item.estado !== "analisis_fuentes_revisado"
          || !["principal", "alternativaAnalisis"].every((field) =>
            item[field] && typeof item[field].aFavor === "string"
            && item[field].aFavor.trim().length > 60
            && typeof item[field].aTenerEnCuenta === "string"
            && item[field].aTenerEnCuenta.trim().length > 60)
          || !["conclusionPrincipal", "conclusionAlternativa"].every((field) =>
            typeof item[field] === "string" && item[field].trim().length > 90)
          || !Array.isArray(item.fuentes) || item.fuentes.length < 2
          || !item.fuentes.every((url) => url.startsWith("https://worldofwarcraft.blizzard.com/")))
        return new Map();
    }
    overlay.set(key, item);
  }
  return overlay.size === expected.size ? overlay : new Map();
}

// Las seis combinaciones de raza única reciben evaluación de clase y especialización,
 // no una comparativa inventada con una alternativa inexistente.
function validateSingleRaceEvaluations(data, sourceRecords) {
  if (!data || data.schemaVersion !== 1 || data.tipo !== "evaluacion_individual_raza_clase_especializacion"
      || !Array.isArray(data.fichas) || data.fichas.length !== 6
      || sourceRecords.length !== 54) throw new Error("Evaluaciones individuales incompletas.");
  // Si falla la capa opcional de Cielonato, sus seis Druidas vuelven
  // provisionalmente a «sin alternativa»; no son seis razas únicas reales.
  const expected = new Map(sourceRecords.filter((row) => row.alternativa === "-"
    && ((row.faccion === "Alianza" && row.clase === "Chamán" && row.razaRecomendada === "Enano")
      || (row.faccion === "Horda" && row.clase === "Paladín" && row.razaRecomendada === "No-muerto")))
    .map((row) => [contextualRaceKey(row), row]));
  if (expected.size !== 6) throw new Error("Número de razas únicas incorrecto.");
  const result = new Map();
  for (const row of data.fichas) {
    const key = contextualRaceKey(row), source = expected.get(key);
    if (!source || result.has(key) || row.razaRecomendada !== source.razaRecomendada
        || !["aFavor", "aTenerEnCuenta", "conclusion"].every((field) =>
          typeof row[field] === "string" && row[field].trim().length > 140)
        || !Array.isArray(row.fuentes) || row.fuentes.length < 2
        || !row.fuentes.every((url) => url.startsWith("https://worldofwarcraft.blizzard.com/"))) {
      throw new Error("Evaluación de raza única incompleta o no acreditada.");
    }
    result.set(key, row);
  }
  if (result.size !== expected.size) throw new Error("Faltan evaluaciones individuales.");
  return result;
}
function renderSingleRaceEvaluation(record) {
  const block = document.getElementById("race-single-evaluation");
  const single = record.alternativa === "-" && singleRaceEvaluations.get(contextualRaceKey(record));
  block.hidden = !single;
  if (!single) return;
  document.getElementById("race-single-title").textContent =
    "Evaluación de " + record.clase + " · " + record.especializacion;
  document.getElementById("race-single-name").textContent = raceDisplayName(record.razaRecomendada);
  document.getElementById("race-single-pro").textContent = raceProse(single.aFavor);
  document.getElementById("race-single-con").textContent = raceProse(single.aTenerEnCuenta);
  document.getElementById("race-single-conclusion-title").textContent =
    "Conclusión para " + record.especializacion;
  document.getElementById("race-single-conclusion").textContent = raceProse(single.conclusion);
}

function renderRaceComparison(record, mainProfile, alternativeProfile) {
  const comparison = document.getElementById("race-comparison");
  comparison.hidden = record.alternativa === "-";
  if (comparison.hidden) return;
  const skyborne = record.alternativa === "Cielonato";
  if (isImpossiblePriestAlternative(record)) {
    comparison.hidden = true;
    document.getElementById("race-comparison-conclusion-text").replaceChildren();
    for (const id of ["compare-primary-pro", "compare-primary-con",
      "compare-alternative-pro", "compare-alternative-con"]) {
      document.getElementById(id).textContent = "";
    }
    return;
  }
  const contextual = contextualRaceComparisons.get(contextualRaceKey(record));
  document.getElementById("compare-primary-name").textContent = raceDisplayName(record.razaRecomendada);
  document.getElementById("compare-alternative-name").textContent = raceDisplayName(record.alternativa);
  document.getElementById("compare-primary-pro").textContent = raceProse(contextual
    ? contextual.principal.aFavor : firstRacialPoint(mainProfile?.fortalezas));
  document.getElementById("compare-primary-con").textContent = raceProse(contextual
    ? contextual.principal.aTenerEnCuenta : firstRacialPoint(mainProfile?.debilidades));
  document.getElementById("compare-alternative-pro").textContent = raceProse(contextual
    ? contextual.alternativaAnalisis.aFavor
    : skyborne ? druidAlternativePresentation(record)?.advantage || ""
      : firstRacialPoint(alternativeProfile?.fortalezas));
  document.getElementById("compare-alternative-con").textContent = raceProse(contextual
    ? contextual.alternativaAnalisis.aTenerEnCuenta
    : skyborne ? record.faccion === "Alianza"
      ? "No sustituye la ocultación y preparación posicional del elfo de la noche."
      : "No aporta el control inmediato de War Stomp del tauren."
    : firstRacialPoint(alternativeProfile?.debilidades));
  document.getElementById("race-comparison-conclusion-title").textContent =
    "Conclusión para " + record.especializacion;
  document.getElementById("race-comparison-conclusion-text").replaceChildren(
    ...(contextual
      ? [contextual.conclusionPrincipal, contextual.conclusionAlternativa]
      : raceComparisonConclusion(record)).map((sentence) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = sentence;
      return paragraph;
    })
  );
}
function renderRaceBetaUpdates(record) {
  const main = fillRacialBetaList("race-beta-recommended-list", record.razaRecomendada);
  document.getElementById("race-beta-recommended-label").textContent =
    "Raza principal · " + raceDisplayName(record.razaRecomendada);
  const alternative = record.alternativa !== "-" && !isImpossiblePriestAlternative(record)
    && fillRacialBetaList("race-beta-alternative-list", record.alternativa);
  const alternativeView = document.getElementById("race-beta-alternative");
  alternativeView.hidden = !alternative;
  if (alternative) {
    document.getElementById("race-beta-alternative-label").textContent =
      "Alternativa · " + raceDisplayName(record.alternativa);
  } else {
    document.getElementById("race-beta-alternative-list").replaceChildren();
  }
  document.getElementById("race-beta-content").hidden = !main && !alternative;
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
    ? `Fuentes oficiales consultadas el ${skyborneData.revision.fecha}; los datos pueden cambiar.`
    : "Consulta las fuentes oficiales antes de considerar definitivas las facultades.";
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
  fillSkyborneAbilities("skyborne-common", skyborneData.comunes);
  document.getElementById("skyborne-wind-history").textContent =
    "Wind Blessed: +3 % de celeridad; la presentación inicial indicaba +1 %.";
  document.getElementById("skyborne-skysight-source").textContent =
    "Skysight: +10 % de velocidad de carrera, activable en movimiento.";
  document.getElementById("skyborne-criterion").textContent =
    "Planeo y celeridad ayudan a variar la posición; las facultades de Alianza y Horda responden a necesidades distintas. Para Druida también importa el papel que desempeña cada forma.";
  document.getElementById("skyborne-limitation").textContent =
    "El planeo es temporal. La celeridad y la movilidad no sustituyen el control defensivo; conviene contrastar su interacción con las formas druídicas.";
  document.getElementById("skyborne-sources").replaceChildren(...skyborneData.fuentes.map((source) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.textContent = source.id === "beta-15-oct"
      ? "Blizzard · Cambios de facultades (octubre de 2026)" : source.nombre;
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
  document.getElementById("skyborne-use").textContent = variant.faccion === "Alianza"
    ? "Movilidad breve, celeridad y regeneración activa de salud y maná."
    : "Movilidad breve, celeridad y velocidad de carrera activable.";
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
    const [advisor, profiles, updates, skyborne, additions, druidEvaluation, contextComparisons, priestCorrection, singles] = await Promise.all([
      readJson("./data/race-advisor.json"),
      readJson("./data/racials.json"),
      readJson("./data/racial-beta-updates.json").catch(() => null),
      readJson("./data/skyborne.json").catch(() => null),
      readJson("./data/race-advisor-additions.json"),
      readJson("./data/race-advisor-druid-alternatives.json").catch(() => null),
      readJson("./data/race-contextual-comparisons-v40-draft.json").catch(() => null),
      readJson("./data/race-advisor-priest-horde-alternative.json").catch(() => null),
      readJson("./data/race-single-race-evaluations.json"),
    ]);
    racialProfiles = validateData(advisor, profiles);
    racialBetaUpdates = validateRacialBetaUpdates(updates, racialProfiles);
    skyborneData = validateSkyborneData(skyborne);
    document.getElementById("skyborne-data-error").hidden = Boolean(skyborneData);
    if (skyborneData) prepareSkyborneExplorer();
    updateRacialCoverage();
    const druidAlternatives = validateDruidAlternatives(druidEvaluation, advisor, skyborneData);
    const approvedPriestCorrection = validatePriestHordeAlternative(priestCorrection, advisor, racialProfiles);
    const overlay = new Map(druidAlternatives.map((entry) =>
      [JSON.stringify([entry.faccion, entry.clase, entry.especializacion]), entry]));
    records = [...advisor.fichas.map((row) => {
      const extra = overlay.get(JSON.stringify([row.faccion, row.clase, row.especializacion]));
      const druidRow = extra ? { ...row, alternativa: extra.alternativa,
        usoAlternativa: extra.usoAlternativa, motivoComparacion: extra.motivoComparacion } : row;
      return approvedPriestCorrection
        && row.faccion === "Horda" && row.clase === "Sacerdote" && row.especializacion === "Sagrado"
        ? { ...druidRow, alternativa: approvedPriestCorrection.alternativa,
          explicacion: approvedPriestCorrection.explicacion }
        : druidRow;
    }), ...validateRaceAdditions(additions, advisor, racialProfiles)];
    raceAdditionSources = additions.fuentes;
    contextualRaceComparisons = validateContextualRaceComparisons(contextComparisons, records);
    singleRaceEvaluations = validateSingleRaceEvaluations(singles, records);
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
    contextualRaceComparisons = new Map();
    singleRaceEvaluations = new Map();
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
  document.getElementById("primary-profile-link").dataset.race = record.razaRecomendada;
  document.getElementById("primary-profile-link").setAttribute("aria-label",
    "Ver perfil de " + raceDisplayName(record.razaRecomendada) + " en Race Explorer");
  document.getElementById("primary-ability-name").textContent =
    raceAbilityNames[record.razaRecomendada] || "";
  document.getElementById("primary-key-reason").textContent = raceProse(record.motivoPrincipal);
  document.getElementById("primary-analysis").textContent = raceProse(focusedRaceExplanation(record.explicacion));
  if (record.alternativa !== "-") {
    const alternative = racialProfiles.get(record.alternativa);
    const isSpecialized = Boolean(record.motivoComparacion);
    // Resumen breve de uso, seguido de una frase que comienza por la facultad.
    // El razonamiento comparativo se conserva en el cuadro independiente.
    document.getElementById("alternative-use").textContent = raceProse(isSpecialized
      ? druidAlternativePresentation(record)?.use || ""
      : alternative?.usoPrincipal || "");
    document.getElementById("alternative-ability-name").textContent =
      alternativeRacialAbility(record);
    document.getElementById("alternative-explanation").textContent =
      raceProse(alternativeRacialExplanation(record));
    const alternativeLink = document.getElementById("alternative-race-link");
    alternativeLink.dataset.race = record.alternativa;
    alternativeLink.setAttribute("aria-label",
      "Ver perfil de " + raceDisplayName(record.alternativa) + " en Race Explorer");
    const alternativeIconUrl = self.WOW_ICON_MAP?.raza?.[record.alternativa];
    if (alternativeIconUrl) alternativeRaceIcon.src = alternativeIconUrl;
    document.getElementById("alternative-profile").hidden = false;
    if (isImpossiblePriestAlternative(record)) {
      // Tauren no es una raza de Sacerdote jugable: no exhibir una ficha ficticia.
      document.getElementById("alternative-profile").hidden = true;
      alternativeRaceIcon.removeAttribute("src");
      alternativeLink.dataset.race = "";
      for (const id of ["alternative-use", "alternative-explanation", "alternative-ability-name"]) {
        document.getElementById(id).textContent = "";
      }
      document.getElementById("alternative-empty").textContent =
        "Alternativa no jugable: Tauren no puede ser Sacerdote en WoW Forever. La elección de alternativa está pendiente de revisión.";
      document.getElementById("alternative-empty").hidden = false;
    }
  } else {
    const message = document.querySelector('[data-field="alternativa"]').textContent;
    document.getElementById("alternative-empty").textContent = message;
    document.getElementById("alternative-empty").hidden = false;
  }
  renderRaceComparison(record, profile, racialProfiles.get(record.alternativa));
  renderSingleRaceEvaluation(record);
  renderRaceBetaUpdates(record);
  // Las adiciones editoriales conservan sus fuentes oficiales junto a las notas comunes.
  const traditionalSources = record.alternativa === "Cielonato" ? skyborneData?.fuentes
    : record.faccion === "Horda" && record.clase === "Paladín" ? raceAdditionSources : [];
  const context = contextualRaceComparisons.get(contextualRaceKey(record));
  const single = singleRaceEvaluations.get(contextualRaceKey(record));
  const sourceTitles = {
    "24304075": "Blizzard · Raciales y combinaciones",
    "24301514": "Blizzard · Sacerdote y Guerrero",
    "24301515": "Blizzard · Druida y Cazador",
    "24310968": "Blizzard · Pícaro y Brujo",
    "24302097": "Blizzard · Mago y Chamán",
    "24302099": "Blizzard · Paladín",
    "24303313": "Blizzard · Diseño de las raciales",
  };
  const explicitSources = (context?.fuentes || single?.fuentes || []).map((url) => ({
    url, nombre: Object.entries(sourceTitles).find(([id]) => url.includes(id))?.[1]
      || "Blizzard · Información de clase",
  }));
  const betaSource = "https://us.forums.blizzard.com/en/wow/t/wow-forever-beta-development-notes-%E2%80%93-updated-october-15/2360696/6";
  const includeBeta = !document.getElementById("race-beta-content").hidden;
  const sources = [
    ...(traditionalSources || []), ...explicitSources,
    ...(includeBeta ? [{url: betaSource, nombre: "Blizzard · Notas de beta (15/10/2026)"}] : []),
  ].filter((source, index, items) => items.findIndex((item) => item.url === source.url) === index);
  document.getElementById("race-extra-sources").replaceChildren(...sources.map((source) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.textContent = Object.entries(sourceTitles).find(([id]) => source.url.includes(id))?.[1]
      || source.nombre;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    item.append(link);
    return item;
  }));
  const official = document.getElementById("race-official-sources");
  official.hidden = sources.length === 0;
  document.getElementById("race-beta-updates").hidden = !includeBeta && !sources.length;
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

// Un solo perfil racial detallado en Race Explorer, también accesible desde las fichas.
for (const id of ["primary-profile-link", "alternative-race-link"]) {
  document.getElementById(id).addEventListener("click", (event) => {
    const race = event.currentTarget.dataset.race;
    if (race) selectOption(racialSelect, race);
  });
}

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
  document.getElementById("racial-ability-name").textContent = raceAbilityNames[profile.raza] || "";
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

// Argumentos por opción: se conservan los motivos originales íntegros en el catálogo.
const professionPairedReasons = new Map([
  ["Guerrero|Armas", ["Herrería permite fabricar armas y armaduras al progresar.", "Ingeniería aporta herramientas para entrar, presionar o responder en PvP."]],
  ["Cazador|Puntería", ["Fabricar equipo con materiales propios da continuidad a la progresión.", "Ingeniería puede ayudar en situaciones de presión en PvP."]],
  ["Cazador|Supervivencia", ["Peletería permite elaborar piezas durante la progresión.", "Ingeniería puede ayudar a disputar posiciones y controlar accesos."]],
  ["Pícaro|Asesinato", ["Peletería permite fabricar equipo con materiales propios.", "Ingeniería suma opciones para afrontar la presión y retirarse."]],
  ["Pícaro|Sutileza", ["Peletería ofrece una progresión sencilla y autosuficiente.", "Ingeniería puede complementar entradas, control y escapadas."]],
  ["Sacerdote|Sagrado", ["Sastrería y Encantamiento acompañan la progresión del equipo.", "Alquimia permite preparar consumibles de maná para sesiones largas."]],
  ["Mago|Arcano", ["Sastrería y Encantamiento permiten elaborar y mejorar equipo de tela.", "Ingeniería puede aportar recursos para las ventanas de lanzamiento."]],
  ["Mago|Fuego", ["La pareja principal permite elaborar y mejorar equipamiento.", "Ingeniería aporta herramientas durante ofensivas PvP."]],
  ["Mago|Escarcha", ["La fabricación y los encantamientos sostienen una progresión estable.", "Ingeniería puede complementar el control del espacio."]],
  ["Brujo|Aflicción", ["Sastrería y Encantamiento ayudan a mejorar equipo al progresar.", "Ingeniería puede aportar recursos en situaciones de presión."]],
  ["Brujo|Demonología", ["Fabricar y mejorar equipo acompaña el desarrollo del personaje.", "Ingeniería puede añadir herramientas situacionales de supervivencia."]],
  ["Brujo|Destrucción", ["Sastrería y Encantamiento ofrecen una base estable de equipo.", "Ingeniería puede aportar recursos de ataque y defensa en PvP."]],
]);
const professionAlternativeReasons = {
  "Minería + Ingeniería": "Prioriza herramientas y dispositivos tácticos para PvP frente a fabricar equipo.",
  "Herboristería + Alquimia": "Prioriza obtener materiales y preparar consumibles propios.",
  "Minería + Herrería": "Prioriza obtener minerales y fabricar armas o armaduras.",
  "Desuello + Peletería": "Prioriza aprovechar pieles y elaborar piezas de equipamiento.",
  "Sastrería + Encantamiento": "Prioriza fabricar equipo de tela y mejorarlo con encantamientos.",
};
function positionProfessionReason(record) {
  const pair = professionPairedReasons.get(record.clase + "|" + record.especializacion);
  document.getElementById("profession-main-reason").textContent = pair?.[0] || record.motivoPrincipal;
  document.getElementById("profession-alt-reason").textContent =
    pair?.[1] || professionAlternativeReasons[record.alternativa.join(" + ")] ||
    "Ofrece una orientación distinta a la pareja principal.";
}

function clearProfessionResult() {
  AddonAdvisor.clear("profession-addons");
  document.getElementById("profession-main-reason").textContent = "";
  document.getElementById("profession-alt-reason").textContent = "";
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
  document.getElementById("talent-source-panel").open = false;
  talentResult.hidden = true;
  talentSpecIcon.hidden = true;
  talentSpecIcon.removeAttribute("src");
  for (const id of ["talent-result-title", "talent-build-info", "talent-overview",
    "talent-reason", "talent-limitation", "talent-legacy-intro",
    "talent-legacy-warning", "talent-legacy-tip", "talent-extra",
    "talent-version", "talent-source-note", "talent-advice-warning",
    "talent-priorities-note", "talent-legacy-heading",
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
  document.getElementById("talent-legacy-heading").textContent =
    "Legado · " + goal;
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
    "Orientación elaborada durante la beta, cerrada el 23/10/2026. No son builds"
    + " de 51 puntos ni configuraciones probadas al nivel 60.";
  document.getElementById("talent-priorities-note").textContent =
    sameTalentsForAllGoals
      ? "La selección de talentos es la misma para subir al 60, PvP y mazmorras."
        + " Lo que cambia aquí es cómo utilizarlos para el objetivo elegido;"
        + " no hay tres builds diferenciadas."
      : "Selección orientativa para " + goal.toLowerCase()
        + ", sin orden de compra, puntos asignados ni prerrequisitos verificados.";
  document.getElementById("talent-original-notice").textContent = talentData.aviso;
  document.getElementById("talent-version").textContent =
    `Referencia beta ${talentData.versionCliente} · Ficha revisada ${talentData.fechaRevision}.`
    + " Beta cerrada el 23/10; lanzamiento previsto para el 04/11/2026."
    + " Pendiente de comprobar los talentos del cliente de lanzamiento.";
  document.getElementById("talent-source-note").textContent = talentData.notaFuentes;
  const betaEnd = {
    nombre: "Blizzard · Cierre de beta y fecha de lanzamiento (23/10/2026)",
    url: "https://us.forums.blizzard.com/en/wow/t/thank-you-for-testing-the-wow-forever-beta/2390465",
  };
  const sourceList = [...talentData.fuentes, betaEnd];
  const sources = sourceList.filter((source, index, entries) =>
    entries.findIndex((entry) => entry.url === source.url) === index).map((source) => {
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
  talentStatus.textContent = `Ficha orientativa disponible: ${talentData.clase}, ${spec}, ${goal}.`;
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
