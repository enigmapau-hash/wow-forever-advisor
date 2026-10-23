# Race Advisor v32

Implementa el alcance autorizado de la auditoría [#37](https://github.com/enigmapau-hash/wow-forever-advisor/issues/37), sobre main v31.

## Decisiones

- Una plantilla para las 54 combinaciones. Principal y alternativa se separan semántica y visualmente, en una proporción aproximada 1,85:1 desde 768 px. En móvil se apilan en orden de importancia. El oro destaca la principal; la alternativa y los detalles usan un énfasis menor.
- Motivo y explicación originales visibles dentro de la principal, con el nombre de la raza en el encabezado de justificación. No se resume ni se sustituye la valoración aprobada.
- La alternativa clásica usa su descripción general de utilidad, sin inventar una evaluación especializada. Cielonato conserva su descripción contextual y sus límites. El desplegable «Detalles de esta alternativa» es común a todas las alternativas; desaparece la pregunta exclusiva de Druida.
- Las seis fichas sin alternativa (Chamán Alianza y Paladín Horda) muestran una sola explicación. No se reserva una columna, tarjeta ni icono para una raza inexistente.
- Fortalezas, limitaciones, uso y comentarios quedan bajo «Perfil de [raza]», separado de la recomendación especializada. Las notas oficiales conservan sus fuentes y fecha dentro de «Fuentes y cambios de beta». Las fuentes de Paladín Horda y Cielonato se incluyen donde corresponden.
- La normalización `Elfo` → `Elfo de la noche` solo afecta a texto visible. Botones, mapas de iconos, filtros y enlaces conservan las claves originales.
- `version.js` sincroniza el indicador del pie y el nombre de caché. Se precarga para funcionar offline. CI se activa también cuando cambia este archivo.

## Inspección visual real

Se inspeccionaron capturas de Microsoft Edge mediante Playwright a **320, 390, 820 y 1280 px**, con iconos cargados desde la CDN. Casos: Druida Alianza Restauración (texto largo y Cielonato), Guerrero Alianza Armas (alternativa clásica y perfil desplegado), Paladín Horda Sagrado (sin alternativa), selector completo y pie.

Hallazgos corregidos durante la inspección:

- A 320 px, los nombres largos del selector se partían a mitad de palabra; a 390 px también ocurría con «Supervivencia». Se redujo el margen interior de la selección y se ajustaron las etiquetas de clase; las especializaciones se presentan en filas completas a 480 px o menos. Las nueve clases conservan su cuadrícula 3 × 3.
- La tarjeta dorada de addons competía con la principal. El contexto opcional conserva contenido y enlaces con una separación discreta, sin tarjeta dorada adicional.
- Las líneas de explicación demasiado largas en fichas sin alternativa se limitan a 72 caracteres tipográficos aproximadamente.
- CI en Linux detectó además saltos de línea causados por su fuente de sistema a 320 y 390 px. Se amplió el espacio útil del selector más estrecho y se unificó el tratamiento de las etiquetas móviles. Se verifican tanto la altura como el ancho de cada etiqueta, sin reducir las nueve clases a menos columnas.

No se observaron solapamientos ni desbordamiento horizontal en los casos revisados. Los textos de especialización y clase se miden además en las 54 fichas a los cuatro anchos. Las capturas de trabajo están en `.local-v32/` (excluidas de Git).

## Validación y límites

- Pruebas de datos, integridad del Excel y recomendaciones, iconos y catálogo de addons.
- Navegador: 54 fichas raciales, 81 de talentos y 27 de profesiones; navegación desde los perfiles, teclado, selecciones accesibles y limpieza de resultados.
- Pruebas de la nueva jerarquía, icono de alternativa, versión y etiqueta Elfo; caché anterior eliminada y recarga offline. Las 54 fichas raciales y las 27 de profesiones se contrastan con sus campos originales también sin conexión, además de las 81 de talentos.
- Las pruebas funcionales bloquean la CDN para verificar que los textos y controles sobreviven a iconos ausentes. La inspección visual usa las imágenes reales.
- No se modifica ningún JSON ni el Excel maestro. No se recalculan recomendaciones ni compatibilidad.
- La revisión responsive usa navegador de escritorio con tamaños emulados; no representa una prueba en Android físico ni una certificación exhaustiva de accesibilidad. La aprobación visual del usuario queda pendiente.
