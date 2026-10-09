import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("Meydan owns the root worker and receives push while the page is closed", () => {
  const runtime = source("components/pwa/PwaRuntime.tsx");
  assert.match(runtime, /register\("\/meydan-sw\.js"/);

  const worker = source("public/meydan-sw.js");
  assert.match(worker, /importScripts\("\/sw\.js"\)/);
  assert.match(worker, /addEventListener\("push"/);
  assert.match(worker, /registration\.showNotification/);
  assert.match(worker, /addEventListener\("notificationclick"/);
  assert.match(worker, /clients\.openWindow/);
});

test("pushes are collected in one نقش من notification box", () => {
  const worker = source("public/meydan-sw.js");
  assert.match(worker, /function notificationContent\(payload\)/);
  assert.match(worker, /showNotification\("نقش من"/);
  assert.match(worker, /const SUMMARY_TAG = "role-notifications"/);
  assert.match(worker, /registration\.getNotifications\(\{ tag: SUMMARY_TAG \}\)/);
  assert.match(worker, /MAX_SUMMARY_ENTRIES = 3/);
  assert.match(worker, /entries\.map\(\(item\) => item\.content\)\.join\("\\n\\n"\)/);
  assert.match(worker, /\[type, message\]\.filter\(Boolean\)\.join\("\\n"\)/);

  const transport = source("../meydan-backend/wp-content/plugins/meydan-core/src/Notifications/NativeWebPush.php");
  assert.match(transport, /'type' => mb_substr\(sanitize_text_field\(\$title\), 0, 160\)/);
  assert.match(transport, /'message' => mb_substr\(sanitize_textarea_field\(\$body\), 0, 700\)/);
  assert.match(transport, /'title' => 'نقش من'/);
});

test("browser enrollment uses PushManager and the WordPress push API", () => {
  const client = source("lib/web-push.ts");
  assert.match(client, /pushManager\.getSubscription\(\)/);
  assert.match(client, /pushManager\.subscribe\(/);
  assert.match(client, /applicationServerKey/);
  assert.match(client, /"\/push\/subscriptions"/);

  const enrollment = source("components/pwa/PushEnrollment.tsx");
  assert.match(enrollment, /enableWebPush/);
  assert.match(enrollment, /"\/push\/config"/);
  assert.match(enrollment, /پیام جدید/);
});

test("signed-out browsers invalidate the previous account push endpoint", () => {
  const cleanup = source("components/pwa/PushIdentityCleanup.tsx");
  assert.match(cleanup, /clearWebPushSubscription/);

  const authLayout = source("app/auth/layout.tsx");
  assert.match(authLayout, /PushIdentityCleanup/);
  assert.match(authLayout, /!authenticated\s*\?\s*<PushIdentityCleanup\s*\/>\s*:\s*null/);
});

test("no Pushe SDK or external Pushe worker remains", () => {
  assert.equal(existsSync(path.join(root, "lib/pushe-web.ts")), false);
  assert.equal(existsSync(path.join(root, "public/pushe-sw.js")), false);
  assert.doesNotMatch(
    source("components/pwa/PushEnrollment.tsx"),
    /lib\/pushe-web|initializePushe|rememberPusheAppId|static\.pushe\.co/i,
  );
  assert.doesNotMatch(source("public/meydan-sw.js"), /static\.pushe\.co|pusheweb/i);
});

test("offline fallback ships the Meydan font and a real offline icon", () => {
  const offline = source("public/offline.html");
  assert.match(offline, /@font-face\s*\{[^}]*font-family:\s*["']IRANSansXV["'][^}]*url\(["']\/fonts\/IRANSansXV\.woff2["']\)/s);
  assert.match(offline, /font-family:\s*["']IRANSansXV["']/);
  assert.match(offline, /<svg[^>]*data-offline-icon=["']wifi-off["']/);
  assert.doesNotMatch(offline, />⌁</);

  const worker = source("public/sw.js");
  assert.match(worker, /["']\/fonts\/IRANSansXV\.woff2["']/);
});

test("splash plays the theme-matched Lottie on every real document load and caches offline", () => {
  assert.equal(existsSync(path.join(root, "public/splash/splash-light.json")), true);
  assert.equal(existsSync(path.join(root, "public/splash/splash-dark.json")), true);

  const layout = source("app/layout.tsx");
  assert.match(layout, /id="meydan-splash"/);
  assert.match(layout, /<SplashScreen \/>/);

  const splash = source("components/pwa/SplashScreen.tsx");
  assert.match(splash, /readStoredTheme\(\) === "light" \? "\/splash\/splash-light\.json" : "\/splash\/splash-dark\.json"/);
  assert.match(splash, /renderer: "svg"/);

  // Showing it only on a real document load (not on in-app page navigation)
  // relies on the root layout never remounting for a client-side route
  // change, not on a "seen this tab/session already" flag — so a refresh
  // must play it again just like a brand new tab does.
  assert.doesNotMatch(layout, /sessionStorage/);
  assert.doesNotMatch(splash, /sessionStorage/);

  const worker = source("public/sw.js");
  assert.match(worker, /SPLASH_URLS = \["\/splash\/splash-light\.json", "\/splash\/splash-dark\.json"\]/);
  assert.match(worker, /SPLASH_URLS\.includes\(url\.pathname\)/);

  // The overlay is a React-rendered node (in app/layout.tsx): deleting it with
  // `.remove()` from outside React desyncs React's fiber tree from the real DOM
  // and crashes the next reconciliation (e.g. a client-side route change) with
  // a `removeChild` error. It must only ever be hidden, never removed.
  assert.doesNotMatch(layout, /getElementById\("meydan-splash"\)\?\.remove\(\)/);
  assert.doesNotMatch(splash, /root\?\.remove\(\)|root\.remove\(\)/);
  assert.match(splash, /root\.style\.display = "none"/);

  // Ends with a fade, not a hard cut: opacity/scale transition out first,
  // `display: none` only lands after that transition has had time to finish.
  assert.match(layout, /transition: "opacity 450ms ease, transform 450ms ease"/);
  assert.match(splash, /FADE_OUT_MS = 450/);
  assert.match(splash, /root\.style\.opacity = "0"/);
  assert.match(splash, /window\.setTimeout\(\(\) => \{\s*root\.style\.display = "none";\s*\}, FADE_OUT_MS\)/);
});

test("splash is mobile-only: hidden by CSS, never fetched or played on desktop", () => {
  const css = source("app/globals.css");
  assert.match(css, /@media \(min-width: 1024px\) \{\s*#meydan-splash \{\s*display: none !important;/);

  const layout = source("app/layout.tsx");
  assert.match(layout, /window\.matchMedia\(\\"\(min-width: 1024px\)\\"\)\.matches\) return;/);

  const splash = source("components/pwa/SplashScreen.tsx");
  assert.match(splash, /DESKTOP_QUERY = "\(min-width: 1024px\)"/);
  assert.match(splash, /if \(window\.matchMedia\(DESKTOP_QUERY\)\.matches\) return;/);
});

test("push permission prompt stays gone permanently after allow or close", () => {
  const enrollment = source("components/pwa/PushEnrollment.tsx");
  assert.match(enrollment, /PROMPT_HIDDEN_KEY\s*=\s*["']meydan-push-prompt-hidden["']/);
  assert.doesNotMatch(enrollment, /DISMISS_FOR_MS|dismissed-at/);
  assert.match(enrollment, /localStorage\.getItem\(PROMPT_HIDDEN_KEY\)\s*===\s*["']1["']/);
  assert.match(enrollment, /localStorage\.setItem\(PROMPT_HIDDEN_KEY,\s*["']1["']\)/);
  assert.match(enrollment, /result\s*===\s*["']enabled["'][\s\S]*hidePromptPermanently\(\)/);
  assert.match(enrollment, /const dismiss = \(\) => \{[\s\S]*hidePromptPermanently\(\)/);
  assert.match(enrollment, /state === ["']enabling["']/);
});
