# Cielonato (Skyborne) · revisión v26

Base: [issue #29](https://github.com/enigmapau-hash/wow-forever-advisor/issues/29), leída completa, incluidos sus comentarios. Implementación desde `main` v25, commit `3a41b72488c4de048d4e160650dedf55d2245a7e`.

## Estado de la evidencia (23/10/2026)

**Contraste independiente pendiente.** La issue aporta una auditoría fechada y referencias oficiales, pero no sustituye la consulta de las fuentes. Los accesos a las dos primeras URL devolvieron `CONNECT tunnel failed, response 403` en el proxy del entorno, cuya lista de destinos solo incluía `api.github.com`. No se obtuvo contenido oficial que permita confirmar por cuenta propia los datos o descartar cambios posteriores al 15 de octubre.

El usuario autorizó añadir `news.blizzard.com`, `us.forums.blizzard.com`, `www.wowhead.com` y `wow.zamimg.com`. Se guardó el borrador conservando `api.github.com`; su aplicación/publicación está pendiente. Una configuración deseada no demuestra acceso efectivo. Esta limitación se refleja en `revision.estado: pendiente` y en la interfaz. No se describe como verificado lo que solo se ha documentado en la tarea.

| Fuente indicada por la issue | Datos a contrastar | Estado |
| --- | --- | --- |
| [Blizzard · Meet the New Skyborne](https://news.blizzard.com/en-us/article/24302071/wow-forever-meet-the-new-skyborne) | Origen en Zephras Isle, ambas facciones, nombres y facultades | Consulta bloqueada por el proxy |
| [Blizzard · Beta Development Notes · 15/10/2026](https://us.forums.blizzard.com/en/wow/t/wow-forever-beta-development-notes-%E2%80%93-updated-october-15/2360696/6) | Wind Blessed +3 % (antes +1 %), Walk on Air 90 s, lanzamientos en movimiento, Read Leyline mínimo 30 s | Consulta bloqueada por el proxy; no se ha comprobado si existen notas posteriores |
| [Blizzard · clases por raza y facción](https://news.blizzard.com/en-us/article/24304075/create-the-hero-you-want-to-be-in-world-of-warcraft-forever) | Cuatro clases comunes y una exclusiva por facción | Pendiente de acceso |
| [Wowhead · Skyborne overview](https://www.wowhead.com/forever/guide/skyborne-race-overview) | Contraste secundario e identificación de imágenes | Pendiente de acceso; no prevalece sobre Blizzard |

Los valores incorporados se transcriben **de la evidencia recogida en #29**, no de una lectura independiente de Blizzard. Se conserva la distinción explícita entre datos de beta pendientes de contraste y evaluación editorial pendiente. No hay confirmación de lanzamiento; la fecha anunciada para el 4 de noviembre también requiere contraste.

## Modelo independiente

`data/skyborne.json`, esquema 1:

- `raza`, `nombreOriginal`, `origen`, `estado`: identidad y condición de beta.
- `revision`: fecha, estado del contraste, enlace a la tarea y alcance de la evidencia.
- `fuentes`: referencias oficiales identificadas por `id`; cada facultad y variante enlaza a esos identificadores.
- `comunes`: facultades compartidas con nombres originales, descripción, tipo y mecánicas explícitas. Walk on Air: 10 s de planeo, 90 s de reutilización; Wind Blessed: +3 % de celeridad; Elemental Insight: +5 % contra elementales.
- `variantes`: facción, nombre original, clases y facultad específica. **Alianza / High Order**: Guerrero, Cazador, Pícaro, Druida y Mago; Read Leyline, +100 % de regeneración de salud/maná, lanzamiento en movimiento y duración mínima de 30 s. **Horda / Windshaper**: Guerrero, Cazador, Pícaro, Druida y Chamán; Skysight, +10 % de movimiento/montura, lanzamiento en movimiento.
- `evaluacion`: criterio de consideración y limitación, siempre pendiente. Sin `prioridad`, `escalaUtilidad`, estrellas ni ranking global. No se equiparan las facultades de facción ni se clasifica la raza como «solo PvP».
- `icono`: estado, URL nula y motivo. No se ha verificado un icono específico ni una autorización aplicable.

El validador de esta capa rechaza clases ajenas a cada facción, variantes duplicadas, referencias desconocidas, fuentes externas al dominio oficial, valores de beta obsoletos y metadatos incompletos. Si falla o no puede leerse el archivo, se conservan los ocho perfiles y el asesor original, con un aviso sobre Cielonato. No se amplían los validadores originales para aceptar una novena fila inventada del Excel.

## Integración y conservación

Race Explorer ofrece nueve botones y una rejilla 3 × 3, con las variantes dentro de la vista existente. La ficha de Cielonato muestra facultades comunes, clases, diferencia de facción, fuentes y limitaciones. El perfil original y sus listas de recomendaciones se ocultan al elegir Cielonato: no se fabrican coincidencias en las 51 fichas originales.

Race Advisor mantiene su resultado original y añade una consideración separada solo para las cinco clases legales por facción: 30 combinaciones de especialización elegibles; 21 excluidas. Cambiar facción/clase limpia la consideración previa. El enlace a Race Explorer conserva la variante y permite volver a la ficha anterior. Las preferencias de variante sobreviven a la navegación entre vistas.

Permanecen idénticos byte a byte `data/race-advisor.json`, `data/racials.json`, los metadatos de exportación, el Excel, las fichas de profesiones y los datos de talentos. La capa de ocho actualizaciones raciales de v22 tampoco se modifica. El service worker precarga el nuevo archivo con caché **v26**.

## Iconos y derechos

No se añade ninguna entrada a `icons/icon-map.js`, URL supuesta, imagen de otra raza ni marcador presentado como oficial. Cielonato mantiene su nombre visible, con alineación del texto dentro de la misma cuadrícula. La aplicación tolera fallos de las imágenes de las otras razas.

Para completar esta parte deben localizarse las referencias a imágenes desde una fuente identificable, comprobar que representan a Skyborne (y no a otra raza), inspeccionarlas y registrar URL real, titular y condiciones aplicables en `docs/icon-sources.md`. Una respuesta HTTP 200 por sí sola no acredita identidad ni licencia. La búsqueda y verificación independiente permanecen pendientes del acceso; no se ha descargado ni redistribuido ninguna imagen nueva.

## Pruebas

`tests/test_skyborne.py` comprueba integridad de las exportaciones mediante las huellas conservadas, mecánicas, compatibilidad, trazabilidad, ausencia de rankings y archivo offline. `tests/skyborne-browser.cjs`, incluido en `browser-smoke.cjs`, prueba nueve opciones, ambas variantes, 51 combinaciones, conservación de recomendaciones, esquema malformado y aislamiento de fallos de la capa adicional; teclado Enter/Espacio, navegación, recarga offline y tamaños de 320/390/820/1280 px.

Las suites existentes de Race Advisor, raciales y navegación ajustan únicamente las expectativas de nueve opciones y el nuevo texto de acceso. Los tests de caché cambian de v25 a v26. No se modifican las aserciones sobre las ocho filas originales.

No se afirma prueba en dispositivo Android ni contraste independiente de datos oficiales por haber pasado las pruebas de software. La PR se entrega para revisión, **sin fusionar**; fuentes e icono deben revisarse antes de considerar completada su verificación.
