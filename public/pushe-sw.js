// One root service worker owns both Meydan's offline/cache behavior and Pushe Web Push.
importScripts("/sw.js");

try {
  importScripts("https://static.pushe.co/pusheweb-sw.js");
} catch (error) {
  // Push delivery can recover on a later service-worker update. Offline caching
  // must still install even if the external push script is temporarily unreachable.
  console.warn("[meydan:pwa] Pushe worker unavailable; offline mode remains active.", error);
}
