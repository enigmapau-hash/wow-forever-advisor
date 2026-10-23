# wow-forever-advisor

Pantalla inicial de WoW Forever Advisor, con HTML, CSS y JavaScript nativo.

- Publicar los archivos en la raíz del sitio de GitHub Pages. Las rutas relativas
  mantienen la aplicación dentro de `/wow-forever-advisor/`.
- La instalación requiere HTTPS (o localhost para pruebas) y un navegador compatible.
  No se configura el despliegue en este repositorio todavía.
- Tras la primera visita y la activación del service worker, la pantalla y sus
  recursos quedan disponibles sin conexión.

Al publicar cambios, incrementar la versión de `CACHE_NAME` en `sw.js`. El nuevo
service worker precarga los archivos antes de activarse y elimina las cachés
anteriores de esta aplicación. Con conexión, se priorizan los recursos de la red;
la pantalla ya abierta refleja los cambios al volver a cargarla.

## Datos del Excel

Fuente: `Clases WoW Forever v5.xlsx`, conservada sin cambios. Para regenerar los
datos desde la raíz del repositorio, con Python 3 y sin instalar paquetes:

```sh
python tools/export_excel.py
python tools/export_excel.py --check
python -m unittest discover -s tests
```

El exportador también admite una fuente y salida distintas:

```sh
python tools/export_excel.py "ruta/al/maestro.xlsx" --output ruta/de/salida
```

`--check` compara los archivos existentes byte a byte
con una nueva exportación, sin escribirlos; falla si difieren o faltan.

- `data/race-advisor.json`: 51 fichas, con facción, clase, especialización,
  raza recomendada, alternativa, explicación, prioridad y motivo principal.
- `data/racials.json`: 8 perfiles con raza, fortalezas, debilidades, escala de
  utilidad, comentarios y uso principal. Se relacionan por el nombre literal
  `razaRecomendada` o `alternativa` de cada ficha con `raza`; no se duplican perfiles.
- `data/workbook-context.json`: las demás celdas de las seis hojas, incluidos
  criterios, observaciones editoriales, valores guardados de fórmulas, fórmulas,
  nombres definidos, tablas, comentarios e hipervínculos. No reproduce formatos
  ni la interfaz de Excel. Se omiten las identidades de los autores de comentarios.
- `data/export-report.json`: conteos, controles e incidencias del origen.

Cada ficha y perfil conserva hoja y fila de origen. Los cuatro JSON incluyen la
huella SHA-256 del Excel y se precargan para consultas offline. Se mantienen
literalmente acentos, saltos de línea, viñetas, estrellas y las nueve alternativas
`-` (no facilitadas). Las fórmulas no se ejecutan ni se recalculan.

El archivo v5 se identifica internamente como «4.0 RC1». Se conservan las reservas
editoriales sobre Tauren Sacerdote y Hex of Weakness, sin cambiar las fichas.
La exportación rechaza columnas inesperadas, duplicados, campos obligatorios
vacíos, referencias raciales ausentes o un número distinto de 27 + 24 fichas y
8 perfiles. Ante cambios del esquema o la cobertura hay que revisar el exportador.

## Race Advisor

«Abrir Race Advisor» muestra tres campos encadenados. Al cambiar facción o clase
se vacían las selecciones dependientes y se retira el resultado anterior. La ficha
une los datos originales de `race-advisor.json` con el perfil de `racials.json`.
«Volver al inicio» y el botón Atrás del navegador permiten navegar entre vistas.
Si la carga falla, se muestra un aviso con la opción «Reintentar».

Para comprobar las 51 combinaciones en la interfaz, servir el repositorio por HTTP
local (por ejemplo, `python -m http.server 8000 --bind 127.0.0.1`), abrir
`http://127.0.0.1:8000/tests/race-advisor.html` y pulsar «Ejecutar pruebas».
La prueba contrasta todos los campos con los JSON, las opciones disponibles,
el borrado de selecciones, las nueve alternativas «-» y la navegación. Después
de una ejecución online y la activación del service worker, se puede detener el
servidor y repetirla desde la misma pestaña para verificar el modo offline.

