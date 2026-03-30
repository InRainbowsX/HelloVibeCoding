import test from 'node:test';
import assert from 'node:assert/strict';

import { getDiscussionEmptyStateCopy, getDiscussionSectionTitle } from './discussion-copy';

test('uses a short discussion section title', () => {
  assert.equal(getDiscussionSectionTitle(), '评论');
});

test('uses a short empty state for comments', () => {
  assert.equal(getDiscussionEmptyStateCopy(), '还没有评论。');
});
