# Race Advisor v43 · auditoría editorial y de consistencia · 24/10/2026

**Estado:** revisión técnica de la PR #54. No equivale a una aprobación de las recomendaciones definitivas para publicación.

## Alcance realizado

Se contrastaron las 54 claves facción/clase/especialización del conjunto v2 con la aplicación en desarrollo y con la lista de elegibilidad. Se comprobó la generación de ficha principal y alternativa, habilidades destacadas, comparación contextual y ausencia de campos de texto vacío.

- **54/54 fichas** con contenido principal; **48 comparativas** y **6 evaluaciones de raza única**.
- **27 especializaciones**, 168 posiciones puntuadas; sin carreras o razas ausentes en el top 2 por error de datos.
- **20 principales/segundas cercanas** y **10 segundas/terceras cercanas** detectadas a partir de las puntuaciones originales sin redondear. La UI solo expresa *elección ajustada*, sin publicar puntos internos.
- Las 8 razas originales y la variante dual Cielonato tienen inventario 2+2 y los seis Sacerdotes con sus dos hechizos exclusivos. Feral destaca Walk on Air en la alternativa Cielonato.
- El texto inicial de alternativa se separó del razonamiento comparativo de la pareja para evitar duplicarlo.
- Un dato nuevo ausente, incompleto o de raza incompatible produce error visible; no presenta análisis antiguos del Excel como si correspondieran a v2.

## Casos con significado editorial condicionado

| Ficha | Elección v2 | Condición que debe aparecer en análisis o comparación |
|---|---|---|
| Alianza · Mago · Escarcha | Humano / Gnomo | Traslación disponible reduce utilidad marginal de liberar raíces; Gnomo recupera ventaja con Traslación gastada o sin ruta segura. |
| Alianza · Pícaro · Combate | Enano / Humano | Carrera mejorada y Esfumarse reducen utilidad incremental de otra liberación; Gnomo puede mejorar sin recursos. |
| Alianza · Pícaro · Sutileza | Gnomo / Humano | Esfumarse cuesta un reinicio de sigilo; Preparación puede cambiar disponibilidad. |
| Alianza · Sacerdote · Sombras | Enano / Humano | Desperate Prayer requiere salir de Shadowform; no puede contarse curación simultánea en forma. |
| Horda · Guerrero · Armas | Tauren / Orco | Plainsrunning solo es garantizable parcialmente con tramos seguros; sin reentrada montada Orco mejora. |
| Horda · Guerrero · Furia | Orco / Tauren | Ventanas de carrera sostenida podrían cambiar el orden. |
| Horda · Chamán · Mejora | Orco / Tauren | Presión y movilidad real condicionan la ventaja. |
| Horda · Sacerdote · Disciplina | No-muerto / Troll | En frente/objetivos el modelo presupone reducción aliada de sanación. |
| Horda · Sacerdote · Sagrado | Troll / No-muerto | Diferencia editorial mínima, ~0,03 puntos; no declarar superioridad universal. |
| Horda · Sacerdote · Sombras | No-muerto / Troll | Sin reducción aliada, Troll vuelve a ganar utilidad; acumulación exacta de antiheal no demostrada. |

Los textos de v43 contienen advertencias contextualizadas para estos tipos de mecánica. Esto no implica que se hayan comprobado en el servidor definitivo: fuentes oficiales, extracción de cliente y juicio táctico se mantienen diferenciados.

## Lo que NO está cerrado

1. Revisar manualmente los 54 textos finales desde el navegador frente a cada justificación individual de Work, especialmente tonos, repetición, fuentes y precisión por clase.
2. Incorporar a GitHub los documentos/scripts originales del ZIP para una reproducción completa desde un clon independiente; el orden y 168 puntuaciones ya están versionados y se verificaron en local.
3. Revisar con el usuario los resultados y confirmar autorización de publicación. **No fusionar, cerrar #37 ni modificar `main`** antes de esos pasos.

## Pruebas

- Reproducción aislada de modelos: 168 candidaturas v1, 3.419 sensibilidades, 79 candidaturas recalibradas v2 y 54 rankings concordantes.
- Github Actions: comprobaciones Python de datos, sintaxis JS, pruebas Chromium de las 54 fichas, navegación, 320/390/820/1280, offline y regresiones de Talent, Profession y Addon Advisor.
- No se modificó el Excel original.
