# Investigación v40 · Race Advisor contextual (NO PUBLICADA)

Estado: **borrador editorial**, no apto para fusionar como actualización de comparativas.

## Objetivo

El campo «A favor» debe destacar la facultad **más relevante en la combinación raza + clase + especialización**, pero la evaluación debe ponderar las **dos raciales activas, dos pasivas, habilidades de clase y herramientas reales de la especialización**. Sacerdote tiene además **dos hechizos raciales propios de clase por raza**. Una conclusión debe explicar tanto la prioridad como la condición en que la alternativa resulta preferible.

No cuentan como ventajas universales en PvP las herramientas de exploración (Buscar tesoro, Cultivo), la velocidad estando muerto, el daño contra bestias aplicado a jugadores, ni el bonus de arma sin el equipo adecuado. Deben distinguirse claramente los hechos oficiales de Blizzard, los datos cambiantes de beta y el juicio táctico.

## Fuentes oficiales

- [Blizzard · Rasgos raciales y combinaciones de clase/raza](https://worldofwarcraft.blizzard.com/es-es/news/24304075): inventario 2 + 2 y tabla de clases.
- [Blizzard · Repaso a fondo de Sacerdote y Guerrero](https://worldofwarcraft.blizzard.com/es-es/news/24301514): las dos facultades propias de Sacerdote; Fear Ward / Custodia de miedo y Devouring Plague / Peste devoradora pasan a ser comunes.
- [Blizzard · Cazador y Druida](https://worldofwarcraft.blizzard.com/es-es/news/24301515): raciales activables en forma, mascotas, trampas en combate.
- [Blizzard · Pícaro y Brujo](https://worldofwarcraft.blizzard.com/es-es/news/24310968): venenos, mascota, terror y drenajes.
- [Blizzard · Mago y Chamán](https://worldofwarcraft.blizzard.com/es-es/news/24302097): talentos, tótems, sinergias por escuela y cambios en movilidad.
- [Blizzard · Paladín](https://worldofwarcraft.blizzard.com/es-es/news/24302099): sellos, sentencias, mitigación y sanación.
- [Blizzard · Contexto de diseño](https://worldofwarcraft.blizzard.com/es-es/news/24303313): cada raza recibe 2 activas + 2 pasivas.

## Avance verificable

- **54 fichas** protegidas en `data/race-context-audit-draft.json`.
- **6 sin alternativa** (Chamán Alianza y Paladín Horda): no inventar enfrentamientos.
- **5 comparativas de Sacerdote** redactadas y contrastadas con el resumen oficial de clase: `data/race-priest-context-draft.json`.
- **6 comparativas de Brujo** redactadas: Aflicción, Demonología y Destrucción en Alianza/Horda, con los cuatro rasgos raciales y las nuevas habilidades de clase en Forever (`data/race-warlock-context-draft.json`).
- **1 inconsistencia**: Horda · Sacerdote · Sagrado → Troll principal / Tauren alternativa. La tabla oficial no permite Sacerdote Tauren. No se modifica ningún JSON ni ranking aprobado; bloquear la comparativa hasta obtener autorización para corregir la alternativa.
- **36 comparativas restantes** pendientes de análisis individual específico: la matriz solo registra su inventario de facultades y el propósito original. No es honesto presentarlas como «revisadas» por una generación automática.
- **Las once comparativas revisadas no se han conectado aún a la UI**: versión pública v39 intacta. Antes de publicación se completarán/validarán los 42 restantes y el conflicto de elegibilidad, se añadirá la capa opcional con fallback explícito y se comprobará offline.

## Criterio de revisión editorial por ficha

1. Comprobar elegibilidad con la tabla de Blizzard para raza y clase.
2. Comprobar cuatro raciales generales; distinguir efectos ofensivos, defensivos, de control, utilidades de mundo y restricciones.
3. Comprobar herramientas de clase/especialización disponibles en Forever y sus condicionantes (lanzamiento, enfriamiento, colocación y equipo).
4. Para Sacerdote, comprobar sus **dos hechizos raciales exclusivos**, sin asignar Fear Ward ni Devouring Plague en exclusiva.
5. Redactar «A favor» de cada raza empezando por una facultad concreta, y «A tener en cuenta» explicando límites reales.
6. Redactar conclusión en dos párrafos: razón táctica de la principal y situaciones que favorecen la alternativa.
7. Validar hechos contra fuente y fecha; no modificar jerarquía de recomendación sin aprobación expresa.
8. Ejecutar regresiones funcionales y visuales de las 54 fichas a 320/390/820/1280 y offline antes de proponer publicación.
