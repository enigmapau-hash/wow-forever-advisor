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

## Pendiente
- Aclarar qué distribución local de iconos originales es compatible con los términos aplicables a este proyecto público.
- Verificar los emblemas concretos de facción y los ocho iconos de raza, especialmente la etiqueta editorial `Elfo`.
- Reunir los archivos gráficos autorizados, registrar procedencia por archivo y comprobar su tamaño y visibilidad en Android.

**Estado de esta fase:** inventario técnico preparado; colección de archivos gráficos todavía pendiente.
