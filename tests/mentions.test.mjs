import test from 'node:test';
import assert from 'node:assert/strict';
import { activeMentionToken, mentionHref, mentionPattern, normalizeMentionQuery, splitMentions } from '../features/mentions/mentions.ts';

test('a bare @ or a typed prefix opens the picker at the caret', () => {
  assert.deepEqual(activeMentionToken('@', 1), { start: 0, query: '' });
  assert.deepEqual(activeMentionToken('سلام @re', 8), { start: 5, query: 're' });
  assert.deepEqual(activeMentionToken('(@re', 4), { start: 1, query: 're' });
});

test('an email address or a finished word does not open the picker', () => {
  assert.equal(activeMentionToken('mail a@b', 8), null);
  assert.equal(activeMentionToken('سلام @reza بعد', 14), null);
  assert.equal(activeMentionToken('بدون منشن', 4), null);
});

test('persian digits and case are folded like the backend does', () => {
  assert.equal(normalizeMentionQuery('Reza۱۲'), 'reza12');
});

test('splitMentions marks handles and leaves emails and short handles alone', () => {
  assert.deepEqual(splitMentions('سلام @reza_s چطوری'), [
    { text: 'سلام ' },
    { text: '@reza_s', handle: 'reza_s' },
    { text: ' چطوری' },
  ]);
  assert.deepEqual(splitMentions('a@example.com @ab'), [{ text: 'a@example.com @ab' }]);
  assert.deepEqual(splitMentions('@admin و @ali', (h) => h !== 'admin'), [
    { text: '@admin و ' },
    { text: '@ali', handle: 'ali' },
  ]);
});

test('mentions link to the lower-cased profile address', () => {
  assert.equal(mentionHref('Reza_S'), '/reza_s');
  assert.equal('x @Ab_c y'.replace(mentionPattern(), (_m, lead, h) => `${lead}<${h}>`), 'x <Ab_c> y');
});
