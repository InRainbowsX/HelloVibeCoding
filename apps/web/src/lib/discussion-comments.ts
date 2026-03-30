import type { DiscussionComment } from './api';

type DiscussionWithComments = {
  comments: DiscussionComment[];
  replyCount?: number;
  commentCount?: number;
};

export function updateCommentContentInDiscussions<T extends DiscussionWithComments>(discussions: T[], commentId: string, content: string): T[] {
  return discussions.map((discussion) => ({
    ...discussion,
    comments: discussion.comments.map((comment) =>
      comment.id === commentId
        ? {
            ...comment,
            content,
          }
        : comment,
    ),
  }));
}

export function removeCommentFromDiscussions<T extends DiscussionWithComments>(discussions: T[], commentId: string): T[] {
  return discussions.map((discussion) => {
    const hadComment = discussion.comments.some((comment) => comment.id === commentId);
    if (!hadComment) return discussion;

    return {
      ...discussion,
      comments: discussion.comments.filter((comment) => comment.id !== commentId),
      ...(typeof discussion.replyCount === 'number' ? { replyCount: Math.max(0, discussion.replyCount - 1) } : {}),
      ...(typeof discussion.commentCount === 'number' ? { commentCount: Math.max(0, discussion.commentCount - 1) } : {}),
    };
  });
}
