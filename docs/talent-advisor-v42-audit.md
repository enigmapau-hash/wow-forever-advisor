# Talent Advisor · Auditoría inicial v42

Revisión editorial: **24/10/2026**. Estado: **primer pulido de fiabilidad y presentación**, no un rediseño ni una reconstrucción de builds.

## Evidencia verificada

- Cobertura: **9 clases × 3 especializaciones × 3 objetivos = 81 fichas**, todas marcadas como `borrador_beta`, referencia de cliente `1.60.1.70450`, actualización editorial de origen 22/10/2026.
- En **18 de 27 especializaciones** (Cazador, Pícaro, Sacerdote, Mago, Brujo, Druida: 3/3 cada una) se mantiene la **misma lista de talentos** al elegir Subir al 60, PvP o Mazmorras. Es correcto reconocerlo: los textos de objetivo cambian, pero no se deben describir como tres builds independientes.
- En **9 de 27 especializaciones** (Guerrero, Paladín, Chamán: 3/3) las listas de talentos **sí cambian** con el objetivo. Tampoco hay pruebas de una distribución legal y optimizada de 51 puntos al nivel 60.
- **Legado** tiene tres perfiles por objetivo que **comparten las nueve clases**; cada clase obtiene los puntos mediante desafíos propios. No debe presentarse como ventaja racial ni como árbol de talentos exclusivos de cada clase.
- **Blizzard confirmó el 23/10/2026 el cierre de la beta**, la apertura de creación de personajes el 27/10 y el **lanzamiento previsto para 4/11/2026**. Los avisos originales «Blizzard prevé cerrar la beta el 23/10» se conservan únicamente en los textos históricos plegados.
- Las notas públicas de desarrollo de clase, la base de cliente y sus correcciones permiten **investigar talentos**, pero no certificar un orden de adquisición, sinergias definitivas ni rendimiento comparativo al nivel 60.

## Cambios seguros incluidos en v42

1. **Orientación única y actualizada** sobre el cierre de beta, nivel 60 y ausencia de reparto de puntos, en lugar de repetir varios avisos con fechas pasadas.
2. **Nota contextual junto a los talentos:** distingue las 54 fichas cuyas listas se repiten por especialización de las 27 en las que cambian según el objetivo. El resumen, razonamiento y límites por objetivo se conservan.
3. **Legado identificable** como sistema transversal a las nueve clases, con título adaptado al objetivo y obtención de puntos específica de cada clase.
4. **Fuentes y vigencia en tarjeta secundaria:** compilación histórica visible, referencias en desplegable cerrado por defecto, enlace oficial de cierre de beta añadido a las fuentes y fuentes deduplicadas.
5. **Textos originales históricos** en apartado independiente, plegado, con indicación de que pueden contener anuncios supersedidos; sin modificar JSON origen.
6. Mantener tipografía, foco, contraste y jerarquía de tarjetas compatibles con Race Advisor; pruebas en 320/390/820/1280 px y sin conexión.

## Pendiente para una auditoría técnica posterior

- Contrastar, **talento por talento**, disponibilidad final, rangos, prerequisitos, localización y número de puntos por rama con el **cliente de lanzamiento**, después del 4 de noviembre. Mientras no se confirme, no proponer builds de 51 puntos.
- Diferenciar propuestas PvP **según WoW Forever** (campo de batalla masivo, rol, control, ventanas defensivas) y progresión Subir al 60 y Mazmorras con evidencia suficiente, especialmente en las 18 especializaciones con listas repetidas.
- Validar con pruebas de juego los efectos de los puntos de Legado y su interacción con talentos, equipo y especialización. Las recomendaciones actuales no son rankings de rendimiento.

## Fuentes

- [Blizzard · Cierre de beta y lanzamiento (23/10/2026)](https://us.forums.blizzard.com/en/wow/t/thank-you-for-testing-the-wow-forever-beta/2390465).
- [Blizzard · Notas de desarrollo actualizadas el 15/10/2026](https://us.forums.blizzard.com/en/wow/t/wow-forever-beta-development-notes-%E2%80%93-updated-october-15/2360696/6).
- [Blizzard · Clases Cazador/Druida y estructura de talentos](https://worldofwarcraft.blizzard.com/es-es/news/24301515).
- [Blizzard · Sacerdote/Guerrero](https://worldofwarcraft.blizzard.com/en-us/news/24301514).
- [Documentación previa de 81 fichas](talent-advisor-v21-audit.md).

**No se alteran** ninguna de las 81 listas de talentos, ni los JSON de origen, ni Legado, ni Race Advisor, ni Profession Advisor. La revisión estética final queda a criterio del usuario al inspeccionar la versión publicada.
