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
  assert.doesNotMatch(source("components/pwa/PushEnrollment.tsx"), /Pushe|pushe/i);
  assert.doesNotMatch(source("public/meydan-sw.js"), /static\.pushe\.co|pusheweb/i);
});
