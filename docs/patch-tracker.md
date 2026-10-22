# Patch Tracker — vigilancia de WoW Forever

**Fase 1:** automatización de la detección de cambios de talentos de clase y Legado.
**No** actualiza recomendaciones ni despliega nuevas versiones de la PWA.

## Cómo funciona

- Flujo GitHub Actions: [.github/workflows/patch-tracker.yml](../.github/workflows/patch-tracker.yml).
- Se ejecuta cada día a las **07:23 UTC** (aproximadamente 09:23 en horario de verano de Madrid y 08:23 en invierno; GitHub puede retrasar la ejecución). Admite ejecución manual desde la pestaña **Actions**.
- Consulta el [índice JSON de Zephras](https://zephras.com/data/forever/enUS/talents/index.json) y la URL del último archivo de talentos y Legado.
- Verifica el formato, la versión y la cobertura de clases y Legado. **Si falla la consulta o el esquema es desconocido, termina con error y no avanza el estado.**
- Obtiene una huella SHA-256 **por campo y por ID estable** de los talentos, árboles, dependencias, ventajas de Legado, desafíos para ganar puntos y puntos de clase por nivel.
- Compara con el estado anterior y clasifica los cambios como añadidos, eliminados o modificados. Detecta modificaciones en la misma compilación, incluso si Zephras cambia el contenido sin cambiar la etiqueta de versión.
- Abre una incidencia (*issue*) en GitHub **solo si hay cambios en los datos vigilados**, con un resumen de áreas y registros afectados. El informe marca como candidatas a revisión las nueve fichas de **Guerrero, Paladín o Chamán**, según la clase afectada, y los tres perfiles si cambia Legado.
- Guarda el historial en la rama **patch-tracker-state**, no en main: así comprobar parches a diario no modifica los archivos de la aplicación ni dispara despliegues de GitHub Pages.

## Primera ejecución y estados

1. **baseline:** primera ejecución válida. Crea la referencia; **no crea incidencia retrospectiva** porque no existe versión anterior registrada.
2. **unchanged:** misma compilación y mismos campos vigilados. No hace commits ni crea issues.
3. **version_only:** compilación nueva pero sin diferencias en los datos vigilados. Actualiza la referencia y lo indica en el resumen de Actions, **sin incidencia**.
4. **changed:** se modificó al menos un registro, incluso dentro de la misma compilación. Crea incidencia, comprueba si ya existe una con la misma firma, y guarda la referencia nueva.
5. **error:** fallo de conexión, respuesta incompleta, formato desconocido o estado previo inválido. **No** sobrescribe la referencia; revisar el log de GitHub Actions.

La incidencia incluye un identificador interno para evitar duplicados en reintentos. El flujo comprueba los últimos 100 issues de cualquier estado; si falla el envío de la incidencia, tampoco guarda la nueva referencia.

## Importante: qué detecta y qué no

Sí se vigilan (según la cobertura del archivo Zephras): talentos y sus textos por rango, ID de hechizo, árbol, posición, requisitos, dependencias, iconos, ventajas, árboles y desafíos de Legado, puntos por nivel y los efectos de «Con talento» sobre la progresión.

**Aún no se vigilan automáticamente** las notas oficiales de Blizzard, cambios solo del servidor, equipo, profesiones, acampada, Honor/rangos PvP, entrenamiento de mascotas, reputaciones o nuevas razas. Una build sin cambios detectados **no demuestra** que el juego no haya cambiado; significa únicamente que no cambiaron los campos que seguimos.

Zephras es una fuente de datos de comunidad, puede retrasarse respecto al juego y puede modificar su formato. Debemos contrastar los cambios relevantes con las notas oficiales antes de modificar consejos de juego.

## Fuentes y autoría

- [Zephras — archivo público, formato y licencia](https://zephras.com/data/)
- [Zephras — índice de compilaciones](https://zephras.com/data/forever/enUS/talents/index.json)
- [Blizzard — noticias oficiales](https://worldofwarcraft.blizzard.com/es-es/news)

Los datos **seleccionados y organizados por Zephras** se publican bajo CC BY 4.0: «Zephras (https://zephras.com), CC BY 4.0». Nombres, textos de habilidades e iconos del juego pertenecen a Blizzard Entertainment. El tracker guarda huellas de los datos y etiquetas identificadoras, **no una copia del dataset original**.

## Para revisar o ejecutar

En el repositorio, abrir **Actions → WoW Forever Patch Tracker**. Se puede ver el resultado de cada ejecución y usar **Run workflow** para lanzar una comprobación manual una vez fusionado en main. En **Issues** aparecerán incidencias con el prefijo "[Patch Tracker]".

Test local y aislado de la red:

    python -m unittest discover -s tests -p "test_patch_tracker.py" -v

Para disponer de avisos automáticos por email, comprobar las preferencias de notificaciones de GitHub del repositorio. GitHub puede desactivar flujos programados tras 60 días de inactividad en repositorios públicos. El token integrado de Actions debe tener permiso para crear issues y escribir en la rama de estado; el propio flujo declara esos permisos.

## Mantenimiento futuro

Fase 2 propuesta: contrastar noticias/parches oficiales y ampliar detección de otras progresiones. Fase 3: relacionar cambios más finamente con fichas y preparar propuestas de actualización, **nunca fusionarlas automáticamente**.

Documentos relacionados: [inventario de sistemas](./progression-systems.md) y [piloto del Guerrero](./talent-advisor-warrior-pilot.md).
