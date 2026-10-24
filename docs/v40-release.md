# v40 · Comparativas por raza, clase y especialización

Publicación aprobada el 24 de octubre de 2026 en la PR #51.

Race Advisor incorpora 48 comparativas específicas: «A favor», «A tener en
cuenta» y una conclusión de dos párrafos que distingue cuándo conviene cada
raza. El análisis pondera dos raciales activas y dos pasivas, las habilidades
de clase y especialización y, para Sacerdote, sus dos hechizos raciales propios.
Las seis fichas sin segunda raza conservan su explicación sin inventar parejas.
Las fuentes oficiales y los límites de beta acompañan a los análisis.

La única corrección de clasificación autorizada afecta a Horda · Sacerdote ·
Sagrado: Troll sigue como principal y No-muerto sustituye a Tauren como
alternativa jugable. Se aplica mediante una capa validada contra la huella de
la fuente; el Excel y los JSON exportados permanecen intactos. Las otras
53 clasificaciones y las seis alternativas Druida con Cielonato se conservan.

Los archivos de trabajo con sufijo `-draft` conservan su nombre para mantener
la trazabilidad de la investigación. La capa consolidada y la auditoría
registran `publicacion_v40_aprobada_usuario`; los borradores por clase quedan
como referencias de elaboración. La aplicación carga solo la capa consolidada
y la corrección aprobada, ambas incluidas en la precarga offline.

`version.js` declara v40 para el pie y la caché del service worker. La prueba
crea una caché v39, verifica su eliminación al activar v40 y recorre de nuevo
las 54 fichas sin conexión, comparando los cuatro argumentos y las dos
conclusiones exactas de las 48 parejas con los datos consolidados.

Validación: suite Python completa, exportación `--check`, mapa de iconos,
catálogo de addons, sintaxis JavaScript y `node tests/browser-smoke.cjs`.
El navegador recorre las 54 fichas raciales en 320, 390, 820 y 1280 px,
81 fichas de talentos, 27 de profesiones, navegación, teclado, addons,
recuperación ante fallos y funcionamiento offline.

Las pruebas móviles usan tamaños de navegador; la revisión en un dispositivo
Android físico queda fuera de esta comprobación automatizada.
