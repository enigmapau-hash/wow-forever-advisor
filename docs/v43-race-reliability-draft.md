# Race Advisor v43 · borrador de integración
**Estado:** rama `feat/v43-race-reliability-v2`, PR borrador #54. No publicado ni autorizado para fusionar.

## Fuente editorial
Los datos proceden del ZIP aportado por el usuario `race-reliability.zip`, particularmente `rankings-v2.json`, `recalibration-v2.json`, `evaluation-2026-10-24.json` y `methodology.md`. La base es PvP masivo (50 % frente / 30 % objetivos / 20 % repliegue), nivel 60 supuesto y equivalencia de equipo. Los puntos representan juicio táctico reproducible, **no** estadísticas del juego. Los rankings de v42 y el Excel original quedan como histórico sin influencia en el orden.

La interfaz obtiene las razas de `data/race-rankings-v43.json`: 54 fichas, 168 candidaturas, 30 candidaturas Cielonato y seis fichas con única raza. El archivo contiene también las **168 puntuaciones exactas** de `rankings-v2.json`, los indicadores de **20 empates técnicos editoriales** y los **10 cortes segunda/tercera estrechos**, junto a un SHA-256 del ZIP original y de `rankings-v2.json`. Los puntos permanecen ocultos en la interfaz. Los textos por clase/especialización y el inventario 2+2 están en `race-v43-content.js`; los exclusivos de Sacerdote tienen un tratamiento separado. No se muestran puntos editoriales en la interfaz. Hay 20 parejas con diferencia inferior a dos puntos en la matriz v2; no se presentan como superioridad empírica.

## Correcciones de UX
- Sincronizar facción al acceder al perfil Cielonato; Feral resalta Walk on Air.
- Falla explícitamente si falta la nueva base o si una raza incompatible o una ficha incompleta se introduce; no se muestran rankings históricos bajo análisis específico v43.
- Fuentes de Blizzard deduplicadas por artículo, manteniendo correcciones distintas de posts de beta.
- Mantener caché offline propia de v43 y las 81 fichas de Talent Advisor v42, Profession Advisor y Addon Advisor sin cambiar datos.

## Límites y condiciones de cierre
**Bloqueantes antes de fusionar:**
1. Incorporar al repositorio los **scripts y archivos originales de investigación** del ZIP: actualmente están preservados y reproducidos localmente, pero solo el orden y las 168 puntuaciones finales se han trasladado a la PR. La matriz de efectos y los 3.419 escenarios todavía no son reproducibles desde un clon remoto por sí solo.
2. Revisión editorial manual de las 54 fichas: los textos v43 se generan mediante las 27 prioridades tácticas y los inventarios raciales, y deben contrastarse contra las justificaciones individuales del ZIP.
3. Revisar las 20 parejas estrechas y las 10 segundas/terceras próximas, en especial cobertura aliada de antihealing en Sacerdote Horda. No declarar vencedor demostrado antes del lanzamiento.
4. Aprobación expresa del usuario, actualización de README y cierre de Issue #37 solo después de revisión final.

Pruebas: `python -m unittest discover -s tests -p 'test_*.py' -v`, `node tests/browser-smoke.cjs` en GitHub Actions; navegación, offline, 320/390/820/1280.
