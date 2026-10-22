"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const context = { self: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "icons/icon-map.js"), "utf8"), context);
const map = context.self.WOW_ICON_MAP;
const source = JSON.parse(fs.readFileSync(path.join(root, "docs/icon-inventory.json"), "utf8"));

for (const entry of source.facciones) assert.ok(map.faccion[entry.nombre], `Falta facción ${entry.nombre}`);
for (const entry of source.clases) {
  assert.ok(map.clase[entry.clase], `Falta clase ${entry.clase}`);
  for (const spec of entry.especializaciones) {
    assert.ok(map.especializacion[entry.clase]?.[spec.nombre],
      `Falta ${entry.clase} · ${spec.nombre}`);
  }
}
for (const entry of source.razas) assert.ok(map.raza[entry.raza], `Falta raza ${entry.raza}`);

const expected = source.facciones.length + source.clases.length
  + source.clases.reduce((n, cls) => n + cls.especializaciones.length, 0)
  + source.razas.length;
assert.equal(expected, 46);
assert.equal(context.self.WOW_ICON_URLS.length, 44, "Hay 44 imágenes distintas");
for (const url of context.self.WOW_ICON_URLS) {
  assert.match(url, /^https:\/\/wow\.zamimg\.com\/images\/wow\/icons\/large\/[a-z0-9_]+\.jpg$/);
}
console.log("OK: 46 usos cubiertos por 44 iconos; URLs y claves validadas.");
