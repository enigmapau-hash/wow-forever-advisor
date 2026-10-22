"use strict";

if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", {
      scope: "./",
      updateViaCache: "none",
    }).catch((error) => {
      console.warn("No se pudo activar el modo sin conexión.", error);
    });
  });
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

function setOptions(select, values, placeholder) {
  select.replaceChildren(new Option(placeholder, ""), ...values.map((value) => new Option(value, value)));
  select.disabled = values.length === 0;
}

function clearResult() {
  result.hidden = true;
  for (const field of result.querySelectorAll("[data-field]")) field.textContent = "";
  document.getElementById("result-combination").textContent = "";
  document.getElementById("no-alternative").hidden = true;
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
  const rows = records.filter((row) => row.faccion === faction.value);
  setOptions(characterClass, uniqueValues(rows, "clase"), faction.value ? "Elige clase" : "Elige primero una facción");
  setOptions(specialization, [], "Elige primero una clase");
  status.textContent = faction.value ? "Elige una clase." : "Elige una facción para comenzar.";
});

characterClass.addEventListener("change", () => {
  clearResult();
  const rows = records.filter((row) => row.faccion === faction.value && row.clase === characterClass.value);
  setOptions(specialization, uniqueValues(rows, "especializacion"), characterClass.value ? "Elige especialización" : "Elige primero una clase");
  status.textContent = characterClass.value ? "Elige una especialización." : "Elige una clase.";
});

specialization.addEventListener("change", () => {
  clearResult();
  const matches = records.filter((row) => row.faccion === faction.value
    && row.clase === characterClass.value && row.especializacion === specialization.value);
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
  result.hidden = false;
  status.textContent = `Ficha disponible: ${record.faccion}, ${record.clase}, ${record.especializacion}.`;
});

racialSelect.addEventListener("change", () => {
  racialResult.hidden = true;
  document.getElementById("racial-name").textContent = "";
  for (const field of racialResult.querySelectorAll("[data-racial-field]")) field.textContent = "";
  const profile = racialProfiles.get(racialSelect.value);
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

function showRoute(event) {
  const isAdvisor = window.location.hash === "#race-advisor";
  const isRacials = window.location.hash === "#raciales";
  homeView.hidden = isAdvisor || isRacials;
  advisorView.hidden = !isAdvisor;
  racialView.hidden = !isRacials;
  document.title = isRacials ? "Raciales | WoW Forever Advisor"
    : isAdvisor ? "Race Advisor | WoW Forever Advisor" : "WoW Forever Advisor";
  if (isAdvisor) {
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
