"use strict";
const assert = require("node:assert/strict");
const catalog = require("../data/addon-advisor.json");
const { validate, related } = require("../addon-advisor.js");
validate(catalog);
assert.equal(catalog.addons.filter((a) => a.imprescindible).length, 3);
const ids = (context) => related(catalog, context).map((r) => r.addon.id);
assert.deepEqual(ids({ modulo: "race", clase: "Guerrero" }), []);
assert.deepEqual(ids({ modulo: "race", clase: "Druida" }), ["leatrix-plus"]);
assert.deepEqual(ids({ modulo: "talent", clase: "Guerrero", objetivo: "Subir al 60" }), ["questie"]);
assert.deepEqual(ids({ modulo: "talent", clase: "Guerrero", objetivo: "Mazmorras" }), []);
assert.deepEqual(ids({ modulo: "talent", clase: "Druida", especializacion: "Feral", objetivo: "Subir al 60" }), ["questie", "leatrix-plus"]);
assert.deepEqual(ids({ modulo: "profession", profesiones: ["Minería", "Herrería", "Minería"] }), ["auctionator"]);
assert.deepEqual(ids({ modulo: "profession", profesiones: ["No existe"] }), []);
assert.deepEqual(ids({ modulo: "race", clase: "Mago", raza: "Gnomo" }), []);

function rejects(mutate) {
  const copy = structuredClone(catalog);
  mutate(copy);
  assert.throws(() => validate(copy));
}
rejects((c) => c.addons.push(c.addons[0]));
rejects((c) => c.addons[0].fuentes[0].url = "javascript:alert(1)");
rejects((c) => c.addons[0].fechaPublicacion = "2026-10-23");
rejects((c) => c.addons[0].fechaRevision = "2026-02-30");
rejects((c) => c.addons[0].estado = "probado_forever");
rejects((c) => c.addons[4].imprescindible = true);
rejects((c) => c.addons[4].contextos = [{ modulo: "profession", motivo: "Falso" }]);
rejects((c) => c.addons[3].contextos = [{ modulo: "talent", motivo: "Núcleo no demuestra encuentros" }]);
rejects((c) => c.addons[0].versionCliente = "1.15.9");
rejects((c) => c.addons[0].afinidad = {});
console.log("Addon catalog: evidence gates, safe sources, conservative matching, deduplication OK");
