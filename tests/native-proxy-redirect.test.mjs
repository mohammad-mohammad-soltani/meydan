import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { NextRequest } from 'next/server.js';

const require = createRequire(import.meta.url);
function load(path) {
  const loadedModule = { exports: {} };
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(output, {
    module: loadedModule, exports: loadedModule.exports, URL, Headers, process,
    fetch: async () => new Response('{}', { status: 503 }),
    require(name) {
      if (name === '@/lib/meydan-api') return { getMeydanApiBaseUrl: () => 'https://backend.example' };
      if (name.startsWith('@/')) return load(name.slice(2) + '.ts');
      return require(name);
    },
  });
  return loadedModule.exports;
}
const { proxy } = load('proxy.ts');
const { sanitizeReturnTo } = load('lib/auth-navigation.ts');
function request(path, cookie = '', native = true) {
  return new NextRequest(`https://naghshman.ir${path}`, {
    headers: { 'user-agent': native ? 'Mozilla/5.0 NaghshmanNative/1' : 'Mozilla/5.0', cookie },
  });
}

test('native guests can render auth routes without a self redirect', async () => {
  for (const path of ['/auth', '/auth/', '/auth/reset', '/auth?returnTo=%2Fauth%3FreturnTo%3D%252Fauth']) {
    const response = await proxy(request(path));
    assert.equal(response.headers.get('location'), null, path);
    assert.equal(response.headers.get('x-middleware-next'), '1', path);
  }
});

test('native login stays available with an expired session and unavailable backend', async () => {
  const response = await proxy(request('/auth', 'meydan_access=expired; meydan_access_expires_at=1; meydan_refresh=expired'));
  assert.equal(response.headers.get('location'), null);
});

test('native guests still redirect once from protected pages to a usable login', async () => {
  const first = await proxy(request('/profile'));
  assert.equal(first.status, 307);
  assert.equal(first.headers.get('location'), 'https://naghshman.ir/auth?returnTo=%2Fprofile');
  const login = new URL(first.headers.get('location'));
  const second = await proxy(request(login.pathname + login.search));
  assert.equal(second.headers.get('location'), null);
});

test('ordinary browser guests retain public access and protected redirects', async () => {
  assert.equal((await proxy(request('/', '', false))).headers.get('location'), null);
  assert.equal((await proxy(request('/profile', '', false))).status, 307);
});

test('returnTo never sends a successful login back into an auth route', () => {
  for (const target of ['/auth', '/auth?returnTo=%2Fauth', '/auth/reset', '/%61uth']) {
    assert.equal(sanitizeReturnTo(target), '/profile');
  }
  assert.equal(sanitizeReturnTo('/square/123?tab=posts'), '/square/123?tab=posts');
  assert.equal(sanitizeReturnTo('//evil.example'), '/profile');
});
