# Talent Advisor — Ficha de revisión del Paladín

**Fecha:** 22 de octubre de 2026 · **Compilación de datos:** `1.60.1.70450` · **Estado:** borrador de beta; pendiente de validar configuraciones al nivel 60.

## Qué aprobamos y qué se añade

Talent Advisor sigue siendo un **asesor**, no una calculadora. Las fichas del **Guerrero** permanecen sin cambios y se añaden **nueve** del Paladín, distribuidas entre **Sagrado, Protección y Reprensión** y los objetivos **Subir al 60, PvP y Mazmorras**.

No se presentan **51 puntos asignados**, órdenes obligatorios de compra, comparaciones de DPS probadas ni builds óptimas. Los nombres de los talentos se han contrastado con el artículo oficial español de Blizzard publicado el **15 de octubre de 2026**.

## Cambios específicos de Forever que fundamentan la propuesta

- **Común a Paladín:** Golpe Sagrado se aprende al nivel 6; Sentencia ya no consume el sello activo; Consagración se aprende a nivel 20 para todas las especializaciones y su eficacia significativa solo alcanza cuatro enemigos; Sello de furia permite provocar desde Sentencia; Emposición reduce su reutilización a 20 minutos. Doble especialización desde nivel 40.
- **Sagrado:** Luz curativa, Reverencia, Infusión de Luz, Favor divino, Choque Sagrado y Vigilia de la Luz potencian la sanación y la gestión de maná. Voz de la verdad mejora las posibilidades de seguir sanando bajo interrupciones.
- **Protección:** Sello de furia mejorado, Furia justa mejorada, Especialización en escudos, Juicio presto, Baluarte de templario, Credo férreo y Escudo Sagrado aportan herramientas de tanqueo, maná, amenaza y defensas. **Escudo Sagrado requiere Baluarte de templario**. Baluarte de templario aplica Abstinencia.
- **Reprensión:** Oración, Búsqueda de justicia, Enjuiciador Sagrado, Arrepentimiento y Giro de la Luz permiten explorar daño físico/Sagrado, movilidad, apoyo mediante sentencias y combinación de sellos; esta última **no es mecánica básica**, solo funciona con el talento de 31 puntos.

**Precaución:** Algunas guías comunitarias de beta y el propio artículo de Blizzard difieren en cifras y descripciones (por ejemplo, el talento Sentencia santificada y el porcentaje de Credo férreo). Por eso las fichas no copian porcentajes conflictivos ni describen la distribución final como probada. Habrá que comprobar cada tooltip en el cliente vigente antes de recomendar rangos exactos.

## Matriz editorial aprobada como siguiente piloto

| Especialización | Subir al 60 | PvP nivel 60 | Mazmorras nivel 60 |
| --- | --- | --- | --- |
| **Sagrado** | Perfil de progreso en grupo; economía de maná y sanación; advertencia de menor ritmo en solitario | Mantener curas bajo presión, Voz de la verdad y herramientas defensivas | Sanación de objetivo único, Vigilia de la Luz para grupo y atención al maná |
| **Protección** | Subir como tanque, especialmente con grupos y mazmorras | Supervivencia y control de puntos, no mayor DPS | Amenaza, Sello de furia, Juicio presto, Baluarte de templario y bloqueo |
| **Reprensión** | Ataques de arma y Sagrado, coste de maná y movilidad | Presión, Arrepentimiento, mantenimiento de sentencias, Giro de la Luz situacional | DPS con utilidad; sentencias, daño y gestión de amenaza, evitando afirmar óptimos |

Los textos concretos están en `data/talent-advisor-paladin.json`, con resumen, talentos que merece la pena estudiar, motivo, limitación y consejo de progreso para cada celda.

## Legado compartido, con pasos por clase

Los **tres perfiles de Legado** (Subir al 60, PvP y Mazmorras) se reutilizan desde `data/talent-advisor-warrior.json`; no se duplican en el archivo de Paladín. En cambio, **las vías para conseguir puntos** están escritas específicamente para Paladín en `data/talent-advisor-paladin.json`, para que una ficha no hable de desafíos del Guerrero.

Esta separación permite reutilizar los mismos consejos de Legado en futuras clases. Antes de validar números de puntos y rutas definitivas, revisar los prerequisitos de los talentos de Legado según la versión.

## Integración técnica

- `data/talent-advisor-catalog.json`: catálogo de clases y referencia común de Legado; facilita ampliar una clase cada vez.
- `app.js`: carga las fichas, valida 3×3 por clase y usa el mapa de iconos existente sin duplicar el código del selector.
- `sw.js`: cache `v14`, precarga catálogo y Paladín para uso offline tras primera conexión.
- `tools/patch_tracker.py`: si cambian talentos del Paladín en Zephras, el informe marca las nueve fichas de Paladín para revisión, igual que ocurría con Guerrero.
- `tests/talent-advisor.test.js` y `tests/test_talent_advisor_catalog.py`: verificaciones de los **18 resultados** y separación de Legado.

## Pendientes

1. Confirmar visualmente en Android que los dos botones de clase, los tres de especialización y los tres objetivos son legibles.
2. Verificar online y después offline, incluyendo el cambio de Guerrero a Paladín.
3. Revisar la coherencia exacta entre parche, tooltips, requisitos y orden de puntos cuando se estabilice el cliente.
4. Incorporar el resto de clases de forma progresiva, sin afirmar que existen fichas no publicadas.

## Fuentes principales

- [Blizzard, 15/10/2026 — Repaso a fondo del Paladín](https://news.blizzard.com/es-es/article/24302099/world-of-warcraft-forever-repaso-a-fondo-de-la-clase-paladin) (fuente **principal** de talentos y nombres españoles)
- [Blizzard — Sistema de Legado](https://news.blizzard.com/es-es/article/24307383/familiarizate-con-el-sistema-de-legado-de-world-of-warcraft-forever)
- [Zephras — Datos de talentos por compilación](https://zephras.com/data/) (datos estructurales de beta, no builds probadas)
- [WoW Forever DB — Talentos Sagrado](https://wowfdb.com/classes/paladin/holy/talents/), [Protección](https://wowfdb.com/classes/paladin/protection/talents/), [Reprensión](https://wowfdb.com/classes/paladin/retribution/talents/) (guías comunitarias marcadas beta; no sustituyen Blizzard)
