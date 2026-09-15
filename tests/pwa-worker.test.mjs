import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

async function loadPusheWeb() {
  const file = path.join(root, "lib/pushe-web.ts");
  assert.ok(existsSync(file), "lib/pushe-web.ts must exist");
  return import(`${pathToFileURL(file).href}?push-cleanup=${Date.now()}`);
}

test("a logged-out browser drops the previous account custom id", async () => {
  const previousWindow = globalThis.window;
  const storage = new Map();
  const calls = [];

  globalThis.window = {
    localStorage: {
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key),
    },
    Pushe: {
      init: (appId) => calls.push(["init", appId]),
      subscribe: () => undefined,
      setCustomId: async (customId) => {
        calls.push(["custom-id", customId]);
        return true;
      },
    },
  };

  try {
    const pushe = await loadPusheWeb();
    assert.equal(typeof pushe.rememberPusheAppId, "function", "the public app id must be remembered while signed in");
    assert.equal(typeof pushe.clearPusheIdentity, "function", "logout needs a reusable push cleanup helper");

    pushe.rememberPusheAppId("web-app-test");
    await pushe.clearPusheIdentity();

    assert.deepEqual(calls, [
      ["init", "web-app-test"],
      ["custom-id", null],
    ]);
    assert.equal(storage.has(pushe.PUSHE_APP_ID_STORAGE_KEY), false, "cleanup removes the remembered app id after success");
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test("authenticated enrollment remembers the app id and the auth page clears stale push identity", () => {
  assert.match(source("components/pwa/PushEnrollment.tsx"), /rememberPusheAppId\(value\.app_id\)/);

  const authLayout = source("app/auth/layout.tsx");
  assert.match(authLayout, /PushIdentityCleanup/);
  assert.match(authLayout, /!authenticated\s*\?\s*<PushIdentityCleanup\s*\/>\s*:\s*null/);
});
