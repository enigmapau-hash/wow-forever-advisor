# Talent Advisor — Ficha piloto: Guerrero (Armas, Furia y Protección)

**Fecha de revisión:** 22 de octubre de 2026  
**Datos de talentos disponibles:** cliente beta `1.60.1.70450` (16/10/2026).  
**Estado:** **Ficha piloto aprobada para integrarse en Talent Advisor v13; orientaciones de beta, NO validadas como recomendaciones definitivas.**

> **Principio editorial:** un asesor sencillo, no una calculadora ni un árbol interactivo. Tres objetivos separados: **Subir al 60**, **PvP al 60** y **Mazmorras al 60**. Cada ficha diferencia talentos de clase, Legado, requisitos, ventajas, limitaciones y fuentes. Todas las distribuciones numéricas de nivel 60 y las prioridades exactas por nivel requerirán confirmación tras la beta. No se rellenan puntos arbitrarios para que parezca una build terminada.

## 1. Qué sabemos con fuentes y qué no

**Confirmado oficialmente por Blizzard (30/09/2026; sujeto a parches):**
- El Guerrero mantiene Armas, Furia y Protección. Talentos desde nivel 10, hitos con 11, 16, 21 y 31 puntos invertidos en el árbol. Doble especialización a partir del nivel 40; reentrenamiento de talentos de clase y Legado en instructor de clase.
- Armas: **Lanzazo** (nuevo hito de 16 puntos), **Fragor de la sangre** (Desgarrar/Abrumar), **Maestro de armas**, **Maestría táctica mejorada** y **Golpe mortal** como talento final del árbol.
- Furia: **Golpes enfurecidos** (nuevo hito de 16 puntos), **Deseo de la Muerte**, **Aluvión**, **Sed de sangre** (ya no cura; aporta movilidad). Protección: **Vanguardia** (hito de 16 puntos, Embestir en Actitud defensiva), **Especialización en escudos**, **Maestro de defensa**, **Bastión** y **Embate con escudo**.
- El Guerrero es apto tanto para tanque como para daño, pero carece de buena recuperación autónoma.

**Datos más recientes, extraídos del cliente beta o guías comunitarias:**
- La build `1.60.1.70450` muestra **51 puntos a nivel 60** y cambios posteriores al artículo inicial, entre ellos **Torbellino golpea con ambas armas sin necesidad de Golpes enfurecidos**; este talento reduce el coste de Rajar y Torbellino según guías actualizadas. También se han reordenado talentos tempranos de Furia y Protección.
- Las guías de talentos de WoW Forever DB tienen órdenes de subida y algunas elecciones **probadas hasta nivel 30**, pero etiquetan expresamente muchas builds de nivel 60 como **proyecciones sin probar**. **No tratarlas como meta confirmado.**
- No se ha contrastado directamente el archivo bruto completo de Zephras en esta revisión; sus metadatos de compilación y formato son una referencia, no la validación de cada tooltip.

