import test from 'node:test';
import assert from 'node:assert/strict';

import type { DiscussionComment } from './api';
import { removeCommentFromDiscussions, updateCommentContentInDiscussions } from './discussion-comments';

type TestDiscussion = {
  id: string;
  replyCount?: number;
  commentCount?: number;
  comments: DiscussionComment[];
};

test('updates the target comment content inside discussions', () => {
  const discussions: TestDiscussion[] = [
    {
      id: 'discussion-1',
      replyCount: 2,
      comments: [
        { id: 'comment-1', authorName: 'A', content: '旧内容', createdAt: '2026-03-12T00:00:00Z' },
        { id: 'comment-2', authorName: 'B', content: '保持不变', createdAt: '2026-03-12T00:00:00Z' },
      ],
    },
  ];

  const next = updateCommentContentInDiscussions(discussions, 'comment-1', '新内容');

  assert.equal(next[0].comments[0].content, '新内容');
  assert.equal(next[0].comments[1].content, '保持不变');
  assert.equal(next[0].replyCount, 2);
});

test('removes the target comment and decrements discussion counters when present', () => {
  const discussions: TestDiscussion[] = [
    {
      id: 'discussion-1',
      replyCount: 2,
      commentCount: 2,
      comments: [
        { id: 'comment-1', authorName: 'A', content: '删掉我', createdAt: '2026-03-12T00:00:00Z' },
        { id: 'comment-2', authorName: 'B', content: '保留', createdAt: '2026-03-12T00:00:00Z' },
      ],
    },
  ];

  const next = removeCommentFromDiscussions(discussions, 'comment-1');

  assert.equal(next[0].comments.length, 1);
  assert.equal(next[0].comments[0].id, 'comment-2');
  assert.equal(next[0].replyCount, 1);
  assert.equal(next[0].commentCount, 1);
});
