# Addon Advisor · v19

Revisión editorial: **22/10/2026**, para **WoW Forever 1.60 beta**.
Base inicial: v17 estable, commit `7479f11`; ampliación v19 desde v18. Módulo independiente, misma paleta y tarjetas;
sin calculadoras, nuevas bibliotecas ni descargas de addons desde la PWA.

## Qué significa cada estado

- **Publicado por el desarrollador para Forever**: se ha abierto un archivo del
  proyecto original que enumera Forever y el cliente 1.60.1. No significa probado.
- **Probado en Forever con evidencia**: exige registro enlazado con fecha,
  cliente y alcance concretos. No hay ninguna entrada con este estado en v19.
  Las pruebas de navegador de esta PWA no son pruebas de addons dentro del juego.
- **Pendiente de verificar**: falta confirmar el archivo o la compatibilidad;
  no entra en imprescindibles ni referencias contextuales.

`estado` acredita la evidencia disponible; `recomendacion` es una decisión
editorial independiente. Por eso DBM puede tener un núcleo publicado y seguir
en observación. `pruebaForever: null` significa sin prueba registrada, no fallo.
Las fechas de publicación son las de los archivos consultados, no la última
actualización general del proyecto ni una promesa de que sigan siendo los últimos.

## Catálogo inicial v18 — fuentes primarias conservadas

