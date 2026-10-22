# Notas visuales pendientes — WoW Forever Advisor

Registro de detalles de diseño observados y aprobados con el usuario. Usar como referencia para agrupar pequeños retoques en futuras tareas de Codex; **no son instrucciones para modificar la app de inmediato**.

Actualizado: 22 de octubre de 2026.

## Diseño ya validado

- Pantalla de inicio v10 aprobada: Race Advisor como tarjeta protagonista; «Explorar raciales» y Profession Advisor como módulos disponibles y accesibles directamente; Talent Advisor y Build Advisor separados como «Próximamente».
- Los botones de selección y los textos de Race Advisor y Profession Advisor **se leen bien en Android**. No aumentar las letras ni rehacer las fichas sin motivo.
- Tema oscuro y dorado, jerarquía de tarjetas y resultados conservados.

## Ajustes completados

- **v11:** se incorporaron iconos de WoW a botones de facción, clase, especialización y raza, se ajustó la distribución móvil y las dos tarjetas «Próximamente» pasaron a ocupar el ancho disponible en escritorio.
- **v12:** unificado el fondo del acceso «Explorar las 8 razas» con los demás botones; añadido el icono de la raza recomendada al lado del nombre en Race Advisor, con alternativa de texto si no carga la imagen.

## Notas históricas de mejoras (ya implementadas o pendientes de validación)


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

## Validaciones en dispositivo

- El usuario confirmó el **22/10/2026** que la pantalla de inicio y los iconos de la versión v11 se ven bien.
- Pendiente de confirmar visualmente la igualdad de fondo del botón y el icono junto al nombre de raza recomendada en v12.

## Ajustes realizados en v15

- Se ha cambiado la instrucción inicial de Talent Advisor a «Elige tu clase, especialización y objetivo para explorar los talentos y ventajas de Legado», conforme a la anotación estética aprobada al revisar v14.
- Se ha adaptado la fila de clases a tres botones, uno por clase disponible, pendiente de comprobación en Android.

## Mantenimiento v17 — aprobado el 22/10/2026

- Se retira la tarjeta «Build Advisor — Próximamente» de la portada, y también la sección «Más caminos por explorar», que quedaba vacía. **Build Advisor no se descarta definitivamente**: se conserva como idea, sin calculadora, para reevaluar solo si aporta una utilidad distinta de Talent Advisor.
- Se conserva la distribución de las tres tarjetas disponibles en móvil y escritorio. Se elimina la única regla CSS específica de la sección desaparecida; no se retocan tamaños ni colores aprobados.
- Se añade el punto final a la descripción de «Explorar raciales» para igualar el estilo de las demás tarjetas.
- Caché v17 y comprobaciones explícitas de ausencia de Build Advisor, navegación, datos y modo sin conexión.
- Las notas de v10/v11 de más arriba son **históricas**, no describen la portada actual.
