# Iconos para WoW Forever Advisor — fuentes y estado

Preparación de la fase visual (22 de octubre de 2026). **Solo inventario; no se han integrado imágenes.**

## Cobertura comprobada
- **9 clases y 27 especializaciones**: coincidencia exacta con ambos JSON actuales del proyecto.
- **8 razas**: nombres literales existentes en `data/racials.json`.
- **2 facciones**: Alianza y Horda.
- Total planificado: **46 usos de icono**. Puede haber texturas compartidas por más de un uso.
- Los identificadores originales de clases y árboles constan en `docs/icon-inventory.json` y proceden de **WoW Forever, cliente 1.60.1.70450**.

## Fuentes verificadas
1. [Zephras — archivos de talentos](https://zephras.com/data/): [JSON beta de talentos](https://zephras.com/data/forever/enUS/talents/1.60.1.70450.json), campos `classes[].icon` y `classes[].trees[].icon` (FileDataID de las texturas).
2. [Warcraft Wiki — catálogo de iconos del juego](https://warcraft.wiki.gg/wiki/Warcraft_Wiki:WoW_Icons) y [categoría de iconos de clase](https://warcraft.wiki.gg/wiki/Category:Class_icons): referencias visuales para verificar representación y nombres.
3. [Blizzard — FAQ legal sobre webs de fans](https://www.blizzard.com/en-us/legal/c1ae32ac-7ff9-4ac3-a03b-fc04b8697010/blizzard-legal-faq), [términos de uso de sitios Blizzard](https://www.blizzard.com/en-us/legal/) y [guía de marcas](https://www.blizzard.com/en-sg/legal/8bcb0794-6641-4ce3-a573-8eb243bab342/blizzard-entertainment-logo-and-trademark-guidelines).

## Derechos y límites
- La licencia **CC BY 4.0 de Zephras cubre su trabajo de selección y organización de datos**, pero **no** las texturas, ilustraciones, nombres ni iconos pertenecientes a Blizzard. Si se reutiliza su selección de datos, citar «Datos de talentos: Zephras (https://zephras.com), CC BY 4.0, adaptados para el inventario».
- La FAQ de Blizzard contempla determinados usos personales/no comerciales de materiales de fans. **No se ha confirmado una autorización general para copiar y publicar los archivos de imagen en un repositorio público**. El kit de fansites de 2004 no resuelve automáticamente esta cuestión para cualquier recurso.
- No copiar imágenes directamente de una wiki, Wowhead, Zephras u otro fansite asumiendo que su licencia se transfiere.
- Añadir aviso de derechos/no afiliación si finalmente se usan recursos oficiales bajo condiciones aplicables.

## Requisitos para la futura UI
1. Facción: 2 botones. Clase: 9 botones filtrados por la facción en Race Advisor y 9 botones sin filtro en Profession Advisor.
2. Especialización: 3 botones por clase, conservando estado y navegación. Explorador racial: 8 botones.
3. Nombre siempre visible y controles accesibles por teclado/lector de pantalla.
4. Iconos **locales y cacheados** para que funcionen offline, cuando los derechos estén aclarados; sin llamadas remotas obligatorias.
5. Sin cambios en la exportación Excel, los JSON editoriales, los resultados o las recomendaciones.
6. No inventar rutas basándose en FileDataID: resolver cada ID a un archivo real y comprobar el aspecto del icono antes de importarlo.

## Referencias visuales completadas para facción y raza

**Facciones:** [Crest of the Alliance](https://warcraft.wiki.gg/wiki/Crest_of_the_Alliance) y [Banner of the Horde](https://warcraft.wiki.gg/wiki/Banner_of_the_Horde). El [catálogo de iconos de facción](https://warcraft.wiki.gg/wiki/Category:Faction_icons) identifica las miniaturas de 64 × 64 como `Alliance 64.png` y `Horde 64.png`. Son referencias, **no** archivos locales ni licencias.

**Razas (escudos heráldicos de Warcraft, sin género):**

| Etiqueta del JSON | Identidad visual candidata | Fuente |
| --- | --- | --- |
| Gnomo | Icon of Technology | https://warcraft.wiki.gg/wiki/Icon_of_Technology |
| Humano | Icon of Courage | https://warcraft.wiki.gg/wiki/Icon_of_Courage |
| Enano | Icon of the Forge | https://warcraft.wiki.gg/wiki/Icon_of_the_Forge |
| Elfo | Icon of Wisdom (elfo de la noche) | https://warcraft.wiki.gg/wiki/Icon_of_Wisdom |
| Orco | Icon of Battle | https://warcraft.wiki.gg/wiki/Icon_of_Battle |
| Tauren | Icon of the Earth Mother | https://warcraft.wiki.gg/wiki/Icon_of_the_Earth_Mother |
| Troll | Icon of Shadows (Lanza Negra) | https://warcraft.wiki.gg/wiki/Icon_of_Shadows |
| No-muerto | Icon of Torment (Renegado) | https://warcraft.wiki.gg/wiki/Icon_of_Torment |

`Elfo` **significa elfo de la noche**, comprobado en el campo `comentarios` de `data/racials.json`, que menciona Shadowmeld. No cambiar el literal de la base editorial.

**Criterio visual:** los escudos raciales son una candidatura fiel a Warcraft, no necesariamente la representación más legible a tamaño pequeño. Antes de implantarlos, contrastar a escala de botón móvil (48–64 px) frente a los retratos raciales clásicos, que suelen distinguir género; no asumir que las dos familias gráficas son intercambiables.

## Verificación de derechos

- [FAQ legal de Blizzard](https://www.blizzard.com/es-es/legal/c1ae32ac-7ff9-4ac3-a03b-fc04b8697010/blizzard-legal-faq): prevé un permiso limitado **personal, doméstico y no comercial** para contenido descargado de su sitio bajo ciertas condiciones, con avisos de copyright; no equivale a una licencia abierta para republicar cualquier icono en GitHub.
- Blizzard distribuyó un [kit para fansites](https://www.moddb.com/games/world-of-warcraft/downloads/wow-fan-site-kit) con materiales para estas webs y un aviso obligatorio de no afiliación. **Su autorización específica se limita al contenido del kit**; no convierte automáticamente los iconos extraídos de clientes o recopilados por wikis en archivos redistribuibles.
- El texto wiki puede estar bajo Creative Commons, pero las imágenes de Blizzard conservan sus derechos. El hecho de que otros sitios muestren los iconos tampoco concede una autorización transferible.
- No se han descargado, modificado ni subido iconos al repositorio.

**Decisión de integración:** sustituir selectores por botones con texto visible es independiente de los permisos gráficos. La incorporación de imágenes locales queda condicionada a confirmar una base de uso y atribución apropiada; nunca hacer que una llamada a una web de terceros sea necesaria para consultar recomendaciones offline.

## Pendiente
1. Elegir, a partir de fuentes que permitan el uso propuesto, los archivos reales que correspondan a las referencias registradas.
2. Comprobar permisos y conservar una ficha de procedencia por recurso (URL, titular, condiciones, créditos).
3. Probar legibilidad y tamaños reales en Android, especialmente escudos raciales detallados, antes de introducirlos en la aplicación.

**Estado:** 46 usos de icono con referencia visual identificada (9 clases, 27 árboles, 2 facciones, 8 razas); **ningún archivo gráfico incorporado ni permiso general de redistribución confirmado**.
