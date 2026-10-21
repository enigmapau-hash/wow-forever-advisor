"use strict";

if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", {
      scope: "./",
      updateViaCache: "none",
    }).catch((error) => {
      console.warn("No se pudo activar el modo sin conexión.", error);
    });
  });
}
