import assert from 'node:assert/strict';
import test from 'node:test';

import { getOfficialIntroTaglineLine } from './project-overview';

test('hides duplicate tagline when official intro matches tagline', () => {
  assert.equal(getOfficialIntroTaglineLine('把梦记下来', '把梦记下来'), null);
});

test('keeps tagline when it differs from official intro', () => {
  assert.equal(getOfficialIntroTaglineLine('官方介绍', '副标题'), '副标题');
});
