"use strict";

// Una sola fuente editorial para el catálogo y las referencias contextuales.
const AddonAdvisor = (() => {
  const states = {
    publicado_forever: "Publicado por el desarrollador para Forever",
    probado_forever: "Probado en Forever con evidencia",
    pendiente_verificar: "Pendiente de verificar",
  };
  const categories = ["Misiones", "Comodidad", "Combate", "Economía", "Equipamiento", "Exploración", "Grupos", "Recolección"];
  const text = (value) => typeof value === "string" && value.trim().length > 0;
  const date = (value) => text(value) && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  const source = (value) => value && text(value.nombre) && text(value.url)
    && /^https:\/\/(www\.)?curseforge\.com\/wow\/addons\//.test(value.url);

  function validate(data) {
    if (data?.schemaVersion !== 1 || !text(data.cliente) || !date(data.fechaRevision)
        || !Array.isArray(data.addons) || !data.addons.length
        || new Set(data.addons.map((a) => a?.id)).size !== data.addons.length
        || !data.addons.every((a) => a && /^[a-z0-9-]+$/.test(a.id)
          && ["nombre", "autor", "finalidad", "evidencia", "limite"].every((k) => text(a[k]))
          && categories.includes(a.categoria) && Object.hasOwn(states, a.estado)
          && ["segun_necesidad", "en_observacion"].includes(a.recomendacion)
          && typeof a.imprescindible === "boolean" && date(a.fechaRevision)
          && a.fechaRevision <= data.fechaRevision
          && Array.isArray(a.fuentes) && a.fuentes.length > 0 && a.fuentes.every(source)
          && a.afinidad && ["clases", "razas", "profesiones", "actividades"].every((k) =>
            Array.isArray(a.afinidad[k]) && a.afinidad[k].every(text))
          && Array.isArray(a.contextos) && a.contextos.every((c) => c
            && ["race", "profession", "talent"].includes(c.modulo) && text(c.motivo)
            && ["clase", "especializacion", "objetivo"].every((k) => c[k] === undefined || text(c[k])))
          && (a.estado === "pendiente_verificar"
            ? a.version === null && a.fechaPublicacion === null && a.versionCliente === null
              && !a.imprescindible && !a.contextos.length && a.recomendacion === "en_observacion"
            : text(a.version) && date(a.fechaPublicacion) && a.fechaPublicacion <= a.fechaRevision
              && /^1\.60\./.test(a.versionCliente))
          && (a.estado === "probado_forever"
            ? a.pruebaForever && source(a.pruebaForever) && date(a.pruebaForever.fecha)
              && /^1\.60\./.test(a.pruebaForever.cliente) && text(a.pruebaForever.alcance)
              && a.pruebaForever.fecha <= a.fechaRevision
            : a.pruebaForever === null)
          && (!a.imprescindible || a.recomendacion === "segun_necesidad")
          && (a.recomendacion !== "en_observacion" || !a.contextos.length))) {
      throw new Error("Catálogo de addons incompleto o sin evidencia suficiente.");
    }
    return data;
  }

  function related(data, context) {
    return data.addons.flatMap((addon) => {
      if (addon.recomendacion !== "segun_necesidad" || addon.estado === "pendiente_verificar") return [];
      const rule = addon.contextos.find((c) => c.modulo === context.modulo
        && ["clase", "especializacion", "objetivo"].every((k) => !c[k] || c[k] === context[k])
        && (c.modulo !== "profession" || context.profesiones?.some((p) => addon.afinidad.profesiones.includes(p))));
      return rule ? [{ addon, motivo: rule.motivo }] : [];
    }).slice(0, 2);
  }

  let pending;
  function load() {
    if (!pending) pending = fetch("./data/addon-advisor.json").then((r) => {
      if (!r.ok) throw new Error("No se pudo leer el catálogo de addons.");
      return r.json();
    }).then(validate).catch((error) => { pending = null; throw error; });
    return pending;
  }

  function element(tag, content, className) {
    const el = document.createElement(tag);
    if (content) el.textContent = content;
    if (className) el.className = className;
    return el;
  }
  function link(source) {
    const a = element("a", source.nombre);
    a.href = source.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  }

  const revisions = new Map();
  function clear(id) {
    revisions.set(id, (revisions.get(id) || 0) + 1);
    const host = document.getElementById(id);
    host.replaceChildren();
    host.hidden = true;
  }
  async function context(id, selection) {
    clear(id);
    const revision = revisions.get(id);
    try {
      const data = await load();
      if (revisions.get(id) !== revision) return;
      const matches = related(data, selection);
      if (!matches.length) return;
      const host = document.getElementById(id);
      host.append(element("h3", "Addons relacionados · opcional"));
      for (const { addon, motivo } of matches) {
        const p = element("p");
        p.append(element("strong", addon.nombre), document.createTextNode(" · " + motivo));
        host.append(p);
      }
      const untested = matches.filter(({ addon }) => !addon.pruebaForever).length;
      if (untested) {
        host.append(element("p", untested === matches.length
          ? "Ninguno de estos addons tiene prueba independiente registrada aquí."
          : "Algunos de estos addons no tienen prueba independiente registrada aquí.", "field-note"));
      }
      const a = element("a", "Ver fuentes y limitaciones en Addon Advisor →");
      a.href = "#addon-advisor";
      host.append(a);
      host.hidden = false;
    } catch {
      // El catálogo opcional nunca impide consultar las fichas originales.
    }
  }

  let catalog = null;
  let filter = "Selección inicial";
  let busy = false;
  function render() {
    const matches = catalog.addons.filter((a) => filter === "Todos"
      || (filter === "Selección inicial" ? a.imprescindible : a.categoria === filter));
    const host = document.getElementById("addon-results");
    host.replaceChildren(...matches.map((a) => {
      const card = element("article", "", "result-card");
      card.dataset.addonId = a.id;
      card.append(element("p", a.categoria + (a.recomendacion === "en_observacion" ? " · En observación" : " · Según tu necesidad"), "eyebrow"),
        element("h2", a.nombre), element("p", "Autor: " + a.autor, "field-note"),
        element("p", a.finalidad), element("p", states[a.estado], "addon-state"));
      if (a.recomendacion === "en_observacion") card.append(element("p", a.limite, "source-note"));
      card.append(link(a.fuentes[0]));
      const details = element("details", "", "addon-details");
      details.append(element("summary", "Versión, evidencia y limitaciones"),
        element("p", "Revisado: " + a.fechaRevision, "field-note"),
        element("p", a.version ? `Archivo revisado: ${a.version} · ${a.fechaPublicacion} · Cliente ${a.versionCliente}`
          : "Archivo específico de Forever: pendiente de verificar.", "field-note"),
        element("p", a.evidencia),
        element("p", "Prueba independiente: " + (a.pruebaForever
          ? a.pruebaForever.alcance : "no registrada"), "field-note"));
      if (a.recomendacion !== "en_observacion") details.append(element("p", a.limite, "source-note"));
      const affinities = [...a.afinidad.clases, ...a.afinidad.razas, ...a.afinidad.profesiones, ...a.afinidad.actividades];
      details.append(element("p", "Útil para: " + affinities.join(" · "), "field-note"));
      const list = element("ul", "", "talent-sources");
      for (const s of a.fuentes.slice(1)) { const li = element("li"); li.append(link(s)); list.append(li); }
      if (a.pruebaForever) { const li = element("li"); li.append(link(a.pruebaForever)); list.append(li); }
      details.append(list);
      card.append(details);
      return card;
    }));
    document.getElementById("addon-status").textContent = `${matches.length} addons · ${filter}.`;
  }

  async function open() {
    if (busy) return;
    if (catalog) { render(); return; }
    busy = true;
    const controls = document.getElementById("addon-controls");
    const error = document.getElementById("addon-error");
    controls.setAttribute("aria-busy", "true");
    error.hidden = true;
    document.getElementById("retry-addons").disabled = true;
    document.getElementById("addon-status").textContent = "Cargando catálogo…";
    try {
      catalog = await load();
      const filters = document.getElementById("addon-filters");
      filters.replaceChildren(...["Selección inicial", "Todos", ...categories].map((name) => {
        const button = element("button", name);
        button.type = "button";
        button.setAttribute("aria-pressed", String(filter === name));
        button.addEventListener("click", () => {
          filter = name;
          for (const sibling of filters.children) sibling.setAttribute("aria-pressed", String(sibling === button));
          render();
        });
        return button;
      }));
      render();
    } catch {
      error.hidden = false;
      document.getElementById("addon-status").textContent = "Catálogo no disponible.";
    } finally {
      busy = false;
      controls.setAttribute("aria-busy", "false");
      document.getElementById("retry-addons").disabled = false;
    }
  }
  return { validate, related, load, clear, context, open };
})();
if (typeof module !== "undefined") module.exports = AddonAdvisor;
