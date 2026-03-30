type IncubationStatus = 'OPEN' | 'VALIDATING' | 'BUILDING' | 'ARCHIVED';

type IncubationEditSource = {
  title: string;
  oneLiner: string;
  status: string;
  tags?: string[];
};

export type IncubationEditDraft = {
  title: string;
  oneLiner: string;
  status: IncubationStatus;
  tagsText: string;
};

function normalizeStatus(value: string): IncubationStatus {
  if (value === 'OPEN' || value === 'VALIDATING' || value === 'BUILDING' || value === 'ARCHIVED') {
    return value;
  }
  return 'OPEN';
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

export function createIncubationEditDraft(incubation: IncubationEditSource): IncubationEditDraft {
  return {
    title: incubation.title,
    oneLiner: incubation.oneLiner,
    status: normalizeStatus(incubation.status),
    tagsText: (incubation.tags || []).join(', '),
  };
}

export function buildIncubationUpdatePayload(incubation: IncubationEditSource, draft: IncubationEditDraft) {
  const payload: {
    title?: string;
    oneLiner?: string;
    status?: IncubationStatus;
    tags?: string[];
  } = {};

  if (normalizeText(draft.title) !== incubation.title) payload.title = normalizeText(draft.title);
  if (normalizeText(draft.oneLiner) !== incubation.oneLiner) payload.oneLiner = normalizeText(draft.oneLiner);
  if (draft.status !== normalizeStatus(incubation.status)) payload.status = draft.status;

  const nextTags = normalizeTags(draft.tagsText);
  if (JSON.stringify(nextTags) !== JSON.stringify(incubation.tags || [])) payload.tags = nextTags;

  return payload;
}
