import test from 'node:test';
import assert from 'node:assert/strict';

import { computeResearchScore } from './research-score';

test('gives a conservative baseline score to low-signal projects', () => {
  const score = computeResearchScore({
    heatScore: 0,
    discussionCount: 0,
    ideaBlockCount: 0,
    incubationCount: 0,
    roomCount: 0,
  });

  assert.equal(score, 6);
});

test('raises the score when discussions and idea output are both present', () => {
  const score = computeResearchScore({
    heatScore: 59,
    discussionCount: 1,
    ideaBlockCount: 1,
    incubationCount: 0,
    roomCount: 0,
  });

  assert.equal(score, 7.3);
});

test('caps the score at ten for extremely strong research signals', () => {
  const score = computeResearchScore({
    heatScore: 240,
    discussionCount: 16,
    ideaBlockCount: 8,
    incubationCount: 4,
    roomCount: 4,
  });

  assert.equal(score, 10);
});
