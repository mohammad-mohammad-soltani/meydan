import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (file) => readFileSync(path.join(root, file), 'utf8');

function loadTsModule(file, dependencies = {}) {
  const output = ts.transpileModule(source(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', output)(
    (name) => {
      if (Object.hasOwn(dependencies, name)) return dependencies[name];
      throw new Error(`Unexpected dependency ${name}`);
    },
    mod,
    mod.exports,
  );
  return mod.exports;
}

const bridge = loadTsModule('lib/native-bridge.ts');
const { persistNativeLogin } = loadTsModule('lib/native-auth-session.ts', {
  './native-bridge': bridge,
});

const TOKEN = 'ref_1234567890abcdefghijklmnopqrstuv';

function createHost(platform, onMessage) {
  const host = new EventTarget();
  host.NaghshmanNative = { platform, version: 1 };
  host.ReactNativeWebView = {
    postMessage(raw) { onMessage(host, JSON.parse(raw)); },
  };
  return host;
}

function acknowledge(host) {
  const event = new Event('naghshman:native-auth-state');
  Object.defineProperty(event, 'detail', { value: { authenticated: true } });
  host.dispatchEvent(event);
}

test('native login waits until SecureStore persistence is acknowledged', async () => {
  let posted;
  const host = createHost('android', (target, message) => {
    posted = message;
    queueMicrotask(() => acknowledge(target));
  });

  await persistNativeLogin(host, TOKEN);
  assert.deepEqual(posted, {
    source: 'naghshman-web', version: 1, type: 'persist-refresh', token: TOKEN,
  });
});

test('iOS native host uses the same credential acknowledgement', async () => {
  const host = createHost('ios', (target) => acknowledge(target));
  await persistNativeLogin(host, TOKEN);
});

test('a stale native authenticated flag cannot skip storing a new token', async () => {
  let writes = 0;
  const host = createHost('android', (target) => {
    writes++;
    acknowledge(target);
  });
  host.__naghshmanNativeAuthenticated = true;

  await persistNativeLogin(host, TOKEN);
  assert.equal(writes, 1);
});

test('native login rejects missing refresh credentials instead of navigating', async () => {
  const host = createHost('android', () => assert.fail('no token should be posted'));
  await assert.rejects(persistNativeLogin(host, undefined), /توکن نشست اپ/);
});

test('native login reports a native storage error', async () => {
  const host = createHost('android', (target) => {
    target.dispatchEvent(new Event('naghshman:native-auth-error'));
  });
  await assert.rejects(persistNativeLogin(host, TOKEN), /ذخیره نشست/);
});

test('web browsers do not require a native refresh credential', async () => {
  const host = new EventTarget();
  await persistNativeLogin(host, undefined);
});

test('OTP and registration await native persistence before navigation', () => {
  const page = source('app/auth/page.tsx');
  assert.match(page, /await persistNativeLogin\(window, refreshToken\)/);
  assert.match(page, /await completeLogin\(result\.refresh_token\)/);
  assert.match(page, /await completeLogin\(refreshToken\)/);
});