Dentro de Race Advisor, «Race Explorer» permite consultar los ocho perfiles del
JSON original y Cielonato, cuya capa independiente se describe en la revisión v26,
y volver al selector conservando su selección.
Cada perfil muestra «Raza recomendada» y «Raza alternativa» con las combinaciones
de facción, clase y especialización obtenidas exclusivamente de `race-advisor.json`.
Cada combinación abre su ficha completa con los tres campos seleccionados; los
grupos sin coincidencias muestran un aviso breve.

En la página de pruebas, «Comprobar raciales» verifica los ocho perfiles cruzados
con las 51 fichas, la separación de las 51 recomendaciones y 42 alternativas,
los grupos vacíos y la navegación desde cada coincidencia. También comprueba el
selector y la consulta racial; se puede repetir con el servidor detenido tras la
visita online, sin ejecutar de nuevo la prueba exhaustiva del selector.

## Selectores por botones

Los selectores usan botones de texto con `aria-pressed`, agrupados mediante
`fieldset` y `legend`. Tab permite recorrerlos y Enter o Espacio seleccionarlos.
Cambiar facción o clase limpia las selecciones dependientes y la ficha anterior.

Cada botón lleva `data-icon-kind` (`faccion`, `clase`, `especializacion` o `raza`)
y `data-icon-name`, con el nombre literal de `docs/icon-inventory.json`.
Las especializaciones añaden `data-icon-class` para distinguir nombres compartidos.
El texto permanece en `.option-label`; esta estructura permite incorporar más
adelante iconos locales autorizados sin cambiar el nombre accesible. No se generan
rutas ni imágenes mientras no existan esos archivos y sus permisos.

## Fase 7.2: iconos de WoW

Los cinco grupos de botones (facción, clase, especialización y raza, repartidos
entre Race Advisor y Profession Advisor) muestran imágenes originales del juego
junto a sus nombres visibles. Los 46 usos están documentados en
`docs/icon-inventory.json`: 2 facciones, 9 clases, 27 árboles y 8 razas.
Algunos árboles comparten ilustración; hay 44 direcciones gráficas distintas.

Para no redistribuir archivos propiedad de Blizzard en este repositorio, las
imágenes se cargan desde la CDN de Wowhead, `wow.zamimg.com`. La lista exacta
está en `icons/icon-map.js`; si falla una imagen, su botón conserva el nombre.
No se incluye el script de Wowhead ni bibliotecas externas; las imágenes sí
dependen de que su CDN responda en la primera visita con conexión.

El service worker guarda las imágenes en la **caché privada del navegador**.
Tras abrir la PWA con conexión, intenta descargar el conjunto en segundo plano
sin bloquear las fichas; los iconos ya guardados funcionan sin conexión.
**La primera visita requiere conexión para obtener las imágenes**. El navegador
puede vaciar su caché por falta de espacio, y la CDN puede cambiar sus rutas o
su disponibilidad. Nunca deben considerarse los archivos de la CDN parte de la
licencia de código del proyecto. En modo avión, deben continuar funcionando los
selectores y los resultados incluso si faltan imágenes.

Los identificadores gráficos de los árboles proceden de datos de la beta
organizados por [Zephras](https://zephras.com/data/) (selección de datos CC BY
4.0); los nombres de imágenes usados son referencias visuales del juego, no
prueba de que cada archivo sea la textura exacta del cliente beta.
World of Warcraft® y sus materiales gráficos pertenecen a Blizzard
Entertainment. Proyecto independiente, no afiliado ni respaldado por Blizzard.

La cobertura del mapa se comprueba sin dependencias con `node tests/icon-map.test.js`.
Tras publicar la actualización, hay que verificar en Android el aspecto de
todos los iconos y su recuperación en modo avión.

## Talent Advisor — nueve clases (beta)

La pantalla de inicio da acceso a **Talent Advisor**, disponible para
**las nueve clases**, con sus tres especializaciones y tres objetivos: **81 fichas**. Se conservan las 27 originales de Guerrero, Paladín y Chamán; se añaden 54 de Cazador, Pícaro, Sacerdote, Mago, Brujo y Druida. Tras elegir clase, especialización y
objetivo (**Subir al 60, PvP o Mazmorras**), se muestra una tarjeta con:

