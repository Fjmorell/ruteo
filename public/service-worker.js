self.addEventListener("install", (event) => {
  console.log("📥 Service Worker instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker activado");
  return self.clients.claim();
});

// ⚠️ Nota: No se puede usar geolocalización directamente desde acá.
// Solo mantiene la app como PWA.
