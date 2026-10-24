# v41 · Race Advisor, homogeneidad y seis evaluaciones individuales

Fecha editorial: 24/10/2026.

## Cambios aprobados

- **Seis combinaciones de raza única** ahora tienen su propia tarjeta de evaluación con «A favor», «A tener en cuenta» y una conclusión individual y específica de especialización: Chamán de Alianza (Enano · Elemental, Mejora, Restauración) y Paladín de Horda (No-muerto · Sagrado, Protección, Reprensión). No se inventa una alternativa.
- **Seis tarjetas alternativas Cielonato/Druida**: retirada completa de la frase «En esta especialización» sin dejar su espaciado anterior; habilidad, resumen y explicación conservados.
- **Addons relacionados**: tarjeta secundaria con borde, relleno y fondo discretos. Sus limitaciones siguen visibles en estilo menor; el catálogo sigue siendo opcional.
- **Fuentes y cambios de beta**: tarjeta secundaria con notas de beta visibles cuando las hay y fuentes oficiales en un único `details` cerrado por defecto. Sin URLs duplicadas y con títulos de clase/especialización más precisos; accesible por teclado.
- **Versión y caché**: v41, con las seis evaluaciones precargadas en el service worker para su lectura sin conexión.

## Sin cambios

48 comparativas de v40, las 54 recomendaciones, la excepción aprobada Sacerdote Sagrado Horda (Troll principal, No-muerto alternativa), datos del Excel, catálogo de addons, Talent Advisor y Profession Advisor.

## Validación requerida antes de publicar

CI completo con tests Python, checks de JavaScript, 54 fichas en 320/390/820/1280 px, comprobación de seis evaluaciones y 48 comparativas originales, enlaces plegados, coherencia de navegación y servicio offline; posteriormente CI `main` y GitHub Pages.
