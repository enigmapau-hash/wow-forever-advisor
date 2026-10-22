# Talent Advisor — Ficha piloto del Chamán

**Fecha de revisión:** 22 de octubre de 2026. **Datos de referencia:** beta `1.60.1.70450`. **Estado:** orientación editorial provisional, sin distribuciones exactas de 51 puntos ni pruebas completas de nivel 60.

## Alcance

Añadir las tres especializaciones del **Chamán** (Elemental, Mejora y Restauración) y los tres objetivos aprobados (**Subir al 60, PvP y Mazmorras**). Son **nueve fichas nuevas** en `data/talent-advisor-shaman.json`. Guerrero y Paladín mantienen sus 18 fichas anteriores.

El módulo reutiliza el asesor de Legado por objetivo y personaliza los pasos para conseguir puntos con los desafíos de clase del Chamán.

## Fuentes: un cambio oficial posterior al artículo inicial

El [repaso oficial del 7 de octubre](https://news.blizzard.com/es-es/article/24302097/world-of-warcraft-forever-repaso-a-fondo-de-las-clases-mago-y-chaman) confirma muchas facultades y talentos, pero sus descripciones del tramo final de **Elemental** fueron superadas por las [notas de desarrollo oficiales del 15 de octubre (publicadas el 16)](https://us.forums.blizzard.com/en/wow/t/wow-forever-beta-development-notes-%E2%80%93-updated-october-15/2360696/6):

- **Maestría elemental vuelve** como talento final de **31 puntos**, con efecto rediseñado. Requiere Ráfaga de lava; no equivale a la versión clásica de crítico garantizado.
- **Ráfaga de lava** pasa a ser el talento de **21 puntos**.
- **Vinculado a la tierra** se sitúa en el hito de **16 puntos**.
- **Llamada del trueno** queda **eliminada** del árbol Elemental.
- Prontitud elemental y Sobrecarga de relámpagos cambian de ubicación y relación de prerrequisitos. El talento anteriormente denominado Nova de Fuego mejorada recibe un nuevo nombre en las notas recientes.
- En Restauración, Enfoque de las mareas y Enfoque totémico intercambian filas, Escudo de agua puede activarse con cualquier golpe crítico de hechizo y Tótem marea de maná recibe un rango adicional.

**Consecuencia editorial:** ninguna ficha de la beta debe repetir sin comprobar las distribuciones anteriores al 15/10 ni atribuir a Llamada del trueno un lugar en el árbol vigente. La selección actual reúne prioridades para estudiar, no un orden de compra.

## Matriz de las nueve orientaciones

| Especialización | Subir al 60 | PvP nivel 60 | Mazmorras nivel 60 |
| --- | --- | --- | --- |
| **Elemental** | Gestión de maná, lanzamientos, Ráfaga de lava y control | Resistir interrupciones, controlar con tótems, Maestría elemental | DPS de Naturaleza y Fuego, Sobrecarga y utilidad de grupo |
| **Mejora** | Armas, hechizos, movilidad y Enfoque chamanístico | Presión cuerpo a cuerpo, aguante y movilidad | DPS cuerpo a cuerpo híbrido, control de amenaza y tótems |
| **Restauración** | Perfil de sanación para grupos y mazmorras | Sanación bajo presión, recursos y Mareas vivas | Sanación de grupo, mana, Escudo de agua y Tótem marea de maná |

### Capacidades de clase propias de Forever

Blizzard anuncia una interfaz de seguimiento de tótems, **Llamada de los elementos** (nivel 20), **Regreso totémico** (nivel 20), **Proyección totémica** (nivel 22) y nuevas llamadas para conjuntos de tótems. Las imbuiciones de arma tienen más duración. Estas facultades aparecen como consejos de progreso cuando aportan, pero **no se representan erróneamente como puntos de talento**.

Las notas del 15/10 también modifican el comportamiento de tótems y Nova de Fuego; en consecuencia no se recomienda asumir sin validar que todos los beneficios de tótems se acumulan.

## Legado

Los tres perfiles por objetivo permanecen almacenados en `data/talent-advisor-warrior.json` como base editorial **común a todas las clases**. Chamán conserva sus instrucciones particulares para ganar puntos en `data/talent-advisor-shaman.json`; ningún usuario del Chamán debe ver desafíos del Guerrero o Paladín como si fueran de su propia clase.

## Integración y mantenimiento

- `data/talent-advisor-catalog.json`: añade Chamán sin cambiar los archivos de clases previas.
- `sw.js`: versión de caché **v15**, precarga la nueva ficha para que se lea offline después de la primera visita con Internet.
- `tests/test_talent_advisor_catalog.py` y `tests/talent-advisor.test.js`: deben cubrir **27 fichas** y verificar los cambios de clase y los perfiles de Legado.
- Patch Tracker: si cambian talentos del Chamán, el informe señalará sus **nueve fichas** para revisión.
- **Sin calculadora ni árbol interactivo**. Nada indica que las propuestas sean óptimas al nivel 60.

## Pendiente antes de validar las builds finales

Contrastar rangos, ubicación de talentos, prerrequisitos y resultados reales al llegar a nivel 60. Revisar inmediatamente cualquier cambio posterior registrado por el Patch Tracker. Validar la disposición de tres clases y los textos en Android; comprobar el modo avión tras una carga con conexión.

## Fuentes

- [Blizzard — Repaso a fondo de Mago y Chamán, 7/10/2026](https://news.blizzard.com/es-es/article/24302097/world-of-warcraft-forever-repaso-a-fondo-de-las-clases-mago-y-chaman)
- [Blizzard — Notas de desarrollo de beta actualizadas el 15/10/2026](https://us.forums.blizzard.com/en/wow/t/wow-forever-beta-development-notes-%E2%80%93-updated-october-15/2360696/6)
- [Blizzard — Sistema de Legado](https://news.blizzard.com/es-es/article/24307383/familiarizate-con-el-sistema-de-legado-de-world-of-warcraft-forever)
- [Zephras — datos de talentos por compilación](https://zephras.com/data/)
