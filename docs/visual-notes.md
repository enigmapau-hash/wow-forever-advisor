# Notas visuales pendientes — WoW Forever Advisor

Registro de detalles de diseño observados y aprobados con el usuario. Usar como referencia para agrupar pequeños retoques en futuras tareas de Codex; **no son instrucciones para modificar la app de inmediato**.

Actualizado: 22 de octubre de 2026.

## Diseño ya validado

- Pantalla de inicio v10 aprobada: Race Advisor como tarjeta protagonista; «Explorar raciales» y Profession Advisor como módulos disponibles y accesibles directamente; Talent Advisor y Build Advisor separados como «Próximamente».
- Los botones de selección y los textos de Race Advisor y Profession Advisor **se leen bien en Android**. No aumentar las letras ni rehacer las fichas sin motivo.
- Tema oscuro y dorado, jerarquía de tarjetas y resultados conservados.

## Pendientes para abordar juntos

| Prioridad | Zona | Nota | Criterio |
| --- | --- | --- | --- |
| Baja, estética | Inicio / «Más caminos por explorar» | Las dos tarjetas «Próximamente» no llenan el ancho total disponible en la captura de la versión v10. | Considerar adaptar la cuadrícula de esas dos tarjetas al ancho disponible (2 columnas en escritorio, 1 en móvil), manteniendo el resto del inicio. No dedicar un encargo de Codex solo a esto. |
| Próxima fase, funcional y estética | Selectores de facción, clase, especialización y raza | Incorporar iconos auténticos de WoW a los botones existentes, sin perder las etiquetas visibles ni agrandar demasiado la interfaz. | Los 46 usos previstos y sus referencias están en `docs/icon-inventory.json` y `docs/icon-sources.md`. **No importar ni redistribuir imágenes sin aclarar su procedencia y condiciones de uso**. Mantener modo offline. |
| A validar con iconos | Botones en móvil | Revisar la distribución de clases una vez tengan iconos; valorar una cuadrícula de 3 columnas con botones más altos solo si realmente mejora la lectura y pulsación. | Evitar desplazamiento horizontal y crecimiento innecesario de página. El tamaño actual del texto fue aprobado en Android. |
| A validar con iconos | Razas | Los escudos heráldicos candidatos podrían verse demasiado detallados a 48–64 px. | Contrastar legibilidad frente a otros iconos raciales antes de decidir los archivos definitivos. «Elfo» corresponde a elfo de la noche. |

## Regla de trabajo

1. Priorizar la funcionalidad y los datos originales.
2. Acumular detalles puramente cosméticos y corregirlos juntos cuando haya una fase relacionada; no gastar cuota de Codex en retoques aislados.
3. Antes de fusionar cambios visuales, revisar PR y probar en Android.
