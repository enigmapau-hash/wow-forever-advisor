# Auditoría de UX del arquitecto · correcciones v33

## Alcance
Continúa la auditoría [#37](https://github.com/enigmapau-hash/wow-forever-advisor/issues/37) tras la versión v32. Se actúa sobre los problemas detectados en el código sin incorporar todavía observaciones del usuario, para no solapar ambas revisiones.

## Correcciones aplicadas

1. **Recomendación principal:** la explicación detallada, extraída del Excel, sigue **visible** en las 54 combinaciones. El resumen `motivoPrincipal` permanece en el DOM como campo oculto de trazabilidad y en su JSON original, pero ya no repite el mismo argumento en un segundo párrafo visible.
2. **Sin alternativa:** en las tres fichas de Chamán Alianza y las tres de Paladín Horda, la ausencia aparece **junto al título** de la raza principal y antes de la explicación; no hay tarjeta ni icono de alternativa falsa.
3. **Qué significa «alternativa»:** las 42 segundas razas clásicas son un **perfil racial general** (`usoPrincipal`) y el desplegable contiene sus limitaciones (`debilidades`), no una comparativa especializada fabricada. Las seis alternativas de Druida/Cielonato sí ofrecen `usoAlternativa` contextual y `motivoComparacion` en detalle. Rótulos específicos aclaran el alcance sin cambiar los datos.
4. **Elfo de la noche:** `raceDisplayName` transforma exclusivamente la etiqueta `Elfo`. `raceProse` realiza cinco correcciones gramaticales delimitadas para menciones dentro de textos históricos. Se elimina de la vista la frase de base «denominado Elfo en la base». Los JSON y el SHA del Excel se mantienen intocados.
5. **Acceso móvil al resultado:** al completar la especialización, cuando el ancho no supera 40rem, la ficha toma el foco a través del encabezado y la página se desplaza a ella sin animación. En escritorio se mantiene la selección y la posición. El resultado tiene margen de desplazamiento.
6. **Race Explorer:** coincidencias agrupadas por Alianza/Horda, enlaces visuales más compactos (clase · especialización), con nombre completo accesible por `aria-label`, sin reducir los 54 destinos ni los seis de Cielonato.
7. **Profession Advisor:** primera pareja y alternativa se presentan en bloques diferenciados, y las razones quedan unidas a la primera. La limitación conserva su apartado independiente.
8. **Talent/Addon:** mensaje de beta más corto, se retiran metadatos de recuento no útiles del encabezado y las fechas exactas de revisión de addons pasan a detalles de evidencia. Las advertencias de compatibilidad de Forever 1.60.x permanecen visibles; Retail/Classic no acreditan compatibilidad y las descargas precisan conexión.
9. **PWA v33:** `version.js` mantiene la única fuente para el pie y la caché `sw.js`. El cambio activa la actualización offline de ficheros HTML, CSS y JS.

## Garantías técnicas
- No tocar `data/race-advisor.json` (51 fichas, procedencia SHA `ffb510a623c83fa440eb9612cc9b8ab7a02d67a036bbeab14c858e811ffab2ec`).
- No tocar los 8 perfiles raciales, las 3 adiciones Paladín Horda ni las 6 alternativas Druida/Cielonato.
- 54 combinaciones en las dos facciones, 48 alternativas y 6 sin alternativa, sin alterar reglas o escalas.
- Regresiones JS, Python, navegador (320/390/820/1280px), accesibilidad de teclado, recorrido de 54 fichas, offline, 81 talentos y 27 profesiones.

## Límites de la auditoría independiente
La inspección de esta iteración se ha hecho sobre código y datos públicos del repositorio, con pruebas automatizadas de navegador y diseño estructural. En esta sesión **no estaba disponible el navegador conectado para tomar nuevas capturas o realizar una inspección visual presencial**. Los tests responsive verifican la jerarquía y la ausencia de desbordamientos, pero no prueban que el usuario apruebe la estética final.

La incidencia #37 seguirá abierta para los hallazgos visuales del usuario. No se incorporan hipótesis de diseño no verificadas ni se consideran hechos del cliente de WoW los detalles provisionales de la beta.
