type IdeaBlockType = 'FORMULA' | 'FEATURE' | 'WORKFLOW' | 'CHANNEL';

export type ProjectIdeaBlockCreateDraft = {
  title: string;
  summary: string;
  blockType: IdeaBlockType;
  tagsText: string;
  noveltyNote: string;
};

export function createProjectIdeaBlockDraft(): ProjectIdeaBlockCreateDraft {
  return {
    title: '',
    summary: '',
    blockType: 'FEATURE',
    tagsText: '',
    noveltyNote: '',
  };
}

function normalizeText(value: string) {
  return value.trim();
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

function toIdeaBlockSlug(value: string, projectSlug: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return base || `${projectSlug}-idea-${Date.now()}`;
}

export function buildProjectIdeaBlockCreatePayload(
  draft: ProjectIdeaBlockCreateDraft,
  project: { id: string; slug: string },
) {
  const title = normalizeText(draft.title);
  const summary = normalizeText(draft.summary);

  return {
    slug: toIdeaBlockSlug(title, project.slug),
    title,
    summary,
    blockType: draft.blockType,
    tags: normalizeTags(draft.tagsText),
    noveltyNote: normalizeText(draft.noveltyNote) || null,
    sourceAppIds: [project.id],
  };
}

