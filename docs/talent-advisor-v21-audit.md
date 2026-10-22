# Talent Advisor — v21: auditoría de evidencias y límites

**Revisión:** 22/10/2026. **Cliente de referencia de las fichas:** `1.60.1.70450`. **Estado:** orientaciones de beta, no builds verificadas al nivel 60.

## Qué se contrastó

- Cobertura y estructura: nueve clases, tres especializaciones por clase, tres objetivos por especialización = **81 fichas**. Cada ficha sigue siendo `borrador_beta`.
- Comparación exacta de las listas `talentos` entre `Subir al 60`, `PvP` y `Mazmorras` dentro de cada especialización.
- Presencia de nombres retirados o sustituidos que constan en las notas oficiales: **Call of Thunder / Llamada del trueno**, **Malediction** y **Mangle** (sustituido por Primal Bite).
- Concordancia de la compilación `1.60.1.70450` con la base de datos Zephras, que identifica las versiones extraídas de archivos del cliente.
- Notas de cambios oficiales publicadas hasta el 15/10/2026 y anuncio del 20/10 sobre el cierre previsto de la beta el 23/10/2026.

**Importante:** comprobar que no hay nombres retirados en una lista no confirma que cada talento sea óptimo, esté disponible en el nivel sugerido o que una build sea legal.

## Hallazgo principal

| Clase | Especializaciones con listas idénticas para los tres objetivos |
| --- | ---: |
| Cazador | 3 de 3 |
| Pícaro | 3 de 3 |
| Sacerdote | 3 de 3 |
| Mago | 3 de 3 |
| Brujo | 3 de 3 |
| Druida | 3 de 3 |
| Guerrero | 0 de 3 |
| Paladín | 0 de 3 |
| Chamán | 0 de 3 |

**Total: 18 especializaciones / 54 fichas reutilizan los mismos talentos destacados en sus tres objetivos.** Aunque cambian sus explicaciones tácticas, esas listas no demuestran una priorización diferenciada por objetivo. Las 27 fichas restantes tienen listas distintas por objetivo, pero también son orientativas y no se han validado jugando al nivel 60.

## Qué cambia en v21

Se añade en el aviso existente de cada una de las seis clases afectadas una explicación visible:

> Los talentos destacados se repiten para los tres objetivos de cada especialización; no son builds diferenciadas ni probadas al nivel 60.

Se incorpora una prueba automática de la cobertura de 81 fichas, del aviso cuando las prioridades se repiten y de la ausencia de los tres nombres retirados o reemplazados en las listas. Se actualiza la caché offline.

**No cambia ningún talento recomendado ni se inventan combinaciones, rutas de puntos o resultados de pruebas.** No se modifican Legado, Race Advisor, Profession Advisor, Addon Advisor, Race Explorer, Patch Tracker, ni el diseño.

## Qué queda pendiente

1. Tras el lanzamiento, contrastar la **compilación real de producción** con `1.60.1.70450` y los cambios oficiales posteriores.
2. Obtener evidencia suficiente para diferenciar la selección de talentos por objetivo, especialización y nivel, sin copiar sin más una build ajena.
3. Validar nombres, filas, prerequisitos, orden de adquisición y 51 puntos antes de ofrecer builds completas.

## Fuentes y límites

- [Blizzard: notas de desarrollo de Forever actualizadas el 15/10](https://us.forums.blizzard.com/en/wow/t/wow-forever-beta-development-notes-%E2%80%93-updated-october-15/2360696/6).
- [Blizzard: anuncio del 20/10 sobre prueba de estrés y cierre previsto de beta](https://us.forums.blizzard.com/en/wow/t/heads-up-wow-forever-stress-test-on-october-21/2387920).
- [Zephras: base de datos y compilación identificada](https://zephras.com/).
- Archivos fuente internos: `data/talent-advisor-*.json`; catálogo: `data/talent-advisor-catalog.json`.

No se ha probado dentro del juego, ni en Android físico desde esta auditoría. Una ausencia de cambios oficiales identificados no demuestra estabilidad de la build.
