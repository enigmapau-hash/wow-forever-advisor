# v39 · Explicaciones de razas alternativas

Publicación aprobada el 24 de octubre de 2026.

Race Advisor presenta la tarjeta alternativa con el mismo orden en todas las
fichas: facultad racial, motivo resumido y explicación que comienza por el
nombre de la habilidad. Las seis comparaciones de Druida con Cielonato evitan
repetir el contenido ya visible en la tarjeta alternativa y conservan el
contexto de cada facción.

El acabado mantiene una jerarquía tipográfica y unos espaciados homogéneos.
Las comprobaciones de navegador cubren las 54 fichas raciales y su legibilidad
en 320, 390, 820 y 1280 px, además de los módulos de talentos, profesiones,
addons y el funcionamiento sin conexión.

`version.js` declara `v39`, compartida por el pie de página y el nombre de la
caché del service worker. La prueba de actualización crea una caché v38 y
verifica que se elimina al activar v39 y que la aplicación funciona offline.

La preparación de esta publicación solo actualiza versión, expectativas de
pruebas y documentación sobre el contenido aprobado en la PR #50. No cambia
el Excel maestro, los JSON de rankings, los criterios ni otros argumentos
editoriales.

Validaciones de publicación:

```sh
python -m unittest discover -s tests -p 'test_*.py' -v
node tests/icon-map.test.js
node tests/addon-advisor.test.js
node --check app.js
node --check addon-advisor.js
node --check icons/icon-map.js
node --check sw.js
node --check version.js
node --check tests/talent-advisor.test.js
node tests/browser-smoke.cjs
```