| Addon / autor de la ficha | Archivo observado | Evidencia y decisión |
| --- | --- | --- |
| Questie / TheCrux_BB y equipo | [v12.1.0+v1.0.6, 12/10/2026](https://www.curseforge.com/wow/addons/questie/files/9150393) | Forever, 1.60.1; cambios específicos en tooltips, misiones y datos del 10 de octubre. Para empezar si necesitas orientación de misiones; cobertura integral sin verificar. |
| Leatrix Plus / Leatrix | [1.60.25-forever, 21/10/2026](https://www.curseforge.com/wow/addons/leatrix-plus/files/9275554) | Archivo exclusivo Forever, 1.60.1; ajustes de listado y corrección de error Lua por alcance. Historial 1.60.15: barra de recursos del Druida en gato/oso. Para empezar si necesitas sus opciones. |
| Auctionator / plusmouse | [341, 13/10/2026](https://www.curseforge.com/wow/addons/auctionator/files/9162359) | Forever y 1.60.1 en archivo multicliente. El cambio 341 actualiza el TOC de 12.1.5: no atribuirle una corrección de Forever. Para empezar si usas subastas. |
| DBM / MysticalOS | [Núcleo 12.1.17, 22/10/2026](https://www.curseforge.com/wow/addons/deadly-boss-mods/files/9284229) | Núcleo publicado con Forever y 1.60.1; [documentación del autor](https://www.curseforge.com/wow/addons/deadly-boss-mods) separa paquetes por contenido. Sin evidencia suficiente de encuentros concretos; en observación, sin referencia automática en Mazmorras. |
| GatherMate2 / moonfann | [Ficha original](https://www.curseforge.com/wow/addons/gathermate2) y [archivos](https://www.curseforge.com/wow/addons/gathermate2/files/all) | Existe categoría Forever, pero los archivos recientes consultados son Retail (1.52.3 del 17/08/2026). No se ha confirmado archivo 1.60.1; versión y fecha de publicación para Forever quedan nulas. En observación. No se deduce incompatibilidad definitiva. |

Se contrastó también [Library Books (Mage Books) and More!, de Taraezor](https://www.curseforge.com/wow/addons/mage-books):
la ficha anuncia libros para Forever y un archivo v4.07 del 11/10/2026; también
advierte de libros todavía ausentes. No se añade en esta selección inicial:
su actividad es la colección de libros, no una necesidad de todos los magos ni
una mejora racial. No hace falta ampliar el catálogo para completar nueve clases.
Tampoco se extrapolan addons antiguos de mascotas, tótems o recursos desde Classic.

Se descartaron como acreditación de prueba los listados de terceros que llaman
«funciona» a la mera presencia de un archivo, las categorías del proyecto sin
archivo y los comentarios aislados sin cliente, versión y alcance verificables.
No se ha ejecutado ningún addon dentro de WoW durante esta revisión.

## Catálogo único y referencias

`data/addon-advisor.json` contiene autor, finalidad, categoría, enlaces originales,
afinidades, estado, archivo/cliente, fechas, evidencia, límites y reglas de contexto.
`addon-advisor.js` valida y consume esa misma fuente. La interfaz empieza con tres
opciones según necesidad en v18; «Todos» muestra los once candidatos en v19, incluidos los dos
en observación. «Para empezar» muestra cinco alternativas opcionales. Los detalles de evidencia se despliegan a petición, manteniendo
visibles el estado, la fecha y la fuente.

- Race Advisor: Druida recibe Leatrix Plus por la barra en gato/oso y Cazador puede recibir ProcDoc para alertas de sus habilidades; ambas son ayudas de **clase**, no raciales. Ninguna recomendación inventada por raza.
- Profession Advisor: Auctionator solo cuando las profesiones de la ficha coinciden con su afinidad; CraftProfit Forever se añade si hay profesiones de fabricación. Son funciones distintas (consulta de precios frente a costes por receta) y se explican como opcionales.
- Talent Advisor: Questie para Subir al 60; Leatrix Plus para Druida Feral; ProcDoc para Cazador y ciertas habilidades de Guerrero/Mago; OpenMap para exploración al subir y ItemRack para cambios de equipo en PvP, con un máximo de dos.
  Máximo dos referencias, sin duplicar la ficha completa del catálogo.
- DBM y GatherMate2 no generan recomendaciones contextuales mientras sigan en
  observación. Cambiar clase/especialización elimina la referencia anterior y
  cancela visualmente respuestas pendientes. Un fallo del catálogo opcional no
  bloquea datos de raza, profesiones o talentos.

## Conservación, offline y mantenimiento

Los archivos de datos preexistentes, el Excel y el Patch Tracker no se modifican.
`tests/v17-preserved-hashes.json` fija sus huellas desde `origin/main` v17, normalizando
solo CRLF/LF de archivos de texto para Windows/Linux (Excel se compara binariamente).
El catálogo y su script se precargan en **caché v19**, junto al conjunto
preexistente. Las fuentes externas y descargas requieren conexión. El catálogo
offline representa la revisión guardada, no una comprobación en vivo.

La revisión de addons es manual: Patch Tracker mantiene su alcance de talentos y
Legado. Al revisar un addon, abrir su archivo original, confirmar el cliente,
leer cambios y límites, actualizar la fecha de revisión y cambiar evidencia y
decisión por separado. Para usar `probado_forever` hay que completar
`pruebaForever` con fuente, fecha, cliente y alcance; nunca ascenderlo solo por
una etiqueta Forever. Incrementar caché al publicar cambios del catálogo.

## Verificación reproducible

```sh
python tools/export_excel.py --check
python -m unittest discover -s tests
node tests/addon-advisor.test.js
node tests/icon-map.test.js
node tests/browser-smoke.cjs
```

La CI incluye Python, validación editorial JS y navegador Chromium. El runner
comprueba 81 talentos, 51 razas y 27 profesiones; precaché v19 y eliminación de
caché v18; filtros, estados y fuentes; referencias condicionales y sin duplicados;
Atrás, teclado y foco; JSON inválido/reintento, fallo opcional y respuesta tardía;
recarga offline y anchos 320/360/390/412 px con controles táctiles de al menos 44 px.
El tamaño conjunto de catálogo y script tiene límite de 35 kB sin comprimir.
Los anchos móviles se comprueban con Playwright; **no equivalen a una prueba en
un dispositivo Android físico**. La instalación desde Android requiere la
comprobación manual habitual en el dispositivo del usuario.

## Ampliación v19 — archivos originales y límites

Se conserva la selección editorial previa y se agregan **seis** referencias
verificadas por archivo del desarrollador para el cliente **1.60.1**:

| Addon y autor | Archivo Forever revisado | Para qué se recomienda y qué NO demuestra |
| --- | --- | --- |
| **EllesmereUI**, Ellesmere | [v9.6.1, 19/10/2026](https://www.curseforge.com/wow/addons/ellesmereui/files/9252453) | Suite avanzada de personalización. Alternativa a Leatrix Plus; hay funciones que se solapan. La publicación multiplataforma incluye Forever y cambios propios del cliente, no prueba independiente de todas sus opciones. |
| **ProcDoc**, wsmaxcy | [v4.10.1, 17/10/2026](https://www.curseforge.com/wow/addons/procdoc/files/9220318) | Alertas de procs y reacciones para las nueve clases según el autor, incluida la activación de Counterattack/Mongoose Bite de Cazador, Overpower/Revenge de Guerrero y Fingers of Frost de Mago. Depende del Cooldown Manager y de habilidades realmente usadas. Puede tener límites en combate; no afirmar que detecta todos los procs. |
| **CraftProfit Forever**, vystery | [0.5.0, 20/10/2026](https://www.curseforge.com/wow/addons/craftprofit-forever/files/9270115) | Coste/rentabilidad estimada de recetas. El autor describe su escaneo propio como probado; **integración Auctionator/TSM y etiquetas de instructores aún sin probar por el autor**. No prometer beneficios ni trasladar la prueba a nuestro estado `probado_forever`. |
| **ItemRack Universal**, Bl4ut0 | [4.56.1, 16/10/2026](https://www.curseforge.com/wow/addons/itemrack-universal/files/9205989) | Sets de equipo y accesos rápidos. Paquete universal Forever/Classic; instalar ItemRack e ItemRackOptions juntos. Cambios en combate sujetos a restricciones de juego. Se ha elegido explícitamente esta variante, no cualquier bifurcación de ItemRack. |
| **Dialogue UI**, Peterodox | [1.0.6, 04/10/2026](https://www.curseforge.com/wow/addons/dialogueui/files/9058348) | Diálogos de misiones más inmersivos. Publicación multicliente con apartado de cambios específicos Forever. Solo estética y lectura; no mejora rutas de misiones. |
| **OpenMap**, jigrobbulus | [v0.7.2-beta-forever, 21/10/2026](https://www.curseforge.com/wow/addons/openmap/files/9278370) | Zoom y desplazamiento continuo del mapa. El autor confirma corrección de iconos de Questie al desplazarse por zonas. Archivo beta de unos 86 MB; el rendimiento puede variar. Confirmado por el usuario como el addon mencionado en el vídeo. |

**Criterio de evidencia:** el vídeo transcrito por el usuario declara pruebas
prácticas durante la beta, pero **no se facilitó una URL directa o registro
individual verificable**. Además, en el vídeo se reconoce que GatherMate2 aún
no se ha probado. Por eso las seis altas quedan `publicado_forever`,
`pruebaForever: null`. No se atribuyen pruebas internas al proyecto.

**Otros candidatos:** GuildMap tiene un archivo para Forever y podría ser útil a
hermandades donde varios miembros lo usen, pero requiere una revisión editorial
aparte y no forma parte de los **11**. No se incorporan el supuesto «Nit Roll»
ni el medidor de DR sin identificar el addon exacto en la fuente original.

**Contextos:** Cazador muestra ProcDoc en Race Advisor como ayuda de clase,
y en Talent Advisor para sus habilidades compatibles. Se incluye ProcDoc para
Guerrero y Mago Escarcha con cautela; CraftProfit solo se ofrece si alguna
profesión recomendada fabrica objetos; OpenMap al subir al 60 cuando hay sitio
entre las dos referencias como máximo; ItemRack al consultar PvP. Las
referencias se generan desde el catálogo común, se limpian al cambiar selección
y nunca alteran la recomendación original de raza, profesión o talento.

**Presentación:** el filtro «Para empezar» tiene 5 herramientas **opcionales**,
«Todos» enseña las 11 y los ocho filtros temáticos sirven para localizar por
necesidad. No se requiere instalar todas. El modo offline muestra los datos
editoriales cacheados, no prueba actualizaciones remotas ni instala addons.
