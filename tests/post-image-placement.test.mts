import assert from 'node:assert/strict';
import { test } from 'node:test';
import { splitAfterFirstParagraph } from '../src/lib/post-content.ts';

test('cover follows the complete first paragraph, preserving remaining text', () => {
  assert.deepEqual(splitAfterFirstParagraph('First line\ncontinued.\n\n**Second** paragraph.\n\nThird.'), {
    first: 'First line\ncontinued.', rest: '**Second** paragraph.\n\nThird.',
  });
});
test('a leading heading stays with the first paragraph', () => {
  assert.deepEqual(splitAfterFirstParagraph('# Title\r\n\r\nFirst.\r\n\r\nSecond.'), {first: '# Title\n\nFirst.', rest: 'Second.'});
});
test('single paragraph and empty notes do not duplicate content', () => {
  assert.deepEqual(splitAfterFirstParagraph('Only paragraph.'), {first: 'Only paragraph.', rest: ''});
  assert.deepEqual(splitAfterFirstParagraph(''), {first: '', rest: ''});
});
