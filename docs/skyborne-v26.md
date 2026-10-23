# Cielonato (Skyborne) · revisión v26

Base: [issue #29](https://github.com/enigmapau-hash/wow-forever-advisor/issues/29), desde `main` v25 (`3a41b72488c4de048d4e160650dedf55d2245a7e`). Correcciones según la [revisión de PR #30](https://github.com/enigmapau-hash/wow-forever-advisor/pull/30#issuecomment-6363136999). PR en borrador, sin fusionar.

## Contraste directo de fuentes · 23/10/2026

La primera entrega no pudo consultar Blizzard por un bloqueo de red. Tras habilitarse los dominios autorizados, se consultaron directamente las cuatro páginas siguientes: HTTP 200, con TLS verificado. `data/skyborne.json` registra fecha y SHA-256 de los cuerpos HTML consultados, diferenciando fuentes oficiales y contraste secundario. La revisión externa coincide con el contraste directo.

| Fuente | Confirmado / limitación |
| --- | --- |
| [Blizzard · Meet the New Skyborne](https://news.blizzard.com/en-us/article/24302071/wow-forever-meet-the-new-skyborne) | Zephras Isle; High Order/Alianza y Windshaper/Horda; clases; Walk on Air 10 s; Elemental Insight +5 %; **Read Ley Line** +100 % de regeneración de salud/maná; Skysight +10 % de **run speed**. El +1 % de Wind Blessed de esta presentación está superado por las notas de beta. |
| [Blizzard · notas del 15/10/2026](https://us.forums.blizzard.com/en/wow/t/wow-forever-beta-development-notes-%E2%80%93-updated-october-15/2360696/6) | Wind Blessed +3 % (antes +1 %); Walk on Air 90 s (antes 2 min); Skysight y Read Leyline lanzables en movimiento; mínimo de Read Leyline 30 s (antes 20 s). Las notas escriben «Read Leyline»; se adopta como rótulo el **Read Ley Line** de la presentación. Estas son las notas enlazadas y verificadas, no una garantía sobre futuros parches. |
| [Blizzard · clases por raza y facción](https://news.blizzard.com/en-us/article/24304075/create-the-hero-you-want-to-be-in-world-of-warcraft-forever) | Guerrero, Cazador, Pícaro y Druida en ambas variantes; Mago en Alianza y Chamán en Horda. |
| [Wowhead · guía actualizada 22/10/2026](https://www.wowhead.com/forever/guide/skyborne-race-overview) | Fuente secundaria: Skysight también describe **mounted movement speed +10 %**. No se atribuye ese detalle a Blizzard ni se incorpora a la ficha o al análisis hasta contraste de cliente. La guía aún indica Read Leyline 15 s sin línea ley: prevalece el mínimo oficial de 30 s. |

`revision.estado: verificado` se refiere a las facultades y clases de beta contrastadas con esas fuentes oficiales. **La evaluación competitiva y la autorización del icono siguen pendientes.** No se afirma confirmación de lanzamiento ni que los efectos de facción sean equivalentes.

La nota opcional del Skyborne Heroic Pack no se incorpora: `https://worldofwarcraft.blizzard.com/en-us/forever` devolvió bloqueo del proxy (`CONNECT 403`), al ser un dominio distinto de los habilitados. La revisión externa y Wowhead la mencionan, pero no se anuncia un requisito comercial como contraste directo propio de esa página.

## Esquema independiente

`data/skyborne.json`, esquema 1:

- `raza`, `nombreOriginal`, `origen`, `estado`: identidad y condición de beta.
- `revision` y `fuentes`: fecha, contraste oficial, referencia a la revisión externa y evidencias de consulta. Cada facultad y variante remite a IDs de fuentes oficiales.
- `comunes`: Walk on Air (10 s / 90 s), Wind Blessed (+3 % celeridad), Elemental Insight (+5 % contra elementales).
- `variantes`: High Order/Alianza (Guerrero, Cazador, Pícaro, Druida, Mago), con **Read Ley Line**; Windshaper/Horda (Guerrero, Cazador, Pícaro, Druida, Chamán), con Skysight. Se conserva el ID interno `read-leyline`. La habilidad oficial de Horda **no contiene `monturaPorcentaje`**.
- `contrasteSecundario`: guía de Wowhead, evidencia de consulta y precisión de monturas con estado `pendiente_contraste_cliente`; no se consume como facultad confirmada en la interfaz.
- `evaluacion`: criterio y limitación pendientes. Sin puntuaciones, estrellas ni ranking global.
- `icono`: `estado: enlace_cdn` y URL del retrato masculino contrastado; el retrato está en `icons/icon-map.js` junto a las ocho razas existentes. Se enlaza desde la misma CDN de Wowhead y puede almacenarse en caché privada del navegador, sin copiar binarios al repositorio. La identidad está documentada; esto no equivale a una licencia general sobre el arte.

El validador conserva las restricciones por facción, fuentes oficiales, valores de beta y rótulo de Read Ley Line; rechaza introducir la precisión secundaria de monturas en la facultad oficial. La capa original de ocho perfiles y sus actualizaciones de beta siguen independientes.

## Interfaz, recuperación y conservación

Race Explorer ofrece nueve opciones en 3 × 3. La cabecera de Race Advisor explica que conserva las recomendaciones originales de ocho razas y contempla Cielonato por separado. El CTA, la cabecera de Explorer y la nota de cobertura se actualizan tras cargar los datos: **9 si Cielonato está disponible; 8 si falla su JSON**, con un aviso explícito. Antes de cargar y ante fallo general se usa un CTA sin número, evitando prometer nueve opciones inexistentes.

La consideración separada de Race Advisor aparece en 30 combinaciones y queda excluida en 21. Cambiar facción/clase la limpia. Las dos variantes, sus selecciones y el retorno a la ficha se conservan al navegar. No se fabrica una lista de recomendaciones originales para Cielonato.

Permanecen idénticos byte a byte las 51 recomendaciones de `data/race-advisor.json`, los ocho perfiles de `data/racials.json`, el Excel y los metadatos de exportación. No se modifican los datos aprobados de profesiones, talentos, addons ni la capa de ocho actualizaciones raciales. Se mantiene el diseño y la caché **v26**, correspondiente a la misma PR aún sin publicar.

## Iconos: identidad y uso son comprobaciones distintas

La [búsqueda Skyborne de Wowhead](https://www.wowhead.com/forever/search?q=Skyborne), HTTP 200, condujo a las fichas [High Order, ID 95](https://www.wowhead.com/forever/race=95/high-order-skyborne) y [Windshaper, ID 96](https://www.wowhead.com/forever/race=96/windshaper-skyborne), ambas HTTP 200. Las dos referencian explícitamente `race_skyborne_male` y `race_skyborne_female` junto al título de la raza. El retrato masculino también figura en sus metadatos `og:image`. Se descargaron ambos JPG a `/tmp` y se inspeccionaron: dos retratos de Skyborne, no una imagen generada ni un slug supuesto. URL, huella y procedencia se conservan en el JSON y en [icon-sources.md](icon-sources.md).

También se inspeccionaron los iconos referenciados por la guía para Walk on Air (`inv_elemental_primal_air`), Skysight (`ability_skyreach_lens_flare`) y Read Leyline (`ability_mage_incantersabsorbtion`), todos HTTP 200. **Son iconos de facultad, no se usan como retrato racial.**

La consulta directa de `https://www.wowhead.com/terms-of-service` devolvió 404, sin texto de condiciones. Las páginas consultadas no aportaron una licencia que autorice la incorporación o redistribución de estos retratos. Las imágenes de la presentación oficial remiten a `bnetcmsus-a.akamaihd.net` y no se identifican allí como un icono racial autorizado para la PWA. No se extraen ni recortan para fabricar uno.

**Criterio de implementación aceptado por el usuario:** se usa `race_skyborne_male` como imagen representativa, exactamente igual que el resto de los retratos raciales de `icons/icon-map.js`, desde `wow.zamimg.com`. Se incorpora al conjunto de URL que el service worker puede guardar en caché privada; se elimina del DOM si falla la descarga y el texto accesible «Cielonato» se mantiene siempre. No se añade ningún binario gráfico al repositorio. Se conserva el retrato femenino como candidato documentado, no como una facción distinta: las facciones difieren en raciales y clases, no se ha demostrado que requieran un retrato diferente. Como con las demás imágenes, el uso de la CDN no acredita autorización explícita de redistribución, por lo que deben respetarse las condiciones aplicables y retirarse el enlace si el proveedor lo exige.

## Pruebas

Se mantienen las pruebas de huellas, mecánicas, clases y fuentes. Se añaden aserciones sobre **Read Ley Line**, ausencia de monturas en los datos oficiales y separación del dato secundario. La prueba de navegador comprueba nueve botones, ambas variantes, 51 combinaciones, teclado, navegación, tamaños 320/390/820/1280 px y recarga offline. El fallback de JSON inválido ahora exige **8 botones, CTA de 8, cabecera de ocho y aviso de indisponibilidad**.

La suite completa de Advisor Data Checks cubre también talentos, profesiones y addons, y verifica el mapa de 45 URL gráficas (47 usos) con Cielonato. Pasar las pruebas valida el software, no demuestra balance competitivo ni autorización gráfica. No se afirma prueba en Android físico. La PR permanece sin fusionar hasta comprobar el resultado y los tests.

## Rectificación editorial posterior · v27

La «consideración» automática que v26 mostraba en 30 combinaciones de
Race Advisor se ha retirado: esas 30 combinaciones describían **compatibilidad
legal de clase/facción**, no una valoración que justificase recomendar la raza.
Race Advisor vuelve a mostrar únicamente las recomendaciones y alternativas de
las 51 fichas originales. Cielonato se mantiene por completo en Race Explorer.
La documentación anterior recoge el estado histórico de v26, no el
comportamiento vigente tras v27. No se ha reevaluado ninguna clasificación.
