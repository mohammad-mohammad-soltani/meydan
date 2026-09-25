import assert from 'node:assert/strict';
import test from 'node:test';

import { isNaghshmanNativeWindow, postNativeAction } from './native-bridge.ts';

test('posts a versioned action only from the Android native window', () => {
  const posted: string[] = [];
  const nativeWindow = {
    NaghshmanNative: { platform: 'android', version: 1 },
    ReactNativeWebView: { postMessage: (value: string) => posted.push(value) },
  };

  assert.equal(isNaghshmanNativeWindow(nativeWindow), true);
  assert.equal(postNativeAction(nativeWindow, { type: 'copy-link', url: 'https://naghshman.ir/post/1' }), true);
  assert.deepEqual(JSON.parse(posted[0]), {
    source: 'naghshman-web',
    version: 1,
    type: 'copy-link',
    url: 'https://naghshman.ir/post/1',
  });
});

test('does not expose native actions to a browser or invalid URL', () => {
  assert.equal(isNaghshmanNativeWindow({}), false);
  assert.equal(postNativeAction({}, { type: 'copy-link', url: 'https://naghshman.ir/post/1' }), false);
  assert.equal(postNativeAction({
    NaghshmanNative: { platform: 'android', version: 1 },
    ReactNativeWebView: { postMessage: () => undefined },
  }, { type: 'copy-link', url: 'javascript:alert(1)' }), false);
});