- Talentos de clase **para estudiar**, sin orden de compra ni supuesta build 51/51.
- Ventajas de **Legado** acordes al objetivo, sus requisitos/advertencias y cómo
  empezar a conseguir puntos mediante desafíos.
- Otros progresos relevantes y limitaciones de la propuesta.
- Número de compilación beta, fecha de revisión, fuentes y advertencia expresa
  de que la orientación editorial **todavía no está validada a nivel 60**.

**No hay calculadora ni árbol interactivo.** Los consejos editoriales son
provisionales y están separados de las fichas originales de Race Advisor y
Profession Advisor. **No se infiere una distribución final de 51 puntos** a
partir de las notas de Blizzard. Cambios de talentos o Legado en futuros parches
exigirán revisar las recomendaciones antes de marcarlas como actuales.

Datos: `data/talent-advisor-warrior.json` (9 fichas del Guerrero y 3 perfiles comunes de Legado), `data/talent-advisor-paladin.json` (9 del Paladín), `data/talent-advisor-shaman.json` (9 del Chamán) y `data/talent-advisor-catalog.json` (catálogo de clases). Cada clase mantiene sus propios pasos para obtener puntos de Legado. Consultar las fichas piloto en `docs/talent-advisor-*-pilot.md` y `docs/progression-systems.md`.
La PWA precarga los nueve JSON de clase y el catálogo en caché **v17** para uso offline tras la primera visita online. Los iconos siguen las mismas limitaciones de la CDN ya indicadas.

Pruebas sin paquetes adicionales:

```sh
python -m unittest discover -s tests
```

Para comprobar las 81 fichas y la navegación en el navegador, servir la
carpeta mediante HTTP local y abrir `tests/talent-advisor.html`; pulsar
«Ejecutar pruebas». El test de navegación de Race Advisor verifica que
la portada presenta solo los tres módulos disponibles, sin un módulo futuro.

## Mantenimiento v17 — portada simplificada

Se retira de la pantalla principal la tarjeta **Build Advisor — Próximamente** porque duplicaría gran parte de Talent Advisor. **No se elimina ninguna funcionalidad existente**: Race Advisor, Profession Advisor, Talent Advisor (81 fichas) y los perfiles de Legado siguen disponibles.

La idea de Build Advisor queda archivada como posibilidad futura, **solo si aporta una función claramente distinta** y el usuario la aprueba. No hay calculadora de puntos ni se planea introducirla en esta fase.

También se pule la puntuación de la descripción de raciales y se elimina una regla CSS específica de la antigua sección futura. La portada conserva sus tres tarjetas y el diseño Android aprobado. El service worker pasa a caché **v17** para actualizar el HTML y CSS sin afectar a los JSON editoriales.

## Patch Tracker (mantenimiento semiautomático)

La tarea de GitHub Actions `WoW Forever Patch Tracker` revisa a diario las
versiones y los datos de talentos y Legado de Zephras. Compara huellas por campo
con el estado de la rama independiente `patch-tracker-state` y, si encuentra
cambios relevantes, abre una incidencia de GitHub para revisión humana.

**No modifica automáticamente las fichas, los JSON publicados ni la PWA.** La
primera ejecución establece una referencia sin alertas retrospectivas. Consulta
el funcionamiento, las limitaciones de cobertura y la ejecución manual en
[`docs/patch-tracker.md`](docs/patch-tracker.md).

Los nuevos cambios de datos y código también ejecutan el flujo de comprobaciones `Advisor Data Checks` (pruebas de Python, JavaScript e iconos) en GitHub Actions.

### Ampliación de las nueve clases — 22/10/2026

El catálogo carga los nueve JSON `data/talent-advisor-*.json`. La v16
incorporó los seis nuevos archivos, que siguen disponibles offline en v17
tras una primera visita online.
Los nombres ingleses de nuevos talentos se identifican como tales para evitar
inventar localizaciones. Las listas son prioridades de estudio, no builds exactas
ni órdenes de gasto. Véase [contraste editorial](docs/talent-advisor-nine-classes.md).

