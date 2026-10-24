# Race Advisor v43 · recibo de reproducción de investigación

**Fecha de cotejo:** 24 de octubre de 2026. **Estado:** investigación v2 en revisión editorial, no aprobada para publicación.

## Archivo fuente íntegro

ZIP suministrado por el usuario: `race-reliability.zip`, 37 archivos de investigación útiles, sin incluir `__pycache__`.

- SHA-256 del ZIP completo: `ef5443c0594f6596f2f81ff90e7be8475efbeda13a2bfcdd1eeab99e3e19ce29`.
- SHA-256 de `rankings-v2.json`: `410fb6580b3a3c6eaecc041c1b662a4ec7a038b344ff10baa683b55d24b34e04`.
- SHA-256 de `evaluation-2026-10-24.json`: `ee7ba013909b03d65cfb5f0f79583be028930df5dec3f3e341595fe07cd848c5`.
- SHA-256 de `recalibration-v2.json`: `2639542d83e4fc79aa5ba634d5e89ffbf45ef4d7bc58d25d8953e0d303b1ffaa`.
- SHA-256 de `sensitivity-2026-10-24.json`: `295d3b4d2d26bfeda6ff26d61d5d5c9edaa42ef7b0e041e6bdd0f61eed376604`.
- SHA-256 de `recalibration-v2-sensitivity.json`: `2435bf5f7116443e629b39c0ebd3fa9afca0a25e12c4f7999de0e9a6692b345f`.
- SHA-256 del motor `evaluate_rankings.py`: `6a4eccd577f20ef28f341e5733b8ba8aa1ff7b9c01bd2f32cb89fb324c1608b5`.
- SHA-256 del motor `recalibrate_v2.py`: `9878a812e60945209e732333ab0ed756a6d410001b5ece0cc1ec2aad24011fda`.

## Qué se pudo reproducir sin una copia del repositorio

Con los archivos del ZIP descomprimidos y Python estándar (sin acceso web), se invocaron `evaluate_rankings.evaluate(inventory, profiles)` y `recalibrate_v2.calculate(card, profile)` sobre las 54 fichas. Comparación con tolerancia inferior a `1e-10` para serialización de valores `Fraction` a `float`:

- **168 puntuaciones v1** y los **54 órdenes v1** coinciden con `evaluation-2026-10-24.json`.
- El generador enumera **3.419 escenarios de sensibilidad v1**.
- Las **22 fichas v2** (79 candidaturas) reproducen puntajes y órdenes de `rankings-v2.json`.
- Las **32 fichas restantes** conservan el orden v1.
- `rankings-v2.json` registra **20 pares principal/alternativa** con margen inferior a dos puntos y **10 márgenes segunda/tercera** de la misma escala.
- Las **168 puntuaciones v2** se han volcado sin redondear a `data/race-rankings-v43.json`. Comprobación de sus órdenes y puntos exactos frente al ZIP: FNV-1a sobre cadenas normalizadas `0x5c4917d5`.

**Límite expreso:** estos cotejos no reemplazan la validación integral con los hashes de los archivos de v42 ni el contraste `git show` contra el commit de investigación v1. Para esa prueba completa hay que integrar el contenido fuente de los scripts/JSON (y el historial v1) en el repositorio. El ZIP permanece preservado como adjunto de la conversación; actualmente **no está incluido en la PR #54**, y un clon de la rama no basta para reconstruir los efectos, testigos de talentos y las 3.419 variaciones.

## Integración y conservación

El estado editorial `50/30/20` es una ponderación de escenarios, no rendimiento medido. La aplicación no expone cifras de puntuación; `data/race-rankings-v43.json` preserva las 168 por trazabilidad. La interpretación de casos de margen estrecho está condicionada al escenario. No cambiar el Excel original, `main` ni publicar v43 antes de la revisión final.
