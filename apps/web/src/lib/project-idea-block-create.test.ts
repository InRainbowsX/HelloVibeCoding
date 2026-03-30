import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProjectIdeaBlockCreatePayload, createProjectIdeaBlockDraft } from './project-idea-block-create';

test('creates an empty draft for project-scoped idea block creation', () => {
  assert.deepEqual(createProjectIdeaBlockDraft(), {
    title: '',
    summary: '',
    blockType: 'FEATURE',
    tagsText: '',
    noveltyNote: '',
  });
});

test('builds a create payload and links it to the current project', () => {
  const payload = buildProjectIdeaBlockCreatePayload(
    {
      title: '把房间号当作多人开局入口',
      summary: '发个链接或房间号，就能把多人局快速拉起来。',
      blockType: 'FEATURE',
      tagsText: '联机, 房间号, 多人',
      noveltyNote: '把组织动作压到最低。',
    },
    { id: 'app-1', slug: 'board-game-collection' },
  );

  assert.equal(payload.title, '把房间号当作多人开局入口');
  assert.equal(payload.summary, '发个链接或房间号，就能把多人局快速拉起来。');
  assert.deepEqual(payload.tags, ['联机', '房间号', '多人']);
  assert.deepEqual(payload.sourceAppIds, ['app-1']);
  assert.equal(payload.noveltyNote, '把组织动作压到最低。');
  assert.equal(/^board-game-collection-idea-\d+$/.test(payload.slug), true);
});
