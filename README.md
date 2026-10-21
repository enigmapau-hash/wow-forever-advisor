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