Pruebas de navegador automatizadas (Node, Playwright 1.62.1 y Chromium):

    npm install --no-save --package-lock=false playwright@1.62.1
    npx playwright install chromium
    node tests/browser-smoke.cjs

El runner inicia un servidor local, recorre 81 fichas, prueba las otras vistas,
teclado, móvil, un fallo de datos con reintento y recarga offline.
GitHub Actions ejecuta estas comprobaciones además de Python y sintaxis.

## Addon Advisor — v18 (catálogo inicial)

Módulo independiente con una selección inicial breve (Questie, Leatrix Plus y
Auctionator según necesidad), filtros simples y fuentes originales. DBM y
GatherMate2 figuran en observación. Publicación para Forever y prueba real dentro
del juego son estados distintos; no se afirma probado ningún addon.

Las fichas de Race, Profession y Talent Advisor reutilizan el catálogo solo donde
hay una utilidad concreta. Todos los datos preexistentes y Patch Tracker se
conservan. La v18 introdujo la caché del catálogo y script para consulta offline;
los enlaces externos necesitan conexión. Detalles de evidencia desplegables.

Véase [investigación, criterios y pruebas](docs/addon-advisor.md). Añadidas pruebas
editoriales con `node tests/addon-advisor.test.js`, conservación de v17 en Python
y filtros, referencias, anchos móviles, reintento y offline en el runner de navegador.
Las medidas móviles se verifican por emulación; no se ha probado en Android físico.

## Addon Advisor — v19 (ampliación contrastada)

Se amplía el catálogo de **5 a 11 addons** con EllesmereUI, ProcDoc,
CraftProfit Forever, ItemRack Universal, Dialogue UI y OpenMap. Cada uno tiene
archivo del autor identificado para **Forever 1.60.1**, con fecha, versión,
limitaciones y enlace verificable. Se conservan Questie, Leatrix Plus,
Auctionator, DBM (núcleo en observación) y GatherMate2 (pendiente de verificar).
**No se etiqueta ningún addon como probado dentro del juego por nuestra PWA.**
El vídeo compartido por el usuario aporta experiencia de su creador, pero sin
URL ni un registro verificable de pruebas individuales no justifica elevar ese
estado. GuildMap queda como candidato opcional para hermandades; no se añade
por defecto. Otros nombres ambiguos del vídeo tampoco se publican como fichas.

**Para empezar** muestra cinco alternativas según necesidad (Questie,
Leatrix Plus, Auctionator, ProcDoc y OpenMap), no una lista obligatoria de
instalación. Hay filtros por utilidad y detalles opcionales. Se conservan dos
referencias contextuales como máximo: ProcDoc para Cazador y ciertas otras
clases, CraftProfit para profesiones de fabricación, ItemRack para PvP y
OpenMap para explorar al subir al 60. Las fichas originales y Patch Tracker no
se modifican. Caché **v19**, con todos los JSON disponibles offline tras la
primera visita online. Las fuentes externas siguen necesitando conexión.

Consulta los [criterios editoriales y la evidencia de cada addon](docs/addon-advisor.md).
Las pruebas automatizadas comprueban filtros, contextos, fuentes, teclado,
navegación, pantallas móviles de 320–412 px y las 81 fichas offline. La
prueba en Android físico corresponde al usuario.

## Race Explorer — v20 (nomenclatura)

Se renombra «Explorar raciales» a **Race Explorer** en la portada y en su
pantalla de consulta. La descripción explica que se exploran habilidades
raciales. No cambian los datos, rutas, lógica ni diseño. Caché PWA **v20** para
actualizar la interfaz en dispositivos ya instalados.

## Talent Advisor — v21 (auditoría de evidencias)

Revisión editorial de las 81 fichas frente a la compilación documentada
`1.60.1.70450`, las notas oficiales de clases del 15/10/2026 y la fecha
de cierre de beta anunciada por Blizzard. Se detectan **18 especializaciones
de seis clases** que reutilizan exactamente los mismos talentos destacados
para los tres objetivos (54 fichas), sin diferenciación verificada por
objetivo. Se explicita esta limitación en esas seis clases, sin inventar
nuevos talentos, repartos o supuestas pruebas de nivel 60.

