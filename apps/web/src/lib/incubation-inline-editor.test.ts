import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildIncubationUpdatePayload,
  createIncubationEditDraft,
  type IncubationEditDraft,
} from './incubation-inline-editor';

const baseIncubation = {
  id: 'inc-1',
  slug: 'demo-incubation',
  title: '原始方向',
  oneLiner: '原始一句话',
  status: 'OPEN' as const,
  tags: ['社区', '分享'],
};

test('creates an inline draft from incubation fields', () => {
  const draft = createIncubationEditDraft(baseIncubation);

  assert.deepEqual(draft, {
    title: '原始方向',
    oneLiner: '原始一句话',
    status: 'OPEN',
    tagsText: '社区, 分享',
  });
});

test('builds a minimal update payload with only changed incubation fields', () => {
  const draft: IncubationEditDraft = {
    ...createIncubationEditDraft(baseIncubation),
    oneLiner: '新的定位',
    status: 'VALIDATING',
  };

  assert.deepEqual(buildIncubationUpdatePayload(baseIncubation, draft), {
    oneLiner: '新的定位',
    status: 'VALIDATING',
  });
});

test('normalizes tag text into a deduplicated list', () => {
  const draft: IncubationEditDraft = {
    ...createIncubationEditDraft(baseIncubation),
    tagsText: '社区, 社区, 验证',
  };

  assert.deepEqual(buildIncubationUpdatePayload(baseIncubation, draft), {
    tags: ['社区', '验证'],
  });
});
