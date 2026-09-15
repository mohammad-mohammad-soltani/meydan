// Pushe requires this filename at the site root. Keep Meydan's caching worker
// first so PWA/offline behavior remains active on the same service-worker scope.
importScripts("/sw.js");
importScripts("https://static.pushe.co/pusheweb-sw.js");