El resto de los datos, las recomendaciones existentes y el diseño se
conservan. Se amplían pruebas de integridad y de visualización offline,
se añade la [auditoría editorial](docs/talent-advisor-v21-audit.md) y
se renueva caché a **v21**.

## Race Advisor y Race Explorer — v22 (raciales de la beta)

Sin modificar el **Excel maestro**, sus 51 recomendaciones, las ocho
fichas raciales originales ni las puntuaciones, se incorpora una capa
editorial independiente de los cambios raciales oficiales publicados por
Blizzard el 15/10/2026. Ambos módulos muestran las modificaciones
correspondientes a la raza seleccionada. Race Advisor también muestra
los cambios de la alternativa, cuando existe.

Las notas cubren las ocho razas del Excel y no incluyen la nueva raza
jugable **Cielonatos (Skyborne)**. No se actualizan los rankings sin
contrastar su efecto en el meta y en la versión de lanzamiento. Los
nuevos datos están disponibles offline tras actualizar la PWA: caché **v22**.

Véase [revisión y fuentes de la v22](docs/racial-v22-review.md).

## Navegación y claridad de contenido — v23

La portada conserva el diseño oscuro y dorado: **la tarjeta principal de
Race Advisor y los cuatro módulos son enlaces nativos que ocupan la tarjeta
completa**, con acceso por toque, ratón, tabulador y Enter. Se suprimen los
botones «Abrir…» redundantes y se agrupan los cuatro módulos en dos columnas
en pantallas medianas y grandes (una columna en móvil).

En Race Advisor se mantiene visible el motivo principal, las fortalezas y
debilidades y la información oficial de beta; la explicación larga y el
perfil racial general siguen disponibles en secciones ampliables. En Race
Explorer se pliegan solo los comentarios extensos. En Talent Advisor
«Otros progresos» y «Versión y fuentes» son ampliables; las advertencias de
beta y las prioridades principales permanecen visibles. Se diferencian los
rótulos de las estrellas por objetivo y se corrige el título de pestaña
«Race Explorer». **No se alteran textos exportados, rankings, talentos,
raciales, profesiones, addons ni datos del Excel**.

Se conserva la navegación existente y se actualizan las pruebas automáticas
de enlaces, teclado, tamaños de pantalla, contenidos y caché **v23**.

## Claridad editorial — v24

