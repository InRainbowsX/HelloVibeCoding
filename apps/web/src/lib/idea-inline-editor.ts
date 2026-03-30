type IdeaBlockType = 'FORMULA' | 'FEATURE' | 'WORKFLOW' | 'CHANNEL';

type IdeaBlockEditSource = {
  title: string;
  summary: string;
  blockType: string;
  tags: string[];
  noveltyNote?: string | null;
};

export type IdeaBlockEditDraft = {
  title: string;
  summary: string;
  blockType: IdeaBlockType;
  tagsText: string;
  noveltyNote: string;
};

export function createIdeaBlockEditDraft(block: IdeaBlockEditSource): IdeaBlockEditDraft {
  return {
    title: block.title,
    summary: block.summary,
    blockType: normalizeBlockType(block.blockType),
    tagsText: block.tags.join(', '),
    noveltyNote: block.noveltyNote ?? '',
  };
}

function normalizeText(value: string) {
  return value.trim();
}

function normalizeBlockType(value: string): IdeaBlockType {
  if (value === 'FORMULA' || value === 'FEATURE' || value === 'WORKFLOW' || value === 'CHANNEL') {
    return value;
  }
  return 'FEATURE';
}

function normalizeTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[,\n，]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function buildIdeaBlockUpdatePayload(block: IdeaBlockEditSource, draft: IdeaBlockEditDraft) {
  const payload: {
    title?: string;
    summary?: string;
    blockType?: IdeaBlockType;
    tags?: string[];
    noveltyNote?: string | null;
  } = {};

  if (normalizeText(draft.title) !== block.title) payload.title = normalizeText(draft.title);
  if (normalizeText(draft.summary) !== block.summary) payload.summary = normalizeText(draft.summary);
  if (draft.blockType !== normalizeBlockType(block.blockType)) payload.blockType = draft.blockType;

  const nextTags = normalizeTags(draft.tagsText);
  if (JSON.stringify(nextTags) !== JSON.stringify(block.tags)) payload.tags = nextTags;

  const nextNoveltyNote = normalizeText(draft.noveltyNote);
  if (nextNoveltyNote !== (block.noveltyNote ?? '')) payload.noveltyNote = nextNoveltyNote || null;

  return payload;
}
