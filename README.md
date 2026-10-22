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

Dentro de Race Advisor, «Explorar raciales» permite consultar las ocho razas del
JSON y volver al selector conservando su selección.
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
No se incluye el script de Wowhead ni ninguna dependencia de terceros.

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

Las comprobaciones visuales y offline reales en Android son necesarias antes
de fusionar la PR.