Se aplica la auditoría [#26](https://github.com/enigmapau-hash/wow-forever-advisor/issues/26) sin editar
las fuentes del Excel ni los catálogos originales. Race Explorer diferencia
«Dónde se recomienda esta raza» de «Dónde aparece como alternativa»;
«Elfo» significa elfo de la noche. Race Advisor diferencia las dos
escalas de estrellas sin prometer comparabilidad.

Profession Advisor muestra de forma visible su carácter **provisional** y su
alcance (progresión y PvP; no distingue raza ni facción).
Talent Advisor ofrece una advertencia de beta compacta por ficha y avisa
expresamente si los talentos se repiten entre objetivos; la advertencia
editorial y las limitaciones originales íntegramente conservadas pueden
consultarse en «Versión, documentación y fuentes». Los datos no se
modifican.

Addon Advisor evita repetir el mismo «sin prueba registrada» en el estado
visible de cada tarjeta. **El estado de publicación y los avisos críticos
siguen visibles**, y la evidencia, la prueba independiente y las limitaciones
quedan disponibles en el desplegable. «Selección inicial» sustituye el
nombre editorial «Para empezar»; las cinco entradas y sus criterios son
idénticos. Las referencias contextuales agrupan la cautela una sola vez
cuando procede.

Se mantiene el aspecto de v23, enlaces a módulos, navegación, comprobaciones
offline y datos originales. Caché de PWA actualizada a **v24**; pendiente
comprobación visual del usuario en PC y, por separado, en Android real.

## Limpieza de interfaz y alineación de selectores — v25

Los mensajes dirigidos al usuario en Race Advisor y Race Explorer dejan de
referirse al **Excel** como material de trabajo. Se conserva internamente toda
la trazabilidad, la exportación y sus pruebas. Las limitaciones de beta, la
diferencia entre escalas de estrellas y la cobertura de ocho razas
permanecen visibles.

Las nueve clases se organizan en una cuadrícula centrada **3×3** en Race
Advisor, Profession Advisor y Talent Advisor. Race Explorer muestra sus ocho
razas en **4×2 en PC** y **2×4 en pantallas estrechas**; la hoja de estilos
ya admite una novena raza con **3×3** sin dejar una tarjeta huérfana.
Esto no cambia iconos, navegación ni datos. Caché PWA **v25**.

## v26 · Cielonato (Skyborne)

Race Explorer añade Cielonato como novena raza con variantes Alianza / High Order
y Horda / Windshaper. Race Advisor añade una consideración de beta para las cinco
clases compatibles de cada facción, sin cambiar ninguna de las 51 recomendaciones
originales ni asignar estrellas nuevas. Los datos viven en `data/skyborne.json` y
se incluyen en la caché v26; los ocho perfiles originales conservan su exportación.

Las facultades y clases se han contrastado directamente con Blizzard. La valoración
competitiva sigue pendiente; el detalle de monturas de Wowhead queda separado de
los datos oficiales. Se ha integrado el retrato masculino de Cielonato enlazándolo a la misma CDN
de Wowhead utilizada por las ocho razas anteriores (sin copiar binarios al
repositorio). Si la imagen no carga, el botón conserva su texto. La autorización
jurídica para reproducir materiales de terceros no se presume, igual que con los
demás iconos. Si falla el JSON adicional,
la cabecera y el CTA muestran las ocho opciones disponibles.
Esquema, fuentes, incertidumbres y pruebas: [revisión v26](docs/skyborne-v26.md).

Para ejecutar el recorrido de regresión completo: `node tests/browser-smoke.cjs`.
Puede usarse `BROWSER_EXECUTABLE=/usr/bin/chromium` si Chromium ya está instalado;
en CI se mantiene el navegador preparado por el workflow Advisor Data Checks.

## v27 · Recomendaciones basadas en criterios, no en compatibilidad

Race Advisor conserva exactamente las 51 fichas valoradas de partida: **una raza
recomendada y una alternativa si existe**. La inclusión de Cielonato en las 30
combinaciones de facción/clase compatibles en v26 fue una consideración de
compatibilidad, **no una evaluación comparativa con los criterios originales**.
Por coherencia con el propósito del asesor se retira por completo del resultado
de Race Advisor, sin reemplazar sus recomendaciones ni introducir avisos de
compatibilidad. Race Explorer mantiene la novena raza, sus dos variantes,
facultades, fuentes y retrato. Si en el futuro se evalúa Cielonato con los
mismos criterios y evidencia suficiente, podrá entrar en un ranking mediante
una actualización explícita y justificada.

La navegación entre los módulos sigue disponible. Se añade regresión de navegador
sobre las **51 recomendaciones exactas** para impedir que una raza se sugiera
únicamente por ser compatible. Caché actualizada a **v27**.

## v28 · Limpieza visual aprobada y auditoría de alternativas

Las tarjetas secundarias de portada son más compactas, con títulos y
descripciones más legibles y sin numeración decorativa. Se ocultan las estrellas
de prioridad y utilidad racial en Race Advisor y Race Explorer: sus datos
originales siguen conservados para trazabilidad interna. Las nueve fichas sin segunda raza aprobada ya no muestran un guion:
Chamán Alianza indica que Enano es la única raza disponible, mientras Druida
indica que la alternativa queda pendiente de evaluación comparativa.

**Separación editorial:** el archivo original contiene 51 combinaciones y 9
alternativas con valor `-` (6 Druida y 3 Chamán Alianza); la falta de una
alternativa real no se resuelve inventando una raza. Los Cielonatos son
compatibles con Druida, pero no han sido clasificados aún entre las mejores
opciones. La investigación de Paladín No-muerto en Horda queda documentada
fuera de esta revisión visual: es una clase confirmada en Forever, ausente
de las 51 fichas del Excel v5, pero ya tiene contenido de clase independiente
en Talent Advisor. Añadir tres fichas nuevas a Race Advisor requiere una
decisión y trazabilidad editorial específica.

Caché PWA v28. Ningún JSON de recomendaciones se modifica.
