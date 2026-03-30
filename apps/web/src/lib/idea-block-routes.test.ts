import test from 'node:test';
import assert from 'node:assert/strict';

import { getIdeaBlockDetailCta, getIdeaBlockDetailPath, getIdeaBlocksIndexPath } from './idea-block-routes';

test('builds the detail path for an idea block slug', () => {
  assert.equal(getIdeaBlockDetailPath('record-dreams-and-share-them'), '/idea-blocks/record-dreams-and-share-them');
});

test('returns the idea block index path after delete', () => {
  assert.equal(getIdeaBlocksIndexPath(), '/idea-blocks');
});

test('returns the project detail CTA for an idea block', () => {
  assert.deepEqual(getIdeaBlockDetailCta('record-dreams-and-share-them'), {
    to: '/idea-blocks/record-dreams-and-share-them',
    label: '查看点子详情',
  });
});
