# Talent Advisor: nueve clases, 81 fichas de beta

Revisión: 22 de octubre de 2026. Se añaden 54 fichas en una sola fase:
Cazador, Pícaro, Sacerdote, Mago, Brujo y Druida; tres ramas por clase y
Subir al 60 / PvP / Mazmorras por rama. Las 27 fichas anteriores permanecen
idénticas, comprobadas mediante SHA-256. Legado sigue usando los tres perfiles
comunes del Guerrero; cada clase describe su propia vía de desafíos.

## Método editorial

Se contrastaron los repasos de clases de Blizzard con las
[notas del 15/10](https://us.forums.blizzard.com/en/wow/t/wow-forever-beta-development-notes-%E2%80%93-updated-october-15/2360696/6).
Las notas posteriores prevalecen. Cada JSON enlaza ambas fuentes y explica las
correcciones que afectan a su clase. Las recomendaciones por objetivo son
criterio editorial: no equivalen a una simulación, ranking o prueba al nivel 60.
Se conservan nombres oficiales ingleses de talentos nuevos porque no se ha
contrastado su localización española; el resto de la explicación está en español.
Las listas contienen candidatos a estudiar, sujetos a rangos, filas y dependencias.
No son una asignación simultánea garantizada ni una secuencia de compra de puntos.

La compilación 1.60.1.70450 identifica la referencia editorial heredada, no
certifica cuál es el último cliente del servidor. Las notas públicas no permiten
validar todas las interacciones ni el contenido final de lanzamiento.
El calendario inicial de cierre de beta quedó superado por el
[anuncio del 20/10](https://us.forums.blizzard.com/en/wow/t/heads-up-wow-forever-stress-test-on-october-21/2387920):
Blizzard anuncia reapertura tras el stress test y cierre previsto el 23/10 a las
10:00 PDT (19:00 en Madrid). No se afirma disponibilidad de servidores en tiempo real.

## Sistemas relacionados

Las fichas del Cazador ofrecen opciones de familia según situación, órdenes,
felicidad, lealtad y entrenamiento, sin inventar puntos o una mascota óptima.
El bloque de fuentes recoge los ajustes recientes a crocolisco y murciélago.
Brujo distingue demonios, fragmentos, Banes y maldiciones; Mago incluye Comprensión;
Pícaro preparación de venenos; Sacerdote facultades raciales y generales; Druida
formas, equipo y funciones distintas de oso y gato. No se añaden árboles de
profesión, Honor o acampada como si fueran puntos de talentos.

## Verificación y mantenimiento

El catálogo y la caché v16 incluyen las nueve clases. Se preservan diseño,
textos accesibles, selección por teclado y limpieza de resultados al cambiar clase.
Python comprueba cobertura, conservación de originales, fuentes y caché completa.
La prueba HTML recorre todas las combinaciones; el runner Playwright ejecuta
también navegación, móvil, reintento tras datos incompletos y recarga offline.
El Patch Tracker recomienda revisar las nueve fichas de cualquier clase afectada.
No vigila automáticamente todas las habilidades de mascotas ni cambios del servidor.
Una compilación sin diferencias en el tracker no valida las builds finales.

Fuentes por clase: [Cazador/Druida](https://news.blizzard.com/en-us/article/24301515/world-of-warcraft-forever-class-deep-dives-hunter-and-druid),
[Pícaro/Brujo](https://news.blizzard.com/en-gb/article/24310968/world-of-warcraft-forever-class-deep-dives-rogue-and-warlock),
[Sacerdote](https://news.blizzard.com/en-gb/article/24301514/world-of-warcraft-forever-class-deep-dives-priest-and-warrior),
[Mago](https://news.blizzard.com/en-gb/article/24302097/world-of-warcraft-forever-class-deep-dives-mage-and-shaman).
