import assert from 'node:assert/strict';
import test from 'node:test';

import { isNaghshmanNativeClient } from './native-client.ts';

test('recognizes only the Naghshman native Android user agent marker', () => {
  assert.equal(isNaghshmanNativeClient('Mozilla/5.0 NaghshmanNative/1'), true);
  assert.equal(isNaghshmanNativeClient('Mozilla/5.0 (Linux; Android 15)'), false);
  assert.equal(isNaghshmanNativeClient('NaghshmanNative/0'), false);
  assert.equal(isNaghshmanNativeClient(undefined), false);
});
