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