**Fuentes:**  
- [Blizzard, repaso a sacerdote y Guerrero](https://news.blizzard.com/es-es/article/24301514/repaso-a-fondo-de-las-clases-sacerdote-y-guerrero-en-world-of-warcraft-forever)  
- [Zephras, datos por compilación](https://zephras.com/data/)  
- [WoW Forever DB, Armas](https://wowfdb.com/classes/warrior/arms/talents/) · [Furia](https://wowfdb.com/classes/warrior/fury/talents/) · [Protección](https://wowfdb.com/classes/warrior/protection/talents/)  
- [WoW Forever DB, registro de cambios de Guerrero](https://wowfdb.com/classes/warrior/changes/)

## 2. Modelo de tarjeta que proponemos

**Cabecera:** Guerrero · [Armas/Furia/Protección] · [Subir al 60/PvP/Mazmorras]  
**Estado:** Compilación `1.60.1.70450` · Borrador de beta · No validado en nivel 60  
**1. Talentos de clase:** prioridades, progreso por tramos, condicionantes del equipo y limitaciones.  
**2. Legado:** ventaja que encaja con el objetivo, **prerrequisitos** y rutas para obtener puntos.  
**3. Otro progreso relacionado:** facultades, doble especialización, equipo, profesiones o PvP, únicamente si aportan.  
**Pie:** ¿Por qué esta configuración? · Qué pierdes · Fuente y última revisión.

No mostrar barras «51/51» ni repartos exactos mientras no se hayan comprobado suma, prerequisitos, orden de puntos y efectividad. No publicar como definitivas builds tomadas de guías genéricas de Classic.

## 3. Primer contenido de las nueve combinaciones (hipótesis editoriales)

| Especialización | Subir al 60 | PvP al 60 | Mazmorras al 60 |
| --- | --- | --- | --- |
| **Armas** | **Prioridad provisional:** generación/conservación de ira (**Maestría táctica mejorada**, **Control de furia**), interacción **Desgarrar → Fragor de la sangre → Abrumar**, **Maestro de armas**, **Golpe mortal**. Centrada en armas de dos manos. | **Prioridad provisional:** **Golpe mortal** para reducir sanación, **Lanzazo** para enemigos montados, control de movilidad con facultades del Guerrero y cambios de actitud. | **Rol provisional: DPS**. Valorar **Golpe mortal**, **Golpes de barrido** y daño con arma de dos manos. La amenaza, el rendimiento en jefe y los enemigos múltiples se revisarán al lanzamiento. |
| **Furia** | **Prioridad provisional:** **Crueldad**, generación de ira (**Cólera desbocada**), continuidad entre combates (**Ira persistente**, nombre de traducción a cotejar en cliente), **Golpes enfurecidos** y progresión hacia **Sed de sangre**. Evaluar supervivencia durante leveo. | **Prioridad provisional:** movilidad de **Sed de sangre**, acceso y control con **Aullido perforador**, y daño sostenido; comparar contra Armas antes de recomendar Furia como opción competitiva. | **Rol provisional: DPS con doble empuñadura**; **Especialización en doble empuñadura**, **Precisión furiosa** (nombre pendiente de verificar en español de la build), **Aluvión** y **Sed de sangre**. No trasladar guías de daño de Classic sin revisar la generación de ira. |
| **Protección** | **Opción situacional:** subir haciendo muchas mazmorras o con grupo, no presentarla como la vía más rápida para levear solo. **Especialización en escudos**, **Revancha mejorada**, **Vanguardia** y recursos defensivos. | **Opción especializada:** supervivencia, escudo, control y protección de objetivos; no presentarla como el mejor DPS en PvP. **Vanguardia**, **Muro de escudo mejorado**, control mediante habilidades de escudo. | **Rol principal: tanque**. **Especialización en escudos**, **Maestro de defensa**, **Desafío**, **Bastión**, **Vanguardia** y **Embate con escudo**, con consejos de generación de amenaza y mitigación. |

**Importante:** son **líneas de investigación, no una lista de talentos para comprar en ese orden**. Algunos talentos citados requieren gastar puntos en otros antes de desbloquearlos. Las diferencias exactas entre «subir al 60» y «mazmorra al 60» se acabarán al validar el árbol vigente.

### Ejemplo de ficha con redacción para la PWA — Guerrero / Armas / PvP 60

**Qué buscamos:** controlar enemigos, impedir que recuperen salud con facilidad y mantener presión usando un arma de dos manos.

**Talentos que merece la pena estudiar:**  
- **Golpe mortal** — eje de la presión ofensiva y de la reducción de la sanación recibida por el objetivo.
- **Maestría táctica mejorada** — ayuda a cambiar de actitud perdiendo menos ira.
- **Lanzazo** — ataque adicional de Forever, especialmente útil contra objetivos montados.
- **Maestro de armas** — el beneficio cambia según el tipo de arma; no recomendar automáticamente hachas frente a espadas o mazas sin conocer el equipo del jugador.
- **Fragor de la sangre / Abrumar mejorado** — relación entre Desgarrar, activaciones de Abrumar y golpes críticos.
- **Golpes de barrido / Desgarrar** — útiles de forma contextual; evitar afirmar que todo punto invertido mejora cualquier enfrentamiento.

**Legado sugerido:**  
- Si el objetivo principal es **ganar Honor para obtener equipo**, estudiar **Cuestión de honor**, pero requiere **5 puntos previos gastados en Ingenio**; no se puede recomendar como primer punto disponible.
- Para JcJ en mundo abierto, **Alerta máxima** puede tener interés por detectar sigilo, pero **no funciona en campos de batalla**. Se desbloquea tras invertir puntos en Aventura, de modo que su coste efectivo es superior al de un solo rango.
- No presentar mejoras de Legado de Honor como aumento directo de daño en combate: son progresión de recompensas, no talentos ofensivos.

**Ventaja:** presión sobre sanadores y utilidad en el control de un objetivo.  
**Limitación:** depende de proximidad, arma disponible, ira y coordinación; no promete superioridad frente a Furia en todos los contextos.  
**Estado de esta ficha:** texto conceptual; **sin reparto de 51 puntos**, sin prioridad numérica y sin evaluación práctica a nivel 60.

## 4. Legado por objetivo (tres perfiles reutilizables)

La progresión de Legado se comparte por cuenta, pero **cada personaje invierte sus propios puntos**. En el lanzamiento, máximo anunciado de **16 puntos gastados por personaje**, aunque haya más desafíos y más puntos obtenidos. No confundir «puntos de Legado ganados en la cuenta» con puntos asignables a una ficha sin desbloquear requisitos.

| Objetivo | Ventajas que valorar | Qué advertir |
| --- | --- | --- |
| **Subir al 60** | **Buen descanso** (experiencia descansada), **Emoción de la aventura** (recuperación tras matar enemigos no triviales), **Con talento** (adelanta puntos de clase). | «Con talento» **no crea puntos adicionales en nivel 60** y requiere invertir puntos previamente en Aventura; un personaje nuevo no puede asumir que lo tendrá desde el nivel 1. |
| **PvP al 60** | **Cuestión de honor** en Ingenio para acelerar progreso por Honor; **Alerta máxima** en Aventura para JcJ abierto. | **Alerta máxima no funciona en campos de batalla**; Cuestión de honor requiere puntos previos de Ingenio y **no aumenta el rango directamente**. |
| **Mazmorras al 60** | **Este muerto está muy vivo** (acorta el regreso tras morir), **Refuerzo** (menos pérdida de durabilidad), **Permanencia** (beneficios más duraderos). | «Permanencia» requiere invertir en Ingenio; estas ventajas no sustituyen el equipo, la amenaza, la coordinación o el conocimiento de jefes. |

**Ruta de puntos de Legado realista al empezar:**
1. **Nivel 25** con el Guerrero: primer desafío de clase; alternativamente, **150 puntos de habilidad** en un oficio no recolector o **explorar el mapa completo**. Blizzard señala que el sistema se abre al conseguir el primer punto.
2. **Nivel 45 y 60**: dos desafíos de clase adicionales para el mismo personaje.
3. **Oficios no recolectores**: hitos a 150/225/300 en cada oficio válido; no afirmar que Minería o Herboristería cuentan para este desafío.
4. **PvP:** rangos, reputaciones de campos de batalla y misiones estacionales como fuentes de puntos; evitar venderlas como la ruta de leveo inicial más fácil.
5. **Mazmorras/bandas:** desafíos por vencer jefes finales de grupos de mazmorras, además de tres objetivos de bandas. No son puntos que se consigan simplemente entrando en una mazmorra.

**Fuentes Legado:** [Blizzard — sistema de legado](https://news.blizzard.com/es-es/article/24307383/familiarizate-con-el-sistema-de-legado-de-world-of-warcraft-forever); [WoW Forever DB — talentos y prerrequisitos de Legado](https://wowfdb.com/legacy/).

## 5. Cuestiones importantes antes de convertirlo en datos de la app

1. **Comprobar traducciones:** algunos nombres introducidos por parches de octubre aparecen solo en inglés en datos de terceros; no inventar traducción oficial en un texto que se publica como exacto.
2. **Reconstruir árbol por compilación:** validar nombres, niveles, filas, dependencias, rangos y suma de puntos desde una extracción accesible y contrastar con notas recientes.
3. **Un orden de subida por clase/especialización:** como el nivel importa, un reparto final correcto **no basta** para aconsejar al jugador entre 10 y 60.
4. **Distinguir PvP abierto, campo de batalla y rol en mazmorra:** el Legado y ciertos efectos cambian según el entorno.
5. **Comprobar builds de nivel 60 tras lanzamiento:** a fecha de la revisión, las propuestas de terceros para nivel 60 se catalogan como no probadas y la beta todavía tiene ajustes.
6. **Evitar repetición innecesaria:** almacenar **tres perfiles de Legado por objetivo** con variaciones concretas, no copiar una misma ficha 27×3.
7. **No modificar Race Advisor ni Profession Advisor** al preparar el piloto. Si más adelante se incorporan nuevos árboles, datos o sistemas, mostrar estado de revisión por parche.
8. **No incluir una calculadora ni árbol interactivo:** se han descartado expresamente.

## 6. Interfaz aprobada del piloto

**Interfaz preparada en la rama de integración (sujeta a verificación en Android):**
- Selección de **Guerrero** → especialización con botón e icono → tres opciones separadas (**Subir al 60**, **PvP**, **Mazmorras**).
- Mostrar una tarjeta de resultado con: (1) Talentos de clase, (2) Legado y cómo obtener puntos, (3) Otros progresos importantes.
- Mostrar siempre **versión, estado y fecha de revisión**. «Recomendación de beta — por validar» hasta que pueda acreditarse su distribución.
- Dejar que se visualicen **prioridades y razonamientos** sin simular repartos completos hasta la validación de nivel 60.

**Aprobado por el usuario:** alcance y nivel de detalle del piloto; se crean 9 fichas en `data/talent-advisor-warrior.json` junto a 3 perfiles de Legado y la vista Talent Advisor. Siguen pendientes los repartos de puntos y su verificación con el cliente definitivo.

## Referencia transversal

Ver [inventario completo de progresión](./progression-systems.md), que distingue talentos de clase y Legado de profesiones, Honor, puntos de rango, mascotas del Cazador, acampada y otras progresiones.
