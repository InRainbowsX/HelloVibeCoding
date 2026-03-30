import test from 'node:test';
import assert from 'node:assert/strict';

import { buildIdeaBlockUpdatePayload, createIdeaBlockEditDraft } from './idea-inline-editor';

const baseIdeaBlock = {
  id: 'idea-1',
  slug: 'demo-idea',
  title: '原始点子',
  summary: '原始摘要',
  blockType: 'FEATURE',
  tags: ['社区', '随机'],
  noveltyNote: '原始亮点',
};

test('creates an inline draft from idea block fields', () => {
  const draft = createIdeaBlockEditDraft(baseIdeaBlock);

  assert.deepEqual(draft, {
    title: '原始点子',
    summary: '原始摘要',
    blockType: 'FEATURE',
    tagsText: '社区, 随机',
    noveltyNote: '原始亮点',
  });
});

test('builds a minimal update payload with only changed idea block fields', () => {
  const draft = {
    ...createIdeaBlockEditDraft(baseIdeaBlock),
    summary: '新的摘要',
    tagsText: '社区, 上头',
  };

  assert.deepEqual(buildIdeaBlockUpdatePayload(baseIdeaBlock, draft), {
    summary: '新的摘要',
    tags: ['社区', '上头'],
  });
});

test('normalizes empty novelty note to null when saving', () => {
  const draft = {
    ...createIdeaBlockEditDraft(baseIdeaBlock),
    noveltyNote: '   ',
  };

  assert.deepEqual(buildIdeaBlockUpdatePayload(baseIdeaBlock, draft), {
    noveltyNote: null,
  });
});
