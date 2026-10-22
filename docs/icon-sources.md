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

## Comprobación adicional de licencias y fuentes (22/10/2026)

- **Blizzard Fan Site Kit v1.0:** fue publicado por Blizzard específicamente para crear webs de fans. Su descripción incluye logotipos, arte, capturas, plantillas y personajes recortados por clase, y exige un aviso de derechos/no afiliación. **No contiene una colección documentada de las 46 miniaturas seleccionadas para nuestra PWA**, así que no resuelve la necesidad de iconos de todas las especializaciones. Fuente: [descripción del kit original](https://www.moddb.com/games/world-of-warcraft/downloads/wow-fan-site-kit), [historia del kit](https://warcraft.wiki.gg/wiki/Fansite_kit).
- **«WoW Source - Fansite Kit V1.0»:** un paquete aparte listado por [4Fansites](https://wow.4fansites.de/downloadsfansitekit.php) anuncia **1.623 iconos**, pero **no es el mismo archivo que el kit Blizzard**. No hemos establecido quién compiló sus imágenes ni qué autorización concreta tienen. 4Fansites además advierte que la reutilización de contenidos y gráficos requiere permiso; no asumir que esos 1.623 iconos son distribuibles en nuestro repositorio.
- **FAQ legal Blizzard:** sí contempla ciertos usos de material descargado para fansites personales y no comerciales, con condiciones de crédito, pero declara una licencia personal, no transferible y revocable. Esta FAQ **no basta para concluir sin matices que podemos subir a GitHub cualquier textura extraída del juego o encontrada en otra web**. Fuente: [FAQ legal oficial](https://www.blizzard.com/es-es/legal/c1ae32ac-7ff9-4ac3-a03b-fc04b8697010/blizzard-legal-faq).
- **Blizzard Developer API:** sus [términos](https://www.blizzard.com/ko-kr/legal/a2989b50-5f16-43b1-abec-2ae17cc09dd6/blizzard-developer-api-terms-of-use) prevén distribuir datos al usuario mediante una aplicación **registrada**, con clave confidencial y actualización máxima de 30 días. Su uso solo para servir iconos añadiría autenticación, obligaciones y dependencia operativa ajenas a esta sencilla PWA offline. No adoptarla.
- **Zephras:** los IDs de texturas ayudan a identificar exactamente los árboles del cliente beta, **no dan una licencia sobre las imágenes**, como expresa [Zephras](https://zephras.com/data/).

### Decisión de la fase 7.2

1. Mantener los botones actuales con texto y los atributos `data-icon-kind`, `data-icon-name` y `data-icon-class`: ya están preparados para imágenes.
2. **No publicar aún imágenes ni URLs remotas en la PWA**. Evitar hotlink a wikis, CDN o servicios de terceros y no añadir una API autenticada.
3. Cuando se disponga de un conjunto de archivos auténticos con una autorización aplicable a su publicación, inventariar cada recurso por origen, derechos, ruta local y selector al que corresponde; entonces implementar una única PR de iconos locales y caché offline con alternativa de texto.
4. Si no hay cobertura suficiente, se podrá incorporar solamente un subconjunto cuya procedencia y condiciones estén aclaradas, sin simular que el resto son iconos oficiales.
5. Conservar las [notas estéticas](./visual-notes.md) para pulir distribución y legibilidad en Android durante esa misma PR, no mediante tareas independientes.

**Resultado de esta comprobación:** 46 referencias de iconos identificadas; no se ha podido acreditar un paquete completo claramente reutilizable de imágenes de Blizzard para redistribuirlo en un repositorio GitHub público. La integración gráfica se mantiene pendiente; no se altera la PWA.


## Implementación propuesta de la Fase 7.2 (rama `feat/wow-icons-cache`)

En lugar de copiar imágenes al repositorio, se ha integrado un mapa de **enlaces
directos a las imágenes originales de World of Warcraft en la CDN de Wowhead**,
`https://wow.zamimg.com/images/wow/icons/large/`.
Los nombres y asignaciones están registrados en `icons/icon-map.js`:
46 usos (2 facciones, 9 clases, 27 especializaciones, 8 razas), 44 URL únicas.
Se han contrastado varias rutas con la CDN; **esto no sustituye la verificación
visual de cada imagen en Android**.

Se usa un `Service Worker` para almacenar las respuestas en la caché privada
del navegador, sin redistribuir archivos binarios en GitHub. Se precargan con
conexión después de activar el worker; si el servidor remoto rechaza la
petición, falla la red o el dispositivo purga su caché, el botón mantiene su
texto y la aplicación continúa funcional. No hay dependencia de un API ni
contraseñas.

**Limitación:** los enlaces y la caché de un tercero no constituyen una
autorización general para redistribuir imágenes ni aseguran la disponibilidad
permanente. Si las condiciones de uso de la CDN cambian o restringen la
integración, habrá que retirar esa fuente o solicitar autorización. La
propiedad intelectual de los gráficos sigue siendo de Blizzard. El aviso de
no afiliación aparece en el pie de la aplicación.

*Pendiente de prueba en dispositivo*: comprobar cada botón e icono, la
distribución en pantalla móvil y que las imágenes ya descargadas se muestran
en modo avión. La PR no debe fusionarse hasta validar este paso.
