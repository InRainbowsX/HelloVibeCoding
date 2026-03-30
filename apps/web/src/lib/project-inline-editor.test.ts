import test from 'node:test';
import assert from 'node:assert/strict';

import { buildProjectContentUpdatePayload, createProjectEditDraft } from './project-inline-editor';

const baseProject = {
  id: 'project-1',
  slug: 'demo-project',
  name: 'Demo Project',
  tagline: 'old tagline',
  category: '社区',
  pricing: 'FREE',
  overview: {
    saveTimeLabel: 'old summary',
    targetPersona: 'old audience',
    hookAngle: 'old hook',
  },
  heatScore: 82,
};

test('creates an inline draft from project detail fields', () => {
  const draft = createProjectEditDraft(baseProject);

  assert.deepEqual(draft, {
    name: 'Demo Project',
    tagline: 'old tagline',
    category: '社区',
    saveTimeLabel: 'old summary',
    targetPersona: 'old audience',
    hookAngle: 'old hook',
    researchScore: '8.2',
  });
});

test('builds a minimal update payload with only changed fields', () => {
  const draft = {
    ...createProjectEditDraft(baseProject),
    tagline: 'new tagline',
    hookAngle: 'new hook',
  };

  assert.deepEqual(buildProjectContentUpdatePayload(baseProject, draft), {
    tagline: 'new tagline',
    hookAngle: 'new hook',
  });
});

test('maps editable research score to heatScore payload', () => {
  const draft = {
    ...createProjectEditDraft(baseProject),
    researchScore: '7.4',
  };

  assert.deepEqual(buildProjectContentUpdatePayload(baseProject, draft), {
    heatScore: 74,
  });
});

test('normalizes empty tagline to null when saving', () => {
  const draft = {
    ...createProjectEditDraft(baseProject),
    tagline: '   ',
  };

  assert.deepEqual(buildProjectContentUpdatePayload(baseProject, draft), {
    tagline: null,
  });
});
