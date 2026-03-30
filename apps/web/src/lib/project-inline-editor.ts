type ProjectEditSource = {
  name: string;
  tagline?: string | null;
  category: string;
  heatScore: number;
  overview: {
    saveTimeLabel: string;
    targetPersona: string;
    hookAngle: string;
  };
};

export type ProjectEditDraft = {
  name: string;
  tagline: string;
  category: string;
  saveTimeLabel: string;
  targetPersona: string;
  hookAngle: string;
  researchScore: string;
};

export function createProjectEditDraft(project: ProjectEditSource): ProjectEditDraft {
  return {
    name: project.name,
    tagline: project.tagline ?? '',
    category: project.category,
    saveTimeLabel: project.overview.saveTimeLabel,
    targetPersona: project.overview.targetPersona,
    hookAngle: project.overview.hookAngle,
    researchScore: (project.heatScore / 10).toFixed(1),
  };
}

function normalizeText(value: string) {
  return value.trim();
}

function normalizeResearchScore(value: string) {
  const parsed = Number(value.trim());
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(10, Math.round(parsed * 10) / 10));
}

export function buildProjectContentUpdatePayload(project: ProjectEditSource, draft: ProjectEditDraft) {
  const payload: {
    name?: string;
    tagline?: string | null;
    category?: string;
    saveTimeLabel?: string;
    targetPersona?: string;
    hookAngle?: string;
    heatScore?: number;
  } = {};

  if (normalizeText(draft.name) !== project.name) payload.name = normalizeText(draft.name);

  const originalTagline = project.tagline ?? '';
  const nextTagline = normalizeText(draft.tagline);
  if (nextTagline !== originalTagline) payload.tagline = nextTagline || null;

  if (normalizeText(draft.category) !== project.category) payload.category = normalizeText(draft.category);
  if (normalizeText(draft.saveTimeLabel) !== project.overview.saveTimeLabel) payload.saveTimeLabel = normalizeText(draft.saveTimeLabel);
  if (normalizeText(draft.targetPersona) !== project.overview.targetPersona) payload.targetPersona = normalizeText(draft.targetPersona);
  if (normalizeText(draft.hookAngle) !== project.overview.hookAngle) payload.hookAngle = normalizeText(draft.hookAngle);
  if (normalizeResearchScore(draft.researchScore) !== Number((project.heatScore / 10).toFixed(1))) {
    payload.heatScore = Math.round(normalizeResearchScore(draft.researchScore) * 10);
  }

  return payload;
}
