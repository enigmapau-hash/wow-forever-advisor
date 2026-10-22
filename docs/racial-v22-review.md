# v22 — Revisión de raciales de WoW Forever

**Fecha:** 22/10/2026. **Alcance:** las ocho razas existentes en `Clases WoW Forever v5.xlsx`; el Excel y las 51 recomendaciones se conservan sin cambios.

## Evidencia utilizada

Blizzard publicó la revisión de raciales en sus [notas oficiales de beta del 15 de octubre](https://us.forums.blizzard.com/en/wow/t/wow-forever-beta-development-notes-%E2%80%93-updated-october-15/2360696/6) (publicación del foro: 16/10 en UTC). Cambiaron habilidades pasivas, activas, cifras y reutilizaciones.

El archivo `data/racial-beta-updates.json` distingue **actualizaciones oficiales** de las descripciones originales. El archivo está ordenado y emparejado exactamente por los nombres de las ocho razas, sin modificar ni una palabra de los JSON exportados del Excel. El contenido se publica como complemento en Race Explorer y Race Advisor; para el segundo se muestra también la alternativa, si existe.

## Cambios confirmados

| Raza | Actualización oficial relevante |
| --- | --- |
| Gnomo | Eureka! dura 8 s, no tiene cargas y beneficia a Palabra de poder: escudo |
| Humano | Especialización en espadas → Ruthless (+2 % probabilidad de crítico) |
| Enano | Especialización en mazas → Earth Fury (+2 % daño y sanación críticos); mejora de Find Treasure |
| Elfo de la noche (Elfo en la base) | Quickness acumula su velocidad con otras bonificaciones |
| Orco | Especialización en hachas → Savage (+1 % probabilidad de crítico); Blood Fury 3 min; Shatter Curse disipa maldiciones/banes y reduce 5 % el daño mágico recibido |
| Tauren | Endurance +2 % daño y sanación críticos; Plainsrunning +3 % velocidad montada; Cultivation 15 min; War Stomp 90 s |
| Troll | Regeneration pasa a +20 % de regeneración de salud |
| No-muerto | Cambios de Touch of the Grave, Touch of the Dead y restricciones de Will of the Forsaken con Scatter Shot |

Las descripciones completas están en `data/racial-beta-updates.json`. Estas son notas oficiales de la **beta**; no garantizan que la versión final mantenga exactamente esos valores.

## Lo que no se debe inferir

- No hay evidencia suficiente para alterar las puntuaciones de utilidad originales o proclamar una nueva mejor raza para PvP. Las puntuaciones del Excel no se han ajustado a los nuevos rasgos.
- Las descripciones originales del Excel se centran en la utilidad táctica de Escape Artist, Will to Survive, Stoneform, Shadowmeld, Hardiness, War Stomp, Berserking y Will of the Forsaken; no afirman explícitamente los antiguos bonos de espadas, hachas o mazas, por lo que no justifican una sustitución editorial directa.
- **Cielonatos (Skyborne)** es una nueva raza jugable de Forever, confirmada por [Blizzard](https://news.blizzard.com/es-es/article/24304075/crea-un-heroe-a-tu-imagen-y-semejanza-en-world-of-warcraft-forever) y con cambios raciales también el 15/10. No existe en el Excel original, así que **no se añade sin datos y metodología de clasificación adecuados**. La interfaz aclara la cobertura limitada a ocho razas.
- No se ha validado el resultado dentro del juego. La capa de beta puede actualizarse de forma independiente sin reexportar el Excel, pero la comparación de rankings requiere análisis posterior al lanzamiento.

## Comprobaciones

- Se conservan los hashes del Excel original, `race-advisor.json`, `racials.json`, y el resto de documentos preservados.
- Test de cobertura exacta de ocho razas, contenidos específicos de las notas del 15/10, fecha, fuente y precaché v22.
- Prueba Chromium offline de los ocho perfiles, de las notas de Orco en Race Advisor, de las 81 fichas de Talent Advisor, filtros de Addon Advisor, navegación y actualización desde v21.
- Diseño oscuro/dorado y estructura de módulos aprobados intactos.
